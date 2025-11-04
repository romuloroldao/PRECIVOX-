// Componente de Upload de Base de Dados
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Select } from '@/components/ui';

interface UploadDatabaseProps {
  mercadoId: string;
  unidades: Array<{ id: string; nome: string }>;
}

export default function UploadDatabase({ mercadoId, unidades }: UploadDatabaseProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [unidadeId, setUnidadeId] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
      setError('Formato de arquivo inválido. Use CSV ou XLSX');
      return;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError('Arquivo muito grande. Tamanho máximo: 50MB');
      return;
    }

    setError('');
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !unidadeId) {
      setError('Selecione um arquivo e uma unidade');
      return;
    }

    setLoading(true);
    setProgress(0);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('unidadeId', unidadeId);

      // Simula progresso
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      // Sempre busca um token fresco da sessão antes do upload
      let token: string | null = null;
      try {
        const tResp = await fetch('/api/auth/jwt', { cache: 'no-store' });
        const tJson = await tResp.json();
        if (tResp.ok && tJson?.token) {
          token = tJson.token as string;
          localStorage.setItem('token', token);
        } else {
          // fallback: tentar token antigo, se houver
          token = localStorage.getItem('token');
        }
      } catch {
        token = localStorage.getItem('token');
      }
      // Usa rota oficial /api/products (proxy Next.js existente)
      let response = await fetch(`/api/products/upload-smart/${mercadoId}`, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: formData,
      });

      // Se token expirou/invalidou, tenta renovar uma vez e refazer
      if (response.status === 401) {
        try {
          const r2 = await fetch('/api/auth/jwt', { cache: 'no-store' });
          const j2 = await r2.json();
          if (r2.ok && j2?.token) {
            localStorage.setItem('token', j2.token as string);
            response = await fetch(`/api/products/upload-smart/${mercadoId}`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${j2.token}` },
              body: formData,
            });
          }
        } catch {}
      }

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao fazer upload');
      }

      const resultado = await response.json();
      console.log('Upload concluído:', resultado);
      // Atualiza dados da página (histórico/listas) sem exigir callback do servidor
      try { router.refresh(); } catch (_) {}

      // Limpa form
      setSelectedFile(null);
      setUnidadeId('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload');
      console.error('Erro no upload:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  return (
    <Card variant="elevated" className="p-4 md:p-6">
      <CardHeader>
        <CardTitle>Upload de Base de Dados</CardTitle>
        <CardDescription>
          Envie um arquivo CSV ou XLSX com os produtos e estoque. O arquivo deve conter as colunas: 
          nome, preco, quantidade, categoria (opcional), codigo_barras (opcional).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Seleção de Unidade */}
        <Select
          label="Unidade de Destino"
          value={unidadeId}
          onChange={(e) => setUnidadeId(e.target.value)}
          disabled={loading}
          placeholder="Selecione uma unidade"
          options={unidades && Array.isArray(unidades)
            ? unidades.map((unidade) => ({ value: unidade.id, label: unidade.nome }))
            : []}
          required
        />

        {/* Upload de Arquivo */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Arquivo (CSV ou XLSX) <span className="text-error-600">*</span>
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-500 transition-colors">
          <div className="space-y-1 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex text-sm text-gray-600">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-700"
            >
                <span>Selecione um arquivo</span>
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  disabled={loading}
                  className="sr-only"
                />
              </label>
              <p className="pl-1">ou arraste aqui</p>
            </div>
            <p className="text-xs text-gray-500">CSV ou XLSX até 50MB</p>
          </div>
        </div>
        {selectedFile && (
          <div className="mt-2 text-sm text-gray-700">
            <strong>Arquivo selecionado:</strong> {selectedFile.name} (
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        )}
      </div>

        {/* Barra de Progresso */}
        {loading && (
          <div>
            <div className="flex justify-between text-sm text-text-primary mb-2">
              <span>Processando...</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-primary-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Mensagens de Erro */}
        {error && (
          <div className="bg-error-50 border border-error-200 text-error-800 px-4 py-3 rounded-lg">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-error-400 mt-0.5 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelectedFile(null);
              setUnidadeId('');
              setError('');
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            disabled={loading}
          >
            Limpar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleUpload}
            disabled={loading || !selectedFile || !unidadeId}
            isLoading={loading}
          >
            {loading ? 'Processando...' : 'Fazer Upload'}
          </Button>
        </div>

        {/* Instruções */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-primary-900 mb-2">
            Formato do arquivo:
          </h4>
          <div className="text-sm text-primary-800 space-y-2">
            <p><strong>Colunas obrigatórias:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><code className="bg-primary-100 px-1 py-0.5 rounded">nome</code> - Nome do produto</li>
              <li><code className="bg-primary-100 px-1 py-0.5 rounded">preco</code> - Preço do produto</li>
              <li><code className="bg-primary-100 px-1 py-0.5 rounded">quantidade</code> - Quantidade em estoque</li>
            </ul>
            <p className="mt-2"><strong>Colunas opcionais:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><code className="bg-primary-100 px-1 py-0.5 rounded">descricao</code> - Descrição do produto</li>
              <li><code className="bg-primary-100 px-1 py-0.5 rounded">categoria</code> - Categoria do produto</li>
              <li><code className="bg-primary-100 px-1 py-0.5 rounded">codigo_barras</code> ou <code className="bg-primary-100 px-1 py-0.5 rounded">ean</code> - Código de barras</li>
              <li><code className="bg-primary-100 px-1 py-0.5 rounded">marca</code> - Marca do produto</li>
              <li><code className="bg-primary-100 px-1 py-0.5 rounded">preco_promocional</code> - Preço em promoção</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

