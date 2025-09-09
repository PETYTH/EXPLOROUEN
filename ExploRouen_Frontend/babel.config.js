// babel.config.js
module.exports = function (api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: [
        ['module-resolver', {
          alias: {
            '@': './'   // => "@/xxx" pointe sur la racine du frontend
          }
        }]
      ]
    };
  };
  