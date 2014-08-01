'use strict';

module.exports = function(grunt) {
  var done = this.async();

  var path = require('path');
  var redis = require('redis');
  var client = redis.createClient();
  var Q = require('q');
  var promises = [];
  var indexFilePath, fileExtension, fileName, fileContents;
  var key;

  var options = this.options({
    appName: 'my-app',
    distDir: 'dist'
  });

  client.on("ready", function(){
    grunt.log.debug("Connected to redis");
  });

  client.on("error", function(error) {
    grunt.log.error("Redis Error:" + error);
  });

  if (!grunt.file.exists(options.distDir)) {
    grunt.fail.warn('Specified dist directory does not exist: [' + options.distDir + ']');
  }

  indexFilePath = options.distDir + '/index.html';

  if (!grunt.file.exists(indexFilePath)) {
    grunt.fail.warn('index.html does not exist at: [' + indexFilePath + ']');
  }

  fileExtension = path.extname(indexFilePath);
  fileName = path.basename(indexFilePath, fileExtension);
  var key = options.appName + ':' + fileName + ':' + '8888';

  fileContents = grunt.file.read(indexFilePath);

  Q.ninvoke(client, 'set', key, fileContents).then(function() {
    grunt.log.ok("File uploaded:" + key);
  }, function(error) {
    grunt.log.error("Error uploading: " + error);
  }).finally(function() {
    client.quit();
    done();
  });
};
