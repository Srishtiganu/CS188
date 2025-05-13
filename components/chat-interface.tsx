"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, Plus, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ChatInterfaceProps {
  file: File
  chatId: string
  messages: any[]
  updateMessages: (messages: any[]) => void
  onNewChat: () => void
}

export default function ChatInterface({ file, chatId, messages, updateMessages, onNewChat }: ChatInterfaceProps) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Default suggested questions
  const defaultSuggestions = [
    "What is the main contribution of this paper?",
    "Explain the key equations in simple terms",
    "What are the limitations of this approach?",
    "How does this compare to previous work?",
    "What are potential future research directions?",
  ]

  useEffect(() => {
    // Set initial suggested questions
    setSuggestedQuestions(defaultSuggestions)
  }, [file])

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSubmit = async (e: React.FormEvent, questionText: string = input) => {
    e.preventDefault()

    if (!questionText.trim() || isLoading) return

    // Create a user message with file context
    const userMessage = {
      role: "user",
      content: `I'm looking at a research paper titled "${file.name}". ${questionText}`,
    }

    // Filter out system messages before sending
    const messagesToSend = messages.filter((m) => m.role !== "system").concat([userMessage])

    // Update UI with user message
    const updatedMessages = [...messages, userMessage]
    updateMessages(updatedMessages)

    setIsLoading(true)
    setInput("")

    try {
      console.log("Submitting question:", questionText)

      // Add a placeholder for the assistant's response
      const tempMessages = [...updatedMessages, { role: "assistant", content: "" }]
      updateMessages(tempMessages)

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messagesToSend,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API error:", response.status, errorText)
        throw new Error(`API error: ${response.status} ${errorText}`)
      }

      if (!response.body) {
        throw new Error("Response body is null")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantResponse = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })

        // Process the chunk to extract the text
        const lines = chunk.split("\n").filter((line) => line.trim() !== "")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.type === "text-delta") {
                assistantResponse += parsed.text

                // Update the assistant's message with the accumulated response
                const newMessages = [...updatedMessages, { role: "assistant", content: assistantResponse }]
                updateMessages(newMessages)
              }
            } catch (e) {
              console.error("Error parsing chunk:", e)
            }
          }
        }
      }

      // Generate new suggested questions based on the conversation
      const newSuggestions = [
        "Can you explain the methodology in more detail?",
        "What are the key findings of this research?",
        "How does this relate to other papers in the field?",
        "What are the practical applications of this research?",
        "Are there any weaknesses in the experimental design?",
      ]
      setSuggestedQuestions(newSuggestions)
    } catch (error) {
      console.error("Error in chat submission:", error)
      toast({
        title: "Error getting response",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })

      // Remove the assistant message if there was an error
      updateMessages(updatedMessages)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">Chat with Paper</h3>
        <Button variant="outline" size="sm" onClick={onNewChat} className="flex items-center gap-1">
          <Plus className="h-3 w-3" />
          <span>New Chat</span>
        </Button>
      </div>

      <Card className="flex-grow flex flex-col">
        <CardContent className="p-0 flex flex-col h-full">
          {/* Messages area */}
          <ScrollArea className="flex-grow p-4">
            <div className="space-y-4">
              {messages.length <= 1 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Ask a question about the research paper</p>
                </div>
              ) : (
                messages
                  .filter((m) => m.role !== "system")
                  .map((message, index) => (
                    <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))
              )}
              {isLoading && !messages.find((m) => m.role === "assistant" && m.content === "") && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-muted flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <Separator />

          {/* Input area */}
          <div className="p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about the paper..."
                disabled={isLoading}
                className="flex-grow"
              />
              <Button type="submit" disabled={!input.trim() || isLoading} size="icon">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            {/* Suggested questions */}
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Suggestions</h4>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs text-left justify-start h-auto py-1.5 whitespace-normal"
                    onClick={() => handleSuggestedQuestion(question)}
                    disabled={isLoading}
                  >
                    <ArrowRight className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="line-clamp-2">{question}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
