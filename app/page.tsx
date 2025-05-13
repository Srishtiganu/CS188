"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { nanoid } from "nanoid";
import ChatSidebar from "@/components/chat-sidebar";
import SimplePdfViewer from "@/components/simple-pdf-viewer";
import InitialSurvey from "@/components/initial-survey";
import type { Message } from "ai";

// Define a chat thread type
interface ChatThread {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
}

export default function Home() {
  const [hasInteracted, setHasInteracted] = useState(false);
  const [hasPdf, setHasPdf] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState(nanoid());
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [threads, setThreads] = useState<ChatThread[]>([
    {
      id: currentThreadId,
      name: "New Chat",
      messages: [],
      createdAt: new Date(),
    },
  ]);

  // Get current thread
  const currentThread =
    threads.find((thread) => thread.id === currentThreadId) || threads[0];

  // Load threads from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedThreads = localStorage.getItem("chatThreads");
        if (savedThreads) {
          const parsedThreads = JSON.parse(savedThreads);
          // Convert string dates back to Date objects
          const threadsWithDates = parsedThreads.map((thread: any) => ({
            ...thread,
            createdAt: new Date(thread.createdAt),
            messages: thread.messages.map((msg: any) => ({
              ...msg,
              createdAt: msg.createdAt ? new Date(msg.createdAt) : undefined,
            })),
          }));
          setThreads(threadsWithDates);

          // Set current thread to the most recent one
          if (threadsWithDates.length > 0) {
            setCurrentThreadId(threadsWithDates[0].id);
            setHasInteracted(threadsWithDates[0].messages.length > 0);
          }
        }
      } catch (error) {
        console.error("Error loading chat threads:", error);
      }
    }
  }, []);

  // Save threads to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("chatThreads", JSON.stringify(threads));
    }
  }, [threads]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Handle form submission with placeholder responses
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: nanoid(),
      role: "user",
      content: input,
      createdAt: new Date(),
    };

    // Update thread name if this is the first message
    let updatedThreads = threads.map((thread) => {
      if (thread.id === currentThreadId) {
        // If this is the first message, use it as the thread name
        const name =
          thread.messages.length === 0 ? input.slice(0, 30) : thread.name;
        return {
          ...thread,
          name,
          messages: [...thread.messages, userMessage],
        };
      }
      return thread;
    });

    setThreads(updatedThreads);
    setInput("");
    setIsLoading(true);

    // Set hasInteracted to true
    if (!hasInteracted) {
      setHasInteracted(true);
    }

    // Simulate response delay
    setTimeout(() => {
      const assistantMessage: Message = {
        id: nanoid(),
        role: "assistant",
        content:
          "This is a placeholder response. The AI functionality has been temporarily disabled.",
        createdAt: new Date(),
      };

      // Add assistant message to the current thread
      updatedThreads = updatedThreads.map((thread) => {
        if (thread.id === currentThreadId) {
          return {
            ...thread,
            messages: [...thread.messages, assistantMessage],
          };
        }
        return thread;
      });

      setThreads(updatedThreads);
      setIsLoading(false);
    }, 1000);
  };

  // Create a new chat thread
  const handleNewChat = () => {
    const newThreadId = nanoid();

    setThreads((prevThreads) => [
      {
        id: newThreadId,
        name: "Untitled",
        messages: [],
        createdAt: new Date(),
      },
      ...prevThreads,
    ]);

    setCurrentThreadId(newThreadId);
    setHasInteracted(false);
    setInput("");
  };

  // Load a chat thread from history
  const handleLoadThread = (threadId: string) => {
    setCurrentThreadId(threadId);
    const thread = threads.find((t) => t.id === threadId);
    setHasInteracted(
      thread?.messages.length ? thread.messages.length > 0 : false
    );
  };

  const suggestions = [
    "Tell me about AI",
    "How does machine learning work?",
    "Explain neural networks",
    "What are LLMs?",
  ];

  // Handle survey submission
  const handleSurveySubmit = (preferences: {
    familiarity: string;
    goal: string;
  }) => {
    setSurveyCompleted(true);
    // You could store the preferences in state or localStorage if needed
  };

  // Handle PDF change
  const handlePdfChange = (pdfUrl: string | null) => {
    if (pdfUrl) {
      // Reset everything in one go to avoid multiple re-renders
      const newThreadId = nanoid();
      setCurrentThreadId(newThreadId);
      setThreads([
        {
          id: newThreadId,
          name: "New Chat",
          messages: [],
          createdAt: new Date(),
        },
      ]);
      setInput("");
      setHasInteracted(false);
      setHasPdf(true);
      setSurveyCompleted(false); // Reset survey state when new PDF is uploaded
    } else {
      setHasPdf(false);
    }
  };

  return (
    <main className="flex min-h-screen">
      {/* Left side - Simple PDF Viewer */}
      <div className="flex-1 bg-white hidden md:block">
        <SimplePdfViewer onPdfChange={handlePdfChange} />
      </div>

      {/* Right side - show survey or chat sidebar */}
      {hasPdf &&
        (!surveyCompleted ? (
          <div className="w-full md:w-1/3 bg-white border-l border-gray-200">
            <InitialSurvey onSubmit={handleSurveySubmit} />
          </div>
        ) : (
          <ChatSidebar
            messages={currentThread.messages}
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            suggestions={suggestions}
            isLoading={isLoading}
            hasInteracted={hasInteracted}
            onNewChat={handleNewChat}
            chatHistory={threads.map((thread) => ({
              id: thread.id,
              title: thread.name,
              date: thread.createdAt.toLocaleDateString(),
            }))}
            onLoadThread={handleLoadThread}
            currentThreadId={currentThreadId}
          />
        ))}
    </main>
  );
}
