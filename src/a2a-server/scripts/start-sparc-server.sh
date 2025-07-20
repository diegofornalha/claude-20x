#!/bin/bash

# SPARC A2A Server Startup Script
# Starts the SPARC A2A JSON-RPC server with proper configuration

set -e

echo "🚀 Starting SPARC A2A Server..."

# Set default environment variables
export PORT=${PORT:-3000}
export HOST=${HOST:-0.0.0.0}
export LOG_LEVEL=${LOG_LEVEL:-info}
export NODE_ENV=${NODE_ENV:-development}

# Create logs directory if it doesn't exist
mkdir -p logs

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "❌ Port $port is already in use"
        echo "Please stop the existing process or use a different port:"
        echo "  PORT=3001 $0"
        exit 1
    fi
}

# Function to check dependencies
check_dependencies() {
    echo "🔍 Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is not installed"
        exit 1
    fi
    
    echo "✅ Dependencies OK"
}

# Function to build if needed
build_if_needed() {
    if [ ! -d "dist" ] || [ "src" -nt "dist" ]; then
        echo "🔨 Building TypeScript..."
        npm run build
    else
        echo "✅ Build is up to date"
    fi
}

# Function to start server
start_server() {
    echo "🌟 Starting SPARC A2A Server on $HOST:$PORT"
    echo "📊 Health Check: http://$HOST:$PORT/health"
    echo "🔗 Agent Card: http://$HOST:$PORT/.well-known/agent.json"
    echo "🎯 JSON-RPC: http://$HOST:$PORT/jsonrpc"
    echo ""
    
    # Start server with logging
    exec node dist/index.js 2>&1 | tee logs/sparc-a2a-server.log
}

# Main execution
main() {
    check_dependencies
    check_port $PORT
    build_if_needed
    start_server
}

# Handle signals for graceful shutdown
cleanup() {
    echo ""
    echo "🛑 Shutting down SPARC A2A Server..."
    exit 0
}

trap cleanup SIGINT SIGTERM

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --port)
            export PORT="$2"
            shift 2
            ;;
        --host)
            export HOST="$2"
            shift 2
            ;;
        --log-level)
            export LOG_LEVEL="$2"
            shift 2
            ;;
        --dev)
            echo "🔧 Starting in development mode..."
            exec npm run dev
            ;;
        --help)
            echo "SPARC A2A Server Startup Script"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --port <port>        Server port (default: 3000)"
            echo "  --host <host>        Server host (default: 0.0.0.0)"
            echo "  --log-level <level>  Log level (debug|info|warn|error, default: info)"
            echo "  --dev                Start in development mode with hot reload"
            echo "  --help               Show this help message"
            echo ""
            echo "Environment Variables:"
            echo "  PORT                 Server port"
            echo "  HOST                 Server host"
            echo "  LOG_LEVEL           Log level"
            echo "  NODE_ENV            Node environment"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run main function
main