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

// Function to generate article summary based on user preferences
async function generateSummary(
  pdfData: number[],
  familiarity: string,
  goal: string
) {
  console.log("Starting summary generation with preferences:", {
    familiarity,
    goal,
  });

  // Customize the summary prompt based on user preferences
  let summaryStyle = "";
  if (familiarity === "Beginner") {
    if (goal === "Just skimming") {
      summaryStyle =
        "Provide a very high-level overview with simple explanations. Focus on the main takeaways and avoid technical jargon. Keep it concise and accessible.";
    } else {
      // Deep dive
      summaryStyle =
        "Provide a detailed but accessible explanation. Break down complex concepts into understandable parts. Include key findings and methodologies, but explain them in simpler terms.";
    }
  } else {
    // Expert
    if (goal === "Just skimming") {
      summaryStyle =
        "Provide a concise technical summary focusing on novel contributions, key results, and methodological approaches. Assume familiarity with domain terminology.";
    } else {
      // Deep dive
      summaryStyle =
        "Provide a comprehensive technical analysis including methodologies, mathematical formulations, experimental setup, detailed results, and implications. Include technical details and precise terminology.";
    }
  }

  const summaryPrompt = `You are an AI assistant helping a user understand a research paper. Based on the user's preferences:
- Familiarity level: ${familiarity}
- Reading goal: ${goal}

${summaryStyle}

Please provide a summary of this research paper. Structure your response with clear sections and use markdown formatting. Start with "# Paper Summary" as the heading.`;

  console.log("Summary prompt:", summaryPrompt);

  try {
    console.log("Generating summary...");
    const result = await streamText({
      model: google("gemini-2.0-flash"),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: summaryPrompt },
            {
              type: "file",
              data: new Uint8Array(pdfData).buffer,
              mimeType: "application/pdf",
            },
          ],
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent summaries
    });

    console.log("Summary generated successfully");
    return result;
  } catch (error) {
    console.error("Error in generateSummary:", error);
    throw error;
  }
}

// Function to generate suggestions
async function generateSuggestions(
  pdfData: number[],
  systemPrompt: string,
  messages: any[] = [],
  selectedText?: string
) {
  console.log(
    "Starting suggestion generation with system prompt:",
    systemPrompt
  );

  // Build suggestion prompt with instructions and PDF file
  const instruction = `You are an AI assistant that is helping a user understand this research paper better. The user has provided you with the following information regarding their familiarity with the topic of the paper:

${systemPrompt}

${
  selectedText
    ? `The user has selected the following text from the PDF:\n\n${selectedText}\n\n`
    : ""
}

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
  const {
    messages,
    pdfData,
    systemPrompt,
    isSuggestionRequest,
    familiarity,
    goal,
    selectedText,
  } = await req.json();

  // Check if the last message is a summary generation request
  const lastMessage = messages[messages.length - 1];
  const isSummaryRequest =
    lastMessage && lastMessage.content === "GENERATE_SUMMARY";

  console.log(
    "Request type:",
    isSuggestionRequest
      ? "Suggestion request"
      : isSummaryRequest
      ? "Summary request"
      : "Chat request"
  );

  if (selectedText) {
    console.log(
      "API - Request includes selected text:",
      selectedText.length > 100
        ? `${selectedText.substring(0, 100)}... (${selectedText.length} chars)`
        : selectedText
    );
  }

  // Handle summary generation request
  if (isSummaryRequest && pdfData && familiarity && goal) {
    console.log("Processing summary request with PDF data and preferences:", {
      familiarity,
      goal,
    });
    try {
      const summaryResult = await generateSummary(pdfData, familiarity, goal);
      return summaryResult.toDataStreamResponse();
    } catch (error) {
      console.error("Error generating summary:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to generate summary",
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

  // Handle suggestion generation request
  if (isSuggestionRequest && pdfData) {
    console.log("Processing suggestion request with PDF data");
    const suggestions = await generateSuggestions(
      pdfData,
      systemPrompt,
      messages,
      selectedText
    );
    console.log("Generated suggestions:", suggestions);
    return new Response(JSON.stringify({ suggestions }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Add selected text to system prompt if provided
  const enhancedSystemPrompt = selectedText
    ? `${systemPrompt}\n\nThe user has selected the following text from the PDF:\n\n${selectedText}`
    : systemPrompt;

  if (selectedText) {
    console.log("API - Enhanced system prompt with selected text");
  }

  // Filter out the GENERATE_SUMMARY message for normal chat processing
  const filteredMessages = messages.filter(
    (msg: any) => msg.content !== "GENERATE_SUMMARY"
  );

  // Format messages for Gemini
  const formattedMessages = filteredMessages.map((msg: any, index: number) => ({
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
    { role: "user", content: enhancedSystemPrompt },
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
