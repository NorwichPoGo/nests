const Settings = require('../settings');

/* eslint-disable quotes */
module.exports = map => {
  google.maps.event.addListener(map, 'click', () => {
    $('.settings').collapse('hide');
  });

  $('[name="toggle-gyms"]').bootstrapSwitch();
  $('[name="toggle-gyms"]').bootstrapSwitch('state',
    Settings.get('showGyms'));
  $('[name="toggle-gyms"]').on('switchChange.bootstrapSwitch',
    (event, state) => {
      Settings.set('showGyms', state);
      map.showFeatures();
      map.searchBox.updateText();
    }
  );

  $("[name='toggle-pokestops']").bootstrapSwitch();
  $("[name='toggle-pokestops']").bootstrapSwitch('state',
    Settings.get('showPokestops'));
  $('[name="toggle-pokestops"]').on('switchChange.bootstrapSwitch',
    (event, state) => {
      Settings.set('showPokestops', state);
      map.showFeatures();
      map.searchBox.updateText();
    }
  );

  $("[name='toggle-portals']").bootstrapSwitch();
  $("[name='toggle-portals']").bootstrapSwitch('state',
    Settings.get('showPortals'));
  $('[name="toggle-portals"]').on('switchChange.bootstrapSwitch',
    (event, state) => {
      Settings.set('showPortals', state);
      map.showFeatures();
      map.searchBox.updateText();
    }
  );

  $("[name='toggle-parks']").bootstrapSwitch();
  $("[name='toggle-parks']").bootstrapSwitch('state',
    Settings.get('showParks'));
  $('[name="toggle-parks"]').on('switchChange.bootstrapSwitch',
    (event, state) => {
      Settings.set('showParks', state);
      map.parksLayer.show(state);
    }
  );

  $("[name='toggle-highlight-new-features']").bootstrapSwitch();
  $("[name='toggle-highlight-new-features']").bootstrapSwitch('state',
    Settings.get('highlightNewFeatures'));
  $('[name="toggle-highlight-new-features"]').on('switchChange.bootstrapSwitch',
    (event, state) => {
      Settings.set('highlightNewFeatures', state);
      map.showFeatures(feature => feature.isNew);
    }
  );

  $("[name='toggle-ex-gyms-only']").bootstrapSwitch();
  $("[name='toggle-ex-gyms-only']").bootstrapSwitch('state',
    Settings.get('exGymsOnly'));
  $('[name="toggle-ex-gyms-only"]').on('switchChange.bootstrapSwitch',
    (event, state) => {
      Settings.set('exGymsOnly', state);
      map.showFeatures(feature => feature.type.toLowerCase() == 'gym');
    }
  );

  google.maps.event.addListener(map, 'idle', () => {
    Settings.set('mapCenter', {
      lat: map.getCenter().lat(),
      lng: map.getCenter().lng()
    });
    Settings.set('zoomLevel', map.getZoom());
  });

  function setS2CellLevelOptions() {
    let s2CellLevelOptions = '';
    for (let level = 1; level <= 20; ++level) {
      let optionTag = '';
      if (map.shouldDisplayCellLevel(level)) {
        optionTag += '<option value="' + level + '">';
        optionTag += level;
      } else {
        optionTag += '<option value="' + level + '"'+ 'disabled' + '>';
        optionTag += level + ' - zoom in';
      }
      optionTag += '</option>';

      s2CellLevelOptions += optionTag;
    }

    $("[name='select-s2-cells']").html(s2CellLevelOptions);
    $("[name='select-s2-cells']").selectpicker('val', Settings.get('s2Cells'));
    $("[name='select-s2-cells']").selectpicker('refresh');
  }

  setS2CellLevelOptions();

  google.maps.event.addListener(map, 'idle', setS2CellLevelOptions);

  $("[name='select-s2-cells']").selectpicker({
    size: 5
  });
  $("[name='select-s2-cells']").on('changed.bs.select', function () {
    Settings.set('s2Cells', $(this).val() || []);
    map.updateS2Cells();
  });

  $('.select-s2-cells-wrapper .bs-select-all').prop('disabled', true);
};
/* eslint-enable quotes */
