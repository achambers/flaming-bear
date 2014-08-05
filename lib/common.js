'use strict';

module.exports = function(grunt) {
  var pkg = grunt.file.readJSON('package.json');
  var appUrl = pkg.url;
  var distDir = grunt.config.get('distDir') || 'dist';

  return {
    appUrl: appUrl,
    distDir: distDir
  }
};
