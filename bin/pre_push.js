'use strict';

const git = require('simple-git/promise')();

const checkForSourceChanges = () => {
  return git.diffSummary('origin/master', 'master')
    .then(diff => {
      console.log(diff);
      return diff.files.find(change => change.file.match(/^src\/js/));
    });
};

checkForSourceChanges()
  .then(sourceChanged => {
    console.log(sourceChanged);
    if (sourceChanged) {
      console.log(
        '\n' +
        'This push includes an update to the source files, so an asset ' +
        'rebuild is required.\n' +
        'Please rebuild the assets and commit them manually, or run ' +
        '\'npm run pushassets\' to run the automatic build and push script.' +
        '\n'
      );
    }
  })
  .catch(error => {
    console.log(error);
    process.exit(1);
  });
