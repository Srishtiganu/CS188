import { streamText } from "ai";
import { google } from "@ai-sdk/google";

// System prompt to guide the model's behavior
const SYSTEM_PROMPT = `You are a helpful, friendly AI assistant. 
Provide clear, concise, and accurate responses.
Format your responses using Markdown when appropriate.
If you don't know the answer to something, be honest about it.`;

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, pdfData } = await req.json();

  // Format messages for Gemini
  const formattedMessages = messages.map((msg: any, index: number) => ({
    role: msg.role,
    content:
      // Only include PDF data with the first user message
      msg.role === "user" && pdfData && index === 0
        ? [
            {
              type: "text",
              text:
                typeof msg.content === "string"
                  ? msg.content
                  : msg.content[0]?.text || "",
            },
            {
              type: "file",
              data: new Uint8Array(pdfData).buffer,
              mimeType: "application/pdf",
            },
          ]
        : typeof msg.content === "string"
        ? msg.content
        : msg.content[0]?.text || "",
  }));

  // Add system message at the beginning of the conversation
  const fullMessages = [
    { role: "user", content: SYSTEM_PROMPT },
    ...formattedMessages,
  ];

  try {
    const result = streamText({
      model: google("gemini-2.0-flash"),
      messages: fullMessages,
      onError: (error) => {
        console.error("Error generating response:", error);
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error generating response:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate response",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
