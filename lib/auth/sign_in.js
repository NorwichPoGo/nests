const Settings = require('../settings');
const AuthUtils = require('./utils');

const clientId = '468459411007078400';
const appId = 'AKfycby3tLs26ufCxJX6LaUaGNUfi4RsGAqlIOMQX8_reYJu2v59Voj9';
const appURL = `https://script.google.com/macros/s/${appId}/exec`;

const getNewToken = () => {
  window.location.href = `${AuthUtils.DISCORD_API_URL}/oauth2/authorize` + 
    '?response_type=code' +
    `&client_id=${clientId}` +
    `&redirect_uri=${appURL}` +
    '&scope=identify' +
    `&state=${location.protocol}//${location.host}/sign_in/token`;
};

const refreshToken = refreshToken => {
  const refreshTokenParam = `refreshToken=${refreshToken}`;
  const request = $.getJSON(`${appURL}?${refreshTokenParam}`);

  return Promise.resolve(request)
    .then(response => {
      if (!response || !response.accessToken) {
        throw new Error('Could not retrieve a new token');
      }

      Settings.set('discordToken', {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        tokenType: response.tokenType,
        expiresIn: response.expiresIn,
        scope: response.scope,
        retrievedAt: Date.now()
      });
    });
};

$(() => {
  const discordToken = Settings.get('discordToken');

  if (discordToken && discordToken.accessToken) {
    if (AuthUtils.hasTokenExpired(discordToken) &&
        discordToken.refreshToken) {
      refreshToken(discordToken.refreshToken)
        .then(() => 
          AuthUtils.getUserProfile()
        )
        .then(() => {
          window.location.href = '/';
        })
        .catch(err => {
          console.error(err);
          window.location.href = '/';
        });
    } else {
      window.location.href = '/';
    }
  } else {
    getNewToken();
  }
});
