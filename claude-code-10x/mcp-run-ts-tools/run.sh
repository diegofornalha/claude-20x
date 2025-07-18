#!/bin/bash
# run-diego-tools-optimized.sh - Versão otimizada com menos overhead

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$PROJECT_DIR"

# Executar diretamente sem configurações extras
exec node build/index.js "$@"