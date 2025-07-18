#!/usr/bin/env python3
"""
🎯 DEMONSTRAÇÃO VISUAL DO ANALYTICS AGENT
========================================

Executa o Analytics Agent e mostra o chart Plotly visual no browser
"""

import asyncio
import json
from analytics_agent_plotly_final import PlotlyAnalyticsAgent
import plotly.graph_objects as go
import plotly.offline as pyo

async def main():
    print("🚀 Demonstrando Analytics Agent com Plotly Visual...")
    print("=" * 60)
    
    # Inicializar agent
    agent = PlotlyAnalyticsAgent()
    
    # Processar dados revenue
    query = "Generate a chart of revenue: Jan,$1000 Feb,$2000 Mar,$1500 Apr,$2500 May,$3000"
    session_id = "visual_demo"
    
    print(f"📝 Query: {query}")
    print()
    
    # Gerar chart
    result = await agent.process_request(query, session_id)
    
    if result["success"]:
        print("✅ Chart gerado com sucesso!")
        print(f"📊 Chart ID: {result['chart_id']}")
        
        # Obter dados do chart
        chart_data = agent.get_chart_data(session_id, result["chart_id"])
        
        if chart_data and chart_data.get("json"):
            # Converter JSON para objeto Plotly
            plotly_chart = json.loads(chart_data["json"])
            
            print("🎯 Criando chart Plotly visual...")
            
            # Criar figura Plotly
            fig = go.Figure(
                data=plotly_chart["data"], 
                layout=plotly_chart["layout"]
            )
            
            # Personalizar layout para melhor visualização
            fig.update_layout(
                title=dict(
                    text="📊 Analytics Agent - Revenue Chart",
                    x=0.5,
                    font=dict(size=20, color="rgb(55, 83, 109)")
                ),
                width=800,
                height=500,
                paper_bgcolor="white",
                plot_bgcolor="white"
            )
            
            # Salvar como arquivo HTML e abrir no browser
            html_file = "/tmp/analytics_agent_chart.html"
            fig.write_html(html_file, include_plotlyjs=True)
            
            print(f"💻 Chart salvo em: {html_file}")
            print("🌐 Abrindo chart no browser...")
            
            # Abrir no browser
            import webbrowser
            webbrowser.open(f"file://{html_file}")
            
            # Também mostrar dados
            print()
            print("📈 DADOS DO CHART:")
            print("-" * 30)
            data = plotly_chart["data"][0]
            for month, value in zip(data["x"], data["y"]):
                print(f"  {month}: ${value:,}")
            
            print()
            print("🎉 Chart Plotly renderizado com sucesso!")
            print("🔍 Verifique o browser para ver o chart interativo!")
            
        else:
            print("❌ Erro ao obter dados do chart")
    else:
        print("❌ Erro ao gerar chart")

if __name__ == "__main__":
    asyncio.run(main())