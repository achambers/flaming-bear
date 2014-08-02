'use strict';

module.exports = function(grunt) {
  var done = this.async();

  var path = require('path');
  var redis = require('redis');
  var client = redis.createClient();
  var Q = require('q');
  var promises = [];
  var indexFilePath, fileExtension, fileName, fileContents;
  var key, assetsDir;
  var assets = [];

  var options = this.options({
    appName: 'my-app',
    distDir: 'dist'
  });

  var distDir = options.distDir;

  client.on("ready", function(){
    grunt.log.debug("Connected to redis");
  });

  client.on("error", function(error) {
    grunt.log.error("Redis Error:" + error);
  });

  if (!grunt.file.exists(distDir)) {
    grunt.fail.warn('Specified dist directory does not exist: [' + distDir + ']');
  }

  assetsDir = distDir + '/assets';

  if (!grunt.file.exists(assetsDir)) {
    grunt.fail.warn('assets directory does not exist: [' + assetsDir + ']');
  }

  grunt.file.recurse(assetsDir, function(absolutePath, rootDir, subDir, filename) {
    if (!isHiddenFile(filename)) {
      console.log(absolutePath);
    }
  });


  indexFilePath = distDir + '/index.html';

  if (!grunt.file.exists(indexFilePath)) {
    grunt.fail.warn('index.html does not exist at: [' + indexFilePath + ']');
  }

  fileExtension = path.extname(indexFilePath);
  fileName = path.basename(indexFilePath, fileExtension);
  var key = options.appName + ':' + fileName + ':' + '8888';

  fileContents = grunt.file.read(indexFilePath);

  Q.ninvoke(client, 'set', key, fileContents).then(function() {
    grunt.log.ok("File uploaded:" + key);
  }, function(error) {
    grunt.log.error("Error uploading: " + error);
  }).finally(function() {
    client.quit();
    done();
  });
};

function isHiddenFile(filename) {
  var regex = new RegExp(/^\./);
  return regex.test(filename);
}
