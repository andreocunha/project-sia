"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Sparkles, Settings2, FlaskConical, PanelRight } from "lucide-react";

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  resultsPanelOpen: boolean;
  onToggleResultsPanel: () => void;
  onToggleTestCases: () => void;
}

export function Header({
  sidebarOpen,
  onToggleSidebar,
  resultsPanelOpen,
  onToggleResultsPanel,
  onToggleTestCases,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-background/80 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-blue-500" />
        <h1 className="text-lg font-semibold">AI Playground</h1>
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
          SIA · Terrenos
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleTestCases}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          title="Casos de teste"
        >
          <FlaskConical className="h-4 w-4" />
        </button>
        <button
          onClick={onToggleResultsPanel}
          className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
            resultsPanelOpen ? "bg-gray-100 dark:bg-gray-800" : ""
          }`}
          title="Painel de resultados"
        >
          <PanelRight className="h-4 w-4" />
        </button>
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
            sidebarOpen ? "bg-gray-100 dark:bg-gray-800" : ""
          }`}
          title="Configurações"
        >
          <Settings2 className="h-4 w-4" />
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
