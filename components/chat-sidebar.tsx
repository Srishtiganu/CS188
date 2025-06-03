"use client";

import type React from "react";

import { useState, useRef, useEffect, useMemo, useDeferredValue } from "react";
import type { Message } from "ai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  AlertCircle,
  History,
  Plus,
  CornerDownLeft,
  Settings,
  Paperclip,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  ArrowUp,
} from "lucide-react";
import ChatMessage from "./chat-message";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import InitialSurvey from "./initial-survey";

interface ChatHistoryItem {
  id: string;
  title: string;
  date: string;
}

interface ChatSidebarProps {
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  suggestions: string[];
  isLoading: boolean;
  hasInteracted: boolean;
  onNewChat: () => void;
  chatHistory: ChatHistoryItem[];
  onLoadThread: (threadId: string) => void;
  currentThreadId: string;
  onFileUpload?: (file: File) => void;
  onPreferencesUpdate?: (preferences: {
    familiarity: string;
    goal: string;
  }) => void;
  selectedText?: string;
  onClearSelectedText?: () => void;
}

export default function ChatSidebar({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  suggestions,
  isLoading,
  hasInteracted,
  onNewChat,
  chatHistory,
  onLoadThread,
  currentThreadId,
  onFileUpload,
  onPreferencesUpdate,
  selectedText,
  onClearSelectedText,
}: ChatSidebarProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Defer message updates to reduce typing lag
  const deferredMessages = useDeferredValue(messages);
  const renderedMessages = useMemo(() => {
    return deferredMessages.length === 0
      ? null
      : deferredMessages
          .filter((message) => message.content !== "GENERATE_SUMMARY")
          .map((message) =>
            message.role === "system" ? (
              <div
                key={message.id}
                className="text-center text-sm text-gray-500 my-2"
              >
                {message.content}
              </div>
            ) : (
              <ChatMessage key={message.id} message={message} />
            )
          );
  }, [deferredMessages]);
  // Selected suggestion state
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(
    null
  );
  // Memoize suggestions rendering
  const renderedSuggestions = useMemo(
    () =>
      suggestions.slice(0, 3).map((suggestion) => (
        <button
          key={suggestion}
          className={`text-xs text-gray-600 border border-gray-300 rounded-md px-2.5 py-1 hover:underline hover:bg-gray-50 flex items-center gap-1 transition-colors ${
            selectedSuggestion === suggestion
              ? "bg-blue-50 border-blue-200"
              : ""
          }`}
          onClick={() => handleSuggestionClick(suggestion)}
        >
          {suggestion}
          <CornerDownLeft className="h-3 w-3 text-gray-400" />
        </button>
      )),
    [suggestions, selectedSuggestion]
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [surveyCompleted, setSurveyCompleted] = useState<boolean>(false);
  const [userPreferences, setUserPreferences] = useState({
    familiarity: "Beginner",
    goal: "Just skimming",
  });

  const goalOptions = ["Just skimming", "Deep dive"];

  // Check if survey was completed before
  useEffect(() => {
    const completed = localStorage.getItem("surveyCompleted") === "true";
    if (completed) {
      setSurveyCompleted(true);
      const savedPreferences = localStorage.getItem("userPreferences");
      if (savedPreferences) {
        setUserPreferences(JSON.parse(savedPreferences));
      }
    }
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150
      )}px`;
    }
  }, [input]);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    if (textareaRef.current) {
      textareaRef.current.value = suggestion;
      textareaRef.current.focus();
    }
    setSelectedSuggestion(suggestion);

    // Trigger the input change event
    const event = {
      target: { value: suggestion },
    } as React.ChangeEvent<HTMLTextAreaElement>;

    handleInputChange(event);
  };

  // Handle form submission with error handling
  const handleFormSubmitWithErrorHandling = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError(null);
    try {
      await handleSubmit(e);
    } catch (err) {
      setError("Failed to send message. Please try again.");
      console.error("Error submitting form:", err);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        handleFormSubmitWithErrorHandling(
          new Event("submit") as unknown as React.FormEvent<HTMLFormElement>
        );
      }
    }
  };

  // Handle thread selection
  const handleThreadSelect = (threadId: string) => {
    onLoadThread(threadId);
    setHistoryOpen(false);
  };

  // Handle survey submission
  const handleSurveySubmit = (preferences: {
    familiarity: string;
    goal: string;
  }) => {
    setUserPreferences(preferences);
    setSurveyCompleted(true);
    localStorage.setItem("surveyCompleted", "true");
    localStorage.setItem("userPreferences", JSON.stringify(preferences));
  };

  // Export chat as markdown
  const exportChatAsMarkdown = () => {
    if (messages.length === 0) return;

    const now = new Date();
    const timestamp = now.toLocaleString();
    const currentThread = chatHistory.find(
      (chat) => chat.id === currentThreadId
    );

    let markdown = `# Chat Export\n\n`;
    markdown += `**Date:** ${timestamp}\n`;
    if (currentThread) {
      markdown += `**Thread:** ${currentThread.title}\n`;
    }
    markdown += `**User Preferences:** ${userPreferences.familiarity}, ${userPreferences.goal}\n\n`;
    markdown += `---\n\n`;

    // Convert messages to markdown
    const filteredMessages = messages.filter(
      (msg) => msg.content !== "GENERATE_SUMMARY"
    );

    filteredMessages.forEach((message, index) => {
      if (message.role === "system") {
        markdown += `*System: ${message.content}*\n\n`;
      } else if (message.role === "user") {
        markdown += `**User:** ${message.content}\n\n`;
      } else if (message.role === "assistant") {
        markdown += `**Assistant:** ${message.content}\n\n`;
      }
    });

    markdown += `---\n\n`;
    markdown += `*Exported from Chat Assistant*\n`;

    // Create and download the file
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);

    const filename = `chat-export-${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${String(
      now.getHours()
    ).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}.md`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Add file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add file handling functions
  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
  };

  return (
    <div className="w-full md:w-1/3 bg-white border-l border-gray-200 flex flex-col h-screen">
      {/* Header with buttons */}
      <div className="p-3 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">Chat</h2>
        <div className="flex gap-2">
          {surveyCompleted && messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={exportChatAsMarkdown}
              className="h-8 w-8"
              title="Export Chat"
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">Export Chat</span>
            </Button>
          )}
          {surveyCompleted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              className="h-8 w-8"
              title="Adjust Difficulty"
            >
              <Settings className="h-4 w-4" />
              <span className="sr-only">Adjust Difficulty</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setHistoryOpen(true)}
            className="h-8 w-8"
            title="History"
          >
            <History className="h-4 w-4" />
            <span className="sr-only">History</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewChat}
            className="h-8 w-8"
            title="New Chat"
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">New Chat</span>
          </Button>
        </div>
      </div>

      {/* Survey or Chat Content */}
      {!surveyCompleted ? (
        <InitialSurvey onSubmit={handleSurveySubmit} />
      ) : (
        <>
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
                <p className="text-center">Start a new conversation</p>
              </div>
            ) : (
              renderedMessages
            )}
            <div ref={messagesEndRef} />

            {isLoading &&
              messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex items-center space-x-2 mt-2">
                  <div
                    className="bg-gray-200 rounded-full h-2 w-2 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="bg-gray-200 rounded-full h-2 w-2 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="bg-gray-200 rounded-full h-2 w-2 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              )}
          </div>

          {/* Input area with suggestions above - always at bottom */}
          <div className="p-4 border-t">
            {/* Suggestions - only one section, above the input */}
            <div className="mb-3">
              <div className="flex flex-wrap gap-1.5 mb-3">
                {renderedSuggestions}
              </div>
            </div>

            {/* Selected text from PDF */}
            {selectedText && (
              <div className="mb-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <p className="text-xs text-blue-600 font-medium">
                      Selected from PDF
                    </p>
                  </div>
                  <button
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onClearSelectedText) onClearSelectedText();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-sm text-gray-700">
                  <span className="font-medium text-gray-600 text-xs">
                    "{selectedText}"
                  </span>
                </div>
              </div>
            )}

            {/* Input form */}
            <form
              onSubmit={handleFormSubmitWithErrorHandling}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <div className="relative border-b border-gray-200">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  className="border-0 resize-none min-h-[60px] focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  rows={3}
                />
              </div>
              <div className="bg-gray-100 px-2 py-1 flex justify-end items-center gap-2 h-9">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleFileClick}
                  className="text-gray-600 text-sm hover:text-gray-800 bg-white border-gray-100 h-7 rounded-md border"
                >
                  <Paperclip className="h-4 w-4 mr-1" />
                  Upload Files
                </Button>
                <Button
                  type="submit"
                  size="icon"
                  className="h-7 w-7 bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={isLoading || !input.trim()}
                >
                  <ArrowUp className="h-5 w-5" />
                  <span className="sr-only">Send message</span>
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.txt,.doc,.docx"
              />
            </form>
            {error && (
              <div className="mt-2 text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
        </>
      )}

      {/* Chat History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chat History</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {chatHistory.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No chat history yet
              </p>
            ) : (
              <ul className="divide-y">
                {chatHistory.map((chat) => (
                  <li
                    key={chat.id}
                    className={`py-3 hover:bg-gray-50 cursor-pointer px-2 rounded ${
                      chat.id === currentThreadId ? "bg-blue-50" : ""
                    }`}
                    onClick={() => handleThreadSelect(chat.id)}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{chat.title}</span>
                      <span className="text-xs text-gray-500">{chat.date}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Difficulty</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  How familiar are you with this topic?
                </label>
                <div className="mt-2">
                  <select
                    className="w-full border rounded-md p-2"
                    value={userPreferences.familiarity}
                    onChange={(e) => {
                      const newPrefs = {
                        ...userPreferences,
                        familiarity: e.target.value,
                      };
                      setUserPreferences(newPrefs);
                    }}
                  >
                    <option>Beginner</option>
                    <option>Expert</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">
                  What is your goal regarding this paper?
                </label>
                <div className="mt-2 space-y-2">
                  {goalOptions.map((option) => (
                    <div key={option} className="flex items-center">
                      <input
                        type="radio"
                        id={`settings-${option
                          .replace(/\s+/g, "-")
                          .toLowerCase()}`}
                        name="settings-goal"
                        value={option}
                        checked={userPreferences.goal === option}
                        onChange={(e) => {
                          const newPrefs = {
                            ...userPreferences,
                            goal: e.target.value,
                          };
                          setUserPreferences(newPrefs);
                        }}
                        className="mr-2"
                      />
                      <label
                        htmlFor={`settings-${option
                          .replace(/\s+/g, "-")
                          .toLowerCase()}`}
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    localStorage.setItem(
                      "userPreferences",
                      JSON.stringify(userPreferences)
                    );
                    if (onPreferencesUpdate) {
                      onPreferencesUpdate(userPreferences);
                    }
                    setSettingsOpen(false);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
