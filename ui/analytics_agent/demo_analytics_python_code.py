#!/usr/bin/env python3
"""
🐍 CÓDIGO PYTHON GERADO PELO ANALYTICS AGENT
============================================

Este é exatamente o tipo de código que o Analytics Agent
agora gera ao invés de HTML! 🚀

Executável diretamente na UI com mcp__ide__executeCode
"""

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
print(f"📊 Chart ID: 6fc24a3de5b740a0a5c424890787e3e7")
print(f"📈 Data points: {len(data[0]['x'])}")
print("🐍 This code is executable directly in the UI!")