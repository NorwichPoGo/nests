module.exports = map =>
  Promise.resolve($.getJSON('/data/pokemon.json'))
    .then(pokemonData => {
      map.pokemonData = pokemonData;

      $.each(map.pokemonData, (id, pokemon) => {
        pokemon.id = id;
      });

      return Promise.resolve($.getJSON(
        'https://cdn.rawgit.com/pogo-excalibur/images/' +
        'd4b555aa/pokemon_sprites.json'
      ));
    })
    .then(spriteData => {
      $.each(map.pokemonData, (id, pokemon) => {
        pokemon.sprite = spriteData.sprites.find(sp => sp.name == pokemon.id);

        if (pokemon.sprite) {
          pokemon.sprite.sheetWidth = spriteData.width;
          pokemon.sprite.sheetHeight = spriteData.height;
        }
      });
      
      return map.pokemonData;
    });
