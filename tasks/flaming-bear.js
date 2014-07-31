'use strict';

module.exports = function(grunt) {
  grunt.registerMultiTask('flaming-bear', function() {
    if (this.target === 'deploy') {
      var deploy = require('../lib/deploy');
      deploy.call(this, grunt);
    } else {
      grunt.log.warn('Target not expected:', this.target);
    }
  });
};
