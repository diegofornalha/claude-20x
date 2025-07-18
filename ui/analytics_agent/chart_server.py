#!/usr/bin/env python3
"""
🌐 Chart Server - Servidor HTTP para Charts do Analytics Agent

Servidor simples que torna os charts clicáveis via HTTP ao invés de file://
Resolve problemas de segurança e compatibilidade dos links file://

Uso:
    python chart_server.py
    
Links gerados:
    http://localhost:8080/charts/analytics_chart_[id].html
    http://localhost:8080/download/[id].html
"""

import os
import sys
import asyncio
import logging
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuração
CHARTS_DIR = "/tmp"
SERVER_PORT = 8080
SERVER_HOST = "localhost"

app = FastAPI(
    title="Analytics Agent Chart Server",
    description="Servidor HTTP para charts gerados pelo Analytics Agent",
    version="1.0.0"
)

# Middleware CORS para acesso universal
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Página inicial do servidor de charts"""
    return HTMLResponse(content="""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Analytics Agent Chart Server</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            h1 { color: #333; text-align: center; }
            .status { background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745; }
            .info { background: #cce5ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
            code { background: #f8f9fa; padding: 2px 5px; border-radius: 3px; font-family: monospace; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 Analytics Agent Chart Server</h1>
            
            <div class="status">
                <h3>✅ Servidor Ativo</h3>
                <p>O servidor de charts está funcionando corretamente!</p>
            </div>
            
            <div class="info">
                <h3>📊 Como Usar</h3>
                <p>Este servidor torna os charts do Analytics Agent clicáveis via HTTP:</p>
                <ul>
                    <li><strong>Charts:</strong> <code>http://localhost:8080/charts/[chart_id].html</code></li>
                    <li><strong>Download:</strong> <code>http://localhost:8080/download/[chart_id].html</code></li>
                    <li><strong>Status:</strong> <code>http://localhost:8080/status</code></li>
                </ul>
            </div>
            
            <div class="info">
                <h3>🎯 Vantagens dos Links HTTP</h3>
                <ul>
                    <li>✅ Universalmente clicáveis</li>
                    <li>✅ Sem restrições file://</li>
                    <li>✅ Funcionam em qualquer UI</li>
                    <li>✅ Abrem em nova aba</li>
                </ul>
            </div>
        </div>
    </body>
    </html>
    """)


@app.get("/status")
async def status():
    """Status do servidor e estatísticas de charts"""
    charts_count = len([f for f in os.listdir(CHARTS_DIR) if f.startswith("analytics_chart_") and f.endswith(".html")])
    hybrid_charts_count = len([f for f in os.listdir(CHARTS_DIR) if f.startswith("hybrid_analytics_chart_") and f.endswith(".html")])
    
    return {
        "status": "active",
        "server": f"http://{SERVER_HOST}:{SERVER_PORT}",
        "charts_directory": CHARTS_DIR,
        "charts_available": charts_count,
        "hybrid_charts_available": hybrid_charts_count,
        "total_charts": charts_count + hybrid_charts_count,
        "endpoints": {
            "charts": f"http://{SERVER_HOST}:{SERVER_PORT}/charts/[chart_id].html",
            "download": f"http://{SERVER_HOST}:{SERVER_PORT}/download/[chart_id].html",
            "list": f"http://{SERVER_HOST}:{SERVER_PORT}/list"
        }
    }


@app.get("/charts/{chart_filename}")
async def serve_chart(chart_filename: str):
    """Serve um chart específico via HTTP"""
    # Verificar se o arquivo existe
    chart_path = Path(CHARTS_DIR) / chart_filename
    
    if not chart_path.exists():
        # Tentar variações de nome
        possible_names = [
            f"analytics_chart_{chart_filename}",
            f"hybrid_analytics_chart_{chart_filename}",
            f"analytics_chart_{chart_filename}.html",
            f"hybrid_analytics_chart_{chart_filename}.html"
        ]
        
        for name in possible_names:
            possible_path = Path(CHARTS_DIR) / name
            if possible_path.exists():
                chart_path = possible_path
                break
        else:
            logger.warning(f"Chart não encontrado: {chart_filename}")
            raise HTTPException(status_code=404, detail=f"Chart não encontrado: {chart_filename}")
    
    logger.info(f"Servindo chart: {chart_path}")
    return FileResponse(
        path=chart_path,
        media_type="text/html",
        headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
    )


@app.get("/download/{chart_id}")
async def download_chart(chart_id: str):
    """Download direto do chart como arquivo HTML"""
    chart_filename = f"analytics_chart_{chart_id}.html"
    chart_path = Path(CHARTS_DIR) / chart_filename
    
    # Tentar também versão híbrida
    if not chart_path.exists():
        chart_filename = f"hybrid_analytics_chart_{chart_id}.html"
        chart_path = Path(CHARTS_DIR) / chart_filename
    
    if not chart_path.exists():
        raise HTTPException(status_code=404, detail=f"Chart não encontrado: {chart_id}")
    
    return FileResponse(
        path=chart_path,
        media_type="application/octet-stream",
        filename=chart_filename,
        headers={"Content-Disposition": f"attachment; filename={chart_filename}"}
    )


@app.get("/list")
async def list_charts():
    """Lista todos os charts disponíveis"""
    try:
        all_files = os.listdir(CHARTS_DIR)
        chart_files = [f for f in all_files if (f.startswith("analytics_chart_") or f.startswith("hybrid_analytics_chart_")) and f.endswith(".html")]
        
        charts = []
        for filename in sorted(chart_files):
            file_path = Path(CHARTS_DIR) / filename
            file_stats = file_path.stat()
            
            # Extrair chart ID do nome do arquivo
            chart_id = filename.replace("analytics_chart_", "").replace("hybrid_analytics_chart_", "").replace(".html", "")
            
            charts.append({
                "filename": filename,
                "chart_id": chart_id,
                "size": file_stats.st_size,
                "created": file_stats.st_ctime,
                "url": f"http://{SERVER_HOST}:{SERVER_PORT}/charts/{filename}",
                "download_url": f"http://{SERVER_HOST}:{SERVER_PORT}/download/{chart_id}"
            })
        
        return {
            "total_charts": len(charts),
            "charts": charts
        }
    
    except Exception as e:
        logger.error(f"Erro ao listar charts: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao listar charts: {e}")


async def start_server():
    """Inicia o servidor de charts"""
    config = uvicorn.Config(
        app,
        host=SERVER_HOST,
        port=SERVER_PORT,
        log_level="info"
    )
    server = uvicorn.Server(config)
    
    logger.info(f"🌐 Iniciando Chart Server em http://{SERVER_HOST}:{SERVER_PORT}")
    logger.info(f"📁 Servindo charts de: {CHARTS_DIR}")
    
    await server.serve()


def main():
    """Função principal"""
    print("🌐 Analytics Agent Chart Server")
    print("=" * 50)
    print(f"📊 Servidor: http://{SERVER_HOST}:{SERVER_PORT}")
    print(f"📁 Diretório: {CHARTS_DIR}")
    print("🚀 Iniciando servidor...")
    print("=" * 50)
    
    try:
        asyncio.run(start_server())
    except KeyboardInterrupt:
        print("\n👋 Servidor encerrado pelo usuário")
    except Exception as e:
        print(f"❌ Erro ao iniciar servidor: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()