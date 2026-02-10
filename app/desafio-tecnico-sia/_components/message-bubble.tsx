"use client";

import {
  Pencil,
  Check,
  X,
  Trash2,
  Wrench,
  Copy,
  CopyCheck,
  User,
  Bot,
  MapPin,
  FileJson,
  Search,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { MessageBubbleProps } from "../_lib/types";
import { getTextContent } from "../_lib/types";
import { PlacesAutocomplete } from "./places-autocomplete";

// Tool display names and configs
const TOOL_CONFIG: Record<
  string,
  {
    label: string;
    pendingLabel: string;
    doneLabel: string;
    icon: typeof MapPin;
    color: string;
  }
> = {
  requestLocation: {
    label: "Busca de Endereço",
    pendingLabel: "Preparando busca de endereço...",
    doneLabel: "Busca de endereço",
    icon: Search,
    color: "blue",
  },
  validateLocation: {
    label: "Validação Geográfica",
    pendingLabel: "Validando localização...",
    doneLabel: "Localização validada",
    icon: MapPin,
    color: "emerald",
  },
  submitQualification: {
    label: "Qualificação",
    pendingLabel: "Gerando qualificação...",
    doneLabel: "Qualificação gerada",
    icon: FileJson,
    color: "green",
  },
};

export function MessageBubble({
  message,
  isEditing,
  editingContent,
  onEditingContentChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onCopy,
  copiedId,
  onSendLocationMessage,
  locationAlreadySubmitted,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const textContent = getTextContent(message);

  const toolParts = message.parts?.filter(
    (p) => p.type.startsWith("tool-") || p.type === "dynamic-tool"
  );

  return (
    <div className="group flex items-start gap-3 py-3 rounded-lg px-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      {/* Avatar */}
      <div
        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-gray-200 dark:bg-gray-700"
            : "bg-linear-to-br from-purple-500 to-blue-500"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          {isUser ? "Você" : "Sia"}
        </p>

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editingContent}
              onChange={(e) => onEditingContentChange(e.target.value)}
              className="w-full rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => onSaveEdit(message.id)}
                className="flex items-center gap-1 px-3 py-1 rounded-md bg-blue-500 text-white text-xs hover:bg-blue-600 cursor-pointer"
              >
                <Check className="h-3 w-3" /> Salvar
              </button>
              <button
                onClick={onCancelEdit}
                className="flex items-center gap-1 px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <X className="h-3 w-3" /> Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tool Invocations */}
            {toolParts && toolParts.length > 0 && (
              <div className="mb-2 space-y-2">
                {toolParts.map((part, idx) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const p = part as any;
                  const rawInput =
                    p.toolInvocation?.args || p.args || p.input;
                  const toolName =
                    p.toolName ||
                    (p.type === "tool-invocation"
                      ? p.toolInvocation?.toolName
                      : p.type?.replace("tool-", ""));
                  const result =
                    p.toolInvocation?.result || p.result || p.output;

                  const config = TOOL_CONFIG[toolName];
                  if (config) {
                    const isDone = !!result;

                    // ── requestLocation: render inline PlacesAutocomplete ──
                    if (toolName === "requestLocation") {
                      const alreadySubmitted = locationAlreadySubmitted || false;
                      // Show the autocomplete as soon as the tool is invoked
                      // (state "call" or "result"), not only after result arrives.
                      // The tool is instant/static, so there's no reason to wait.
                      const toolState = p.toolInvocation?.state;
                      // Show as soon as we know it's requestLocation —
                      // only hide during "partial-call" when args are still streaming.
                      const isInvoked = toolState !== "partial-call";

                      return (
                        <div
                          key={idx}
                          className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-3"
                        >
                          <div className="flex items-center gap-2 text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
                            <Search className="h-3.5 w-3.5" />
                            Busca de Endereço
                          </div>

                          {alreadySubmitted ? (
                            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                              <Check className="h-3.5 w-3.5" />
                              Endereço selecionado com sucesso
                            </div>
                          ) : isInvoked ? (
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
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-blue-500">
                              <span className="block h-3.5 w-3.5 rounded-full border-2 border-t-transparent animate-spin border-blue-500" />
                              Preparando buscador...
                            </div>
                          )}
                        </div>
                      );
                    }

                    // ── validateLocation / submitQualification ──
                    const isLocationTool = toolName === "validateLocation";
                    const allowed = isLocationTool && result?.allowed;

                    return (
                      <div
                        key={idx}
                        className={`rounded-lg border p-3 flex items-start gap-3 transition-colors ${
                          isDone
                            ? isLocationTool && !allowed
                              ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                              : "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                            : "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
                        }`}
                      >
                        {isDone ? (
                          <div
                            className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                              isLocationTool && !allowed
                                ? "bg-red-100 dark:bg-red-900"
                                : "bg-green-100 dark:bg-green-900"
                            }`}
                          >
                            {isLocationTool && !allowed ? (
                              <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                            ) : (
                              <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                        ) : (
                          <span className="shrink-0 block h-4 w-4 rounded-full border-2 border-t-transparent animate-spin border-blue-500" />
                        )}

                        <div className="text-xs flex-1">
                          <p className="font-medium text-gray-700 dark:text-gray-300">
                            {isDone ? config.doneLabel : config.pendingLabel}
                          </p>
                          {isDone && result && (
                            <div className="mt-1 text-gray-500 dark:text-gray-400">
                              {isLocationTool ? (
                                <p>
                                  {result.bairro} — {result.allowed ? "✓ Aprovado" : "✗ Fora da área de foco"}
                                  {result.focus && ` (${result.focus})`}
                                </p>
                              ) : (
                                <p>Informações processadas com sucesso.</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Default Fallback for unknown tools
                  return (
                    <div
                      key={idx}
                      className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-3"
                    >
                      <div className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">
                        <Wrench className="h-3.5 w-3.5" />
                        Tool: {toolName}
                      </div>
                      <pre className="text-xs font-mono overflow-x-auto">
                        {JSON.stringify(rawInput, null, 2)}
                      </pre>
                    </div>
                  );
                })}
              </div>
            )}
            {textContent && (
              <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2">
                <ReactMarkdown>{textContent}</ReactMarkdown>
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      {!isEditing && (
        <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onCopy(textContent, message.id)}
            className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
            title="Copiar"
          >
            {copiedId === message.id ? (
              <CopyCheck className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-gray-400" />
            )}
          </button>
          <button
            onClick={() => onStartEdit(message)}
            className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
            title="Editar"
          >
            <Pencil className="h-3.5 w-3.5 text-gray-400" />
          </button>
          <button
            onClick={() => onDelete(message.id)}
            className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 cursor-pointer"
            title="Remover"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-400" />
          </button>
        </div>
      )}
    </div>
  );
}
