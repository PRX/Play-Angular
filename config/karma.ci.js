module.exports = (config) => {
  'use strict';

  config.set({
    autoWatch: false,
    basePath: './..',
    browsers: ['PhantomJS'],
    colors: true,
    concurrency: Infinity,
    logLevel: config.LOG_INFO,
    port: 9876,
    reporters: ['progress'],
    exclude: [],
    preprocessors: {},

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],
    // frameworks: ['jspm', 'jasmine'],

    // jspm: {
    //   config: "config/systemjs.config.js",
    //   useBundles: true,
    //   loadFiles: ['src/app/**/*.spec.ts'],
    //   serveFiles: [
    //     'src/app/**/*!(*.spec).ts',
    //     'src/app/**/*.css',
    //     'tsconfig.json'
    //   ]
    // },

    proxies: {
      '/.ci/': '/base/.ci/',
      '/src/': '/base/src/',
      '/config/': '/base/config/',
      '/jspm_packages/': '/base/jspm_packages/',
      '/tsconfig.json': '/base/tsconfig.json'
    },

    files: []
  });
};
