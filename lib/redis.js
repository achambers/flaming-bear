'use strict';

var Redis = function(grunt) {
  var redis = require('redis');
  var RSVP = require('rsvp');
  var client;

  var connect = function() {
    client = redis.createClient();

    client.on("error", function(error) {
      grunt.log.error("Redis Error:" + error);
    });

    return new RSVP.Promise(function(resolve, reject) {
      client.on("connect", function(){
        grunt.log.ok("Connected to redis");
        resolve();
      });
    });
  };

  var insert = function(key, data) {
    return new RSVP.Promise(function(resolve, reject) {
      client.set(key, data, function(error, response) {
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

  return {
    upload: function(key, data) {
      return connect().then(function() {
        return insert(key, data);
      });
    },

    quit: function() {
      client.quit();
    }
  }
};

module.exports = Redis;
