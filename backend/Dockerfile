# ---------------------------------------------------
# Stage 1: Build & Dependências (TypeScript -> JS)
# ---------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Copia manifestos de pacotes e esquema do Prisma
COPY package*.json ./
COPY prisma ./prisma/

# Instala todas as dependências (incluindo devDependencies para build)
RUN npm ci

# Gera o Prisma Client nativo
RUN npx prisma generate

# Copia todo o código fonte
COPY . .

# Compila o projeto NestJS
RUN npm run build

# Remove dependências de desenvolvimento para reduzir o tamanho da imagem
RUN npm prune --production

# ---------------------------------------------------
# Stage 2: Imagem Final de Execução (Produção)
# ---------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copia apenas os arquivos necessários do estágio de build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/generated ./generated

EXPOSE 3000

# Executa o servidor de produção
CMD ["npm", "run", "start:prod"]
