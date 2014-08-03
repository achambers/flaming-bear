'use strict';

module.exports = function(fileList, grunt) {
  var files = {
    index: null,
    manifest: null,
    assets: []
  };

  fileList.forEach(function(file) {
    file.src.filter(function(filepath) {
      if (!grunt.file.exists(filepath)) {
        grunt.log.warn('Source file "' + filepath + '" not found.');
        return false;
      }
      else {
        return true;
      }
    }).forEach(function(filepath) {
      if (grunt.file.isMatch('**/*/index.html', filepath)) {
        files['index'] = filepath;
      }
      if (grunt.file.isMatch('**/assets/**/*.*', filepath)) {
        files['assets'].push(filepath);
      }
      if (grunt.file.isMatch('**/assets/**/manifest-*.json', filepath)) {
        files['manifest'] = filepath;
      }
    });
  });

  if (!files.index) {
    grunt.log.warn('index.html file not found.');
  }

  if (!files.manifest) {
    grunt.log.warn('manifest file not found.');
  }

  if (files.assets.length === 0) {
    grunt.log.warn('asset files not found.');
  }

  return files;
};
