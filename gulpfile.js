'use strict';

const gulp          = require('gulp');
const jspm          = require('gulp-jspm');
const karma         = require('karma').Server
const rename        = require('gulp-rename');
const run           = require('run-sequence');
const shell         = require('gulp-shell');
const sourcemaps    = require('gulp-sourcemaps');


// Public tasks (serial)
gulp.task('git:hooks:pre-commit', cb => run('jspm:unbundle', cb));

gulp.task('jspm:unbundle', shell.task([
  `(git diff --name-only --cached | grep config/systemjs.config.js > /dev/null &&
   (jspm unbundle; git add config/systemjs.config.js)) || true`
]));

// Utility tasks
const loc = ['#!/bin/sh', 'PATH="/usr/local/bin:$PATH"', 'npm run git:hooks:pre-commit'];
gulp.task('git:hooks:install', shell.task([
  `printf '${loc.join('\n')}' > ./.git/hooks/pre-commit`,
  'chmod +x ./.git/hooks/pre-commit'
]));
