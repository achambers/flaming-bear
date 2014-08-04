'use strict';

module.exports = function(grunt) {
  grunt.registerMultiTask('flaming-bear', function() {
    var name = this.name;
    this.requiresConfig(name + '.appName');

    if (this.target === 'deploy') {
      var deploy = require('../lib/deploy');
      deploy.call(this, grunt);
    } else {
      grunt.log.warn('Target not expected:', this.target);
    }
  });
};
