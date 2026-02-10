"use client";

import { Send, X, RotateCcw, Bot } from "lucide-react";
import type { UIMessage } from "ai";
import type { RefObject } from "react";
import { MessageBubble } from "./message-bubble";

interface ChatAreaProps {
  visibleMessages: UIMessage[];
  isLoading: boolean;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onStop: () => void;
  onRegenerate: () => void;
  // Message actions
  editingMessageId: string | null;
  editingContent: string;
  onEditingContentChange: (content: string) => void;
  onStartEdit: (message: UIMessage) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
  /** Called from inline PlacesAutocomplete inside a message bubble */
  onSendLocationMessage?: (details: {
    formattedAddress: string;
    neighborhood: string;
    city: string;
    state: string;
  }) => void;
  // Refs
  chatContainerRef: RefObject<HTMLDivElement | null>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

export function ChatArea({
  visibleMessages,
  isLoading,
  inputValue,
  onInputChange,
  onSubmit,
  onStop,
  onRegenerate,
  editingMessageId,
  editingContent,
  onEditingContentChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onCopy,
  copiedId,
  onSendLocationMessage,
  chatContainerRef,
  messagesEndRef,
}: ChatAreaProps) {
  // Helper: check if any user message after a given index contains a location submission
  const isLocationSubmittedAfter = (messageIndex: number) => {
    for (let i = messageIndex + 1; i < visibleMessages.length; i++) {
      const m = visibleMessages[i];
      if (m.role === "user") {
        const text = m.parts
          ?.filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
          .map((p) => p.text)
          .join("") || "";
        if (text.includes("📍 Localização selecionada")) return true;
      }
    }
    return false;
  };

  return (
    <main className="flex-1 flex flex-col min-w-0">
      {/* Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto">
        {visibleMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-3">
            <div className="relative">
              <Bot className="h-12 w-12" />
              <span className="absolute -top-1 -right-1 text-lg">🏖️</span>
            </div>
            <p className="text-lg font-medium">Olá! Sou a Sia</p>
            <p className="text-sm text-center max-w-sm">
              Agente de pré-qualificação de terrenos da Seazone. Me conte sobre
              o terreno que você tem disponível.
            </p>
            <div className="flex gap-2 mt-2">
              {[
                "Tenho um terreno no Campeche",
                "Sou corretor com um lote em Jurerê",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    onInputChange(suggestion);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-4 px-4 space-y-1">
            {visibleMessages.map((message: UIMessage, msgIndex: number) => (
              <MessageBubble
                key={message.id}
                message={message}
                isEditing={editingMessageId === message.id}
                editingContent={editingContent}
                onEditingContentChange={onEditingContentChange}
                onStartEdit={onStartEdit}
                onSaveEdit={onSaveEdit}
                onCancelEdit={onCancelEdit}
                onDelete={onDelete}
                onCopy={onCopy}
                copiedId={copiedId}
                onSendLocationMessage={onSendLocationMessage}
                locationAlreadySubmitted={isLocationSubmittedAfter(msgIndex)}
              />
            ))}
            {isLoading &&
              visibleMessages[visibleMessages.length - 1]?.role !==
                "assistant" && (
                <div className="flex items-start gap-3 py-3">
                  <div className="shrink-0 w-7 h-7 rounded-full bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-background p-4 shrink-0">
        <div className="max-w-3xl mx-auto space-y-2">
          <form
            onSubmit={onSubmit}
            className="flex items-center justify-center gap-2"
          >
            <textarea
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit();
                }
              }}
              placeholder="Digite sua mensagem..."
              rows={1}
              className="flex-1 h-11 min-h-[44px] max-h-32 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-[11px] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-y-auto"
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height =
                  Math.min(target.scrollHeight, 128) + "px";
              }}
            />
            {isLoading ? (
              <button
                type="button"
                onClick={() => onStop()}
                className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
                title="Parar geração"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Enviar"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
            {visibleMessages.length > 0 && !isLoading && (
              <button
                type="button"
                onClick={() => onRegenerate()}
                className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                title="Regenerar última resposta"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
