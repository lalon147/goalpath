const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (
      moduleName === 'react-native-worklets' ||
      moduleName.startsWith('react-native-worklets/') ||
      moduleName === 'react-native-reanimated' ||
      moduleName.startsWith('react-native-reanimated/')
    ) {
      return { type: 'empty' };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
