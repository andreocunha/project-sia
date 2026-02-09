"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Send,
  Trash2,
  Settings2,
  X,
  Pencil,
  Check,
  RotateCcw,
  ChevronDown,
  Sparkles,
  Bot,
  User,
  Wrench,
  Copy,
  CopyCheck,
} from "lucide-react";

const AVAILABLE_MODELS = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI" },
  { id: "gpt-4.1", name: "GPT-4.1", provider: "OpenAI" },
  { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", provider: "OpenAI" },
  { id: "gpt-5.2", name: "GPT-5.2", provider: "OpenAI" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "Google" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google" },
  { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", provider: "Google" },
  { id: "gemini-3-flash-preview", name: "Gemini 3 Flash", provider: "Google" },
];

function getTextContent(message: UIMessage): string {
  if (!message.parts) return "";
  return message.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export default function PlaygroundPage() {
  const [systemPrompt, setSystemPrompt] = useState(
    "Você é um assistente útil e amigável."
  );
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState<number | "">("");
  const [topP, setTopP] = useState(1);
  const [enableUserInfo, setEnableUserInfo] = useState(false);
  const [enableWeather, setEnableWeather] = useState(false);
  const [toolResults, setToolResults] = useState<{
    userInfo?: Record<string, unknown>;
    weather?: Record<string, unknown>;
  }>({});
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [totalUsage, setTotalUsage] = useState({
    prompt: 0,
    completion: 0,
    total: 0,
    reasoning: 0,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // useRef to always have the latest settings without recreating transport
  const settingsRef = useRef({
    model: selectedModel,
    temperature,
    maxTokens: maxTokens || undefined,
    topP,
    enableUserInfoTool: enableUserInfo,
    enableWeatherTool: enableWeather,
    systemPrompt,
  });
  // Keep ref in sync on every render
  settingsRef.current = {
    model: selectedModel,
    temperature,
    maxTokens: maxTokens || undefined,
    topP,
    enableUserInfoTool: enableUserInfo,
    enableWeatherTool: enableWeather,
    systemPrompt,
  };

  // Stable transport — created only once, reads settings from ref on each request
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest({ body, messages, ...rest }) {
          return {
            ...rest,
            body: {
              ...body,
              messages,
              ...settingsRef.current,
            },
          };
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const {
    messages,
    sendMessage,
    status,
    setMessages,
    stop,
    regenerate,
  } = useChat({
    transport,
    onData: (dataPart) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const part = dataPart as any;
      if (part.type === "data-usage") {
        const data = part.data;
        setTotalUsage((prev) => ({
          prompt: prev.prompt + (data.promptTokens || data.inputTokens || 0),
          completion: prev.completion + (data.completionTokens || data.outputTokens || 0),
          total: prev.total + (data.totalTokens || 0),
          reasoning: prev.reasoning + (data.outputTokenDetails?.reasoningTokens || 0),
        }));
      }
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Sync tool results from messages history
  useEffect(() => {
    let newUserInfo: Record<string, unknown> | undefined = undefined;
    let newWeather: Record<string, unknown> | undefined = undefined;

    // Search backwards for the latest tool invocations
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.parts) {
        for (const part of m.parts) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const p = part as any;
          const toolName =
            p.toolName ||
            (p.type === "tool-invocation"
              ? p.toolInvocation?.toolName
              : p.type?.replace("tool-", ""));
            
          const result = p.toolInvocation?.result || p.result || p.output;

          if (toolName === "collectUserInfo" && !newUserInfo && result) {
             newUserInfo = result as Record<string, unknown>;
          }
          if (toolName === "getWeather" && !newWeather && result) {
             newWeather = result as Record<string, unknown>;
          }
        }
      }
      if (newUserInfo && newWeather) break;
    }

    setToolResults({
        userInfo: newUserInfo,
        weather: newWeather
    });
  }, [messages]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault?.();
    if (!inputValue.trim() || isLoading) return;
    sendMessage({ text: inputValue });
    setInputValue("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const deleteMessage = (id: string) => {
    setMessages(messages.filter((m: UIMessage) => m.id !== id));
  };

  const startEditing = (message: UIMessage) => {
    setEditingMessageId(message.id);
    setEditingContent(getTextContent(message));
  };

  const saveEdit = (id: string) => {
    const msgIndex = messages.findIndex((m: UIMessage) => m.id === id);
    if (msgIndex === -1) return;

    const message = messages[msgIndex];

    // Se for mensagem do usuário, corta o histórico e regenera
    if (message.role === "user") {
      const updatedMessage = {
        ...message,
        parts: [{ type: "text" as const, text: editingContent }],
      };
      
      const newMessages = [...messages.slice(0, msgIndex), updatedMessage];
      setMessages(newMessages);
      setEditingMessageId(null);
      setEditingContent("");
      
      // Aguarda atualização do estado para garantir que o regenerate pegue a nova lista
      setTimeout(() => regenerate(), 10);
      return;
    }

    setMessages(
      messages.map((m: UIMessage) =>
        m.id === id
          ? {
              ...m,
              parts: [{ type: "text" as const, text: editingContent }],
            }
          : m
      )
    );
    setEditingMessageId(null);
    setEditingContent("");
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  const clearChat = () => {
    setMessages([]);
    setToolResults({});
    setTotalUsage({ prompt: 0, completion: 0, total: 0, reasoning: 0 });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const visibleMessages = messages.filter((m: UIMessage) => m.role !== "system");

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-background/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <h1 className="text-lg font-semibold">AI Playground</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
            SIA
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title="Configurações"
          >
            <Settings2 className="h-4 w-4" />
          </button>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Configurações */}
        <aside
          className={`${
            sidebarOpen ? "w-80" : "w-0"
          } transition-all duration-300 overflow-hidden border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0`}
        >
          <div className="w-80 h-full overflow-y-auto p-4 space-y-5">
            {/* Modelo */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Modelo
              </label>
              <div className="relative mt-1.5">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {AVAILABLE_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.provider} — {model.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* System Prompt */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                System Prompt
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={6}
                className="mt-1.5 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Defina o comportamento do assistente..."
              />
            </div>

            {/* Temperatura */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Temperatura
                </label>
                <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
                  {temperature.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="mt-1.5 w-full accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>Preciso</span>
                <span>Criativo</span>
              </div>
            </div>
            
            {/* Max Tokens */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Max Tokens
              </label>
              <input
                type="number"
                value={maxTokens}
                onChange={(e) =>
                  setMaxTokens(
                    e.target.value === "" ? "" : parseInt(e.target.value)
                  )
                }
                placeholder="Sem limite"
                className="mt-1.5 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* User Info Tool Toggle */}
            <div className="flex items-start justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-3">
              <div>
                <p className="text-sm font-medium">Coleta de Info</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Ativa a tool de coleta de nome/idade
                </p>
              </div>
              <button
                onClick={() => setEnableUserInfo(!enableUserInfo)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                  enableUserInfo ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enableUserInfo ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Weather Tool Toggle */}
            <div className="flex items-start justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-3">
              <div>
                <p className="text-sm font-medium">Clima</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Ativa a tool de verificação de clima
                </p>
              </div>
              <button
                onClick={() => setEnableWeather(!enableWeather)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                  enableWeather ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enableWeather ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Tool Results */}
            {toolResults.userInfo && (
              <div className="animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Dados Coletados
                  </label>
                  <Sparkles className="h-3 w-3 text-purple-500" />
                </div>
                <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/50 p-3 text-xs font-mono">
                    <pre className="overflow-x-auto">
                      {JSON.stringify(toolResults.userInfo, null, 2)}
                    </pre>
                </div>
              </div>
            )}

            {toolResults.weather && (
              <div className="animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Clima Detectado
                  </label>
                  <Sparkles className="h-3 w-3 text-blue-500" />
                </div>
                <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 p-3 text-xs font-mono">
                    <pre className="overflow-x-auto">
                      {JSON.stringify(toolResults.weather, null, 2)}
                    </pre>
                </div>
              </div>
            )}

            {/* Usage Stats */}
            {totalUsage.total > 0 && (
              <div className="animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Uso de Tokens
                  </label>
                  <Sparkles className="h-3 w-3 text-green-500" />
                </div>
                <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/50 p-3 text-xs font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Input:</span>
                    <span>{totalUsage.prompt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Output:</span>
                    <span>{totalUsage.completion}</span>
                  </div>
                  {totalUsage.reasoning > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Reasoning:</span>
                      <span>{totalUsage.reasoning}</span>
                    </div>
                  )}
                  <div className="border-t border-green-200 dark:border-green-800 my-1 pt-1 flex justify-between font-bold">
                    <span>Total:</span>
                    <span>{totalUsage.total}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Clear Chat */}
            <button
              onClick={clearChat}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-950 transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Limpar conversa
            </button>
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto"
          >
            {visibleMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-3">
                <Bot className="h-12 w-12" />
                <p className="text-lg font-medium">Comece uma conversa</p>
                <p className="text-sm">
                  Configure o modelo e o system prompt na barra lateral
                </p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto py-4 px-4 space-y-1">
                {visibleMessages.map((message: UIMessage) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isEditing={editingMessageId === message.id}
                    editingContent={editingContent}
                    onEditingContentChange={setEditingContent}
                    onStartEdit={startEditing}
                    onSaveEdit={saveEdit}
                    onCancelEdit={cancelEdit}
                    onDelete={deleteMessage}
                    onCopy={copyToClipboard}
                    copiedId={copiedId}
                  />
                ))}
                {isLoading && visibleMessages[visibleMessages.length - 1]?.role !== "assistant" && (
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
            <form
              onSubmit={handleSubmit}
              className="max-w-3xl mx-auto flex items-center justify-center gap-2"
            >
              <div className="flex-1 relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="Digite sua mensagem..."
                  rows={1}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32 overflow-y-auto"
                  style={{ minHeight: "44px" }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height =
                      Math.min(target.scrollHeight, 128) + "px";
                  }}
                />
              </div>
              {isLoading ? (
                <button
                  type="button"
                  onClick={() => stop()}
                  className="shrink-0 p-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
                  title="Parar geração"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="shrink-0 p-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Enviar"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
              {visibleMessages.length > 0 && !isLoading && (
                <button
                  type="button"
                  onClick={() => regenerate()}
                  className="shrink-0 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  title="Regenerar última resposta"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─── Message Bubble Component ─── */

interface MessageBubbleProps {
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
}

function MessageBubble({
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
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const textContent = getTextContent(message);

  // Check for tool invocations (in v6, tool parts have type "tool-<name>" or "dynamic-tool")
  const toolParts = message.parts?.filter(
    (p) => p.type.startsWith("tool-") || p.type === "dynamic-tool"
  );

  return (
    <div
      className="group flex items-start gap-3 py-3 rounded-lg px-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
    >
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
          {isUser ? "Você" : "Assistente"}
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
                  // Normalize tool access across different SDK versions/states
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const p = part as any;
                  
                  // Helper to safely extract properties
                  // args is for tool-invocation, input is for tool-generated parts
                  const rawInput = p.toolInvocation?.args || p.args || p.input;
                  const toolName = 
                    p.toolName || 
                    (p.type === 'tool-invocation' ? p.toolInvocation?.toolName : p.type? p.type.replace("tool-", "") : "");

                  const result = p.toolInvocation?.result || p.result || p.output;

                  if (toolName === "collectUserInfo" || toolName === "getWeather") {
                    const isDone = !!result;
                    return (
                        <div key={idx} className={`rounded-lg border p-3 flex items-center gap-3 transition-colors ${
                            isDone 
                            ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30" 
                            : "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
                        }`}>
                            {isDone ? (
                                <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
                                   <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                                </div>
                            ) : (
                                <span className={`shrink-0 block h-4 w-4 rounded-full border-2 border-t-transparent animate-spin ${
                                    toolName === "collectUserInfo" ? "border-purple-500" : "border-blue-500"
                                }`}></span>
                            )}
                            
                            <div className="text-xs">
                                <p className="font-medium text-gray-700 dark:text-gray-300">
                                    {toolName === "collectUserInfo"
                                      ? (isDone ? "Dados do usuário coletados" : "Processando dados do usuário...")
                                      : (isDone ? "Clima verificado" : "Verificando clima...")}
                                </p>
                                {isDone && (
                                    <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                                        Informações processadas com sucesso.
                                    </p>
                                )}
                            </div>
                        </div>
                    )
                  }

                  // Default Fallback
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
              <div className="text-sm whitespace-pre-wrap overflow-wrap-break-word leading-relaxed">
                {textContent}
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
