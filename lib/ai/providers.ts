/**
 * AI Provider abstraction layer
 * Supports: Gemini (free), OpenAI, Groq (free)
 * Priority: GROQ_API_KEY > GEMINI_API_KEY > OPENAI_API_KEY
 */

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AITool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
}

export interface AIResponse {
  content: string;
  toolCall?: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

type AIProvider = "gemini" | "openai" | "groq";

function getActiveProvider(): AIProvider | null {
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

// Gemini API (Google AI Studio - FREE tier)
async function callGemini(
  messages: AIMessage[],
  tools?: AITool[]
): Promise<AIResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  // Convert messages to Gemini format
  const systemInstruction = messages.find(m => m.role === "system")?.content || "";
  const contents = messages
    .filter(m => m.role !== "system")
    .map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  // Build request body
  const body: Record<string, unknown> = {
    contents,
    systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500,
    },
  };

  // Add tools if provided
  if (tools && tools.length > 0) {
    body.tools = [{
      functionDeclarations: tools.map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      })),
    }];
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Gemini API error:", error);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];

  if (!candidate?.content?.parts) {
    throw new Error("No response from Gemini");
  }

  // Check for function call
  const functionCall = candidate.content.parts.find((p: { functionCall?: unknown }) => p.functionCall);
  if (functionCall?.functionCall) {
    return {
      content: "",
      toolCall: {
        name: functionCall.functionCall.name,
        arguments: functionCall.functionCall.args || {},
      },
    };
  }

  // Get text response
  const textPart = candidate.content.parts.find((p: { text?: string }) => p.text);
  return {
    content: textPart?.text || "",
  };
}

// Groq API (FREE tier - Llama 3.3 70B)
async function callGroq(
  messages: AIMessage[],
  tools?: AITool[]
): Promise<AIResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  const body: Record<string, unknown> = {
    model: "llama-3.3-70b-versatile",
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
    temperature: 0.7,
    max_tokens: 500,
  };

  if (tools && tools.length > 0) {
    body.tools = tools.map(t => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));
    body.tool_choice = "auto";
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Groq API error:", error);
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];

  if (!choice) {
    throw new Error("No response from Groq");
  }

  // Check for tool call
  if (choice.message?.tool_calls?.[0]) {
    const toolCall = choice.message.tool_calls[0];
    return {
      content: "",
      toolCall: {
        name: toolCall.function.name,
        arguments: JSON.parse(toolCall.function.arguments || "{}"),
      },
    };
  }

  return {
    content: choice.message?.content || "",
  };
}

// OpenAI API (paid)
async function callOpenAI(
  messages: AIMessage[],
  tools?: AITool[]
): Promise<AIResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const body: Record<string, unknown> = {
    model: process.env.AI_MODEL || "gpt-4o-mini",
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
    temperature: 0.7,
    max_tokens: 500,
  };

  if (tools && tools.length > 0) {
    body.tools = tools.map(t => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));
    body.tool_choice = "auto";
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("OpenAI API error:", error);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];

  if (!choice) {
    throw new Error("No response from OpenAI");
  }

  // Check for tool call
  if (choice.message?.tool_calls?.[0]) {
    const toolCall = choice.message.tool_calls[0];
    return {
      content: "",
      toolCall: {
        name: toolCall.function.name,
        arguments: JSON.parse(toolCall.function.arguments || "{}"),
      },
    };
  }

  return {
    content: choice.message?.content || "",
  };
}

/**
 * Main function to call AI
 * Automatically selects provider based on available API keys
 * Priority: Groq (free) > Gemini (free) > OpenAI (paid)
 */
export async function callAI(
  messages: AIMessage[],
  tools?: AITool[]
): Promise<AIResponse> {
  const provider = getActiveProvider();

  if (!provider) {
    throw new Error(
      "No AI provider configured. Set GEMINI_API_KEY (free), GROQ_API_KEY (free), or OPENAI_API_KEY"
    );
  }

  console.log(`Using AI provider: ${provider}`);

  switch (provider) {
    case "gemini":
      return callGemini(messages, tools);
    case "groq":
      return callGroq(messages, tools);
    case "openai":
      return callOpenAI(messages, tools);
  }
}

/**
 * Check which AI provider is configured
 */
export function getAIProviderInfo(): {
  provider: AIProvider | null;
  configured: boolean;
  free: boolean;
} {
  const provider = getActiveProvider();
  return {
    provider,
    configured: provider !== null,
    free: provider === "gemini" || provider === "groq",
  };
}
