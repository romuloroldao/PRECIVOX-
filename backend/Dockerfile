# Backend Dockerfile - PRECIVOX API
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Criar diretório para logs e dados
RUN mkdir -p logs data

# NÃO expor 3001 para o host. Backend só deve ser acessível na rede interna (BFF).
# Em produção: não use "ports: - 3001:3001" no compose. Só Next.js (BFF) fala com o backend.
# EXPOSE omitido de propósito — ver ARCHITECTURE.md RULE 3.

# Definir variáveis de ambiente padrão
ENV NODE_ENV=staging
ENV PORT=3001

# Comando para iniciar o servidor
CMD ["npm", "start"]