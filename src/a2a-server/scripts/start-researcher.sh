#!/bin/bash

# Start SPARC Researcher Agent A2A Server
export AGENT_TYPE=researcher
export PORT=8001
export MEMORY_BANK_URL=http://localhost:5000
export DEBUG=1

echo "Starting SPARC Researcher Agent A2A Server on port $PORT..."

cd "$(dirname "$0")/.."
npm run start