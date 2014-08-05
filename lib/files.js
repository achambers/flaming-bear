'use strict';

function manifestId(manifestFilePath) {
  var manifestRegex = /.*\/manifest-([0-9a-f]+)\.json/;
  return manifestRegex.exec(manifestFilePath)[1];
}

var Files = function(grunt, options) {
  var distDir;
  var indexFilePath;
  var manifestFilePath;

  distDir = grunt.config('distDir') || 'dist';

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
      path: manifestFilePath,
      manifestId: manifestId(manifestFilePath)
    }
  }
};

module.exports = Files;
