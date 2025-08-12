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

# Expor porta
EXPOSE 3001

# Definir variáveis de ambiente padrão
ENV NODE_ENV=staging
ENV PORT=3001

# Comando para iniciar o servidor
CMD ["npm", "start"]