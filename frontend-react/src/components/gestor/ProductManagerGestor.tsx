// src/components/gestor/ProductManagerGestor.tsx - Gestão de Produtos para Gestores
import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Star,
  DollarSign,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  X,
  Save,
  Camera,
  Barcode,
  Tag,
  Store,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Users
} from 'lucide-react';

import { useAuth, usePermissions } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import '../../styles/mobile-fixes.css';

// ✅ INTERFACES ESPECÍFICAS PARA GESTOR
interface ProductGestor {
  id: string;
  nome: string;
  categoria: string;
  subcategoria?: string;
  preco: number;
  mercado: string;
  mercadoId: string;
  marca: string;
  codigoBarras?: string;
  peso?: string;
  descricao?: string;
  imagem?: string;
  estoque: number;
  promocao: boolean;
  desconto: number;
  rating: number;
  visualizacoes: number;
  vendas_mes?: number;
  vendas_hoje?: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductFormData {
  nome: string;
  categoria: string;
  subcategoria: string;
  preco: string;
  marca: string;
  codigoBarras: string;
  peso: string;
  descricao: string;
  estoque: string;
  promocao: boolean;
  desconto: string;
}

const CATEGORIAS = [
  'bebidas', 'carnes', 'frutas', 'verduras', 'legumes', 
  'padaria', 'laticínios', 'cereais', 'limpeza', 'higiene', 'congelados'
];

const ProductManagerGestor: React.FC = () => {
  const { user } = useAuth();
  const { getMarketId, isGestor } = usePermissions();
  const { showError, showSuccess, showWarning, showInfo } = useToast();
  
  // Estados
  const [products, setProducts] = useState<ProductGestor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductGestor | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  // Form state
  const [formData, setFormData] = useState<ProductFormData>({
    nome: '',
    categoria: '',
    subcategoria: '',
    preco: '',
    marca: '',
    codigoBarras: '',
    peso: '',
    descricao: '',
    estoque: '',
    promocao: false,
    desconto: '0'
  });

  // ✅ VERIFICAR PERMISSÕES
  if (!isGestor()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Acesso Restrito</h3>
          <p className="mt-1 text-sm text-gray-500">Esta funcionalidade é exclusiva para gestores.</p>
        </div>
      </div>
    );
  }

  const marketId = getMarketId();
  if (!marketId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Store className="mx-auto h-12 w-12 text-orange-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Mercado Não Configurado</h3>
          <p className="mt-1 text-sm text-gray-500">Entre em contato com o suporte para configurar seu mercado.</p>
        </div>
      </div>
    );
  }

  // ✅ CARREGAR PRODUTOS DO MERCADO
  useEffect(() => {
    loadProducts();
  }, [marketId]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/products?mercado=${marketId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
      } else {
        console.error('Erro ao carregar produtos');
        setProducts([]);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      setProducts([]);
      showError('Erro ao carregar produtos do seu mercado');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FILTRAR PRODUTOS
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.marca.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // ✅ ESTATÍSTICAS DO MERCADO
  const marketStats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.ativo).length,
    promotionProducts: products.filter(p => p.promocao).length,
    totalViews: products.reduce((sum, p) => sum + p.visualizacoes, 0),
    avgPrice: products.length > 0 ? products.reduce((sum, p) => sum + p.preco, 0) / products.length : 0,
    totalStock: products.reduce((sum, p) => sum + p.estoque, 0)
  };

  // ✅ HANDLERS
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const productData = {
        ...formData,
        mercado_id: marketId, // ✅ SEMPRE USAR O MERCADO DO GESTOR
        preco: parseFloat(formData.preco),
        estoque: parseInt(formData.estoque),
        desconto: parseFloat(formData.desconto)
      };

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const url = editingProduct 
        ? `${API_URL}/products/${editingProduct.id}`
        : `${API_URL}/products`;
      
      const method = editingProduct ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU0MTY4YzYyLWJjNjAtNGZjYi05MDcwLTk2ZWVkOTRiYTllYiIsImVtYWlsIjoiZGVtb0BwcmVjaXZveC5jb20uYnIiLCJyb2xlIjoiZ2VzdG9yIiwibmFtZSI6IkRlbW8gR2VzdG9yIiwiaWF0IjoxNzU0NTQwNDkwLCJleHAiOjE3NTQ2MjY4OTB9.sQC9-Kjv0Ry1JctoXIRPuPtaQ8JGU4UHUYzvKXUsYas'}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        const responseData = await response.json();
        showSuccess(
          (editingProduct ? 'Produto atualizado!' : 'Produto criado!') + 
          (responseData.imageGenerated ? ' (Imagem gerada via IA)' : '')
        );
        setShowModal(false);
        setEditingProduct(null);
        resetForm();
        loadProducts();
      } else {
        throw new Error('Erro ao salvar produto');
      }
    } catch (error) {
      console.error('Erro:', error);
      showError('Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: ProductGestor) => {
    setEditingProduct(product);
    setFormData({
      nome: product.nome,
      categoria: product.categoria,
      subcategoria: product.subcategoria || '',
      preco: product.preco.toString(),
      marca: product.marca,
      codigoBarras: product.codigoBarras || '',
      peso: product.peso || '',
      descricao: product.descricao || '',
      estoque: product.estoque.toString(),
      promocao: product.promocao,
      desconto: product.desconto.toString()
    });
    setShowModal(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU0MTY4YzYyLWJjNjAtNGZjYi05MDcwLTk2ZWVkOTRiYTllYiIsImVtYWlsIjoiZGVtb0BwcmVjaXZveC5jb20uYnIiLCJyb2xlIjoiZ2VzdG9yIiwibmFtZSI6IkRlbW8gR2VzdG9yIiwiaWF0IjoxNzU0NTQwNDkwLCJleHAiOjE3NTQ2MjY4OTB9.sQC9-Kjv0Ry1JctoXIRPuPtaQ8JGU4UHUYzvKXUsYas'}`
        }
      });

      if (response.ok) {
        showSuccess('Produto excluído com sucesso!');
        loadProducts();
      } else {
        throw new Error('Erro ao excluir produto');
      }
    } catch (error) {
      console.error('Erro:', error);
      showError('Erro ao excluir produto');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateImage = async (productId: string, productName: string) => {
    if (!confirm(`Regenerar imagem via IA para "${productName}"?`)) return;
    
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/products/${productId}/generate-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU0MTY4YzYyLWJjNjAtNGZjYi05MDcwLTk2ZWVkOTRiYTllYiIsImVtYWlsIjoiZGVtb0BwcmVjaXZveC5jb20uYnIiLCJyb2xlIjoiZ2VzdG9yIiwibmFtZSI6IkRlbW8gR2VzdG9yIiwiaWF0IjoxNzU0NTQwNDkwLCJleHAiOjE3NTQ2MjY4OTB9.sQC9-Kjv0Ry1JctoXIRPuPtaQ8JGU4UHUYzvKXUsYas'}`
        }
      });

      if (response.ok) {
        showSuccess('Imagem regenerada via IA!');
        loadProducts();
      } else {
        throw new Error('Erro ao regenerar imagem');
      }
    } catch (error) {
      console.error('Erro:', error);
      showError('Erro ao regenerar imagem via IA');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      categoria: '',
      subcategoria: '',
      preco: '',
      marca: '',
      codigoBarras: '',
      peso: '',
      descricao: '',
      estoque: '',
      promocao: false,
      desconto: '0'
    });
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    resetForm();
    setShowModal(true);
  };

  // ✅ UPLOAD DE BASE DE DADOS
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('jsonFile', file); // Nome correto esperado pelo backend
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/products/upload-json/${marketId}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU0MTY4YzYyLWJjNjAtNGZjYi05MDcwLTk2ZWVkOTRiYTllYiIsImVtYWlsIjoiZGVtb0BwcmVjaXZveC5jb20uYnIiLCJyb2xlIjoiZ2VzdG9yIiwibmFtZSI6IkRlbW8gR2VzdG9yIiwiaWF0IjoxNzU0NTQwNDkwLCJleHAiOjE3NTQ2MjY4OTB9.sQC9-Kjv0Ry1JctoXIRPuPtaQ8JGU4UHUYzvKXUsYas'}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        const count = result.data?.products_created || result.imported || 0;
        showSuccess(`Upload concluído! ${count} produtos importados com sucesso`);
        loadProducts(); // Recarregar lista
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erro no upload');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      showError(`Erro ao importar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
      // Limpar input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Store className="mr-3 text-green-600" />
                Meus Produtos
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie os produtos do seu mercado
              </p>
            </div>
            <div className="flex space-x-3">
              <input
                type="file"
                id="fileUpload"
                accept=".json,.csv,.xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <button
                onClick={() => document.getElementById('fileUpload')?.click()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Upload Base
              </button>
              <button
                onClick={() => {
                  const csvData = products.map(p => ({
                    nome: p.nome,
                    categoria: p.categoria,
                    preco: p.preco,
                    mercado: p.mercado,
                    marca: p.marca,
                    estoque: p.estoque
                  }));
                  const csv = 'data:text/csv;charset=utf-8,' + 
                    Object.keys(csvData[0] || {}).join(',') + '\n' +
                    csvData.map(row => Object.values(row).join(',')).join('\n');
                  const link = document.createElement('a');
                  link.href = encodeURI(csv);
                  link.download = `produtos-${new Date().toISOString().split('T')[0]}.csv`;
                  link.click();
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Exportar
              </button>
              <button
                onClick={openCreateModal}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Produto
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Produtos</p>
                <p className="text-2xl font-bold text-gray-900">{marketStats.totalProducts}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{marketStats.activeProducts}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Tag className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Em Promoção</p>
                <p className="text-2xl font-bold text-gray-900">{marketStats.promotionProducts}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Visualizações</p>
                <p className="text-2xl font-bold text-gray-900">{marketStats.totalViews}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">Todas as categorias</option>
              {CATEGORIAS.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Table / Mobile Cards */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-2 text-gray-600">Carregando seus produtos...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {products.length === 0 ? 'Nenhum produto cadastrado' : 'Nenhum produto encontrado'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {products.length === 0 
                  ? 'Comece cadastrando seu primeiro produto'
                  : 'Tente ajustar os filtros de busca'
                }
              </p>
              {products.length === 0 && (
                <div className="mt-6">
                  <button
                    onClick={openCreateModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Cadastrar Primeiro Produto
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto products-table">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Preço
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estoque
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Visualizações
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              {product.imagem ? (
                                <img
                                  className="h-12 w-12 rounded-lg object-cover"
                                  src={product.imagem}
                                  alt={product.nome}
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                  <Package className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.nome}</div>
                              <div className="text-sm text-gray-500">{product.marca}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {product.categoria}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            R$ {product.preco.toFixed(2)}
                            {product.promocao && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                -{product.desconto}%
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.estoque}
                            {product.estoque < 10 && (
                              <span className="ml-2 text-xs text-red-600">⚠️</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.ativo 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.visualizacoes}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleRegenerateImage(product.id, product.nome)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Regenerar imagem via IA"
                            >
                              <Sparkles className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(product)}
                              className="text-green-600 hover:text-green-900"
                              title="Editar produto"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Excluir produto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden products-mobile-cards">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="product-mobile-card">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        {product.imagem ? (
                          <img
                            className="w-12 h-12 rounded-lg object-cover"
                            src={product.imagem}
                            alt={product.nome}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="product-info">
                        <div className="product-name">{product.nome}</div>
                        <div className="product-meta">
                          {product.marca} • {product.categoria}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-semibold text-gray-900">
                              R$ {product.preco.toFixed(2)}
                            </span>
                            {product.promocao && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                -{product.desconto}%
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <span>Estoque: {product.estoque}</span>
                            {product.estoque < 10 && (
                              <span className="text-red-600">⚠️</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            product.ativo 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                          <span className="text-xs text-gray-500">{product.visualizacoes} views</span>
                        </div>
                        <div className="product-actions">
                          <button
                            onClick={() => handleRegenerateImage(product.id, product.nome)}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded hover:bg-purple-100"
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            IA
                          </button>
                          <button
                            onClick={() => handleEdit(product)}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-green-50 rounded hover:bg-green-100"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal igual ao Admin mas com tema verde para Gestor */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 modal-overlay">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto modal-content">
            <div className="flex items-center justify-between p-6 border-b modal-header">
              <h3 className="text-lg font-medium">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 modal-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Ex: Coca Cola 350ml"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marca *
                  </label>
                  <input
                    type="text"
                    name="marca"
                    value={formData.marca}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Ex: Coca-Cola"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Selecione uma categoria</option>
                    {CATEGORIAS.map(cat => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    name="preco"
                    value={formData.preco}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estoque *
                  </label>
                  <input
                    type="number"
                    name="estoque"
                    value={formData.estoque}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Barras
                  </label>
                  <input
                    type="text"
                    name="codigoBarras"
                    value={formData.codigoBarras}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="7894900010001"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Descrição do produto..."
                />
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="promocao"
                    checked={formData.promocao}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Produto em promoção</span>
                </label>

                {formData.promocao && (
                  <div>
                    <input
                      type="number"
                      name="desconto"
                      value={formData.desconto}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="% desconto"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {editingProduct ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagerGestor;