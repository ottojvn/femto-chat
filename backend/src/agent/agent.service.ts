import { Inject, Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class AgentService {
  constructor(
    @Inject("GOOGLE_GENAI_CLIENT") private readonly agent: GoogleGenAI
  ) {}

  async queue(input: string, onChunk: (text: string) => void): Promise<string> {
    const stream = await this.agent.interactions.create({
      model: 'gemini-flash-lite-latest',
      input,
      stream: true
    });

    let fullText = '';

    for await (const event of stream) {
      if (event.event_type === 'step.delta' && event.delta.type === 'text') {
        fullText += event.delta.text;
        onChunk(event.delta.text);
      }
    }

    return fullText
  }
}
