"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  SIA_SYSTEM_PROMPT,
  DEFAULT_MODEL,
  DEFAULT_TEMPERATURE,
  MODEL_PRICING,
} from "../_lib/constants";
import type {
  PlaygroundSettings,
  TokenUsage,
  CostEstimate,
  ToolResults,
  QualificationData,
} from "../_lib/types";
import type { TestCase } from "../_lib/test-cases";

export function usePlayground() {
  // ── Settings State ──
  const [systemPrompt, setSystemPrompt] = useState(SIA_SYSTEM_PROMPT);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE);
  const [topP, setTopP] = useState(1);
  const [enableValidateLocation, setEnableValidateLocation] = useState(true);
  const [enableSubmitQualification, setEnableSubmitQualification] = useState(true);

  // ── UI State ──
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [resultsPanelOpen, setResultsPanelOpen] = useState(true);
  const [testCasesOpen, setTestCasesOpen] = useState(false);
  const [activeTestCaseId, setActiveTestCaseId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [totalUsage, setTotalUsage] = useState<TokenUsage>({
    prompt: 0,
    completion: 0,
    total: 0,
    reasoning: 0,
  });
  const [toolResults, setToolResults] = useState<ToolResults>({});

  // ── Cost estimate derived from usage + model ──
  const costEstimate = useMemo<CostEstimate>(() => {
    const pricing = MODEL_PRICING[selectedModel];
    if (!pricing || totalUsage.total === 0) {
      return { inputCost: 0, outputCost: 0, totalCost: 0 };
    }
    const inputCost = (totalUsage.prompt / 1_000_000) * pricing.input;
    const outputCost = (totalUsage.completion / 1_000_000) * pricing.output;
    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
    };
  }, [totalUsage, selectedModel]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // ── Settings ref (avoids transport recreation) ──
  const settingsRef = useRef<PlaygroundSettings>({
    model: selectedModel,
    temperature,
    topP,
    enableValidateLocationTool: enableValidateLocation,
    enableSubmitQualificationTool: enableSubmitQualification,
    systemPrompt,
  });

  settingsRef.current = {
    model: selectedModel,
    temperature,
    topP,
    enableValidateLocationTool: enableValidateLocation,
    enableSubmitQualificationTool: enableSubmitQualification,
    systemPrompt,
  };

  // ── Stable transport ──
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

  const { messages, sendMessage, status, setMessages, stop, regenerate } =
    useChat({
      transport,
      onData: (dataPart) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const part = dataPart as any;
        if (part.type === "data-usage") {
          const data = part.data;
          setTotalUsage((prev) => ({
            prompt:
              prev.prompt + (data.promptTokens || data.inputTokens || 0),
            completion:
              prev.completion +
              (data.completionTokens || data.outputTokens || 0),
            total: prev.total + (data.totalTokens || 0),
            reasoning:
              prev.reasoning +
              (data.outputTokenDetails?.reasoningTokens || 0),
          }));
        }
      },
    });

  const isLoading = status === "streaming" || status === "submitted";

  // ── Sync tool results from messages ──
  useEffect(() => {
    let newLocationValidation: Record<string, unknown> | undefined;
    let newQualification: QualificationData | undefined;

    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (!m.parts) continue;
      for (const part of m.parts) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = part as any;
        const toolName =
          p.toolName ||
          (p.type === "tool-invocation"
            ? p.toolInvocation?.toolName
            : p.type?.replace("tool-", ""));
        const result = p.toolInvocation?.result || p.result || p.output;

        if (toolName === "validateLocation" && !newLocationValidation && result)
          newLocationValidation = result;
        if (toolName === "submitQualification" && !newQualification && result)
          newQualification = result as QualificationData;
      }
      if (newLocationValidation && newQualification) break;
    }

    setToolResults({
      locationValidation: newLocationValidation,
      qualification: newQualification,
    });
  }, [messages]);

  // ── Handlers ──
  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault?.();
      if (!inputValue.trim() || isLoading) return;
      setActiveTestCaseId(null);
      sendMessage({ text: inputValue });
      setInputValue("");
    },
    [inputValue, isLoading, sendMessage]
  );

  const sendLocationMessage = useCallback(
    (details: {
      formattedAddress: string;
      neighborhood: string;
      city: string;
      state: string;
    }) => {
      if (isLoading) return;
      const text = `📍 Localização selecionada: **${details.formattedAddress}**\n- Bairro: ${details.neighborhood || "N/A"}\n- Cidade: ${details.city || "N/A"}\n- Estado: ${details.state || "N/A"}`;
      setActiveTestCaseId(null);
      sendMessage({ text });
    },
    [isLoading, sendMessage]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const deleteMessage = useCallback(
    (id: string) => {
      setMessages(messages.filter((m: UIMessage) => m.id !== id));
    },
    [messages, setMessages]
  );

  const startEditing = useCallback((message: UIMessage) => {
    setEditingMessageId(message.id);
    const text = message.parts
      ?.filter(
        (p): p is Extract<typeof p, { type: "text" }> => p.type === "text"
      )
      .map((p) => p.text)
      .join("");
    setEditingContent(text || "");
  }, []);

  const saveEdit = useCallback(
    (id: string) => {
      const msgIndex = messages.findIndex((m: UIMessage) => m.id === id);
      if (msgIndex === -1) return;

      const message = messages[msgIndex];

      if (message.role === "user") {
        const updatedMessage = {
          ...message,
          parts: [{ type: "text" as const, text: editingContent }],
        };
        const newMessages = [...messages.slice(0, msgIndex), updatedMessage];
        setMessages(newMessages);
        setEditingMessageId(null);
        setEditingContent("");
        setTimeout(() => regenerate(), 10);
        return;
      }

      setMessages(
        messages.map((m: UIMessage) =>
          m.id === id
            ? { ...m, parts: [{ type: "text" as const, text: editingContent }] }
            : m
        )
      );
      setEditingMessageId(null);
      setEditingContent("");
    },
    [messages, editingContent, setMessages, regenerate]
  );

  const cancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditingContent("");
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setToolResults({});
    setTotalUsage({ prompt: 0, completion: 0, total: 0, reasoning: 0 });
    setActiveTestCaseId(null);
  }, [setMessages]);

  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // ── Load Test Case ──
  const loadTestCase = useCallback(
    (tc: TestCase) => {
      setMessages(tc.messages);
      setToolResults(tc.toolResults);
      setTotalUsage({ prompt: 0, completion: 0, total: 0, reasoning: 0 });
      setActiveTestCaseId(tc.id);
      setResultsPanelOpen(true);
    },
    [setMessages]
  );

  const visibleMessages = messages.filter(
    (m: UIMessage) => m.role !== "system"
  );

  return {
    // Settings
    systemPrompt,
    setSystemPrompt,
    selectedModel,
    setSelectedModel,
    temperature,
    setTemperature,
    topP,
    setTopP,
    enableValidateLocation,
    setEnableValidateLocation,
    enableSubmitQualification,
    setEnableSubmitQualification,

    // UI State
    sidebarOpen,
    setSidebarOpen,
    resultsPanelOpen,
    setResultsPanelOpen,
    testCasesOpen,
    setTestCasesOpen,
    activeTestCaseId,
    editingMessageId,
    editingContent,
    setEditingContent,
    copiedId,
    inputValue,
    setInputValue,
    totalUsage,
    costEstimate,
    toolResults,
    isLoading,
    visibleMessages,

    // Refs
    messagesEndRef,
    chatContainerRef,

    // Actions
    handleSubmit,
    sendLocationMessage,
    deleteMessage,
    startEditing,
    saveEdit,
    cancelEdit,
    clearChat,
    copyToClipboard,
    loadTestCase,
    stop,
    regenerate,
  };
}
