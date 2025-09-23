#!/usr/bin/env bash
set -euo pipefail

PROJECT_REF="https://nswjxeqtigjkvngsenxc.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zd2p4ZXF0aWdqa3ZuZ3NlbnhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MTE0MzIsImV4cCI6MjA3NDE4NzQzMn0.J9TvByfwBvtxMJaKhlmF5oKA5ZeElUBQyutkHLiQ_dI"
EMAIL="ben.houghton7070@outlook.com"
PASSWORD="password"

ACCESS_TOKEN=$(curl -s -X POST "${PROJECT_REF}/auth/v1/token?grant_type=password" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}" |
  jq -r .access_token)

echo "Token: ${ACCESS_TOKEN:0:20}..."
echo

curl -i http://localhost:8080/api/testroute \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
