'use strict';

module.exports = function(grunt) {
  var done = this.async();
  var defaultOptions = {
    distDir: 'dist',
    s3: {},
    redis: {}
  };
  var options = this.options(defaultOptions);
  var baseTaskName = this.name;
  var appName = grunt.config(baseTaskName).appName;

  var files = require('./files')(grunt, options);
  var key = redisKey(files.manifestFile.path, appName);
  var indexFileContents = files.indexFile.contents;

  var baseTaskName = this.name;
  var baseTaskConfig = grunt.config.get(baseTaskName);
  if (!baseTaskConfig.redis) {
    baseTaskConfig.redis = {};
  }

  var redisClient = require('./redis')(grunt, baseTaskConfig);
  var s3Client = require('./s3')(grunt, options);

  redisClient.upload(key, indexFileContents)
  .then(s3Client.upload)
  .then(function() {
    grunt.log.ok('grunt ' + baseTaskName + ':promote --manifest-id=' + key);
    return RSVP.Promise.resolve();
  })
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
