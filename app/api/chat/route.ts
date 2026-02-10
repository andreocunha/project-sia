import { streamText, tool, UIMessage, convertToModelMessages, stepCountIs, createUIMessageStreamResponse, wrapLanguageModel } from "ai";
import type { LanguageModelMiddleware } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

/**
 * Middleware that sanitises prompts for Gemini.
 *
 * During multi-step tool execution the AI SDK may build intermediate
 * assistant messages whose `content` array ends up empty (e.g. when every
 * text part was empty and got filtered out by `@ai-sdk/google`'s
 * `convertToGoogleGenerativeAIMessages`).  Gemini rejects requests with
 * "must include at least one parts field" when that happens.
 *
 * This middleware runs **before every call** (including internal multi-step
 * calls) and injects a minimal placeholder text part into any assistant
 * message that would otherwise be empty, preventing the 400 error.
 */
const geminiSanitiseMiddleware: LanguageModelMiddleware = {
  specificationVersion: "v3",
  transformParams: async ({ params }) => {
    return {
      ...params,
      prompt: params.prompt.map((msg) => {
        if (
          msg.role === "assistant" &&
          Array.isArray(msg.content) &&
          msg.content.length === 0
        ) {
          return { ...msg, content: [{ type: "text" as const, text: "." }] };
        }
        return msg;
      }),
    };
  },
};

export const maxDuration = 60;

// ── Bairros permitidos pela Seazone ──
const ALLOWED_NEIGHBORHOODS: Record<
  string,
  { focus: string; description: string; aliases: string[] }
> = {
  centro: {
    focus: "Studios e Comercial",
    description:
      "Área central de Florianópolis, ideal para studios compactos e uso comercial.",
    aliases: ["centro", "centro de florianopolis", "centro historico"],
  },
  itacorubi: {
    focus: "Público universitário e tech",
    description:
      "Região próxima à UFSC e polo tecnológico, foco em aluguel para estudantes e profissionais de tech.",
    aliases: ["itacorubi"],
  },
  campeche: {
    focus: "Rentabilidade de curto prazo / Airbnb",
    description:
      "Bairro com forte apelo turístico no sul da ilha, ideal para locação de curta temporada.",
    aliases: ["campeche", "praia do campeche"],
  },
  "jurerê internacional": {
    focus: "Luxo e alto padrão",
    description:
      "Região nobre no norte da ilha, foco em empreendimentos de luxo e alta rentabilidade.",
    aliases: [
      "jurere internacional",
      "jurere",
      "jurerê",
      "jurerê internacional",
      "jurere int",
      "jurere tradicicional",
    ],
  },
};

function normalizeNeighborhood(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Fuzzy match: checks if the input matches any allowed neighborhood
 * by comparing against all aliases.
 */
function findMatchingNeighborhood(
  bairro: string
): [string, (typeof ALLOWED_NEIGHBORHOODS)[string]] | null {
  const normalized = normalizeNeighborhood(bairro);

  // 1. Direct match on key
  for (const [key, info] of Object.entries(ALLOWED_NEIGHBORHOODS)) {
    if (normalizeNeighborhood(key) === normalized) {
      return [key, info];
    }
  }

  // 2. Match on aliases
  for (const [key, info] of Object.entries(ALLOWED_NEIGHBORHOODS)) {
    for (const alias of info.aliases) {
      if (normalizeNeighborhood(alias) === normalized) {
        return [key, info];
      }
    }
  }

  // 3. Partial/contains match (e.g. "Jurerê" should match "Jurerê Internacional")
  for (const [key, info] of Object.entries(ALLOWED_NEIGHBORHOODS)) {
    const normKey = normalizeNeighborhood(key);
    if (normKey.includes(normalized) || normalized.includes(normKey)) {
      return [key, info];
    }
    for (const alias of info.aliases) {
      const normAlias = normalizeNeighborhood(alias);
      if (normAlias.includes(normalized) || normalized.includes(normAlias)) {
        return [key, info];
      }
    }
  }

  return null;
}

function getModel(modelId: string) {
  if (modelId.startsWith("gpt-") || modelId.startsWith("o")) {
    return openai(modelId);
  }
  if (modelId.startsWith("gemini-")) {
    return wrapLanguageModel({
      model: google(modelId),
      middleware: geminiSanitiseMiddleware,
    });
  }
  return openai(modelId);
}

export async function POST(req: Request) {
  const {
    messages,
    model: modelId = "gpt-4.1",
    temperature = 0.4,
    topP,
    enableValidateLocationTool = false,
    enableSubmitQualificationTool = false,
    systemPrompt = "",
  }: {
    messages: UIMessage[];
    model?: string;
    temperature?: number;
    topP?: number;
    enableValidateLocationTool?: boolean;
    enableSubmitQualificationTool?: boolean;
    systemPrompt?: string;
  } = await req.json();

  const model = getModel(modelId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: Record<string, any> = {};

  // ── Tool: Solicitar Localização (UI Widget) ──
  if (enableValidateLocationTool) {
    tools.requestLocation = tool({
      description:
        "Exibe um campo de busca de endereço integrado (Google Places) na conversa para o usuário pesquisar e selecionar a localização do terreno. CHAME esta tool SEMPRE que precisar da localização do terreno. NÃO peça o endereço por texto — use esta tool para mostrar o buscador.",
      inputSchema: z.object({
        message: z
          .string()
          .describe(
            "Mensagem curta pedindo ao usuário para buscar o endereço no campo que aparecerá abaixo"
          ),
      }),
      execute: async ({ message }) => {
        return {
          type: "location_request",
          message,
          status: "awaiting_selection",
        };
      },
    });
  }

  // ── Tool: Validação Geográfica (Guardrail) ──
  if (enableValidateLocationTool) {
    tools.validateLocation = tool({
      description:
        "Valida se o bairro informado está dentro da área de interesse da Seazone em Florianópolis. DEVE ser chamada sempre que o usuário informar uma localização, ANTES de continuar a qualificação.",
      inputSchema: z.object({
        bairro: z.string().describe("O nome do bairro informado pelo usuário"),
        cidade: z.string().describe("O nome da cidade informada pelo usuário"),
      }),
      execute: async ({ bairro, cidade }) => {
        const normalizedCidade = normalizeNeighborhood(cidade);

        // Verifica se é Florianópolis
        const isFloripa =
          normalizedCidade.includes("florianopolis") ||
          normalizedCidade.includes("floripa") ||
          normalizedCidade.includes("florianópolis");

        if (!isFloripa) {
          return {
            allowed: false,
            bairro,
            cidade,
            reason: `A Seazone atua apenas em Florianópolis. "${cidade}" está fora da nossa área de operação.`,
            allowed_neighborhoods: Object.entries(ALLOWED_NEIGHBORHOODS).map(
              ([name, info]) => ({ bairro: name, foco: info.focus })
            ),
            fallback_link: "https://google.com/maps/exemplo",
          };
        }

        // Fuzzy match the neighborhood
        const match = findMatchingNeighborhood(bairro);

        if (match) {
          const [matchedName, info] = match;
          return {
            allowed: true,
            bairro: matchedName,
            bairro_original: bairro,
            cidade: "Florianópolis",
            focus: info.focus,
            description: info.description,
            message: `Bairro "${matchedName}" aprovado! Foco: ${info.focus}. Continue a qualificação.`,
          };
        }

        return {
          allowed: false,
          bairro,
          cidade,
          reason: `O bairro "${bairro}" não está na lista de áreas de interesse da Seazone em Florianópolis.`,
          allowed_neighborhoods: Object.entries(ALLOWED_NEIGHBORHOODS).map(
            ([name, info]) => ({ bairro: name, foco: info.focus })
          ),
          fallback_link: "https://google.com/maps/exemplo",
          message:
            "Decline educadamente e informe as regiões onde a Seazone atua. Forneça o link de fallback. NÃO continue a qualificação.",
        };
      },
    });
  }

  // ── Tool: Submissão de Qualificação ──
  if (enableSubmitQualificationTool) {
    tools.submitQualification = tool({
      description:
        "Gera a saída estruturada JSON da qualificação do lead após coletar TODOS os dados: localização, tamanho, valor, situação jurídica e diferenciais. Só use quando tiver certeza de TODOS os 5 data points.",
      inputSchema: z.object({
        lead_qualified: z.boolean().describe("Se o lead está qualificado"),
        owner_type: z
          .enum(["corretor", "proprietario"])
          .describe("Tipo do proprietário ou se é um corretor"),
        bairro: z.string().describe("Bairro do terreno"),
        cidade: z.string().describe("Cidade do terreno"),
        land_size_m2: z.number().describe("Tamanho do terreno em m²"),
        asking_price: z.number().describe("Valor pedido em reais"),
        legal_status: z
          .string()
          .describe("Situação jurídica — ex: 'Escritura pública' ou 'Sem escritura'"),
        has_sea_view: z.boolean().describe("Se tem vista para o mar"),
        is_beachfront: z.boolean().describe("Se é frente mar"),
        next_step: z
          .enum(["agendar_reuniao", "enviar_estudo", "disqualified"])
          .describe("Próximo passo da qualificação"),
      }),
      execute: async (data) => {
        // Busca o foco do bairro
        const normalizedBairro = normalizeNeighborhood(data.bairro);
        const neighborhoodInfo = Object.entries(ALLOWED_NEIGHBORHOODS).find(
          ([key]) => normalizeNeighborhood(key) === normalizedBairro
        );

        const qualification = {
          lead_qualified: data.lead_qualified,
          owner_type: data.owner_type,
          location: {
            bairro: data.bairro,
            cidade: data.cidade,
          },
          land_size_m2: data.land_size_m2,
          asking_price: data.asking_price,
          legal_status: data.legal_status,
          has_sea_view: data.has_sea_view,
          is_beachfront: data.is_beachfront,
          neighborhood_focus: neighborhoodInfo?.[1]?.focus || undefined,
          next_step: data.next_step,
        };

        return qualification;
      },
    });
  }

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model,
    system: systemPrompt || undefined,
    messages: modelMessages,
    temperature,
    topP: topP || undefined,
    tools: Object.keys(tools).length > 0 ? tools : undefined,
    stopWhen: stepCountIs(5),
  });

  return createUIMessageStreamResponse({
    stream: new ReadableStream({
      async start(controller) {
        try {
          const stream = result.toUIMessageStream();
          for await (const chunk of stream) {
            controller.enqueue(chunk);
          }
          const usage = await result.usage;
          controller.enqueue({
            type: "data-usage",
            data: { ...usage },
          });
        } catch (err) {
          console.error("Stream error:", err);
        } finally {
          controller.close();
        }
      },
    }),
  });
}
