#!/usr/bin/env python3
"""
🐍 EXEMPLO DO CÓDIGO PYTHON GERADO PELO ANALYTICS AGENT
======================================================

Este é exatamente o tipo de código que o Analytics Agent gera!
Quando executado em um ambiente com Plotly, cria um chart interativo.
"""

# Este seria o código gerado pelo Analytics Agent:
print("🎯 CÓDIGO PYTHON GERADO PELO ANALYTICS AGENT:")
print("=" * 60)

codigo_gerado = '''
import plotly.graph_objects as go
import plotly.offline as pyo

# Chart data from Analytics Agent
data = [
    {
        'x': ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        'y': [1000, 2000, 1500, 2500, 3000],
        'type': 'bar',
        'name': 'Revenue',
        'marker': {
            'color': 'rgb(55, 83, 109)',
            'line': {
                'color': 'rgb(8, 48, 107)',
                'width': 1.5
            }
        },
        'text': ['$1,000', '$2,000', '$1,500', '$2,500', '$3,000'],
        'textposition': 'outside'
    }
]

layout = {
    'title': {
        'text': 'Revenue Analysis',
        'x': 0.5,
        'font': {'size': 18, 'color': 'rgb(55, 83, 109)'}
    },
    'xaxis': {
        'title': 'Months',
        'showgrid': False,
        'showline': True,
        'linecolor': 'rgb(204, 204, 204)'
    },
    'yaxis': {
        'title': 'Revenue (USD)',
        'showgrid': True,
        'gridcolor': 'rgb(235, 235, 235)',
        'showline': True,
        'linecolor': 'rgb(204, 204, 204)'
    },
    'showlegend': False,
    'plot_bgcolor': 'white',
    'paper_bgcolor': 'white',
    'margin': {'l': 60, 'r': 30, 'b': 60, 't': 80},
    'font': {'family': 'Arial, sans-serif', 'size': 12}
}

# Create Plotly figure
fig = go.Figure(data=data, layout=layout)

# Display interactive chart
fig.show()

print("✅ Interactive Plotly chart generated successfully!")
print(f"📊 Chart ID: a8dcd4d29cb14f56a5b4f3c6efcbf93b")
print(f"📈 Data points: 5")
'''

print(codigo_gerado)

print()
print("🔥 VANTAGENS DO CÓDIGO PYTHON GERADO:")
print("-" * 40)
print("✅ Executável diretamente na UI")
print("✅ Chart Plotly interativo nativo")
print("✅ Código modificável pelo usuário")
print("✅ fig.show() abre automaticamente no browser")
print("✅ Debugging facilitado")

print()
print("📊 DADOS DO CHART:")
print("-" * 20)
meses = ['Jan', 'Feb', 'Mar', 'Apr', 'May']
valores = [1000, 2000, 1500, 2500, 3000]

for mes, valor in zip(meses, valores):
    print(f"  {mes}: ${valor:,}")

print()
print("🎯 RESULTADO:")
print("Quando executado em ambiente com Plotly, este código:")
print("1. 🚀 Abre automaticamente o chart no browser")
print("2. 📊 Mostra chart interativo com controles")
print("3. 🔍 Permite zoom, pan, hover, download")
print("4. 📱 É totalmente responsivo")

print()
print("🎉 Analytics Agent: GERANDO CÓDIGO PYTHON EXECUTÁVEL!")