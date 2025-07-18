#!/usr/bin/env python3
"""
🔗 DEMONSTRAÇÃO: Links Personalizados com Chart ID
=================================================

Mostra como o Analytics Agent agora gera links únicos para cada chart
usando o Chart ID, facilitando o acesso direto.
"""

import asyncio
from analytics_agent_plotly_final import PlotlyAnalyticsAgent
import json
import webbrowser
import os

async def demo_chart_id_links():
    """Demonstra o sistema de links personalizados com Chart ID"""
    
    print("🔗 DEMO: Links Personalizados com Chart ID")
    print("=" * 60)
    
    agent = PlotlyAnalyticsAgent()
    
    # Dados de exemplo
    test_cases = [
        {
            "query": "Generate a chart of revenue: Jan,$1000 Feb,$2000 Mar,$1500",
            "session": "session_revenue"
        },
        {
            "query": "sales data: Q1,$5000 Q2,$7500 Q3,$6200 Q4,$8900", 
            "session": "session_sales"
        }
    ]
    
    generated_links = []
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n📊 TESTE {i}: {test_case['query'][:50]}...")
        
        # Processar requisição
        result = await agent.process_request(test_case["query"], test_case["session"])
        
        if result["success"]:
            chart_id = result["chart_id"]
            chart_data = agent.get_chart_data(test_case["session"], chart_id)
            
            # Simular geração do arquivo HTML com Chart ID (como o Analytics Agent faz)
            html_file_name = f"analytics_chart_{chart_id}.html"
            html_file_path = f"/tmp/{html_file_name}"
            
            # Gerar HTML personalizado
            plotly_chart = json.loads(chart_data["json"])
            
            html_content = f"""<!DOCTYPE html>
<html>
<head>
    <title>Analytics Agent - Chart {chart_id}</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }}
        .container {{ background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 900px; margin: 20px auto; }}
        .header {{ text-align: center; color: #333; margin-bottom: 30px; }}
        .chart-container {{ border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: #fafafa; }}
        .success {{ color: #28a745; font-weight: bold; }}
        .chart-id {{ background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace; margin: 10px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Analytics Agent - Chart Interativo</h1>
            <p class="success">✅ Chart gerado com sucesso pelo Analytics Agent!</p>
            <div class="chart-id">📊 Chart ID: {chart_id}<br>📈 Dados: {len(plotly_chart['data'][0]['x'])} pontos</div>
        </div>
        <div class="chart-container">
            <div id="plotly-chart" style="width:100%;height:500px;"></div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #666;">
            <p>🚀 Chart interativo gerado automaticamente | 🔍 Clique e arraste para zoom</p>
        </div>
    </div>
    <script>
        var chartData = {json.dumps(plotly_chart)};
        Plotly.newPlot('plotly-chart', chartData.data, chartData.layout, chartData.config || {{displayModeBar: true, responsive: true}});
        console.log('✅ Chart Analytics Agent renderizado: {chart_id}');
    </script>
</body>
</html>"""
            
            # Salvar arquivo
            with open(html_file_path, 'w') as f:
                f.write(html_content)
            
            # Link personalizado
            link = f"file://{html_file_path}"
            generated_links.append({
                "chart_id": chart_id,
                "link": link,
                "data_points": len(plotly_chart['data'][0]['x'])
            })
            
            print(f"✅ Chart ID: {chart_id}")
            print(f"🔗 Link direto: {link}")
            print(f"📈 Data points: {len(plotly_chart['data'][0]['x'])}")
            
        else:
            print(f"❌ Erro: {result['result']}")
    
    print(f"\n🎯 RESUMO DOS LINKS GERADOS:")
    print("-" * 40)
    for item in generated_links:
        print(f"Chart ID: {item['chart_id'][:12]}...")
        print(f"Link: {item['link']}")
        print(f"Dados: {item['data_points']} pontos")
        print()
    
    # Abrir o primeiro chart automaticamente
    if generated_links:
        print("🌐 Abrindo primeiro chart automaticamente...")
        webbrowser.open(generated_links[0]["link"])
    
    print("🎉 Demo concluída! Agora cada chart tem seu link único identificado pelo Chart ID!")

if __name__ == "__main__":
    asyncio.run(demo_chart_id_links())