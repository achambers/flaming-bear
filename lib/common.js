'use strict';

module.exports = function(grunt) {
  var pkg = grunt.file.readJSON('package.json');
  var appName = pkg.name;

  return {
    appName: appName
  }
};
