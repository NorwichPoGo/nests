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
         pad(date.getMonth() + 1) + '-' +
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

const BASE_URL = location.protocol + '//' + location.host + location.pathname;

const NESTING_SPECIES = [
  1,4,7,10,13,16,19,21,23,25,27,29,32,35,37,39,41,43,46,48,50,52,54,56,58,60,
  63,66,69,72,74,77,79,81,84,86,90,92,95,96,98,100,102,104,111,116,118,120,123,
  124,125,126,127,129,133,138,140,152,155,158,161,163,165,167,170,177,183,187,
  190,191,193,194,200,202,203,206,209,211,213,215,216,218,220,223,228,252,255,
  258,261,263,265,273,276,278,283,285,293,296,299,300,304,307,309,316,318,320,
  322,325,333,339,341,343,353,355,363,370
];

module.exports = {
  urlParameter: urlParameter,
  isMobile: isMobile,
  coordinateToLatLng: coordinateToLatLng,
  dateToString: dateToString,
  isFunction: isFunction,
  coordsFromString: coordsFromString,
  BASE_URL: BASE_URL,
  NESTING_SPECIES: NESTING_SPECIES
};
