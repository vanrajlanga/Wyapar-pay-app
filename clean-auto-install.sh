#!/bin/bash

# Cleanup script for React Native/Expo project
# Removes all files that can be automatically reinstalled

echo "🧹 Starting cleanup of auto-installable files..."

# Function to remove directory if it exists
remove_if_exists() {
    if [ -d "$1" ]; then
        echo "  Removing $1..."
        rm -rf "$1"
    fi
}

# Function to remove file if it exists
remove_file_if_exists() {
    if [ -f "$1" ]; then
        echo "  Removing $1..."
        rm -f "$1"
    fi
}

# Backend cleanup
echo "📦 Cleaning backend..."
remove_if_exists "backend/node_modules"

# Frontend cleanup
echo "📱 Cleaning frontend..."
remove_if_exists "frontend/WyaparPayExpo/node_modules"
remove_if_exists "frontend/WyaparPayExpo/.expo"
remove_if_exists "frontend/WyaparPayExpo/dist"

# iOS cleanup (if exists - for bare React Native)
if [ -d "frontend/WyaparPayExpo/ios" ]; then
    echo "🍎 Cleaning iOS..."
    remove_if_exists "frontend/WyaparPayExpo/ios/Pods"
    remove_if_exists "frontend/WyaparPayExpo/ios/build"
    remove_file_if_exists "frontend/WyaparPayExpo/ios/Podfile.lock"
fi

# Android cleanup (if exists - for bare React Native)
if [ -d "frontend/WyaparPayExpo/android" ]; then
    echo "🤖 Cleaning Android..."
    remove_if_exists "frontend/WyaparPayExpo/android/build"
    remove_if_exists "frontend/WyaparPayExpo/android/app/build"
    remove_if_exists "frontend/WyaparPayExpo/android/.gradle"
fi

# Metro bundler cache
echo "🚇 Cleaning Metro bundler cache..."
if command -v watchman &> /dev/null; then
    echo "  Clearing watchman..."
    watchman watch-del-all 2>/dev/null || true
fi

# Temporary files
echo "🗑️  Cleaning temporary files..."
remove_file_if_exists "frontend/WyaparPayExpo/.expo-shared/README.md"
find . -name ".DS_Store" -type f -delete 2>/dev/null || true

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "To reinstall dependencies, run:"
echo "  Backend:  cd backend && npm install"
echo "  Frontend: cd frontend/WyaparPayExpo && npm install"
echo ""
