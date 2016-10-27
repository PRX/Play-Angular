'use strict';

const express   = require('express');
const http      = require('http');
const https     = require('https');
const pug       = require('pug');
const url       = require('url');
// const config    = require('./config');

const CONTENT_TYPE = 'Content-Type';
const TEXT_HTML = 'text/html';

const PORT = 3001;

const server = listen(PORT);

function listen(port) {
  const app = express();

  app.set('view engine', 'pug');
  app.set('views', './');

  app.get('/proxy', (req, res) => {
    let feedUrl = url.parse(decodeURIComponent(req.query.url));

    let requester = (feedUrl.protocol === 'http:' ? http : https);
    let proxyReq = requester.request(feedUrl.href, (proxyRes) => {
      proxyRes.setEncoding('utf8');

      proxyRes.on('data', (chunk) => res.write(chunk));
      proxyRes.on('close', () => res.end());
      proxyRes.on('end', () => res.end());
    }).on('error', (e) => {
      console.log(e.message);
      res.writeHead(500);
      res.end();
    });

    proxyReq.end();
  });

  app.use('/node_modules',  express.static('./node_modules'));
  app.use('/jspm_packages', express.static('./jspm_packages'));
  app.use('/config',        express.static('./config'));
  app.use('/.dev',          express.static('./.dev'));
  app.use('/stylesheets',   express.static('./src/stylesheets'));
  app.use('/images',        express.static('./src/images'));
  app.use('/app',           express.static('./src/app'));
  app.use('/src',           express.static('./src'));
  app.use('/tsconfig.json', express.static('./tsconfig.json'));

  // Return 404 for anything with a file extension
  app.use(function fileNotFound(req, res, next) {
    if (req.path.indexOf('.') > -1) {
      res.status(404).send(`${req.path} 404 Not found`);
    } else {
      next();
    }
  });

  app.get('*', (req, res) => res.render('./src/index'));

  return app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
  });
}
