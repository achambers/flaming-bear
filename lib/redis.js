'use strict';

var Redis = function(grunt, options) {
  var redis = require('redis');
  var RSVP = require('rsvp');
  var client;
  var redisHost = options.redis.host || '127.0.0.1';
  var redisPort = options.redis.port || '6379';
  var redisPassword = options.redis.password || null;

  var connect = function() {
    client = redis.createClient(redisPort, redisHost, {
      auth_pass: redisPassword
    });

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

  var get = function(key) {
    return new RSVP.Promise(function(resolve, reject) {
      client.get(key, function(error, reply) {
        if (error) {
          grunt.log.error("Error retrieving [" + key + "]: " + error);
          reject(error);
        } else {
          grunt.log.ok("Record retrieved: [" + key + "]");
          resolve(reply);
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

    retrieve: function(key) {
      return connect().then(function() {
        return get(key);
      });
    },

    quit: function() {
      client.quit();
    }
  }
};

module.exports = Redis;
