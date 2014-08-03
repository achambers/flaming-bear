'use strict';

module.exports = function(grunt) {
  var done = this.async();

  var retrieveFiles = require('./files');
  var redis = require('redis');
  var client = redis.createClient();
  var Q = require('q');
  var indexFileContents;
  var key;
  var manifestId;
  var manifestRegex = /.*\/manifest-([0-9a-f]+)\.json/;
  var options = this.options({
    appName: 'my-app'
  });
  var files = retrieveFiles(this.files, grunt);

  client.on("ready", function(){
    grunt.log.debug("Connected to redis");
  });

  client.on("error", function(error) {
    grunt.log.error("Redis Error:" + error);
  });

  manifestId = manifestRegex.exec(files.manifest)[1];
  indexFileContents = grunt.file.read(files.index);
  key = options.appName + ':index:' + manifestId;

  Q.ninvoke(client, 'set', key, indexFileContents).then(function() {
    grunt.log.ok("File uploaded [" + key + "]");
  }, function(error) {
    grunt.log.error("Error uploading: " + error);
  }).finally(function() {
    client.quit();
    done();
  });
};
