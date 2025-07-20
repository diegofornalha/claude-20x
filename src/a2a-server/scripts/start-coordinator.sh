#!/bin/bash

# Start SPARC Coordinator Agent A2A Server
export AGENT_TYPE=coordinator
export PORT=8004
export MEMORY_BANK_URL=http://localhost:5000
export DEBUG=1

echo "Starting SPARC Coordinator Agent A2A Server on port $PORT..."

cd "$(dirname "$0")/.."
npm run start