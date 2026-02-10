"use client";

import {
  CheckCircle2,
  XCircle,
  MapPin,
  FileJson,
  ArrowRight,
} from "lucide-react";
import type { QualificationData } from "../_lib/types";

interface QualificationCardProps {
  qualification: QualificationData;
}

function getNextStepLabel(step: string) {
  switch (step) {
    case "agendar_reuniao":
      return "Agendar Reunião";
    case "enviar_estudo":
      return "Enviar Estudo";
    case "disqualified":
      return "Desqualificado";
    default:
      return step;
  }
}

function getNextStepColor(step: string) {
  switch (step) {
    case "agendar_reuniao":
      return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50";
    case "enviar_estudo":
      return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50";
    case "disqualified":
      return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50";
    default:
      return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/50";
  }
}

export function QualificationCard({ qualification }: QualificationCardProps) {
  const isQualified = qualification.lead_qualified;

  return (
    <div className="animate-in fade-in zoom-in duration-300">
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Qualificação do Lead
        </label>
        <FileJson className="h-3 w-3 text-emerald-500" />
      </div>

      <div
        className={`rounded-lg border p-4 space-y-3 ${
          isQualified
            ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50"
            : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50"
        }`}
      >
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {isQualified ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          <span
            className={`text-sm font-bold ${
              isQualified
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-red-700 dark:text-red-300"
            }`}
          >
            {isQualified ? "Lead Qualificado ✓" : "Lead Desqualificado ✗"}
          </span>
        </div>

        {/* Data Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="space-y-0.5">
            <span className="text-gray-500 dark:text-gray-400">Tipo</span>
            <p className="font-medium capitalize">
              {qualification.owner_type}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-gray-500 dark:text-gray-400">
              <MapPin className="h-3 w-3 inline mr-1" />
              Local
            </span>
            <p className="font-medium">
              {qualification.location.bairro}, {qualification.location.cidade}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-gray-500 dark:text-gray-400">Área</span>
            <p className="font-medium">{qualification.land_size_m2} m²</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-gray-500 dark:text-gray-400">Valor</span>
            <p className="font-medium">
              R$ {qualification.asking_price.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-gray-500 dark:text-gray-400">Jurídico</span>
            <p className="font-medium">{qualification.legal_status}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-gray-500 dark:text-gray-400">
              Diferencial
            </span>
            <p className="font-medium">
              {qualification.is_beachfront
                ? "Frente Mar"
                : qualification.has_sea_view
                ? "Vista Mar"
                : "Sem vista mar"}
            </p>
          </div>
        </div>

        {/* Neighborhood Focus */}
        {qualification.neighborhood_focus && (
          <div className="text-xs border-t border-gray-200 dark:border-gray-700 pt-2">
            <span className="text-gray-500 dark:text-gray-400">
              Foco do bairro:
            </span>
            <span className="ml-1 font-medium">
              {qualification.neighborhood_focus}
            </span>
          </div>
        )}

        {/* Next Step */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Próximo passo
          </span>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${getNextStepColor(
              qualification.next_step
            )}`}
          >
            <ArrowRight className="h-3 w-3" />
            {getNextStepLabel(qualification.next_step)}
          </span>
        </div>

        {/* Raw JSON (collapsible) */}
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            Ver JSON bruto
          </summary>
          <pre className="mt-2 overflow-x-auto font-mono bg-white/50 dark:bg-black/20 rounded p-2 text-[11px]">
            {JSON.stringify(qualification, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}
