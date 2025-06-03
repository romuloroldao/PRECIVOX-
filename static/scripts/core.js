/**
 * Precinho Frontend - JavaScript Avançado
 * ETAPA 5: Lista de Compras com funcionalidades completas
 */

class PrecinhoApp {
    constructor() {
        this.API_BASE_URL = '/api';
        this.products = [];
        this.shoppingList = this.loadShoppingList();
        this.searchTimeout = null;
        this.messageTimeout = null;
        
        this.init();
    }

    async init() {
        this.cacheElements();
        this.setupEventListeners();
        this.setupModals();
        await this.loadProducts();
        this.renderShoppingList();
        this.updateCounters();
        this.showMessage('✅ Sistema carregado com sucesso!', 'success', 3000);
    }

    cacheElements() {
        this.elements = {
            searchInput: document.getElementById('searchInput'),
            searchButton: document.getElementById('searchButton'),
            productCardsContainer: document.getElementById('productCardsContainer'),
            productCount: document.getElementById('productCount'),
            itemCount: document.getElementById('itemCount'),
            messageContainer: document.getElementById('messageContainer'),
            emptyListMessage: document.getElementById('emptyListMessage'),
            shoppingListItems: document.getElementById('shoppingListItems'),
            clearListBtn: document.getElementById('clearListBtn'),
            exportPdfBtn: document.getElementById('exportPdfBtn'),
            savingsAnalysisBtn: document.getElementById('savingsAnalysisBtn'),
            filterAssai: document.getElementById('filterAssai'),
            filterCarrefour: document.getElementById('filterCarrefour'),
            filterPao: document.getElementById('filterPao')
        };
    }

    setupEventListeners() {
        this.elements.searchButton?.addEventListener('click', () => this.performSearch());
        this.elements.searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });

        // Busca em tempo real
        this.elements.searchInput?.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            const query = e.target.value.trim();
            
            this.searchTimeout = setTimeout(() => {
                if (query.length >= 2 || query.length === 0) {
                    this.performSearch();
                }
            }, 500);
        });

        [this.elements.filterAssai, this.elements.filterCarrefour, this.elements.filterPao]
            .forEach(filter => {
                filter?.addEventListener('change', () => this.renderProducts());
            });

        this.elements.clearListBtn?.addEventListener('click', () => this.clearShoppingList());
        this.elements.exportPdfBtn?.addEventListener('click', () => this.exportToPDF());
        this.elements.savingsAnalysisBtn?.addEventListener('click', () => this.showSavingsAnalysis());
    }

    setupModals() {
        // Criar modal de edição dinamicamente
        const modalHTML = `
            <div class="modal fade" id="editItemModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header" style="padding: var(--unit-3); border-bottom: 1px solid var(--border-color);">
                            <h5 class="modal-title">
                                <i class="bi bi-pencil-square" style="margin-right: var(--unit);"></i>
                                Editar Item
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body" style="padding: var(--unit-3);">
                            <div style="margin-bottom: var(--unit-3);">
                                <label for="editQuantity" class="form-label">Quantidade</label>
                                <input type="number" class="form-control" id="editQuantity" 
                                       min="0.1" step="0.1" required 
                                       style="padding: var(--unit-2); border: 1px solid var(--border-color); border-radius: var(--border-radius);">
                            </div>
                            <div style="margin-bottom: var(--unit-3);">
                                <label for="editUnit" class="form-label">Unidade de Medida</label>
                                <select class="form-select" id="editUnit" required 
                                        style="padding: var(--unit-2); border: 1px solid var(--border-color); border-radius: var(--border-radius);">
                                    <option value="un">Unidade (un)</option>
                                    <option value="kg">Quilo (kg)</option>
                                    <option value="g">Grama (g)</option>
                                    <option value="L">Litro (L)</option>
                                    <option value="ml">Mililitro (ml)</option>
                                    <option value="cx">Caixa (cx)</option>
                                    <option value="pct">Pacote (pct)</option>
                                </select>
                            </div>
                            <input type="hidden" id="editItemId">
                        </div>
                        <div class="modal-footer" style="padding: var(--unit-3); border-top: 1px solid var(--border-color);">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="bi bi-x-lg"></i> Cancelar
                            </button>
                            <button type="button" id="saveItemBtn" class="btn btn-primary">
                                <i class="bi bi-check-lg"></i> Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Event listener para salvar item
        document.getElementById('saveItemBtn')?.addEventListener('click', () => this.saveItemEdit());
    }

    async apiRequest(endpoint) {
        try {
            const response = await fetch(`${this.API_BASE_URL}${endpoint}`);
            const result = await response.json();
            return result.success ? result.data : result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async loadProducts(search = '') {
        try {
            const endpoint = search ? `/products?search=${encodeURIComponent(search)}` : '/products';
            this.products = await this.apiRequest(endpoint);
            this.renderProducts();
            this.updateProductCount();
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            this.showMessage('❌ Erro ao carregar produtos', 'error');
        }
    }

    renderProducts() {
        if (!this.elements.productCardsContainer) return;

        const activeMarkets = this.getActiveMarkets();
        const filteredProducts = this.products.filter(product => {
            return Object.keys(product.markets).some(market => activeMarkets.includes(market));
        });

        if (filteredProducts.length === 0) {
            this.elements.productCardsContainer.innerHTML = this.getEmptyProductsHTML();
            return;
        }

        this.elements.productCardsContainer.innerHTML = filteredProducts
            .map(product => this.createProductCardHTML(product, activeMarkets))
            .join('');
    }

    getEmptyProductsHTML() {
        const query = this.elements.searchInput?.value.trim() || '';
        return `
            <div style="grid-column: 1 / -1; text-align: center; padding: var(--unit-8);">
                <i class="bi bi-search" style="font-size: 4rem; color: var(--text-muted);"></i>
                <h3 style="color: var(--text-secondary); margin: var(--unit-3) 0;">Nenhum produto encontrado</h3>
                <p style="color: var(--text-muted); margin-bottom: var(--unit-3);">
                    ${query ? `Não encontramos produtos para "${query}"` : 'Tente ajustar os filtros ou termos de busca'}
                </p>
                <button class="btn-primary-custom btn-custom" onclick="app.clearSearch()">
                    <i class="bi bi-arrow-clockwise"></i>
                    ${query ? 'Limpar busca' : 'Recarregar produtos'}
                </button>
            </div>
        `;
    }

    createProductCardHTML(product, activeMarkets) {
        const availableMarkets = Object.entries(product.markets)
            .filter(([market]) => activeMarkets.includes(market));

        if (availableMarkets.length === 0) return '';

        const prices = availableMarkets.map(([, data]) => data.price);
        const bestPrice = Math.min(...prices);
        const worstPrice = Math.max(...prices);
        const bestMarket = availableMarkets.find(([, data]) => data.price === bestPrice);
        const savings = worstPrice - bestPrice;

        return `
            <div class="product-card">
                <div class="product-card-header">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-category">
                        <i class="bi bi-tag"></i> ${product.category}
                    </div>
                    ${product.brand ? `<div style="font-size: 0.875rem; color: var(--text-muted); margin-top: var(--unit);">
                        <i class="bi bi-award"></i> ${product.brand}
                    </div>` : ''}
                </div>
                
                <div class="product-card-body">
                    <div class="best-price-section">
                        <div class="best-price-label">💰 Melhor preço</div>
                        <div class="best-price-value">R$ ${bestPrice.toFixed(2)}</div>
                        <div class="best-price-market">
                            ${this.getMarketIcon(bestMarket[0])} ${bestMarket[0]} - ${bestMarket[1].unit}
                        </div>
                    </div>
                    
                    <div class="price-comparison">
                        ${availableMarkets.map(([market, data]) => `
                            <div class="price-item ${data.price === bestPrice ? 'best-price' : ''}">
                                <div class="market-name">
                                    ${this.getMarketIcon(market)} ${market}
                                </div>
                                <div class="market-price ${data.price === bestPrice ? 'best' : ''}">
                                    R$ ${data.price.toFixed(2)}/${data.unit}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    ${savings > 0 ? `
                        <div style="background: rgba(16, 185, 129, 0.1); color: #166534; padding: var(--unit-2); border-radius: var(--border-radius); margin: var(--unit-2) 0; font-size: 0.875rem; text-align: center;">
                            <i class="bi bi-piggy-bank"></i> Economize R$ ${savings.toFixed(2)} escolhendo o melhor preço!
                        </div>
                    ` : ''}
                    
                    <div style="display: flex; gap: var(--unit); margin-top: auto;">
                        <button class="btn-primary-custom btn-custom" 
                                style="flex: 1;"
                                onclick="app.addToShoppingList(${product.id}, '${bestMarket[0]}')">
                            <i class="bi bi-cart-plus"></i>
                            Adicionar
                        </button>
                        ${availableMarkets.length > 1 ? `
                            <button class="btn-secondary-custom btn-custom" 
                                    onclick="app.showPriceComparison(${product.id})" 
                                    title="Ver comparação detalhada"
                                    style="padding: var(--unit-2);">
                                <i class="bi bi-graph-up"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    getMarketIcon(market) {
        const icons = {
            "Assaí Atacadista": '<i class="bi bi-shop" style="color: var(--primary-color);"></i>',
            "Carrefour": '<i class="bi bi-basket" style="color: var(--info-color);"></i>',
            "Pão de Açucar": '<i class="bi bi-building" style="color: var(--warning-color);"></i>'
        };
        return icons[market] || '<i class="bi bi-shop"></i>';
    }

    getActiveMarkets() {
        const markets = [];
        if (this.elements.filterAssai?.checked) markets.push('Assaí Atacadista');
        if (this.elements.filterCarrefour?.checked) markets.push('Carrefour');
        if (this.elements.filterPao?.checked) markets.push('Pão de Açucar');
        return markets;
    }

    addToShoppingList(productId, market) {
        const product = this.products.find(p => p.id === productId);
        if (!product || !product.markets[market]) {
            this.showMessage('❌ Produto não encontrado', 'error');
            return;
        }

        const existingItem = this.shoppingList.find(item => 
            item.productId === productId && item.market === market
        );

        if (existingItem) {
            existingItem.quantity += 1;
            this.showMessage('✅ Quantidade atualizada!', 'success', 2000);
        } else {
            const marketData = product.markets[market];
            const item = {
                id: Date.now() + Math.random(),
                productId: productId,
                name: product.name,
                market: market,
                price: marketData.price,
                unit: marketData.unit,
                quantity: 1,
                addedAt: new Date().toISOString()
            };

            this.shoppingList.push(item);
            this.showMessage('✅ Produto adicionado à lista!', 'success', 2000);
        }

        this.saveShoppingList();
        this.renderShoppingList();
        this.updateCounters();
    }

    renderShoppingList() {
        const hasItems = this.shoppingList.length > 0;
        
        if (hasItems) {
            this.elements.emptyListMessage.style.display = 'none';
            this.elements.shoppingListItems.style.display = 'block';
            this.renderShoppingListItems();
        } else {
            this.elements.emptyListMessage.style.display = 'block';
            this.elements.shoppingListItems.style.display = 'none';
        }

        this.updateCounters();
    }

    renderShoppingListItems() {
        const total = this.shoppingList.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const totalItems = this.shoppingList.reduce((sum, item) => sum + item.quantity, 0);
        
        // Agrupar por mercado para otimizar compras
        const itemsByMarket = this.groupItemsByMarket();
        
        let itemsHTML = '';
        
        Object.entries(itemsByMarket).forEach(([market, items]) => {
            const marketTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            itemsHTML += `
                <div style="background: var(--bg-secondary); padding: var(--unit-2); margin: var(--unit-2) 0; border-radius: var(--border-radius); border-left: 4px solid var(--primary-color);">
                    <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 600; margin-bottom: var(--unit);">
                        <span>${this.getMarketIcon(market)} ${market}</span>
                        <span style="color: var(--primary-color);">R$ ${marketTotal.toFixed(2)}</span>
                    </div>
                    ${items.map(item => `
                        <div style="padding: var(--unit-2); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: white; margin: var(--unit) 0; border-radius: var(--border-radius);">
                            <div>
                                <div style="font-weight: 600; margin-bottom: var(--unit);">${item.name}</div>
                                <div style="font-size: 0.875rem; color: var(--text-secondary);">
                                    R$ ${item.price.toFixed(2)}/${item.unit} • ${item.quantity} ${item.unit}
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: 700; color: var(--primary-color); margin-bottom: var(--unit);">
                                    R$ ${(item.price * item.quantity).toFixed(2)}
                                </div>
                                <div style="display: flex; gap: var(--unit);">
                                    <button onclick="app.editItem(${item.id})" 
                                            style="background: var(--warning-color); color: white; border: none; padding: var(--unit); border-radius: var(--border-radius); cursor: pointer;"
                                            title="Editar item">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button onclick="app.removeFromShoppingList(${item.id})" 
                                            style="background: var(--danger-color); color: white; border: none; padding: var(--unit); border-radius: var(--border-radius); cursor: pointer;"
                                            title="Remover item">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        });

        const totalHTML = `
            <div style="padding: var(--unit-3); background: linear-gradient(135deg, var(--primary-color), var(--primary-light)); color: white; font-weight: 700; display: flex; justify-content: space-between; align-items: center; border-radius: var(--border-radius); margin-top: var(--unit-3);">
                <div>
                    <div>Total da Lista:</div>
                    <div style="font-size: 0.875rem; opacity: 0.9;">${totalItems} ${totalItems === 1 ? 'item' : 'itens'}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 1.5rem;">R$ ${total.toFixed(2)}</div>
                    <div style="font-size: 0.875rem; opacity: 0.9;">Total</div>
                </div>
            </div>
        `;

        this.elements.shoppingListItems.innerHTML = itemsHTML + totalHTML;
    }

    groupItemsByMarket() {
        return this.shoppingList.reduce((groups, item) => {
            if (!groups[item.market]) {
                groups[item.market] = [];
            }
            groups[item.market].push(item);
            return groups;
        }, {});
    }

    editItem(itemId) {
        const item = this.shoppingList.find(i => i.id === itemId);
        if (!item) return;

        document.getElementById('editQuantity').value = item.quantity;
        document.getElementById('editUnit').value = item.unit;
        document.getElementById('editItemId').value = itemId;

        const modal = new bootstrap.Modal(document.getElementById('editItemModal'));
        modal.show();
    }

    saveItemEdit() {
        const itemId = parseFloat(document.getElementById('editItemId').value);
        const newQuantity = parseFloat(document.getElementById('editQuantity').value);
        const newUnit = document.getElementById('editUnit').value;

        if (newQuantity <= 0) {
            this.showMessage('❌ Quantidade deve ser maior que zero', 'error');
            return;
        }

        const item = this.shoppingList.find(i => i.id === itemId);
        if (!item) return;

        item.quantity = newQuantity;
        item.unit = newUnit;

        this.saveShoppingList();
        this.renderShoppingList();

        const modal = bootstrap.Modal.getInstance(document.getElementById('editItemModal'));
        modal.hide();

        this.showMessage('✅ Item atualizado!', 'success', 2000);
    }

    removeFromShoppingList(itemId) {
        this.shoppingList = this.shoppingList.filter(item => item.id !== itemId);
        this.saveShoppingList();
        this.renderShoppingList();
        this.showMessage('🗑️ Item removido!', 'info', 2000);
    }

    clearShoppingList() {
        if (this.shoppingList.length === 0) return;
        
        if (confirm('🗑️ Tem certeza que deseja limpar toda a lista de compras?')) {
            this.shoppingList = [];
            this.saveShoppingList();
            this.renderShoppingList();
            this.showMessage('🧹 Lista limpa!', 'info', 2000);
        }
    }

    getSavingsAnalysis() {
        if (this.shoppingList.length === 0) return null;

        const totalCurrent = this.shoppingList.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        let totalWorstCase = 0;
        this.shoppingList.forEach(item => {
            const product = this.products.find(p => p.id === item.productId);
            if (product && product.markets) {
                const prices = Object.values(product.markets).map(m => m.price);
                const maxPrice = Math.max(...prices);
                totalWorstCase += maxPrice * item.quantity;
            } else {
                totalWorstCase += item.price * item.quantity;
            }
        });

        const savings = totalWorstCase - totalCurrent;
        const savingsPercentage = totalWorstCase > 0 ? (savings / totalWorstCase) * 100 : 0;

        return {
            current: totalCurrent,
            worstCase: totalWorstCase,
            savings: savings,
            percentage: savingsPercentage,
            itemCount: this.shoppingList.length
        };
    }

    showSavingsAnalysis() {
        const analysis = this.getSavingsAnalysis();
        if (!analysis) {
            this.showMessage('📊 Adicione itens à lista para ver a análise de economia', 'info');
            return;
        }

        let message;
        let type = 'success';

        if (analysis.savings > 0) {
            message = `💰 Parabéns! Você está economizando R$ ${analysis.savings.toFixed(2)} (${analysis.percentage.toFixed(1)}%) com suas escolhas inteligentes! Isso representa uma economia significativa em sua compra.`;
        } else {
            message = `✅ Excelente! Você já está com os melhores preços disponíveis em todos os itens da sua lista. Continue assim!`;
        }

        this.showMessage(message, type, 8000);
    }

    showPriceComparison(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const markets = Object.entries(product.markets);
        const prices = markets.map(([, data]) => data.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const savings = maxPrice - minPrice;

        const modalHTML = `
            <div class="modal fade" id="priceComparisonModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header" style="padding: var(--unit-3);">
                            <h5 class="modal-title">📊 Comparação Detalhada de Preços</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" style="padding: var(--unit-3);">
                            <h6 style="color: var(--primary-color); margin-bottom: var(--unit-3);">${product.name}</h6>
                            ${product.brand ? `<p style="color: var(--text-secondary); margin-bottom: var(--unit-3);"><i class="bi bi-award"></i> ${product.brand}</p>` : ''}
                            
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--unit-3); margin-bottom: var(--unit-3);">
                                ${markets.map(([market, data]) => `
                                    <div style="background: ${data.price === minPrice ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-secondary)'}; border: 2px solid ${data.price === minPrice ? 'var(--success-color)' : 'var(--border-color)'}; padding: var(--unit-3); border-radius: var(--border-radius); text-align: center;">
                                        <div style="margin-bottom: var(--unit-2);">${this.getMarketIcon(market)}</div>
                                        <h6>${market}</h6>
                                        <div style="font-size: 1.5rem; font-weight: bold; ${data.price === minPrice ? 'color: var(--success-color);' : 'color: var(--text-muted);'} margin: var(--unit-2) 0;">
                                            R$ ${data.price.toFixed(2)}
                                        </div>
                                        <small style="color: var(--text-secondary);">por ${data.unit}</small>
                                        ${data.price === minPrice ? '<div style="background: var(--success-color); color: white; padding: var(--unit); border-radius: var(--border-radius); margin-top: var(--unit-2); font-size: 0.875rem;">🏆 Melhor preço!</div>' : ''}
                                    </div>
                                `).join('')}
                            </div>
                            
                            ${savings > 0 ? `
                                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid var(--success-color); padding: var(--unit-3); border-radius: var(--border-radius); color: #166534;">
                                    <i class="bi bi-piggy-bank" style="margin-right: var(--unit-2);"></i>
                                    <strong>Potencial de economia:</strong> Você pode economizar até R$ ${savings.toFixed(2)} (${((savings/maxPrice)*100).toFixed(1)}%) escolhendo o melhor preço!
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer" style="padding: var(--unit-3);">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="bi bi-x-lg"></i> Fechar
                            </button>
                            <button type="button" class="btn btn-primary" 
                                    onclick="app.addToShoppingList(${productId}, '${markets.find(([, data]) => data.price === minPrice)[0]}')" 
                                    data-bs-dismiss="modal">
                                <i class="bi bi-cart-plus"></i> Adicionar Melhor Preço
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal anterior se existir
        const existingModal = document.getElementById('priceComparisonModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('priceComparisonModal'));
        modal.show();

        // Remover modal do DOM quando fechado
        document.getElementById('priceComparisonModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    async exportToPDF() {
        if (this.shoppingList.length === 0) {
            this.showMessage('⚠️ Lista vazia para exportar!', 'info', 3000);
            return;
        }

        try {
            this.showMessage('📄 Gerando PDF...', 'info');

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Configurações baseadas no design system (8px)
            const pageWidth = doc.internal.pageSize.width;
            const margin = 16; // 2 * 8px
            let currentY = 24; // 3 * 8px

            // Cabeçalho
            doc.setFontSize(24);
            doc.setTextColor(37, 99, 235); // var(--primary-color)
            doc.text('🛒 Lista de Compras - Precinho', margin, currentY);

            currentY += 16; // 2 * 8px
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            const today = new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            doc.text(`Gerado em: ${today}`, margin, currentY);

            currentY += 16; // 2 * 8px

            // Análise de economia
            const analysis = this.getSavingsAnalysis();
            const itemCount = this.shoppingList.reduce((sum, item) => sum + item.quantity, 0);
            const marketCount = new Set(this.shoppingList.map(item => item.market)).size;

            doc.setFontSize(11);
            doc.setTextColor(80, 80, 80);
            let statsText = `📊 Resumo: ${itemCount} itens • ${marketCount} mercados • Total: R$ ${analysis.current.toFixed(2)}`;
           if (analysis.savings > 0) {
               statsText += ` • Economia: R$ ${analysis.savings.toFixed(2)} (${analysis.percentage.toFixed(1)}%)`;
           }
           doc.text(statsText, margin, currentY);
           
           currentY += 16; // 2 * 8px

           // Agrupamento por mercado
           const itemsByMarket = this.groupItemsByMarket();
           
           Object.entries(itemsByMarket).forEach(([market, items]) => {
               // Verificar se precisa de nova página
               if (currentY > 250) {
                   doc.addPage();
                   currentY = 24; // 3 * 8px
               }

               // Cabeçalho do mercado
               doc.setFontSize(14);
               doc.setTextColor(37, 99, 235);
               doc.text(`${this.getMarketIconText(market)} ${market}`, margin, currentY);
               
               const marketTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
               doc.setTextColor(16, 185, 129); // var(--success-color)
               doc.text(`R$ ${marketTotal.toFixed(2)}`, pageWidth - margin - 32, currentY);

               currentY += 8; // 1 * 8px

               // Itens do mercado
               doc.setFontSize(10);
               items.forEach(item => {
                   if (currentY > 270) {
                       doc.addPage();
                       currentY = 24; // 3 * 8px
                   }

                   doc.setTextColor(60, 60, 60);
                   const itemText = `• ${item.name}`;
                   doc.text(itemText, margin + 8, currentY); // margin + 1 * 8px

                   const quantityText = `${item.quantity} ${item.unit}`;
                   doc.text(quantityText, pageWidth - 80, currentY);

                   const priceText = `R$ ${(item.price * item.quantity).toFixed(2)}`;
                   doc.setTextColor(16, 185, 129);
                   doc.text(priceText, pageWidth - margin - 24, currentY); // pageWidth - margin - 3 * 8px

                   currentY += 8; // 1 * 8px
               });

               currentY += 8; // 1 * 8px
           });

           // Total final
           if (currentY > 250) {
               doc.addPage();
               currentY = 40; // 5 * 8px
           } else {
               currentY += 8; // 1 * 8px
           }

           doc.setDrawColor(200, 200, 200);
           doc.line(margin, currentY, pageWidth - margin, currentY);
           currentY += 16; // 2 * 8px

           doc.setFontSize(16);
           doc.setTextColor(37, 99, 235);
           doc.text('TOTAL GERAL:', margin, currentY);
           doc.setTextColor(16, 185, 129);
           doc.text(`R$ ${analysis.current.toFixed(2)}`, pageWidth - margin - 40, currentY);

           if (analysis.savings > 0) {
               currentY += 12;
               doc.setFontSize(12);
               doc.setTextColor(16, 185, 129);
               doc.text(`💰 Economia obtida: R$ ${analysis.savings.toFixed(2)} (${analysis.percentage.toFixed(1)}%)`, margin, currentY);
           }

           // Rodapé
           const pageCount = doc.internal.getNumberOfPages();
           for (let i = 1; i <= pageCount; i++) {
               doc.setPage(i);
               doc.setFontSize(8);
               doc.setTextColor(150, 150, 150);
               doc.text(
                   `Precinho © ${new Date().getFullYear()} - Página ${i} de ${pageCount}`,
                   margin,
                   doc.internal.pageSize.height - 12 // height - 1.5 * 8px
               );
           }

           // Salvar arquivo
           const filename = `lista-compras-precinho-${new Date().toISOString().split('T')[0]}.pdf`;
           doc.save(filename);
           
           this.showMessage('✅ PDF exportado com sucesso!', 'success', 3000);

       } catch (error) {
           console.error('Erro ao exportar PDF:', error);
           this.showMessage('❌ Erro ao exportar PDF', 'error');
       }
   }

   getMarketIconText(market) {
       const icons = {
           "Assaí Atacadista": "🏪",
           "Carrefour": "🛒",
           "Pão de Açucar": "🏢"
       };
       return icons[market] || "🏪";
   }

   saveShoppingList() {
       try {
           localStorage.setItem('precinho_shopping_list_v2', JSON.stringify(this.shoppingList));
       } catch (error) {
           console.error('Erro ao salvar lista:', error);
           this.showMessage('❌ Erro ao salvar lista', 'error');
       }
   }

   loadShoppingList() {
       try {
           const saved = localStorage.getItem('precinho_shopping_list_v2');
           return saved ? JSON.parse(saved) : [];
       } catch (error) {
           console.error('Erro ao carregar lista:', error);
           return [];
       }
   }

   updateCounters() {
       const itemCount = this.shoppingList.length;
       const hasItems = itemCount > 0;

       if (this.elements.itemCount) {
           this.elements.itemCount.textContent = `${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`;
       }

       if (this.elements.clearListBtn) this.elements.clearListBtn.disabled = !hasItems;
       if (this.elements.exportPdfBtn) this.elements.exportPdfBtn.disabled = !hasItems;
       if (this.elements.savingsAnalysisBtn) this.elements.savingsAnalysisBtn.disabled = !hasItems;
   }

   updateProductCount() {
       const count = this.products.length;
       if (this.elements.productCount) {
           this.elements.productCount.textContent = `${count} ${count === 1 ? 'produto' : 'produtos'}`;
       }
   }

   async performSearch() {
       const query = this.elements.searchInput?.value.trim() || '';
       await this.loadProducts(query);
   }

   clearSearch() {
       if (this.elements.searchInput) {
           this.elements.searchInput.value = '';
       }
       this.loadProducts();
   }

   showMessage(text, type = 'info', duration = 0) {
       if (!this.elements.messageContainer) return;

       const messageEl = document.createElement('div');
       messageEl.className = `alert-custom alert-${type}`;
       messageEl.innerHTML = `
           <div style="flex: 1;">${text}</div>
           <button type="button" style="background: none; border: none; color: inherit; padding: 0; margin-left: var(--unit-2); cursor: pointer;" onclick="this.parentElement.remove()">
               <i class="bi bi-x-lg"></i>
           </button>
       `;

       this.elements.messageContainer.appendChild(messageEl);

       if (duration > 0) {
           setTimeout(() => {
               if (messageEl.parentElement) {
                   messageEl.remove();
               }
           }, duration);
       }

       // Limitar mensagens visíveis
       const messages = this.elements.messageContainer.children;
       if (messages.length > 3) {
           messages[0].remove();
       }
   }
}

// Inicializar aplicação
let app;
document.addEventListener('DOMContentLoaded', function() {
   app = new PrecinhoApp();
   window.app = app; // Para uso global
});