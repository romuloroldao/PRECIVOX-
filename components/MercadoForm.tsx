// Formulário de Criação/Edição de Mercado
'use client';

import { useState, useEffect } from 'react';
import { PlanoPagamento, User } from '@prisma/client';

interface MercadoFormProps {
  mercado?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  planos?: PlanoPagamento[];
  gestores?: User[];
  isAdmin?: boolean;
}

export default function MercadoForm({
  mercado,
  onSubmit,
  onCancel,
  planos = [],
  gestores = [],
  isAdmin = false,
}: MercadoFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: mercado?.nome || '',
    cnpj: mercado?.cnpj || '',
    descricao: mercado?.descricao || '',
    telefone: mercado?.telefone || '',
    emailContato: mercado?.emailContato || '',
    horarioFuncionamento: mercado?.horarioFuncionamento || '',
    planoId: mercado?.planoId || '',
    gestorId: mercado?.gestorId || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Erro ao salvar mercado:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatTelefone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nome */}
        <div className="md:col-span-2">
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
            Nome do Mercado *
          </label>
          <input
            type="text"
            id="nome"
            name="nome"
            required
            value={formData.nome}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: Supermercado Exemplo"
          />
        </div>

        {/* CNPJ */}
        <div>
          <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 mb-2">
            CNPJ *
          </label>
          <input
            type="text"
            id="cnpj"
            name="cnpj"
            required
            disabled={!!mercado}
            value={formatCNPJ(formData.cnpj)}
            onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value.replace(/\D/g, '') }))}
            maxLength={18}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            placeholder="00.000.000/0000-00"
          />
        </div>

        {/* Telefone */}
        <div>
          <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-2">
            Telefone
          </label>
          <input
            type="text"
            id="telefone"
            name="telefone"
            value={formatTelefone(formData.telefone)}
            onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value.replace(/\D/g, '') }))}
            maxLength={15}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="(00) 00000-0000"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="emailContato" className="block text-sm font-medium text-gray-700 mb-2">
            Email de Contato
          </label>
          <input
            type="email"
            id="emailContato"
            name="emailContato"
            value={formData.emailContato}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="contato@mercado.com"
          />
        </div>

        {/* Horário de Funcionamento */}
        <div>
          <label htmlFor="horarioFuncionamento" className="block text-sm font-medium text-gray-700 mb-2">
            Horário de Funcionamento
          </label>
          <input
            type="text"
            id="horarioFuncionamento"
            name="horarioFuncionamento"
            value={formData.horarioFuncionamento}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Seg-Sex: 8h-20h, Sáb: 8h-18h"
          />
        </div>

        {/* Plano (apenas Admin) */}
        {isAdmin && planos.length > 0 && (
          <div>
            <label htmlFor="planoId" className="block text-sm font-medium text-gray-700 mb-2">
              Plano de Pagamento
            </label>
            <select
              id="planoId"
              name="planoId"
              value={formData.planoId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione um plano</option>
              {planos.map((plano) => (
                <option key={plano.id} value={plano.id}>
                  {plano.nome} - R$ {Number(plano.valor).toFixed(2)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Gestor (apenas Admin) */}
        {isAdmin && gestores.length > 0 && (
          <div>
            <label htmlFor="gestorId" className="block text-sm font-medium text-gray-700 mb-2">
              Gestor Responsável
            </label>
            <select
              id="gestorId"
              name="gestorId"
              value={formData.gestorId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione um gestor</option>
              {gestores.map((gestor) => (
                <option key={gestor.id} value={gestor.id}>
                  {gestor.nome} ({gestor.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Descrição */}
        <div className="md:col-span-2">
          <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-2">
            Descrição
          </label>
          <textarea
            id="descricao"
            name="descricao"
            rows={4}
            value={formData.descricao}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Descrição do mercado..."
          />
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end space-x-4 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Salvando...' : mercado ? 'Atualizar' : 'Criar Mercado'}
        </button>
      </div>
    </form>
  );
}

