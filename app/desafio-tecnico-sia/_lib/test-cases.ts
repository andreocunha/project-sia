import type { UIMessage } from "ai";
import type { ToolResults } from "./types";

export interface TestCase {
  id: string;
  title: string;
  description: string;
  badge: "success" | "rejection";
  messages: UIMessage[];
  toolResults: ToolResults;
}

// Helper to create UIMessages with unique IDs
function msg(
  role: "user" | "assistant",
  text: string,
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extraParts?: any[]
): UIMessage {
  const parts: UIMessage["parts"] = [{ type: "text" as const, text }];
  if (extraParts) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parts.unshift(...(extraParts as any));
  }
  return { id, role, parts } as UIMessage;
}

// Helper to create a tool part in AI SDK v6 format
function toolPart(
  toolName: string,
  toolCallId: string,
  input: Record<string, unknown>,
  output: unknown
) {
  return {
    type: `tool-${toolName}` as const,
    toolCallId,
    state: "output-available" as const,
    input,
    output,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

// ── Cenário 1: Sucesso — Campeche (1 pergunta por vez + Places) ──
const successMessages: UIMessage[] = [
  msg(
    "user",
    "Oi, sou corretor e tenho um terreno no Campeche pra vocês avaliarem.",
    "s1"
  ),
  {
    id: "s2",
    role: "assistant",
    parts: [
      toolPart(
        "requestLocation",
        "tc-s2",
        { message: "Para começarmos, busque e selecione o endereço exato do terreno:" },
        { type: "location_request", message: "Para começarmos, busque e selecione o endereço exato do terreno:", status: "awaiting_selection" }
      ),
      {
        type: "text" as const,
        text: "Olá! Fico feliz com seu interesse. Busque o endereço do terreno no campo acima para começarmos.",
      },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
  msg(
    "user",
    "📍 Localização selecionada: **Campeche, Florianópolis - SC, Brasil**\n- Bairro: Campeche\n- Cidade: Florianópolis\n- Estado: SC",
    "s3"
  ),
  {
    id: "s4",
    role: "assistant",
    parts: [
      toolPart(
        "validateLocation",
        "tc-s4",
        { bairro: "Campeche", cidade: "Florianópolis" },
        {
          allowed: true,
          bairro: "campeche",
          bairro_original: "Campeche",
          cidade: "Florianópolis",
          focus: "Rentabilidade de curto prazo / Airbnb",
          description:
            "Bairro com forte apelo turístico no sul da ilha, ideal para locação de curta temporada.",
          message:
            'Bairro "campeche" aprovado! Foco: Rentabilidade de curto prazo / Airbnb. Continue a qualificação.',
        }
      ),
      {
        type: "text" as const,
        text: "**Campeche** aprovado! Excelente região para curta temporada. Qual o **tamanho do terreno** em m²?",
      },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
  msg("user", "450m²", "s5"),
  msg(
    "assistant",
    "Boa metragem. Qual o **valor pedido** pelo terreno?",
    "s6"
  ),
  msg("user", "R$ 1.200.000", "s7"),
  msg(
    "assistant",
    "Valor coerente para a região. O terreno possui **escritura pública**?",
    "s8"
  ),
  msg("user", "Sim, tem escritura pública.", "s9"),
  msg(
    "assistant",
    "O terreno é **frente mar** ou tem **vista para o mar**?",
    "s10"
  ),
  msg("user", "Não é frente mar mas tem vista pro mar.", "s11"),
  {
    id: "s12",
    role: "assistant",
    parts: [
      toolPart(
        "submitQualification",
        "tc-s12",
        {
          lead_qualified: true,
          owner_type: "corretor",
          bairro: "Campeche",
          cidade: "Florianópolis",
          land_size_m2: 450,
          asking_price: 1200000,
          legal_status: "Escritura pública",
          has_sea_view: true,
          is_beachfront: false,
          next_step: "agendar_reuniao",
        },
        {
          lead_qualified: true,
          owner_type: "corretor",
          location: { bairro: "Campeche", cidade: "Florianópolis" },
          land_size_m2: 450,
          asking_price: 1200000,
          legal_status: "Escritura pública",
          has_sea_view: true,
          is_beachfront: false,
          neighborhood_focus: "Rentabilidade de curto prazo / Airbnb",
          next_step: "agendar_reuniao",
        }
      ),
      {
        type: "text" as const,
        text: "Qualificação concluída! Terreno **aprovado** — 450m² no Campeche com vista mar, perfeito para nosso modelo de curta temporada. Próximo passo: **agendar uma reunião** com nosso time de análise.",
      },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
];

const successToolResults: ToolResults = {
  locationValidation: {
    allowed: true,
    bairro: "campeche",
    cidade: "Florianópolis",
    focus: "Rentabilidade de curto prazo / Airbnb",
    description:
      "Bairro com forte apelo turístico no sul da ilha, ideal para locação de curta temporada.",
  },
  qualification: {
    lead_qualified: true,
    owner_type: "corretor",
    location: { bairro: "Campeche", cidade: "Florianópolis" },
    land_size_m2: 450,
    asking_price: 1200000,
    legal_status: "Escritura pública",
    has_sea_view: true,
    is_beachfront: false,
    neighborhood_focus: "Rentabilidade de curto prazo / Airbnb",
    next_step: "agendar_reuniao",
  },
};

// ── Cenário 2: Rejeição — Rio Tavares ──
const rejectionMessages: UIMessage[] = [
  msg(
    "user",
    "Boa tarde! Sou proprietário de um terreno no Rio Tavares em Florianópolis.",
    "r1"
  ),
  {
    id: "r2",
    role: "assistant",
    parts: [
      toolPart(
        "requestLocation",
        "tc-r2",
        { message: "Para iniciarmos, busque e confirme o endereço do terreno:" },
        { type: "location_request", message: "Para iniciarmos, busque e confirme o endereço do terreno:", status: "awaiting_selection" }
      ),
      {
        type: "text" as const,
        text: "Olá! Busque o endereço do terreno no campo acima para começarmos.",
      },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
  msg(
    "user",
    "📍 Localização selecionada: **Rio Tavares, Florianópolis - SC, Brasil**\n- Bairro: Rio Tavares\n- Cidade: Florianópolis\n- Estado: SC",
    "r3"
  ),
  {
    id: "r4",
    role: "assistant",
    parts: [
      toolPart(
        "validateLocation",
        "tc-r4",
        { bairro: "Rio Tavares", cidade: "Florianópolis" },
        {
          allowed: false,
          bairro: "Rio Tavares",
          cidade: "Florianópolis",
          reason:
            'O bairro "Rio Tavares" não está na lista de áreas de interesse da Seazone em Florianópolis.',
          allowed_neighborhoods: [
            { bairro: "centro", foco: "Studios e Comercial" },
            { bairro: "itacorubi", foco: "Público universitário e tech" },
            {
              bairro: "campeche",
              foco: "Rentabilidade de curto prazo / Airbnb",
            },
            {
              bairro: "jurerê internacional",
              foco: "Luxo e alto padrão",
            },
          ],
          fallback_link: "http://google.com/maps/place/florianopolis",
        }
      ),
      {
        type: "text" as const,
        text: 'Obrigada pelo interesse! Infelizmente, o **Rio Tavares** não está na nossa área de foco atual. A Seazone opera nos bairros **Centro**, **Itacorubi**, **Campeche** e **Jurerê Internacional**.\n\nVeja nossas regiões de interesse: [Mapa de regiões](http://google.com/maps/place/florianopolis)\n\nSe tiver terrenos nessas áreas no futuro, ficaremos felizes em conversar!',
      },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
];

const rejectionToolResults: ToolResults = {
  locationValidation: {
    allowed: false,
    bairro: "Rio Tavares",
    cidade: "Florianópolis",
    reason:
      'O bairro "Rio Tavares" não está na lista de áreas de interesse da Seazone em Florianópolis.',
    allowed_neighborhoods: [
      { bairro: "centro", foco: "Studios e Comercial" },
      { bairro: "itacorubi", foco: "Público universitário e tech" },
      { bairro: "campeche", foco: "Rentabilidade de curto prazo / Airbnb" },
      { bairro: "jurerê internacional", foco: "Luxo e alto padrão" },
    ],
    fallback_link: "http://google.com/maps/place/florianopolis",
  },
};

// ── Cenário 3: Sucesso — Jurerê Internacional (Luxo, 1 pergunta por vez) ──
const luxuryMessages: UIMessage[] = [
  msg(
    "user",
    "Olá, sou proprietário de um terreno em Jurerê, frente mar.",
    "l1"
  ),
  {
    id: "l2",
    role: "assistant",
    parts: [
      toolPart(
        "requestLocation",
        "tc-l2",
        { message: "Para confirmar a localização, busque o endereço do terreno:" },
        { type: "location_request", message: "Para confirmar a localização, busque o endereço do terreno:", status: "awaiting_selection" }
      ),
      {
        type: "text" as const,
        text: "Olá! Fico muito interessada. Busque o endereço do terreno no campo acima para confirmarmos a localização.",
      },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
  msg(
    "user",
    "📍 Localização selecionada: **Jurerê Internacional, Florianópolis - SC, Brasil**\n- Bairro: Jurerê Internacional\n- Cidade: Florianópolis\n- Estado: SC",
    "l3"
  ),
  {
    id: "l4",
    role: "assistant",
    parts: [
      toolPart(
        "validateLocation",
        "tc-l4",
        { bairro: "Jurerê Internacional", cidade: "Florianópolis" },
        {
          allowed: true,
          bairro: "jurerê internacional",
          bairro_original: "Jurerê Internacional",
          cidade: "Florianópolis",
          focus: "Luxo e alto padrão",
          description:
            "Região nobre no norte da ilha, foco em empreendimentos de luxo e alta rentabilidade.",
          message:
            'Bairro "jurerê internacional" aprovado! Foco: Luxo e alto padrão. Continue a qualificação.',
        }
      ),
      {
        type: "text" as const,
        text: "**Jurerê Internacional** aprovado! Perfil premium. Qual a **metragem do terreno**?",
      },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
  msg("user", "1200m²", "l5"),
  msg(
    "assistant",
    "Ótima metragem. Qual o **valor pedido**?",
    "l6"
  ),
  msg("user", "R$ 8.500.000", "l7"),
  msg(
    "assistant",
    "Valor consistente para Jurerê frente mar. O terreno possui **escritura pública**?",
    "l8"
  ),
  msg("user", "Sim, escritura pública.", "l9"),
  msg(
    "assistant",
    "Você mencionou que é **frente mar**. Confirma que também tem **vista para o mar**?",
    "l10"
  ),
  msg("user", "Sim, frente mar com vista total.", "l11"),
  {
    id: "l12",
    role: "assistant",
    parts: [
      toolPart(
        "submitQualification",
        "tc-l12",
        {
          lead_qualified: true,
          owner_type: "proprietario",
          bairro: "Jurerê Internacional",
          cidade: "Florianópolis",
          land_size_m2: 1200,
          asking_price: 8500000,
          legal_status: "Escritura pública",
          has_sea_view: true,
          is_beachfront: true,
          next_step: "enviar_estudo",
        },
        {
          lead_qualified: true,
          owner_type: "proprietario",
          location: {
            bairro: "Jurerê Internacional",
            cidade: "Florianópolis",
          },
          land_size_m2: 1200,
          asking_price: 8500000,
          legal_status: "Escritura pública",
          has_sea_view: true,
          is_beachfront: true,
          neighborhood_focus: "Luxo e alto padrão",
          next_step: "enviar_estudo",
        }
      ),
      {
        type: "text" as const,
        text: "Qualificação concluída! Terreno **frente mar** em Jurerê Internacional com 1.200m² — perfil de **alto padrão** perfeito. Próximo passo: vamos **enviar um estudo de viabilidade** detalhado em até 48h.",
      },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
];

const luxuryToolResults: ToolResults = {
  locationValidation: {
    allowed: true,
    bairro: "jurerê internacional",
    cidade: "Florianópolis",
    focus: "Luxo e alto padrão",
    description:
      "Região nobre no norte da ilha, foco em empreendimentos de luxo e alta rentabilidade.",
  },
  qualification: {
    lead_qualified: true,
    owner_type: "proprietario",
    location: { bairro: "Jurerê Internacional", cidade: "Florianópolis" },
    land_size_m2: 1200,
    asking_price: 8500000,
    legal_status: "Escritura pública",
    has_sea_view: true,
    is_beachfront: true,
    neighborhood_focus: "Luxo e alto padrão",
    next_step: "enviar_estudo",
  },
};

// ── Exportação ──
export const TEST_CASES: TestCase[] = [
  {
    id: "success-campeche",
    title: "Sucesso — Campeche",
    description:
      "Corretor com terreno de 450m² no Campeche. Localização via Google Places, validação aprovada, dados coletados um a um, lead qualificado.",
    badge: "success",
    messages: successMessages,
    toolResults: successToolResults,
  },
  {
    id: "rejection-rio-tavares",
    title: "Rejeição — Rio Tavares",
    description:
      "Proprietário com terreno no Rio Tavares (fora da área de foco). Sia recusa educadamente após validação geográfica.",
    badge: "rejection",
    messages: rejectionMessages,
    toolResults: rejectionToolResults,
  },
  {
    id: "success-jurere",
    title: "Sucesso — Jurerê Internacional",
    description:
      "Proprietário com terreno frente mar de 1.200m² em Jurerê. Perfil premium, qualificado para estudo de viabilidade.",
    badge: "success",
    messages: luxuryMessages,
    toolResults: luxuryToolResults,
  },
];
