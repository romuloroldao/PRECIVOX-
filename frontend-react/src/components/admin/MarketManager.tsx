import React, { useState, useRef } from 'react';
import {
  Store,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Upload,
  Download,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
  Database,
  X,
  Save,
  Building2,
  Phone,
  Mail,
  Globe,
  Clock,
  TrendingUp,
  Grid3X3,
  List
} from 'lucide-react';
import { useViewMode } from '../../hooks/useViewMode';

interface Market {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  plan: 'basic' | 'premium' | 'enterprise';
  revenue: number;
  users: number;
  productsCount: number;
  lastDataSync: string;
  createdAt: string;
  manager: {
    name: string;
    email: string;
    phone: string;
  };
  dbConfig: {
    hasDatabase: boolean;
    lastUpload: string | null;
    recordsCount: number;
    fileSize: string;
  };
}

const MarketManager: React.FC = () => {
  // Set default view mode to 'list' as requested
  const { viewMode, setViewMode, isList, isGrid } = useViewMode('list');
  
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar mercados do backend
  const loadMarkets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/markets');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.markets) {
          // Mapear dados do backend para formato do frontend
          const mappedMarkets = data.data.markets.map((market: any) => ({
            id: market.id,
            name: market.name,
            cnpj: market.cnpj || '',
            email: market.contact_email || '',
            phone: market.contact_phone || '',
            address: {
              street: market.address_street || '',
              city: market.address_city || '',
              state: market.address_state || '',
              zipCode: market.address_zip_code || ''
            },
            status: market.status,
            plan: 'basic', // Backend não tem plano ainda
            revenue: 0,
            users: 0,
            productsCount: market.total_products || 0,
            lastDataSync: market.updated_at || '',
            createdAt: market.created_at || '',
            manager: {
              name: '',
              email: market.contact_email || '',
              phone: market.contact_phone || ''
            },
            dbConfig: {
              hasDatabase: market.has_database || false,
              lastUpload: market.updated_at || null,
              recordsCount: market.total_products || 0,
              fileSize: '0 MB'
            }
          }));
          setMarkets(mappedMarkets);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar mercados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar mercados ao montar o componente
  React.useEffect(() => {
    loadMarkets();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [editingMarket, setEditingMarket] = useState<Market | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newMarket, setNewMarket] = useState<Partial<Market>>({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    manager: {
      name: '',
      email: '',
      phone: ''
    },
    plan: 'basic',
    status: 'pending'
  });

  const filteredMarkets = markets.filter(market => {
    const matchesSearch = market.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         market.address.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || market.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic':
        return 'bg-blue-100 text-blue-800';
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'enterprise':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCreateMarket = async () => {
    try {
      setLoading(true);
      
      // Validar campos obrigatórios
      if (!newMarket.name || !newMarket.cnpj || !newMarket.manager?.email) {
        alert('Preencha todos os campos obrigatórios');
        return;
      }

      // Preparar dados para API
      const marketData = {
        name: newMarket.name,
        cnpj: newMarket.cnpj,
        email: newMarket.email,
        phone: newMarket.phone,
        address_street: newMarket.address?.street,
        address_city: newMarket.address?.city,
        address_state: newMarket.address?.state,
        address_zip_code: newMarket.address?.zipCode,
        manager: {
          name: newMarket.manager?.name,
          email: newMarket.manager?.email,
          phone: newMarket.manager?.phone
        }
      };

      // Criar mercado via API
      const response = await fetch('/api/markets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(marketData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar mercado');
      }

      const result = await response.json();
      
      // Adicionar novo mercado à lista
      setMarkets([...markets, result.data.market]);
      setShowCreateModal(false);
      
      // Limpar formulário
      setNewMarket({
        name: '',
        cnpj: '',
        email: '',
        phone: '',
        address: { street: '', city: '', state: '', zipCode: '' },
        manager: { name: '', email: '', phone: '' },
        plan: 'basic',
        status: 'pending'
      });

      // Mostrar sucesso
      alert('Mercado criado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao criar mercado:', error);
      alert(`Erro ao criar mercado: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMarket = (market: Market) => {
    setEditingMarket({ ...market });
  };

  const handleSaveEdit = () => {
    if (editingMarket) {
      setMarkets(markets.map(m => m.id === editingMarket.id ? editingMarket : m));
      setEditingMarket(null);
    }
  };

  const handleDeleteMarket = (marketId: string) => {
    if (confirm('Tem certeza que deseja excluir este mercado?')) {
      setMarkets(markets.filter(m => m.id !== marketId));
    }
  };

  const handleStatusChange = (marketId: string, newStatus: Market['status']) => {
    setMarkets(markets.map(m => 
      m.id === marketId ? { ...m, status: newStatus } : m
    ));
  };

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (marketId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar formato do arquivo
    const validFormats = ['.json', '.csv', '.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validFormats.includes(fileExtension)) {
      alert('Formato de arquivo não suportado. Use JSON, CSV ou Excel (.xlsx, .xls)');
      return;
    }

    // Validar tamanho do arquivo (50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('Arquivo muito grande. Tamanho máximo: 50MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      let produtos = [];

      // Processar arquivo baseado no tipo
      if (fileExtension === '.json') {
        const text = await file.text();
        const data = JSON.parse(text);
        produtos = data.produtos || data;
      } else {
        // Para CSV/Excel, mostrar mensagem que será implementado
        alert('Upload de CSV/Excel será implementado em breve. Use JSON por enquanto.');
        setUploading(false);
        return;
      }

      // Validar estrutura dos produtos
      if (!Array.isArray(produtos) || produtos.length === 0) {
        throw new Error('Arquivo deve conter um array de produtos');
      }

      // Verificar campos obrigatórios no primeiro produto
      const requiredFields = ['nome', 'categoria', 'preco'];
      const firstProduct = produtos[0];
      const missingFields = requiredFields.filter(field => !firstProduct[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
      }

      // Simular progresso de upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Fazer upload para API
      const response = await fetch(`/api/markets/${marketId}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Assumindo que o token está no localStorage
        },
        body: JSON.stringify({ produtos })
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro no upload');
      }

      const result = await response.json();

      // Atualizar estado local do mercado
      const fileSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      setMarkets(markets.map(m => 
        m.id === marketId ? {
          ...m,
          dbConfig: {
            hasDatabase: true,
            lastUpload: new Date().toISOString(),
            recordsCount: result.data.processed,
            fileSize
          },
          productsCount: result.data.processed,
          lastDataSync: new Date().toISOString()
        } : m
      ));
      
      setShowUploadModal(false);
      setSelectedMarket(null);
      
      let message = `Upload realizado com sucesso!\n${result.data.processed} produtos processados`;
      if (result.data.skipped > 0) {
        message += `\n${result.data.skipped} produtos com erro`;
      }
      
      alert(message);

    } catch (error) {
      console.error('Erro no upload:', error);
      alert(`Erro no upload: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Render List View
  const renderListView = () => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mercado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plano
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuários
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Receita
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produtos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Banco de Dados
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMarkets.map((market) => (
              <tr key={market.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 bg-[#004A7C] rounded-lg flex items-center justify-center">
                        <Store className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{market.name}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {market.address.city}, {market.address.state}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(market.status)}`}>
                    {market.status === 'active' ? 'Ativo' : 
                     market.status === 'pending' ? 'Pendente' : 
                     market.status === 'suspended' ? 'Suspenso' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanColor(market.plan)}`}>
                    {market.plan.charAt(0).toUpperCase() + market.plan.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {market.users}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(market.revenue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {market.productsCount.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {market.dbConfig.hasDatabase ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <div className="text-xs">
                          <div className="text-gray-900">{market.dbConfig.recordsCount.toLocaleString()} registros</div>
                          <div className="text-gray-500">{market.dbConfig.fileSize}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-500 mr-2" />
                        <span className="text-xs text-red-600">Sem dados</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditMarket(market)}
                      className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-50 transition-all"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedMarket(market);
                        setShowUploadModal(true);
                      }}
                      className="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-green-50 transition-all"
                      title="Upload"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    {market.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange(market.id, 'active')}
                        className="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-green-50 transition-all"
                        title="Aprovar"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {market.status === 'active' && (
                      <button
                        onClick={() => handleStatusChange(market.id, 'suspended')}
                        className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-all"
                        title="Suspender"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteMarket(market.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-all"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render Grid View (existing)
  const renderGridView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {filteredMarkets.map((market) => (
        <div key={market.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Market Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#004A7C] mb-1">
                  {market.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <MapPin className="w-4 h-4" />
                  {market.address.city}, {market.address.state}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(market.status)}`}>
                    {market.status === 'active' ? 'Ativo' : 
                     market.status === 'pending' ? 'Pendente' : 
                     market.status === 'suspended' ? 'Suspenso' : 'Inativo'}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(market.plan)}`}>
                    {market.plan.charAt(0).toUpperCase() + market.plan.slice(1)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditMarket(market)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedMarket(market);
                    setShowUploadModal(true);
                  }}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-300"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteMarket(market.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Market Stats */}
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg mx-auto mb-2">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600">Usuários</p>
                <p className="font-semibold text-[#004A7C]">{market.users}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mx-auto mb-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">Receita</p>
                <p className="font-semibold text-[#004A7C]">{formatCurrency(market.revenue)}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg mx-auto mb-2">
                  <Database className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-sm text-gray-600">Produtos</p>
                <p className="font-semibold text-[#004A7C]">{market.productsCount}</p>
              </div>
            </div>

            {/* Database Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Status do Banco de Dados</span>
                {market.dbConfig.hasDatabase ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
              </div>
              {market.dbConfig.hasDatabase ? (
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Último upload: {formatDate(market.dbConfig.lastUpload || '')}</p>
                  <p>Registros: {market.dbConfig.recordsCount.toLocaleString()}</p>
                  <p>Tamanho: {market.dbConfig.fileSize}</p>
                </div>
              ) : (
                <p className="text-xs text-red-600">Nenhum banco de dados carregado</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 mt-4">
              {market.status === 'pending' && (
                <button
                  onClick={() => handleStatusChange(market.id, 'active')}
                  className="flex-1 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-all duration-300 text-sm flex items-center justify-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aprovar
                </button>
              )}
              {market.status === 'active' && (
                <button
                  onClick={() => handleStatusChange(market.id, 'suspended')}
                  className="flex-1 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-all duration-300 text-sm flex items-center justify-center gap-1"
                >
                  <XCircle className="w-4 h-4" />
                  Suspender
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedMarket(market);
                  setShowUploadModal(true);
                }}
                className="flex-1 bg-[#004A7C] text-white px-3 py-2 rounded-lg hover:bg-[#0066A3] transition-all duration-300 text-sm flex items-center justify-center gap-1"
              >
                <Upload className="w-4 h-4" />
                Upload DB
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-2xl font-bold text-[#004A7C] flex items-center gap-2">
            <Store className="w-5 h-5 sm:w-6 sm:h-6" />
            Gerenciamento de Mercados
          </h2>
        </div>
        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 text-center">
          <div className="w-8 h-8 border-2 border-[#004A7C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando mercados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Mobile Otimizado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-2xl font-bold text-[#004A7C] flex items-center gap-2">
            <Store className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="truncate">Gerenciamento de Mercados</span>
          </h2>
          <p className="text-gray-600 mt-1 text-sm sm:text-base hidden sm:block">
            Cadastre, gerencie e faça upload de dados dos mercados
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all duration-300 ${
                isList 
                  ? 'bg-white text-[#004A7C] shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Visualização em lista"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all duration-300 ${
                isGrid 
                  ? 'bg-white text-[#004A7C] shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Visualização em grade"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#004A7C] text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-[#0066A3] transition-all duration-300 flex items-center gap-2 self-start sm:self-auto whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Mercado</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>
      </div>

      {/* Filters - Mobile Otimizado */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar mercados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativo</option>
              <option value="pending">Pendente</option>
              <option value="suspended">Suspenso</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Markets Display - List or Grid based on view mode */}
      {isList ? renderListView() : renderGridView()}

      {/* Create Market Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#004A7C]">Novo Mercado</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Mercado
                  </label>
                  <input
                    type="text"
                    value={newMarket.name || ''}
                    onChange={(e) => setNewMarket({...newMarket, name: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent ${
                      newMarket.name ? 'border-gray-300' : 'border-red-300 focus:ring-red-500'
                    }`}
                    placeholder="Nome do mercado"
                  />
                  {!newMarket.name && (
                    <p className="text-xs text-red-500 mt-1">Nome é obrigatório</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={newMarket.cnpj || ''}
                    onChange={(e) => setNewMarket({...newMarket, cnpj: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent ${
                      newMarket.cnpj ? 'border-gray-300' : 'border-red-300 focus:ring-red-500'
                    }`}
                    placeholder="00.000.000/0000-00"
                  />
                  {!newMarket.cnpj && (
                    <p className="text-xs text-red-500 mt-1">CNPJ é obrigatório</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newMarket.email || ''}
                    onChange={(e) => setNewMarket({...newMarket, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={newMarket.phone || ''}
                    onChange={(e) => setNewMarket({...newMarket, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={newMarket.address?.street || ''}
                  onChange={(e) => setNewMarket({
                    ...newMarket, 
                    address: {...newMarket.address, street: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={newMarket.address?.city || ''}
                    onChange={(e) => setNewMarket({
                      ...newMarket, 
                      address: {...newMarket.address, city: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <input
                    type="text"
                    value={newMarket.address?.state || ''}
                    onChange={(e) => setNewMarket({
                      ...newMarket, 
                      address: {...newMarket.address, state: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={newMarket.address?.zipCode || ''}
                    onChange={(e) => setNewMarket({
                      ...newMarket, 
                      address: {...newMarket.address, zipCode: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Manager Info */}
              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-4">Responsável</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={newMarket.manager?.name || ''}
                      onChange={(e) => setNewMarket({
                        ...newMarket, 
                        manager: {...newMarket.manager, name: e.target.value}
                      })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent ${
                        newMarket.manager?.name ? 'border-gray-300' : 'border-red-300 focus:ring-red-500'
                      }`}
                      placeholder="Nome do gestor"
                    />
                    {!newMarket.manager?.name && (
                      <p className="text-xs text-red-500 mt-1">Nome é obrigatório</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newMarket.manager?.email || ''}
                      onChange={(e) => setNewMarket({
                        ...newMarket, 
                        manager: {...newMarket.manager, email: e.target.value}
                      })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent ${
                        newMarket.manager?.email ? 'border-gray-300' : 'border-red-300 focus:ring-red-500'
                      }`}
                      placeholder="email@exemplo.com"
                    />
                    {!newMarket.manager?.email && (
                      <p className="text-xs text-red-500 mt-1">Email é obrigatório</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone
                    </label>
                    <input
                      type="text"
                      value={newMarket.manager?.phone || ''}
                      onChange={(e) => setNewMarket({
                        ...newMarket, 
                        manager: {...newMarket.manager, phone: e.target.value}
                      })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent ${
                        newMarket.manager?.phone ? 'border-gray-300' : 'border-red-300 focus:ring-red-500'
                      }`}
                      placeholder="(11) 99999-9999"
                    />
                    {!newMarket.manager?.phone && (
                      <p className="text-xs text-red-500 mt-1">Telefone é obrigatório</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Plan Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plano
                </label>
                <select
                  value={newMarket.plan || 'basic'}
                  onChange={(e) => setNewMarket({...newMarket, plan: e.target.value as Market['plan']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                >
                  <option value="basic">Básico</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateMarket}
                disabled={loading}
                className="bg-[#004A7C] text-white px-6 py-2 rounded-lg hover:bg-[#0066A7] transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Criando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Criar Mercado
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Database Modal */}
      {showUploadModal && selectedMarket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#004A7C]">Upload de Banco de Dados</h3>
                <button
                  onClick={() => {
                    if (!uploading) {
                      setShowUploadModal(false);
                      setSelectedMarket(null);
                    }
                  }}
                  disabled={uploading}
                  className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {uploading ? (
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                  )}
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedMarket.name}
                </h4>
                <p className="text-sm text-gray-600 mb-6">
                  {uploading ? 'Processando arquivo...' : 'Faça upload do banco de dados em formato JSON'}
                </p>
                
                {/* Progress Bar */}
                {uploading && (
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{uploadProgress}% concluído</p>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={(e) => handleFileUpload(selectedMarket.id, e)}
                  disabled={uploading}
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full bg-[#004A7C] text-white px-6 py-3 rounded-lg hover:bg-[#0066A3] transition-all duration-300 flex items-center justify-center gap-2 mb-4 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Upload className="w-5 h-5" />
                  {uploading ? 'Processando...' : 'Selecionar Arquivo JSON'}
                </button>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <p><strong>Formato aceito:</strong> JSON</p>
                  <p><strong>Tamanho máximo:</strong> 50MB</p>
                  <p><strong>Estrutura requerida:</strong></p>
                  <div className="bg-gray-100 p-2 rounded text-left mt-2">
                    <code className="text-xs">
                      {`{
  "produtos": [
    {
      "nome": "Produto",
      "categoria": "categoria",
      "preco": 10.50,
      "marca": "Marca",
      "codigo_barras": "123"
    }
  ]
}`}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Market Modal */}
      {editingMarket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#004A7C]">Editar Mercado</h3>
                <button
                  onClick={() => setEditingMarket(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Mercado
                  </label>
                  <input
                    type="text"
                    value={editingMarket.name}
                    onChange={(e) => setEditingMarket({...editingMarket, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editingMarket.status}
                    onChange={(e) => setEditingMarket({...editingMarket, status: e.target.value as Market['status']})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                  >
                    <option value="active">Ativo</option>
                    <option value="pending">Pendente</option>
                    <option value="suspended">Suspenso</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingMarket.email}
                    onChange={(e) => setEditingMarket({...editingMarket, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plano
                  </label>
                  <select
                    value={editingMarket.plan}
                    onChange={(e) => setEditingMarket({...editingMarket, plan: e.target.value as Market['plan']})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                  >
                    <option value="basic">Básico</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditingMarket(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="bg-[#004A7C] text-white px-6 py-2 rounded-lg hover:bg-[#0066A3] transition-all duration-300 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketManager;