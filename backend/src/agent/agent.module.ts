import { Module } from '@nestjs/common';
import { AgentService } from './agent.service.js';
import { GoogleGenAI } from '@google/genai';

@Module({
  providers: [AgentService,
    {
      provide: 'GOOGLE_GENAI_CLIENT',
      useFactory: () => {
        return new GoogleGenAI({})
      }
    }
  ],
  exports: [AgentService]
})
export class AgentModule {}
