'use strict';

const Utils = require('./utils');

const Settings = {};

Settings.get = settingName => {
  const setting = Settings.settings[settingName];
  let rawSettingValue = localStorage.getItem(settingName);

  if (setting.getURLValue === undefined) {
    setting.getURLValue = function () {
      return Utils.urlParameter(settingName);
    };
  }

  if (setting.getURLValue && setting.getURLValue != false) {
    const urlValue = setting.getURLValue();
    if (urlValue) {
      rawSettingValue = urlValue;
    }
  }

  if (rawSettingValue === undefined || rawSettingValue === null) {
    return setting.defaultValue;
  }

  if (setting.type == 'boolean') {
    return rawSettingValue == 'true';
  } else if (setting.type == 'float') {
    return parseFloat(rawSettingValue);
  } else if (setting.type == 'json') {
    return JSON.parse(rawSettingValue);
  }

  return rawSettingValue;
};

Settings.set = (settingName, value) => {
  const setting = Settings.settings[settingName];

  setting.getURLValue = false;

  if (setting.type == 'json') {
    localStorage.setItem(settingName, JSON.stringify(value));
  } else {
    localStorage.setItem(settingName, value);
  }
};

Settings.settings = {
  showGyms: {
    type: 'boolean',
    defaultValue: true
  },
  showPokestops: {
    type: 'boolean',
    defaultValue: false
  },
  showPortals: {
    type: 'boolean',
    defaultValue: false
  },
  showParks: {
    type: 'boolean',
    defaultValue: false
  },
  highlightNewFeatures: {
    type: 'boolean',
    defaultValue: false
  },
  exGymsOnly: {
    type: 'boolean',
    defaultValue: false
  },
  s2Cells: {
    type: 'json',
    defaultValue: []
  },
  s2CellColors: {
    type: 'json',
    defaultValue: {
      '1': '#FF6F00',
      '2': '#F57F17',
      '3': '#827717',
      '4': '#33691E',
      '5': '#1B5E20',
      '6': '#004D40',
      '7': '#006064',
      '8': '#01579B',
      '9': '#0D47A1',
      '10': '#1A237E',
      '11': '#6A1B9A',
      '12': '#AD1457',
      '13': '#b71c1c',
      '14': '#BF360C',
      '15': '#FF7043',
      '16': '#FFCA28',
      '17': '#FDD835',
      '18': '#00796B',
      '19': '#0288D1',
      '20': '#64B5F6'
    }
  },
  mapCenter: {
    type: 'json',
    defaultValue: {
      lat: 52.63282,
      lng: 1.29732
    }
  },
  zoomLevel: {
    type: 'float',
    defaultValue: 13
  },
  discordToken: {
    type: 'json',
    defaultValue: {}
  },
  user: {
    type: 'json',
    defaultValue: {}
  }
};

module.exports = Settings;
