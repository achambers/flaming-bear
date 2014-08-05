'use strict';


module.exports = function(grunt) {
  var path = require('path');
  var s3 = require('s3');
  var client;
  var uploadParams;

  grunt.registerTask('release:publish-assets', function() {
    var done = this.async();

    var distDir = grunt.config.get('distDir') || 'dist';
    var name = this.name;
    var options;

    grunt.config.requires('s3.options.accessKeyId');
    grunt.config.requires('s3.options.accessKeySecret');
    grunt.config.requires('s3.options.bucket');

    options = grunt.config('s3.options');

    client = s3.createClient({
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

    var uploader = client.uploadDir(uploadParams);
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
};
