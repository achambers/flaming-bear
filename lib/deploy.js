'use strict';

module.exports = function(grunt) {
  var done = this.async();

  var retrieveFiles = require('./files');
  var options = this.options({
    appName: 'my-app'
  });
  var files = retrieveFiles(this.files, grunt);
  var key = redisKey(files, options);
  var indexFileContents = grunt.file.read(files.index);

  var redisClient = require('./redis')(grunt);
  var s3Client = require('./s3')(grunt);

  redisClient.upload(key, indexFileContents)
  .then(s3Client.upload)
  .finally(function() {
    redisClient.quit();
    done();
  });
};

function redisKey(files, options) {
  var appName = options.appName;
  var manifestRegex = /.*\/manifest-([0-9a-f]+)\.json/;
  var manifestId = manifestRegex.exec(files.manifest)[1];
  return appName + ':index:' + manifestId;
}
