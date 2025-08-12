import React, { useState, useRef } from 'react';
import {
  Store,
  Edit,
  Save,
  Upload,
  Database,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin,
  Phone,
  Mail,
  Building2,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  Clock,
  X,
  Plus,
  Settings,
  BarChart3,
  Trash2
} from 'lucide-react';

interface StoreInfo {
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
    neighborhood: string;
  };
  description: string;
  category: string;
  manager: {
    name: string;
    email: string;
    phone: string;
  };
  stats: {
    totalProducts: number;
    monthlyRevenue: number;
    totalCustomers: number;
    lastSync: string;
  };
  database: {
    hasData: boolean;
    lastUpload: string | null;
    recordsCount: number;
    fileSize: string;
  };
}

const MyStorePage: React.FC = () => {
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data - substituir por dados reais da API
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    id: 'store-001',
    name: 'Supermercado Vila Nova',
    cnpj: '12.345.678/0001-90',
    email: 'contato@vilanova.com.br',
    phone: '(11) 9876-5432',
    address: {
      street: 'Rua das Flores, 123',
      city: 'Franco da Rocha',
      state: 'SP',
      zipCode: '07800-000',
      neighborhood: 'Centro'
    },
    description: 'Supermercado familiar com tradição na região, oferecendo produtos frescos e de qualidade há mais de 20 anos.',
    category: 'Supermercado',
    manager: {
      name: 'João Silva',
      email: 'joao@vilanova.com.br',
      phone: '(11) 9876-5432'
    },
    stats: {
      totalProducts: 2847,
      monthlyRevenue: 125000,
      totalCustomers: 1580,
      lastSync: '2024-01-30T10:30:00Z'
    },
    database: {
      hasData: true,
      lastUpload: '2024-01-30T10:30:00Z',
      recordsCount: 2847,
      fileSize: '12.5 MB'
    }
  });

  const [editData, setEditData] = useState<StoreInfo>(storeInfo);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSave = async () => {
    try {
      // Fazer chamada para API para salvar os dados (gestor só pode editar seu próprio mercado)
      const response = await fetch(`/api/markets/${storeInfo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: editData.name,
          email: editData.email,
          phone: editData.phone,
          address_street: editData.address.street,
          address_city: editData.address.city,
          address_state: editData.address.state,
          address_zip_code: editData.address.zipCode,
          address_neighborhood: editData.address.neighborhood,
          description: editData.description,
          category: editData.category
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar');
      }

      const result = await response.json();
      
      setStoreInfo(editData);
      setEditMode(false);
      alert('Informações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert(`Erro ao salvar as informações: ${error.message}`);
    }
  };

  const handleCancel = () => {
    setEditData(storeInfo);
    setEditMode(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar formato do arquivo - agora aceita mais formatos
    const validFormats = ['.json', '.csv', '.xlsx', '.xls', '.txt'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validFormats.includes(fileExtension)) {
      alert('Formato de arquivo não suportado. Use JSON, CSV, Excel ou TXT');
      return;
    }

    // Validar tamanho do arquivo (100MB para gestor)
    if (file.size > 100 * 1024 * 1024) {
      alert('Arquivo muito grande. Tamanho máximo: 100MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      let produtos = [];

      // Processar diferentes tipos de arquivo
      if (fileExtension === '.json') {
        const text = await file.text();
        try {
          const data = JSON.parse(text);
          // Sistema inteligente para detectar formato
          produtos = data.produtos || data.data || data.items || data.products || (Array.isArray(data) ? data : []);
        } catch (jsonError) {
          throw new Error('Arquivo JSON inválido. Verifique a sintaxe do arquivo.');
        }
      } else if (fileExtension === '.csv' || fileExtension === '.txt') {
        const text = await file.text();
        const lines = text.trim().split('\n');
        
        if (lines.length < 2) {
          throw new Error('Arquivo CSV deve ter pelo menos 2 linhas (cabeçalho + dados)');
        }
        
        // Processar CSV
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        produtos = lines.slice(1).map(line => {
          const values = line.split(',');
          const produto = {};
          headers.forEach((header, index) => {
            const value = values[index]?.trim();
            // Mapear campos comuns
            if (header.includes('nome') || header.includes('name') || header.includes('produto')) {
              produto.nome = value;
            } else if (header.includes('categoria') || header.includes('category')) {
              produto.categoria = value;
            } else if (header.includes('preco') || header.includes('price') || header.includes('valor')) {
              produto.preco = parseFloat(value?.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
            } else if (header.includes('marca') || header.includes('brand')) {
              produto.marca = value;
            } else if (header.includes('codigo') || header.includes('barcode') || header.includes('ean')) {
              produto.codigo_barras = value;
            } else {
              produto[header] = value;
            }
          });
          return produto;
        });
      } else {
        throw new Error(`Formato ${fileExtension} ainda não implementado. Use JSON ou CSV por enquanto.`);
      }

      if (!Array.isArray(produtos) || produtos.length === 0) {
        throw new Error('Nenhum produto encontrado no arquivo');
      }

      console.log(`📋 Preparando upload de ${produtos.length} produtos...`);

      // Simular progresso de upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Fazer upload para API (gestor só pode fazer upload para seu próprio mercado)
      const response = await fetch(`/api/markets/${storeInfo.id}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ produtos })
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro detalhado:', errorData);
        
        let errorMessage = errorData.error || 'Erro no upload';
        if (errorData.details) {
          if (errorData.details.invalid_products) {
            errorMessage += `\n\nProdutos com problemas: ${errorData.details.invalid_count}`;
            errorMessage += `\nSugestão: ${errorData.details.suggestion}`;
          }
          
          if (errorData.details.expected_formats) {
            errorMessage += `\n\nFormatos aceitos: ${errorData.details.expected_formats.join(', ')}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();

      // Atualizar dados da loja com informações mais detalhadas
      const fileSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      setStoreInfo(prev => ({
        ...prev,
        database: {
          hasData: true,
          lastUpload: new Date().toISOString(),
          recordsCount: result.data.processed,
          fileSize
        },
        stats: {
          ...prev.stats,
          totalProducts: result.data.processed,
          lastSync: new Date().toISOString()
        }
      }));
      
      setShowUploadModal(false);
      
      // Mensagem de sucesso mais detalhada
      let message = `✅ Upload concluído com sucesso!\n\n`;
      message += `📊 Estatísticas:\n`;
      message += `• ${result.data.processed} produtos processados\n`;
      if (result.data.skipped > 0) {
        message += `• ${result.data.skipped} produtos ignorados\n`;
      }
      message += `• Taxa de sucesso: ${result.data.summary?.success_rate || 100}%\n`;
      
      if (result.data.invalid_details?.length > 0) {
        message += `\n⚠️ Alguns produtos tinham problemas nos dados mas foram ignorados.`;
      }
      
      alert(message);

    } catch (error) {
      console.error('Erro no upload:', error);
      alert(`❌ Erro no upload:\n\n${error.message}`);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 2500);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#004A7C] flex items-center gap-3">
              <Store className="w-6 h-6 sm:w-8 sm:h-8" />
              Minha Loja
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie as informações e dados do seu mercado
            </p>
          </div>
          <div className="flex items-center gap-3">
            {editMode ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-300 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="bg-[#004A7C] text-white px-4 py-2 rounded-lg hover:bg-[#0066A3] transition-all duration-300 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Produtos</p>
                <p className="text-2xl font-bold text-[#004A7C]">
                  {storeInfo.stats.totalProducts.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Receita Mensal</p>
                <p className="text-2xl font-bold text-[#004A7C]">
                  {formatCurrency(storeInfo.stats.monthlyRevenue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clientes</p>
                <p className="text-2xl font-bold text-[#004A7C]">
                  {storeInfo.stats.totalCustomers.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Última Sync</p>
                <p className="text-sm font-semibold text-[#004A7C]">
                  {formatDate(storeInfo.stats.lastSync)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Store Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-semibold text-[#004A7C] flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Informações da Loja
                </h2>
              </div>
              
              <div className="p-4 sm:p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da Loja
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({...editData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{storeInfo.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CNPJ
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={editData.cnpj}
                        onChange={(e) => setEditData({...editData, cnpj: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{storeInfo.cnpj}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    {editMode ? (
                      <input
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({...editData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        {storeInfo.email}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={editData.phone}
                        onChange={(e) => setEditData({...editData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        {storeInfo.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endereço
                  </label>
                  {editMode ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Rua e número"
                        value={editData.address.street}
                        onChange={(e) => setEditData({
                          ...editData, 
                          address: {...editData.address, street: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder="Cidade"
                          value={editData.address.city}
                          onChange={(e) => setEditData({
                            ...editData, 
                            address: {...editData.address, city: e.target.value}
                          })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                        />
                        <input
                          type="text"
                          placeholder="Estado"
                          value={editData.address.state}
                          onChange={(e) => setEditData({
                            ...editData, 
                            address: {...editData.address, state: e.target.value}
                          })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                        />
                        <input
                          type="text"
                          placeholder="CEP"
                          value={editData.address.zipCode}
                          onChange={(e) => setEditData({
                            ...editData, 
                            address: {...editData.address, zipCode: e.target.value}
                          })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-900 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                      <span>
                        {storeInfo.address.street}<br />
                        {storeInfo.address.city}, {storeInfo.address.state} - {storeInfo.address.zipCode}
                      </span>
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  {editMode ? (
                    <textarea
                      rows={3}
                      value={editData.description}
                      onChange={(e) => setEditData({...editData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A7C] focus:border-transparent"
                      placeholder="Descreva seu mercado..."
                    />
                  ) : (
                    <p className="text-gray-900">{storeInfo.description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Database Management */}
          <div className="space-y-6">
            {/* Database Status */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-[#004A7C] flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Base de Dados
                </h2>
              </div>
              
              <div className="p-4 sm:p-6">
                {storeInfo.database.hasData ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Status</span>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">Ativo</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Produtos</span>
                      <span className="text-sm text-gray-900 font-semibold">
                        {storeInfo.database.recordsCount.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Tamanho</span>
                      <span className="text-sm text-gray-900">{storeInfo.database.fileSize}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Último Upload</span>
                      <span className="text-sm text-gray-900">
                        {formatDate(storeInfo.database.lastUpload!)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <p className="text-sm text-red-600 font-medium">Nenhuma base de dados carregada</p>
                    <p className="text-xs text-gray-500 mt-1">Faça upload do seu arquivo JSON</p>
                  </div>
                )}
                
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="w-full mt-4 bg-[#004A7C] text-white px-4 py-3 rounded-lg hover:bg-[#0066A3] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Atualizar Base de Dados
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-[#004A7C] flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Ações Rápidas
                </h2>
              </div>
              
              <div className="p-4 sm:p-6">
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                    <BarChart3 className="w-5 h-5 text-[#004A7C]" />
                    <div>
                      <p className="font-medium text-gray-900">Relatórios</p>
                      <p className="text-sm text-gray-500">Visualizar analytics</p>
                    </div>
                  </button>
                  
                  <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                    <TrendingUp className="w-5 h-5 text-[#004A7C]" />
                    <div>
                      <p className="font-medium text-gray-900">Tendências</p>
                      <p className="text-sm text-gray-500">Análise de preços</p>
                    </div>
                  </button>
                  
                  <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                    <Users className="w-5 h-5 text-[#004A7C]" />
                    <div>
                      <p className="font-medium text-gray-900">Clientes</p>
                      <p className="text-sm text-gray-500">Gerenciar usuários</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#004A7C]">Upload de Base de Dados</h3>
                  <button
                    onClick={() => {
                      if (!uploading) {
                        setShowUploadModal(false);
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
                    {storeInfo.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-6">
                    {uploading ? 'Processando arquivo...' : 'Faça upload da base de dados em formato JSON'}
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
                    accept=".json,.csv,.xlsx,.xls,.txt"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full bg-[#004A7C] text-white px-6 py-3 rounded-lg hover:bg-[#0066A3] transition-all duration-300 flex items-center justify-center gap-2 mb-4 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-5 h-5" />
                    {uploading ? 'Processando...' : 'Selecionar Arquivo'}
                  </button>
                  
                  <div className="text-xs text-gray-500 space-y-2">
                    <div>
                      <p><strong>Formatos aceitos:</strong> JSON, CSV, Excel, TXT</p>
                      <p><strong>Tamanho máximo:</strong> 100MB</p>
                    </div>
                    
                    <div className="border-t pt-2">
                      <p><strong>Campos obrigatórios:</strong></p>
                      <p>• <code>nome</code> (nome do produto)</p>
                      <p>• <code>categoria</code> (categoria)</p>
                      <p>• <code>preco</code> (preço em número)</p>
                    </div>
                    
                    <div className="border-t pt-2">
                      <p><strong>Campos opcionais:</strong></p>
                      <p>• <code>marca</code>, <code>codigo_barras</code>, <code>estoque</code></p>
                    </div>
                    
                    <div className="bg-gray-100 p-2 rounded text-left mt-2">
                      <p className="font-medium mb-1">Exemplo JSON:</p>
                      <code className="text-xs">
                        {`{
  "produtos": [
    {
      "nome": "Arroz Branco 5kg",
      "categoria": "graos",
      "preco": 12.50,
      "marca": "Tio João",
      "codigo_barras": "123456789"
    }
  ]
}`}
                      </code>
                    </div>
                    
                    <div className="bg-blue-50 p-2 rounded text-left mt-2">
                      <p className="font-medium mb-1 text-blue-800">💡 Dica:</p>
                      <p className="text-blue-700">O sistema é inteligente e aceita variações nos nomes dos campos (nome/name, preco/price, etc.)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyStorePage;