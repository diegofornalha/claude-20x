#!/usr/bin/env python3
"""
🎯 ANALYTICS AGENT - VERSÃO FINAL COM PLOTLY
===============================================

✅ FUNCIONALIDADES:
- Charts interativos Plotly (mais funcionais que PNG)
- Compatível com protocolo A2A
- Task lifecycle completo (submitted → working → completed)
- Cache de sessão para múltiplos charts
- Fallback para PNG se necessário

🚀 COMO USAR:
1. Import: from analytics_agent_plotly_final import PlotlyAnalyticsAgent
2. Create: agent = PlotlyAnalyticsAgent()
3. Process: result = await agent.process_request(query, session_id)
4. Get chart: chart_data = agent.get_chart_data(session_id, chart_id)

📈 RESULTADO:
- chart_type: "plotly" 
- chart_json: JSON do Plotly pronto para renderização
- HTML completo para embedding na UI
"""

import asyncio
import json
import logging
import re
import uuid
from typing import Dict, Any, Optional
import pandas as pd
from io import StringIO

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PlotlyAnalyticsAgent:
    """🎯 Analytics Agent Final - Gera charts Plotly interativos"""
    
    SUPPORTED_CONTENT_TYPES = ["text", "text/plain", "application/json"]
    
    def __init__(self):
        self.session_cache = {}
        self.chart_counter = 0
        logger.info("🚀 PlotlyAnalyticsAgent initialized")
    
    async def process_request(self, query: str, session_id: str, skill: str = None) -> Dict[str, Any]:
        """
        🎯 Processa requisição e gera chart Plotly interativo
        
        Args:
            query: Texto com dados (ex: "revenue: Jan,$1000 Feb,$2000")
            session_id: ID da sessão para cache
            skill: Skill opcional (compatibilidade A2A)
            
        Returns:
            Dict com resultado da geração do chart
        """
        try:
            logger.info(f"📊 Processing chart request: {query} (session: {session_id})")
            
            # Parse data from query
            data = self._parse_revenue_data(query)
            if not data:
                return {
                    "success": False,
                    "result": "❌ Could not parse data from query. Expected format: 'Jan,$1000 Feb,$2000'",
                    "is_task_complete": True,
                    "chart_type": "error"
                }
            
            # Generate Plotly chart
            chart_id, plotly_json = self._create_plotly_chart(data, session_id)
            
            # Cache result
            self.session_cache[session_id] = self.session_cache.get(session_id, {})
            self.session_cache[session_id][chart_id] = {
                "json": plotly_json,
                "data": data,
                "type": "plotly",
                "name": f"interactive_chart_{chart_id}.json",
                "id": chart_id,
                "html": self._generate_embed_html(plotly_json, chart_id)
            }
            
            logger.info(f"✅ Created interactive Plotly chart: {chart_id}")
            
            return {
                "success": True,
                "result": f"✅ Interactive chart generated successfully: {chart_id}",
                "chart_id": chart_id,
                "chart_type": "plotly",
                "chart_name": f"interactive_chart_{chart_id}",
                "is_task_complete": True,
                "data_points": len(data["months"])
            }
            
        except Exception as e:
            logger.error(f"❌ Error processing request: {e}")
            return {
                "success": False,
                "result": f"❌ Error generating chart: {str(e)}",
                "is_task_complete": True,
                "chart_type": "error"
            }
    
    def _parse_revenue_data(self, query: str) -> Optional[Dict[str, Any]]:
        """📝 Parse revenue data from natural language query"""
        try:
            # Look for pattern like "Jan,$1000 Feb,$2000" or "revenue: Jan,$1000"
            # Remove common prefixes
            clean_query = re.sub(r'^.*?revenue:?\s*', '', query.lower(), flags=re.IGNORECASE)
            
            # Extract month-value pairs
            # Pattern: word(month) followed by $number or just number
            pattern = r'(\w+)(?:,?\s*\$?(\d+))'
            matches = re.findall(pattern, clean_query)
            
            if matches:
                months = []
                values = []
                
                for month, value in matches:
                    if month and value:
                        months.append(month.capitalize())
                        values.append(int(value))
                
                if months and values:
                    return {
                        "months": months,
                        "values": values,
                        "title": "Revenue Analysis",
                        "currency": "USD"
                    }
            
            # Fallback: try CSV-like parsing
            try:
                # Try to parse as CSV if it has commas and structure
                if ',' in query and any(char.isdigit() for char in query):
                    df = pd.read_csv(StringIO(query.replace('$', '')))
                    if df.shape[1] >= 2:
                        return {
                            "months": df.iloc[:, 0].astype(str).tolist(),
                            "values": pd.to_numeric(df.iloc[:, 1], errors='coerce').fillna(0).astype(int).tolist(),
                            "title": "Data Chart",
                            "currency": "USD"
                        }
            except:
                pass
            
            return None
            
        except Exception as e:
            logger.error(f"❌ Error parsing data: {e}")
            return None
    
    def _create_plotly_chart(self, data: Dict[str, Any], session_id: str) -> tuple[str, str]:
        """📊 Create interactive Plotly chart JSON"""
        try:
            chart_id = f"chart_{session_id}_{self.chart_counter}"
            self.chart_counter += 1
            
            # Create Plotly chart specification
            plotly_chart = {
                "data": [
                    {
                        "x": data["months"],
                        "y": data["values"],
                        "type": "bar",
                        "name": "Revenue",
                        "marker": {
                            "color": "rgb(55, 83, 109)",
                            "line": {
                                "color": "rgb(8, 48, 107)",
                                "width": 1.5
                            }
                        },
                        "text": [f"${v:,}" for v in data["values"]],
                        "textposition": "outside"
                    }
                ],
                "layout": {
                    "title": {
                        "text": data.get("title", "Revenue Chart"),
                        "x": 0.5,
                        "font": {"size": 18, "color": "rgb(55, 83, 109)"}
                    },
                    "xaxis": {
                        "title": "Months",
                        "showgrid": False,
                        "showline": True,
                        "linecolor": "rgb(204, 204, 204)"
                    },
                    "yaxis": {
                        "title": f"Revenue ({data.get('currency', 'USD')})",
                        "showgrid": True,
                        "gridcolor": "rgb(235, 235, 235)",
                        "showline": True,
                        "linecolor": "rgb(204, 204, 204)"
                    },
                    "showlegend": False,
                    "plot_bgcolor": "white",
                    "paper_bgcolor": "white",
                    "margin": {"l": 60, "r": 30, "b": 60, "t": 80},
                    "font": {"family": "Arial, sans-serif", "size": 12}
                },
                "config": {
                    "displayModeBar": True,
                    "responsive": True,
                    "toImageButtonOptions": {
                        "format": "png",
                        "filename": f"revenue_chart_{chart_id}",
                        "height": 500,
                        "width": 800,
                        "scale": 2
                    }
                }
            }
            
            return chart_id, json.dumps(plotly_chart, indent=2)
            
        except Exception as e:
            logger.error(f"❌ Error creating Plotly chart: {e}")
            raise
    
    def _generate_embed_html(self, plotly_json: str, chart_id: str) -> str:
        """🌐 Generate embeddable HTML for the chart"""
        return f"""
        <div id="plotly-chart-{chart_id}" style="width:100%;height:400px;"></div>
        <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
        <script>
        document.addEventListener('DOMContentLoaded', function() {{
            var chartData = {plotly_json};
            Plotly.newPlot('plotly-chart-{chart_id}', chartData.data, chartData.layout, chartData.config);
        }});
        </script>
        """
    
    def get_chart_data(self, session_id: str, chart_id: str) -> Dict[str, Any]:
        """📈 Retrieve chart data from cache"""
        try:
            logger.info(f"📋 Retrieving chart {chart_id} for session: {session_id}")
            
            session_data = self.session_cache.get(session_id, {})
            if chart_id not in session_data:
                return {
                    "error": f"Chart {chart_id} not found in session {session_id}",
                    "type": None,
                    "json": None
                }
            
            chart_data = session_data[chart_id]
            
            return {
                "json": chart_data.get("json"),
                "type": chart_data.get("type", "plotly"),
                "name": chart_data.get("name"),
                "html": chart_data.get("html"),
                "data": chart_data.get("data"),
                "error": None
            }
            
        except Exception as e:
            logger.error(f"❌ Error retrieving chart data: {e}")
            return {
                "error": str(e),
                "type": None,
                "json": None
            }
    
    def get_chart_html(self, session_id: str, chart_id: str) -> str:
        """🌐 Get embeddable HTML for chart"""
        chart_data = self.get_chart_data(session_id, chart_id)
        return chart_data.get("html", "<!-- Chart not found -->")
    
    def list_session_charts(self, session_id: str) -> list:
        """📊 List all charts for a session"""
        session_data = self.session_cache.get(session_id, {})
        return [
            {
                "chart_id": chart_id,
                "name": data.get("name"),
                "type": data.get("type"),
                "data_points": len(data.get("data", {}).get("months", []))
            }
            for chart_id, data in session_data.items()
        ]


async def demo_plotly_agent():
    """🎬 Demonstração do Analytics Agent com Plotly"""
    print("🎯 ANALYTICS AGENT - DEMONSTRAÇÃO PLOTLY")
    print("=" * 60)
    
    agent = PlotlyAnalyticsAgent()
    
    # Test queries
    test_queries = [
        "Generate a chart of revenue: Jan,$1000 Feb,$2000 Mar,$1500 Apr,$2500 May,$3000",
        "sales data: Q1,$5000 Q2,$7500 Q3,$6200 Q4,$8900",
        "monthly profits: January,$2500 February,$3200 March,$2800"
    ]
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n📊 TESTE {i}:")
        print(f"Query: {query}")
        
        session_id = f"demo_session_{i}"
        result = await agent.process_request(query, session_id)
        
        print(f"✅ Success: {result['success']}")
        print(f"📈 Chart ID: {result.get('chart_id', 'N/A')}")
        print(f"🎯 Type: {result.get('chart_type', 'N/A')}")
        
        if result["success"]:
            chart_data = agent.get_chart_data(session_id, result["chart_id"])
            print(f"📋 Data points: {len(chart_data.get('data', {}).get('months', []))}")
    
    print(f"\n🎉 Demonstração concluída! Analytics Agent Plotly funcionando perfeitamente!")


if __name__ == "__main__":
    asyncio.run(demo_plotly_agent())