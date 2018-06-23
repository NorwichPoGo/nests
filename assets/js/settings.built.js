(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

window.Settings = {
  settings: {
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
    }
  },
  get: function get(settingName) {
    var setting = Settings.settings[settingName];
    var rawSettingValue = localStorage.getItem(settingName);

    if (setting.getURLValue === undefined) {
      setting.getURLValue = function () {
        return urlParameter(settingName);
      };
    }

    if (setting.getURLValue && setting.getURLValue != false) {
      var urlValue = setting.getURLValue();
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
  },
  set: function set(settingName, value) {
    var setting = Settings.settings[settingName];

    setting.getURLValue = false;

    if (setting.type == 'json') {
      localStorage.setItem(settingName, JSON.stringify(value));
    } else {
      localStorage.setItem(settingName, value);
    }
  }
};

/**
 * Modified from https://stackoverflow.com/questions/19491336 .
 */
function urlParameter(parameterName) {
  var parameterString = decodeURIComponent(window.location.search.substring(1));
  var parameters = parameterString.split('&');

  var parameterValue = void 0;
  $.each(parameters, function (index, param) {
    var paramParts = param.split('=');
    var paramName = paramParts[0];
    var paramValue = paramParts[1];

    if (paramName == parameterName && paramValue !== undefined) {
      parameterValue = paramValue;
      return false;
    }
  });

  return parameterValue;
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvc2V0dGluZ3MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTs7QUFFQSxPQUFPLFFBQVAsR0FBa0I7QUFDaEIsWUFBVTtBQUNSLGNBQVU7QUFDUixZQUFNLFNBREU7QUFFUixvQkFBYztBQUZOLEtBREY7QUFLUixtQkFBZTtBQUNiLFlBQU0sU0FETztBQUViLG9CQUFjO0FBRkQsS0FMUDtBQVNSLGlCQUFhO0FBQ1gsWUFBTSxTQURLO0FBRVgsb0JBQWM7QUFGSCxLQVRMO0FBYVIsZUFBVztBQUNULFlBQU0sU0FERztBQUVULG9CQUFjO0FBRkwsS0FiSDtBQWlCUiwwQkFBc0I7QUFDcEIsWUFBTSxTQURjO0FBRXBCLG9CQUFjO0FBRk0sS0FqQmQ7QUFxQlIsYUFBUztBQUNQLFlBQU0sTUFEQztBQUVQLG9CQUFjO0FBRlAsS0FyQkQ7QUF5QlIsa0JBQWM7QUFDWixZQUFNLE1BRE07QUFFWixvQkFBYztBQUNaLGFBQUssU0FETztBQUVaLGFBQUssU0FGTztBQUdaLGFBQUssU0FITztBQUlaLGFBQUssU0FKTztBQUtaLGFBQUssU0FMTztBQU1aLGFBQUssU0FOTztBQU9aLGFBQUssU0FQTztBQVFaLGFBQUssU0FSTztBQVNaLGFBQUssU0FUTztBQVVaLGNBQU0sU0FWTTtBQVdaLGNBQU0sU0FYTTtBQVlaLGNBQU0sU0FaTTtBQWFaLGNBQU0sU0FiTTtBQWNaLGNBQU0sU0FkTTtBQWVaLGNBQU0sU0FmTTtBQWdCWixjQUFNLFNBaEJNO0FBaUJaLGNBQU0sU0FqQk07QUFrQlosY0FBTSxTQWxCTTtBQW1CWixjQUFNLFNBbkJNO0FBb0JaLGNBQU07QUFwQk07QUFGRixLQXpCTjtBQWtEUixlQUFXO0FBQ1QsWUFBTSxNQURHO0FBRVQsb0JBQWM7QUFDWixhQUFLLFFBRE87QUFFWixhQUFLO0FBRk87QUFGTCxLQWxESDtBQXlEUixlQUFXO0FBQ1QsWUFBTSxPQURHO0FBRVQsb0JBQWM7QUFGTDtBQXpESCxHQURNO0FBK0RoQixPQUFLLGFBQVMsV0FBVCxFQUFzQjtBQUN6QixRQUFNLFVBQVUsU0FBUyxRQUFULENBQWtCLFdBQWxCLENBQWhCO0FBQ0EsUUFBSSxrQkFBa0IsYUFBYSxPQUFiLENBQXFCLFdBQXJCLENBQXRCOztBQUVBLFFBQUksUUFBUSxXQUFSLEtBQXdCLFNBQTVCLEVBQXVDO0FBQ3JDLGNBQVEsV0FBUixHQUFzQixZQUFZO0FBQ2hDLGVBQU8sYUFBYSxXQUFiLENBQVA7QUFDRCxPQUZEO0FBR0Q7O0FBRUQsUUFBSSxRQUFRLFdBQVIsSUFBdUIsUUFBUSxXQUFSLElBQXVCLEtBQWxELEVBQXlEO0FBQ3ZELFVBQU0sV0FBVyxRQUFRLFdBQVIsRUFBakI7QUFDQSxVQUFJLFFBQUosRUFBYztBQUNaLDBCQUFrQixRQUFsQjtBQUNEO0FBQ0Y7O0FBRUQsUUFBSSxvQkFBb0IsU0FBcEIsSUFBaUMsb0JBQW9CLElBQXpELEVBQStEO0FBQzdELGFBQU8sUUFBUSxZQUFmO0FBQ0Q7O0FBRUQsUUFBSSxRQUFRLElBQVIsSUFBZ0IsU0FBcEIsRUFBK0I7QUFDN0IsYUFBTyxtQkFBbUIsTUFBMUI7QUFDRCxLQUZELE1BRU8sSUFBSSxRQUFRLElBQVIsSUFBZ0IsT0FBcEIsRUFBNkI7QUFDbEMsYUFBTyxXQUFXLGVBQVgsQ0FBUDtBQUNELEtBRk0sTUFFQSxJQUFJLFFBQVEsSUFBUixJQUFnQixNQUFwQixFQUE0QjtBQUNqQyxhQUFPLEtBQUssS0FBTCxDQUFXLGVBQVgsQ0FBUDtBQUNEOztBQUVELFdBQU8sZUFBUDtBQUNELEdBN0ZlO0FBOEZoQixPQUFLLGFBQVUsV0FBVixFQUF1QixLQUF2QixFQUE4QjtBQUNqQyxRQUFNLFVBQVUsU0FBUyxRQUFULENBQWtCLFdBQWxCLENBQWhCOztBQUVBLFlBQVEsV0FBUixHQUFzQixLQUF0Qjs7QUFFQSxRQUFJLFFBQVEsSUFBUixJQUFnQixNQUFwQixFQUE0QjtBQUMxQixtQkFBYSxPQUFiLENBQXFCLFdBQXJCLEVBQWtDLEtBQUssU0FBTCxDQUFlLEtBQWYsQ0FBbEM7QUFDRCxLQUZELE1BRU87QUFDTCxtQkFBYSxPQUFiLENBQXFCLFdBQXJCLEVBQWtDLEtBQWxDO0FBQ0Q7QUFDRjtBQXhHZSxDQUFsQjs7QUEyR0E7OztBQUdBLFNBQVMsWUFBVCxDQUFzQixhQUF0QixFQUFxQztBQUNuQyxNQUFNLGtCQUFrQixtQkFBbUIsT0FBTyxRQUFQLENBQWdCLE1BQWhCLENBQXVCLFNBQXZCLENBQWlDLENBQWpDLENBQW5CLENBQXhCO0FBQ0EsTUFBTSxhQUFhLGdCQUFnQixLQUFoQixDQUFzQixHQUF0QixDQUFuQjs7QUFFQSxNQUFJLHVCQUFKO0FBQ0EsSUFBRSxJQUFGLENBQU8sVUFBUCxFQUFtQixVQUFVLEtBQVYsRUFBaUIsS0FBakIsRUFBd0I7QUFDekMsUUFBTSxhQUFhLE1BQU0sS0FBTixDQUFZLEdBQVosQ0FBbkI7QUFDQSxRQUFNLFlBQVksV0FBVyxDQUFYLENBQWxCO0FBQ0EsUUFBTSxhQUFhLFdBQVcsQ0FBWCxDQUFuQjs7QUFFQSxRQUFLLGFBQWEsYUFBZCxJQUNJLGVBQWUsU0FEdkIsRUFDbUM7QUFDakMsdUJBQWlCLFVBQWpCO0FBQ0EsYUFBTyxLQUFQO0FBQ0Q7QUFDRixHQVZEOztBQVlBLFNBQU8sY0FBUDtBQUNEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiJ3VzZSBzdHJpY3QnO1xuXG53aW5kb3cuU2V0dGluZ3MgPSB7XG4gIHNldHRpbmdzOiB7XG4gICAgc2hvd0d5bXM6IHtcbiAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgIGRlZmF1bHRWYWx1ZTogdHJ1ZVxuICAgIH0sXG4gICAgc2hvd1Bva2VzdG9wczoge1xuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgZGVmYXVsdFZhbHVlOiBmYWxzZVxuICAgIH0sXG4gICAgc2hvd1BvcnRhbHM6IHtcbiAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgIGRlZmF1bHRWYWx1ZTogZmFsc2VcbiAgICB9LFxuICAgIHNob3dQYXJrczoge1xuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgZGVmYXVsdFZhbHVlOiBmYWxzZVxuICAgIH0sXG4gICAgaGlnaGxpZ2h0TmV3RmVhdHVyZXM6IHtcbiAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgIGRlZmF1bHRWYWx1ZTogZmFsc2VcbiAgICB9LFxuICAgIHMyQ2VsbHM6IHtcbiAgICAgIHR5cGU6ICdqc29uJyxcbiAgICAgIGRlZmF1bHRWYWx1ZTogW11cbiAgICB9LFxuICAgIHMyQ2VsbENvbG9yczoge1xuICAgICAgdHlwZTogJ2pzb24nLFxuICAgICAgZGVmYXVsdFZhbHVlOiB7XG4gICAgICAgICcxJzogJyNGRjZGMDAnLFxuICAgICAgICAnMic6ICcjRjU3RjE3JyxcbiAgICAgICAgJzMnOiAnIzgyNzcxNycsXG4gICAgICAgICc0JzogJyMzMzY5MUUnLFxuICAgICAgICAnNSc6ICcjMUI1RTIwJyxcbiAgICAgICAgJzYnOiAnIzAwNEQ0MCcsXG4gICAgICAgICc3JzogJyMwMDYwNjQnLFxuICAgICAgICAnOCc6ICcjMDE1NzlCJyxcbiAgICAgICAgJzknOiAnIzBENDdBMScsXG4gICAgICAgICcxMCc6ICcjMUEyMzdFJyxcbiAgICAgICAgJzExJzogJyM2QTFCOUEnLFxuICAgICAgICAnMTInOiAnI0FEMTQ1NycsXG4gICAgICAgICcxMyc6ICcjYjcxYzFjJyxcbiAgICAgICAgJzE0JzogJyNCRjM2MEMnLFxuICAgICAgICAnMTUnOiAnI0ZGNzA0MycsXG4gICAgICAgICcxNic6ICcjRkZDQTI4JyxcbiAgICAgICAgJzE3JzogJyNGREQ4MzUnLFxuICAgICAgICAnMTgnOiAnIzAwNzk2QicsXG4gICAgICAgICcxOSc6ICcjMDI4OEQxJyxcbiAgICAgICAgJzIwJzogJyM2NEI1RjYnXG4gICAgICB9XG4gICAgfSxcbiAgICBtYXBDZW50ZXI6IHtcbiAgICAgIHR5cGU6ICdqc29uJyxcbiAgICAgIGRlZmF1bHRWYWx1ZToge1xuICAgICAgICBsYXQ6IDUyLjYzMjgyLFxuICAgICAgICBsbmc6IDEuMjk3MzJcbiAgICAgIH1cbiAgICB9LFxuICAgIHpvb21MZXZlbDoge1xuICAgICAgdHlwZTogJ2Zsb2F0JyxcbiAgICAgIGRlZmF1bHRWYWx1ZTogMTNcbiAgICB9XG4gIH0sXG4gIGdldDogZnVuY3Rpb24oc2V0dGluZ05hbWUpIHtcbiAgICBjb25zdCBzZXR0aW5nID0gU2V0dGluZ3Muc2V0dGluZ3Nbc2V0dGluZ05hbWVdO1xuICAgIGxldCByYXdTZXR0aW5nVmFsdWUgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShzZXR0aW5nTmFtZSk7XG5cbiAgICBpZiAoc2V0dGluZy5nZXRVUkxWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBzZXR0aW5nLmdldFVSTFZhbHVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdXJsUGFyYW1ldGVyKHNldHRpbmdOYW1lKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKHNldHRpbmcuZ2V0VVJMVmFsdWUgJiYgc2V0dGluZy5nZXRVUkxWYWx1ZSAhPSBmYWxzZSkge1xuICAgICAgY29uc3QgdXJsVmFsdWUgPSBzZXR0aW5nLmdldFVSTFZhbHVlKCk7XG4gICAgICBpZiAodXJsVmFsdWUpIHtcbiAgICAgICAgcmF3U2V0dGluZ1ZhbHVlID0gdXJsVmFsdWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHJhd1NldHRpbmdWYWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHJhd1NldHRpbmdWYWx1ZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHNldHRpbmcuZGVmYXVsdFZhbHVlO1xuICAgIH1cblxuICAgIGlmIChzZXR0aW5nLnR5cGUgPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICByZXR1cm4gcmF3U2V0dGluZ1ZhbHVlID09ICd0cnVlJztcbiAgICB9IGVsc2UgaWYgKHNldHRpbmcudHlwZSA9PSAnZmxvYXQnKSB7XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdChyYXdTZXR0aW5nVmFsdWUpO1xuICAgIH0gZWxzZSBpZiAoc2V0dGluZy50eXBlID09ICdqc29uJykge1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2UocmF3U2V0dGluZ1ZhbHVlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmF3U2V0dGluZ1ZhbHVlO1xuICB9LFxuICBzZXQ6IGZ1bmN0aW9uIChzZXR0aW5nTmFtZSwgdmFsdWUpIHtcbiAgICBjb25zdCBzZXR0aW5nID0gU2V0dGluZ3Muc2V0dGluZ3Nbc2V0dGluZ05hbWVdO1xuXG4gICAgc2V0dGluZy5nZXRVUkxWYWx1ZSA9IGZhbHNlO1xuXG4gICAgaWYgKHNldHRpbmcudHlwZSA9PSAnanNvbicpIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKHNldHRpbmdOYW1lLCBKU09OLnN0cmluZ2lmeSh2YWx1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShzZXR0aW5nTmFtZSwgdmFsdWUpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBNb2RpZmllZCBmcm9tIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE5NDkxMzM2IC5cbiAqL1xuZnVuY3Rpb24gdXJsUGFyYW1ldGVyKHBhcmFtZXRlck5hbWUpIHtcbiAgY29uc3QgcGFyYW1ldGVyU3RyaW5nID0gZGVjb2RlVVJJQ29tcG9uZW50KHdpbmRvdy5sb2NhdGlvbi5zZWFyY2guc3Vic3RyaW5nKDEpKTtcbiAgY29uc3QgcGFyYW1ldGVycyA9IHBhcmFtZXRlclN0cmluZy5zcGxpdCgnJicpO1xuXG4gIGxldCBwYXJhbWV0ZXJWYWx1ZTtcbiAgJC5lYWNoKHBhcmFtZXRlcnMsIGZ1bmN0aW9uIChpbmRleCwgcGFyYW0pIHtcbiAgICBjb25zdCBwYXJhbVBhcnRzID0gcGFyYW0uc3BsaXQoJz0nKTtcbiAgICBjb25zdCBwYXJhbU5hbWUgPSBwYXJhbVBhcnRzWzBdO1xuICAgIGNvbnN0IHBhcmFtVmFsdWUgPSBwYXJhbVBhcnRzWzFdO1xuXG4gICAgaWYgKChwYXJhbU5hbWUgPT0gcGFyYW1ldGVyTmFtZSlcbiAgICAgICAgJiYgKHBhcmFtVmFsdWUgIT09IHVuZGVmaW5lZCkpIHtcbiAgICAgIHBhcmFtZXRlclZhbHVlID0gcGFyYW1WYWx1ZTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBwYXJhbWV0ZXJWYWx1ZTtcbn07XG4iXX0=
