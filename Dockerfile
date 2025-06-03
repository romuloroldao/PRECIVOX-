FROM python:3.11-slim

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema primeiro
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Atualizar pip
RUN pip install --upgrade pip

# Instalar Flask direto (sem requirements primeiro)
RUN pip install Flask==2.3.3
RUN pip install Flask-CORS==4.0.0

# Copiar código
COPY . .

# Criar diretórios
RUN mkdir -p data logs config

# Expor porta
EXPOSE 5000

# Executar
CMD ["python", "app.py"]