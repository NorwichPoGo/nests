'use strict';

/**
 * Modified from https://stackoverflow.com/questions/19491336 .
 */
const urlParameter = parameterName => {
  const parameterString = decodeURIComponent(window.location.search.substring(1));
  const parameters = parameterString.split('&');

  let parameterValue;
  $.each(parameters, function (index, param) {
    const paramParts = param.split('=');
    const paramName = paramParts[0];
    const paramValue = paramParts[1];

    if ((paramName == parameterName)
        && (paramValue !== undefined)) {
      parameterValue = paramValue;
      return false;
    }
  });

  return parameterValue;
};

const isMobile = () => {
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(navigator.userAgent);
};

const coordinateToLatLng = coord => {
  return new google.maps.LatLng(coord[0], coord[1]);
};

const dateToString = date => {
  function pad(n) {
    return (n < 10) ? '0' + n : n;
  }

  return pad(date.getFullYear()) + '-' +
         pad(date.getMonth()) + '-' +
         pad(date.getDate());
};

module.exports = {
  urlParameter: urlParameter,
  isMobile: isMobile,
  coordinateToLatLng: coordinateToLatLng,
  dateToString: dateToString
};
