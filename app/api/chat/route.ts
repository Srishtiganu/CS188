import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { generateObject } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Define the schema for suggestions
const suggestionsSchema = z.object({
  suggestedQuestions: z.array(z.string()),
});

// Function to generate suggestions
async function generateSuggestions(
  pdfData: number[],
  systemPrompt: string,
  messages: any[] = []
) {
  console.log(
    "Starting suggestion generation with system prompt:",
    systemPrompt
  );

  // Build suggestion prompt with instructions and PDF file
  const instruction = `You are an AI assistant that is helping a user understand this research paper better. The user has provided you with the following information regarding their familiarity with the topic of the paper:

${systemPrompt}

Based on the following information and the user's familiarity with the paper and the attached research paper, generate some suggested questions that the user might want to ask. If the user is more of a beginner, ask simpler or broader questions. If the user is more of an expert, ask more technical or detailed questions. The questions should be 4-12 words long and should be outputted in the following JSON format:

{
   "suggestedQuestions": ["question1", "question2", ...]
}

Example:
{
   "suggestedQuestions": ["What are LLMs?", "Explain Neural Networks", "What does the variable X represent?", "What does the symbol ∑ mean?"]
}

IMPORTANT: Use the conversation history provided to generate contextually relevant questions. Pay special attention to the most recent message for generating suggestions.`;

  console.log("Instruction:", instruction);

  try {
    console.log("Generating structured suggestions...");
    const result = await generateObject({
      model: google("gemini-2.0-flash"),
      schema: suggestionsSchema,
      schemaName: "suggestions",
      schemaDescription:
        "A list of suggested questions about the research paper",
      messages: [
        // Include only the last 4 messages from conversation history
        ...messages.slice(-4).map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        // Add the current instruction with PDF
        {
          role: "user",
          content: [
            { type: "text", text: instruction },
            {
              type: "file",
              data: new Uint8Array(pdfData).buffer,
              mimeType: "application/pdf",
            },
          ],
        },
      ],
    });

    console.log("Generated suggestions:", result.object);
    return result.object.suggestedQuestions;
  } catch (error) {
    console.error("Error in generateSuggestions:", error);
    return [];
  }
}

export async function POST(req: Request) {
  console.log("Received POST request");
  const { messages, pdfData, systemPrompt, isSuggestionRequest } =
    await req.json();
  console.log(
    "Request type:",
    isSuggestionRequest ? "Suggestion request" : "Chat request"
  );

  // Handle suggestion generation request
  if (isSuggestionRequest && pdfData) {
    console.log("Processing suggestion request with PDF data");
    const suggestions = await generateSuggestions(
      pdfData,
      systemPrompt,
      messages
    );
    console.log("Generated suggestions:", suggestions);
    return new Response(JSON.stringify({ suggestions }), {
      headers: { "Content-Type": "application/json" },
    });
  }

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
    { role: "user", content: systemPrompt },
    ...formattedMessages,
  ];

  try {
    const result = streamText({
      model: google("gemini-2.0-flash"),
      messages: fullMessages,
      temperature: 0.5,
      onError: (error) => {
        console.error("Error generating response:", error);
      },
    });

    console.log(fullMessages);

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
