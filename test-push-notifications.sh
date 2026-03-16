#!/bin/bash

# WyaparPay Push Notification Testing Script
# This script tests the complete push notification flow

BASE_URL="http://localhost:3000/api/v1"

echo "=================================================="
echo "🔔 WyaparPay Push Notification Testing"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq is required but not installed.${NC}"
    echo "Install it with: brew install jq (macOS) or apt-get install jq (Linux)"
    exit 1
fi

# Step 1: Get Authentication Token
echo -e "${BLUE}📝 Step 1: Authentication${NC}"
echo "Choose an option:"
echo "1) Login with credentials"
echo "2) Use existing JWT token"
read -p "Enter choice (1 or 2): " AUTH_CHOICE

if [ "$AUTH_CHOICE" = "1" ]; then
    read -p "Enter email/phone: " IDENTIFIER
    read -sp "Enter password: " PASSWORD
    echo ""
    
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
else
    read -p "Enter JWT Token: " TOKEN
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}❌ No token provided. Exiting.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Token received${NC}"
fi
echo ""

# Step 2: Check Service Health
echo -e "${BLUE}📝 Step 2: Check Push Notification Service Health${NC}"
HEALTH_RESPONSE=$(curl -X GET "${BASE_URL}/notifications/health" \
  -H "Authorization: Bearer ${TOKEN}" \
  -s)

echo "$HEALTH_RESPONSE" | jq '.'

ENABLED=$(echo $HEALTH_RESPONSE | jq -r '.enabled')
if [ "$ENABLED" != "true" ]; then
    echo -e "${YELLOW}⚠️  Push notifications are disabled${NC}"
    echo "Set PUSH_NOTIFICATIONS_ENABLED=true in your .env file"
    echo ""
fi
echo ""

# Step 3: Register Device Token
echo -e "${BLUE}📝 Step 3: Register Device Token${NC}"
echo "For testing, you can use an Expo push token."
echo "Format: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
echo ""
echo "Note: If you don't have a real token, you can:"
echo "1) Get one from the Expo app (check logs)"
echo "2) Use a test token format (will fail but tests the API)"
read -p "Enter push token (or press Enter to skip): " PUSH_TOKEN

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
        echo -e "${YELLOW}⚠️  Token registration may have failed (check response above)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Skipping device registration${NC}"
    echo "You'll need to register a device token before sending notifications"
fi
echo ""

# Step 4: Send Test Notification (Simple)
echo -e "${BLUE}📝 Step 4: Send Simple Test Notification${NC}"
read -p "Send simple test notification? (yes/no): " SEND_SIMPLE

if [ "$SEND_SIMPLE" = "yes" ]; then
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
        echo -e "${RED}❌ Failed to send notification${NC}"
        echo "Check if device token is registered and push notifications are enabled"
    fi
fi
echo ""

# Step 5: Send Template-Based Notification
echo -e "${BLUE}📝 Step 5: Send Template-Based Notification${NC}"
echo "Available notification types:"
echo "  - transaction_success"
echo "  - transaction_failed"
echo "  - recharge_success"
echo "  - wallet_topup_success"
echo "  - login_alert"
echo "  - account_verified"
echo "  - kyc_approved"
echo ""
read -p "Send template notification? (yes/no): " SEND_TEMPLATE

if [ "$SEND_TEMPLATE" = "yes" ]; then
    read -p "Enter notification type (e.g., transaction_success): " NOTIFICATION_TYPE
    read -p "Enter language (en/hi/kn, default: en): " LANGUAGE
    LANGUAGE=${LANGUAGE:-en}
    
    # Set context based on type
    CONTEXT="{}"
    if [ "$NOTIFICATION_TYPE" = "transaction_success" ] || [ "$NOTIFICATION_TYPE" = "transaction_failed" ]; then
        read -p "Enter amount (default: 100): " AMOUNT
        AMOUNT=${AMOUNT:-100}
        read -p "Enter transaction ID (default: txn_test_123): " TXN_ID
        TXN_ID=${TXN_ID:-txn_test_123}
        CONTEXT="{\"amount\":${AMOUNT},\"currency\":\"₹\",\"transactionId\":\"${TXN_ID}\"}"
    elif [ "$NOTIFICATION_TYPE" = "recharge_success" ] || [ "$NOTIFICATION_TYPE" = "recharge_failed" ]; then
        read -p "Enter amount (default: 50): " AMOUNT
        AMOUNT=${AMOUNT:-50}
        read -p "Enter phone number (default: 1234567890): " PHONE
        PHONE=${PHONE:-1234567890}
        CONTEXT="{\"amount\":${AMOUNT},\"currency\":\"₹\",\"phoneNumber\":\"${PHONE}\"}"
    elif [ "$NOTIFICATION_TYPE" = "wallet_topup_success" ]; then
        read -p "Enter amount (default: 500): " AMOUNT
        AMOUNT=${AMOUNT:-500}
        CONTEXT="{\"amount\":${AMOUNT},\"currency\":\"₹\"}"
    fi
    
    TEMPLATE_RESPONSE=$(curl -X POST "${BASE_URL}/notifications/send-template" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${TOKEN}" \
      -d "{
        \"type\": \"${NOTIFICATION_TYPE}\",
        \"language\": \"${LANGUAGE}\",
        \"context\": ${CONTEXT}
      }" \
      -s)
    
    echo "$TEMPLATE_RESPONSE" | jq '.'
    
    SUCCESS=$(echo $TEMPLATE_RESPONSE | jq -r '.success // false')
    if [ "$SUCCESS" = "true" ]; then
        NOTIFICATION_ID=$(echo $TEMPLATE_RESPONSE | jq -r '.notificationId')
        echo -e "${GREEN}✅ Template notification sent!${NC}"
        echo "Notification ID: $NOTIFICATION_ID"
    else
        echo -e "${RED}❌ Failed to send template notification${NC}"
    fi
fi
echo ""

# Step 6: Preview Template
echo -e "${BLUE}📝 Step 6: Preview Notification Template${NC}"
read -p "Preview a template? (yes/no): " PREVIEW_TEMPLATE

if [ "$PREVIEW_TEMPLATE" = "yes" ]; then
    read -p "Enter notification type (e.g., transaction_success): " PREVIEW_TYPE
    read -p "Enter language (en/hi/kn, default: en): " PREVIEW_LANGUAGE
    PREVIEW_LANGUAGE=${PREVIEW_LANGUAGE:-en}
    
    PREVIEW_RESPONSE=$(curl -X GET "${BASE_URL}/notifications/templates/${PREVIEW_TYPE}/preview?language=${PREVIEW_LANGUAGE}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -s)
    
    echo "$PREVIEW_RESPONSE" | jq '.'
    echo -e "${GREEN}✅ Template preview retrieved${NC}"
fi
echo ""

# Step 7: Get Available Templates
echo -e "${BLUE}📝 Step 7: Get Available Templates${NC}"
TEMPLATES_RESPONSE=$(curl -X GET "${BASE_URL}/notifications/templates" \
  -H "Authorization: Bearer ${TOKEN}" \
  -s)

echo "$TEMPLATES_RESPONSE" | jq '.'
echo -e "${GREEN}✅ Templates list retrieved${NC}"
echo ""

# Step 8: Get Notification Statistics
echo -e "${BLUE}📝 Step 8: Get Notification Statistics${NC}"
STATS_RESPONSE=$(curl -X GET "${BASE_URL}/notifications/stats" \
  -H "Authorization: Bearer ${TOKEN}" \
  -s)

echo "$STATS_RESPONSE" | jq '.'
echo -e "${GREEN}✅ Statistics retrieved${NC}"
echo ""

# Summary
echo "=================================================="
echo -e "${GREEN}✅ Push Notification Testing Complete!${NC}"
echo "=================================================="
echo ""
echo "Summary:"
echo "  - Service Health: Checked"
echo "  - Device Registration: $(if [ -n "$PUSH_TOKEN" ]; then echo 'Attempted'; else echo 'Skipped'; fi)"
echo "  - Simple Notification: $(if [ "$SEND_SIMPLE" = "yes" ]; then echo 'Sent'; else echo 'Skipped'; fi)"
echo "  - Template Notification: $(if [ "$SEND_TEMPLATE" = "yes" ]; then echo 'Sent'; else echo 'Skipped'; fi)"
echo ""
echo "Next Steps:"
echo "  1. Check your device for received notifications"
echo "  2. Verify notification stats match expected counts"
echo "  3. Test different notification types and languages"
echo "  4. Check backend logs for detailed delivery information"
echo ""

