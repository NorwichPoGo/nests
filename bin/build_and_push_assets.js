'use strict';

const git = require('simple-git/promise')();
const grunt = require('grunt');

const checkForStagedFiles = () => {
  return git.status()
    .then(status => {
      return status.staged.length > 0;
    });
};

const checkForUncommittedChanges = () => {
  return git.status()
    .then(status => {
      return status.files.find(file => file.path.match(/^src\/js/));
    });
};

const buildAndPushAssets = () => {
  checkForStagedFiles()
    .then(stagedFiles => {
      if (stagedFiles) {
        throw new Error(
          'Can\'t perform an automatic build as there are staged changes. ' +
          'Please commit or stash any staged files.'
        );
      }
    })
    .then(() => {
      return checkForUncommittedChanges();
    })
    .then(uncommittedChanges => {
      if (uncommittedChanges) {
        throw new Error(
          'Source files have been modified since the last commit. ' +
          'Please commit or stash any modified source files.'
        );
      }
    })
    .then(() => {
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
    })
    .catch(error => {
      console.log(error);
      process.exit(1);
    });
};

buildAndPushAssets();
