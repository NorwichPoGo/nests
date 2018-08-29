const Utils = require('../utils');

module.exports = map => {
  map.nestReportOverlay = $('.nest-report-overlay');
  map.nestReportOverlay.click(() => {
    map.updateSelectedNest = null;
    map.nestReportOverlay.hide();
  });

  const nestReportCloseIcon = $('.nest-report-popup .close-icon');
  nestReportCloseIcon.click(() => {
    map.updateSelectedNest = null;
    map.nestReportOverlay.hide();
  });

  const nestReportHeading = $('.nest-report-popup .heading');
  nestReportHeading.html('Select a Pokémon:');

  const nestReportSelection = $('.nest-report-popup .selection');

  const addPokemonIcon = pokemon => {
    let pokemonIcon;
    if (pokemon.id && (pokemon.id > 0)) {
      const pokemonNum = `${pokemon.id}`.padStart(3, '0');
      pokemonIcon = $(`
        <div class="pokemon">
          <div class="icon pokemon-sprite-${pokemon.id}"></div>
          <span class="id">${pokemonNum}</span>
          <span class="name">${pokemon.name}</span>
        </div>
        `);
    } else {
      pokemonIcon = $(`
        <div class="pokemon">
          <div class="icon clear"></div>
          <span class="clear-label">${pokemon.name}</span>
        </div>
        `);
    }

    pokemonIcon.appendTo(nestReportSelection);

    pokemonIcon.click(() => {
      map.nestReportOverlay.hide();

      if (map.updateSelectedNest) {
        map.updateSelectedNest(pokemon);
      }
    });
  };

  addPokemonIcon({
    id: 0,
    name: 'Clear'
  });

  $.each(Utils.NESTING_SPECIES, (index, pokemonId) => {
    const pokemon = map.pokemonData[pokemonId];
    addPokemonIcon(pokemon);
  });
};
