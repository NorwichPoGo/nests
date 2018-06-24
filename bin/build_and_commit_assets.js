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

const buildAndCommitAssets = () => {
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
        checkForStagedFiles()
          .then(stagedFiles => {
            if (!stagedFiles) return;

            return git.add('assets/js')
              .then(() => {
                return git.commit('Automatic asset rebuild.');
              })
              .catch(error => {
                console.log(error);
                process.exit(1);
              });
          });
      });
    })
    .catch(error => {
      console.log(error);
      process.exit(1);
    });
};

buildAndCommitAssets();
