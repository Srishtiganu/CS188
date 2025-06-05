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

// Schema for title only
const titleSchema = z.object({
  title: z
    .string()
    .describe(
      "A concise 2-4 word title that captures the main topic/contribution of the research paper"
    ),
});

// Function to generate a concise title
async function generateTitle(
  pdfData: number[],
  familiarity: string,
  goal: string
) {
  const titlePrompt = `You are an AI assistant that reads a research paper and produces a concise 2-4 word title that captures its main topic or contribution.`;
  const result = await generateObject({
    model: google("gemini-2.0-flash"),
    schema: titleSchema,
    schemaName: "title",
    schemaDescription: "A concise title of the research paper",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: titlePrompt },
          {
            type: "file",
            data: new Uint8Array(pdfData).buffer,
            mimeType: "application/pdf",
          },
        ],
      },
    ],
    temperature: 0.3,
  });
  return result.object.title;
}

// Function to generate streaming summary with title based on user preferences
async function generateStreamingSummary(
  pdfData: number[],
  familiarity: string,
  goal: string
) {
  console.log("Starting streaming summary generation with preferences:", {
    familiarity,
    goal,
  });

  // Customize the summary prompt based on user preferences
  let summaryStyle = "";
  if (familiarity === "Beginner") {
    if (goal === "Just skimming") {
      summaryStyle = `You are helping a beginner get a general sense of what a research paper is about.

Write a simple, friendly summary that explains:
- What the paper is trying to do and why it matters?
- A gentle explanation of the main idea or approach (very high level)
- Key findings and their significance

Assume the reader has a basic background in linear algebra and computer science. Avoid math and jargon. Use understandable language. 
If you introduce a technical term that is essential to understanding the paper, define it clearly using metaphors or analogies.
The goal is to help someone decide if they want to learn more about the paper, not to explain every detail.`;
    } else {
      // Deep dive
      summaryStyle = `You are helping a beginner understand a research paper in depth.

Write an accessible summary that explains:
- The problem being solved
- Important concepts or terms, in the order they appear, with clear, intuitive explanations before any formal definitions or equations
- The main approach, broken into understandable steps with plain-English explanations for all symbols, equations, and mechanisms
- Key results and their significance

Assume the reader has a basic background in linear algebra and computer science, but is unfamiliar with the specific topic of the paper.

Avoid introducing equations or notation (e.g. Q,K,V,W,x,a) until the underlying idea is fully explained in plain language.
If equations are included, explain every variable and symbol clearly immediately afterward, and relate it back to the intuition.
Limit the summary to under 3500 characters. Do not provide a section by section summary.`;
    }
  } else {
    // Expert
    if (goal === "Just skimming") {
      summaryStyle = `You are an AI assistant helping a researcher quickly audit a paper to decide whether it's worth reading in depth.

Summarize the paper. Focus on:
- Main contributions and novelty
- Briefly define key terms or methods in 1 sentence if central to the paper.
- High-level methodology 
- Relevance to ongoing research
- Limitations and red flags(if any)

Avoid section-by-section summaries. If there is a defining equation for the core methodology, include it inline using LaTeX with a brief explanation, but no more than one equation. 
Define key technical terms if they are essential to understanding the paper. Introduce them in logical order, as they appear in the summary.
Limit the summary to under 2000 characters. Assume the user is an expert and only needs a high-level scan to triage. `;
    } else {
      // Deep dive
      summaryStyle = `You are an AI assistant helping a researcher deeply understand and possibly reimplement a paper's method.

Summarize the paper with a focus on:
- Core problem and motivation
- Assumptions and theoretical framing
- Core methodology and architecture
- Experimental setup and evaluation metrics
- Key results and their implications
- Potential limitations or caveats

Use precise terminology and equations where relevant. Limit the summary to under 4000 characters. Avoid section by section summary`;
    }
  }

  const summaryPrompt = `You are an AI assistant helping a user understand a research paper. Based on the user's preferences:
- Familiarity level: ${familiarity}
- Reading goal: ${goal}

${summaryStyle}

Please provide a comprehensive summary of this research paper. Structure your response with clear sections and use Markdown formatting. Start with "# Paper Summary" as the heading.

When referencing equations or formulas, format them using LaTeX syntax wrapped in $...$ for inline math or $$...$$ for block math. When typesetting in math mode, wrap function names (e.g., MultiHead, Attention, softmax) and descriptive words (e.g., Concat, head, dropout) in \text{} to ensure correct rendering. Use \mathbb{R} and subscript notation for vector and matrix shapes. Do not treat function names as variable names.
`;

  console.log("Streaming summary prompt:", summaryPrompt);

  try {
    console.log("Generating streaming summary...");
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

    console.log("Streaming summary generated successfully");
    return result;
  } catch (error) {
    console.error("Error in generateStreamingSummary:", error);
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

Important:
- The selected text may be either a mathematical expression or a general text snippet (such as a sentence, paragraph, or caption).
- Please first infer the type of the selected text.
- If it appears to be a mathematical expression, your first step is to locate and identify the exact corresponding equation from the full paper. Use the surrounding context to match the selected expression to the most accurate and complete version of the equation. Do not proceed to generate questions until you've correctly identified the original expression.
- Adapt your questions appropriately:
  - If it's a math expression, focus on its mathematical meaning, related methods, and its role in the paper.
  -If it's a general text, focus on clarifying its meaning, connecting it to broader context, and understanding its role in the argument.
- Ensure the questions are specific, diverse, and do not overlap across categories.
- Customize to the user's background and reading goal.
- Use the conversation history provided to generate contextually relevant questions. Pay special attention to the most recent message for generating suggestions.
- All mathematical expressions in your output must be formatted in LaTeX.


Based on the provided paper context, selected expression, user profile, and conversation history, generate 6-7 thoughtful and diverse suggested questions. Distribute them across the following categories:


1. Local (clarifying the immediate meaning of the selected expression) - Generate 2-3 questions
- For math: suggest questions that focus only on clarifying the internal meaning, notation, terms of the selected expression.
- For text: clarify difficult vocabulary, sentence meaning, or  phrasing
- Avoid questions about its broader context or narrative role.

Examples:
- What does the notation P(y|x) stand for, mathematically?
What does the author mean by "state-of-the-art" in this sentence?
- What is the purpose of the log() function in this equation?


2. Global (connecting selected expression to broader field knowledge or research trends) - Generate 2-3 questions
- For math: Suggest questions that help the user relate this expression to other works, known methods, or field-wide practices.
 - For text: connect the sentence or claim to broader debates, methods, or common narratives in the field.

Examples:
- Is this a commonly used formulation/method in deep learning?
- Is this type of loss function standard in classification tasks?
- Is this claim about robustness widely accepted in machine learning?

3. Narrative (understanding the role of selected expression in the argument of the paper) - Generate 2 questions
 - For math: Suggest questions that help the user understand how the expression fits into the paper's narrative or logical flow. Stay specific to this expression.
- For text: Suggest how the selected sentence supports the argument, relates to prior claims, or transitions
 - Encourage linking to previous expressions or discussions where appropriate.

Examples:

- Is this expression part of a model, an assumption, a result, or an optimization goal?
 - Does this equation introduce any assumptions that impact the paper's conclusions?
- How does this sentence connect to the author's findings from the previous paragraph?


The questions should be 4-20 words long and should be outputted in the following JSON format:

{
   "suggestedQuestions": ["question1", "question2", ...]
}

Example:
{
   "suggestedQuestions": ["What are LLMs?", "Explain Neural Networks", "What does the variable X represent?", "What does the symbol ∑ mean?"]
}`;

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
    isTitleRequest,
    familiarity,
    goal,
    selectedText,
  } = await req.json();

  // Handle title generation request
  if (isTitleRequest && pdfData && familiarity && goal) {
    try {
      const title = await generateTitle(pdfData, familiarity, goal);
      return new Response(JSON.stringify({ title }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error generating title:", error);
      return new Response(
        JSON.stringify({ error: "Failed to generate title" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // Handle summary generation request
  const lastMessage = messages[messages.length - 1];
  const isSummaryRequest =
    lastMessage && lastMessage.content === "GENERATE_SUMMARY";
  if (isSummaryRequest && pdfData && familiarity && goal) {
    console.log("Processing summary request with PDF data and preferences:", {
      familiarity,
      goal,
    });
    try {
      const summaryResult = await generateStreamingSummary(
        pdfData,
        familiarity,
        goal
      );
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
