# Veo3 Agent - Configuração

## 🔐 Configuração da API Key do Google

### Método 1: Variáveis de Ambiente (Recomendado)

1. **Edite o arquivo `.env`** na pasta do projeto:
   ```bash
   # Substitua 'sua_api_key_aqui' pela sua API key real
   GOOGLE_API_KEY=sua_api_key_real_aqui
   ```

2. **Outras configurações opcionais no `.env`**:
   ```bash
   GOOGLE_PROJECT_ID=seu_project_id
   GOOGLE_LOCATION_ID=us-central1
   VEO3_MODEL_ID=veo-3.0-generate-preview
   ```

### Método 2: Arquivo de Configuração JSON

Edite o arquivo `a2a-config.json`:
```json
{
  "api_key": "sua_api_key_aqui",
  "project_id": "gen-lang-client-0313251790",
  "location_id": "us-central1",
  "model_id": "veo-3.0-generate-preview"
}
```

## 🔒 Segurança

- ✅ **O arquivo `.env` está no `.gitignore`** - nunca será commitado
- ✅ **Use `.env.example`** como template para outros desenvolvedores
- ❌ **NUNCA** commite API keys no código
- ❌ **NUNCA** commite o arquivo `.env`

## 🚀 Como Usar

### Instalação das Dependências
```bash
cd /Users/agents/Desktop/codex/agents/veo3
pip install -e .
```

### Uso Básico
```bash
# Modo interativo
python main.py --interactive

# Geração direta
python main.py --generate "Um gato brincando no jardim"

# Verificar status
python main.py --status "operation_id_aqui"

# Buscar resultados
python main.py --fetch "operation_id_aqui"
```

### Uso Programático
```python
from agent import Veo3Agent

# O agente carregará automaticamente do .env
agent = Veo3Agent()

# Gerar vídeo
result = await agent.generate_video("Prompt do seu vídeo")
print(result['operation_id'])

# Verificar status
status = await agent.check_operation_status(operation_id)

# Buscar vídeo quando pronto
if status['done']:
    videos = await agent.fetch_video_results(operation_id)
```

## 📁 Estrutura de Arquivos

```
veo3/
├── .env                    # 🔐 Suas configurações (não versionar)
├── .env.example           # 📝 Template de configuração
├── .gitignore             # 🚫 Arquivos ignorados pelo git
├── CONFIG.md              # 📖 Este arquivo
├── agent.py               # 🤖 Código principal do agente
├── main.py                # 🎯 Interface CLI
├── pyproject.toml         # 📦 Configuração do projeto Python
└── generated_videos/      # 🎬 Vídeos gerados (criado automaticamente)
```

## ⚠️ Troubleshooting

### Erro: "Google API key not found"
- Verifique se o arquivo `.env` existe
- Confirme que `GOOGLE_API_KEY=sua_key` está correto
- Teste: `python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('GOOGLE_API_KEY'))"`

### Erro: "Failed to authenticate with Google Cloud"
- Instale gcloud CLI: `brew install google-cloud-sdk`
- Faça login: `gcloud auth login`
- Configure projeto: `gcloud config set project seu-project-id`

### Vídeos não são salvos
- Verifique permissões da pasta `generated_videos/`
- Confirme espaço em disco disponível