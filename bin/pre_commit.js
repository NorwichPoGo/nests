'use strict';

const git = require('simple-git/promise')();

const checkForSourceChanges = () => {
  return git.diffSummary('--cached', '--name-only', 'HEAD')
    .then(diff => {
      return diff.files.find(change => change.file.match(/^src\/js/));
    });
};

checkForSourceChanges()
  .then(sourceChanged => {
    if (!sourceChanged) return;

    console.log(
      '\n' +
      'This commit includes an update to the source files, so an asset ' +
      'rebuild is required.\n' +
      'Please rebuild the assets and commit them manually, or run ' +
      '\'npm run commitassets\' to run the automatic build and commit script.' +
      '\n'
    );
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
