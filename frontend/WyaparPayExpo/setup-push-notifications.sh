#!/bin/bash

# Setup Push Notifications for WyaparPay
# This script will help you configure push notifications properly

echo "🚀 Setting up Push Notifications for WyaparPay..."
echo ""

# Check if logged in
if ! npx expo whoami &>/dev/null; then
    echo "❌ Not logged into Expo"
    echo "📝 Please login first:"
    echo "   npx expo login"
    echo ""
    read -p "Press Enter after you've logged in, or Ctrl+C to cancel..."
fi

echo "✅ Logged in as: $(npx expo whoami)"
echo ""

# Check if project is linked
echo "🔍 Checking project configuration..."
PROJECT_ID=$(npx expo config --type public 2>/dev/null | grep -oP "projectId:\s*'\K[^']+" || echo "")

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "your-project-id-here" ]; then
    echo "📦 Linking project to Expo account..."
    
    # Try to link the project
    npx expo prebuild --clean 2>/dev/null || true
    
    # Get project ID after linking
    PROJECT_ID=$(npx expo config --type public 2>/dev/null | grep -oP "projectId:\s*'\K[^']+" || echo "")
    
    if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "your-project-id-here" ]; then
        echo "⚠️  Could not automatically get project ID"
        echo ""
        echo "Please run manually:"
        echo "  1. npx expo login"
        echo "  2. npx expo config --type public | grep projectId"
        echo "  3. Update app.json with the projectId"
        echo ""
        exit 1
    fi
fi

echo "✅ Project ID found: $PROJECT_ID"
echo ""

# Update app.json with project ID
echo "📝 Updating app.json with project ID..."
if [ -f "app.json" ]; then
    # Use sed to update the project ID (macOS compatible)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/\"projectId\": \"your-project-id-here\"/\"projectId\": \"$PROJECT_ID\"/" app.json 2>/dev/null || \
        sed -i '' "s/\"projectId\": \"[^\"]*\"/\"projectId\": \"$PROJECT_ID\"/" app.json
    else
        sed -i "s/\"projectId\": \"your-project-id-here\"/\"projectId\": \"$PROJECT_ID\"/" app.json 2>/dev/null || \
        sed -i "s/\"projectId\": \"[^\"]*\"/\"projectId\": \"$PROJECT_ID\"/" app.json
    fi
    
    echo "✅ app.json updated with project ID: $PROJECT_ID"
else
    echo "❌ app.json not found"
    exit 1
fi

echo ""
echo "✅ Push notification setup complete!"
echo ""
echo "📱 Next steps:"
echo "  1. Restart Expo: npx expo start --clear"
echo "  2. For full push support, use development build:"
echo "     eas build --profile development --platform ios"
echo "     eas build --profile development --platform android"
echo ""

