// Exemplo de servidor HTTP com Deno
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // Rota principal
    if (url.pathname === "/") {
      return new Response(`
        <html>
          <head>
            <title>Deno Server</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                max-width: 800px; 
                margin: 50px auto; 
                padding: 20px;
              }
              h1 { color: #333; }
              .info { background: #f0f0f0; padding: 15px; border-radius: 5px; }
              code { background: #e0e0e0; padding: 2px 5px; border-radius: 3px; }
            </style>
          </head>
          <body>
            <h1>🦕 Servidor Deno Funcionando!</h1>
            <div class="info">
              <p>Este servidor está rodando com <code>deno serve</code></p>
              <p>Horário: ${new Date().toLocaleString('pt-BR')}</p>
              <p>Rotas disponíveis:</p>
              <ul>
                <li><a href="/">/</a> - Esta página</li>
                <li><a href="/api/hello">/api/hello</a> - API de exemplo</li>
                <li><a href="/api/info">/api/info</a> - Informações do sistema</li>
              </ul>
            </div>
          </body>
        </html>
      `, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    
    // Rota API hello
    if (url.pathname === "/api/hello") {
      return Response.json({
        message: "Olá do Deno! 🦕",
        timestamp: new Date().toISOString(),
      });
    }
    
    // Rota API info
    if (url.pathname === "/api/info") {
      return Response.json({
        deno: {
          version: Deno.version.deno,
          v8: Deno.version.v8,
          typescript: Deno.version.typescript,
        },
        platform: Deno.build.os,
        arch: Deno.build.arch,
        uptime: performance.now() / 1000,
      });
    }
    
    // 404 para rotas não encontradas
    return new Response("404 - Página não encontrada", { status: 404 });
  },
}