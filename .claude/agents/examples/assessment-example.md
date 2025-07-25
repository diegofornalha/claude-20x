# 🎯 Exemplo Prático - Behavioral Assessment Specialist

## Como Usar o Agente de Avaliação Comportamental

### 1. **Iniciar Avaliação Simples**

```bash
Task("You are behavioral-assessment-specialist. 

I need to conduct a behavioral assessment for a sales position. The candidate is here and ready.

Start with a warm introduction and then begin breaking down these 10 complex questions into simple, conversational micro-questions:

1. Como você decide quais clientes em potencial deve priorizar nas suas negociações?
2. O que você faz para entender o que o cliente precisa, mesmo quando ele não fala diretamente?
3. De que forma você ajusta sua forma de se comunicar para se conectar melhor com o perfil de cada cliente?
4. Você pode contar sobre um acompanhamento que funcionou e levou a uma venda mesmo depois de um tempo de silêncio do cliente?
5. Já aconteceu de você mudar de ideia sobre alguma negociação ou estratégia depois de receber novas informações? Como foi?
6. Pode dar um exemplo de como você usa números e dados para tomar decisões nas suas vendas?
7. Como você acompanha as novidades do mercado e coloca isso em prática nas suas estratégias de venda?
8. O que te ajuda a manter a motivação quando os resultados de vendas estão baixos ou as metas estão difíceis?
9. Se você tivesse que explicar algo mais técnico ou complicado para alguém leigo, como faria isso?
10. Como você lida com situações em que precisa resolver um problema, mas ainda não tem todas as informações disponíveis?

Please:
1. Start with friendly introduction
2. Ask ONE micro-question at a time
3. Wait for my response before proceeding
4. Keep track of all answers
5. After we go through all topics, compile a structured report")
```

### 2. **Exemplo de Interação**

**Assessment Specialist**: "Olá! Muito prazer, sou o especialista em avaliação comportamental. Antes de começarmos nossa conversa, quero que você saiba que isso não é uma entrevista formal - é mais um bate-papo para nos conhecermos melhor. Fique à vontade! 😊

Para começar, me conta um pouquinho sobre você - há quanto tempo você trabalha com vendas?"

**Candidato**: "Trabalho com vendas há 5 anos, comecei como SDR e hoje sou Account Executive."

**Assessment Specialist**: "Que legal! 5 anos de experiência, começando como SDR - essa é uma trajetória bem sólida. O que você mais gosta no seu trabalho atual como Account Executive?"

**Candidato**: "Gosto muito de construir relacionamentos longos com os clientes e ver o impacto do nosso produto no negócio deles."

**Assessment Specialist**: "Adorei essa visão de parceria! Aproveitando que você mencionou relacionamentos com clientes... No seu dia a dia, quantos clientes ou leads novos você costuma atender por semana, mais ou menos?"

**[A conversa continua de forma natural...]**

### 3. **Como o Agente Decompõe as Perguntas**

#### Pergunta Original:
"Como você decide quais clientes em potencial deve priorizar nas suas negociações?"

#### Micro-perguntas do Agente:
1. "Quantos leads novos você recebe por semana?"
2. "Quando chega um lead novo, qual é a primeira coisa que você olha?"
3. "Você usa alguma planilha ou sistema pra organizar?"
4. "Me conta de um cliente recente que você colocou como prioridade - por que escolheu ele?"
5. "E tem algum tipo de cliente que você normalmente deixa para depois?"

### 4. **Output Final Estruturado**

Após toda a conversa, o agente compila:

```markdown
# Relatório de Avaliação Comportamental
**Candidato**: [Nome]
**Data**: [Data]
**Posição**: Account Executive

## 1. Priorização de Clientes

**Como decide quais clientes priorizar:**

O candidato demonstrou uma abordagem estruturada:
- Volume: Gerencia cerca de 40 leads/semana
- Critérios principais:
  - Tamanho da empresa (foco em empresas 100+ funcionários)
  - Urgência demonstrada (projetos com deadline)
  - Budget disponível confirmado
- Usa Salesforce com scoring automático
- Exemplo: Priorizou empresa de e-commerce em expansão com urgência para Black Friday

**Insights**: Equilibra bem intuição comercial com dados objetivos.

[Continua para todas as 10 perguntas...]

## Resumo das Competências

✅ **Pontos Fortes**:
- Excelente gestão de pipeline
- Comunicação adaptativa comprovada
- Resiliência em momentos difíceis
- Orientação analítica para decisões

📈 **Oportunidades de Desenvolvimento**:
- Aprofundar técnicas de social selling
- Explorar mais ferramentas de sales intelligence

## Recomendação
Candidato altamente qualificado com perfil consultivo e analítico...
```

### 5. **Comandos Úteis Durante a Avaliação**

**Para pedir mais detalhes:**
```
"Interessante! Pode me dar mais detalhes sobre como você fez isso?"
```

**Para mudar de tópico:**
```
"Ótimo! Agora vamos falar um pouco sobre como você se comunica com diferentes clientes..."
```

**Para compilar antes do final:**
```
"Show! Já temos bastante informação. Deixa eu compilar tudo que conversamos em um relatório estruturado..."
```

### 6. **Usando com Memória Persistente**

```bash
# Para salvar progresso da avaliação
Task("You are behavioral-assessment-specialist. 

Save our conversation progress to memory with key 'assessment_[candidate_name]_[date]'.

We completed questions 1-5, now let's continue with question 6 about using data in sales decisions.")

# Para retomar depois
Task("You are behavioral-assessment-specialist.

Retrieve our previous assessment from memory key 'assessment_joão_silva_2024-01-25' and continue from where we stopped.")
```

### 7. **Modo Express (30 minutos)**

```bash
Task("You are behavioral-assessment-specialist.

I have only 30 minutes for this assessment. Please:
1. Focus on the TOP 5 most important behavioral questions
2. Ask only 2-3 micro-questions per topic
3. Still maintain conversational tone
4. Provide a concise but complete report at the end")
```

### 8. **Personalização por Indústria**

```bash
Task("You are behavioral-assessment-specialist.

The candidate is from the SaaS B2B industry selling to enterprise clients.

Please adapt your micro-questions to include:
- Enterprise sales cycle specifics
- Complex stakeholder management
- Technical product demonstrations
- Contract negotiation experiences

Start the assessment now.")
```

## 🎯 Dicas para Melhores Resultados

1. **Seja Natural**: Responda como se estivesse numa conversa normal
2. **Dê Exemplos**: O agente vai pedir, mas exemplos específicos enriquecem a avaliação
3. **Seja Honesto**: O objetivo é entender seu perfil real
4. **Pergunte Também**: É uma conversa - sinta-se livre para fazer perguntas
5. **Tempo Ideal**: Reserve 45-60 minutos para uma avaliação completa

## 📊 Benefícios do Método

- **Menos Pressão**: Perguntas simples são menos intimidadoras
- **Mais Profundidade**: Micro-perguntas revelam mais detalhes
- **Melhor Experiência**: Candidato se sente mais confortável
- **Insights Reais**: Respostas mais autênticas e detalhadas
- **Avaliação Justa**: Cobre todas as competências sistematicamente

O Behavioral Assessment Specialist transforma avaliações complexas em conversas produtivas e agradáveis! 🎯