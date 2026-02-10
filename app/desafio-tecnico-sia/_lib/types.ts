import type { UIMessage } from "ai";

export interface PlaygroundSettings {
  model: string;
  temperature: number;
  topP: number;
  enableValidateLocationTool: boolean;
  enableSubmitQualificationTool: boolean;
  systemPrompt: string;
}

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
  reasoning: number;
}

export interface CostEstimate {
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export interface ToolResults {
  locationValidation?: Record<string, unknown>;
  qualification?: QualificationData;
}

export interface QualificationData {
  lead_qualified: boolean;
  owner_type: "corretor" | "proprietario";
  location: { bairro: string; cidade: string };
  land_size_m2: number;
  asking_price: number;
  legal_status: string;
  has_sea_view: boolean;
  is_beachfront: boolean;
  neighborhood_focus?: string;
  next_step: "agendar_reuniao" | "enviar_estudo" | "disqualified";
}

export interface MessageBubbleProps {
  message: UIMessage;
  isEditing: boolean;
  editingContent: string;
  onEditingContentChange: (content: string) => void;
  onStartEdit: (message: UIMessage) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
  /** Called when user selects a location from the inline Places widget */
  onSendLocationMessage?: (details: {
    formattedAddress: string;
    neighborhood: string;
    city: string;
    state: string;
  }) => void;
  /** Whether a location has already been submitted after this message */
  locationAlreadySubmitted?: boolean;
}

export function getTextContent(message: UIMessage): string {
  if (!message.parts) return "";
  return message.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");
}
