'use strict';

/**
 * Modified from https://stackoverflow.com/questions/19491336 .
 */
const urlParameter = parameterName => {
  const parameterString = decodeURIComponent(window.location.search.substring(1));
  const parameters = parameterString.split('&');

  let parameterValue;
  $.each(parameters, (index, param) => {
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

const coordinateToLatLng = coord =>
  new google.maps.LatLng(coord[0], coord[1]);

const dateToString = date => {
  function pad(n) {
    return (n < 10) ? '0' + n : n;
  }

  return pad(date.getFullYear()) + '-' +
         pad(date.getMonth()) + '-' +
         pad(date.getDate());
};

/**
 * Taken from https://stackoverflow.com/questions/5999998 .
 */
const isFunction = functionToCheck => 
  (functionToCheck &&
    ({}.toString.call(functionToCheck) === '[object Function]'))
;

const coordsFromString = str => {
  if (!str) return;

  const coordStrs = str.split(',');
  if (!coordStrs || !(coordStrs.length === 2)) return;

  const coords = $.map(coordStrs, coordStr => parseFloat(coordStr));

  if (((coords[0] != 0) && !coords[0]) ||
      ((coords[1] != 0) && !coords[1])) {
    return;
  }

  return coords;
};

module.exports = {
  urlParameter: urlParameter,
  isMobile: isMobile,
  coordinateToLatLng: coordinateToLatLng,
  dateToString: dateToString,
  isFunction: isFunction,
  coordsFromString: coordsFromString
};
