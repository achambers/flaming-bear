'use strict';

module.exports = function(grunt) {
  var common = require('../lib/common')(grunt);
  var files = require('../lib/files')(grunt);
  var path = require('path');
  var s3 = require('s3');
  var redis = require('redis');
  var RSVP = require('rsvp');
  var files;
  var redisClient;

  grunt.registerTask('release:promote-index', function() {
    var done = this.async();
    var manifestId = grunt.option('manifest-id');
    var key = 'index';

    if (!manifestId) {
      grunt.fail.fatal('manifest-id must be specified');
    }

    key = key + ':' + manifestId;

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
      redisClient.quit();
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
      redisClient.quit();
      grunt.log.ok('Disconnected from redis');
      done();
    });
  });

  grunt.registerTask('release:publish-assets', function() {
    var done = this.async();

    var distDir = grunt.config.get('distDir') || 'dist';
    var name = this.name;
    var options;
    var s3Client;
    var uploadParams;

    grunt.config.requires('s3.options.accessKeyId');
    grunt.config.requires('s3.options.accessKeySecret');
    grunt.config.requires('s3.options.bucket');

    options = grunt.config('s3.options');

    s3Client = s3.createClient({
      s3Options: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.accessKeySecret
      }
    });

    uploadParams = {
      localDir: distDir + '/assets',
      deleteRemoved: false,
      s3Params: {
        Bucket: options.bucket,
        Prefix: 'assets',
        ACL: 'public-read'
      },
      getS3Params: function(localFile, stat, callback) {
        var filename = path.basename(localFile);
        var s3Params = {};

        if (isHiddenFile(filename)) {
          s3Params = null;
        }

        callback(null, s3Params);
      }
    };

    var uploader = s3Client.uploadDir(uploadParams);
    uploader.on('error', function(error) {
      grunt.fail.fatal('Unable to sync with s3: ' + error.stack);
      done();
    });

    uploader.on('progress', function() {
      grunt.log.ok('Progress: ' + uploader.progressAmount + '/' + uploader.progressTotal);
    });

    uploader.on('end', function() {
      grunt.log.ok('Finished uploading to s3');

      grunt.log.subhead('To publish the index.html, run:');
      grunt.log.write('grunt release:publish-index');
      console.log('');

      done();
    });
  });

  function isHiddenFile(path) {
    return /^\./.test(path);
  };

  function redisOptions(grunt) {
    var defaultRedisOptions = {
      host: '127.0.01',
      port: '6379',
      password: null
    };

    var redisOptions;

    if (grunt.config('redis') && grunt.config('redis.options')) {
      redisOptions = grunt.config('redis.options');
    } else {
      redisOptions = {};
    }

    for (var option in defaultRedisOptions) {
      if (!redisOptions.hasOwnProperty(option)) {
        redisOptions[option] = defaultRedisOptions[option];
      }
    }

    return redisOptions;
  };

  function connect(options) {
    var options = redisOptions(grunt);
    redisClient = redis.createClient(options.port, options.host, {
      auth_pass: options.password
    });

    redisClient.on("error", function(error) {
      grunt.fail.fatal("Redis Error:" + error);
    });

    return new RSVP.Promise(function(resolve, reject) {
      redisClient.on("connect", function(){
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
    return 'index:' + id;
  };

  function get(key) {
    return new RSVP.Promise(function(resolve, reject) {
      redisClient.get(key, function(error, data) {
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
      redisClient.set(key, data, function(error, response) {
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
    var manifestId = files.manifestFile.manifestId;

    grunt.log.ok("File uploaded [" + key + "]");

    grunt.log.subhead('To access this release, visit:');
    grunt.log.writeln(appUrl + '?manifest-id=' + manifestId);

    grunt.log.subhead('To promote this release, run:');
    grunt.log.writeln('grunt release:promote-index --manifest-id=' + manifestId);
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
