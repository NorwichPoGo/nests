'use strict';

const git = require('simple-git/promise')();
const automaticBuild = require('./automatic_build');

const isSourceFile = filename => {
  const isGruntfile = filename == 'Gruntfile.js';
  const isSourceFile = filename.match(/^src\/js/);
  return isGruntfile || isSourceFile;
};

const checkForSourceChanges = () => {
  return git.diffSummary('origin/master', 'master')
    .then(diff => {
      console.log(diff);
      return diff.files.find(change => isSourceFile(change.file));
    });
};

const checkForStagedFiles = () => {
  return git.status()
    .then(status => {
      return status.staged.length > 0;
    });
};

const checkForUncommittedChanges = () => {
  return git.status()
    .then(status => {
      return status.files.find(file => isSourceFile(file.path));
    });
};

checkForSourceChanges()
  .then(sourceChanged => {
    if (!sourceChanged) return;

    return checkForStagedFiles()
      .then(stagedFiles => {
        if (stagedFiles) {
          throw new Error(
            'Can\'t perform an automatic build. ' +
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
        return automaticBuild();
      });
  })
  .catch(error => {
    console.log(error);
    process.exit(1);
  });
