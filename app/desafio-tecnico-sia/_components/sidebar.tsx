"use client";

import {
  ChevronDown,
  Trash2,
} from "lucide-react";
import { AVAILABLE_MODELS, SIA_SYSTEM_PROMPT } from "../_lib/constants";

interface SidebarProps {
  isOpen: boolean;
  selectedModel: string;
  onModelChange: (model: string) => void;
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
  temperature: number;
  onTemperatureChange: (temp: number) => void;
  enableValidateLocation: boolean;
  onToggleValidateLocation: () => void;
  enableSubmitQualification: boolean;
  onToggleSubmitQualification: () => void;
  onClearChat: () => void;
}

function ToolToggle({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {description}
        </p>
      </div>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
          enabled ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export function Sidebar({
  isOpen,
  selectedModel,
  onModelChange,
  systemPrompt,
  onSystemPromptChange,
  temperature,
  onTemperatureChange,
  enableValidateLocation,
  onToggleValidateLocation,
  enableSubmitQualification,
  onToggleSubmitQualification,
  onClearChat,
}: SidebarProps) {
  const isDefaultPrompt = systemPrompt === SIA_SYSTEM_PROMPT;

  return (
    <aside
      className={`${
        isOpen ? "w-80" : "w-0"
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
              onChange={(e) => onModelChange(e.target.value)}
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
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              System Prompt
            </label>
            {!isDefaultPrompt && (
              <button
                onClick={() => onSystemPromptChange(SIA_SYSTEM_PROMPT)}
                className="text-[10px] text-blue-500 hover:text-blue-600 cursor-pointer"
              >
                Restaurar Sia
              </button>
            )}
          </div>
          <textarea
            value={systemPrompt}
            onChange={(e) => onSystemPromptChange(e.target.value)}
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
            onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
            className="mt-1.5 w-full accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>Preciso</span>
            <span>Criativo</span>
          </div>
        </div>

        {/* ── Seazone Tools ── */}
        <div>
          <label className="text-xs font-medium text-blue-500 uppercase tracking-wider">
            🏖️ Tools Seazone
          </label>
          <div className="mt-1.5 space-y-2">
            <ToolToggle
              label="Validação Geográfica"
              description="Valida se o bairro está na área de interesse"
              enabled={enableValidateLocation}
              onToggle={onToggleValidateLocation}
            />
            <ToolToggle
              label="Qualificação de Lead"
              description="Gera JSON estruturado para o CRM"
              enabled={enableSubmitQualification}
              onToggle={onToggleSubmitQualification}
            />
          </div>
        </div>

        {/* Clear Chat */}
        <button
          onClick={onClearChat}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-950 transition-colors cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
          Limpar conversa
        </button>
      </div>
    </aside>
  );
}
