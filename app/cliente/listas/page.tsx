'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

interface ShoppingList {
  id: string;
  name: string;
  description?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    store: string;
    quantity: number;
  }>;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export default function MinhasListasPage() {
  const [lists, setLists] = useState<ShoppingList[]>([
    {
      id: '1',
      name: 'Lista do Final de Semana',
      description: 'Compras para o final de semana',
      items: [
        { id: '1', name: 'Cerveja Skol 350ml', price: 3.20, store: 'Supermercado Central', quantity: 6 },
        { id: '2', name: 'Refrigerante Coca-Cola 2L', price: 7.50, store: 'Mercado do João', quantity: 2 },
        { id: '3', name: 'Pão Francês (kg)', price: 12.00, store: 'Mercadinho da Esquina', quantity: 1 }
      ],
      total: 32.40,
      createdAt: '2024-01-20',
      updatedAt: '2024-01-20'
    },
    {
      id: '2',
      name: 'Lista de Limpeza',
      description: 'Produtos de limpeza para casa',
      items: [
        { id: '4', name: 'Detergente Ypê 500ml', price: 2.99, store: 'Supermercado Central', quantity: 3 },
        { id: '5', name: 'Sabão em Pó OMO 1kg', price: 8.55, store: 'Mercado do João', quantity: 1 }
      ],
      total: 17.52,
      createdAt: '2024-01-18',
      updatedAt: '2024-01-19'
    }
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');

  const handleCreateList = () => {
    if (!newListName.trim()) return;

    const newList: ShoppingList = {
      id: Date.now().toString(),
      name: newListName,
      description: newListDescription,
      items: [],
      total: 0,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    setLists([...lists, newList]);
    setNewListName('');
    setNewListDescription('');
    setShowCreateForm(false);
  };

  const handleEditList = (list: ShoppingList) => {
    setEditingList(list);
    setNewListName(list.name);
    setNewListDescription(list.description || '');
    setShowCreateForm(true);
  };

  const handleUpdateList = () => {
    if (!editingList || !newListName.trim()) return;

    const updatedLists = lists.map(list => 
      list.id === editingList.id 
        ? { 
            ...list, 
            name: newListName, 
            description: newListDescription,
            updatedAt: new Date().toISOString().split('T')[0]
          }
        : list
    );

    setLists(updatedLists);
    setEditingList(null);
    setNewListName('');
    setNewListDescription('');
    setShowCreateForm(false);
  };

  const handleDeleteList = (listId: string) => {
    if (confirm('Tem certeza que deseja excluir esta lista?')) {
      setLists(lists.filter(list => list.id !== listId));
    }
  };

  const handleCancelForm = () => {
    setShowCreateForm(false);
    setEditingList(null);
    setNewListName('');
    setNewListDescription('');
  };

  return (
    <DashboardLayout role="CLIENTE">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Minhas Listas</h1>
            <p className="text-gray-600 mt-2">Gerencie suas listas de compras</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-precivox-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Nova Lista
            </button>
            <Link 
              href="/cliente/comparar"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ← Buscar Produtos
            </Link>
          </div>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingList ? 'Editar Lista' : 'Nova Lista'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Lista *
                </label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Ex: Lista do Final de Semana"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-precivox-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder="Descreva sua lista..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-precivox-blue focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={editingList ? handleUpdateList : handleCreateList}
                  className="px-4 py-2 bg-precivox-green text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  {editingList ? 'Atualizar' : 'Criar Lista'}
                </button>
                <button
                  onClick={handleCancelForm}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => (
            <div key={list.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{list.name}</h3>
                  {list.description && (
                    <p className="text-sm text-gray-600 mb-2">{list.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{list.items.length} itens</span>
                    <span>R$ {list.total.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditList(list)}
                    className="p-2 text-gray-600 hover:text-precivox-blue transition-colors"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteList(list.id)}
                    className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                    title="Excluir"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* List Items Preview */}
              <div className="space-y-2 mb-4">
                {list.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{item.name}</span>
                    <span className="text-precivox-blue font-medium">
                      R$ {item.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
                {list.items.length > 3 && (
                  <p className="text-xs text-gray-500">
                    +{list.items.length - 3} itens...
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/cliente/comparar?lista=${list.id}`}
                  className="flex-1 px-3 py-2 bg-precivox-blue text-white rounded-lg hover:bg-blue-700 transition-colors text-center text-sm"
                >
                  Abrir Lista
                </Link>
                <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                  📋
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                Criada em {new Date(list.createdAt).toLocaleDateString('pt-BR')}
                {list.updatedAt !== list.createdAt && (
                  <span> • Atualizada em {new Date(list.updatedAt).toLocaleDateString('pt-BR')}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {lists.length === 0 && !showCreateForm && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="w-16 h-16 bg-precivox-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              📋
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma lista criada</h3>
            <p className="text-gray-600 mb-4">
              Crie sua primeira lista de compras para começar a organizar suas compras
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-precivox-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Criar Primeira Lista
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
