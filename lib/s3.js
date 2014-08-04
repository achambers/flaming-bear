'use strict';

function isHiddenFile(path) {
  return /^\./.test(path);
};

var S3 = function(grunt, options) {
  var RSVP = require('rsvp');
  var path = require('path');
  var s3 = require('s3');
  var s3AccessKeyId = options.s3.accessKeyId;
  var s3AccessKeySecret = options.s3.accessKeySecret;
  var s3Bucket = options.s3.bucket;
  var s3LocalDir = options.distDir + '/assets';
  var s3Client;
  var uploadParams;

  if (!s3AccessKeyId) {
    grunt.log.error('S3 accessKeyId not specified');
  }

  if (!s3AccessKeySecret) {
    grunt.log.error('S3 accessKeySecret not specified');
  }

  if (!s3Bucket) {
    grunt.log.error('S3 bucket not specified');
  }

  s3Client = s3.createClient({
    s3Options: {
      accessKeyId: s3AccessKeyId,
      secretAccessKey: s3AccessKeySecret
    }
  });

  uploadParams = {
    localDir: s3LocalDir,
    deleteRemoved: false,
    s3Params: {
      Bucket: s3Bucket,
      Prefix: 'assets'
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

  return {
    upload: function() {
      var uploader = s3Client.uploadDir(uploadParams);
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
