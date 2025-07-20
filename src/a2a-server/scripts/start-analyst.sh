#!/bin/bash

# Start SPARC Analyst Agent A2A Server
export AGENT_TYPE=analyst
export PORT=8003
export MEMORY_BANK_URL=http://localhost:5000
export DEBUG=1

echo "Starting SPARC Analyst Agent A2A Server on port $PORT..."

cd "$(dirname "$0")/.."
npm run start