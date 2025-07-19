#!/bin/bash
# Script para verificar se auto-start está desabilitado

if [ -f "auto_start_disabled.flag" ]; then
    echo "🚫 Auto-start está desabilitado. Para reabilitar, execute: chmod +x ../agent_manager.sh"
    exit 1
fi
