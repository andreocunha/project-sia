"use client";

import { CheckCircle2, XCircle, FlaskConical, X, Play } from "lucide-react";
import { TEST_CASES, type TestCase } from "../_lib/test-cases";

interface TestCasesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTestCase: (tc: TestCase) => void;
  activeTestCaseId: string | null;
}

export function TestCasesDrawer({
  isOpen,
  onClose,
  onLoadTestCase,
  activeTestCaseId,
}: TestCasesDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[420px] max-w-[90vw] bg-background border-l border-gray-200 dark:border-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-purple-500" />
              <h2 className="font-semibold">Cenários de Teste</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Description */}
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800/50 bg-purple-50/50 dark:bg-purple-950/20">
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Clique em um cenário para carregar a conversa completa no chat.
              Esses testes demonstram a Sia em ação — validação geográfica,
              coleta de dados e geração do JSON estruturado.
            </p>
          </div>

          {/* Test Cases List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {TEST_CASES.map((tc) => {
              const isActive = activeTestCaseId === tc.id;
              const isSuccess = tc.badge === "success";

              return (
                <button
                  key={tc.id}
                  onClick={() => {
                    onLoadTestCase(tc);
                    onClose();
                  }}
                  className={`w-full text-left rounded-xl border p-4 transition-all cursor-pointer group hover:shadow-md ${
                    isActive
                      ? isSuccess
                        ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/30 shadow-sm"
                        : "border-red-300 dark:border-red-700 bg-red-50/80 dark:bg-red-950/30 shadow-sm"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Badge icon */}
                    <div
                      className={`shrink-0 mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center ${
                        isSuccess
                          ? "bg-emerald-100 dark:bg-emerald-900/50"
                          : "bg-red-100 dark:bg-red-900/50"
                      }`}
                    >
                      {isSuccess ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold truncate">
                          {tc.title}
                        </h3>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            isSuccess
                              ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300"
                              : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                          }`}
                        >
                          {isSuccess ? "Aprovado" : "Rejeitado"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                        {tc.description}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400 dark:text-gray-500">
                        <Play className="h-3 w-3" />
                        <span>{tc.messages.length} mensagens</span>
                        {isActive && (
                          <span className="ml-auto text-blue-500 font-medium">
                            Ativo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 text-[10px] text-gray-400 text-center">
            Cenários pré-montados para avaliação do desafio técnico
          </div>
        </div>
      </div>
    </>
  );
}
