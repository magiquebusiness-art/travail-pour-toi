#!/bin/bash
set -e
echo ">>> Running @cloudflare/next-on-pages build..."
npx @cloudflare/next-on-pages
echo ">>> Build complete"
