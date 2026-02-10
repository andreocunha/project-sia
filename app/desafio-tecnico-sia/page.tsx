"use client";

import { usePlayground } from "./_hooks/use-playground";
import { Header } from "./_components/header";
import { Sidebar } from "./_components/sidebar";
import { ChatArea } from "./_components/chat-area";
import { ResultsPanel } from "./_components/results-panel";
import { TestCasesDrawer } from "./_components/test-cases-drawer";

export default function PlaygroundPage() {
  const pg = usePlayground();

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <Header
        sidebarOpen={pg.sidebarOpen}
        onToggleSidebar={() => pg.setSidebarOpen(!pg.sidebarOpen)}
        resultsPanelOpen={pg.resultsPanelOpen}
        onToggleResultsPanel={() =>
          pg.setResultsPanelOpen(!pg.resultsPanelOpen)
        }
        onToggleTestCases={() => pg.setTestCasesOpen(!pg.testCasesOpen)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={pg.sidebarOpen}
          selectedModel={pg.selectedModel}
          onModelChange={pg.setSelectedModel}
          systemPrompt={pg.systemPrompt}
          onSystemPromptChange={pg.setSystemPrompt}
          temperature={pg.temperature}
          onTemperatureChange={pg.setTemperature}
          enableValidateLocation={pg.enableValidateLocation}
          onToggleValidateLocation={() =>
            pg.setEnableValidateLocation(!pg.enableValidateLocation)
          }
          enableSubmitQualification={pg.enableSubmitQualification}
          onToggleSubmitQualification={() =>
            pg.setEnableSubmitQualification(!pg.enableSubmitQualification)
          }
          onClearChat={pg.clearChat}
        />

        <ChatArea
          visibleMessages={pg.visibleMessages}
          isLoading={pg.isLoading}
          inputValue={pg.inputValue}
          onInputChange={pg.setInputValue}
          onSubmit={pg.handleSubmit}
          onStop={pg.stop}
          onRegenerate={pg.regenerate}
          editingMessageId={pg.editingMessageId}
          editingContent={pg.editingContent}
          onEditingContentChange={pg.setEditingContent}
          onStartEdit={pg.startEditing}
          onSaveEdit={pg.saveEdit}
          onCancelEdit={pg.cancelEdit}
          onDelete={pg.deleteMessage}
          onCopy={pg.copyToClipboard}
          copiedId={pg.copiedId}
          onSendLocationMessage={pg.sendLocationMessage}
          chatContainerRef={pg.chatContainerRef}
          messagesEndRef={pg.messagesEndRef}
        />

        <ResultsPanel
          isOpen={pg.resultsPanelOpen}
          toolResults={pg.toolResults}
          totalUsage={pg.totalUsage}
          costEstimate={pg.costEstimate}
          selectedModel={pg.selectedModel}
        />
      </div>

      <TestCasesDrawer
        isOpen={pg.testCasesOpen}
        onClose={() => pg.setTestCasesOpen(false)}
        onLoadTestCase={pg.loadTestCase}
        activeTestCaseId={pg.activeTestCaseId}
      />
    </div>
  );
}
