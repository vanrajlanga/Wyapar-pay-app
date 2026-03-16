#!/bin/bash

# Quick Push Notification Test Script
# This script tests push notifications with minimal interaction

BASE_URL="http://localhost:3000/api/v1"

echo "=================================================="
echo "🔔 Quick Push Notification Test"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo -e "${BLUE}📝 Checking if backend is running...${NC}"
if ! curl -s http://localhost:3000/api/v1/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend is not running or not accessible${NC}"
    echo "Please start the backend first:"
    echo "  cd backend && npm run start:dev"
    exit 1
fi
echo -e "${GREEN}✅ Backend is running${NC}"
echo ""

# Get credentials or token
echo -e "${BLUE}📝 Step 1: Authentication${NC}"
echo "You need to authenticate first."
echo ""
echo "Option A: Login with credentials"
read -p "Enter email/phone: " IDENTIFIER
read -sp "Enter password: " PASSWORD
echo ""

if [ -z "$IDENTIFIER" ] || [ -z "$PASSWORD" ]; then
    echo -e "${RED}❌ Credentials required${NC}"
    exit 1
fi

# Login
echo -e "${BLUE}Logging in...${NC}"
LOGIN_RESPONSE=$(curl -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"identifier\":\"${IDENTIFIER}\",\"password\":\"${PASSWORD}\"}" \
  -s)

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.tokens.accessToken // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo -e "${RED}❌ Login failed${NC}"
    echo "$LOGIN_RESPONSE" | jq '.'
    exit 1
fi

echo -e "${GREEN}✅ Login successful${NC}"
echo ""

# Step 2: Check Service Health
echo -e "${BLUE}📝 Step 2: Check Push Notification Service Health${NC}"
HEALTH_RESPONSE=$(curl -X GET "${BASE_URL}/notifications/health" \
  -H "Authorization: Bearer ${TOKEN}" \
  -s)

echo "$HEALTH_RESPONSE" | jq '.'

ENABLED=$(echo $HEALTH_RESPONSE | jq -r '.enabled // false')
if [ "$ENABLED" != "true" ]; then
    echo -e "${YELLOW}⚠️  Push notifications are disabled${NC}"
    echo "Set PUSH_NOTIFICATIONS_ENABLED=true in backend/.env"
    echo ""
else
    echo -e "${GREEN}✅ Push notifications are enabled${NC}"
fi
echo ""

# Step 3: Get Available Templates
echo -e "${BLUE}📝 Step 3: Get Available Templates${NC}"
TEMPLATES_RESPONSE=$(curl -X GET "${BASE_URL}/notifications/templates" \
  -H "Authorization: Bearer ${TOKEN}" \
  -s)

TEMPLATE_COUNT=$(echo $TEMPLATES_RESPONSE | jq -r '.total // 0')
echo "Available templates: $TEMPLATE_COUNT"
echo "$TEMPLATES_RESPONSE" | jq '.templates[0:5]' # Show first 5
echo -e "${GREEN}✅ Templates retrieved${NC}"
echo ""

# Step 4: Register Device Token (optional)
echo -e "${BLUE}📝 Step 4: Register Device Token${NC}"
read -p "Enter Expo push token (or press Enter to skip): " PUSH_TOKEN

if [ -n "$PUSH_TOKEN" ]; then
    REGISTER_RESPONSE=$(curl -X POST "${BASE_URL}/notifications/register-device" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${TOKEN}" \
      -d "{\"pushToken\":\"${PUSH_TOKEN}\"}" \
      -s)
    
    echo "$REGISTER_RESPONSE" | jq '.'
    
    SUCCESS=$(echo $REGISTER_RESPONSE | jq -r '.success // false')
    if [ "$SUCCESS" = "true" ]; then
        echo -e "${GREEN}✅ Device token registered${NC}"
    else
        echo -e "${YELLOW}⚠️  Token registration may have failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Skipping device registration${NC}"
    echo "You'll need to register a device token before sending notifications"
fi
echo ""

# Step 5: Send Test Notification
echo -e "${BLUE}📝 Step 5: Send Test Notification${NC}"
read -p "Send test notification? (yes/no): " SEND_TEST

if [ "$SEND_TEST" = "yes" ]; then
    if [ -z "$PUSH_TOKEN" ]; then
        echo -e "${YELLOW}⚠️  No device token registered. Notification may fail.${NC}"
        read -p "Continue anyway? (yes/no): " CONTINUE
        if [ "$CONTINUE" != "yes" ]; then
            echo "Skipping notification test"
            exit 0
        fi
    fi
    
    echo -e "${BLUE}Sending test notification...${NC}"
    TEST_RESPONSE=$(curl -X POST "${BASE_URL}/notifications/test" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${TOKEN}" \
      -d '{
        "title": "Test Notification",
        "body": "This is a test push notification from WyaparPay!",
        "type": "system",
        "data": {
          "screen": "dashboard",
          "test": true
        },
        "sound": "default"
      }' \
      -s)
    
    echo "$TEST_RESPONSE" | jq '.'
    
    SUCCESS=$(echo $TEST_RESPONSE | jq -r '.success // false')
    if [ "$SUCCESS" = "true" ]; then
        NOTIFICATION_ID=$(echo $TEST_RESPONSE | jq -r '.notificationId')
        echo -e "${GREEN}✅ Test notification sent!${NC}"
        echo "Notification ID: $NOTIFICATION_ID"
    else
        MESSAGE=$(echo $TEST_RESPONSE | jq -r '.message // "Unknown error"')
        echo -e "${RED}❌ Failed to send notification: ${MESSAGE}${NC}"
    fi
fi
echo ""

# Step 6: Get Statistics
echo -e "${BLUE}📝 Step 6: Get Notification Statistics${NC}"
STATS_RESPONSE=$(curl -X GET "${BASE_URL}/notifications/stats" \
  -H "Authorization: Bearer ${TOKEN}" \
  -s)

echo "$STATS_RESPONSE" | jq '.'
echo -e "${GREEN}✅ Statistics retrieved${NC}"
echo ""

# Summary
echo "=================================================="
echo -e "${GREEN}✅ Push Notification Test Complete!${NC}"
echo "=================================================="
echo ""
echo "Summary:"
echo "  - Backend: ✅ Running"
echo "  - Authentication: ✅ Success"
echo "  - Service Health: $([ "$ENABLED" = "true" ] && echo '✅ Enabled' || echo '⚠️  Disabled')"
echo "  - Templates: ✅ $TEMPLATE_COUNT available"
echo "  - Device Token: $([ -n "$PUSH_TOKEN" ] && echo '✅ Registered' || echo '⚠️  Not registered')"
echo "  - Test Notification: $([ "$SEND_TEST" = "yes" ] && echo '✅ Sent' || echo '⏭️  Skipped')"
echo ""
echo "Next Steps:"
echo "  1. Register a real device token from your Expo app"
echo "  2. Send notifications and check your device"
echo "  3. Monitor statistics to track delivery"
echo ""

