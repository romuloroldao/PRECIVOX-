// Servidor Express principal do PRECIVOX
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mercadosRouter from './routes/mercados';
import unidadesRouter from './routes/unidades';
import planosRouter from './routes/planos';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cria diretório de uploads se não existir
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Rotas de saúde
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas da API
app.use('/api/mercados', mercadosRouter);
app.use('/api', unidadesRouter);
app.use('/api/planos', planosRouter);

// Tratamento de erros 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.method} ${req.path} não existe`,
  });
});

// Tratamento de erros globais
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro não tratado:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor PRECIVOX rodando na porta ${PORT}`);
  console.log(`📁 Diretório de uploads: ${uploadsDir}`);
});

export default app;

