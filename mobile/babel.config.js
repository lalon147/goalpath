module.exports = function (api) {
  const isWeb = api.caller((caller) => caller?.platform === 'web');
  api.cache.using(() => isWeb ? 'web' : 'native');
  return {
    presets: ['babel-preset-expo'],
    plugins: isWeb ? [] : ['react-native-reanimated/plugin'],
  };
};
