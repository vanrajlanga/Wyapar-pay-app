#!/bin/bash

# Build script for WyaparPay - Android APK and iOS IPA
# Usage: ./build-production.sh [android|ios|all]

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}🚀 WyaparPay Production Build Script${NC}\n"

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo -e "${RED}❌ EAS CLI is not installed.${NC}"
    echo -e "${YELLOW}Install it with: npm install -g eas-cli${NC}"
    exit 1
fi

# Check if logged in
if ! eas whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged into EAS.${NC}"
    echo -e "${YELLOW}Please run: eas login${NC}"
    exit 1
fi

echo -e "${GREEN}✅ EAS CLI found and logged in${NC}\n"

# Function to build Android APK
build_android_apk() {
    echo -e "${BLUE}📱 Building Android APK...${NC}"
    eas build --profile production-apk --platform android --non-interactive
    echo -e "${GREEN}✅ Android APK build started!${NC}"
    echo -e "${YELLOW}Check build status with: eas build:list${NC}\n"
}

# Function to build Android AAB
build_android_aab() {
    echo -e "${BLUE}📱 Building Android AAB (for Play Store)...${NC}"
    eas build --profile production --platform android --non-interactive
    echo -e "${GREEN}✅ Android AAB build started!${NC}"
    echo -e "${YELLOW}Check build status with: eas build:list${NC}\n"
}

# Function to build iOS IPA
build_ios() {
    echo -e "${BLUE}🍎 Building iOS IPA...${NC}"
    eas build --profile production --platform ios --non-interactive
    echo -e "${GREEN}✅ iOS IPA build started!${NC}"
    echo -e "${YELLOW}Check build status with: eas build:list${NC}\n"
}

# Parse command line argument
BUILD_TYPE=${1:-all}

case $BUILD_TYPE in
    android|android-apk)
        build_android_apk
        ;;
    android-aab)
        build_android_aab
        ;;
    ios)
        build_ios
        ;;
    all)
        echo -e "${YELLOW}Building both Android APK and iOS IPA...${NC}\n"
        build_android_apk
        sleep 2
        build_ios
        ;;
    *)
        echo -e "${RED}❌ Invalid build type: $BUILD_TYPE${NC}"
        echo -e "${YELLOW}Usage: ./build-production.sh [android|android-aab|ios|all]${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}🎉 Build process initiated!${NC}"
echo -e "\n${BLUE}Next steps:${NC}"
echo -e "1. Monitor builds: ${YELLOW}eas build:list${NC}"
echo -e "2. View build details: ${YELLOW}eas build:view [BUILD_ID]${NC}"
echo -e "3. Download builds from: ${YELLOW}https://expo.dev/accounts/sevend.expo/projects/WyaparPayExpo/builds${NC}"
echo -e "\n${GREEN}Builds typically take 15-40 minutes to complete.${NC}"

