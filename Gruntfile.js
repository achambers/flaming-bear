//var redis = require('redis');
//var url = require('url');
//var redisUrl = url.parse('redis://localhost:6379/0');
//var client = redis.createClient(redisUrl.port, redisUrl.hostname, { no_ready_check: true });
//var client = redis.createClient();

module.exports = function(grunt) {
  grunt.registerTask('default', 'Push something to redis', function() {
    console.log("CHEESE");
    //client.auth(redisUrl.auth.split(":")[1]);
    //client.on('connect', function() {
      //client.set('foo', 'bar');
    //})

    //client.end();
  });
};
