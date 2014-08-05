'use strict';

var redis = require('redis');
var RSVP = require('rsvp');
var common, files;
var client;

function redisKey() {
  var parts = [];
  var appName = common.appName;
  var manifestId = files.manifestFile.manifestId;
  if (appName) {
    parts.push(appName);
  }
  parts.push('index');
  parts.push(manifestId);

  return parts.join(':');
};

module.exports = function(grunt) {
  grunt.registerTask('release:publish-index', ['redis']);

  grunt.registerTask('redis', function() {
    common = require('../lib/common')(grunt);
    files = require('../lib/files')(grunt);

    var done = this.async();

    var options = this.options({
      host: '127.0.01',
      port: '6379',
      password: null
    });

    var data = files.indexFile.contents;
    var key = redisKey();

    client = redis.createClient(options.port, options.host, {
      auth_pass: options.password
    });

    client.on("error", function(error) {
      grunt.fail.fatal("Redis Error:" + error);
    });

    client.on("connect", function(){
      grunt.log.ok("Connected to redis");
    });

    set(key, data)
    .then(function() {
      grunt.log.ok("File uploaded [" + key + "]");
      grunt.log.ok('grunt release:promote-index --manifest-id=' + key);
    }, function(error) {
      grunt.fail.fatal("Error uploading: " + error);
    })
    .finally(function() {
      client.quit();
      done();
    });
  });
};

function set(key, data) {
  return new RSVP.Promise(function(resolve, reject) {
    client.set(key, data, function(error, response) {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};
