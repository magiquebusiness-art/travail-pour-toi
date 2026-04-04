#!/bin/bash
set -e

echo "=== Running D1 migrations on $D1_ID ==="

ENCODED_SQL=$(python3 << 'PYEOF'
import json
with open('schema-d1.sql') as f:
    print(json.dumps(f.read()))
PYEOF
)

RESULT=$(curl -s -X POST \
  "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT/d1/database/$D1_ID/query" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": $ENCODED_SQL}")

echo "$RESULT" | python3 << 'PYEOF'
import sys, json
try:
    d = json.load(sys.stdin)
    if d.get('success'):
        print('Migration applied successfully')
    else:
        for e in d.get('errors', []):
            print(f'Warning: {e.get("message", "unknown")}')
        # Don't fail - tables might already exist
        print('Continuing with deployment...')
except Exception as e:
    print(f'Parse error: {e}')
    print('Continuing...')
PYEOF
