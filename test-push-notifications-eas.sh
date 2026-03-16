#!/bin/bash

# Push Notification Testing via EAS Build & Apple Developer Account
# This is the proper way to test push notifications on iOS

echo "🍎 Push Notification Testing via EAS Build"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd frontend/WyaparPayExpo

echo -e "${BLUE}Step 1: Check EAS CLI${NC}"
if ! command -v eas &> /dev/null; then
    echo -e "${YELLOW}EAS CLI not found. Installing...${NC}"
    npm install -g eas-cli
else
    echo -e "${GREEN}✅ EAS CLI installed${NC}"
fi
echo ""

echo -e "${BLUE}Step 2: Login to EAS${NC}"
echo "You'll be prompted to authenticate with your Expo account"
eas login
echo ""

echo -e "${BLUE}Step 3: Configure iOS Credentials with Apple Developer${NC}"
echo "This will prompt you to:"
echo "  - Authenticate with Apple ID"
echo "  - Enter Apple Developer Team ID"
echo "  - Set up certificates automatically"
echo ""
read -p "Press Enter to continue with credential setup..."
eas credentials --platform ios
echo ""

echo -e "${BLUE}Step 4: Build Development Build for iOS${NC}"
echo "This will create a development build with push notification support"
echo "The build will be uploaded to EAS and you'll get a download link"
echo ""
read -p "Press Enter to start the build..."
eas build --profile development --platform ios
echo ""

echo -e "${GREEN}✅ Build started!${NC}"
echo ""
echo "Next Steps:"
echo "  1. Wait for the build to complete (check EAS dashboard)"
echo "  2. Download the .ipa file from EAS"
echo "  3. Install on your iPhone (via TestFlight or direct install)"
echo "  4. Open the app and login"
echo "  5. The app will automatically register the push token with backend"
echo "  6. Test sending notifications from backend"
echo ""
echo "To test notifications after installing:"
echo "  cd backend && npm run test:push:quick"
echo "  (Then use the interactive script to send test notifications)"
echo ""

