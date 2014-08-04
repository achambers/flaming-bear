'use strict';

module.exports = function(grunt) {
  var done = this.async();
  var redisClient;
  var manifestId;
  var baseTaskName;
  var baseTaskConfig;
  var options;

  manifestId = grunt.option('manifest-id');
  if(!manifestId) {
    var taskString = this.nameArgs;
    grunt.log.error('manifest-id must be supplied, eg: \n grunt ' + taskString + ' --manifest-id=abc123');
  }

  baseTaskName = this.name;
  baseTaskConfig = grunt.config.get(baseTaskName);
  if (!baseTaskConfig.redis) {
    baseTaskConfig.redis = {};
  }

  options = baseTaskConfig;

  redisClient = require('./redis')(grunt, options);

  redisClient.retrieve(manifestId)
  .then(function(data) {
    var key = currentKey(manifestId);
    return redisClient.upload(key, data);
  })
  .catch(function(error) {
    grunt.log.error(error);
  })
  .finally(function() {
    redisClient.quit();
    done();
  });
};

function currentKey(manifestId) {
  var arr = manifestId.split(":").slice(0,2);
  arr.push('current');
  return arr.join(':');
};
