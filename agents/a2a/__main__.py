"""
Entry point para execução do A2A Agent como módulo.

Usage:
    python -m a2a_agent
    python -m a2a_agent --port 9996
    python -m a2a_agent --help
"""

import argparse
import asyncio
import logging
import sys
from pathlib import Path

# Adiciona o diretório do agente ao Python path
sys.path.insert(0, str(Path(__file__).parent))

from agent import A2AAgent

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('a2a_agent.log')
    ]
)

logger = logging.getLogger(__name__)


async def run_agent_interactive():
    """Executa o agente em modo interativo para testes."""
    agent = A2AAgent()
    
    print("🤝 A2A Agent - Agent-to-Agent Communication Hub")
    print("=" * 50)
    print("Digite comandos para interagir com o agente:")
    print("- 'discovery' para descobrir agentes")
    print("- 'registry' para ver agentes registrados") 
    print("- 'health' para verificar saúde dos agentes")
    print("- 'capabilities' para listar capacidades")
    print("- 'status' para status do agente")
    print("- 'help' para ajuda")
    print("- 'exit' para sair")
    print("=" * 50)
    
    while True:
        try:
            user_input = input("\n🤝 A2A> ").strip()
            
            if user_input.lower() in ['exit', 'quit', 'bye']:
                print("👋 Encerrando A2A Agent...")
                break
                
            if not user_input:
                continue
                
            # Processa o comando através do agente
            result = await agent.process_a2a_request(
                query=user_input,
                context_id=f"interactive_{asyncio.get_event_loop().time()}"
            )
            
            if result.get("success", False):
                print(f"\n{result['result']}")
            else:
                print(f"\n❌ Erro: {result.get('result', 'Erro desconhecido')}")
                
        except KeyboardInterrupt:
            print("\n👋 Encerrando A2A Agent...")
            break
        except Exception as e:
            logger.exception(f"Erro no modo interativo: {e}")
            print(f"\n❌ Erro interno: {str(e)}")


def main():
    """Função principal do módulo."""
    parser = argparse.ArgumentParser(
        description="A2A Agent - Agent-to-Agent Communication Hub"
    )
    
    parser.add_argument(
        "--port",
        type=int,
        default=9996,
        help="Porta para executar o servidor (padrão: 9996)"
    )
    
    parser.add_argument(
        "--interactive",
        action="store_true",
        help="Executa em modo interativo para testes"
    )
    
    parser.add_argument(
        "--log-level",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        default="INFO",
        help="Nível de logging (padrão: INFO)"
    )
    
    args = parser.parse_args()
    
    # Configura nível de logging
    logging.getLogger().setLevel(getattr(logging, args.log_level))
    
    logger.info(f"🤝 Iniciando A2A Agent (porta: {args.port})")
    
    if args.interactive:
        # Modo interativo
        try:
            asyncio.run(run_agent_interactive())
        except KeyboardInterrupt:
            logger.info("A2A Agent encerrado pelo usuário")
    else:
        # Modo servidor (futura implementação)
        logger.info("🚧 Modo servidor em desenvolvimento")
        logger.info("💡 Use --interactive para teste interativo")
        print("🚧 Modo servidor em desenvolvimento")
        print("💡 Use 'python -m a2a_agent --interactive' para teste")


if __name__ == "__main__":
    main()