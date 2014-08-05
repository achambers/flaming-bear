'use strict';

module.exports = function(grunt) {
  var pkg = grunt.file.readJSON('package.json');
  var appUrl = pkg.url;

  return {
    appUrl: appUrl
  }
};
