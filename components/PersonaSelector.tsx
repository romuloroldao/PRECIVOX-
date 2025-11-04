'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function PersonaSelector() {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedPersona, setSelectedPersona] = useState<'cliente' | 'gestor' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectPersona = async (persona: 'cliente' | 'gestor') => {
    setIsLoading(true);
    setSelectedPersona(persona);

    // Simular delay de transição
    await new Promise(resolve => setTimeout(resolve, 500));

    // Redirecionar baseado na escolha
    if (persona === 'cliente') {
      router.push('/');
    } else if (persona === 'gestor') {
      router.push('/gestor/home');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-teal-600 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Bem-vindo ao PRECIVOX! 👋
          </h1>
          <p className="text-xl text-blue-100">
            Escolha como deseja acessar o sistema
          </p>
        </div>

        {/* Persona Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Cliente Card */}
          <div
            onClick={() => handleSelectPersona('cliente')}
            className={`bg-white rounded-2xl p-8 cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl ${
              selectedPersona === 'cliente' ? 'ring-4 ring-blue-400' : ''
            } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Sou Cliente
              </h2>
              <p className="text-gray-600 mb-6">
                Compare preços, encontre promoções e economize nas suas compras
              </p>
              <div className="space-y-2 text-left">
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Comparação de preços em tempo real
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Listas de compras inteligentes
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Alertas de promoções
                </div>
              </div>
              <button
                disabled={isLoading}
                className="mt-6 w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Acessar como Cliente
              </button>
            </div>
          </div>

          {/* Gestor Card */}
          <div
            onClick={() => handleSelectPersona('gestor')}
            className={`bg-white rounded-2xl p-8 cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl ${
              selectedPersona === 'gestor' ? 'ring-4 ring-teal-400' : ''
            } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Sou Gestor
              </h2>
              <p className="text-gray-600 mb-6">
                Gerencie produtos, preços e análises com inteligência artificial
              </p>
              <div className="space-y-2 text-left">
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  IA aplicável para otimização
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Dashboard analítico completo
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Gestão inteligente de estoque
                </div>
              </div>
              <button
                disabled={isLoading}
                className="mt-6 w-full bg-teal-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
              >
                Acessar como Gestor
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/logout')}
            className="text-white hover:text-blue-100 transition-colors text-sm"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
