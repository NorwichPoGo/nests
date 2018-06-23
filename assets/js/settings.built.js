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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvc2V0dGluZ3MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLE9BQU8sUUFBUCxHQUFrQjtBQUNoQixZQUFVO0FBQ1IsY0FBVTtBQUNSLFlBQU0sU0FERTtBQUVSLG9CQUFjO0FBRk4sS0FERjtBQUtSLG1CQUFlO0FBQ2IsWUFBTSxTQURPO0FBRWIsb0JBQWM7QUFGRCxLQUxQO0FBU1IsaUJBQWE7QUFDWCxZQUFNLFNBREs7QUFFWCxvQkFBYztBQUZILEtBVEw7QUFhUixlQUFXO0FBQ1QsWUFBTSxTQURHO0FBRVQsb0JBQWM7QUFGTCxLQWJIO0FBaUJSLDBCQUFzQjtBQUNwQixZQUFNLFNBRGM7QUFFcEIsb0JBQWM7QUFGTSxLQWpCZDtBQXFCUixhQUFTO0FBQ1AsWUFBTSxNQURDO0FBRVAsb0JBQWM7QUFGUCxLQXJCRDtBQXlCUixrQkFBYztBQUNaLFlBQU0sTUFETTtBQUVaLG9CQUFjO0FBQ1osYUFBSyxTQURPO0FBRVosYUFBSyxTQUZPO0FBR1osYUFBSyxTQUhPO0FBSVosYUFBSyxTQUpPO0FBS1osYUFBSyxTQUxPO0FBTVosYUFBSyxTQU5PO0FBT1osYUFBSyxTQVBPO0FBUVosYUFBSyxTQVJPO0FBU1osYUFBSyxTQVRPO0FBVVosY0FBTSxTQVZNO0FBV1osY0FBTSxTQVhNO0FBWVosY0FBTSxTQVpNO0FBYVosY0FBTSxTQWJNO0FBY1osY0FBTSxTQWRNO0FBZVosY0FBTSxTQWZNO0FBZ0JaLGNBQU0sU0FoQk07QUFpQlosY0FBTSxTQWpCTTtBQWtCWixjQUFNLFNBbEJNO0FBbUJaLGNBQU0sU0FuQk07QUFvQlosY0FBTTtBQXBCTTtBQUZGLEtBekJOO0FBa0RSLGVBQVc7QUFDVCxZQUFNLE1BREc7QUFFVCxvQkFBYztBQUNaLGFBQUssUUFETztBQUVaLGFBQUs7QUFGTztBQUZMLEtBbERIO0FBeURSLGVBQVc7QUFDVCxZQUFNLE9BREc7QUFFVCxvQkFBYztBQUZMO0FBekRILEdBRE07QUErRGhCLE9BQUssYUFBUyxXQUFULEVBQXNCO0FBQ3pCLFFBQU0sVUFBVSxTQUFTLFFBQVQsQ0FBa0IsV0FBbEIsQ0FBaEI7QUFDQSxRQUFJLGtCQUFrQixhQUFhLE9BQWIsQ0FBcUIsV0FBckIsQ0FBdEI7O0FBRUEsUUFBSSxRQUFRLFdBQVIsS0FBd0IsU0FBNUIsRUFBdUM7QUFDckMsY0FBUSxXQUFSLEdBQXNCLFlBQVk7QUFDaEMsZUFBTyxhQUFhLFdBQWIsQ0FBUDtBQUNELE9BRkQ7QUFHRDs7QUFFRCxRQUFJLFFBQVEsV0FBUixJQUF1QixRQUFRLFdBQVIsSUFBdUIsS0FBbEQsRUFBeUQ7QUFDdkQsVUFBTSxXQUFXLFFBQVEsV0FBUixFQUFqQjtBQUNBLFVBQUksUUFBSixFQUFjO0FBQ1osMEJBQWtCLFFBQWxCO0FBQ0Q7QUFDRjs7QUFFRCxRQUFJLG9CQUFvQixTQUFwQixJQUFpQyxvQkFBb0IsSUFBekQsRUFBK0Q7QUFDN0QsYUFBTyxRQUFRLFlBQWY7QUFDRDs7QUFFRCxRQUFJLFFBQVEsSUFBUixJQUFnQixTQUFwQixFQUErQjtBQUM3QixhQUFPLG1CQUFtQixNQUExQjtBQUNELEtBRkQsTUFFTyxJQUFJLFFBQVEsSUFBUixJQUFnQixPQUFwQixFQUE2QjtBQUNsQyxhQUFPLFdBQVcsZUFBWCxDQUFQO0FBQ0QsS0FGTSxNQUVBLElBQUksUUFBUSxJQUFSLElBQWdCLE1BQXBCLEVBQTRCO0FBQ2pDLGFBQU8sS0FBSyxLQUFMLENBQVcsZUFBWCxDQUFQO0FBQ0Q7O0FBRUQsV0FBTyxlQUFQO0FBQ0QsR0E3RmU7QUE4RmhCLE9BQUssYUFBVSxXQUFWLEVBQXVCLEtBQXZCLEVBQThCO0FBQ2pDLFFBQU0sVUFBVSxTQUFTLFFBQVQsQ0FBa0IsV0FBbEIsQ0FBaEI7O0FBRUEsWUFBUSxXQUFSLEdBQXNCLEtBQXRCOztBQUVBLFFBQUksUUFBUSxJQUFSLElBQWdCLE1BQXBCLEVBQTRCO0FBQzFCLG1CQUFhLE9BQWIsQ0FBcUIsV0FBckIsRUFBa0MsS0FBSyxTQUFMLENBQWUsS0FBZixDQUFsQztBQUNELEtBRkQsTUFFTztBQUNMLG1CQUFhLE9BQWIsQ0FBcUIsV0FBckIsRUFBa0MsS0FBbEM7QUFDRDtBQUNGO0FBeEdlLENBQWxCOztBQTJHQTs7O0FBR0EsU0FBUyxZQUFULENBQXNCLGFBQXRCLEVBQXFDO0FBQ25DLE1BQU0sa0JBQWtCLG1CQUFtQixPQUFPLFFBQVAsQ0FBZ0IsTUFBaEIsQ0FBdUIsU0FBdkIsQ0FBaUMsQ0FBakMsQ0FBbkIsQ0FBeEI7QUFDQSxNQUFNLGFBQWEsZ0JBQWdCLEtBQWhCLENBQXNCLEdBQXRCLENBQW5COztBQUVBLE1BQUksdUJBQUo7QUFDQSxJQUFFLElBQUYsQ0FBTyxVQUFQLEVBQW1CLFVBQVUsS0FBVixFQUFpQixLQUFqQixFQUF3QjtBQUN6QyxRQUFNLGFBQWEsTUFBTSxLQUFOLENBQVksR0FBWixDQUFuQjtBQUNBLFFBQU0sWUFBWSxXQUFXLENBQVgsQ0FBbEI7QUFDQSxRQUFNLGFBQWEsV0FBVyxDQUFYLENBQW5COztBQUVBLFFBQUssYUFBYSxhQUFkLElBQ0ksZUFBZSxTQUR2QixFQUNtQztBQUNqQyx1QkFBaUIsVUFBakI7QUFDQSxhQUFPLEtBQVA7QUFDRDtBQUNGLEdBVkQ7O0FBWUEsU0FBTyxjQUFQO0FBQ0QiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJ3aW5kb3cuU2V0dGluZ3MgPSB7XG4gIHNldHRpbmdzOiB7XG4gICAgc2hvd0d5bXM6IHtcbiAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgIGRlZmF1bHRWYWx1ZTogdHJ1ZVxuICAgIH0sXG4gICAgc2hvd1Bva2VzdG9wczoge1xuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgZGVmYXVsdFZhbHVlOiBmYWxzZVxuICAgIH0sXG4gICAgc2hvd1BvcnRhbHM6IHtcbiAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgIGRlZmF1bHRWYWx1ZTogZmFsc2VcbiAgICB9LFxuICAgIHNob3dQYXJrczoge1xuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgZGVmYXVsdFZhbHVlOiBmYWxzZVxuICAgIH0sXG4gICAgaGlnaGxpZ2h0TmV3RmVhdHVyZXM6IHtcbiAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgIGRlZmF1bHRWYWx1ZTogZmFsc2VcbiAgICB9LFxuICAgIHMyQ2VsbHM6IHtcbiAgICAgIHR5cGU6ICdqc29uJyxcbiAgICAgIGRlZmF1bHRWYWx1ZTogW11cbiAgICB9LFxuICAgIHMyQ2VsbENvbG9yczoge1xuICAgICAgdHlwZTogJ2pzb24nLFxuICAgICAgZGVmYXVsdFZhbHVlOiB7XG4gICAgICAgICcxJzogJyNGRjZGMDAnLFxuICAgICAgICAnMic6ICcjRjU3RjE3JyxcbiAgICAgICAgJzMnOiAnIzgyNzcxNycsXG4gICAgICAgICc0JzogJyMzMzY5MUUnLFxuICAgICAgICAnNSc6ICcjMUI1RTIwJyxcbiAgICAgICAgJzYnOiAnIzAwNEQ0MCcsXG4gICAgICAgICc3JzogJyMwMDYwNjQnLFxuICAgICAgICAnOCc6ICcjMDE1NzlCJyxcbiAgICAgICAgJzknOiAnIzBENDdBMScsXG4gICAgICAgICcxMCc6ICcjMUEyMzdFJyxcbiAgICAgICAgJzExJzogJyM2QTFCOUEnLFxuICAgICAgICAnMTInOiAnI0FEMTQ1NycsXG4gICAgICAgICcxMyc6ICcjYjcxYzFjJyxcbiAgICAgICAgJzE0JzogJyNCRjM2MEMnLFxuICAgICAgICAnMTUnOiAnI0ZGNzA0MycsXG4gICAgICAgICcxNic6ICcjRkZDQTI4JyxcbiAgICAgICAgJzE3JzogJyNGREQ4MzUnLFxuICAgICAgICAnMTgnOiAnIzAwNzk2QicsXG4gICAgICAgICcxOSc6ICcjMDI4OEQxJyxcbiAgICAgICAgJzIwJzogJyM2NEI1RjYnXG4gICAgICB9XG4gICAgfSxcbiAgICBtYXBDZW50ZXI6IHtcbiAgICAgIHR5cGU6ICdqc29uJyxcbiAgICAgIGRlZmF1bHRWYWx1ZToge1xuICAgICAgICBsYXQ6IDUyLjYzMjgyLFxuICAgICAgICBsbmc6IDEuMjk3MzJcbiAgICAgIH1cbiAgICB9LFxuICAgIHpvb21MZXZlbDoge1xuICAgICAgdHlwZTogJ2Zsb2F0JyxcbiAgICAgIGRlZmF1bHRWYWx1ZTogMTNcbiAgICB9XG4gIH0sXG4gIGdldDogZnVuY3Rpb24oc2V0dGluZ05hbWUpIHtcbiAgICBjb25zdCBzZXR0aW5nID0gU2V0dGluZ3Muc2V0dGluZ3Nbc2V0dGluZ05hbWVdO1xuICAgIGxldCByYXdTZXR0aW5nVmFsdWUgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShzZXR0aW5nTmFtZSk7XG5cbiAgICBpZiAoc2V0dGluZy5nZXRVUkxWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBzZXR0aW5nLmdldFVSTFZhbHVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdXJsUGFyYW1ldGVyKHNldHRpbmdOYW1lKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKHNldHRpbmcuZ2V0VVJMVmFsdWUgJiYgc2V0dGluZy5nZXRVUkxWYWx1ZSAhPSBmYWxzZSkge1xuICAgICAgY29uc3QgdXJsVmFsdWUgPSBzZXR0aW5nLmdldFVSTFZhbHVlKCk7XG4gICAgICBpZiAodXJsVmFsdWUpIHtcbiAgICAgICAgcmF3U2V0dGluZ1ZhbHVlID0gdXJsVmFsdWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHJhd1NldHRpbmdWYWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHJhd1NldHRpbmdWYWx1ZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHNldHRpbmcuZGVmYXVsdFZhbHVlO1xuICAgIH1cblxuICAgIGlmIChzZXR0aW5nLnR5cGUgPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICByZXR1cm4gcmF3U2V0dGluZ1ZhbHVlID09ICd0cnVlJztcbiAgICB9IGVsc2UgaWYgKHNldHRpbmcudHlwZSA9PSAnZmxvYXQnKSB7XG4gICAgICByZXR1cm4gcGFyc2VGbG9hdChyYXdTZXR0aW5nVmFsdWUpO1xuICAgIH0gZWxzZSBpZiAoc2V0dGluZy50eXBlID09ICdqc29uJykge1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2UocmF3U2V0dGluZ1ZhbHVlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmF3U2V0dGluZ1ZhbHVlO1xuICB9LFxuICBzZXQ6IGZ1bmN0aW9uIChzZXR0aW5nTmFtZSwgdmFsdWUpIHtcbiAgICBjb25zdCBzZXR0aW5nID0gU2V0dGluZ3Muc2V0dGluZ3Nbc2V0dGluZ05hbWVdO1xuXG4gICAgc2V0dGluZy5nZXRVUkxWYWx1ZSA9IGZhbHNlO1xuXG4gICAgaWYgKHNldHRpbmcudHlwZSA9PSAnanNvbicpIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKHNldHRpbmdOYW1lLCBKU09OLnN0cmluZ2lmeSh2YWx1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShzZXR0aW5nTmFtZSwgdmFsdWUpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBNb2RpZmllZCBmcm9tIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE5NDkxMzM2IC5cbiAqL1xuZnVuY3Rpb24gdXJsUGFyYW1ldGVyKHBhcmFtZXRlck5hbWUpIHtcbiAgY29uc3QgcGFyYW1ldGVyU3RyaW5nID0gZGVjb2RlVVJJQ29tcG9uZW50KHdpbmRvdy5sb2NhdGlvbi5zZWFyY2guc3Vic3RyaW5nKDEpKTtcbiAgY29uc3QgcGFyYW1ldGVycyA9IHBhcmFtZXRlclN0cmluZy5zcGxpdCgnJicpO1xuXG4gIGxldCBwYXJhbWV0ZXJWYWx1ZTtcbiAgJC5lYWNoKHBhcmFtZXRlcnMsIGZ1bmN0aW9uIChpbmRleCwgcGFyYW0pIHtcbiAgICBjb25zdCBwYXJhbVBhcnRzID0gcGFyYW0uc3BsaXQoJz0nKTtcbiAgICBjb25zdCBwYXJhbU5hbWUgPSBwYXJhbVBhcnRzWzBdO1xuICAgIGNvbnN0IHBhcmFtVmFsdWUgPSBwYXJhbVBhcnRzWzFdO1xuXG4gICAgaWYgKChwYXJhbU5hbWUgPT0gcGFyYW1ldGVyTmFtZSlcbiAgICAgICAgJiYgKHBhcmFtVmFsdWUgIT09IHVuZGVmaW5lZCkpIHtcbiAgICAgIHBhcmFtZXRlclZhbHVlID0gcGFyYW1WYWx1ZTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBwYXJhbWV0ZXJWYWx1ZTtcbn07XG4iXX0=
