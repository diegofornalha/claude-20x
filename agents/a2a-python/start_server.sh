#!/bin/bash
"""
A2A Python Server Startup Script

Simple script to start the A2A Python server with proper environment setup.
"""

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m' 
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting A2A Python Server${NC}"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if we're in the right directory
if [ ! -f "pyproject.toml" ]; then
    echo -e "${RED}❌ Error: Not in a2a-python directory${NC}"
    exit 1
fi

# Check if Python 3.10+ is available
python_version=$(python3 --version 2>&1 | grep -oE '[0-9]+\.[0-9]+' | head -1)
required_version="3.10"

if ! python3 -c "import sys; exit(0 if sys.version_info >= (3, 10) else 1)" 2>/dev/null; then
    echo -e "${RED}❌ Error: Python 3.10+ required, found ${python_version}${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Python version: ${python_version}${NC}"

# Install dependencies if needed
if [ ! -d ".venv" ]; then
    echo -e "${YELLOW}📦 Creating virtual environment...${NC}"
    python3 -m venv .venv
fi

echo -e "${YELLOW}🔧 Activating virtual environment...${NC}"
source .venv/bin/activate

# Check if dependencies are installed
if ! python -c "import fastapi, uvicorn" 2>/dev/null; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    pip install -e .
    pip install uvicorn[standard]
fi

echo -e "${GREEN}✅ Dependencies ready${NC}"

# Parse command line arguments
PORT=8888
DEBUG=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --port)
            PORT="$2"
            shift 2
            ;;
        --debug)
            DEBUG=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --port PORT    Server port (default: 8888)"
            echo "  --debug        Enable debug logging"
            echo "  -h, --help     Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Start the server
echo -e "${BLUE}🌐 Starting server on port ${PORT}...${NC}"
echo -e "${BLUE}📋 Endpoints:${NC}"
echo -e "  • Health:     ${GREEN}http://localhost:${PORT}/health${NC}"
echo -e "  • Agent Card: ${GREEN}http://localhost:${PORT}/.well-known/agent.json${NC}"
echo -e "  • Communicate: ${GREEN}http://localhost:${PORT}/communicate${NC}"
echo ""
echo -e "${YELLOW}💡 Press Ctrl+C to stop the server${NC}"
echo ""

# Build command
CMD="python server.py --port $PORT"
if [ "$DEBUG" = true ]; then
    CMD="$CMD --debug"
fi

# Execute the server
exec $CMD