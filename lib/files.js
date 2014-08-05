'use strict';

function manifestId(manifestFilePath) {
  var manifestRegex = /.*\/manifest-([0-9a-f]+)\.json/;
  return manifestRegex.exec(manifestFilePath)[1];
}

var Files = function(grunt, options) {
  var common = require('./common')(grunt);
  var distDir = common.distDir;
  var indexFilePath;
  var manifestFilePath;

  if (!grunt.file.exists(distDir)) {
    grunt.fail.fatal('dist dir specified [' + distDir + '] does not exist');
  }

  indexFilePath = distDir + '/index.html';

  if (!grunt.file.exists(indexFilePath)) {
    grunt.fail.fatal('index.html specified [' + indexFilePath + '] does not exist');
  }

  manifestFilePath = grunt.file.expand(distDir + '/assets/manifest-*.json')[0];

  if (!grunt.file.exists(manifestFilePath)) {
    grunt.fail.fatal('manifest file specified [' + manifestFilePath + '] does not exist');
  }

  return {
    indexFile: {
      path: indexFilePath,
      contents: grunt.file.read(indexFilePath)
    },
    manifestFile: {
      path: manifestFilePath,
      manifestId: manifestId(manifestFilePath)
    }
  }
};

module.exports = Files;
