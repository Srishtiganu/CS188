"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import type { Message } from "ai";
import { Button } from "@/components/ui/button";
import {
  Send,
  AlertCircle,
  History,
  Plus,
  CornerDownLeft,
  Settings,
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
}: ChatSidebarProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(
    null
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [surveyCompleted, setSurveyCompleted] = useState<boolean>(false);
  const [userPreferences, setUserPreferences] = useState({
    familiarity: "A little",
    goal: "Just skimming",
  });

  const goalOptions = [
    "Just skimming",
    "Trying to understand key ideas",
    "Deep dive into mathematical details",
    "Reading to reproduce results",
  ];

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
  const handleFormSubmitWithErrorHandling = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError(null);

    try {
      handleSubmit(e);
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
      if (form && input.trim()) {
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

  return (
    <div className="w-full md:w-1/3 bg-white border-l border-gray-200 flex flex-col h-screen">
      {/* Header with buttons */}
      <div className="p-3 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">Chat</h2>
        <div className="flex gap-2">
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
              messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
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
                {suggestions.slice(0, 4).map((suggestion) => (
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
                ))}
              </div>
            </div>

            {/* Input form */}
            <form
              onSubmit={handleFormSubmitWithErrorHandling}
              className="flex items-end gap-2"
            >
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  className="w-full border rounded-md p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[60px]"
                  rows={2}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute bottom-2 right-2 h-8 w-8 bg-blue-500 hover:bg-blue-600"
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send message</span>
                </Button>
              </div>
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
                      localStorage.setItem(
                        "userPreferences",
                        JSON.stringify(newPrefs)
                      );
                    }}
                  >
                    <option>Not at all</option>
                    <option>A little</option>
                    <option>Somewhat</option>
                    <option>Very Familiar</option>
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
                          localStorage.setItem(
                            "userPreferences",
                            JSON.stringify(newPrefs)
                          );
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
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
