# 🏖️ Sia — Agente de Pré-Qualificação de Terrenos (Seazone IA)

> **Desafio Técnico: Engenheiro de Prompt — Sia (Módulo Terrenos)**

Playground interativo para a **Sia (Seazone IA)**, uma agente conversacional de pré-qualificação de terrenos que atua como _Concierge de Alta Performance_. A Sia conduz conversas naturais com corretores e proprietários, valida geograficamente os bairros de interesse, coleta dados do terreno e gera uma saída estruturada JSON para integração com CRM via N8N.

O projeto é uma aplicação **Next.js 16** (App Router) com streaming de LLMs (GPT-4.1, GPT-5.2, Gemini 3 Flash) via **Vercel AI SDK v6**, integração com a **Google Places API** para busca de endereços em tempo real, e um painel completo para visualização de resultados (validação geográfica, qualificação do lead, uso de tokens e estimativa de custo).

<p align="center" width="100%">
<video src="https://github.com/user-attachments/assets/50d8e21f-52e4-45ed-abf0-105aff66fb9c" width="100%" controls></video>
</p>


---

## 📋 Índice

1. [Como Rodar](#-como-rodar)
2. [Tecnologias Utilizadas](#-tecnologias-utilizadas)
3. [Entrega do Desafio Técnico](#-entrega-do-desafio-técnico)
   - [1. System Prompt (Instrução de Sistema)](#1-system-prompt-instrução-de-sistema)
   - [2. Evidência de Teste](#2-evidência-de-teste-cenários-pré-carregados)
   - [3. Saída Estruturada JSON](#3-saída-estruturada-json-schema)
   - [4. Guardrails e Defesa Técnica](#4-guardrails-e-defesa-técnica)
4. [Arquitetura e Fluxo do Código](#-arquitetura-e-fluxo-do-código)
   - [Estrutura de Pastas](#estrutura-de-pastas)
   - [Fluxo Completo de uma Conversa](#fluxo-completo-de-uma-conversa)
   - [Detalhamento dos Componentes](#detalhamento-dos-componentes)
5. [Features Extras](#-features-extras-além-do-desafio)

---

## 🚀 Como Rodar

### Pré-requisitos

- **Node.js** ≥ 18
- Chave de API da **OpenAI** (`OPENAI_API_KEY`)
- Chave de API do **Google AI** (`GOOGLE_GENERATIVE_AI_API_KEY`) — para modelos Gemini
- Chave de API do **Google Places** (`GOOGLE_PLACES_API_KEY`) — para busca de endereços

### Instalação

```bash
# Clone o repositório
git clone https://github.com/andreocunha/project-sia.git
cd project-sia

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
```

Edite o `.env.local` com suas chaves:

```env
OPENAI_API_KEY=sk-...
GOOGLE_GENERATIVE_AI_API_KEY=AI...
GOOGLE_PLACES_API_KEY=AI...
```

### Executando

```bash
# Modo desenvolvimento
npm run dev

# Build de produção
npm run build && npm start
```

Acesse **http://localhost:3000/desafio-tecnico-sia** para abrir o playground da Sia.

---

## 🛠 Tecnologias Utilizadas

| Tecnologia | Versão | Uso |
|---|---|---|
| **Next.js** | 16.1.6 | Framework React com App Router e API Routes |
| **Vercel AI SDK** | 6.0.77 | Streaming de LLMs, tools, conversão de mensagens |
| **@ai-sdk/react** | 3.0.79 | Hook `useChat` para gerenciamento de conversa |
| **@ai-sdk/openai** | 3.0.26 | Provider OpenAI (GPT-4.1, GPT-5.2) |
| **@ai-sdk/google** | 3.0.22 | Provider Google (Gemini 3 Flash) |
| **Zod** | 4.3.6 | Validação de schemas das tools |
| **Tailwind CSS** | 4.x | Estilização |
| **React Markdown** | 10.1.0 | Renderização de Markdown nas mensagens |
| **Lucide React** | 0.563.0 | Ícones |
| **Google Places API** | Legacy | Autocomplete e detalhes de endereço |

---

## 📝 Entrega do Desafio Técnico

### 1. System Prompt (Instrução de Sistema)

O System Prompt completo está definido em [`app/desafio-tecnico-sia/_lib/constants.ts`](app/desafio-tecnico-sia/_lib/constants.ts) na constante `SIA_SYSTEM_PROMPT`. Ele é editável em tempo real pela barra lateral do playground.

#### Persona: Concierge de Alta Performance

O prompt define a Sia como uma agente consultiva, profissional e ágil, que entende de mercado imobiliário e nunca é prolixa:

```typescript
// app/desafio-tecnico-sia/_lib/constants.ts

export const SIA_SYSTEM_PROMPT = `Você é a **Sia** (Seazone IA), Agente de Pré-Qualificação de terrenos da Seazone,
concierge de alta performance especializada em mercado imobiliário.

## Persona
- Tom consultivo, profissional, ágil e acolhedora.
- Respostas curtas e diretas, o usuário (corretor ou proprietário) está sempre com pressa.
- Nunca seja prolixa. Vá direto ao ponto.
- Demonstre conhecimento de mercado imobiliário quando relevante, em poucas palavras.
...`;
```

#### Regra de Uma Pergunta por Vez

Uma das técnicas centrais para evitar que a IA sobrecarregue o usuário é a **restrição explícita de uma pergunta por mensagem**, com exemplos positivos e negativos:

```
## REGRA ABSOLUTA: UMA PERGUNTA POR VEZ
- SEMPRE faça apenas **UMA** pergunta por mensagem. NUNCA duas ou mais.
- O usuário não vai responder múltiplas perguntas de uma vez. Isso cria uma experiência ruim.
- Após receber a resposta, faça a próxima pergunta na mensagem seguinte.
- Exemplo ERRADO: "Qual o tamanho do terreno? E qual o valor pedido?"
- Exemplo CERTO: "Qual o tamanho do terreno em m²?"
```

#### Coleta de Dados (5 Data Points)

O prompt instrui a Sia a coletar de forma fluida:

1. **Localização exata** — via buscador de endereço integrado (tool `requestLocation`)
2. **Tamanho do terreno** — em m²
3. **Valor pedido** — preço de venda em R$
4. **Situação jurídica** — possui escritura pública?
5. **Diferencial** — frente mar ou vista mar?

#### Fluxo Obrigatório com Tools

O prompt define um fluxo rígido que garante a ordem de coleta e validação:

```
## Fluxo Obrigatório
1. Cumprimente brevemente e pergunte sobre o terreno (identifique se é corretor ou proprietário).
2. Colete a localização PRIMEIRO. OBRIGATORIAMENTE chame a tool 'requestLocation'.
3. Quando o usuário enviar o endereço, OBRIGATORIAMENTE use a tool 'validateLocation' para validar.
4. Se a localização for REJEITADA: decline educadamente e encerre. NÃO continue coletando dados.
5. Se APROVADA: colete os demais dados um a um, uma pergunta por vez.
6. Ao ter TODOS os 5 dados, use a tool 'submitQualification' para gerar a saída estruturada.
```

---

### 2. Evidência de Teste (Cenários Pré-Carregados)

Em vez de apenas screenshots, o projeto inclui **3 cenários de teste pré-carregados** que podem ser executados diretamente no playground, acessíveis pelo botão 🧪 no cabeçalho. Cada cenário simula uma conversa completa com as tool calls reais.

Os cenários estão definidos em [`app/desafio-tecnico-sia/_lib/test-cases.ts`](app/desafio-tecnico-sia/_lib/test-cases.ts):

#### Cenário 1: ✅ Sucesso — Campeche

Simula um corretor com terreno no Campeche. Fluxo completo:
1. Corretor informa interesse → Sia chama `requestLocation`
2. Usuário seleciona endereço → Sia chama `validateLocation` → **Aprovado** (Foco: Airbnb)
3. Sia coleta: 450 m², R$ 1.200.000, escritura pública, vista mar (sem frente mar)
4. Sia chama `submitQualification` → JSON gerado com `next_step: "agendar_reuniao"`

#### Cenário 2: ❌ Rejeição — Rio Tavares

Simula um proprietário com terreno no Rio Tavares (bairro fora da lista):
1. Proprietário informa interesse → Sia chama `requestLocation`
2. Usuário seleciona Rio Tavares → Sia chama `validateLocation` → **Rejeitado**
3. Sia declina educadamente, lista os bairros de foco e envia link de fallback
4. Conversa encerrada — nenhum dado adicional coletado

#### Cenário 3: ✅ Sucesso — Jurerê Internacional

Simula um corretor com terreno em Jurerê Internacional:
1. Fluxo idêntico ao Cenário 1
2. Validação aprovada (Foco: Luxo e alto padrão)
3. Dados coletados: 800 m², R$ 5.500.000, escritura pública, frente mar
4. JSON gerado com `next_step: "enviar_estudo"`

Cada cenário carrega mensagens, tool calls com inputs/outputs reais e resultados visuais no painel lateral.

---

### 3. Saída Estruturada JSON (Schema)

A tool `submitQualification` (definida em [`app/api/chat/route.ts`](app/api/chat/route.ts)) gera o JSON seguindo rigorosamente o schema solicitado. O schema é validado pelo **Zod** no servidor:

```typescript
// app/api/chat/route.ts

tools.submitQualification = tool({
  description: "Gera a saída estruturada JSON da qualificação do lead...",
  inputSchema: z.object({
    lead_qualified: z.boolean(),
    owner_type: z.enum(["corretor", "proprietario"]),
    bairro: z.string(),
    cidade: z.string(),
    land_size_m2: z.number(),
    asking_price: z.number(),
    legal_status: z.string(),
    has_sea_view: z.boolean(),
    is_beachfront: z.boolean(),
    next_step: z.enum(["agendar_reuniao", "enviar_estudo", "disqualified"]),
  }),
  execute: async (data) => {
    // Busca o foco do bairro e monta o JSON final
    return {
      lead_qualified: data.lead_qualified,
      owner_type: data.owner_type,
      location: { bairro: data.bairro, cidade: data.cidade },
      land_size_m2: data.land_size_m2,
      asking_price: data.asking_price,
      legal_status: data.legal_status,
      has_sea_view: data.has_sea_view,
      is_beachfront: data.is_beachfront,
      neighborhood_focus: neighborhoodInfo?.[1]?.focus || undefined,
      next_step: data.next_step,
    };
  },
});
```

**Exemplo de saída gerada (Cenário 1 — Campeche):**

```json
{
  "lead_qualified": true,
  "owner_type": "corretor",
  "location": {
    "bairro": "Campeche",
    "cidade": "Florianópolis"
  },
  "land_size_m2": 450,
  "asking_price": 1200000,
  "legal_status": "Escritura pública",
  "has_sea_view": true,
  "is_beachfront": false,
  "neighborhood_focus": "Rentabilidade de curto prazo / Airbnb",
  "next_step": "agendar_reuniao"
}
```

O JSON é exibido visualmente no **Painel de Resultados** através do componente [`qualification-card.tsx`](app/desafio-tecnico-sia/_components/qualification-card.tsx), que renderiza os dados em cards estilizados com indicadores visuais (✓ qualificado / ✗ desqualificado) e badges de próximo passo.

---

### 4. Guardrails e Defesa Técnica

#### Prevenção de Alucinações Geográficas

A Sia **nunca** aceita um bairro apenas por texto. O fluxo obrigatório impõe duas camadas de proteção:

**Camada 1 — Tool `requestLocation`:** Força o usuário a buscar o endereço em um buscador integrado (Google Places), impedindo localizações vagas como "perto da praia".

**Camada 2 — Tool `validateLocation`:** Toda localização passa por validação server-side com _fuzzy matching_ (match exato, por aliases e parcial):

```typescript
// app/api/chat/route.ts — Validação com fuzzy matching

const ALLOWED_NEIGHBORHOODS = {
  centro:                 { focus: "Studios e Comercial", aliases: ["centro", "centro historico"] },
  itacorubi:              { focus: "Público universitário e tech", aliases: ["itacorubi"] },
  campeche:               { focus: "Rentabilidade de curto prazo / Airbnb", aliases: ["campeche", "praia do campeche"] },
  "jurerê internacional": { focus: "Luxo e alto padrão", aliases: ["jurere", "jurerê", "jurere int", ...] },
};

function findMatchingNeighborhood(bairro: string) {
  const normalized = normalizeNeighborhood(bairro); // Remove acentos, lowercase, trim

  // 1. Match exato na chave
  // 2. Match nos aliases
  // 3. Match parcial (contains) — "Jurerê" casa com "Jurerê Internacional"
  // Se nenhum match: retorna null → bairro rejeitado
}
```

O System Prompt reforça: _"NUNCA aceite um bairro sem validar com a tool validateLocation"_ e _"NUNCA continue a qualificação após rejeição geográfica"_.

#### Eficiência de Tokens

O prompt foi otimizado para manter as respostas curtas e controlar o custo:

- **Respostas de 1-3 frases no máximo** — instrução explícita no prompt
- **Uma pergunta por vez** — evita respostas longas com múltiplas perguntas
- **Temperatura baixa (0.4)** — reduz variabilidade e respostas prolixas
- **`stopWhen: stepCountIs(5)`** — limita multi-step tool calls a 5 iterações, evitando loops
- **Cálculo de custo em tempo real** — o painel lateral exibe input/output tokens e custo estimado em USD baseado no modelo selecionado

#### Tratamento de Erros e Dados Inconsistentes

- **Dados contraditórios:** O prompt instrui: _"Se o usuário informar dados contraditórios (ex: terreno de 50m² por R$10 milhões), aponte a inconsistência e peça correção"_
- **Localização vaga:** Se o usuário digitar algo como "perto da praia" ou um endereço por texto, o prompt manda chamar `requestLocation` novamente
- **Fuga de escopo:** _"Se o usuário tentar mudar de assunto ou pedir algo fora do escopo, redirecione para a qualificação"_
- **Validação Zod no servidor:** Todos os inputs das tools são validados pelo Zod, impedindo que a LLM envie dados mal-formados
- **Middleware para Gemini:** Um middleware customizado (`geminiSanitiseMiddleware`) intercepta e corrige mensagens com arrays vazios que o Gemini rejeitaria com erro 400

---

## 🧩 Arquitetura e Fluxo do Código

### Estrutura de Pastas

```
app/
├── api/
│   ├── chat/
│   │   └── route.ts              ← API Route: streaming LLM + 3 tools
│   └── places/
│       └── route.ts              ← Proxy Google Places API (autocomplete + details)
│
└── desafio-tecnico-sia/
    ├── page.tsx                   ← Página principal (monta o layout 3 colunas)
    ├── _hooks/
    │   └── use-playground.ts      ← Hook central: estado, chat, tools, custo
    ├── _lib/
    │   ├── constants.ts           ← Modelos, pricing, system prompt, defaults
    │   ├── types.ts               ← Interfaces TypeScript
    │   └── test-cases.ts          ← 3 cenários de teste pré-carregados
    └── _components/
        ├── header.tsx             ← Cabeçalho com toggles de painéis
        ├── sidebar.tsx            ← Config: modelo, prompt, temperatura, toggles
        ├── chat-area.tsx          ← Área de chat: mensagens + input
        ├── message-bubble.tsx     ← Bolha de mensagem + renderização de tools
        ├── places-autocomplete.tsx← Widget de busca de endereço (Google Places)
        ├── results-panel.tsx      ← Painel lateral: validação, qualificação, tokens, custo
        ├── qualification-card.tsx ← Card visual da qualificação do lead
        └── test-cases-drawer.tsx  ← Drawer com cenários de teste
```

### Fluxo Completo de uma Conversa

O diagrama abaixo mostra o caminho de uma mensagem do usuário até a resposta da Sia:

```
┌─────────────┐     ┌──────────────────┐     ┌────────────────┐
│  ChatArea    │────▶│  usePlayground   │────▶│  API /api/chat │
│  (input)     │     │  (sendMessage)   │     │  (route.ts)    │
└─────────────┘     └──────────────────┘     └────────────────┘
                                                     │
                                              ┌──────▼──────┐
                                              │  streamText  │
                                              │  (AI SDK v6) │
                                              └──────┬──────┘
                                                     │
                                    ┌────────────────┼────────────────┐
                                    ▼                ▼                ▼
                            requestLocation   validateLocation  submitQualification
                            (exibe widget)    (valida bairro)   (gera JSON)
                                    │                │                │
                                    └────────────────┼────────────────┘
                                                     │
                                              ┌──────▼──────┐
                                              │   Stream     │
                                              │  Response    │
                                              └──────┬──────┘
                                                     │
                    ┌────────────────────────────────┼──────────────────┐
                    ▼                                ▼                  ▼
             MessageBubble                    ResultsPanel        data-usage
             (texto + tools)                  (validação,         (tokens →
                    │                         qualificação)       custo)
                    ▼
          PlacesAutocomplete
          (se requestLocation)
```

#### Passo a passo detalhado:

**1. Usuário digita mensagem → `ChatArea` → `usePlayground`**

O componente [`chat-area.tsx`](app/desafio-tecnico-sia/_components/chat-area.tsx) captura o input e chama `onSubmit`, que dispara o `handleSubmit` do hook:

```typescript
// app/desafio-tecnico-sia/_hooks/use-playground.ts

const handleSubmit = useCallback((e?: React.FormEvent) => {
  e?.preventDefault?.();
  if (!inputValue.trim() || isLoading) return;
  sendMessage({ text: inputValue });  // ← Envia via AI SDK useChat
  setInputValue("");
}, [inputValue, isLoading, sendMessage]);
```

**2. `useChat` → Transport → API Route**

O hook usa um `DefaultChatTransport` customizado que injeta as configurações (modelo, temperatura, tools habilitadas, system prompt) no body da requisição:

```typescript
// app/desafio-tecnico-sia/_hooks/use-playground.ts

const transport = useMemo(() =>
  new DefaultChatTransport({
    api: "/api/chat",
    prepareSendMessagesRequest({ body, messages, ...rest }) {
      return {
        ...rest,
        body: { ...body, messages, ...settingsRef.current },
      };
    },
  }),
[]);
```

**3. API Route processa e faz streaming**

O [`route.ts`](app/api/chat/route.ts) recebe a requisição, seleciona o modelo (com middleware para Gemini), registra as tools e faz streaming:

```typescript
// app/api/chat/route.ts

const model = getModel(modelId);  // Aplica geminiSanitiseMiddleware se Gemini

const result = streamText({
  model,
  system: systemPrompt || undefined,
  messages: modelMessages,
  temperature,
  tools: Object.keys(tools).length > 0 ? tools : undefined,
  stopWhen: stepCountIs(5),  // Limite de 5 steps para multi-tool
});

return createUIMessageStreamResponse({
  stream: new ReadableStream({
    async start(controller) {
      const stream = result.toUIMessageStream();
      for await (const chunk of stream) {
        controller.enqueue(chunk);
      }
      // Envia uso de tokens no final
      const usage = await result.usage;
      controller.enqueue({ type: "data-usage", data: { ...usage } });
    },
  }),
});
```

**4. Tool `requestLocation` → Widget Places inline**

Quando a Sia precisa da localização, ela chama `requestLocation`. Isso retorna um "tool result" que o [`message-bubble.tsx`](app/desafio-tecnico-sia/_components/message-bubble.tsx) intercepta e renderiza como um widget de busca inline:

```tsx
// app/desafio-tecnico-sia/_components/message-bubble.tsx

if (toolName === "requestLocation") {
  return (
    <div key={idx} className="rounded-lg border border-blue-200 ...">
      <PlacesAutocomplete
        onPlaceSelected={(details) => {
          onSendLocationMessage?.({
            formattedAddress: details.formattedAddress,
            neighborhood: details.neighborhood || "",
            city: details.city || "",
            state: details.state || "",
          });
        }}
        onClose={() => {}}
      />
    </div>
  );
}
```

O [`PlacesAutocomplete`](app/desafio-tecnico-sia/_components/places-autocomplete.tsx) faz chamadas ao proxy [`/api/places`](app/api/places/route.ts), que encapsula a Google Places API server-side (mantendo a API key segura):

```typescript
// app/api/places/route.ts

// POST /api/places — Autocomplete
const params = new URLSearchParams({
  input: query,
  key: GOOGLE_API_KEY,
  language: "pt-BR",
  components: "country:br",
  types: "geocode",
  location: "-27.5954,-48.548",  // Bias para Florianópolis
  radius: "50000",
});
```

**5. Seleção do endereço → `sendLocationMessage`**

Quando o usuário seleciona um endereço no widget, o componente chama `onSendLocationMessage`, que dispara o `sendLocationMessage` do hook. Isso envia uma mensagem formatada que a Sia reconhece:

```typescript
// app/desafio-tecnico-sia/_hooks/use-playground.ts

const sendLocationMessage = useCallback((details) => {
  const text = `📍 Localização selecionada: **${details.formattedAddress}**
- Bairro: ${details.neighborhood || "N/A"}
- Cidade: ${details.city || "N/A"}
- Estado: ${details.state || "N/A"}`;

  sendMessage({ text });
}, [isLoading, sendMessage]);
```

**6. `validateLocation` → Validação server-side**

A Sia recebe a localização e chama `validateLocation`, que executa o fuzzy matching no servidor. Se aprovado, retorna o foco do bairro; se rejeitado, retorna a lista de bairros permitidos e o link de fallback.

**7. Coleta de dados → `submitQualification` → JSON**

Após coletar os 5 data points (um por vez), a Sia chama `submitQualification` que gera o JSON estruturado. O resultado é exibido no painel lateral pelo [`qualification-card.tsx`](app/desafio-tecnico-sia/_components/qualification-card.tsx).

**8. Sincronização de resultados no painel lateral**

O hook [`use-playground.ts`](app/desafio-tecnico-sia/_hooks/use-playground.ts) monitora as mensagens e extrai automaticamente os resultados das tools para exibir no painel:

```typescript
// app/desafio-tecnico-sia/_hooks/use-playground.ts

useEffect(() => {
  let newLocationValidation, newQualification;

  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    for (const part of m.parts) {
      const toolName = /* extrai nome da tool do part */;
      const result = /* extrai resultado */;

      if (toolName === "validateLocation" && result) newLocationValidation = result;
      if (toolName === "submitQualification" && result) newQualification = result;
    }
  }

  setToolResults({ locationValidation: newLocationValidation, qualification: newQualification });
}, [messages]);
```

**9. Cálculo de custo em tempo real**

Ao final do stream, o servidor envia um evento `data-usage` com os tokens consumidos. O hook calcula o custo baseado na tabela de preços por modelo:

```typescript
// app/desafio-tecnico-sia/_lib/constants.ts

export const MODEL_PRICING = {
  "gpt-4.1":                { input: 2.00,  cached: 0.50,  output: 8.00  },
  "gpt-5.2":                { input: 1.75,  cached: 0.175, output: 14.00 },
  "gemini-3-flash-preview": { input: 0.50,  cached: null,  output: 3.00  },
};

// app/desafio-tecnico-sia/_hooks/use-playground.ts

const costEstimate = useMemo<CostEstimate>(() => {
  const pricing = MODEL_PRICING[selectedModel];
  if (!pricing || totalUsage.total === 0) return { inputCost: 0, outputCost: 0, totalCost: 0 };

  const inputCost = (totalUsage.prompt / 1_000_000) * pricing.input;
  const outputCost = (totalUsage.completion / 1_000_000) * pricing.output;
  return { inputCost, outputCost, totalCost: inputCost + outputCost };
}, [totalUsage, selectedModel]);
```

---

### Detalhamento dos Componentes

| Componente | Arquivo | Responsabilidade |
|---|---|---|
| **PlaygroundPage** | [`page.tsx`](app/desafio-tecnico-sia/page.tsx) | Layout principal (Header + Sidebar + ChatArea + ResultsPanel) |
| **Header** | [`header.tsx`](app/desafio-tecnico-sia/_components/header.tsx) | Barra superior com toggles de painéis e tema |
| **Sidebar** | [`sidebar.tsx`](app/desafio-tecnico-sia/_components/sidebar.tsx) | Configurações: modelo, system prompt, temperatura, toggles de tools |
| **ChatArea** | [`chat-area.tsx`](app/desafio-tecnico-sia/_components/chat-area.tsx) | Área de chat com mensagens, input, sugestões iniciais e indicador de loading |
| **MessageBubble** | [`message-bubble.tsx`](app/desafio-tecnico-sia/_components/message-bubble.tsx) | Renderização de mensagens com Markdown, tools inline e ações (editar, copiar, deletar) |
| **PlacesAutocomplete** | [`places-autocomplete.tsx`](app/desafio-tecnico-sia/_components/places-autocomplete.tsx) | Widget de busca de endereço com debounce, sugestões e seleção |
| **ResultsPanel** | [`results-panel.tsx`](app/desafio-tecnico-sia/_components/results-panel.tsx) | Painel lateral: validação geográfica, qualificação, tokens e custo |
| **QualificationCard** | [`qualification-card.tsx`](app/desafio-tecnico-sia/_components/qualification-card.tsx) | Card visual com os dados da qualificação em grid |
| **TestCasesDrawer** | [`test-cases-drawer.tsx`](app/desafio-tecnico-sia/_components/test-cases-drawer.tsx) | Drawer com os 3 cenários de teste carregáveis |
| **usePlayground** | [`use-playground.ts`](app/desafio-tecnico-sia/_hooks/use-playground.ts) | Hook central: gerencia todo o estado, chat, tools, custo e ações |

---

## ✨ Features Extras (Além do Desafio)

- **🔄 Multi-modelo:** Troque entre GPT-4.1, GPT-5.2 e Gemini 3 Flash em tempo real
- **📍 Google Places integrado:** Busca de endereço real com autocomplete e extração de bairro/cidade/estado
- **✏️ Edição de mensagens:** Edite qualquer mensagem e regenere a resposta automaticamente
- **🧪 Cenários de teste pré-carregados:** 3 cenários completos carregáveis com um clique
- **📊 Uso de tokens em tempo real:** Input, output, reasoning e total
- **💰 Estimativa de custo:** Cálculo automático baseado no modelo selecionado
- **🌙 Tema claro/escuro:** Toggle de tema com persistência
- **🎛️ System Prompt editável:** Modifique o prompt em tempo real e restaure o original
- **🛡️ Middleware Gemini:** Correção automática de erros de API durante multi-step tool calls
- **🔧 Tools com toggle:** Ative/desative individualmente cada tool no sidebar
