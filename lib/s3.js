'use strict';

var S3 = function(grunt) {
  var RSVP = require('rsvp');
  var path = require('path');
  var s3 = require('s3');
  var s3Client = s3.createClient({
    s3Options: {
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.ACCESS_KEY_SECRET
    }
  });
  var params = {
    localDir: 'dist/assets',
    deleteRemoved: false,
    s3Params: {
      Bucket: 'flaming-bear',
      Prefix: 'assets'
    },
    getS3Params: function(localFile, stat, callback) {
      var filename = path.basename(localFile);
      var s3Params = {};

      if (/^\./.test(filename)) {
        s3Params = null;
      }

      callback(null, s3Params);
    }
  };

  return {
    upload: function() {
      var uploader = s3Client.uploadDir(params);
      uploader.on('error', function(err) {
        grunt.log.error('Unable to sync with s3: ' + err.stack);
        reject(err);
      });

      uploader.on('progress', function() {
        grunt.log.ok('Progress: ' + uploader.progressAmount + '/' + uploader.progressTotal);
      });

      return new RSVP.Promise(function(resolve, reject) {
        uploader.on('end', function() {
          grunt.log.ok('Finished uploading to s3');
          resolve();
        });
      });
    }
  }
};

module.exports = S3;
