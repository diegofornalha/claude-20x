#!/usr/bin/env python3
"""
🌐 ANALYTICS CHART VIEWER
========================

Acessa o Analytics Agent e exibe charts via web
URL: http://localhost:8080/chart/{chart_id}
"""

from flask import Flask, render_template_string, jsonify
import json
import sys
import os

# Add analytics agent to path
sys.path.insert(0, '/Users/agents/Desktop/codex/backup-reorganized/active-prototypes/analytics')

app = Flask(__name__)

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Analytics Agent - Chart Viewer</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { color: #333; margin-bottom: 20px; }
        .chart-container { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Analytics Agent - Chart Viewer</h1>
        <p>Chart ID: <code>{{ chart_id }}</code></p>
        <p>Session: <code>{{ session_id }}</code></p>
    </div>
    
    <div class="chart-container">
        <div id="plotly-chart" style="width:100%;height:500px;"></div>
    </div>
    
    <script>
        var chartData = {{ chart_json | safe }};
        
        Plotly.newPlot(
            'plotly-chart', 
            chartData.data, 
            chartData.layout, 
            {displayModeBar: true, responsive: true}
        );
        
        console.log('✅ Plotly chart rendered successfully!');
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    return """
    <h1>📊 Analytics Agent Chart Viewer</h1>
    <p>Usage: <code>/chart/&lt;session_id&gt;/&lt;chart_id&gt;</code></p>
    <p>Example: <code>/chart/fd676e72-d982-467a-8f41-1c343530677d/224467868c794e3faab3b171563d0e1e</code></p>
    """

@app.route('/chart/<session_id>/<chart_id>')
def view_chart(session_id, chart_id):
    try:
        # Import analytics agent
        from analytics_agent_plotly_final import PlotlyAnalyticsAgent
        
        # Create agent and get chart data
        agent = PlotlyAnalyticsAgent()
        chart_data = agent.get_chart_data(session_id, chart_id)
        
        if chart_data.get("error"):
            return f"❌ Error: {chart_data['error']}", 404
        
        if not chart_data.get("json"):
            return "❌ Chart not found", 404
        
        # Parse chart JSON
        chart_json = chart_data["json"]
        
        return render_template_string(
            HTML_TEMPLATE,
            chart_id=chart_id,
            session_id=session_id,
            chart_json=chart_json
        )
        
    except Exception as e:
        return f"❌ Error loading chart: {str(e)}", 500

@app.route('/api/chart/<session_id>/<chart_id>')
def get_chart_json(session_id, chart_id):
    try:
        from analytics_agent_plotly_final import PlotlyAnalyticsAgent
        
        agent = PlotlyAnalyticsAgent()
        chart_data = agent.get_chart_data(session_id, chart_id)
        
        if chart_data.get("error"):
            return jsonify({"error": chart_data["error"]}), 404
        
        return chart_data["json"]
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Analytics Chart Viewer...")
    print("📊 URL: http://localhost:8080")
    print("🌐 Example: http://localhost:8080/chart/fd676e72-d982-467a-8f41-1c343530677d/224467868c794e3faab3b171563d0e1e")
    app.run(host='0.0.0.0', port=8080, debug=True)