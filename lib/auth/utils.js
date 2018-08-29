const Settings = require('../settings');

const DISCORD_API_URL = 'https://discordapp.com/api';

const getUserProfile = () => {
  const discordToken = Settings.get('discordToken');
  const tokenType = discordToken.tokenType || 'Bearer';

  const request = $.ajax({
    url: `${DISCORD_API_URL}/users/@me`,
    dataType: 'json',
    headers: {
      'Authorization': `${tokenType} ${discordToken.accessToken}`
    }
  });

  return Promise.resolve(request)
    .then(response => {
      if (!response || !response.id) {
        throw new Error('Could not retrieve user\'s profile');
      }

      Settings.set('user', {
        id: response.id,
        username: response.username,
        avatar: response.avatar
      });
    });
};

const hasTokenExpired = discordToken => {
  const startTime = discordToken.retrievedAt;
  const duration = discordToken.expiresIn;

  if (!startTime || !duration) {
    return true;
  }

  return (startTime + (duration * 1000)) < Date.now();
};

module.exports = {
  DISCORD_API_URL: DISCORD_API_URL,
  getUserProfile: getUserProfile,
  hasTokenExpired: hasTokenExpired
};
