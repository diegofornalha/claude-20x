#!/bin/bash

# Start SPARC Coder Agent A2A Server
export AGENT_TYPE=coder
export PORT=8002
export MEMORY_BANK_URL=http://localhost:5000
export DEBUG=1

echo "Starting SPARC Coder Agent A2A Server on port $PORT..."

cd "$(dirname "$0")/.."
npm run start