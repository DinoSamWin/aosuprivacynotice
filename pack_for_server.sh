#!/bin/bash

# Define output name
OUTPUT_FILE="privacy-repo-deploy.zip"

# Remove old zip if exists
rm -f $OUTPUT_FILE

# Create zip excluding unnecessary files
# We exclude node_modules, .next, .git, and local dev files like .env.local if any
echo "Packaging files..."
zip -r $OUTPUT_FILE \
  src \
  public \
  data/store.json \
  Dockerfile \
  docker-compose.yml \
  next.config.ts \
  package.json \
  package-lock.json \
  tsconfig.json \
  tailwind.config.ts \
  postcss.config.mjs \
  eslint.config.mjs \
  README.md \
  DEPLOY.md

echo "Done! Deployment package created: $OUTPUT_FILE"
