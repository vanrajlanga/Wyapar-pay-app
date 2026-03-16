#!/bin/bash

# WyaparPay Recharge API Testing Script
# Phone Number: 8105237629

BASE_URL="http://192.168.1.11:3000/api/v1"
PHONE="8105237629"

echo "=================================================="
echo "🧪 WyaparPay Recharge API Testing"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Login
echo -e "${BLUE}📝 Step 1: Login${NC}"
echo "Please provide your JWT token from the mobile app."
echo "You can find it in the Expo logs after login."
echo ""
read -p "Enter JWT Token: " TOKEN

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ No token provided. Exiting.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Token received${NC}"
echo ""

# Step 2: Detect Operator
echo -e "${BLUE}📝 Step 2: Detect Operator for ${PHONE}${NC}"
DETECT_RESPONSE=$(curl -X POST "${BASE_URL}/recharge/detect-operator" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{\"mobileNumber\":\"${PHONE}\"}" \
  -s)

echo "Response: ${DETECT_RESPONSE}" | jq '.'
OPERATOR_CODE=$(echo $DETECT_RESPONSE | jq -r '.operatorCode')
echo -e "${GREEN}✅ Operator: ${OPERATOR_CODE}${NC}"
echo ""

# Step 3: Get Operators List
echo -e "${BLUE}📝 Step 3: Get All Operators${NC}"
curl -X GET "${BASE_URL}/recharge/operators" \
  -H "Authorization: Bearer ${TOKEN}" \
  -s | jq '.'
echo ""

# Step 4: Get Circles
echo -e "${BLUE}📝 Step 4: Get Circles for ${OPERATOR_CODE}${NC}"
curl -X GET "${BASE_URL}/recharge/circles/${OPERATOR_CODE}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -s | jq '.[0:3]' # Show first 3
echo "... (showing first 3)"
echo ""

# Step 5: Get Plans
echo -e "${BLUE}📝 Step 5: Get Plans for ${OPERATOR_CODE}${NC}"
PLANS_RESPONSE=$(curl -X GET "${BASE_URL}/recharge/plans?operatorCode=${OPERATOR_CODE}&category=popular" \
  -H "Authorization: Bearer ${TOKEN}" \
  -s)

echo "$PLANS_RESPONSE" | jq '.[0:3]' # Show first 3 plans
echo "... (showing first 3 popular plans)"
echo ""

# Get first plan for testing
PLAN_ID=$(echo $PLANS_RESPONSE | jq -r '.[0].id')
PLAN_AMOUNT=$(echo $PLANS_RESPONSE | jq -r '.[0].amount')
echo -e "${GREEN}✅ Selected Plan: ${PLAN_ID} - ₹${PLAN_AMOUNT}${NC}"
echo ""

# Step 6: Validate Recharge
echo -e "${BLUE}📝 Step 6: Validate Recharge${NC}"
VALIDATE_RESPONSE=$(curl -X POST "${BASE_URL}/recharge/validate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"mobileNumber\":\"${PHONE}\",
    \"operatorCode\":\"${OPERATOR_CODE}\",
    \"amount\":${PLAN_AMOUNT}
  }" \
  -s)

echo "$VALIDATE_RESPONSE" | jq '.'

IS_VALID=$(echo $VALIDATE_RESPONSE | jq -r '.valid')
if [ "$IS_VALID" = "true" ]; then
    echo -e "${GREEN}✅ Validation passed${NC}"
else
    echo -e "${RED}❌ Validation failed: $(echo $VALIDATE_RESPONSE | jq -r '.message')${NC}"
    echo "Stopping here. Please check your wallet balance or try again in 5 minutes."
    exit 1
fi
echo ""

# Step 7: Process Recharge (with confirmation)
echo -e "${BLUE}📝 Step 7: Process Recharge${NC}"
echo "⚠️  This will deduct ₹${PLAN_AMOUNT} from your wallet!"
read -p "Proceed with recharge? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Recharge cancelled."
    exit 0
fi

RECHARGE_RESPONSE=$(curl -X POST "${BASE_URL}/recharge/mobile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"mobileNumber\":\"${PHONE}\",
    \"operatorCode\":\"${OPERATOR_CODE}\",
    \"circleCode\":\"DELHI\",
    \"planId\":\"${PLAN_ID}\",
    \"amount\":${PLAN_AMOUNT},
    \"paymentMethod\":\"wallet\"
  }" \
  -s)

echo "$RECHARGE_RESPONSE" | jq '.'

TRANSACTION_ID=$(echo $RECHARGE_RESPONSE | jq -r '.transactionId')
if [ "$TRANSACTION_ID" != "null" ]; then
    echo -e "${GREEN}✅ Recharge successful!${NC}"
    echo -e "Transaction ID: ${TRANSACTION_ID}"
else
    echo -e "${RED}❌ Recharge failed${NC}"
fi
echo ""

# Step 8: Get History
echo -e "${BLUE}📝 Step 8: Get Recharge History${NC}"
curl -X GET "${BASE_URL}/recharge/history?limit=5" \
  -H "Authorization: Bearer ${TOKEN}" \
  -s | jq '.[] | {id, amount, description, status, createdAt}'
echo ""

# Step 9: Add to Favorites
echo -e "${BLUE}📝 Step 9: Add to Favorites${NC}"
FAVORITE_RESPONSE=$(curl -X POST "${BASE_URL}/recharge/favorites" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"accountNumber\":\"${PHONE}\",
    \"type\":\"mobile_recharge\",
    \"nickname\":\"My Number\",
    \"operatorCode\":\"${OPERATOR_CODE}\",
    \"circleCode\":\"DELHI\"
  }" \
  -s)

echo "$FAVORITE_RESPONSE" | jq '.'
echo ""

# Step 10: Get Favorites
echo -e "${BLUE}📝 Step 10: Get Favorites${NC}"
curl -X GET "${BASE_URL}/recharge/favorites" \
  -H "Authorization: Bearer ${TOKEN}" \
  -s | jq '.'
echo ""

echo "=================================================="
echo -e "${GREEN}✅ All tests completed!${NC}"
echo "=================================================="

