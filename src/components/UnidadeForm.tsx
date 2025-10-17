// Formulário de Criação/Edição de Unidade
'use client';

import { useState } from 'react';

interface UnidadeFormProps {
  unidade?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function UnidadeForm({ unidade, onSubmit, onCancel }: UnidadeFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: unidade?.nome || '',
    endereco: unidade?.endereco || '',
    bairro: unidade?.bairro || '',
    cidade: unidade?.cidade || '',
    estado: unidade?.estado || '',
    cep: unidade?.cep || '',
    telefone: unidade?.telefone || '',
    horarioFuncionamento: unidade?.horarioFuncionamento || '',
    latitude: unidade?.latitude || '',
    longitude: unidade?.longitude || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit({
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      });
    } catch (error) {
      console.error('Erro ao salvar unidade:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  };

  const formatTelefone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nome */}
        <div className="md:col-span-2">
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
            Nome da Unidade *
          </label>
          <input
            type="text"
            id="nome"
            name="nome"
            required
            value={formData.nome}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: Filial Centro"
          />
        </div>

        {/* Endereço */}
        <div className="md:col-span-2">
          <label htmlFor="endereco" className="block text-sm font-medium text-gray-700 mb-2">
            Endereço
          </label>
          <input
            type="text"
            id="endereco"
            name="endereco"
            value={formData.endereco}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Rua, número"
          />
        </div>

        {/* Bairro */}
        <div>
          <label htmlFor="bairro" className="block text-sm font-medium text-gray-700 mb-2">
            Bairro
          </label>
          <input
            type="text"
            id="bairro"
            name="bairro"
            value={formData.bairro}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: Centro"
          />
        </div>

        {/* Cidade */}
        <div>
          <label htmlFor="cidade" className="block text-sm font-medium text-gray-700 mb-2">
            Cidade
          </label>
          <input
            type="text"
            id="cidade"
            name="cidade"
            value={formData.cidade}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: São Paulo"
          />
        </div>

        {/* Estado */}
        <div>
          <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <select
            id="estado"
            name="estado"
            value={formData.estado}
            onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Selecione</option>
            {estados.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </div>

        {/* CEP */}
        <div>
          <label htmlFor="cep" className="block text-sm font-medium text-gray-700 mb-2">
            CEP
          </label>
          <input
            type="text"
            id="cep"
            name="cep"
            value={formatCEP(formData.cep)}
            onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value.replace(/\D/g, '') }))}
            maxLength={9}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="00000-000"
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
            placeholder="Seg-Sex: 8h-20h"
          />
        </div>

        {/* Latitude */}
        <div>
          <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-2">
            Latitude (opcional)
          </label>
          <input
            type="number"
            step="any"
            id="latitude"
            name="latitude"
            value={formData.latitude}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="-23.550520"
          />
        </div>

        {/* Longitude */}
        <div>
          <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-2">
            Longitude (opcional)
          </label>
          <input
            type="number"
            step="any"
            id="longitude"
            name="longitude"
            value={formData.longitude}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="-46.633308"
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
          {loading ? 'Salvando...' : unidade ? 'Atualizar' : 'Criar Unidade'}
        </button>
      </div>
    </form>
  );
}

