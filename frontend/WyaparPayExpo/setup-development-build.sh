#!/bin/bash

# Setup Development Build for WyaparPay
# This script will:
# 1. Configure EAS project
# 2. Get project ID
# 3. Update app.json
# 4. Build development client

set -e

echo "🚀 Setting up Development Build for WyaparPay..."
echo ""

cd "$(dirname "$0")"

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g eas-cli
fi

# Check if logged in
if ! eas whoami &> /dev/null; then
    echo "❌ Not logged into Expo"
    echo "📝 Please login first:"
    echo "   eas login"
    exit 1
fi

echo "✅ Logged in as: $(eas whoami)"
echo ""

# Check if app.json exists
if [ ! -f "app.json" ]; then
    echo "❌ app.json not found"
    exit 1
fi

# Get project ID from Expo
echo "🔍 Getting project ID..."
PROJECT_ID=$(npx expo config --type public 2>/dev/null | grep -oP "projectId:\s*'\K[^']+" | head -1 || echo "")

# If project ID is placeholder or empty, initialize project
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "your-project-id-here" ]; then
    echo "📦 Initializing EAS project..."
    echo "⚠️  This will prompt you to create/link a project"
    echo ""
    eas init
    
    # Get project ID after init
    PROJECT_ID=$(npx expo config --type public 2>/dev/null | grep -oP "projectId:\s*'\K[^']+" | head -1 || echo "")
fi

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "your-project-id-here" ]; then
    echo "❌ Could not get project ID"
    echo ""
    echo "Please run manually:"
    echo "  1. eas init"
    echo "  2. eas build:configure"
    echo "  3. Update app.json with project ID"
    exit 1
fi

echo "✅ Project ID found: $PROJECT_ID"
echo ""

# Update app.json
echo "📝 Updating app.json with project ID..."
if [ -f "app.json" ]; then
    # Use sed to update (macOS compatible)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/\"projectId\": \"your-project-id-here\"/\"projectId\": \"$PROJECT_ID\"/" app.json 2>/dev/null || \
        sed -i '' "s/\"projectId\": \"[^\"]*\"/\"projectId\": \"$PROJECT_ID\"/" app.json
    else
        sed -i "s/\"projectId\": \"your-project-id-here\"/\"projectId\": \"$PROJECT_ID\"/" app.json 2>/dev/null || \
        sed -i "s/\"projectId\": \"[^\"]*\"/\"projectId\": \"$PROJECT_ID\"/" app.json
    fi
    
    echo "✅ app.json updated"
else
    echo "❌ app.json not found"
    exit 1
fi

echo ""
echo "✅ Development build setup complete!"
echo ""
echo "📱 Next steps:"
echo "  1. Build Android development client:"
echo "     eas build --profile development --platform android"
echo ""
echo "  2. Build iOS development client:"
echo "     eas build --profile development --platform ios"
echo ""
echo "  3. Install on device and test push notifications!"
echo ""

