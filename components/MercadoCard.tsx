// Card de Visualização de Mercado
'use client';

import Link from 'next/link';

interface MercadoCardProps {
  mercado: any;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function MercadoCard({ mercado, isAdmin = false, onEdit, onDelete }: MercadoCardProps) {
  const formatCNPJ = (cnpj: string) => {
    return cnpj
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{mercado.nome}</h3>
          <p className="text-sm text-gray-600">CNPJ: {formatCNPJ(mercado.cnpj)}</p>
        </div>
        {!mercado.ativo && (
          <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
            Inativo
          </span>
        )}
      </div>

      {mercado.descricao && (
        <p className="text-gray-700 text-sm mb-4 line-clamp-2">{mercado.descricao}</p>
      )}

      <div className="space-y-2 mb-4">
        {mercado.telefone && (
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {mercado.telefone}
          </div>
        )}

        {mercado.emailContato && (
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {mercado.emailContato}
          </div>
        )}

        {mercado.horarioFuncionamento && (
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {mercado.horarioFuncionamento}
          </div>
        )}
      </div>

      {/* Informações Adicionais */}
      <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-200">
        <div>
          <p className="text-xs text-gray-500 mb-1">Unidades</p>
          <p className="text-lg font-semibold text-gray-900">
            {mercado._count?.unidades || 0}
          </p>
        </div>
        {mercado.plano && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Plano</p>
            <p className="text-sm font-semibold text-blue-600">{mercado.plano.nome}</p>
          </div>
        )}
      </div>

      {mercado.gestor && (
        <div className="py-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Gestor Responsável</p>
          <p className="text-sm font-medium text-gray-900">{mercado.gestor.nome}</p>
          <p className="text-xs text-gray-600">{mercado.gestor.email}</p>
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
        <Link
          href={isAdmin ? `/admin/mercados/${mercado.id}` : `/gestor/mercado`}
          className="flex-1 text-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Ver Detalhes
        </Link>
        {isAdmin && onEdit && (
          <button
            onClick={onEdit}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Editar
          </button>
        )}
        {isAdmin && onDelete && (
          <button
            onClick={onDelete}
            className="px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
          >
            Excluir
          </button>
        )}
      </div>
    </div>
  );
}

