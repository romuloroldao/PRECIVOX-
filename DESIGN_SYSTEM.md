# Design System PRECIVOX

## 📦 Componentes Criados

### Componentes Base (`components/ui/`)

1. **Button** (`Button.tsx`)
   - Variantes: `primary`, `secondary`, `success`, `warning`, `error`, `outline`, `gradient`, `ghost`
   - Tamanhos: `sm`, `md`, `lg`
   - Suporte a ícones e loading state

2. **Card** (`Card.tsx`)
   - Variantes: `default`, `elevated`, `outlined`
   - Componentes: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
   - Suporte a hover effect

3. **Input** (`Input.tsx`)
   - Suporte a label, error, helperText
   - Ícones posicionados (left/right)
   - Validação visual

4. **Select** (`Select.tsx`)
   - Mesmas propriedades do Input
   - Lista de opções padronizada

5. **Modal** (`Modal.tsx`)
   - Tamanhos: `sm`, `md`, `lg`, `xl`, `full`
   - Overlay com backdrop blur
   - Suporte a footer customizado

6. **Drawer** (`Drawer.tsx`)
   - Posições: `left`, `right`, `bottom`, `responsive`
   - Responsivo: mobile = bottom, desktop = right
   - Tamanhos: `sm`, `md`, `lg`

7. **LayoutPage** (`LayoutPage.tsx`)
   - Layout padronizado para todas as páginas
   - Suporte a título, descrição e ações no header
   - Espaçamento consistente

## 🎨 Cores

### Primárias
- Primary: `#2563EB` (azul)
- Secondary: `#9333EA` (roxo / IA)

### Semânticas
- Success: `#16A34A`
- Warning: `#F59E0B`
- Error: `#DC2626`

### Textos
- Primary: `#1E293B` (títulos)
- Secondary: `#475569` (descrições)
- Tertiary: `#64748B`

### Fundos
- Default: `#F8FAFC`
- Paper: `#FFFFFF`
- Hover: `#F1F5F9`

## 📐 Espaçamento

Base de 8px:
- `gap-2` = 8px
- `gap-4` = 16px
- `p-4` = 16px
- `p-8` = 32px

## 🔤 Tipografia

- Fonte: `Inter`, sans-serif
- H1: `text-2xl md:text-3xl font-bold`
- Subtítulo: `text-lg font-medium`
- Texto base: `text-sm md:text-base font-normal`

## ✅ Componentes Atualizados

1. ✅ `ListaLateral.tsx` - Usa Drawer responsivo
2. ✅ `ProductCard.tsx` - Usa Card e Button do design system
3. ✅ `UploadDatabase.tsx` - Usa Card, Button, Input, Select

## 📚 Style Guide

A página `/styleguide` está disponível para visualização completa de todos os componentes:

- Acesse: `/styleguide` ou `/app/styleguide`
- Documentação visual interativa
- Exemplos de código para cada componente
- Design tokens centralizados
- Demonstração de responsividade

### Componentes do Styleguide

- `CodeBlock` - Exibição de código com botão de copiar
- `Section` - Wrapper padronizado para seções
- `app/styleguide/page.tsx` - Página principal do styleguide
- `lib/design-tokens.ts` - Tokens centralizados do design system

## 📝 Próximos Passos

### Páginas para Atualizar:

1. **Área do Cliente**
   - [ ] `/cliente/busca` - Aplicar LayoutPage, Input, Button
   - [ ] `/cliente/listas` - Aplicar LayoutPage, Card
   - [ ] `/cliente/ia` - Aplicar LayoutPage, Button gradient
   - [ ] `/cliente/comparar` - Aplicar LayoutPage, Card

2. **Área Administrativa**
   - [ ] `/admin/*` - Aplicar LayoutPage em todas as páginas
   - [ ] Atualizar `Header.tsx` - Usar Button e cores do design system
   - [ ] Atualizar `DashboardLayout.tsx` - Aplicar espaçamentos

3. **Componentes**
   - [ ] `NavegacaoCliente.tsx` - Usar Button do design system
   - [ ] `ProductList.tsx` - Usar Card
   - [ ] `ComparacaoProdutos.tsx` - Usar Card e Button

## 🚀 Como Usar

```tsx
import { Button, Card, Input, LayoutPage } from '@/components/ui';

// Em uma página
export default function MinhaPage() {
  return (
    <LayoutPage
      title="Título da Página"
      description="Descrição"
      headerActions={
        <Button variant="primary">Ação</Button>
      }
    >
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Título do Card</CardTitle>
        </CardHeader>
        <CardContent>
          Conteúdo...
        </CardContent>
      </Card>
    </LayoutPage>
  );
}
```

## 📱 Responsividade

Todos os componentes seguem o padrão:
- Mobile-first
- Breakpoints do Tailwind: `sm:`, `md:`, `lg:`
- Espaçamentos adaptativos: `p-4 md:p-6`
- Tipografia responsiva: `text-sm md:text-base`
