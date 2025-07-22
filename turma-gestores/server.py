#!/usr/bin/env python3
"""
Servidor HTTP simples para servir arquivos estáticos na porta 4444
"""
import http.server
import socketserver
import os
import sys

PORT = 4444

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

def main():
    try:
        # Mudar para o diretório do script
        os.chdir(os.path.dirname(os.path.abspath(__file__)))
        
        with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
            print(f"🚀 Servidor rodando na porta {PORT}")
            print(f"📱 Acesse: http://localhost:{PORT}")
            print("Press Ctrl+C to stop the server")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Servidor interrompido pelo usuário")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Porta {PORT} já está em uso!")
            sys.exit(1)
        else:
            raise

if __name__ == "__main__":
    main()