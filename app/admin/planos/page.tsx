'use client';

import { useState, useEffect } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useToast } from '@/components/ToastContainer';

export default function PlanosPage() {
  const toast = useToast();
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlanos();
  }, []);

  const loadPlanos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/planos');
      
      if (response.ok) {
        const result = await response.json();
        setPlanos(result.success ? result.data : []);
      } else {
        toast.error('Erro ao carregar planos');
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Planos de Pagamento</h1>
          <p className="text-gray-600">Gerencie os planos disponíveis para os mercados</p>
        </div>

        {planos.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <p className="text-gray-500">Nenhum plano cadastrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {planos.map((plano: any) => (
              <div key={plano.id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6 border-t-4 border-blue-600">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plano.nome}</h3>
                  {plano.descricao && (
                    <p className="text-gray-600 text-sm">{plano.descricao}</p>
                  )}
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-blue-600">
                      R$ {Number(plano.valor).toFixed(2)}
                    </span>
                    <span className="text-gray-600 ml-2">/mês</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {plano.maxUnidades && (
                    <div className="flex items-center text-sm text-gray-700">
                      <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Até {plano.maxUnidades} unidades
                    </div>
                  )}
                  {plano.maxProdutos && (
                    <div className="flex items-center text-sm text-gray-700">
                      <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Até {plano.maxProdutos} produtos
                    </div>
                  )}
                  {plano.recursos && Array.isArray(plano.recursos) && plano.recursos.map((recurso: string, idx: number) => (
                    <div key={idx} className="flex items-center text-sm text-gray-700">
                      <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {recurso}
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">{plano._count?.mercados || 0}</span> mercados usando este plano
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

