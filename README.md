# femto-chat

Full-stack conversational platform featuring bidirectional real-time token streaming with Google Gemini, NestJS, Angular, and PostgreSQL.

## System Overview

`femto-chat` is structured as a decoupled monorepo composed of a NestJS backend and an Angular 22 frontend. The system provides real-time multi-turn interactions with Google Gemini Large Language Models over WebSockets, with persistence managed by Prisma ORM over PostgreSQL.

```mermaid
flowchart TD
    subgraph Frontend["Angular 22 Single Page Application"]
        UI["Chat / Auth Components"]
        ChatService["Chat Service (Socket.IO Client)"]
        AuthService["Auth Service (HTTP Client + Interceptor)"]
    end

    subgraph Backend["NestJS 11 Application"]
        AuthCtrl["Auth & Users Controller"]
        ChatsCtrl["Chats Controller (REST API)"]
        Guard["AuthGuard (JWT Verification)"]
        Gateway["ChatsGateway (Socket.IO WebSocket)"]
        AgentSvc["AgentService (@google/genai SDK)"]
        PrismaSvc["PrismaService (ORM Layer)"]
    end

    subgraph External["External Services & Storage"]
        Gemini["Google Gemini API (gemini-flash-lite-latest)"]
        Postgres[("PostgreSQL 18 Database")]
    end

    UI --> AuthService
    UI --> ChatService
    AuthService -->|HTTP REST| AuthCtrl
    AuthService -->|HTTP REST (Bearer Token)| ChatsCtrl
    ChatsCtrl --> Guard
    ChatService -->|WebSocket Connection| Gateway
    Guard --> PrismaSvc
    ChatsCtrl --> PrismaSvc
    Gateway --> AgentSvc
    Gateway --> PrismaSvc
    AgentSvc -->|Streaming Query + Multi-turn Context| Gemini
    Gemini -.->|Token Deltas (step.delta)| AgentSvc
    AgentSvc -.->|agent-message Chunks| Gateway
    Gateway -.->|Real-time Socket.IO Broadcast| ChatService
    PrismaSvc --> Postgres
```

### Architectural Characteristics

- **Decoupled Monorepo Architecture**: Separation of concerns between a client-rendered Angular application and a modular NestJS API server.
- **Bidirectional WebSocket Communication**: The platform uses Socket.IO (`ChatsGateway`) to manage persistent client connections, handle room membership per chat session, and stream token deltas.
- **LLM Context Management & Streaming**: `AgentService` interfaces with the Google GenAI SDK (`@google/genai`). When querying `gemini-flash-lite-latest`, it reconstructs conversation history from persisted steps (`user_input` and `model_output`). As tokens arrive via the streaming iterator, `agent-message` events are broadcast to room participants, minimizing time-to-first-token.
- **JWT-Based Authentication**: Access tokens are signed and verified using `@nestjs/jwt`. A custom `AuthGuard` extracts Bearer tokens from the `Authorization` HTTP header and attaches decoded claims to the request.
- **Relational Persistence**: Prisma ORM with `@prisma/adapter-pg` manages relational schema definitions and database operations for users, chat sessions, and message entities.

---

## Technology Stack

| Category | Component / Library | Version | Description |
| :--- | :--- | :--- | :--- |
| Backend Runtime | Node.js | >= 22.0.0 | Server-side JavaScript execution environment |
| Backend Framework | NestJS | 11.0.1 | Enterprise TypeScript architecture for controllers, modules, and gateways |
| Frontend Framework | Angular | 22.1.0 | Standalone component-based frontend framework |
| Frontend Build Tool | Angular Build / Vite | 22.1.2 | Development server and production bundling |
| AI Integration | Google GenAI SDK (`@google/genai`) | 2.13.0 | Client for streaming interactions with Google Gemini models |
| Real-time Transport | Socket.IO / `@nestjs/platform-socket.io` | 4.8.3 / 11.1.28 | WebSocket engine for bidirectional, event-driven communication |
| ORM & Data Access | Prisma ORM / `@prisma/adapter-pg` | 7.9.0 | Schema modeling, migrations, and database client generation |
| Database | PostgreSQL | 18-alpine | Relational database storage |
| Security | bcrypt / `@nestjs/jwt` | 6.0.0 / 11.0.2 | Password hashing and JWT issuance/verification |
| Frontend Styling | Tailwind CSS | 4.1.12 | Utility-first styling framework |
| Testing (Backend) | Jest / ts-jest / Supertest | 30.0.0 | Unit and integration testing framework |
| Testing (Frontend) | Vitest / JSDOM | 4.0.8 | Next-generation testing framework for Angular components |
| Containerization | Docker / Docker Compose | Compose v2 | Multi-container environment orchestration |

---

## Data Model

The database schema is defined in `backend/prisma/schema.prisma`.

```mermaid
erDiagram
    User ||--o{ Chat : owns
    Chat ||--o{ Message : contains

    User {
        String id PK "UUID"
        String email UK "Unique address"
        String name "Display name"
        String passwordHash "Bcrypt hash"
        DateTime createdAt "Timestamp"
        DateTime updatedAt "Timestamp"
    }

    Chat {
        String id PK "UUID"
        String name "Chat title"
        String userId FK "Owner identifier"
        DateTime createdAt "Timestamp"
        DateTime updatedAt "Timestamp"
    }

    Message {
        String id PK "UUID"
        Role senderRole "USER | AGENT"
        String chatId FK "Chat identifier"
        String text "Message text"
        Json steps "Interaction steps"
        DateTime createdAt "Timestamp"
    }
```

---

## API Specification

### REST Endpoints

#### Authentication (`/auth`)

| Method | Endpoint | Auth | Request Body | Response | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Public | `{ "email": "...", "password": "..." }` | `{ "access_token": "..." }` | Validates credentials and returns a signed JWT |

#### Users (`/users`)

| Method | Endpoint | Auth | Request Body | Response | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/users` | Public | `{ "name": "...", "email": "...", "password": "..." }` | User record | Registers a new user account with hashed password |
| `GET` | `/users/:id` | Bearer JWT | None | User record | Fetches user profile by identifier |
| `PATCH` | `/users/:id` | Bearer JWT | `{ "name"?: "...", "email"?: "..." }` | Updated user record | Updates user attributes |
| `DELETE` | `/users/:id` | Bearer JWT | None | Deleted user record | Deletes a user account |

#### Chats (`/chats`)

| Method | Endpoint | Auth | Request Body | Response | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/chats` | Bearer JWT | None | Array of chat objects | Retrieves all chats owned by the authenticated user |
| `POST` | `/chats` | Bearer JWT | `{ "name"?: "..." }` | Created chat object | Initializes a new chat session |
| `PATCH` | `/chats/:id` | Bearer JWT | `{ "name": "..." }` | Updated chat object | Renames an existing chat session |
| `DELETE` | `/chats/:id` | Bearer JWT | None | Deleted chat object | Deletes a chat session and associated messages |

---

## WebSocket Events Specification

The WebSocket gateway runs over the root namespace (`/`) with CORS enabled for all origins.

### Inbound Events (Client to Server)

- **`joinChat`**:
  - **Payload**:
    ```json
    {
      "userId": "string",
      "chatId": "string"
    }
    ```
  - **Action**: Associates the connecting socket with the room identified by `chatId`.

- **`readChatMessages`**:
  - **Payload**:
    ```json
    {
      "userId": "string",
      "chatId": "string"
    }
    ```
  - **Action**: Queries database for all messages belonging to the given `chatId` and `userId` ordered chronologically. Returns the array directly via acknowledgment callback.

- **`sendMessage`**:
  - **Payload**:
    ```json
    {
      "createMessageDto": {
        "chatId": "string",
        "senderRole": "USER",
        "text": "string"
      },
      "userId": "string"
    }
    ```
  - **Action**:
    1. Persists user message in the database.
    2. Emits `user-message` to the room `chatId`.
    3. Aggregates prior dialogue steps from database history to maintain multi-turn context.
    4. Initiates streaming query via `AgentService` to Google Gemini.
    5. Dispatches streaming token deltas to room subscribers.
    6. Persists completed agent response and interaction steps to database.

### Outbound Events (Server to Room `chatId`)

- **`user-message`**:
  - **Payload**: `string` (the validated message text submitted by the user).
  - **Purpose**: Synchronizes the displayed user message across all connected clients in the chat room.

- **`agent-message`**:
  - **Payload**: `string` (individual text delta chunk received from the Gemini stream).
  - **Purpose**: Enables incremental, real-time rendering of the LLM response in the frontend interface.

---

## Local Setup and Execution

### Prerequisites

- Node.js 22.x or later
- npm 10.x or later
- Docker and Docker Compose
- Google Gemini API Key

### Environment Configuration

Configure the environment variables in `.env` (or `backend/.env`):

```bash
cp .env.example .env
```

Set the following variables:

```dotenv
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432
POSTGRES_DB=femto_chat
POSTGRES_HOST=postgres

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/femto_chat?schema=public"
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_jwt_secret_key_here
PORT=3000
```

### Running with Docker Compose

To start PostgreSQL and the NestJS backend containerized:

```bash
docker compose up --build -d
```

Verify running containers:

```bash
docker compose ps
```

### Running Services Manually for Development

#### 1. Database and Prisma Setup

Start PostgreSQL via Docker or local instance, then navigate to `backend/`:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

The backend starts listening on `http://localhost:3000`.

#### 2. Frontend Application

From a separate terminal, navigate to `frontend/`:

```bash
cd frontend
npm install
npm start
```

The Angular application is served at `http://localhost:4200`.

---

## Automated Testing

### Backend Test Execution

From the `backend/` directory:

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:cov

# Run end-to-end tests
npm run test:e2e
```

**Layers Covered:**
- **Controllers**: `AuthController`, `UsersController`, `ChatsController`, `AppController` (HTTP routing, parameter binding, response format).
- **Services**: `AuthService` (credential comparison, JWT generation), `UsersService`, `ChatsService`, `MessagesService`, and `AgentService` (GenAI client invocations and stream handlers).
- **Gateways**: `ChatsGateway` (Socket.IO room joining, event interception, and message propagation).

### Frontend Test Execution

From the `frontend/` directory:

```bash
npm test
```

**Layers Covered (via Vitest):**
- **Core Services**: `Auth` (token storage, login requests), `Chat` (socket connection, event listeners, message dispatching).
- **Guards & Interceptors**: `AuthGuard` (route protection based on token state), `AuthInterceptor` (attaching Bearer token to HTTP headers).
- **UI Components**: `Login`, `Signup`, and `Chat` feature components.
