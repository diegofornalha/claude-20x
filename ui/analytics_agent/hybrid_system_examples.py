#!/usr/bin/env python3
"""
🤖 HYBRID ANALYTICS AGENT - Exemplos do Sistema Inteligente

Este arquivo demonstra como o Analytics Agent híbrido escolhe automaticamente 
entre Matplotlib (estático) e Plotly (interativo) baseado no contexto.

Desenvolvido em: 15 de Janeiro de 2025
Status: 🚀 Implementação Completa
"""

import sys
import os

# Simular as ferramentas do agent para demonstração
def simulate_smart_decision(user_prompt, data_size=0):
    """Simula a ferramenta SmartChartDecisionTool"""
    prompt_lower = user_prompt.lower()
    
    # Keywords que sugerem Plotly (interativo/web)
    plotly_keywords = [
        'interativo', 'interactive', 'web', 'html', 'dashboard', 
        'zoom', 'hover', 'navegador', 'browser', 'clicável', 
        'arrastar', 'dinâmico', 'online', 'responsivo', 'explorar'
    ]
    
    # Keywords que sugerem Matplotlib (estático/relatório)
    matplotlib_keywords = [
        'relatório', 'report', 'pdf', 'imprimir', 'print', 'estático', 
        'static', 'simples', 'simple', 'documento', 'document', 
        'arquivo', 'file', 'png', 'jpeg'
    ]
    
    plotly_score = sum(1 for keyword in plotly_keywords if keyword in prompt_lower)
    matplotlib_score = sum(1 for keyword in matplotlib_keywords if keyword in prompt_lower)
    
    # Fator tamanho dos dados
    if data_size > 20:
        plotly_score += 2
    elif data_size > 0 and data_size <= 10:
        matplotlib_score += 1
    
    # Indicadores de complexidade
    complex_indicators = ['múltiplas', 'várias', 'tempo', 'time', 'séries', 'series', 'linhas', 'comparar']
    if any(indicator in prompt_lower for indicator in complex_indicators):
        plotly_score += 1
    
    # Decisão
    if plotly_score > matplotlib_score:
        decision = 'plotly'
        reasoning = f"Plotly escolhido (score: {plotly_score} vs {matplotlib_score}) - contexto sugere interatividade"
    elif matplotlib_score > plotly_score:
        decision = 'matplotlib' 
        reasoning = f"Matplotlib escolhido (score: {matplotlib_score} vs {plotly_score}) - contexto sugere simplicidade/documento"
    else:
        decision = 'plotly'
        reasoning = f"Plotly escolhido por padrão (scores empatados: {plotly_score}={matplotlib_score}) - melhor UX"
    
    return decision, reasoning, plotly_score, matplotlib_score


def print_decision_analysis(prompt, data_size=0):
    """Exibe análise detalhada da decisão"""
    decision, reasoning, plotly_score, matplotlib_score = simulate_smart_decision(prompt, data_size)
    
    print(f"\n{'='*80}")
    print(f"📝 PROMPT: '{prompt}'")
    print(f"📊 Tamanho dos dados: {data_size} pontos")
    print(f"{'='*80}")
    print(f"📈 Score Plotly: {plotly_score}")
    print(f"📊 Score Matplotlib: {matplotlib_score}")
    print(f"🤖 DECISÃO: {decision.upper()}")
    print(f"🧠 RACIOCÍNIO: {reasoning}")
    print(f"{'='*80}\n")


def main():
    """Demonstra o sistema híbrido com diferentes exemplos"""
    
    print("🤖 HYBRID ANALYTICS AGENT - Sistema de Decisão Inteligente")
    print("=" * 80)
    print("Este sistema escolhe automaticamente entre Matplotlib e Plotly baseado no contexto.")
    print("=" * 80)
    
    # 🌟 EXEMPLOS QUE ATIVAM PLOTLY (INTERATIVO)
    print("\n🚀 EXEMPLOS QUE ATIVAM PLOTLY (INTERATIVO):")
    
    plotly_examples = [
        ("Crie um gráfico interativo para o dashboard", 15),
        ("Preciso de um chart para web com zoom e hover", 25),
        ("Generate a dynamic chart for browser visualization", 12),
        ("Gráfico responsivo para navegador online", 8),
        ("Dashboard chart with clickable interactions", 30),
        ("Chart exploratório com múltiplas séries de tempo", 45),
        ("Visualização dinâmica para análise de dados", 20)
    ]
    
    for prompt, size in plotly_examples:
        print_decision_analysis(prompt, size)
    
    # 📊 EXEMPLOS QUE ATIVAM MATPLOTLIB (ESTÁTICO)
    print("\n📊 EXEMPLOS QUE ATIVAM MATPLOTLIB (ESTÁTICO):")
    
    matplotlib_examples = [
        ("Gere um gráfico simples para relatório PDF", 5),
        ("Chart para imprimir em documento", 8),
        ("Static chart for report document", 3),
        ("Gráfico estático para arquivo PNG", 10),
        ("Simple bar chart for document printing", 6),
        ("Chart para relatório mensal em PDF", 12),
        ("Visualização simples para apresentação impressa", 4)
    ]
    
    for prompt, size in matplotlib_examples:
        print_decision_analysis(prompt, size)
    
    # ⚖️ EXEMPLOS NEUTROS (PLOTLY POR PADRÃO)
    print("\n⚖️ EXEMPLOS NEUTROS (PLOTLY POR PADRÃO - MELHOR UX):")
    
    neutral_examples = [
        ("Create a revenue chart", 15),
        ("Gere um gráfico de vendas", 10),
        ("Chart with sales data", 7),
        ("Visualização de dados financeiros", 20),
        ("Generate chart for Q1 data", 25)
    ]
    
    for prompt, size in neutral_examples:
        print_decision_analysis(prompt, size)
    
    # 📈 EXEMPLOS COM TAMANHO DE DADOS
    print("\n📈 EXEMPLOS INFLUENCIADOS PELO TAMANHO DOS DADOS:")
    
    size_examples = [
        ("Chart de vendas", 5),    # Pequeno -> favorece Matplotlib  
        ("Chart de vendas", 25),   # Grande -> favorece Plotly
        ("Gráfico simples", 2),    # Muito pequeno -> favorece Matplotlib
        ("Gráfico simples", 50),   # Muito grande -> favorece Plotly
    ]
    
    for prompt, size in size_examples:
        print_decision_analysis(prompt, size)
    
    # 🎯 RESUMO DAS DECISÕES
    print("\n🎯 RESUMO DO SISTEMA DE DECISÃO HÍBRIDO:")
    print("=" * 80)
    print("✅ PLOTLY é escolhido quando:")
    print("   • Contexto sugere interatividade (web, dashboard, zoom, hover)")
    print("   • Muitos pontos de dados (>20)")
    print("   • Múltiplas séries ou complexidade")
    print("   • Empate ou contexto neutro (melhor UX)")
    print()
    print("✅ MATPLOTLIB é escolhido quando:")
    print("   • Contexto sugere estaticidade (relatório, PDF, imprimir)")
    print("   • Poucos pontos de dados (≤10)")
    print("   • Simplicidade explícita")
    print("   • Destino é documento/arquivo")
    print()
    print("🚀 VANTAGEM DO SISTEMA HÍBRIDO:")
    print("   • Automatização total - zero decisão manual")
    print("   • Melhor ferramenta para cada contexto")
    print("   • Fallback inteligente se uma biblioteca falhar")
    print("   • Transparência - sempre explica a decisão")
    print("=" * 80)


if __name__ == "__main__":
    main()