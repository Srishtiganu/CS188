"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Upload, MessageSquare, History, Loader2 } from "lucide-react"
import PdfViewer from "./pdf-viewer"
import ChatInterface from "./chat-interface"
import { useToast } from "@/hooks/use-toast"

export default function ResearchPaperChat() {
  const [file, setFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [chatHistory, setChatHistory] = useState<Array<{ id: string; messages: any[] }>>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Create a new chat when a file is uploaded
  useEffect(() => {
    if (file) {
      const newChatId = Date.now().toString()
      setChatHistory((prev) => [
        {
          id: newChatId,
          messages: [
            { role: "system", content: "You are a helpful assistant that answers questions about research papers." },
          ],
        },
        ...prev,
      ])
      setActiveChatId(newChatId)
    }
  }, [file])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "application/pdf") {
      setIsUploading(true)
      try {
        setFile(selectedFile)
        const url = URL.createObjectURL(selectedFile)
        setFileUrl(url)
        toast({
          title: "PDF uploaded successfully",
          description: `File: ${selectedFile.name}`,
        })
      } catch (error) {
        console.error("Error uploading file:", error)
        toast({
          title: "Error uploading PDF",
          description: "Please try again with a different file",
          variant: "destructive",
        })
      } finally {
        setIsUploading(false)
      }
    } else if (selectedFile) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      })
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const startNewChat = () => {
    if (file) {
      const newChatId = Date.now().toString()
      setChatHistory((prev) => [
        {
          id: newChatId,
          messages: [
            { role: "system", content: "You are a helpful assistant that answers questions about research papers." },
          ],
        },
        ...prev,
      ])
      setActiveChatId(newChatId)
    } else {
      toast({
        title: "No paper uploaded",
        description: "Please upload a research paper first",
        variant: "destructive",
      })
    }
  }

  const switchChat = (chatId: string) => {
    setActiveChatId(chatId)
  }

  const getCurrentChat = () => {
    return chatHistory.find((chat) => chat.id === activeChatId)
  }

  const updateChatMessages = (chatId: string, messages: any[]) => {
    setChatHistory((prev) => prev.map((chat) => (chat.id === chatId ? { ...chat, messages } : chat)))
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-200px)]">
      {/* Left side - PDF Viewer */}
      <div className="w-full md:w-1/2 h-full flex flex-col">
        <Card className="h-full flex flex-col">
          <CardContent className="p-4 flex-grow flex flex-col">
            {!fileUrl ? (
              <div className="flex flex-col items-center justify-center h-full">
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <Button onClick={handleUploadClick} className="flex items-center gap-2" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Upload Research Paper (PDF)</span>
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  Upload a math or computer science research paper to get started
                </p>
              </div>
            ) : (
              <PdfViewer fileUrl={fileUrl} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right side - Chat Interface */}
      <div className="w-full md:w-1/2 h-full flex flex-col">
        <Tabs defaultValue="chat" className="h-full flex flex-col">
          <TabsList className="mb-2">
            <TabsTrigger value="chat" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>Chat</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1">
              <History className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-grow flex flex-col">
            {file ? (
              <ChatInterface
                file={file}
                chatId={activeChatId || ""}
                messages={getCurrentChat()?.messages || []}
                updateMessages={(messages) => updateChatMessages(activeChatId || "", messages)}
                onNewChat={startNewChat}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-gray-500">Upload a research paper to start chatting</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="flex-grow">
            <ScrollArea className="h-full">
              <div className="space-y-4 p-2">
                <h3 className="font-medium">Previous Threads</h3>
                {chatHistory.length > 0 ? (
                  chatHistory.map((chat) => {
                    // Get the first user message to use as a title
                    const firstUserMessage = chat.messages.find((m) => m.role === "user")
                    const title = firstUserMessage
                      ? firstUserMessage.content.substring(0, 40) + (firstUserMessage.content.length > 40 ? "..." : "")
                      : `Chat ${chat.id.substring(chat.id.length - 5)}`

                    return (
                      <Card
                        key={chat.id}
                        className={`cursor-pointer hover:bg-gray-50 transition-colors ${activeChatId === chat.id ? "border-primary" : ""}`}
                        onClick={() => switchChat(chat.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{title}</p>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(Number.parseInt(chat.id)).toLocaleString()}
                          </p>
                        </CardContent>
                      </Card>
                    )
                  })
                ) : (
                  <p className="text-sm text-gray-500">No previous chats</p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
