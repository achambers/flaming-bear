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

function currentRedisKey() {
  var parts = [];
  var appName = common.appName;
  if (appName) {
    parts.push(appName);
  }
  parts.push('index');
  parts.push('current');

  return parts.join(':');
};

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

module.exports = function(grunt) {
  grunt.registerTask('release:promote-index', function() {
    common = require('../lib/common')(grunt);

    var done = this.async();
    var options = redisOptions(grunt);
    var key = grunt.option('manifest-id');

    if (!key) {
      grunt.fail.fatal('manifest-id must be specified');
    }

    client = redis.createClient(options.port, options.host, {
      auth_pass: options.password
    });

    client.on("error", function(error) {
      grunt.fail.fatal("Redis Error:" + error);
    });

    client.on("connect", function(){
      grunt.log.ok("Connected to redis");
    });

    get(key)
    .then(function(data) {
      var currentKey = currentRedisKey();
      return set(currentKey, data);
    })
    .then(function() {
      grunt.log.ok("File promoted [" + key + "]");

      var appUrl = common.appUrl || 'http://<your-app-url>';

      grunt.log.subhead('To access this release, visit:');
      grunt.log.writeln(appUrl);
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
    common = require('../lib/common')(grunt);
    files = require('../lib/files')(grunt);

    var done = this.async();

    var options = redisOptions(grunt);

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

      var appUrl = common.appUrl || 'http://<your-app-url>';

      grunt.log.subhead('To access this release, visit:');
      grunt.log.writeln(appUrl + '?manifest-id=' + files.manifestFile.manifestId);

      grunt.log.subhead('To promote this release, run:');
      grunt.log.writeln('grunt release:promote-index --manifest-id=' + key);
      grunt.log.writeln('');
    }, function(error) {
      grunt.fail.fatal("Error uploading: " + error);
    })
    .finally(function() {
      client.quit();
      grunt.log.ok('Disconnected from redis');
      done();
    });
  });
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
