// Componente de Upload de Base de Dados
'use client';

import { useState, useRef } from 'react';

interface UploadDatabaseProps {
  mercadoId: string;
  unidades: Array<{ id: string; nome: string }>;
  onUploadComplete: (resultado: any) => void;
}

export default function UploadDatabase({ mercadoId, unidades, onUploadComplete }: UploadDatabaseProps) {
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
      formData.append('arquivo', selectedFile);
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

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/mercados/${mercadoId}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao fazer upload');
      }

      const resultado = await response.json();
      
      // Validar estrutura da resposta
      if (!resultado || typeof resultado !== 'object') {
        throw new Error('Resposta inválida do servidor');
      }
      
      // Verificar se tem a estrutura esperada
      if (!resultado.resultado) {
        console.warn('Resposta não tem estrutura esperada:', resultado);
        // Criar estrutura padrão se não existir
        const resultadoPadrao = {
          resultado: {
            totalLinhas: 0,
            sucesso: 0,
            erros: 0,
            duplicados: 0
          }
        };
        onUploadComplete(resultadoPadrao);
      } else {
        onUploadComplete(resultado);
      }

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
    <div className="bg-white p-6 rounded-lg shadow space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Upload de Base de Dados
        </h3>
        <p className="text-sm text-gray-600">
          Envie um arquivo CSV ou XLSX com os produtos e estoque. O arquivo deve conter as colunas: 
          nome, preco, quantidade, categoria (opcional), codigo_barras (opcional).
        </p>
      </div>

      {/* Seleção de Unidade */}
      <div>
        <label htmlFor="unidade" className="block text-sm font-medium text-gray-700 mb-2">
          Unidade de Destino *
        </label>
        <select
          id="unidade"
          value={unidadeId}
          onChange={(e) => setUnidadeId(e.target.value)}
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        >
          <option value="">Selecione uma unidade</option>
          {unidades.map((unidade) => (
            <option key={unidade.id} value={unidade.id}>
              {unidade.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Upload de Arquivo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Arquivo (CSV ou XLSX) *
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
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
                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
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
          <div className="flex justify-between text-sm text-gray-700 mb-1">
            <span>Processando...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Mensagens de Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-red-400 mt-0.5 mr-2"
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
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => {
            setSelectedFile(null);
            setUnidadeId('');
            setError('');
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}
          disabled={loading}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Limpar
        </button>
        <button
          type="button"
          onClick={handleUpload}
          disabled={loading || !selectedFile || !unidadeId}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processando...' : 'Fazer Upload'}
        </button>
      </div>

      {/* Instruções */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          Formato do arquivo:
        </h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Colunas obrigatórias:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><code>nome</code> - Nome do produto</li>
            <li><code>preco</code> - Preço do produto</li>
            <li><code>quantidade</code> - Quantidade em estoque</li>
          </ul>
          <p className="mt-2"><strong>Colunas opcionais:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><code>descricao</code> - Descrição do produto</li>
            <li><code>categoria</code> - Categoria do produto</li>
            <li><code>codigo_barras</code> ou <code>ean</code> - Código de barras</li>
            <li><code>marca</code> - Marca do produto</li>
            <li><code>preco_promocional</code> - Preço em promoção</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

