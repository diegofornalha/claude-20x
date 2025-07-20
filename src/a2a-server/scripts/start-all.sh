#!/bin/bash

# Start all SPARC A2A Agent Servers

echo "Starting all SPARC A2A Agent Servers..."

# Start each agent in background
./start-researcher.sh &
RESEARCHER_PID=$!
echo "Researcher Agent started (PID: $RESEARCHER_PID)"

./start-coder.sh &
CODER_PID=$!
echo "Coder Agent started (PID: $CODER_PID)"

./start-analyst.sh &
ANALYST_PID=$!
echo "Analyst Agent started (PID: $ANALYST_PID)"

./start-coordinator.sh &
COORDINATOR_PID=$!
echo "Coordinator Agent started (PID: $COORDINATOR_PID)"

echo "All agents started successfully!"
echo "PIDs: Researcher=$RESEARCHER_PID, Coder=$CODER_PID, Analyst=$ANALYST_PID, Coordinator=$COORDINATOR_PID"

# Wait for all processes
wait