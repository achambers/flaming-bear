'use strict';

module.exports = function(grunt) {
  var done = this.async();
  var defaultOptions = {
    appName: 'my-app',
    distDir: 'dist'
  };
  var options = this.options(defaultOptions);

  var files = require('./files')(grunt, options);
  var key = redisKey(files.manifestFile.path, options.appName);
  var indexFileContents = files.indexFile.contents;

  var redisClient = require('./redis')(grunt);
  var s3Client = require('./s3')(grunt);

  redisClient.upload(key, indexFileContents)
  .then(s3Client.upload)
  .finally(function() {
    redisClient.quit();
    done();
  });
};

function redisKey(manifestFilePath, appName) {
  var manifestRegex = /.*\/manifest-([0-9a-f]+)\.json/;
  var manifestId = manifestRegex.exec(manifestFilePath)[1];
  return appName + ':index:' + manifestId;
}
