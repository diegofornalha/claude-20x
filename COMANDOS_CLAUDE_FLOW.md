# Comandos Claude Flow

Este documento reúne os principais comandos utilizados com o Claude Flow/SPARC, explicando cada um deles para facilitar o uso e automação do seu ambiente de desenvolvimento.

---

## 1. Inicialização do Ambiente SPARC

### Comando:
```bash
npx claude-flow init --sparc --force
```
**Descrição:**
- Inicializa o ambiente do Claude Flow com suporte total ao SPARC.
- Cria arquivos e diretórios essenciais para a orquestração de agentes, memória, coordenação e comandos customizados.
- O parâmetro `--force` sobrescreve arquivos existentes (como CLAUDE.md) caso já existam na pasta.
- Após rodar este comando, você terá toda a estrutura pronta para usar os modos SPARC e recursos do Claude Flow.

---

## 2. Iniciar o Orquestrador e a Interface Web

### Comando:
```bash
claude-flow start --ui
```
**Descrição:**
- Inicia o sistema de orquestração do Claude Flow.
- O parâmetro `--ui` abre a interface web para monitoramento e controle dos agentes.
- Exibe o endereço da interface web (ex: http://localhost:3000/console).

---

## 3. Listar Modos SPARC Disponíveis

### Comando:
```bash
npx claude-flow sparc modes
```
**Descrição:**
- Lista todos os modos SPARC disponíveis para automação de tarefas, como arquitetura, TDD, documentação, segurança, etc.
- Útil para descobrir as opções de automação e desenvolvimento assistido por IA.

---

## 4. Obter Informações de um Modo SPARC

### Comando:
```bash
npx claude-flow sparc info <modo>
```
**Descrição:**
- Mostra detalhes sobre um modo SPARC específico (exemplo: `spec-pseudocode`, `architect`, `tdd`, etc).
- Exibe a função, instruções e exemplos de uso daquele modo.

---

## 5. Executar um Modo SPARC

### Comando:
```bash
npx claude-flow sparc run <modo> "<objetivo>"
```
**Descrição:**
- Executa um modo SPARC para realizar uma tarefa específica com auxílio da IA.
- Exemplo: `npx claude-flow sparc run tdd "criar testes para login"`
- OBS: Atualmente, pode apresentar erro "Deno is not defined" se houver problema de integração com o runtime Deno.

---

## 6. Verificar Versão do Claude Flow

### Comando:
```bash
npx claude-flow --version
```
**Descrição:**
- Exibe a versão instalada do Claude Flow.
- Útil para checar se está usando a versão mais recente ou compatível.

---

## 7. Verificar se o Deno está Instalado

### Comando:
```bash
which deno && deno --version
```
**Descrição:**
- Verifica se o runtime Deno está instalado e disponível no PATH.
- O Deno é necessário para execução de alguns modos SPARC.

---

## 8. Executar o Claude Flow Localmente

### Comando:
```bash
./claude-flow sparc run <modo> "<objetivo>"
```
**Descrição:**
- Após a inicialização, é possível usar o executável local `./claude-flow` para rodar comandos sem o npx.
- Exemplo: `./claude-flow sparc run tdd "criar testes para login"`

---

## Observações
- Sempre garanta que o Deno está instalado e no PATH para evitar erros de execução.
- Consulte a documentação oficial para mais detalhes: https://github.com/ruvnet/claude-flow 