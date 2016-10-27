module.exports = (config) => {
  'use strict';

  config.set({
    autoWatch: true,
    basePath: './..',
    browsers: ['Chrome'],
    colors: true,
    concurrency: Infinity,
    logLevel: config.LOG_INFO,
    port: 9876,
    reporters: ['spec'],
    exclude: [],
    preprocessors: {},

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jspm', 'jasmine'],

    jspm: {
      config: "config/systemjs.config.js",
      // useBundles: true,
      loadFiles: ['src/app/**/*.spec.ts'],
      serveFiles: [
        'src/app/**/*!(*.spec).ts',
        'src/app/**/*.css',
        'tsconfig.json'
      ]
    },

    proxies: {
      '/.dev/': '/base/.dev/',
      '/src/': '/base/src/',
      '/config/': '/base/config/',
      '/jspm_packages/': '/base/jspm_packages/',
      '/tsconfig.json': '/base/tsconfig.json'
    },

    // list of files / patterns to load in the browser
    files: [
      {pattern: 'src/stylesheets/**/*.*', watched: false, included: false, served: true},
      // {pattern: 'node_modules/angular2/bundles/angular2-polyfills.js', watched: false, included: false, served: true}
    ],
  })
}
