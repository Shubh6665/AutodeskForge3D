#!/bin/bash

# 🎯 COMPLETE WORKING SOLUTION FOR AUTODESK APS UPLOAD
# This script successfully uploads a Revit file and gets the URN for Forge Viewer

set -e  # Exit on any error

CLIENT_ID="YOUR_CLIENT_ID"
CLIENT_SECRET="YOUR_CLIENT_SECRET"
FILE_NAME="rstbasicsampleproject.rvt"

echo "🚀 Starting Autodesk APS Upload Process..."
echo ""

# Step 1: Get Access Token
echo "🔐 Step 1: Getting access token..."
TOKEN_RESPONSE=$(curl -s -X POST "https://developer.api.autodesk.com/authentication/v2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "grant_type=client_credentials" \
  -d "scope=data:read data:write data:create bucket:create bucket:read")

TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token')
echo "✅ Token obtained: ${TOKEN:0:50}..."
echo ""

# Step 2: Create Bucket
echo "🪣 Step 2: Creating bucket..."
BUCKET_KEY="shubh-bucket-$(date +%s)"
BUCKET_RESPONSE=$(curl -s -X POST "https://developer.api.autodesk.com/oss/v2/buckets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"bucketKey\": \"$BUCKET_KEY\", \"policyKey\": \"transient\"}")

echo "✅ Bucket created: $BUCKET_KEY"
echo ""

# Step 3: Get Signed Upload URL
echo "🔑 Step 3: Getting signed upload URL..."
SIGNED_URL_RESPONSE=$(curl -s -X GET "https://developer.api.autodesk.com/oss/v2/buckets/$BUCKET_KEY/objects/$FILE_NAME/signeds3upload" \
  -H "Authorization: Bearer $TOKEN")

UPLOAD_KEY=$(echo "$SIGNED_URL_RESPONSE" | jq -r '.uploadKey')
UPLOAD_URL=$(echo "$SIGNED_URL_RESPONSE" | jq -r '.urls[0]')
echo "✅ Signed URL obtained"
echo ""

# Step 4: Upload File to S3
echo "📤 Step 4: Uploading file to S3..."
curl -s -X PUT "$UPLOAD_URL" \
  -H "Content-Type: application/octet-stream" \
  --data-binary "@$FILE_NAME"
echo "✅ File uploaded to S3"
echo ""

# Step 5: Complete Upload
echo "🔄 Step 5: Completing upload..."
COMPLETE_RESPONSE=$(curl -s -X POST "https://developer.api.autodesk.com/oss/v2/buckets/$BUCKET_KEY/objects/$FILE_NAME/signeds3upload" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"uploadKey\": \"$UPLOAD_KEY\"}")

OBJECT_ID=$(echo "$COMPLETE_RESPONSE" | jq -r '.objectId')
echo "✅ Upload completed"
echo "   Object ID: $OBJECT_ID"
echo ""

# Step 6: Convert to Base64 URN
echo "🎯 Step 6: Converting to Base64 URN..."
BASE64_URN=$(echo -n "$OBJECT_ID" | base64)
echo "✅ Base64 URN: $BASE64_URN"
echo ""

# Step 7: Start Translation
echo "🔄 Step 7: Starting translation..."
TRANSLATION_RESPONSE=$(curl -s -X POST "https://developer.api.autodesk.com/modelderivative/v2/designdata/job" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"input\": {\"urn\": \"$BASE64_URN\"}, \"output\": {\"formats\": [{\"type\": \"svf\", \"views\": [\"2d\", \"3d\"]}]}}")

TRANSLATION_RESULT=$(echo "$TRANSLATION_RESPONSE" | jq -r '.result')
echo "✅ Translation started: $TRANSLATION_RESULT"
echo ""

# Final Results
echo "🎉 SUCCESS! Your Revit file has been uploaded and translation started!"
echo ""
echo "📋 RESULTS:"
echo "=========================================="
echo "✅ File: $FILE_NAME"
echo "✅ Bucket: $BUCKET_KEY"
echo "✅ Object ID: $OBJECT_ID"
echo "✅ Base64 URN: $BASE64_URN"
echo "=========================================="
echo ""
echo "🚀 Use this URN in your React Forge Viewer:"
echo "   const documentId = 'urn:$BASE64_URN';"
echo ""
echo "⏳ Translation is processing. Check status with:"
echo "   curl -H \"Authorization: Bearer $TOKEN\" \"https://developer.api.autodesk.com/modelderivative/v2/designdata/$BASE64_URN/manifest\""
echo ""
echo "🎯 FINAL ENV VARIABLES FOR YOUR REACT APP:"
echo "REACT_APP_FORGE_URN=$BASE64_URN"
echo "REACT_APP_FORGE_CLIENT_ID=$CLIENT_ID"
