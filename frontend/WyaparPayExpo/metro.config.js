const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for AWS SDK v3 async imports
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

// Add transformer options for AWS SDK
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = config;
