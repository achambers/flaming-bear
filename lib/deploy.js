module.exports = function(grunt) {
  var done = this.async();

  var path = require('path');
  var redis = require('redis');
  var client = redis.createClient();
  var Q = require('q');
  var promises = [];

  var options = this.options({
    appName: 'my-app'
  });

  client.on("ready", function(){
    grunt.log.debug("Connected to redis");
  });

  client.on("error", function(error) {
    grunt.log.error("Redis Error:" + error);
  });

  this.files.forEach(function(file) {
    file.src.filter(function(filePath) {
      if (!grunt.file.exists(filePath)) {
        grunt.log.warn('Source file "' + filePath + '" not found.');
        return false;
      } else {
        return true;
      }
    }).forEach(function(filePath) {
      var fileExtension = path.extname(filePath);
      var fileName = path.basename(filePath, fileExtension);
      var fileContents = grunt.file.read(filePath);
      var appName = options.appName;
      var key = appName + ':' + fileName + ':' + '34534543';

      promises.push(Q.ninvoke(client, 'set', key, fileContents).then(function() {
        grunt.log.debug("File uploaded:" + key);
      }));
    });
  });

  Q.all(promises).then(function() {
    grunt.log.ok("Success");
  }, function(error) {
    grunt.log.error("Error uploading: " + error);
  }).finally(function() {
    client.quit();
    done();
  });
};
