'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function ModuloConversaoPage() {
  // Dados de exemplo (em produção, buscar do backend)
  const metricas = {
    taxaConversao: {
      online: 68,
      presencial: 85,
      meta: 75
    },
    taxaRecompra: {
      dias30: 42,
      meta: 55,
      gap: -13
    },
    ticketMedio: {
      premium: 145,
      regular: 85,
      ocasional: 52
    },
    nps: {
      score: 72,
      promotores: 80,
      neutros: 12,
      detratores: 8
    }
  };

  const itensAbandonados = [
    {
      id: 1,
      nome: 'Detergente Ypê 500ml',
      adicoes: 310,
      compras: 42,
      conversao: 13.5,
      precoAtual: 4.20,
      precoMedio: 3.75,
      diferenca: 12,
      recomendacao: 'Reduzir preço para R$ 3,80 (-10%) pode aumentar conversão para 58%'
    },
    {
      id: 2,
      nome: 'Sabão em Pó 1kg',
      adicoes: 287,
      compras: 85,
      conversao: 29.6,
      problema: 'Disponibilidade',
      recomendacao: 'Ruptura 3x no último mês. Manter estoque mínimo de 150 unidades.'
    },
    {
      id: 3,
      nome: 'Leite Condensado 395g',
      adicoes: 245,
      compras: 102,
      conversao: 41.6,
      precoAtual: 6.50,
      precoMedio: 6.00,
      diferenca: 8,
      recomendacao: 'Preço 8% acima da média. Ajustar para R$ 6,00 pode melhorar conversão.'
    }
  ];

  const tendenciasBusca = [
    { termo: 'cerveja artesanal', buscas: 127, demanda: 'ALTA' },
    { termo: 'frutas orgânicas', buscas: 98, demanda: 'ALTA' },
    { termo: 'produtos sem lactose', buscas: 76, demanda: 'MEDIA' },
    { termo: 'alimentos veganos', buscas: 54, demanda: 'MEDIA' },
    { termo: 'açúcar de coco', buscas: 42, demanda: 'MEDIA' }
  ];

  return (
    <DashboardLayout role="GESTOR">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-8 text-white">
          <Link href="/gestor/ia" className="text-sm opacity-75 hover:opacity-100 mb-2 inline-block">
            ← Voltar ao Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">🛍️ Conversão e Fidelização</h1>
          <p className="text-lg opacity-90">
            Taxa de conversão, recompra, ticket médio e satisfação do cliente
          </p>
        </div>

        {/* Métricas de Conversão */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">📈 Métricas de Conversão</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Taxa de Conversão */}
            <div className="border-2 border-blue-200 rounded-lg p-5">
              <h3 className="font-semibold text-gray-700 mb-4">Taxa de Conversão</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Online</span>
                    <span className="font-bold">{metricas.taxaConversao.online}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${metricas.taxaConversao.online}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Presencial</span>
                    <span className="font-bold">{metricas.taxaConversao.presencial}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${metricas.taxaConversao.presencial}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3 border-t pt-3">
                Meta: {metricas.taxaConversao.meta}%
              </p>
            </div>

            {/* Taxa de Recompra */}
            <div className="border-2 border-orange-200 rounded-lg p-5">
              <h3 className="font-semibold text-gray-700 mb-4">Taxa de Recompra</h3>
              <p className="text-4xl font-bold text-gray-900 mb-2">
                {metricas.taxaRecompra.dias30}%
              </p>
              <p className="text-sm text-gray-600 mb-3">em 30 dias</p>
              <div className="bg-orange-50 rounded p-3">
                <p className="text-xs text-orange-800">
                  <span className="font-semibold">Meta:</span> {metricas.taxaRecompra.meta}%
                </p>
                <p className="text-xs text-orange-800">
                  <span className="font-semibold">Gap:</span> {metricas.taxaRecompra.gap} pontos
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                ⚠️ Abaixo da meta
              </p>
            </div>

            {/* Ticket Médio */}
            <div className="border-2 border-green-200 rounded-lg p-5">
              <h3 className="font-semibold text-gray-700 mb-4">Ticket Médio</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Premium</span>
                  <span className="font-bold text-green-600">R$ {metricas.ticketMedio.premium}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Regular</span>
                  <span className="font-bold text-blue-600">R$ {metricas.ticketMedio.regular}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Ocasional</span>
                  <span className="font-bold text-gray-600">R$ {metricas.ticketMedio.ocasional}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3 border-t pt-3">
                💡 Oportunidade de upsell para clientes regulares
              </p>
            </div>
          </div>
        </div>

        {/* Itens Abandonados */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📋 Itens Mais Abandonados em Listas (Alta Intenção, Baixa Compra)
          </h2>

          <div className="space-y-4">
            {itensAbandonados.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-5 hover:border-purple-400 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{item.nome}</h3>
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
                    {item.conversao}% conversão
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gray-50 rounded p-3 text-center">
                    <p className="text-xs text-gray-500">Adições</p>
                    <p className="font-bold text-gray-900">{item.adicoes}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-3 text-center">
                    <p className="text-xs text-gray-500">Compras</p>
                    <p className="font-bold text-gray-900">{item.compras}</p>
                  </div>
                  <div className="bg-gray-50 rounded p-3 text-center">
                    <p className="text-xs text-gray-500">Conversão</p>
                    <p className="font-bold text-red-600">{item.conversao}%</p>
                  </div>
                </div>

                {item.precoAtual && (
                  <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mb-3">
                    <p className="text-sm text-yellow-900">
                      <span className="font-semibold">Análise de Preço:</span> Seu preço (R$ {item.precoAtual.toFixed(2)}) 
                      está {item.diferenca}% acima da média regional (R$ {item.precoMedio})
                    </p>
                  </div>
                )}

                <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded">
                  <p className="text-sm font-semibold text-purple-900 mb-1">
                    💡 Recomendação da IA:
                  </p>
                  <p className="text-sm text-purple-800">{item.recomendacao}</p>
                </div>

                <div className="mt-3 flex gap-2">
                  {item.precoAtual && (
                    <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                      Ajustar Preço
                    </button>
                  )}
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Ver Análise Completa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NPS e Satisfação */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">⭐ NPS e Satisfação do Cliente</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* NPS Score */}
            <div>
              <div className="text-center mb-4">
                <p className="text-6xl font-bold text-green-600 mb-2">{metricas.nps.score}</p>
                <p className="text-sm text-gray-600">✅ Zona de Excelência (50-74)</p>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Promotores (9-10)</span>
                    <span className="font-bold text-green-600">{metricas.nps.promotores}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full"
                      style={{ width: `${metricas.nps.promotores}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Neutros (7-8)</span>
                    <span className="font-bold text-yellow-600">{metricas.nps.neutros}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-yellow-500 h-3 rounded-full"
                      style={{ width: `${metricas.nps.neutros}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Detratores (0-6)</span>
                    <span className="font-bold text-red-600">{metricas.nps.detratores}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-red-500 h-3 rounded-full"
                      style={{ width: `${metricas.nps.detratores}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Análise de Feedback */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Principais Menções</h3>
              
              <div className="mb-4">
                <p className="text-sm font-semibold text-green-700 mb-2">👍 Elogios:</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Variedade de produtos</span>
                    <span className="font-bold text-green-600">145 menções</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Atendimento</span>
                    <span className="font-bold text-green-600">98 menções</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Limpeza</span>
                    <span className="font-bold text-green-600">87 menções</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-red-700 mb-2">👎 Críticas:</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Preços altos</span>
                    <span className="font-bold text-red-600">28 menções</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Filas no caixa</span>
                    <span className="font-bold text-red-600">15 menções</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Estacionamento</span>
                    <span className="font-bold text-red-600">12 menções</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">💡 Ação Prioritária:</span> Revisar precificação 
                  (principal crítica) para reduzir detratores e aumentar NPS.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tendências de Busca */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            🔍 Tendências de Busca (Produtos não encontrados)
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Produtos que clientes buscam mas não estão disponíveis - oportunidades de expansão
          </p>

          <div className="space-y-3">
            {tendenciasBusca.map((tendencia, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-400 transition-all">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{tendencia.termo}</p>
                  <p className="text-sm text-gray-600">{tendencia.buscas} buscas/mês</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    tendencia.demanda === 'ALTA'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    🔥 {tendencia.demanda} DEMANDA
                  </span>
                  <button className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors">
                    Adicionar ao Mix
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-purple-50 border border-purple-200 rounded p-4">
            <p className="text-sm text-purple-900">
              <span className="font-semibold">💡 Insight:</span> Clientes buscam produtos premium/especiais. 
              Expandir linha de cervejas artesanais e orgânicos pode aumentar ticket médio em 18%.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

