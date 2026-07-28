import { Inject, Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

export interface AgentStreamResult {
  fullReply: string;
  steps: Array<{ type: string; content: { type: string, text: string }[] }>
}

@Injectable()
export class AgentService {
  constructor(
    @Inject('GOOGLE_GENAI_CLIENT') private readonly agent: GoogleGenAI,
  ) {}

  async query(input: string, onChunk: (text: string) => void, previousSteps?: any[]): Promise<AgentStreamResult> {
    const inputPayload = (previousSteps && previousSteps.length > 0)
      ? [...previousSteps, { type: 'user_input', content: [{ type: 'text', text: input }] }]
      : input

    const stream = await this.agent.interactions.create({
      model: 'gemini-flash-lite-latest',
      input: inputPayload,
      stream: true,
      store: false,
    });

    let fullReply = '';
    let currSteps: Array<{ type: string; content: { type: string, text: string }[] }> = [];
    let currStepType: string | null = null;
    let currStepText = '';

    for await (const event of stream) {
      if (event.event_type === 'step.start') {
        currStepType = event.step.type;
      }

      if (event.event_type === 'step.delta') {
        if (event.delta.type === 'text') {
          fullReply += event.delta.text;
          currStepText += event.delta.text;
          onChunk(event.delta.text);
        } else if (event.delta.type === 'thought_summary') {
          if (event.delta.content?.type === 'text') {
            currStepText += event.delta.content.text;
          }
        } else if (event.delta.type === 'arguments_delta') {
          currStepText += event.delta.arguments ?? '';
        }
      }

      if (event.event_type === 'step.stop') {
        if (currStepType && currStepText) {
          currSteps.push({
            type: 'model_output',
            content: [{ type: 'text', text: currStepText }],
          })
          currStepType = null;
          currStepText = '';
        }
      }
    }

    return { fullReply, steps: currSteps };
  }
}
