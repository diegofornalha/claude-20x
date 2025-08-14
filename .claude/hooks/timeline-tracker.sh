#!/bin/bash

# Timeline Tracker Hook - Rastreia tempo real de execução das tarefas
# Integra com o agente timeline-estimator para aprendizado contínuo

TIMELINE_DB=".swarm/timeline_history.db"
TASK_START_FILE=".swarm/current_task_start.txt"

# Função para registrar início de tarefa
start_task() {
    local task_name="$1"
    local task_type="$2"
    local estimated_minutes="$3"
    
    # Registrar timestamp de início
    echo "$(date +%s):${task_name}:${task_type}:${estimated_minutes}" > "$TASK_START_FILE"
    
    # Inserir no banco de dados
    sqlite3 "$TIMELINE_DB" <<EOF
INSERT INTO timeline_history (task_name, task_type, estimated_minutes, created_at)
VALUES ('${task_name}', '${task_type}', ${estimated_minutes:-30}, datetime('now'));
EOF
    
    echo "⏱️ Tarefa iniciada: ${task_name} (estimativa: ${estimated_minutes} min)"
}

# Função para registrar fim de tarefa
end_task() {
    if [ ! -f "$TASK_START_FILE" ]; then
        echo "⚠️ Nenhuma tarefa em andamento"
        return 1
    fi
    
    # Ler dados da tarefa
    IFS=':' read -r start_time task_name task_type estimated_minutes < "$TASK_START_FILE"
    
    # Calcular tempo decorrido
    end_time=$(date +%s)
    elapsed_seconds=$((end_time - start_time))
    actual_minutes=$((elapsed_seconds / 60))
    
    # Calcular precisão
    if [ "$estimated_minutes" -gt 0 ]; then
        if [ "$actual_minutes" -le "$estimated_minutes" ]; then
            accuracy=$(echo "scale=2; ($actual_minutes / $estimated_minutes) * 100" | bc)
        else
            accuracy=$(echo "scale=2; ($estimated_minutes / $actual_minutes) * 100" | bc)
        fi
    else
        accuracy=0
    fi
    
    # Atualizar banco de dados
    sqlite3 "$TIMELINE_DB" <<EOF
UPDATE timeline_history
SET actual_minutes = ${actual_minutes},
    accuracy_percent = ${accuracy},
    completed_at = datetime('now')
WHERE task_name = '${task_name}'
  AND actual_minutes IS NULL
ORDER BY created_at DESC
LIMIT 1;
EOF
    
    # Limpar arquivo de tarefa atual
    rm -f "$TASK_START_FILE"
    
    # Feedback
    echo "✅ Tarefa concluída: ${task_name}"
    echo "⏱️ Tempo real: ${actual_minutes} min (estimado: ${estimated_minutes} min)"
    echo "🎯 Precisão: ${accuracy}%"
    
    # Se a precisão for baixa, sugerir ajuste
    if (( $(echo "$accuracy < 70" | bc -l) )); then
        echo "💡 Sugestão: Ajustar estimativas futuras para tarefas similares"
    fi
}

# Função para analisar padrões
analyze_patterns() {
    local task_type="$1"
    
    sqlite3 "$TIMELINE_DB" <<EOF
.mode column
.headers on
SELECT 
    task_type,
    COUNT(*) as total,
    ROUND(AVG(actual_minutes), 1) as avg_time,
    ROUND(MIN(actual_minutes), 1) as min_time,
    ROUND(MAX(actual_minutes), 1) as max_time,
    ROUND(AVG(accuracy_percent), 1) as avg_accuracy
FROM timeline_history
WHERE actual_minutes IS NOT NULL
${task_type:+AND task_type = '$task_type'}
GROUP BY task_type;
EOF
}

# Função para obter recomendação
get_recommendation() {
    local task_description="$1"
    
    # Chamar o script Python para análise detalhada
    python3 - <<EOF
import sys
sys.path.append('.')
from timeline_estimator import TimelineEstimator

estimator = TimelineEstimator()
result = estimator.estimate_task("$task_description", {
    "first_time": False,
    "complexity": "medium",
    "experience": "intermediate"
})

print(f"⏱️ Estimativa: {result['estimate_readable']}")
print(f"🎯 Confiança: {result['confidence']}")
for rec in result['recommendations']:
    print(f"   {rec}")
EOF
}

# Hook principal - detecta tipo de ação
case "${1:-}" in
    "start")
        start_task "$2" "$3" "$4"
        ;;
    "end")
        end_task
        ;;
    "analyze")
        analyze_patterns "$2"
        ;;
    "recommend")
        get_recommendation "$2"
        ;;
    *)
        echo "Uso: $0 {start|end|analyze|recommend} [args...]"
        echo "  start <task_name> <task_type> <estimated_minutes>"
        echo "  end"
        echo "  analyze [task_type]"
        echo "  recommend <task_description>"
        exit 1
        ;;
esac