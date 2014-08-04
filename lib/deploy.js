'use strict';

var redis = require('redis');
var redisClient;
var RSVP = require('rsvp');

module.exports = function(grunt) {
  var done = this.async();

  var retrieveFiles = require('./files');
  var options = this.options({
    appName: 'my-app'
  });
  var files = retrieveFiles(this.files, grunt);
  var key = redisKey(files, options);
  var indexFileContents = grunt.file.read(files.index);

  redisClient = redis.createClient();

  redisClient.on("ready", function(){
    grunt.log.debug("Connected to redis");
  });

  redisClient.on("error", function(error) {
    grunt.log.error("Redis Error:" + error);
  });

  insertIntoRedis(key, indexFileContents, grunt).finally(function() {
    redisClient.quit();
    done();
  });
};

function insertIntoRedis(key, data, grunt) {
  return new RSVP.Promise(function(resolve, reject) {
    redisClient.set(key, data, function(error, response) {
      if (error) {
        grunt.log.error("Error uploading: " + error);
        reject(error);
      } else {
        grunt.log.ok("File uploaded [" + key + "]");
        resolve(response);
      }
    });
  });
};

function redisKey(files, options) {
  var appName = options.appName;
  var manifestRegex = /.*\/manifest-([0-9a-f]+)\.json/;
  var manifestId = manifestRegex.exec(files.manifest)[1];
  return appName + ':index:' + manifestId;
}
