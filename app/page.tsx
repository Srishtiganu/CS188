"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { nanoid } from "nanoid";
import ChatSidebar from "@/components/chat-sidebar";
import SimplePdfViewer from "@/components/simple-pdf-viewer";
import InitialSurvey from "@/components/initial-survey";
import type { Message } from "ai";
import { useChat } from "ai/react";

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
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
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

  // Initialize useChat hook with message processing
  const {
    messages: currentMessages,
    input,
    handleInputChange,
    handleSubmit: handleChatSubmit,
    isLoading,
    setMessages,
  } = useChat({
    api: "/api/chat",
    onResponse: (response) => {
      console.log("Chat response received:", response);
      if (!response.ok) {
        console.error("Error in chat response:", response.statusText);
      }
    },
    onFinish: () => {
      console.log("Chat response finished. Current messages:", currentMessages);
      // Update threads with the new messages
      setThreads((prevThreads) =>
        prevThreads.map((thread) => {
          if (thread.id === currentThreadId) {
            return {
              ...thread,
              messages: currentMessages,
              name:
                thread.messages.length === 0 ? input.slice(0, 30) : thread.name,
            };
          }
          return thread;
        })
      );
    },
    body: {
      id: currentThreadId,
      pdfData: pdfData ? Array.from(new Uint8Array(pdfData)) : null,
    },
  });

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

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    console.log("Form submitted with input:", input);

    // Set hasInteracted to true
    if (!hasInteracted) {
      setHasInteracted(true);
    }

    // Submit the chat
    try {
      console.log("Submitting chat with current thread ID:", currentThreadId);
      await handleChatSubmit(e);
      console.log("Chat submitted successfully");
    } catch (error) {
      console.error("Error submitting chat:", error);
    }
  };

  // Effect to log messages when they change
  useEffect(() => {
    console.log("Messages updated:", currentMessages);
  }, [currentMessages]);

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
    setMessages([]); // Clear current messages
  };

  // Load a chat thread from history
  const handleLoadThread = (threadId: string) => {
    const thread = threads.find((t) => t.id === threadId);
    if (thread) {
      setCurrentThreadId(threadId);
      setMessages(thread.messages); // Set messages for the loaded thread
      setHasInteracted(thread.messages.length > 0);
    }
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
  const handlePdfChange = (
    pdfUrl: string | null,
    pdfData?: ArrayBuffer | null
  ) => {
    if (pdfUrl && pdfData) {
      // Reset everything in one go to avoid multiple re-renders
      const newThreadId = nanoid();
      setCurrentThreadId(newThreadId);
      setPdfData(pdfData);

      // Create initial message about the PDF
      const initialMessage: Message = {
        id: nanoid(),
        role: "user",
        content:
          "I've uploaded a research paper. Please analyze it and help me understand its key points.",
        createdAt: new Date(),
      };

      setThreads([
        {
          id: newThreadId,
          name: "New Chat",
          messages: [initialMessage],
          createdAt: new Date(),
        },
      ]);
      setMessages([initialMessage]); // Set initial message
      setHasInteracted(true); // Set hasInteracted to true since we have a message
      setHasPdf(true);
      setSurveyCompleted(false); // Reset survey state when new PDF is uploaded
    } else {
      setHasPdf(false);
      setPdfData(null);
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
            messages={currentMessages}
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleFormSubmit}
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
