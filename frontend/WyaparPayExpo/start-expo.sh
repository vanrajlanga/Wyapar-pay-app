#!/bin/bash

# Start Expo without interactive prompts
# This script handles the login prompt automatically

cd "$(dirname "$0")"

echo "🚀 Starting Expo..."
echo ""

# Check if already logged in
if npx expo whoami &>/dev/null; then
    echo "✅ Already logged in as: $(npx expo whoami)"
    echo ""
    npx expo start --clear
else
    echo "⚠️  Not logged in. Starting with anonymous mode..."
    echo ""
    echo "To enable full features, run: npx expo login"
    echo ""
    
    # Use environment variable to skip login prompt
    EXPO_NO_TELEMETRY=1 npx expo start --clear --offline 2>&1 | \
        sed 's/Log in/Proceed anonymously/g' | \
        npx expo start --clear
fi

