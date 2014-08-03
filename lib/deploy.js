'use strict';

module.exports = function(grunt) {
  var done = this.async();

  var redis = require('redis');
  var client = redis.createClient();
  var Q = require('q');
  var indexFileContents;
  var key;
  var manifestId;
  var manifestRegex = /.*\/manifest-([0-9a-f]+)\.json/;

  var files = {
    index: null,
    manifest: null,
    assets: []
  };

  var options = this.options({
    appName: 'my-app'
  });

  this.files.forEach(function(file) {
    file.src.filter(function(filepath) {
      if (!grunt.file.exists(filepath)) {
        grunt.log.warn('Source file "' + filepath + '" not found.');
        return false;
      }
      else {
        return true;
      }
    }).forEach(function(filepath) {
      if (grunt.file.isMatch('**/*/index.html', filepath)) {
        files['index'] = filepath;
      }
      if (grunt.file.isMatch('**/assets/**/*.*', filepath)) {
        files['assets'].push(filepath);
      }
      if (grunt.file.isMatch('**/assets/**/manifest-*.json', filepath)) {
        files['manifest'] = filepath;
      }
    });
  });

  if (!files.index) {
    grunt.log.warn('index.html file not found.');
  }

  if (!files.manifest) {
    grunt.log.warn('manifest file not found.');
  }

  if (files.assets.length === 0) {
    grunt.log.warn('asset files not found.');
  }

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
