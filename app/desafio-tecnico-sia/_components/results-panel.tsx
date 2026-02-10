"use client";

import {
  MapPin,
  CheckCircle2,
  XCircle,
  Sparkles,
  Activity,
  DollarSign,
} from "lucide-react";
import type { TokenUsage, CostEstimate, ToolResults } from "../_lib/types";
import { AVAILABLE_MODELS } from "../_lib/constants";
import { QualificationCard } from "./qualification-card";

interface ResultsPanelProps {
  isOpen: boolean;
  toolResults: ToolResults;
  totalUsage: TokenUsage;
  costEstimate: CostEstimate;
  selectedModel: string;
}

export function ResultsPanel({
  isOpen,
  toolResults,
  totalUsage,
  costEstimate,
  selectedModel,
}: ResultsPanelProps) {
  const hasLocationResult = !!toolResults.locationValidation;
  const hasQualification = !!toolResults.qualification;
  const hasUsage = totalUsage.total > 0;
  const hasAnyResult = hasLocationResult || hasQualification || hasUsage;

  return (
    <aside
      className={`${
        isOpen ? "w-80" : "w-0"
      } transition-all duration-300 overflow-hidden border-l border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0`}
    >
      <div className="w-80 h-full overflow-y-auto p-4 space-y-5">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-500" />
          <h2 className="text-sm font-semibold">Resultados</h2>
        </div>

        {!hasAnyResult && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500 gap-2">
            <Activity className="h-8 w-8" />
            <p className="text-xs text-center">
              Os resultados das validações e qualificação aparecerão aqui durante a conversa.
            </p>
          </div>
        )}

        {/* ── Location Validation ── */}
        {hasLocationResult && (
          <div className="animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Validação Geográfica
              </label>
              <MapPin className="h-3 w-3 text-blue-500" />
            </div>
            <div
              className={`rounded-lg border p-3 text-xs font-mono ${
                (toolResults.locationValidation as Record<string, unknown>)
                  .allowed
                  ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/50"
                  : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {(toolResults.locationValidation as Record<string, unknown>)
                  .allowed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="font-semibold not-mono text-sm">
                  {(toolResults.locationValidation as Record<string, unknown>)
                    .allowed
                    ? "Bairro Aprovado"
                    : "Bairro Rejeitado"}
                </span>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(toolResults.locationValidation, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* ── Qualification ── */}
        {hasQualification && (
          <QualificationCard qualification={toolResults.qualification!} />
        )}

        {/* ── Usage Stats ── */}
        {hasUsage && (
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

        {/* ── Cost Estimate ── */}
        {costEstimate.totalCost > 0 && (
          <div className="animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Custo Estimado
              </label>
              <DollarSign className="h-3 w-3 text-yellow-500" />
            </div>
            <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/50 p-3 text-xs font-mono space-y-1">
              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>Modelo:</span>
                <span className="font-semibold text-gray-600 dark:text-gray-300">
                  {AVAILABLE_MODELS.find((m) => m.id === selectedModel)?.name ?? selectedModel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Input:</span>
                <span>${costEstimate.inputCost.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Output:</span>
                <span>${costEstimate.outputCost.toFixed(6)}</span>
              </div>
              <div className="border-t border-yellow-200 dark:border-yellow-800 my-1 pt-1 flex justify-between font-bold">
                <span>Total:</span>
                <span>${costEstimate.totalCost.toFixed(6)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
