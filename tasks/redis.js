'use strict';

module.exports = function(grunt) {
  var common = require('../lib/common')(grunt);
  var files = require('../lib/files')(grunt);
  var redis = require('redis');
  var RSVP = require('rsvp');
  var files;
  var client;

  grunt.registerTask('release:promote-index', function() {
    var done = this.async();
    var key = grunt.option('manifest-id');

    if (!key) {
      grunt.fail.fatal('manifest-id must be specified');
    }

    connect()
    .then(function() {
      return get(key);
    })
    .then(function(data) {
      var currentKey = currentRedisKey();
      return set(currentKey, data);
    })
    .then(function() {
      logPromoted(key);
    })
    .catch(function(error) {
      grunt.log.error('Error occured when promoting [' + key + ']: ' + error);
    })
    .finally(function() {
      client.quit();
      grunt.log.ok('Disconnected from redis');
      done();
    });
  });

  grunt.registerTask('release:publish-index', function() {
    var done = this.async();
    var data = files.indexFile.contents;
    var key = manifestRedisKey();

    connect()
    .then(function() {
      return set(key, data);
    })
    .then(function() {
      logPublished(key);
    }, function(error) {
      grunt.fail.fatal("Error uploading: " + error);
    })
    .finally(function() {
      client.quit();
      grunt.log.ok('Disconnected from redis');
      done();
    });
  });

  function redisOptions(grunt) {
    var defaultRedisOptions = {
      host: '127.0.01',
      port: '6379',
      password: null
    };

    var redisOptions = grunt.config('redis.options');

    for (var option in defaultRedisOptions) {
      if (!redisOptions.hasOwnProperty(option)) {
        redisOptions[option] = defaultRedisOptions[option];
      }
    }

    return redisOptions;
  };

  function connect(options) {
    var options = redisOptions(grunt);
    client = redis.createClient(options.port, options.host, {
      auth_pass: options.password
    });

    client.on("error", function(error) {
      grunt.fail.fatal("Redis Error:" + error);
    });

    return new RSVP.Promise(function(resolve, reject) {
      client.on("connect", function(){
        grunt.log.ok("Connected to redis");
        resolve();
      });
    });
  };

  function manifestRedisKey() {
    var manifestId = files.manifestFile.manifestId;
    return redisKey(manifestId);
  };

  function currentRedisKey() {
    return redisKey('current');
  };

  function redisKey(id) {
    var parts = [];
    var appName = common.appName;
    if (appName) {
      parts.push(appName);
    }
    parts.push('index');
    parts.push(id);

    return parts.join(':');
  };

  function get(key) {
    return new RSVP.Promise(function(resolve, reject) {
      client.get(key, function(error, data) {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
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

  function logPublished(key) {
    var appUrl = common.appUrl || 'http://<your-app-url>';

    grunt.log.ok("File uploaded [" + key + "]");

    grunt.log.subhead('To access this release, visit:');
    grunt.log.writeln(appUrl + '?manifest-id=' + files.manifestFile.manifestId);

    grunt.log.subhead('To promote this release, run:');
    grunt.log.writeln('grunt release:promote-index --manifest-id=' + key);
    grunt.log.writeln('');
  };

  function logPromoted(key) {
    var appUrl = common.appUrl || 'http://<your-app-url>';

    grunt.log.ok("File promoted [" + key + "]");

    grunt.log.subhead('To access this release, visit:');
    grunt.log.writeln(appUrl);
    grunt.log.writeln('');
  };
};
