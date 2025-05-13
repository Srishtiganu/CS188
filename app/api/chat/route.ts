import { streamText } from "ai"
import { google } from "@ai-sdk/google"

// System prompt to guide the model's behavior
const SYSTEM_PROMPT = `You are a helpful, friendly AI assistant. 
Provide clear, concise, and accurate responses.
Format your responses using Markdown when appropriate.
If you don't know the answer to something, be honest about it.`

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: google("gemini-1.5-flash"),
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      ...messages,
    ],
    maxTokens: 4096,
    temperature: 0.7,
    onError: (error) => {
      console.error("Gemini API error:", error)
    },
  })

  return result.toDataStreamResponse()
}
