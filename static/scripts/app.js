/**
 * Precinho Frontend - Material Design 3 + Busca Inteligente
 * Versão 3.1 com fuzzy search e PDF aprimorado
 */

class PrecinhoApp {
    constructor() {
        this.API_BASE_URL = '/api';
        this.products = [];
        this.shoppingList = this.loadShoppingList();
        this.searchTimeout = null;
        this.autocompleteCache = new Map();
        
        this.init();
    }

    async init() {
        this.cacheElements();
        this.setupEventListeners();
        await this.loadProducts();
        this.renderShoppingList();
        this.updateCounters();
        this.showToast('✅ Sistema carregado com sucesso!', 'success', 3000);
    }

    cacheElements() {
        this.elements = {
            searchInput: document.getElementById('searchInput'),
            searchButton: document.getElementById('searchButton'),
            productCardsContainer: document.getElementById('productCardsContainer'),
            productCount: document.getElementById('productCount'),
            itemCount: document.getElementById('itemCount'),
            toastContainer: document.getElementById('toastContainer'),
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

        // Busca inteligente em tempo real
        this.elements.searchInput?.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            const query = e.target.value.trim();
            
            this.searchTimeout = setTimeout(() => {
                if (query.length >= 1) {
                    this.showSmartAutocomplete(query);
                    if (query.length >= 2) {
                        this.performSmartSearch(query);
                    }
                } else {
                    this.hideAutocomplete();
                    this.loadProducts();
                }
            }, 300);
        });

        // Ocultar autocomplete ao clicar fora
        document.addEventListener('click', (e) => {
            if (!this.elements.searchInput?.contains(e.target)) {
                this.hideAutocomplete();
            }
        });

        [this.elements.filterAssai, this.elements.filterCarrefour, this.elements.filterPao]
            .forEach(filter => {
                filter?.addEventListener('change', () => this.renderProducts());
            });

        this.elements.clearListBtn?.addEventListener('click', () => this.clearShoppingList());
        this.elements.exportPdfBtn?.addEventListener('click', () => this.exportToPDF());
        this.elements.savingsAnalysisBtn?.addEventListener('click', () => this.showSavingsAnalysis());
    }

    // Função de busca inteligente com fuzzy matching
    fuzzySearch(query, text) {
        // Normalizar textos removendo acentos e convertendo para minúsculas
        const normalizeText = (str) => {
            return str.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Remove acentos
                .replace(/[^a-z0-9\s]/g, ''); // Remove caracteres especiais
        };

        const normalizedQuery = normalizeText(query);
        const normalizedText = normalizeText(text);

        // Busca exata
        if (normalizedText.includes(normalizedQuery)) {
            return { score: 100, type: 'exact' };
        }

        // Busca por palavras individuais
        const queryWords = normalizedQuery.split(' ').filter(w => w.length > 1);
        const textWords = normalizedText.split(' ');
        
        let matchedWords = 0;
        for (const queryWord of queryWords) {
            for (const textWord of textWords) {
                if (textWord.includes(queryWord) || queryWord.includes(textWord)) {
                    matchedWords++;
                    break;
                }
            }
        }

        if (matchedWords > 0) {
            return { score: (matchedWords / queryWords.length) * 80, type: 'partial' };
        }

        // Busca fuzzy por similaridade de caracteres
        let similarityScore = 0;
        for (let i = 0; i < normalizedQuery.length - 1; i++) {
            const bigram = normalizedQuery.substring(i, i + 2);
            if (normalizedText.includes(bigram)) {
                similarityScore++;
            }
        }

        const fuzzyScore = (similarityScore / (normalizedQuery.length - 1)) * 60;
        return fuzzyScore > 30 ? { score: fuzzyScore, type: 'fuzzy' } : { score: 0, type: 'none' };
    }

    // Autocomplete inteligente
    showSmartAutocomplete(query) {
        if (query.length < 1) {
            this.hideAutocomplete();
            return;
        }

        // Verificar cache
        const cacheKey = query.toLowerCase();
        if (this.autocompleteCache.has(cacheKey)) {
            this.renderAutocomplete(this.autocompleteCache.get(cacheKey));
            return;
        }

        // Buscar sugestões
        const suggestions = [];
        const processedProducts = new Set();

        this.products.forEach(product => {
            // Evitar duplicatas baseadas no nome base
            const baseName = product.name.split(' - ')[0];
            if (processedProducts.has(baseName)) return;

            const nameMatch = this.fuzzySearch(query, product.name);
            const categoryMatch = this.fuzzySearch(query, product.category);
            const brandMatch = this.fuzzySearch(query, product.brand || '');

            const maxScore = Math.max(nameMatch.score, categoryMatch.score, brandMatch.score);

            if (maxScore > 30) {
                suggestions.push({
                    product,
                    score: maxScore,
                    matchType: nameMatch.score === maxScore ? 'name' : 
                              categoryMatch.score === maxScore ? 'category' : 'brand',
                    baseName
                });
                processedProducts.add(baseName);
            }
        });

        // Ordenar por relevância
        suggestions.sort((a, b) => b.score - a.score);

        // Limitar a 8 sugestões
        const topSuggestions = suggestions.slice(0, 8);

        // Cache do resultado
        this.autocompleteCache.set(cacheKey, topSuggestions);

        this.renderAutocomplete(topSuggestions);
    }

    renderAutocomplete(suggestions) {
        if (!suggestions.length) {
            this.hideAutocomplete();
            return;
        }

        // Criar container de autocomplete se não existir
        let autocompleteContainer = document.getElementById('autocompleteContainer');
        if (!autocompleteContainer) {
            autocompleteContainer = document.createElement('div');
            autocompleteContainer.id = 'autocompleteContainer';
            autocompleteContainer.style.cssText = `
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: var(--md-sys-color-surface);
                border: 1px solid var(--md-sys-color-outline-variant);
                border-top: none;
                border-radius: 0 0 var(--md-sys-shape-corner-medium) var(--md-sys-shape-corner-medium);
                box-shadow: var(--md-sys-elevation-2);
                max-height: 300px;
                overflow-y: auto;
                z-index: 1000;
                display: none;
            `;
            
            // Inserir após o campo de busca
            const searchField = this.elements.searchInput.closest('.md-text-field');
            searchField.style.position = 'relative';
            searchField.appendChild(autocompleteContainer);
        }

        const html = suggestions.map((suggestion, index) => {
            const { product, matchType, baseName } = suggestion;
            
            // Extrair informações de embalagem
            const packageInfo = this.extractPackageInfo(product.name);
            
            return `
                <div style="padding: var(--md-sys-spacing-3); border-bottom: 1px solid var(--md-sys-color-outline-variant); cursor: pointer; transition: background-color 0.2s;" 
                     onmouseover="this.style.backgroundColor='var(--md-sys-color-surface-variant)'" 
                     onmouseout="this.style.backgroundColor='transparent'"
                     onclick="app.selectAutocomplete('${baseName.replace(/'/g, "\\'")}')">
                    <div style="display: flex; justify-content: between; align-items: start; gap: var(--md-sys-spacing-3);">
                        <div style="flex: 1;">
                            <div style="font-weight: 500; color: var(--md-sys-color-on-surface); margin-bottom: var(--md-sys-spacing-1);">
                                ${this.highlightMatch(baseName, this.elements.searchInput.value)}
                            </div>
                            <div style="display: flex; gap: var(--md-sys-spacing-2); flex-wrap: wrap; align-items: center;">
                                <span style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); background: var(--md-sys-color-surface-variant); padding: 2px var(--md-sys-spacing-1); border-radius: var(--md-sys-shape-corner-extra-small);">
                                    ${product.category}
                                </span>
                                ${product.brand ? `
                                    <span style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); background: var(--md-sys-color-surface-variant); padding: 2px var(--md-sys-spacing-1); border-radius: var(--md-sys-shape-corner-extra-small);">
                                        ${product.brand}
                                    </span>
                                ` : ''}
                                ${packageInfo.displayText ? `
                                    <span style="font-size: 0.75rem; color: var(--md-sys-color-primary); background: var(--md-sys-color-primary-container); padding: 2px var(--md-sys-spacing-1); border-radius: var(--md-sys-shape-corner-extra-small);">
                                        <span class="material-symbols-outlined" style="font-size: 0.75rem; vertical-align: middle; margin-right: 2px;">inventory_2</span>
                                        ${packageInfo.displayText}
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant);">
                                ${matchType === 'name' ? 'Nome' : matchType === 'category' ? 'Categoria' : 'Marca'}
                            </span>
                            <div style="font-size: 0.875rem; color: var(--md-sys-color-primary); font-weight: 500;">
                                ${this.getBestPrice(product).toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        autocompleteContainer.innerHTML = html;
        autocompleteContainer.style.display = 'block';
    }

    highlightMatch(text, query) {
        if (!query) return text;
        
        const normalizedText = text.toLowerCase();
        const normalizedQuery = query.toLowerCase();
        const index = normalizedText.indexOf(normalizedQuery);
        
        if (index !== -1) {
            return text.substring(0, index) + 
                   `<mark style="background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); padding: 0 2px; border-radius: 2px;">${text.substring(index, index + query.length)}</mark>` + 
                   text.substring(index + query.length);
        }
        
        return text;
    }

    getBestPrice(product) {
        const prices = Object.values(product.markets).map(m => m.price);
        return Math.min(...prices);
    }

    selectAutocomplete(baseName) {
        this.elements.searchInput.value = baseName;
        this.hideAutocomplete();
        this.performSmartSearch(baseName);
    }

    hideAutocomplete() {
        const autocompleteContainer = document.getElementById('autocompleteContainer');
        if (autocompleteContainer) {
            autocompleteContainer.style.display = 'none';
        }
    }

    // Busca inteligente de produtos
    async performSmartSearch(query = '') {
        if (!query) {
            await this.loadProducts();
            return;
        }

        const filteredProducts = [];
        
        this.products.forEach(product => {
            const nameMatch = this.fuzzySearch(query, product.name);
            const categoryMatch = this.fuzzySearch(query, product.category);
            const brandMatch = this.fuzzySearch(query, product.brand || '');
            
            const maxScore = Math.max(nameMatch.score, categoryMatch.score, brandMatch.score);
            
            if (maxScore > 25) {
                filteredProducts.push({
                    ...product,
                    searchScore: maxScore
                });
            }
        });

        // Ordenar por relevância
        filteredProducts.sort((a, b) => b.searchScore - a.searchScore);

        this.products = filteredProducts.map(({ searchScore, ...product }) => product);
        this.renderProducts();
        this.updateProductCount();
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
            
            // Limpar cache de autocomplete quando carrega novos produtos
            this.autocompleteCache.clear();
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            this.showToast('❌ Erro ao carregar produtos', 'error');
        }
    }

    renderProducts() {
        if (!this.elements.productCardsContainer) return;

        const activeMarkets = this.getActiveMarkets();
        
        if (this.products.length === 0) {
            this.elements.productCardsContainer.innerHTML = this.getEmptyProductsHTML();
            return;
        }

        // Criar cards múltiplos com informações de embalagem
        const productCards = [];
        
        this.products.forEach(product => {
            Object.entries(product.markets).forEach(([market, marketData]) => {
                if (activeMarkets.includes(market)) {
                    // Extrair informações da embalagem do nome do produto
                    const packageInfo = this.extractPackageInfo(product.name);
                    
                    // Calcular se é o melhor preço
                    const allPricesForProduct = Object.values(product.markets)
                        .filter((_, index) => activeMarkets.includes(Object.keys(product.markets)[index]))
                        .map(data => data.price);
                    
                    const bestPrice = Math.min(...allPricesForProduct);
                    const worstPrice = Math.max(...allPricesForProduct);
                    const isBestPrice = marketData.price === bestPrice;
                    const isExpensive = marketData.price === worstPrice && worstPrice > bestPrice;
                    
                    // Verificar se tem promoção (baseado em padrões de preço)
                    const hasPromotion = this.detectPromotion(marketData.price, allPricesForProduct);
                    
                    productCards.push({
                        product,
                        market,
                        marketData,
                        packageInfo,
                        isBestPrice,
                        isExpensive,
                        hasPromotion,
                        bestPrice
                    });
                }
            });
        });

        // Ordenar: melhores preços primeiro, depois por nome
        productCards.sort((a, b) => {
            if (a.product.name !== b.product.name) {
                return a.product.name.localeCompare(b.product.name);
            }
            return a.marketData.price - b.marketData.price;
        });

        this.elements.productCardsContainer.innerHTML = productCards
            .map(cardData => this.createProductCardHTML(cardData))
            .join('');
    }

    extractPackageInfo(productName) {
        // Regex melhorado para extrair informações de embalagem
        const patterns = {
            weight: /(\d+(?:[\.,]\d+)?)\s*(kg|quilos?|kgs?)/gi,
            weightGrams: /(\d+(?:[\.,]\d+)?)\s*(g|gramas?|grs?)/gi,
            volume: /(\d+(?:[\.,]\d+)?)\s*(l|litros?|lts?)/gi,
            volumeMl: /(\d+(?:[\.,]\d+)?)\s*(ml|mililitros?)/gi,
            unit: /(\d+)\s*(un|unidades?|uni)/gi,
            pack: /(\d+)\s*(pct|pacotes?|pack)/gi,
            box: /(\d+(?:x\d+)?)\s*(cx|caixas?|box)/gi,
            size: /(pequeno|médio|grande|p|m|g|small|medium|large)/gi
        };

        const result = {
            weight: null,
            volume: null,
            unit: null,
            size: null,
            displayText: null
        };

        // Processar cada padrão
        for (const [type, pattern] of Object.entries(patterns)) {
            const match = productName.match(pattern);
            if (match) {
                const firstMatch = match[0];
                const parts = firstMatch.split(/\s+/);
                
                if (parts.length >= 2) {
                    const value = parseFloat(parts[0].replace(',', '.'));
                    const unit = parts[1].toLowerCase();
                    
                    if (type.includes('weight') || type === 'weight') {
                        result.weight = { value, unit };
                    } else if (type.includes('volume') || type === 'volume') {
                        result.volume = { value, unit };
                    } else if (type === 'unit' || type === 'pack' || type === 'box') {
                        result.unit = { value, unit };
                    } else if (type === 'size') {
                        result.size = unit;
                    }
                }
            }
        }

        // Criar texto de exibição prioritário
        if (result.weight) {
            result.displayText = `${result.weight.value}${result.weight.unit}`;
        } else if (result.volume) {
            result.displayText = `${result.volume.value}${result.volume.unit}`;
        } else if (result.unit) {
            result.displayText = `${result.unit.value} ${result.unit.unit}`;
        } else if (result.size) {
            result.displayText = result.size.toUpperCase();
        }

        return result;
    }

    detectPromotion(currentPrice, allPrices) {
        if (allPrices.length < 2) return false;
        
        const avgPrice = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length;
        const discountPercent = ((avgPrice - currentPrice) / avgPrice) * 100;
        
        return discountPercent >= 10; // 10% ou mais de desconto em relação à média
    }

    createProductCardHTML({ product, market, marketData, packageInfo, isBestPrice, isExpensive, hasPromotion, bestPrice }) {
        const savings = bestPrice ? Math.abs(marketData.price - bestPrice) : 0;
        const savingsPercent = bestPrice > 0 ? ((savings / bestPrice) * 100) : 0;
        
        let cardClass = 'product-card';
        let badgeClass = 'md-button md-button-text';
        let badgeText = 'Preço Padrão';
        let badgeIcon = 'label';
        
        if (isBestPrice) {
            cardClass += ' best-price';
            badgeClass = 'md-button md-button-filled';
            badgeText = 'Melhor Preço';
            badgeIcon = 'star';
        } else if (isExpensive) {
            cardClass += ' expensive';
            badgeClass = 'md-button md-button-outlined';
            badgeText = 'Mais Caro';
            badgeIcon = 'trending_up';
        } else if (savingsPercent <= 5) {
            cardClass += ' good-price';
            badgeClass = 'md-button md-button-tonal';
            badgeText = 'Bom Preço';
            badgeIcon = 'thumb_up';
        }

        return `
            <div class="${cardClass}">
                ${hasPromotion ? `
                    <div class="promotion-badge">
                        <span class="material-symbols-outlined" style="font-size: 0.75rem; vertical-align: middle;">local_fire_department</span>
                        PROMOÇÃO
                    </div>
                ` : ''}
                
                ${isBestPrice ? `
                    <div class="best-price-indicator">
                        <span class="material-symbols-outlined" style="font-size: 1rem; vertical-align: middle; margin-right: var(--md-sys-spacing-1);">emoji_events</span>
                        MELHOR ESCOLHA - ECONOMIA MÁXIMA
                    </div>
                ` : ''}
                
                <div style="padding: var(--md-sys-spacing-4); ${isBestPrice ? 'padding-top: var(--md-sys-spacing-8);' : ''}">
                    <div style="margin-bottom: var(--md-sys-spacing-4);">
                        <h3 style="font-family: var(--md-sys-typescale-title-large-font); font-size: 1rem; font-weight: var(--md-sys-typescale-title-large-weight); line-height: 1.4; margin-bottom: var(--md-sys-spacing-2); color: var(--md-sys-color-on-surface);">
                            ${product.name}
                        </h3>
                        <div style="display: flex; flex-wrap: wrap; gap: var(--md-sys-spacing-2); align-items: center; margin-bottom: var(--md-sys-spacing-3);">
                            <span style="background: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); padding: var(--md-sys-spacing-1) var(--md-sys-spacing-2); border-radius: var(--md-sys-shape-corner-small); font-size: 0.75rem; font-weight: 500;">
                                <span class="material-symbols-outlined" style="font-size: 0.875rem; vertical-align: middle; margin-right: var(--md-sys-spacing-1);">category</span>
                                ${product.category}
                            </span>
                            ${product.brand ? `
                                <span style="background: var(--md-sys-color-tertiary-container); color: var(--md-sys-color-on-tertiary-container); padding: var(--md-sys-spacing-1) var(--md-sys-spacing-2); border-radius: var(--md-sys-shape-corner-small); font-size: 0.75rem; font-weight: 500;">
                                    <span class="material-symbols-outlined" style="font-size: 0.875rem; vertical-align: middle; margin-right: var(--md-sys-spacing-1);">verified</span>
                                    ${product.brand}
                                </span>
                            ` : ''}
                        </div>
                        ${packageInfo.displayText ? `
                            <div class="package-info">
                                <span class="material-symbols-outlined" style="font-size: 1rem;">inventory_2</span>
                                Embalagem: ${packageInfo.displayText}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div style="text-align: center; margin-bottom: var(--md-sys-spacing-4);">
                        <div style="display: flex; justify-content: center; align-items: center; margin-bottom: var(--md-sys-spacing-2);">
                            ${this.getMarketIcon(market)}
                            <h4 style="margin: 0 0 0 var(--md-sys-spacing-2); font-weight: 500; color: var(--md-sys-color-on-surface);">
                                ${market}
                            </h4>
                        </div>
                        <div style="font-family: var(--md-sys-typescale-display-large-font); font-size: 2rem; font-weight: 700; color: var(--md-sys-color-primary); margin-bottom: var(--md-sys-spacing-1);">
                            R$ ${marketData.price.toFixed(2)}
                        </div>
                        <small style="color: var(--md-sys-color-on-surface-variant);">
                            por ${marketData.unit}
                            ${packageInfo.displayText ? ` • ${packageInfo.displayText}` : ''}
                        </small>
                    </div>
                    
                    <div style="margin-bottom: var(--md-sys-spacing-4); text-align: center;">
                        <span class="${badgeClass}" style="pointer-events: none;">
                            <span class="material-symbols-outlined">${badgeIcon}</span>
                            ${badgeText}
                        </span>
                    </div>
                    
                    ${!isBestPrice && savings > 0 ? `
                        <div style="background: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container); padding: var(--md-sys-spacing-3); border-radius: var(--md-sys-shape-corner-medium); text-align: center; font-size: 0.875rem; margin-bottom: var(--md-sys-spacing-4);">
                            <span class="material-symbols-outlined" style="font-size: 1rem; vertical-align: middle; margin-right: var(--md-sys-spacing-1);">info</span>
                            R$ ${savings.toFixed(2)} mais caro que o melhor preço
                            ${savingsPercent > 0 ? `<br><small>(+${savingsPercent.toFixed(1)}%)</small>` : ''}
                        </div>
                    ` : ''}
                    
                    ${isBestPrice ? `
                        <div style="background: var(--md-sys-color-success-container); color: var(--md-sys-color-on-success-container); padding: var(--md-sys-spacing-3); border-radius: var(--md-sys-shape-corner-medium); text-align: center; font-size: 0.875rem; margin-bottom: var(--md-sys-spacing-4);">
                            <span class="material-symbols-outlined" style="font-size: 1rem; vertical-align: middle; margin-right: var(--md-sys-spacing-1);">check_circle</span>
                            <strong>Melhor preço disponível!</strong>
                        </div>
                    ` : ''}
                    
                    <div style="display: grid; gap: var(--md-sys-spacing-2);">
                        <button class="md-button ${isBestPrice ? 'md-button-filled' : 'md-button-tonal'}" 
                                onclick="app.addToShoppingList(${product.id}, '${market}', '${packageInfo.displayText || marketData.unit}')"
                                style="width: 100%;">
                            <span class="material-symbols-outlined">add_shopping_cart</span>
                            ${isBestPrice ? 'Adicionar Melhor Preço' : 'Adicionar à Lista'}
                        </button>
                        
                        <button class="md-button md-button-outlined" 
                                onclick="app.showPriceComparison(${product.id})"
                                style="width: 100%;">
                            <span class="material-symbols-outlined">compare_arrows</span>
                            Comparar Preços
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getEmptyProductsHTML() {
        const query = this.elements.searchInput?.value.trim() || '';
        return `
            <div style="grid-column: 1 / -1; text-align: center; padding: var(--md-sys-spacing-12);">
                <span class="material-symbols-outlined" style="font-size: 4rem; color: var(--md-sys-color-outline); display: block; margin-bottom: var(--md-sys-spacing-4);">search_off</span>
                <h3 style="color: var(--md-sys-color-on-surface-variant); margin-bottom: var(--md-sys-spacing-3);">Nenhum produto encontrado</h3>
                <p style="color: var(--md-sys-color-on-surface-variant); margin-bottom: var(--md-sys-spacing-4);">
                    ${query ? `Não encontramos produtos para "${query}"` : 'Tente ajustar os filtros ou termos de busca'}
                </p>
                <button class="md-button md-button-filled" onclick="app.clearSearch()">
                    <span class="material-symbols-outlined">refresh</span>
                    ${query ? 'Limpar busca' : 'Recarregar produtos'}
                </button>
            </div>
        `;
    }

    getMarketIcon(market) {
        const icons = {
        /**
 * Precinho Frontend - Material Design 3 + Busca Inteligente
 * Versão 3.1 com fuzzy search e PDF aprimorado
 */

class PrecinhoApp {
    constructor() {
        this.API_BASE_URL = '/api';
        this.products = [];
        this.shoppingList = this.loadShoppingList();
        this.searchTimeout = null;
        this.autocompleteCache = new Map();
        
        this.init();
    }

    async init() {
        this.cacheElements();
        this.setupEventListeners();
        await this.loadProducts();
        this.renderShoppingList();
        this.updateCounters();
        this.showToast('✅ Sistema carregado com sucesso!', 'success', 3000);
    }

    cacheElements() {
        this.elements = {
            searchInput: document.getElementById('searchInput'),
            searchButton: document.getElementById('searchButton'),
            productCardsContainer: document.getElementById('productCardsContainer'),
            productCount: document.getElementById('productCount'),
            itemCount: document.getElementById('itemCount'),
            toastContainer: document.getElementById('toastContainer'),
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

        // Busca inteligente em tempo real
        this.elements.searchInput?.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            const query = e.target.value.trim();
            
            this.searchTimeout = setTimeout(() => {
                if (query.length >= 1) {
                    this.showSmartAutocomplete(query);
                    if (query.length >= 2) {
                        this.performSmartSearch(query);
                    }
                } else {
                    this.hideAutocomplete();
                    this.loadProducts();
                }
            }, 300);
        });

        // Ocultar autocomplete ao clicar fora
        document.addEventListener('click', (e) => {
            if (!this.elements.searchInput?.contains(e.target)) {
                this.hideAutocomplete();
            }
        });

        [this.elements.filterAssai, this.elements.filterCarrefour, this.elements.filterPao]
            .forEach(filter => {
                filter?.addEventListener('change', () => this.renderProducts());
            });

        this.elements.clearListBtn?.addEventListener('click', () => this.clearShoppingList());
        this.elements.exportPdfBtn?.addEventListener('click', () => this.exportToPDF());
        this.elements.savingsAnalysisBtn?.addEventListener('click', () => this.showSavingsAnalysis());
    }

    // Função de busca inteligente com fuzzy matching
    fuzzySearch(query, text) {
        // Normalizar textos removendo acentos e convertendo para minúsculas
        const normalizeText = (str) => {
            return str.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Remove acentos
                .replace(/[^a-z0-9\s]/g, ''); // Remove caracteres especiais
        };

        const normalizedQuery = normalizeText(query);
        const normalizedText = normalizeText(text);

        // Busca exata
        if (normalizedText.includes(normalizedQuery)) {
            return { score: 100, type: 'exact' };
        }

        // Busca por palavras individuais
        const queryWords = normalizedQuery.split(' ').filter(w => w.length > 1);
        const textWords = normalizedText.split(' ');
        
        let matchedWords = 0;
        for (const queryWord of queryWords) {
            for (const textWord of textWords) {
                if (textWord.includes(queryWord) || queryWord.includes(textWord)) {
                    matchedWords++;
                    break;
                }
            }
        }

        if (matchedWords > 0) {
            return { score: (matchedWords / queryWords.length) * 80, type: 'partial' };
        }

        // Busca fuzzy por similaridade de caracteres
        let similarityScore = 0;
        for (let i = 0; i < normalizedQuery.length - 1; i++) {
            const bigram = normalizedQuery.substring(i, i + 2);
            if (normalizedText.includes(bigram)) {
                similarityScore++;
            }
        }

        const fuzzyScore = (similarityScore / (normalizedQuery.length - 1)) * 60;
        return fuzzyScore > 30 ? { score: fuzzyScore, type: 'fuzzy' } : { score: 0, type: 'none' };
    }

    // Autocomplete inteligente
    showSmartAutocomplete(query) {
        if (query.length < 1) {
            this.hideAutocomplete();
            return;
        }

        // Verificar cache
        const cacheKey = query.toLowerCase();
        if (this.autocompleteCache.has(cacheKey)) {
            this.renderAutocomplete(this.autocompleteCache.get(cacheKey));
            return;
        }

        // Buscar sugestões
        const suggestions = [];
        const processedProducts = new Set();

        this.products.forEach(product => {
            // Evitar duplicatas baseadas no nome base
            const baseName = product.name.split(' - ')[0];
            if (processedProducts.has(baseName)) return;

            const nameMatch = this.fuzzySearch(query, product.name);
            const categoryMatch = this.fuzzySearch(query, product.category);
            const brandMatch = this.fuzzySearch(query, product.brand || '');

            const maxScore = Math.max(nameMatch.score, categoryMatch.score, brandMatch.score);

            if (maxScore > 30) {
                suggestions.push({
                    product,
                    score: maxScore,
                    matchType: nameMatch.score === maxScore ? 'name' : 
                              categoryMatch.score === maxScore ? 'category' : 'brand',
                    baseName
                });
                processedProducts.add(baseName);
            }
        });

        // Ordenar por relevância
        suggestions.sort((a, b) => b.score - a.score);

        // Limitar a 8 sugestões
        const topSuggestions = suggestions.slice(0, 8);

        // Cache do resultado
        this.autocompleteCache.set(cacheKey, topSuggestions);

        this.renderAutocomplete(topSuggestions);
    }

    renderAutocomplete(suggestions) {
        if (!suggestions.length) {
            this.hideAutocomplete();
            return;
        }

        // Criar container de autocomplete se não existir
        let autocompleteContainer = document.getElementById('autocompleteContainer');
        if (!autocompleteContainer) {
            autocompleteContainer = document.createElement('div');
            autocompleteContainer.id = 'autocompleteContainer';
            autocompleteContainer.style.cssText = `
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: var(--md-sys-color-surface);
                border: 1px solid var(--md-sys-color-outline-variant);
                border-top: none;
                border-radius: 0 0 var(--md-sys-shape-corner-medium) var(--md-sys-shape-corner-medium);
                box-shadow: var(--md-sys-elevation-2);
                max-height: 300px;
                overflow-y: auto;
                z-index: 1000;
                display: none;
            `;
            
            // Inserir após o campo de busca
            const searchField = this.elements.searchInput.closest('.md-text-field');
            searchField.style.position = 'relative';
            searchField.appendChild(autocompleteContainer);
        }

        const html = suggestions.map((suggestion, index) => {
            const { product, matchType, baseName } = suggestion;
            
            // Extrair informações de embalagem
            const packageInfo = this.extractPackageInfo(product.name);
            
            return `
                <div style="padding: var(--md-sys-spacing-3); border-bottom: 1px solid var(--md-sys-color-outline-variant); cursor: pointer; transition: background-color 0.2s;" 
                     onmouseover="this.style.backgroundColor='var(--md-sys-color-surface-variant)'" 
                     onmouseout="this.style.backgroundColor='transparent'"
                     onclick="app.selectAutocomplete('${baseName.replace(/'/g, "\\'")}')">
                    <div style="display: flex; justify-content: between; align-items: start; gap: var(--md-sys-spacing-3);">
                        <div style="flex: 1;">
                            <div style="font-weight: 500; color: var(--md-sys-color-on-surface); margin-bottom: var(--md-sys-spacing-1);">
                                ${this.highlightMatch(baseName, this.elements.searchInput.value)}
                            </div>
                            <div style="display: flex; gap: var(--md-sys-spacing-2); flex-wrap: wrap; align-items: center;">
                                <span style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); background: var(--md-sys-color-surface-variant); padding: 2px var(--md-sys-spacing-1); border-radius: var(--md-sys-shape-corner-extra-small);">
                                    ${product.category}
                                </span>
                                ${product.brand ? `
                                    <span style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); background: var(--md-sys-color-surface-variant); padding: 2px var(--md-sys-spacing-1); border-radius: var(--md-sys-shape-corner-extra-small);">
                                        ${product.brand}
                                    </span>
                                ` : ''}
                                ${packageInfo.displayText ? `
                                    <span style="font-size: 0.75rem; color: var(--md-sys-color-primary); background: var(--md-sys-color-primary-container); padding: 2px var(--md-sys-spacing-1); border-radius: var(--md-sys-shape-corner-extra-small);">
                                        <span class="material-symbols-outlined" style="font-size: 0.75rem; vertical-align: middle; margin-right: 2px;">inventory_2</span>
                                        ${packageInfo.displayText}
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant);">
                                ${matchType === 'name' ? 'Nome' : matchType === 'category' ? 'Categoria' : 'Marca'}
                            </span>
                            <div style="font-size: 0.875rem; color: var(--md-sys-color-primary); font-weight: 500;">
                                ${this.getBestPrice(product).toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        autocompleteContainer.innerHTML = html;
        autocompleteContainer.style.display = 'block';
    }

    highlightMatch(text, query) {
        if (!query) return text;
        
        const normalizedText = text.toLowerCase();
        const normalizedQuery = query.toLowerCase();
        const index = normalizedText.indexOf(normalizedQuery);
        
        if (index !== -1) {
            return text.substring(0, index) + 
                   `<mark style="background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); padding: 0 2px; border-radius: 2px;">${text.substring(index, index + query.length)}</mark>` + 
                   text.substring(index + query.length);
        }
        
        return text;
    }

    getBestPrice(product) {
        const prices = Object.values(product.markets).map(m => m.price);
        return Math.min(...prices);
    }

    selectAutocomplete(baseName) {
        this.elements.searchInput.value = baseName;
        this.hideAutocomplete();
        this.performSmartSearch(baseName);
    }

    hideAutocomplete() {
        const autocompleteContainer = document.getElementById('autocompleteContainer');
        if (autocompleteContainer) {
            autocompleteContainer.style.display = 'none';
        }
    }

    // Busca inteligente de produtos
    async performSmartSearch(query = '') {
        if (!query) {
            await this.loadProducts();
            return;
        }

        const filteredProducts = [];
        
        this.products.forEach(product => {
            const nameMatch = this.fuzzySearch(query, product.name);
            const categoryMatch = this.fuzzySearch(query, product.category);
            const brandMatch = this.fuzzySearch(query, product.brand || '');
            
            const maxScore = Math.max(nameMatch.score, categoryMatch.score, brandMatch.score);
            
            if (maxScore > 25) {
                filteredProducts.push({
                    ...product,
                    searchScore: maxScore
                });
            }
        });

        // Ordenar por relevância
        filteredProducts.sort((a, b) => b.searchScore - a.searchScore);

        this.products = filteredProducts.map(({ searchScore, ...product }) => product);
        this.renderProducts();
        this.updateProductCount();
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
            
            // Limpar cache de autocomplete quando carrega novos produtos
            this.autocompleteCache.clear();
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            this.showToast('❌ Erro ao carregar produtos', 'error');
        }
    }

    renderProducts() {
        if (!this.elements.productCardsContainer) return;

        const activeMarkets = this.getActiveMarkets();
        
        if (this.products.length === 0) {
            this.elements.productCardsContainer.innerHTML = this.getEmptyProductsHTML();
            return;
        }

        // Criar cards múltiplos com informações de embalagem
        const productCards = [];
        
        this.products.forEach(product => {
            Object.entries(product.markets).forEach(([market, marketData]) => {
                if (activeMarkets.includes(market)) {
                    // Extrair informações da embalagem do nome do produto
                    const packageInfo = this.extractPackageInfo(product.name);
                    
                    // Calcular se é o melhor preço
                    const allPricesForProduct = Object.values(product.markets)
                        .filter((_, index) => activeMarkets.includes(Object.keys(product.markets)[index]))
                        .map(data => data.price);
                    
                    const bestPrice = Math.min(...allPricesForProduct);
                    const worstPrice = Math.max(...allPricesForProduct);
                    const isBestPrice = marketData.price === bestPrice;
                    const isExpensive = marketData.price === worstPrice && worstPrice > bestPrice;
                    
                    // Verificar se tem promoção (baseado em padrões de preço)
                    const hasPromotion = this.detectPromotion(marketData.price, allPricesForProduct);
                    
                    productCards.push({
                        product,
                        market,
                        marketData,
                        packageInfo,
                        isBestPrice,
                        isExpensive,
                        hasPromotion,
                        bestPrice
                    });
                }
            });
        });

        // Ordenar: melhores preços primeiro, depois por nome
        productCards.sort((a, b) => {
            if (a.product.name !== b.product.name) {
                return a.product.name.localeCompare(b.product.name);
            }
            return a.marketData.price - b.marketData.price;
        });

        this.elements.productCardsContainer.innerHTML = productCards
            .map(cardData => this.createProductCardHTML(cardData))
            .join('');
    }

    extractPackageInfo(productName) {
        // Regex melhorado para extrair informações de embalagem
        const patterns = {
            weight: /(\d+(?:[\.,]\d+)?)\s*(kg|quilos?|kgs?)/gi,
            weightGrams: /(\d+(?:[\.,]\d+)?)\s*(g|gramas?|grs?)/gi,
            volume: /(\d+(?:[\.,]\d+)?)\s*(l|litros?|lts?)/gi,
            volumeMl: /(\d+(?:[\.,]\d+)?)\s*(ml|mililitros?)/gi,
            unit: /(\d+)\s*(un|unidades?|uni)/gi,
            pack: /(\d+)\s*(pct|pacotes?|pack)/gi,
            box: /(\d+(?:x\d+)?)\s*(cx|caixas?|box)/gi,
            size: /(pequeno|médio|grande|p|m|g|small|medium|large)/gi
        };

        const result = {
            weight: null,
            volume: null,
            unit: null,
            size: null,
            displayText: null
        };

        // Processar cada padrão
        for (const [type, pattern] of Object.entries(patterns)) {
            const match = productName.match(pattern);
            if (match) {
                const firstMatch = match[0];
                const parts = firstMatch.split(/\s+/);
                
                if (parts.length >= 2) {
                    const value = parseFloat(parts[0].replace(',', '.'));
                    const unit = parts[1].toLowerCase();
                    
                    if (type.includes('weight') || type === 'weight') {
                        result.weight = { value, unit };
                    } else if (type.includes('volume') || type === 'volume') {
                        result.volume = { value, unit };
                    } else if (type === 'unit' || type === 'pack' || type === 'box') {
                        result.unit = { value, unit };
                    } else if (type === 'size') {
                        result.size = unit;
                    }
                }
            }
        }

        // Criar texto de exibição prioritário
        if (result.weight) {
            result.displayText = `${result.weight.value}${result.weight.unit}`;
        } else if (result.volume) {
            result.displayText = `${result.volume.value}${result.volume.unit}`;
        } else if (result.unit) {
            result.displayText = `${result.unit.value} ${result.unit.unit}`;
        } else if (result.size) {
            result.displayText = result.size.toUpperCase();
        }

        return result;
    }

    detectPromotion(currentPrice, allPrices) {
        if (allPrices.length < 2) return false;
        
        const avgPrice = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length;
        const discountPercent = ((avgPrice - currentPrice) / avgPrice) * 100;
        
        return discountPercent >= 10; // 10% ou mais de desconto em relação à média
    }

    createProductCardHTML({ product, market, marketData, packageInfo, isBestPrice, isExpensive, hasPromotion, bestPrice }) {
        const savings = bestPrice ? Math.abs(marketData.price - bestPrice) : 0;
        const savingsPercent = bestPrice > 0 ? ((savings / bestPrice) * 100) : 0;
        
        let cardClass = 'product-card';
        let badgeClass = 'md-button md-button-text';
        let badgeText = 'Preço Padrão';
        let badgeIcon = 'label';
        
        if (isBestPrice) {
            cardClass += ' best-price';
            badgeClass = 'md-button md-button-filled';
            badgeText = 'Melhor Preço';
            badgeIcon = 'star';
        } else if (isExpensive) {
            cardClass += ' expensive';
            badgeClass = 'md-button md-button-outlined';
            badgeText = 'Mais Caro';
            badgeIcon = 'trending_up';
        } else if (savingsPercent <= 5) {
            cardClass += ' good-price';
            badgeClass = 'md-button md-button-tonal';
            badgeText = 'Bom Preço';
            badgeIcon = 'thumb_up';
        }

        return `
            <div class="${cardClass}">
                ${hasPromotion ? `
                    <div class="promotion-badge">
                        <span class="material-symbols-outlined" style="font-size: 0.75rem; vertical-align: middle;">local_fire_department</span>
                        PROMOÇÃO
                    </div>
                ` : ''}
                
                ${isBestPrice ? `
                    <div class="best-price-indicator">
                        <span class="material-symbols-outlined" style="font-size: 1rem; vertical-align: middle; margin-right: var(--md-sys-spacing-1);">emoji_events</span>
                        MELHOR ESCOLHA - ECONOMIA MÁXIMA
                    </div>
                ` : ''}
                
                <div style="padding: var(--md-sys-spacing-4); ${isBestPrice ? 'padding-top: var(--md-sys-spacing-8);' : ''}">
                    <div style="margin-bottom: var(--md-sys-spacing-4);">
                        <h3 style="font-family: var(--md-sys-typescale-title-large-font); font-size: 1rem; font-weight: var(--md-sys-typescale-title-large-weight); line-height: 1.4; margin-bottom: var(--md-sys-spacing-2); color: var(--md-sys-color-on-surface);">
                            ${product.name}
                        </h3>
                        <div style="display: flex; flex-wrap: wrap; gap: var(--md-sys-spacing-2); align-items: center; margin-bottom: var(--md-sys-spacing-3);">
                            <span style="background: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); padding: var(--md-sys-spacing-1) var(--md-sys-spacing-2); border-radius: var(--md-sys-shape-corner-small); font-size: 0.75rem; font-weight: 500;">
                                <span class="material-symbols-outlined" style="font-size: 0.875rem; vertical-align: middle; margin-right: var(--md-sys-spacing-1);">category</span>
                                ${product.category}
                            </span>
                            ${product.brand ? `
                                <span style="background: var(--md-sys-color-tertiary-container); color: var(--md-sys-color-on-tertiary-container); padding: var(--md-sys-spacing-1) var(--md-sys-spacing-2); border-radius: var(--md-sys-shape-corner-small); font-size: 0.75rem; font-weight: 500;">
                                    <span class="material-symbols-outlined" style="font-size: 0.875rem; vertical-align: middle; margin-right: var(--md-sys-spacing-1);">verified</span>
                                    ${product.brand}
                                </span>
                            ` : ''}
                        </div>
                        ${packageInfo.displayText ? `
                            <div class="package-info">
                                <span class="material-symbols-outlined" style="font-size: 1rem;">inventory_2</span>
                                Embalagem: ${packageInfo.displayText}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div style="text-align: center; margin-bottom: var(--md-sys-spacing-4);">
                        <div style="display: flex; justify-content: center; align-items: center; margin-bottom: var(--md-sys-spacing-2);">
                            ${this.getMarketIcon(market)}
                            <h4 style="margin: 0 0 0 var(--md-sys-spacing-2); font-weight: 500; color: var(--md-sys-color-on-surface);">
                                ${market}
                            </h4>
                        </div>
                        <div style="font-family: var(--md-sys-typescale-display-large-font); font-size: 2rem; font-weight: 700; color: var(--md-sys-color-primary); margin-bottom: var(--md-sys-spacing-1);">
                            R$ ${marketData.price.toFixed(2)}
                        </div>
                        <small style="color: var(--md-sys-color-on-surface-variant);">
                            por ${marketData.unit}
                            ${packageInfo.displayText ? ` • ${packageInfo.displayText}` : ''}
                        </small>
                    </div>
                    
                    <div style="margin-bottom: var(--md-sys-spacing-4); text-align: center;">
                        <span class="${badgeClass}" style="pointer-events: none;">
                            <span class="material-symbols-outlined">${badgeIcon}</span>
                            ${badgeText}
                        </span>
                    </div>
                    
                    ${!isBestPrice && savings > 0 ? `
                        <div style="background: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container); padding: var(--md-sys-spacing-3); border-radius: var(--md-sys-shape-corner-medium); text-align: center; font-size: 0.875rem; margin-bottom: var(--md-sys-spacing-4);">
                            <span class="material-symbols-outlined" style="font-size: 1rem; vertical-align: middle; margin-right: var(--md-sys-spacing-1);">info</span>
                            R$ ${savings.toFixed(2)} mais caro que o melhor preço
                            ${savingsPercent > 0 ? `<br><small>(+${savingsPercent.toFixed(1)}%)</small>` : ''}
                        </div>
                    ` : ''}
                    
                    ${isBestPrice ? `
                        <div style="background: var(--md-sys-color-success-container); color: var(--md-sys-color-on-success-container); padding: var(--md-sys-spacing-3); border-radius: var(--md-sys-shape-corner-medium); text-align: center; font-size: 0.875rem; margin-bottom: var(--md-sys-spacing-4);">
                            <span class="material-symbols-outlined" style="font-size: 1rem; vertical-align: middle; margin-right: var(--md-sys-spacing-1);">check_circle</span>
                            <strong>Melhor preço disponível!</strong>
                        </div>
                    ` : ''}
                    
                    <div style="display: grid; gap: var(--md-sys-spacing-2);">
                        <button class="md-button ${isBestPrice ? 'md-button-filled' : 'md-button-tonal'}" 
                                onclick="app.addToShoppingList(${product.id}, '${market}', '${packageInfo.displayText || marketData.unit}')"
                                style="width: 100%;">
                            <span class="material-symbols-outlined">add_shopping_cart</span>
                            ${isBestPrice ? 'Adicionar Melhor Preço' : 'Adicionar à Lista'}
                        </button>
                        
                        <button class="md-button md-button-outlined" 
                                onclick="app.showPriceComparison(${product.id})"
                                style="width: 100%;">
                            <span class="material-symbols-outlined">compare_arrows</span>
                            Comparar Preços
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getEmptyProductsHTML() {
        const query = this.elements.searchInput?.value.trim() || '';
        return `
            <div style="grid-column: 1 / -1; text-align: center; padding: var(--md-sys-spacing-12);">
                <span class="material-symbols-outlined" style="font-size: 4rem; color: var(--md-sys-color-outline); display: block; margin-bottom: var(--md-sys-spacing-4);">search_off</span>
                <h3 style="color: var(--md-sys-color-on-surface-variant); margin-bottom: var(--md-sys-spacing-3);">Nenhum produto encontrado</h3>
                <p style="color: var(--md-sys-color-on-surface-variant); margin-bottom: var(--md-sys-spacing-4);">
                    ${query ? `Não encontramos produtos para "${query}"` : 'Tente ajustar os filtros ou termos de busca'}
                </p>
                <button class="md-button md-button-filled" onclick="app.clearSearch()">
                    <span class="material-symbols-outlined">refresh</span>
                    ${query ? 'Limpar busca' : 'Recarregar produtos'}
                </button>
            </div>
        `;
    }

    getMarketIcon(market) {
        const icons = {
            "