#!/bin/bash
set -e

echo "=== Looking up or creating D1 database ==="

# List databases
D1_RESPONSE=$(curl -s "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT/d1/database" \
  -H "Authorization: Bearer $CF_TOKEN")

D1_ID=$(echo "$D1_RESPONSE" | python3 << 'PYEOF'
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        for db in data.get('result', []):
            if db['name'] == 'affiliation-pro-db':
                print(db['uuid'])
                sys.exit(0)
except Exception as e:
    print(f'PARSE_ERROR: {e}', file=sys.stderr)
print('')
PYEOF
)

if [ -z "$D1_ID" ]; then
  echo "Database not found, creating..."
  CREATE_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT/d1/database" \
    -H "Authorization: Bearer $CF_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name": "affiliation-pro-db"}')

  D1_ID=$(echo "$CREATE_RESPONSE" | python3 << 'PYEOF'
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('result', {}).get('uuid', ''))
except:
    print('')
PYEOF
)
fi

if [ -n "$D1_ID" ]; then
  echo "D1_ID=$D1_ID" >> "$GITHUB_ENV"
  sed -i "s/PLACEHOLDER_D1_ID/$D1_ID/" wrangler.toml
  echo "=== D1 database ready: $D1_ID ==="
else
  echo "=== WARNING: Could not setup D1 database ==="
fi
