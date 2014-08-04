'use strict';

var Files = function(grunt, options) {
  var distDir;
  var indexFilePath;
  var manifestFilePath;

  distDir = grunt.file.expand(options.distDir)[0];

  if (typeof distDir === 'undefined') {
    grunt.log.error('dist dir specified [' + distDir + '] does not exist');
  }

  indexFilePath = distDir + '/index.html';

  if (!grunt.file.exists(indexFilePath)) {
    grunt.log.error('index.html specified [' + indexFilePath + '] does not exist');
  }

  manifestFilePath = grunt.file.expand('dist/assets/manifest-*.json')[0];

  if (typeof manifestFilePath === 'undefined') {
    grunt.log.error('manifest file specified [' + manifestFilePath + '] does not exist');
  }

  return {
    indexFile: {
      path: indexFilePath,
      contents: grunt.file.read(indexFilePath)
    },
    manifestFile: {
      path: manifestFilePath
    }
  }
};

module.exports = Files;
