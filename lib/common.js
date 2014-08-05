'use strict';

module.exports = function(grunt) {
  var pkg = grunt.file.readJSON('package.json');
  var appName = pkg.name;
  var appUrl = pkg.url;

  return {
    appName: appName,
    appUrl: appUrl
  }
};
