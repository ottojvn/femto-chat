# Plano de Trabalho Completo — femto-chat (Preparação Pré-Migração)

> **Documento Operacional e Guia de Execução Autônoma**  
> **Projeto:** Sistema de Chat em Tempo Real com Gestão de Usuários e WebSocket  
> **Repositório:** `femto-chat` (Futura divisão `apps/gateway` e `apps/web` no monorepo `evidence-chat`)  
> **Data de Formalização:** 2026-09-29  
> **Status:** Em Execução Ativa (Preparação e Estabilização Pré-Migração)

---

## 1. Visão Geral e Propósito do Documento

O repositório `femto-chat` provê a **espinha dorsal de engenharia de software** para o futuro sistema unificado **EvidenceChat**:

1. **Camada de Apresentação (`frontend/` $\rightarrow$ `apps/web`):** Interface moderna em Angular 18 (Signals, Standalone Components, TailwindCSS) com fluxos completos de autenticação e histórico de conversas.
2. **Camada de Negócios e Gateway (`backend/` $\rightarrow$ `apps/gateway`):** Servidor NestJS 11 com autenticação JWT, persistência relacional no PostgreSQL via Prisma ORM e transporte bidirecional em tempo real com Socket.io.

Com a migração planejada para monorepo, este plano de trabalho define as **tarefas de saneamento técnico, correções de segurança e adaptações de arquitetura** que devem ser concluídas ainda dentro do `femto-chat` antes da fusão de repositórios.

---

## 2. Diagnóstico Técnico & Falhas Identificadas no Repositório Atual

Durante a auditoria deste repositório, foram identificadas falhas e oportunidades de melhoria que devem ser tratadas para garantir um portfólio de alta solidez:

| Área | Arquivo / Módulo | Severidade | Descrição do Problema Encontrado | Ação Necessária |
| :--- | :--- | :--- | :--- | :--- |
| **Backend / Testes** | `backend/package.json` e `*.spec.ts` | **Alta** | **Suíte de testes quebrada (10/10 falhas):** A propriedade `"type": "module"` causa `SyntaxError: Cannot use import statement outside a module` no Jest padrão. | Configurar o Jest para suporte a ESM (`NODE_OPTIONS=--experimental-vm-modules` e ts-jest preset ESM) ou padronizar a execução de testes. |
| **Frontend / Testes** | `frontend/src/app/**/*.spec.ts` | **Média** | **Testes unitários falhando no Vitest (3 falhas):** `app.spec.ts` busca `h1` inexistente; `login.spec.ts` e `signup.spec.ts` falham por falta de `provideRouter([])`; `chat.spec.ts` dispara requisição HTTP real durante o teste. | Corrigir as fixtures de teste injetando roteador e cliente de teste (`provideHttpClientTesting`). |
| **Segurança / Gateway** | `backend/src/chats/chats.gateway.ts` | **Alta** | **Vulnerabilidade IDOR e WebSocket sem Auth:** O gateway possui `cors: '*'` sem `AuthGuard`. Métodos `sendMessage` e `joinChat` confiam no `userId` e `chatId` passados no payload pelo cliente sem checar titularidade. | Validar no handshake do Socket.io o token JWT ou assegurar no `ChatsService` que `chat.userId === payload.userId`. |
| **Frontend / UI** | `frontend/src/app/features/chat/pages/chat/chat.html` | **Média** | **Ausência de Renderização de Markdown:** As mensagens são renderizadas em texto puro (`{{ msg.text }}`). Respostas ricas da LLM (tabelas, listas, negrito e citações) ficam empobrecidas. | Adicionar renderização de Markdown para a mensagem do agente. |
| **Modelagem de Dados** | `backend/prisma/schema.prisma` | **Média** | **Falta de campo tipado para Citações/Evidências:** O modelo `Message` armazena apenas `text` e `steps Json?`, sem espaço explícito para as fontes e seções retornadas pelo RAG. | Adicionar campo `sources Json?` no modelo `Message` e atualizar DTOs. |
| **Arquitetura / Agente** | `backend/src/agent/agent.service.ts` | **Média** | **Acoplamento rígido ao SDK Gemini:** O backend chama o Gemini diretamente; para o monorepo, ele deve ser capaz de chamar o microsserviço Python de RAG. | Introduzir uma camada de cliente HTTP no `AgentService` apontando para o futuro `rag-service`. |

---

## 3. Fases de Preparação Pré-Migração no `femto-chat`

---

### Fase 1 — Saneamento e Estabilização das Suítes de Teste

* **Objetivo:** Fazer com que todas as suítes de teste de backend e frontend executem com 100% de sucesso (`green build`).
* **Tarefas a Implementar:**
  1. **Ajuste do Jest no Backend (`backend/package.json`):**
     * Configurar o script de teste para operar em modo ESM:
       ```json
       "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js"
       ```
     * Atualizar a configuração do `ts-jest` com `useESM: true` ou criar `jest.config.ts`.
     * Validar execução: `npm run test` deve passar em todos os módulos (`auth`, `chats`, `messages`, `users`, `agent`).
  2. **Correção dos Specs no Frontend (`frontend/src/app/`):**
     * Em `app.spec.ts`: Atualizar o teste para verificar a renderização do `<router-outlet>` ou título atual;
     * Em `login.spec.ts` e `signup.spec.ts`: Adicionar `provideRouter([])` e `provideHttpClient()` aos `providers` do `TestBed`;
     * Em `chat.spec.ts`: Mockar o serviço `Chat` ou usar `provideHttpClientTesting()` para evitar requisições de rede reais durante a suíte de testes.
* **Definition of Done:** `npm test` roda e passa sem erros em ambos os diretórios (`backend/` e `frontend/`).

---

### Fase 2 — Blindagem de Segurança e Autorização no Gateway

* **Objetivo:** Impedir que um usuário acesse ou envie mensagens para chats de outro usuário via WebSocket.
* **Tarefas a Implementar:**
  1. No `chats.service.ts`:
     * Garantir que `read(userId, chatId)` e qualquer operação de escrita validem se `chat.userId === userId`; lançar `ForbiddenException` ou `NotFoundException` se violado.
  2. No `chats.gateway.ts`:
     * Adicionar guard ou interceptor para extrair o usuário autenticado do token Socket.io;
     * Garantir que o `userId` utilizado na criação da mensagem seja o ID autenticado, e não um parâmetro forjado no corpo da mensagem.
* **Definition of Done:** Tentativas de consultar chats de outros usuários via evento do WebSocket resultam em erro e não vazam histórico.

---

### Fase 3 — Evolução da Modelagem de Dados para Suporte a Evidências

* **Objetivo:** Adequar a persistência do banco relacional para registrar as fontes acadêmicas e seções citadas pelo motor de IA.
* **Tarefas a Implementar:**
  1. Atualizar o schema do Prisma (`backend/prisma/schema.prisma`):
     ```prisma
     model Message {
       id         String   @id @default(uuid())
       senderRole Role
       chat       Chat     @relation(fields: [chatId], references: [id])
       chatId     String
       createdAt  DateTime @default(now())
       steps      Json?
       text       String
       sources    Json?    // Lista estruturada: [{ filename, page, section, snippet }]
     }
     ```
  2. Executar `npx prisma migrate dev --name add_message_sources` e `npx prisma generate`;
  3. Atualizar o DTO `backend/src/messages/dto/create-message.dto.ts` para aceitar `sources?: any[]`;
  4. Atualizar o modelo de frontend `frontend/src/app/core/models/message.ts` com o campo `sources?: RAGSource[]`.
* **Definition of Done:** Mensagens podem ser persistidas no PostgreSQL contendo metadados de fontes sem erros de validação de schema.

---

### Fase 4 — Preparação do `AgentService` para Microsserviços

* **Objetivo:** Desacoplar a geração de respostas do SDK local do Gemini e criar a ponte HTTP com o microsserviço Python.
* **Tarefas a Implementar:**
  1. Instalar `@nestjs/axios` e `axios` no backend;
  2. Refatorar `backend/src/agent/agent.service.ts`:
     * Permitir chaveamento via variável de ambiente:
       * Se `RAG_SERVICE_URL` estiver definida: consome `POST ${RAG_SERVICE_URL}/query` com fallback gracioso;
       * Se não estiver definida: mantém o modo Gemini direto legado.
     * Retornar tanto o texto quanto o array de `sources` para que o `chats.gateway.ts` emita e salve ambos.
* **Definition of Done:** O `AgentService` compila com a nova interface e está apto a receber respostas com `{ text, sources }`.

---

### Fase 5 — Melhorias no Frontend Angular: Markdown & Card de Citações

* **Objetivo:** Elevar a qualidade visual da conversa para que a auditoria científica das evidências seja clara e interativa.
* **Tarefas a Implementar:**
  1. **Renderização de Markdown:**
     * Integrar renderizador seguro de Markdown nas mensagens do agente (ex: converter `**texto**`, listas e trechos citados);
  2. **Componente de Fontes Auditadas:**
     * No `chat.html`, se a mensagem do agente contiver `msg.sources`, exibir um rodapé elegante com badges clicáveis:
       * Exemplo: `📄 Pulse-Fi.pdf (p. 4 · Sec. III-B)`;
  3. **Drawer / Modal de Trecho Original (Opcional Pré-Migração):**
     * Ao clicar no badge da fonte, abrir visualização do trecho recuperado (*snippet*).
* **Definition of Done:** O chat em Angular exibe respostas formatadas em Markdown com tags visuais para as fontes de evidência.

---

## 4. Checklist Tático Pré-Migração

```markdown
- [ ] Configurar Jest com suporte a ESM no backend (Fase 1)
- [ ] Corrigir testes unitários do frontend no Vitest (Fase 1)
- [ ] Validar npm test verde no backend e frontend (Fase 1)
- [ ] Reforçar validação de titularidade do chatId no ChatsService / Gateway (Fase 2)
- [ ] Adicionar campo 'sources Json?' ao modelo Message no schema.prisma (Fase 3)
- [ ] Rodar migração do Prisma e atualizar CreateMessageDto (Fase 3)
- [ ] Atualizar interface Message no Angular com sources (Fase 3)
- [ ] Refatorar AgentService para suportar chamada HTTP a microsserviço externo (Fase 4)
- [ ] Adicionar renderização de Markdown e pílulas de citação no chat.html (Fase 5)
```

---

## 5. Gate de Prontidão para a Fusão com `rag-wifi-csi`

O repositório `femto-chat` estará oficialmente **pronto para a fusão** no monorepo `evidence-chat` quando:

1. Os testes de unidade do backend e frontend estiverem passando;
2. O schema do Prisma contiver o suporte a `sources`;
3. A interface do Angular estiver preparada para exibir respostas com fontes citadas;
4. Ambos os repositórios estiverem commitados e limpos para execução do `git merge --allow-unrelated-histories`.
