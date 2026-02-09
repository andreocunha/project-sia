import { streamText, tool, UIMessage, convertToModelMessages, stepCountIs, createUIMessageStreamResponse } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

export const maxDuration = 60;

function getModel(modelId: string) {
  if (modelId.startsWith("gpt-") || modelId.startsWith("o")) {
    return openai(modelId);
  }
  if (modelId.startsWith("gemini-")) {
    return google(modelId);
  }
  return openai(modelId);
}

export async function POST(req: Request) {
  const {
    messages,
    model: modelId = "gpt-4o-mini",
    temperature = 0.7,
    maxTokens,
    topP,
    enableUserInfoTool = false,
    enableWeatherTool = false,
    systemPrompt = "",
  }: {
    messages: UIMessage[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    enableUserInfoTool?: boolean;
    enableWeatherTool?: boolean;
    systemPrompt?: string;
  } = await req.json();

  const model = getModel(modelId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: Record<string, any> = {};

  if (enableUserInfoTool) {
    tools.collectUserInfo = tool({
      description:
        "Coleta informações pessoais (nome e idade) do usuário após ele fornecê-las.",
      inputSchema: z.object({
        name: z.string().describe("O nome do usuário"),
        age: z.number().describe("A idade do usuário"),
      }),
      execute: async ({ name, age }) => {
        // Simula processamento
        await new Promise((resolve) => setTimeout(resolve, 500));
        return {
          status: "success",
          name,
          age,
          message:
            "Dados de usuário coletados com sucesso. Confirme os dados para o usuário.",
        };
      },
    });
  }

  if (enableWeatherTool) {
    tools.getWeather = tool({
      description:
        "Obtém a temperatura atual de uma cidade específica solicitada pelo usuário.",
      inputSchema: z.object({
        city: z.string().describe("O nome da cidade para verificar o clima"),
      }),
      execute: async ({ city }) => {
        // Simula chamada de API
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const temp = (20 + Math.random() * 12).toFixed(1);
        return {
          city,
          temperature: `${temp}°C`,
          condition: "Ensolarado",
        };
      },
    });
  }

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model,
    system: systemPrompt || undefined,
    messages: modelMessages,
    temperature,
    maxOutputTokens: maxTokens || undefined,
    topP: topP || undefined,
    tools: Object.keys(tools).length > 0 ? tools : undefined,
    stopWhen: stepCountIs(5),
  });

  return createUIMessageStreamResponse({
    stream: new ReadableStream({
      async start(controller) {
        const stream = result.toUIMessageStream();
        for await (const chunk of stream) {
          controller.enqueue(chunk);
        }
        const usage = await result.usage;
        controller.enqueue({
          type: "data-usage",
          data: { ...usage },
        });
        controller.close();
      },
    }),
  });
}
