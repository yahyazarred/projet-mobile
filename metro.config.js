const { withNativeWind } = require('nativewind/metro');
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

// Exclude react-native-maps on web
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (platform === 'web' && moduleName.includes('react-native-maps')) {
        // Return an empty module
        return {
            type: 'empty',
        };
    }

    // Default resolution
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './app/globals.css' });