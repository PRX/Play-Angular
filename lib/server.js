'use strict';
const express = require('express');
const proxy   = require('http-proxy-middleware');
const gzip    = require('connect-gzip-static');
const request = require('request');
const morgan  = require('morgan');
const url     = require('url');
const util    = require('./util');

// dev/dist mode
if (process.argv.length !== 3 || ['dev', 'dist'].indexOf(process.argv[2]) < 0) {
  console.log('Usage: node server.js [dev|dist]');
  process.exit(1);
}
let isDist = process.argv[2] === 'dist';
util.buildIndex(isDist); // throw compilation errors right away

let app = express();
let env = util.readEnv(isDist);
let port = parseInt(process.env.PORT || 4300);
app.use(morgan('combined', {
  skip: req => req.path === '/' || !util.isIndex(req.path)
}));

// proxy feed requests
let xmlMimes = [
  'application/rss+xml',
  'application/rdf+xml;q=0.8',
  'application/atom+xml;q=0.6',
  'application/xml;q=0.4',
  'text/xml;q=0.4',
].join(',');
let userAgent = 'play.prx.org feed proxy';
let proxyOpts = {timeout: 5000, headers: {'Accept': xmlMimes, 'User-Agent': userAgent}}
app.get('/proxy', (req, res, next) => {
  let parts = url.parse(req.query.url || '');
  if (parts.protocol && parts.host) {
    let proxyUrl = `${parts.protocol}//${parts.host}${parts.path || ''}`;
    console.log(`Getting: ${proxyUrl}`);
    request
      .get({url: proxyUrl, ...proxyOpts})
      .on('response', proxyRes => {
        console.log(`Proxy ${proxyRes.statusCode}: ${proxyUrl}`);
        proxyRes.headers['Cache-Control'] = 'public, max-age=30';
      })
      .on('error', err => {
        console.error(`Proxy error (${proxyUrl}):`, err);
        setTimeout(() => {
          if (!res.headersSent) {
            res.status(500).send('Something went terribly wrong');
          }
        }, 1);
      })
      .pipe(res);
  } else {
    console.error(`Proxy error: invalid url '${req.url}'`);
    res.status(400).send('Invalid proxy url');
  }
});

// render embeds with inline player markup, other paths without
app.get('/e', function sendEmbed(req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.setHeader('Strict-Transport-Security', 'max-age=43200');
  util.buildIndex(isDist, true).then(html => res.send(html));
});
app.use(function sendIndex(req, res, next) {
  if (util.isIndex(req.path)) {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('Strict-Transport-Security', 'max-age=43200');
    util.buildIndex(isDist).then(html => res.send(html));
  } else {
    next();
  }
});

// asset serving (static or ng serve'd)
if (isDist) {
  let serveStatic = gzip('dist');
  app.use(function serveAssets(req, res, next) {
    serveStatic(req, res, next);
  });
  app.use(function fileNotFound(req, res, next) {
    res.status(404).send('Not found');
  });
} else {
  util.ngServe(port + 1);
  app.use(proxy(`http://127.0.0.1:${port + 1}`, { changeOrigin: true, ws: true }));
}

// actual listening port
app.listen(port);
console.log('+---------------------------+');
console.log(`| express listening on ${port} |`);
console.log('+---------------------------+\n');
