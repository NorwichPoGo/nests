'use strict';

const git = require('simple-git/promise')();
const grunt = require('grunt');

const buildCommitAndPushAssets = () => {
  require('../Gruntfile')(grunt);

  grunt.tasks('build', {}, () => {
    Promise.resolve()
      .then(() => {
        return git.add('assets/js');
      })
      .then(() => {
        return git.commit('Automatic asset rebuild.');
      })
      .then(() => {
        return git.push('origin', 'master');
      });
  });
};

if (require.main === module) {
  buildCommitAndPushAssets();
}

module.exports = buildCommitAndPushAssets;
