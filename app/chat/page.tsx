"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { nanoid } from "nanoid";
import ChatSidebar from "@/components/chat-sidebar";
import SimplePdfViewer from "@/components/simple-pdf-viewer";
import InitialSurvey from "@/components/initial-survey";
import type { Message } from "ai";
import { useChat } from "ai/react";
import { useRouter } from "next/navigation";

// Define a chat thread type
interface ChatThread {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
}

// Function to generate system prompt based on survey responses
const generateSystemPrompt = (familiarity: string, goal: string) => {
  return `You are an AI assistant that is helping a user understand this research paper better. The user has provided you with the following information regarding their familiarity with the topic of the paper:

How familiar are you with the topic? ${familiarity}
What is your goal regarding this paper? ${goal}

Use the message history if there is anything relevant there. Format your responses in markdown when applicable.

Answer the user's question to the best of your ability.`;
};

export default function Home() {
  const router = useRouter();
  const [hasInteracted, setHasInteracted] = useState(false);
  const [hasPdf, setHasPdf] = useState(false);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [currentThreadId, setCurrentThreadId] = useState(nanoid());
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [userFamiliarity, setUserFamiliarity] = useState("");
  const [userGoal, setUserGoal] = useState("");
  const [selectedText, setSelectedText] = useState<string>("");
  const [threads, setThreads] = useState<ChatThread[]>([
    {
      id: currentThreadId,
      name: "Untitled",
      messages: [],
      createdAt: new Date(),
    },
  ]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState<boolean>(false);
  const [pdfName, setPdfName] = useState<string | null>(null);

  // Initialize useChat hook with message processing
  const {
    messages: currentMessages,
    input,
    handleInputChange,
    handleSubmit: handleChatSubmit,
    append,
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
      // Update current thread with the new messages (title already set)
      setThreads((prevThreads) =>
        prevThreads.map((thread) =>
          thread.id === currentThreadId
            ? { ...thread, messages: currentMessages }
            : thread
        )
      );
    },
    body: {
      id: currentThreadId,
      pdfData: pdfData ? Array.from(new Uint8Array(pdfData)) : null,
      systemPrompt: generateSystemPrompt(userFamiliarity, userGoal),
      familiarity: userFamiliarity,
      goal: userGoal,
      selectedText: selectedText || undefined,
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

  // Function to fetch suggestions
  const fetchSuggestions = async (
    pdfData: ArrayBuffer,
    messages: Message[] = [],
    familiarity: string,
    goal: string
  ) => {
    setSuggestionsLoading(true);
    setSuggestions([]); // Clear existing suggestions
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pdfData: Array.from(new Uint8Array(pdfData)),
          systemPrompt: `How familiar are you with the topic? ${familiarity}
What is your goal regarding this paper? ${goal}`,
          isSuggestionRequest: true,
          messages: messages, // Include message history for context
          selectedText: selectedText || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }

      const data = await response.json();
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setSuggestionsLoading(false);
    }
  };

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

      if (pdfData) {
        await fetchSuggestions(
          pdfData,
          currentMessages,
          userFamiliarity,
          userGoal
        );
      }
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
    setSelectedText(""); // Clear selected text
  };

  // Load a chat thread from history
  const handleLoadThread = (threadId: string) => {
    const thread = threads.find((t) => t.id === threadId);
    if (thread) {
      setCurrentThreadId(threadId);
      setMessages(thread.messages); // Set messages for the loaded thread
      setHasInteracted(thread.messages.length > 0);
      setSelectedText(""); // Clear selected text when loading a different thread
    }
  };

  // Handle survey submission
  const handleSurveySubmit = async (preferences: {
    familiarity: string;
    goal: string;
  }) => {
    setSurveyCompleted(true);
    setUserFamiliarity(preferences.familiarity);
    setUserGoal(preferences.goal);

    if (pdfData) {
      // 1) Generate title once
      try {
        console.log("Generating title for paper...");
        // Temporary thread name while generating
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === currentThreadId
              ? { ...thread, name: "Thinking of title..." }
              : thread
          )
        );

        const titleResponse = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pdfData: Array.from(new Uint8Array(pdfData)),
            familiarity: preferences.familiarity,
            goal: preferences.goal,
            isTitleRequest: true,
          }),
        });

        if (titleResponse.ok) {
          const { title } = await titleResponse.json();
          console.log("Received title:", title);
          setThreads((prev) =>
            prev.map((thread) =>
              thread.id === currentThreadId
                ? { ...thread, name: title }
                : thread
            )
          );
        } else {
          console.error("Title request failed:", titleResponse.statusText);
        }
      } catch (err) {
        console.error("Error generating title:", err);
      }

      // 2) Trigger summary streaming
      try {
        console.log("Triggering summary streaming...");
        await append({ role: "user", content: "GENERATE_SUMMARY" });
      } catch (err) {
        console.error("Error triggering summary streaming:", err);
      }
    }

    // Fetch suggestions after summary generation
    if (pdfData) {
      await fetchSuggestions(
        pdfData,
        currentMessages,
        preferences.familiarity,
        preferences.goal
      );
    }
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
      setSelectedText(""); // Clear selected text when changing PDF

      // Suggestions will be fetched after survey submission when preferences are available

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
          name: "Untitled",
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

  // Handle text selection from PDF
  const handleTextSelection = (text: string) => {
    console.log("Main Page - Text selection received:", text);

    if (text) {
      console.log("Main Page - Setting selected text, length:", text.length);
    } else {
      console.log("Main Page - Clearing selected text");
    }

    setSelectedText(text);
  };

  // Handle clearing selected text
  const handleClearSelectedText = () => {
    console.log("Main Page - Clear selected text button clicked");
    setSelectedText("");
  };

  // Handle preferences update
  const handlePreferencesUpdate = async (preferences: {
    familiarity: string;
    goal: string;
  }) => {
    // Update local state
    setUserFamiliarity(preferences.familiarity);
    setUserGoal(preferences.goal);

    // Create a system update message (non-bubble)
    const updateMessage: Message = {
      id: nanoid(),
      role: "system",
      content: "User preference updated",
      createdAt: new Date(),
    };

    // Add the system update message to the current thread
    setMessages([...currentMessages, updateMessage]);

    // Update the current thread with the new message
    setThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === currentThreadId
          ? { ...thread, messages: [...currentMessages, updateMessage] }
          : thread
      )
    );

    // Regenerate suggestions based on updated preferences
    if (pdfData) {
      await fetchSuggestions(
        pdfData,
        currentMessages,
        preferences.familiarity,
        preferences.goal
      );
    }
  };

  // On mount, check localStorage for uploaded PDF
  useEffect(() => {
    const base64 = localStorage.getItem("uploadedPdf");
    const pdfName = localStorage.getItem("uploadedPdfName");
    if (base64) {
      // Convert base64 to ArrayBuffer
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      setPdfData(bytes.buffer);
      setHasPdf(true);
      // Set the PDF name if available
      if (pdfName) {
        setPdfName(pdfName);
      }
      // Optionally clear after loading
      // localStorage.removeItem("uploadedPdf");
    }
  }, []);

  // Redirect to home if no PDF is loaded
  useEffect(() => {
    const base64 = localStorage.getItem("uploadedPdf");
    if (!base64) {
      router.push("/");
    }
  }, [router]);

  return (
    <main className="flex h-screen overflow-hidden">
      {/* Left side - Simple PDF Viewer */}
      <div className="flex-1 h-full bg-white hidden md:block">
        {hasPdf && pdfData && (
          <SimplePdfViewer
            onPdfChange={() => {}}
            onTextSelection={setSelectedText}
            pdfData={pdfData}
            pdfName={pdfName}
          />
        )}
      </div>

      {/* Right side - show survey or chat sidebar */}
      {hasPdf &&
        (!surveyCompleted ? (
          <div className="w-full md:w-1/3 bg-white border-l border-gray-200 h-screen overflow-auto">
            <InitialSurvey onSubmit={handleSurveySubmit} />
          </div>
        ) : (
          <ChatSidebar
            messages={currentMessages}
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleFormSubmit}
            suggestions={suggestions}
            suggestionsLoading={suggestionsLoading}
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
            currentThreadName={currentThread?.name}
            onPreferencesUpdate={handlePreferencesUpdate}
            selectedText={selectedText}
            onClearSelectedText={handleClearSelectedText}
          />
        ))}
    </main>
  );
}
