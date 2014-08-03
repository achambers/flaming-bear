'use strict';

module.exports = function(grunt) {
  var done = this.async();

  var Q = require('q');
  var retrieveFiles = require('./files');
  var options = this.options({
    appName: 'my-app'
  });
  var files = retrieveFiles(this.files, grunt);
  var key = redisKey(files, options);
  var indexFileContents = grunt.file.read(files.index);

  var redis = require('redis');
  var client = redis.createClient();

  client.on("ready", function(){
    grunt.log.debug("Connected to redis");
  });

  client.on("error", function(error) {
    grunt.log.error("Redis Error:" + error);
  });

  Q.ninvoke(client, 'set', key, indexFileContents).then(function() {
    grunt.log.ok("File uploaded [" + key + "]");
  }, function(error) {
    grunt.log.error("Error uploading: " + error);
  }).finally(function() {
    client.quit();
    done();
  });
};

function redisKey(files, options) {
  var appName = options.appName;
  var manifestRegex = /.*\/manifest-([0-9a-f]+)\.json/;
  var manifestId = manifestRegex.exec(files.manifest)[1];
  return appName + ':index:' + manifestId;
}
