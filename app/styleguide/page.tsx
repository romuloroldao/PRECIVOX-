'use client';

import { useState } from 'react';
import { LayoutPage, Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Input, Select, Modal, Drawer } from '@/components/ui';
import { Section } from '@/components/styleguide';
import { Search, Filter, ShoppingCart, User, Store, Plus, Minus, X, Check, AlertCircle, Info } from 'lucide-react';
import { colors, spacing, radii, shadows, typography } from '@/lib/design-tokens';

export default function StyleguidePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');

  return (
    <LayoutPage
      title="Style Guide - PRECIVOX"
      description="Documentação visual completa dos componentes e padrões de design do sistema"
    >
      {/* Design Tokens */}
      <Section title="🎨 Design Tokens" description="Cores, espaçamentos e tokens de design centralizados">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Cores */}
          <Card variant="default">
            <CardHeader>
              <CardTitle className="text-lg">Cores Primárias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary-600 shadow-md"></div>
                <div>
                  <p className="font-medium text-sm">Primary</p>
                  <p className="text-xs text-text-secondary">{colors.primary}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-secondary-600 shadow-md"></div>
                <div>
                  <p className="font-medium text-sm">Secondary</p>
                  <p className="text-xs text-text-secondary">{colors.secondary}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="default">
            <CardHeader>
              <CardTitle className="text-lg">Cores Semânticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-success-600 shadow-md"></div>
                <div>
                  <p className="font-medium text-sm">Success</p>
                  <p className="text-xs text-text-secondary">{colors.success}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-warning-600 shadow-md"></div>
                <div>
                  <p className="font-medium text-sm">Warning</p>
                  <p className="text-xs text-text-secondary">{colors.warning}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-error-600 shadow-md"></div>
                <div>
                  <p className="font-medium text-sm">Error</p>
                  <p className="text-xs text-text-secondary">{colors.error}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="default">
            <CardHeader>
              <CardTitle className="text-lg">Espaçamentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(spacing).slice(1, 7).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="bg-primary-100 rounded" style={{ width: value, height: '20px' }}></div>
                  <div>
                    <p className="font-medium text-sm">{key} ({value})</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Botões */}
      <Section
        title="🧰 Botões"
        description="Variantes e estados dos botões do sistema"
        code={`<Button variant="primary">Primário</Button>
<Button variant="secondary">Secundário</Button>
<Button variant="success">Sucesso</Button>
<Button variant="error">Erro</Button>
<Button variant="outline">Outline</Button>
<Button variant="gradient">IA</Button>`}
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Variantes</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primário</Button>
              <Button variant="secondary">Secundário</Button>
              <Button variant="success">Sucesso</Button>
              <Button variant="warning">Aviso</Button>
              <Button variant="error">Erro</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="gradient">IA</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Tamanhos</h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" size="sm">Pequeno</Button>
              <Button variant="primary" size="md">Médio</Button>
              <Button variant="primary" size="lg">Grande</Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Com Ícones</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" icon={Plus}>Adicionar</Button>
              <Button variant="success" icon={Check} iconPosition="right">Confirmar</Button>
              <Button variant="outline" icon={Search}>Buscar</Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Estados</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Normal</Button>
              <Button variant="primary" disabled>Desabilitado</Button>
              <Button variant="primary" isLoading>Carregando...</Button>
            </div>
          </div>
        </div>
      </Section>

      {/* Inputs */}
      <Section
        title="📝 Inputs e Selects"
        description="Campos de formulário com validação e estados"
        code={`<Input
  label="Nome"
  placeholder="Digite seu nome"
  icon={User}
/>
<Input
  label="Email"
  type="email"
  error="Email inválido"
/>`}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Campo de texto"
              placeholder="Digite algo..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Input
              label="Com ícone"
              placeholder="Buscar..."
              icon={Search}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Com erro"
              placeholder="Campo com erro"
              error="Este campo é obrigatório"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Input
              label="Desabilitado"
              placeholder="Campo desabilitado"
              disabled
              value=""
            />
          </div>

          <div>
            <Select
              label="Select"
              placeholder="Selecione uma opção"
              value={selectValue}
              onChange={(e) => setSelectValue(e.target.value)}
              options={[
                { value: '1', label: 'Opção 1' },
                { value: '2', label: 'Opção 2' },
                { value: '3', label: 'Opção 3' },
              ]}
            />
          </div>

          <div>
            <Input
              label="Busca avançada"
              placeholder="Buscar produtos..."
              icon={Search}
              helperText="Digite o nome do produto ou código de barras"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>
        </div>
      </Section>

      {/* Cards */}
      <Section
        title="🃏 Cards"
        description="Cartões para exibir conteúdo e produtos"
        code={`<Card variant="elevated" hover>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição</CardDescription>
  </CardHeader>
  <CardContent>Conteúdo...</CardContent>
</Card>`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card de Produto */}
          <Card variant="elevated" hover className="overflow-hidden">
            <div className="h-48 bg-gray-100 flex items-center justify-center">
              <span className="text-4xl">📦</span>
            </div>
            <CardHeader>
              <CardTitle className="text-base">Produto Exemplo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary-600 mb-2">R$ 29,90</p>
              <p className="text-sm text-text-secondary">Supermercado Central</p>
            </CardContent>
            <CardFooter>
              <Button variant="primary" size="sm" icon={ShoppingCart} className="w-full">
                Adicionar
              </Button>
            </CardFooter>
          </Card>

          {/* Card de Usuário */}
          <Card variant="default">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <CardTitle className="text-base">João Silva</CardTitle>
                  <CardDescription>Cliente</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-secondary">joao@example.com</p>
            </CardContent>
          </Card>

          {/* Card de Mercado */}
          <Card variant="outlined">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-success-100 flex items-center justify-center">
                  <Store className="w-6 h-6 text-success-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Supermercado Central</CardTitle>
                  <CardDescription>São Paulo, SP</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-secondary">5 unidades disponíveis</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Variantes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-base">Default</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">Borda padrão</p>
              </CardContent>
            </Card>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-base">Elevated</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">Com sombra</p>
              </CardContent>
            </Card>
            <Card variant="outlined">
              <CardHeader>
                <CardTitle className="text-base">Outlined</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">Borda destacada</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Section>

      {/* Modais e Drawers */}
      <Section
        title="🎭 Modais e Drawers"
        description="Diálogos e painéis laterais responsivos"
      >
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            Abrir Modal
          </Button>
          <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
            Abrir Drawer
          </Button>
        </div>

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Modal de Exemplo"
          description="Este é um exemplo de modal do sistema PRECIVOX"
          size="md"
          footer={
            <>
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={() => setModalOpen(false)}>
                Confirmar
              </Button>
            </>
          }
        >
          <p className="text-text-secondary">
            Este modal demonstra como os diálogos do sistema funcionam.
            No mobile, ele se adapta automaticamente ao tamanho da tela.
          </p>
        </Modal>

        <Drawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Drawer de Exemplo"
          position="responsive"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-text-secondary">
              Este drawer é responsivo: no mobile aparece como bottom sheet,
              no desktop como painel lateral.
            </p>
            <Card variant="default">
              <CardContent>
                <p className="text-sm">Item 1</p>
              </CardContent>
            </Card>
            <Card variant="default">
              <CardContent>
                <p className="text-sm">Item 2</p>
              </CardContent>
            </Card>
          </div>
        </Drawer>
      </Section>

      {/* Alertas e Mensagens */}
      <Section
        title="🔔 Alertas e Mensagens"
        description="Feedback visual para o usuário"
      >
        <div className="space-y-4">
          <div className="bg-success-50 border border-success-200 text-success-800 px-4 py-3 rounded-lg">
            <div className="flex items-start">
              <Check className="w-5 h-5 text-success-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium">Sucesso!</p>
                <p className="text-sm">Operação realizada com sucesso.</p>
              </div>
            </div>
          </div>

          <div className="bg-error-50 border border-error-200 text-error-800 px-4 py-3 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-error-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium">Erro!</p>
                <p className="text-sm">Ocorreu um erro ao processar sua solicitação.</p>
              </div>
            </div>
          </div>

          <div className="bg-warning-50 border border-warning-200 text-warning-800 px-4 py-3 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-warning-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium">Atenção!</p>
                <p className="text-sm">Verifique os dados antes de continuar.</p>
              </div>
            </div>
          </div>

          <div className="bg-primary-50 border border-primary-200 text-primary-800 px-4 py-3 rounded-lg">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-primary-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium">Informação</p>
                <p className="text-sm">Esta é uma mensagem informativa.</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Grid e Layout */}
      <Section
        title="📐 Grid e Layout"
        description="Sistema de grid responsivo baseado em múltiplos de 8px"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Grid Responsivo</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="bg-primary-100 rounded-lg p-4 text-center text-sm font-medium text-primary-700"
                >
                  Coluna {i}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Espaçamentos (gap-4 = 16px)</h3>
            <div className="flex flex-wrap gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-secondary-100 rounded-lg p-4 text-sm font-medium text-secondary-700"
                >
                  Item {i}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Padding (p-4 = 16px, p-6 = 24px, p-8 = 32px)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-sm font-medium">p-4 (16px)</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-6">
                <p className="text-sm font-medium">p-6 (24px)</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-8">
                <p className="text-sm font-medium">p-8 (32px)</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Tipografia */}
      <Section
        title="📖 Tipografia"
        description="Hierarquia de textos e estilos"
      >
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">H1 - Título Principal</h1>
            <p className="text-sm text-text-secondary">text-3xl font-bold (30px, bold)</p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">H2 - Subtítulo</h2>
            <p className="text-sm text-text-secondary">text-2xl font-bold (24px, bold)</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">H3 - Seção</h3>
            <p className="text-sm text-text-secondary">text-xl font-semibold (20px, semibold)</p>
          </div>
          <div>
            <p className="text-base text-text-primary mb-2">Parágrafo Normal</p>
            <p className="text-sm text-text-secondary">text-base (16px, normal)</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary mb-2">Texto Secundário</p>
            <p className="text-xs text-text-secondary">text-sm (14px, normal, cor secundária)</p>
          </div>
          <div>
            <p className="text-xs text-text-tertiary mb-2">Texto Terciário</p>
            <p className="text-xs text-text-secondary">text-xs (12px, normal, cor terciária)</p>
          </div>
        </div>
      </Section>

      {/* Exemplos de Uso */}
      <Section
        title="💡 Exemplos de Uso"
        description="Combinações práticas de componentes"
      >
        <div className="space-y-6">
          {/* Barra de Busca */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Barra de Busca com Filtros</h3>
            <Card variant="default">
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="Buscar produtos..."
                      icon={Search}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" icon={Filter}>
                    Filtros
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" size="sm">Minha Lista (0)</Button>
                  <Button variant="success" size="sm">Comparar (0)</Button>
                  <Button variant="gradient" size="sm" icon={Info}>IA</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Ações */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Card de Ações</h3>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>Atalhos para funcionalidades principais</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button variant="primary" icon={ShoppingCart} className="w-full justify-start">
                    Minha Lista
                  </Button>
                  <Button variant="secondary" icon={Store} className="w-full justify-start">
                    Mercados
                  </Button>
                  <Button variant="success" icon={Check} className="w-full justify-start">
                    Comparar
                  </Button>
                  <Button variant="gradient" icon={Info} className="w-full justify-start">
                    Assistente IA
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Section>

      {/* Responsividade */}
      <Section
        title="📱 Responsividade"
        description="Breakpoints e adaptação para diferentes tamanhos de tela"
      >
        <div className="space-y-6">
          <Card variant="default">
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="bg-primary-100 rounded-lg p-4 text-center">
                  <p className="font-semibold text-sm">Mobile</p>
                  <p className="text-xs text-text-secondary mt-1">1 coluna</p>
                </div>
                <div className="bg-secondary-100 rounded-lg p-4 text-center">
                  <p className="font-semibold text-sm">Tablet</p>
                  <p className="text-xs text-text-secondary mt-1">2 colunas</p>
                </div>
                <div className="bg-success-100 rounded-lg p-4 text-center">
                  <p className="font-semibold text-sm">Desktop</p>
                  <p className="text-xs text-text-secondary mt-1">3 colunas</p>
                </div>
                <div className="bg-warning-100 rounded-lg p-4 text-center">
                  <p className="font-semibold text-sm">Large</p>
                  <p className="text-xs text-text-secondary mt-1">4 colunas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Breakpoints</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-4">
                <code className="bg-gray-100 px-2 py-1 rounded">sm:</code>
                <span className="text-text-secondary">640px+</span>
              </div>
              <div className="flex items-center gap-4">
                <code className="bg-gray-100 px-2 py-1 rounded">md:</code>
                <span className="text-text-secondary">768px+</span>
              </div>
              <div className="flex items-center gap-4">
                <code className="bg-gray-100 px-2 py-1 rounded">lg:</code>
                <span className="text-text-secondary">1024px+</span>
              </div>
              <div className="flex items-center gap-4">
                <code className="bg-gray-100 px-2 py-1 rounded">xl:</code>
                <span className="text-text-secondary">1280px+</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Footer da página */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <p className="text-center text-sm text-text-secondary">
          Style Guide PRECIVOX • Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>
    </LayoutPage>
  );
}
