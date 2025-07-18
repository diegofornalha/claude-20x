import plotly.graph_objects as go
import plotly.subplots as sp
import pandas as pd

# Dados (mesmos do seu código)
dias = ["01 Jul", "02 Jul", "03 Jul", "04 Jul", "05 Jul", "06 Jul", "07 Jul"]
cliques = [120, 150, 140, 180, 160, 175, 165]
conversao = [2.5, 3.0, 2.8, 3.5, 3.2, 3.7, 3.4]
custo_conversao = [60, 50, 55, 45, 48, 43, 46]

# Dados por grupo de anúncio
grupos = ["Institucional", "Promoção Julho", "Remarketing", "Marca concorrente"]
grupo_cliques = [400, 600, 300, 200]
grupo_conversoes = [25, 42, 30, 10]
grupo_custo = [900, 1300, 700, 500]

# 🚀 PLOTLY VERSION - Gráficos Interativos

# Gráfico 1: Cliques por Dia (Bar Chart Interativo)
fig1 = go.Figure()
fig1.add_trace(go.Bar(
    x=dias, 
    y=cliques, 
    name='Cliques',
    marker_color='skyblue',
    hovertemplate='<b>%{x}</b><br>Cliques: %{y}<extra></extra>'
))
fig1.update_layout(
    title='📊 Cliques por Dia (Interativo)',
    xaxis_title='Dia',
    yaxis_title='Número de Cliques',
    hovermode='x unified',
    showlegend=False
)

# Gráfico 2: Taxa de Conversão (Line Chart com Hover)
fig2 = go.Figure()
fig2.add_trace(go.Scatter(
    x=dias, 
    y=conversao, 
    mode='lines+markers',
    name='Taxa de Conversão',
    line=dict(color='green', width=3),
    marker=dict(size=8),
    hovertemplate='<b>%{x}</b><br>Conversão: %{y}%<extra></extra>'
))
fig2.update_layout(
    title='📈 Taxa de Conversão (%) por Dia',
    xaxis_title='Dia',
    yaxis_title='Taxa de Conversão (%)',
    hovermode='x unified'
)

# Gráfico 3: Custo por Conversão (Area Chart Interativo)
fig3 = go.Figure()
fig3.add_trace(go.Scatter(
    x=dias, 
    y=custo_conversao,
    mode='lines',
    fill='tonexty',
    name='Custo por Conversão',
    line=dict(color='orange'),
    fillcolor='rgba(255,165,0,0.3)',
    hovertemplate='<b>%{x}</b><br>Custo: R$ %{y}<extra></extra>'
))
fig3.update_layout(
    title='💰 Custo por Conversão (R$) por Dia',
    xaxis_title='Dia',
    yaxis_title='Custo por Conversão (R$)',
    hovermode='x unified'
)

# Gráfico 4: Grupos de Anúncios (Stacked Bar Interativo)
fig4 = go.Figure()
fig4.add_trace(go.Bar(
    x=grupos, 
    y=grupo_cliques, 
    name='Cliques',
    marker_color='blue',
    hovertemplate='<b>%{x}</b><br>Cliques: %{y}<extra></extra>'
))
fig4.add_trace(go.Bar(
    x=grupos, 
    y=grupo_conversoes, 
    name='Conversões',
    marker_color='green',
    hovertemplate='<b>%{x}</b><br>Conversões: %{y}<extra></extra>'
))
fig4.add_trace(go.Bar(
    x=grupos, 
    y=grupo_custo, 
    name='Custo',
    marker_color='red',
    hovertemplate='<b>%{x}</b><br>Custo: R$ %{y}<extra></extra>'
))
fig4.update_layout(
    title='🎯 Desempenho por Grupo de Anúncio',
    xaxis_title='Grupos',
    yaxis_title='Valores',
    barmode='stack',
    hovermode='x unified'
)

# 🎉 EXIBIR TODOS OS GRÁFICOS
print("🚀 Exibindo gráficos Plotly interativos...")
fig1.show()
fig2.show() 
fig3.show()
fig4.show()

print("✅ Todos os gráficos foram gerados com sucesso!")
print("💡 Interatividade: Zoom, Pan, Hover, Download automático")

# 🌐 OPCIONAL: Salvar como HTML para web
fig1.write_html("/tmp/cliques_por_dia.html")
fig2.write_html("/tmp/taxa_conversao.html")
fig3.write_html("/tmp/custo_conversao.html")
fig4.write_html("/tmp/grupos_anuncios.html")

print("🌐 Arquivos HTML salvos em /tmp/ para acesso web")