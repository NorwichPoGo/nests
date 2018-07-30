'use strict';

const Settings = require('../settings');
const Utils = require('../utils');
const AuthUtils = require('./utils');

$(() => {
  const accessToken = Utils.urlParameter('accessToken');

  if (accessToken) {
    Settings.set('discordToken', {
      accessToken: accessToken,
      refreshToken: Utils.urlParameter('refreshToken'),
      tokenType: Utils.urlParameter('tokenType'),
      expiresIn: Utils.urlParameter('expiresIn'),
      scope: Utils.urlParameter('scope'),
      retrievedAt: Date.now()
    });

    AuthUtils.getUserProfile()
      .then(() => {
        window.location.href = '/';
      })
      .catch(err => {
        console.error(err);
        window.location.href = '/';
      });
  }
});
