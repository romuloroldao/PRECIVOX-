/**
 * Precinho Frontend - Material Design 3 + Busca Inteligente
 * Versão 3.2 com busca avançada, sugestões e PDF personalizado
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

        // Busca inteligente em tempo real com sugestões
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
            }, 200); // Reduzido para resposta mais rápida
        });

        // Navegação por teclado no autocomplete
        this.elements.searchInput?.addEventListener('keydown', (e) => {
            const autocomplete = document.getElementById('autocompleteContainer');
            if (!autocomplete || autocomplete.style.display === 'none') return;

            const items = autocomplete.querySelectorAll('[data-suggestion-index]');
            let currentIndex = parseInt(autocomplete.dataset.selectedIndex || '-1');

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentIndex = Math.min(currentIndex + 1, items.length - 1);
                this.highlightAutocompleteItem(items, currentIndex);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentIndex = Math.max(currentIndex - 1, -1);
                this.highlightAutocompleteItem(items, currentIndex);
            } else if (e.key === 'Enter' && currentIndex >= 0) {
                e.preventDefault();
                items[currentIndex].click();
            } else if (e.key === 'Escape') {
                this.hideAutocomplete();
            }

            autocomplete.dataset.selectedIndex = currentIndex;
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

    // Normalização avançada de texto
    normalizeText(text) {
        if (!text) return '';
        
        return text.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove acentos
            .replace(/[^\w\s]/g, ' ') // Remove pontuação, mantém espaços
            .replace(/\s+/g, ' ') // Normaliza espaços múltiplos
            .trim();
    }

    // Função de busca fuzzy melhorada
    fuzzySearch(query, text) {
        const normalizedQuery = this.normalizeText(query);
        const normalizedText = this.normalizeText(text);

        if (!normalizedQuery || !normalizedText) return { score: 0, type: 'none' };

        // Busca exata
        if (normalizedText.includes(normalizedQuery)) {
            const exactPosition = normalizedText.indexOf(normalizedQuery);
            const isWordStart = exactPosition === 0 || normalizedText[exactPosition - 1] === ' ';
            return { 
                score: isWordStart ? 100 : 95, 
                type: 'exact',
                position: exactPosition 
            };
        }

        // Busca por palavras individuais
        const queryWords = normalizedQuery.split(' ').filter(w => w.length > 1);
        const textWords = normalizedText.split(' ');
        
        let matchedWords = 0;
        let partialMatches = 0;
        
        for (const queryWord of queryWords) {
            let wordMatched = false;
            for (const textWord of textWords) {
                if (textWord === queryWord) {
                    matchedWords++;
                    wordMatched = true;
                    break;
                } else if (textWord.includes(queryWord) || queryWord.includes(textWord)) {
                    partialMatches++;
                    wordMatched = true;
                    break;
                } else if (this.calculateLevenshteinDistance(queryWord, textWord) <= 1 && queryWord.length > 3) {
                    partialMatches++;
                    wordMatched = true;
                    break;
                }
            }
        }

        if (matchedWords > 0 || partialMatches > 0) {
            const score = ((matchedWords * 2 + partialMatches) / queryWords.length) * 80;
            return { score, type: 'partial' };
        }

        // Busca por similaridade de subsequências
        let similarity = 0;
        for (let i = 0; i < normalizedQuery.length - 1; i++) {
            const bigram = normalizedQuery.substring(i, i + 2);
            if (normalizedText.includes(bigram)) {
                similarity++;
            }
        }

        const fuzzyScore = (similarity / Math.max(normalizedQuery.length - 1, 1)) * 60;
        return fuzzyScore > 25 ? { score: fuzzyScore, type: 'fuzzy' } : { score: 0, type: 'none' };
    }

    // Distância de Levenshtein para correção de erros de digitação
    calculateLevenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    // Autocomplete inteligente melhorado
    showSmartAutocomplete(query) {
        if (query.length < 1) {
            this.hideAutocomplete();
            return;
        }

        const cacheKey = this.normalizeText(query);
        if (this.autocompleteCache.has(cacheKey)) {
            this.renderAutocomplete(this.autocompleteCache.get(cacheKey), query);
            return;
        }

        const suggestions = new Map(); // Usar Map para evitar duplicatas
        
        this.products.forEach(product => {
            const baseName = product.name.split(' - ')[0];
            const baseKey = this.normalizeText(baseName);
            
            if (suggestions.has(baseKey)) return;

            const nameMatch = this.fuzzySearch(query, product.name);
            const categoryMatch = this.fuzzySearch(query, product.category);
            const brandMatch = this.fuzzySearch(query, product.brand || '');

            const maxScore = Math.max(nameMatch.score, categoryMatch.score, brandMatch.score);

            if (maxScore > 25) {
                suggestions.set(baseKey, {
                    product,
                    score: maxScore,
                    matchType: nameMatch.score === maxScore ? 'name' : 
                              categoryMatch.score === maxScore ? 'category' : 'brand',
                    baseName,
                    nameMatch,
                    categoryMatch,
                    brandMatch
                });
            }
        });

        // Converter Map para Array e ordenar
        const sortedSuggestions = Array.from(suggestions.values())
            .sort((a, b) => {
                // Priorizar matches exatos
                if (a.score !== b.score) return b.score - a.score;
                // Em caso de empate, priorizar matches no nome
                if (a.matchType === 'name' && b.matchType !== 'name') return -1;
                if (b.matchType === 'name' && a.matchType !== 'name') return 1;
                return a.baseName.localeCompare(b.baseName);
            })
            .slice(0, 8);

        this.autocompleteCache.set(cacheKey, sortedSuggestions);
        this.renderAutocomplete(sortedSuggestions, query);
    }

    renderAutocomplete(suggestions, query) {
        if (!suggestions.length) {
            this.hideAutocomplete();
            return;
        }

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
                box-shadow: var(--md-sys-elevation-3);
                max-height: 320px;
                overflow-y: auto;
                z-index: 1000;
                display: none;
            `;
            
            const searchField = this.elements.searchInput.closest('.md-text-field');
            searchField.style.position = 'relative';
            searchField.appendChild(autocompleteContainer);
        }

        const html = suggestions.map((suggestion, index) => {
            const { product, matchType, baseName, score } = suggestion;
            const packageInfo = this.extractPackageInfo(product.name);
            const bestPrice = this.getBestPrice(product);
            
            return `
                <div data-suggestion-index="${index}" 
                     style="padding: var(--md-sys-spacing-3); border-bottom: 1px solid var(--md-sys-color-outline-variant); cursor: pointer; transition: all 0.2s;" 
                     onmouseover="this.style.backgroundColor='var(--md-sys-color-surface-variant)'" 
                     onmouseout="this.style.backgroundColor='transparent'"
                     onclick="app.selectAutocomplete('${baseName.replace(/'/g, "\\'")}')">
                    <div style="display: flex; justify-content: space-between; align-items: start; gap: var(--md-sys-spacing-3);">
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 500; color: var(--md-sys-color-on-surface); margin-bottom: var(--md-sys-spacing-1); word-wrap: break-word;">
                                ${this.highlightMatch(baseName, query)}
                            </div>
                            <div style="display: flex; gap: var(--md-sys-spacing-2); flex-wrap: wrap; align-items: center; margin-bottom: var(--md-sys-spacing-1);">
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
                            <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant);">
                                Match: ${matchType === 'name' ? 'Nome' : matchType === 'category' ? 'Categoria' : 'Marca'} 
                                (${Math.round(score)}%)
                            </div>
                        </div>
                        <div style="text-align: right; flex-shrink: 0;">
                            <div style="font-size: 0.875rem; color: var(--md-sys-color-primary); font-weight: 500;">
                                R$ ${bestPrice.toFixed(2)}
                            </div>
                            <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant);">
                                melhor preço
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        autocompleteContainer.innerHTML = html;
        autocompleteContainer.style.display = 'block';
        autocompleteContainer.dataset.selectedIndex = '-1';
    }

    highlightAutocompleteItem(items, index) {
        items.forEach((item, i) => {
            if (i === index) {
                item.style.backgroundColor = 'var(--md-sys-color-primary-container)';
                item.style.color = 'var(--md-sys-color-on-primary-container)';
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.style.backgroundColor = 'transparent';
                item.style.color = 'inherit';
            }
        });
    }

    highlightMatch(text, query) {
        if (!query || !text) return text;
        
        const normalizedText = this.normalizeText(text);
        const normalizedQuery = this.normalizeText(query);
        
        // Encontrar a melhor correspondência
        let bestMatch = { start: -1, length: 0 };
        
        // Busca exata primeiro
        const exactIndex = normalizedText.indexOf(normalizedQuery);
        if (exactIndex !== -1) {
            bestMatch = { start: exactIndex, length: normalizedQuery.length };
        } else {
            // Busca por palavras
            const queryWords = normalizedQuery.split(' ').filter(w => w.length > 1);
            for (const word of queryWords) {
                const wordIndex = normalizedText.indexOf(word);
                if (wordIndex !== -1) {
                    bestMatch = { start: wordIndex, length: word.length };
                    break;
                }
            }
        }
        
        if (bestMatch.start !== -1) {
            // Mapear posição normalizada para posição original
            let originalStart = bestMatch.start;
            let originalEnd = bestMatch.start + bestMatch.length;
            
            return text.substring(0, originalStart) + 
                   `<mark style="background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); padding: 0 2px; border-radius: 2px; font-weight: 600;">${text.substring(originalStart, originalEnd)}</mark>` + 
                   text.substring(originalEnd);
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
            autocompleteContainer.dataset.selectedIndex = '-1';
        }
    }

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
            
            if (maxScore > 20) { // Limiar mais baixo para maior flexibilidade
                filteredProducts.push({
                    ...product,
                    searchScore: maxScore
                });
            }
        });

        filteredProducts.sort((a, b) => b.searchScore - a.searchScore);

        this.products = filteredProducts.map(({ searchScore, ...product }) => product);
        this.renderProducts();
        this.updateProductCount();
        
        // Mostrar feedback da busca
        if (filteredProducts.length === 0) {
            this.showToast(`🔍 Nenhum resultado para "${query}". Tente termos diferentes.`, 'warning', 4000);
        } else {
            this.showToast(`🔍 ${filteredProducts.length} produto(s) encontrado(s) para "${query}"`, 'success', 3000);
        }
    }

    async performSearch() {
        const query = this.elements.searchInput?.value.trim() || '';
        this.hideAutocomplete();
        
        if (query) {
            await this.performSmartSearch(query);
        } else {
            await this.loadProducts();
            this.showToast('📋 Mostrando todos os produtos', 'info', 2000);
        }
    }

    clearSearch() {
        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
        }
        this.hideAutocomplete();
        this.autocompleteCache.clear();
        this.loadProducts();
    }

    async apiRequest(endpoint) {
        try {
            const response = await fetch(`${this.API_BASE_URL}${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const result = await response.json();
            return result.success ? result.data : result;
        } catch (error) {
            console.error('API Error:', error);
            return this.getMockData();
        }
    }

    getMockData() {
        return [
            {
                id: 1,
                name: "Arroz Branco Tipo 1 - 5kg",
                category: "Grãos e Cereais",
                brand: "Tio João",
                markets: {
                    "Assaí Atacadista": { price: 18.90, unit: "pacote" },
                    "Carrefour": { price: 22.50, unit: "pacote" },
                    "Pão de Açúcar": { price: 24.90, unit: "pacote" }
                }
            },
            {
                id: 2,
                name: "Feijão Preto - 1kg",
                category: "Grãos e Cereais",
                brand: "Camil",
                markets: {
                    "Assaí Atacadista": { price: 8.50, unit: "pacote" },
                    "Carrefour": { price: 9.90, unit: "pacote" },
                    "Pão de Açúcar": { price: 11.20, unit: "pacote" }
                }
            },
            {
                id: 3,
                name: "Óleo de Soja - 900ml",
                category: "Óleos e Azeites", 
                brand: "Soya",
                markets: {
                    "Assaí Atacadista": { price: 4.80, unit: "garrafa" },
                    "Carrefour": { price: 5.50, unit: "garrafa" },
                    "Pão de Açúcar": { price: 6.20, unit: "garrafa" }
                }
            },
            {
                id: 4,
                name: "Açúcar Cristal - 1kg",
                category: "Açúcar e Adoçantes",
                brand: "União",
                markets: {
                    "Assaí Atacadista": { price: 3.20, unit: "pacote" },
                    "Carrefour": { price: 3.80, unit: "pacote" },
                    "Pão de Açúcar": { price: 4.50, unit: "pacote" }
                }
            },
            {
                id: 5,
                name: "Leite Integral UHT - 1L",
                category: "Laticínios",
                brand: "Parmalat",
                markets: {
                    "Assaí Atacadista": { price: 4.20, unit: "caixa" },
                    "Carrefour": { price: 4.80, unit: "caixa" },
                    "Pão de Açúcar": { price: 5.40, unit: "caixa" }
                }
            },
            {
                id: 6,
                name: "Açúcar Refinado Especial - 1kg",
                category: "Açúcar e Adoçantes",
                brand: "Cristal",
                markets: {
                    "Assaí Atacadista": { price: 3.50, unit: "pacote" },
                    "Carrefour": { price: 4.10, unit: "pacote" },
                    "Pão de Açúcar": { price: 4.80, unit: "pacote" }
                }
            },
            {
                id: 7,
                name: "Açúcar Demerara Orgânico - 500g",
                category: "Açúcar e Adoçantes",
                brand: "Native",
                markets: {
                    "Assaí Atacadista": { price: 8.90, unit: "pacote" },
                    "Carrefour": { price: 9.50, unit: "pacote" },
                    "Pão de Açúcar": { price: 10.20, unit: "pacote" }
                }
            }
        ];
    }

    async loadProducts(search = '') {
        try {
            const endpoint = search ? `/products?search=${encodeURIComponent(search)}` : '/products';
            this.products = await this.apiRequest(endpoint);
            this.renderProducts();
            this.updateProductCount();
            
            this.autocompleteCache.clear();
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            this.showToast('❌ Erro ao carregar produtos. Usando dados de demonstração.', 'warning');
        }
    }

    getActiveMarkets() {
        const markets = [];
        if (this.elements.filterAssai?.checked) markets.push('Assaí Atacadista');
        if (this.elements.filterCarrefour?.checked) markets.push('Carrefour');
        if (this.elements.filterPao?.checked) markets.push('Pão de Açúcar');
        return markets;
    }

    renderProducts() {
        if (!this.elements.productCardsContainer) return;

        const activeMarkets = this.getActiveMarkets();
        
        if (this.products.length === 0) {
            this.elements.productCardsContainer.innerHTML = this.getEmptyProductsHTML();
            return;
        }

        const productCards = [];
        
        this.products.forEach(product => {
            Object.entries(product.markets).forEach(([market, marketData]) => {
                if (activeMarkets.includes(market)) {
                    const packageInfo = this.extractPackageInfo(product.name);
                    
                    const allPricesForProduct = Object.entries(product.markets)
                        .filter(([m]) => activeMarkets.includes(m))
                        .map(([, data]) => data.price);
                    
                    const bestPrice = Math.min(...allPricesForProduct);
                    const worstPrice = Math.max(...allPricesForProduct);
                    const isBestPrice = marketData.price === bestPrice;
                    const isExpensive = marketData.price === worstPrice && worstPrice > bestPrice;
                    
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

        const result = { weight: null, volume: null, unit: null, size: null, displayText: null };

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
        
        return discountPercent >= 10;
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
            'Assaí Atacadista': '<span class="material-symbols-outlined" style="color: var(--md-sys-color-primary);">store</span>',
            'Carrefour': '<span class="material-symbols-outlined" style="color: var(--md-sys-color-tertiary);">shopping_cart</span>',
            'Pão de Açúcar': '<span class="material-symbols-outlined" style="color: var(--md-sys-color-warning);">business</span>'
        };
        return icons[market] || '<span class="material-symbols-outlined">store</span>';
    }

    // Shopping List Functions
    loadShoppingList() {
        try {
            const saved = localStorage.getItem('precinho-shopping-list');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Erro ao carregar lista de compras:', error);
            return [];
        }
    }

    saveShoppingList() {
        try {
            localStorage.setItem('precinho-shopping-list', JSON.stringify(this.shoppingList));
        } catch (error) {
            console.error('Erro ao salvar lista de compras:', error);
        }
    }

    addToShoppingList(productId, market, packageInfo) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const marketData = product.markets[market];
        if (!marketData) return;

        const existingItem = this.shoppingList.find(
            item => item.productId === productId && item.market === market
        );

        if (existingItem) {
            existingItem.quantity += 1;
            this.showToast(`📦 Quantidade aumentada para ${existingItem.quantity}`, 'success', 2000);
        } else {
            const newItem = {
                id: Date.now(),
                productId,
                productName: product.name,
                category: product.category,
                brand: product.brand,
                market,
                price: marketData.price,
                unit: marketData.unit,
                packageInfo,
                quantity: 1,
                addedAt: new Date().toISOString()
            };
            
            this.shoppingList.push(newItem);
            this.showToast(`✅ ${product.name} adicionado à lista`, 'success', 3000);
        }

        this.saveShoppingList();
        this.renderShoppingList();
        this.updateCounters();
    }

    removeFromShoppingList(itemId) {
        const itemIndex = this.shoppingList.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return;

        const item = this.shoppingList[itemIndex];
        this.shoppingList.splice(itemIndex, 1);
        
        this.saveShoppingList();
        this.renderShoppingList();
        this.updateCounters();
        
        this.showToast(`🗑️ ${item.productName} removido da lista`, 'info', 2000);
    }

    updateQuantity(itemId, newQuantity) {
        const item = this.shoppingList.find(item => item.id === itemId);
        if (!item) return;

        if (newQuantity <= 0) {
            this.removeFromShoppingList(itemId);
            return;
        }

        item.quantity = parseInt(newQuantity);
        this.saveShoppingList();
        this.renderShoppingList();
        this.updateCounters();
    }

    clearShoppingList() {
        if (this.shoppingList.length === 0) {
            this.showToast('📋 A lista já está vazia', 'info', 2000);
            return;
        }

        const itemCount = this.shoppingList.length;
        this.shoppingList = [];
        this.saveShoppingList();
        this.renderShoppingList();
        this.updateCounters();
        
        this.showToast(`🗑️ ${itemCount} item(s) removido(s) da lista`, 'success', 3000);
    }

    renderShoppingList() {
        if (!this.elements.shoppingListItems || !this.elements.emptyListMessage) return;

        if (this.shoppingList.length === 0) {
            this.elements.emptyListMessage.style.display = 'block';
            this.elements.shoppingListItems.style.display = 'none';
            return;
        }

        this.elements.emptyListMessage.style.display = 'none';
        this.elements.shoppingListItems.style.display = 'block';

        // Agrupar por mercado
        const groupedByMarket = this.shoppingList.reduce((groups, item) => {
            if (!groups[item.market]) {
                groups[item.market] = [];
            }
            groups[item.market].push(item);
            return groups;
        }, {});

        let html = '';
        
        Object.entries(groupedByMarket).forEach(([market, items]) => {
            const marketTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            html += `
                <div class="market-group">
                    <div class="market-header">
                        <div style="display: flex; align-items: center; gap: var(--md-sys-spacing-3);">
                            ${this.getMarketIcon(market)}
                            <h3 style="margin: 0; font-weight: 500;">${market}</h3>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 1.125rem; font-weight: 600;">R$ ${marketTotal.toFixed(2)}</div>
                            <small style="opacity: 0.8;">${items.length} item(s)</small>
                        </div>
                    </div>
                    <div style="padding: var(--md-sys-spacing-4);">
                        ${items.map(item => this.createShoppingListItemHTML(item)).join('')}
                    </div>
                </div>
            `;
        });

        // Adicionar resumo total
        const grandTotal = this.shoppingList.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const totalItems = this.shoppingList.reduce((sum, item) => sum + item.quantity, 0);
        
        html += `
            <div style="background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); padding: var(--md-sys-spacing-6); border-radius: var(--md-sys-shape-corner-medium); margin-top: var(--md-sys-spacing-4);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3 style="margin: 0 0 var(--md-sys-spacing-2) 0;">
                            <span class="material-symbols-outlined" style="vertical-align: middle; margin-right: var(--md-sys-spacing-2);">calculate</span>
                            Total Geral
                        </h3>
                        <p style="margin: 0; opacity: 0.8;">
                            ${totalItems} item(s) • ${Object.keys(groupedByMarket).length} mercado(s)
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.5rem; font-weight: 700;">R$ ${grandTotal.toFixed(2)}</div>
                    </div>
                </div>
            </div>
        `;

        this.elements.shoppingListItems.innerHTML = html;
    }

    createShoppingListItemHTML(item) {
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--md-sys-spacing-3); border: 1px solid var(--md-sys-color-outline-variant); border-radius: var(--md-sys-shape-corner-medium); margin-bottom: var(--md-sys-spacing-3); background: var(--md-sys-color-surface);">
                <div style="flex: 1; min-width: 0;">
                    <h4 style="margin: 0 0 var(--md-sys-spacing-1) 0; font-size: 0.875rem; font-weight: 500; color: var(--md-sys-color-on-surface);">
                        ${item.productName}
                    </h4>
                    <div style="display: flex; flex-wrap: wrap; gap: var(--md-sys-spacing-2); margin-bottom: var(--md-sys-spacing-2);">
                        <span style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); background: var(--md-sys-color-surface-variant); padding: 2px var(--md-sys-spacing-1); border-radius: var(--md-sys-shape-corner-extra-small);">
                            ${item.category}
                        </span>
                        ${item.brand ? `
                            <span style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); background: var(--md-sys-color-surface-variant); padding: 2px var(--md-sys-spacing-1); border-radius: var(--md-sys-shape-corner-extra-small);">
                                ${item.brand}
                            </span>
                        ` : ''}
                        ${item.packageInfo ? `
                            <span style="font-size: 0.75rem; color: var(--md-sys-color-primary); background: var(--md-sys-color-primary-container); padding: 2px var(--md-sys-spacing-1); border-radius: var(--md-sys-shape-corner-extra-small);">
                                ${item.packageInfo}
                            </span>
                        ` : ''}
                    </div>
                    <div style="font-size: 0.875rem; color: var(--md-sys-color-on-surface-variant);">
                        R$ ${item.price.toFixed(2)} por ${item.unit}
                    </div>
                </div>
                
                <div style="display: flex; align-items: center; gap: var(--md-sys-spacing-2); margin-left: var(--md-sys-spacing-3);">
                    <div style="display: flex; align-items: center; gap: var(--md-sys-spacing-1); background: var(--md-sys-color-surface-variant); border-radius: var(--md-sys-shape-corner-medium); padding: var(--md-sys-spacing-1);">
                        <button class="md-button" style="min-width: 32px; min-height: 32px; padding: 0;" 
                                onclick="app.updateQuantity(${item.id}, ${item.quantity - 1})">
                            <span class="material-symbols-outlined" style="font-size: 1rem;">remove</span>
                        </button>
                        <input type="number" value="${item.quantity}" min="1" max="99" 
                               style="width: 50px; text-align: center; border: none; background: transparent; font-weight: 500;"
                               onchange="app.updateQuantity(${item.id}, this.value)">
                        <button class="md-button" style="min-width: 32px; min-height: 32px; padding: 0;" 
                                onclick="app.updateQuantity(${item.id}, ${item.quantity + 1})">
                            <span class="material-symbols-outlined" style="font-size: 1rem;">add</span>
                        </button>
                    </div>
                    
                    <div style="text-align: right; min-width: 80px;">
                        <div style="font-weight: 600; color: var(--md-sys-color-primary);">
                            R$ ${(item.price * item.quantity).toFixed(2)}
                        </div>
                        <small style="color: var(--md-sys-color-on-surface-variant);">
                            ${item.quantity}x
                        </small>
                    </div>
                    
                    <button class="md-button md-button-text" style="min-width: 40px; color: var(--md-sys-color-error);" 
                            onclick="app.removeFromShoppingList(${item.id})">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            </div>
        `;
    }

    updateCounters() {
        const productCount = this.products.length;
        const itemCount = this.shoppingList.reduce((sum, item) => sum + item.quantity, 0);
        
        if (this.elements.productCount) {
            this.elements.productCount.textContent = productCount;
        }
        
        if (this.elements.itemCount) {
            this.elements.itemCount.textContent = itemCount;
        }

        // Habilitar/desabilitar botões baseado no estado da lista
        const hasItems = this.shoppingList.length > 0;
        [this.elements.clearListBtn, this.elements.exportPdfBtn, this.elements.savingsAnalysisBtn]
            .forEach(btn => {
                if (btn) btn.disabled = !hasItems;
            });
    }

    updateProductCount() {
        if (this.elements.productCount) {
            this.elements.productCount.textContent = this.products.length;
        }
    }

    // Comparison Modal
    showPriceComparison(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const activeMarkets = this.getActiveMarkets();
        const marketPrices = Object.entries(product.markets)
            .filter(([market]) => activeMarkets.includes(market))
            .map(([market, data]) => ({ market, ...data }))
            .sort((a, b) => a.price - b.price);

        const bestPrice = marketPrices[0]?.price || 0;
        
        const modalHTML = `
            <div id="comparisonModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: var(--md-sys-spacing-4);">
                <div style="background: var(--md-sys-color-surface); border-radius: var(--md-sys-shape-corner-large); box-shadow: var(--md-sys-elevation-5); max-width: 600px; width: 100%; max-height: 80vh; overflow-y: auto;">
                    <div style="padding: var(--md-sys-spacing-6); border-bottom: 1px solid var(--md-sys-color-outline-variant);">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <h2 style="margin: 0 0 var(--md-sys-spacing-2) 0; color: var(--md-sys-color-primary);">
                                    <span class="material-symbols-outlined" style="vertical-align: middle; margin-right: var(--md-sys-spacing-2);">compare_arrows</span>
                                    Comparação de Preços
                                </h2>
                                <h3 style="margin: 0; font-weight: 500; color: var(--md-sys-color-on-surface);">
                                    ${product.name}
                                </h3>
                            </div>
                            <button class="md-button md-button-text" onclick="app.closeModal('comparisonModal')" style="min-width: 40px;">
                                <span class="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>
                    
                    <div style="padding: var(--md-sys-spacing-6);">
                        ${marketPrices.map((item, index) => {
                            const savings = item.price - bestPrice;
                            const savingsPercent = bestPrice > 0 ? ((savings / bestPrice) * 100) : 0;
                            const isBest = index === 0;
                            
                            return `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--md-sys-spacing-4); border: 2px solid ${isBest ? 'var(--md-sys-color-success)' : 'var(--md-sys-color-outline-variant)'}; border-radius: var(--md-sys-shape-corner-medium); margin-bottom: var(--md-sys-spacing-3); background: ${isBest ? 'var(--md-sys-color-success-container)' : 'var(--md-sys-color-surface)'}>">
                                    <div style="display: flex; align-items: center; gap: var(--md-sys-spacing-3);">
                                        ${this.getMarketIcon(item.market)}
                                        <div>
                                            <h4 style="margin: 0; font-weight: 500;">${item.market}</h4>
                                            <small style="color: var(--md-sys-color-on-surface-variant);">por ${item.unit}</small>
                                        </div>
                                    </div>
                                    
                                    <div style="text-align: right;">
                                        <div style="font-size: 1.25rem; font-weight: 700; color: ${isBest ? 'var(--md-sys-color-success)' : 'var(--md-sys-color-primary)'};">
                                            R$ ${item.price.toFixed(2)}
                                        </div>
                                        ${isBest ? `
                                            <div style="font-size: 0.75rem; color: var(--md-sys-color-success); font-weight: 500;">
                                                <span class="material-symbols-outlined" style="font-size: 0.875rem; vertical-align: middle;">star</span>
                                                MELHOR PREÇO
                                            </div>
                                        ` : savings > 0 ? `
                                            <div style="font-size: 0.75rem; color: var(--md-sys-color-error);">
                                                +R$ ${savings.toFixed(2)} (+${savingsPercent.toFixed(1)}%)
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                        
                        <div style="margin-top: var(--md-sys-spacing-6); text-align: center;">
                            <button class="md-button md-button-filled" onclick="app.addToShoppingList(${productId}, '${marketPrices[0]?.market}', '${this.extractPackageInfo(product.name).displayText || marketPrices[0]?.unit}'); app.closeModal('comparisonModal');">
                                <span class="material-symbols-outlined">add_shopping_cart</span>
                                Adicionar Melhor Preço
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Fechar modal ao clicar fora
        document.getElementById('comparisonModal').addEventListener('click', (e) => {
            if (e.target.id === 'comparisonModal') {
                this.closeModal('comparisonModal');
            }
        });
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
    }

    // Savings Analysis
    showSavingsAnalysis() {
        if (this.shoppingList.length === 0) {
            this.showToast('📋 Adicione itens à lista para ver a análise', 'warning', 3000);
            return;
        }

        const analysis = this.calculateSavingsAnalysis();
        
        const modalHTML = `
            <div id="savingsModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: var(--md-sys-spacing-4);">
                <div style="background: var(--md-sys-color-surface); border-radius: var(--md-sys-shape-corner-large); box-shadow: var(--md-sys-elevation-5); max-width: 700px; width: 100%; max-height: 80vh; overflow-y: auto;">
                    <div style="padding: var(--md-sys-spacing-6); border-bottom: 1px solid var(--md-sys-color-outline-variant);">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <h2 style="margin: 0 0 var(--md-sys-spacing-2) 0; color: var(--md-sys-color-primary);">
                                    <span class="material-symbols-outlined" style="vertical-align: middle; margin-right: var(--md-sys-spacing-2);">analytics</span>
                                    Análise de Economia
                                </h2>
                                <p style="margin: 0; color: var(--md-sys-color-on-surface-variant);">
                                    Como você pode economizar na sua lista de compras
                                </p>
                            </div>
                            <button class="md-button md-button-text" onclick="app.closeModal('savingsModal')" style="min-width: 40px;">
                                <span class="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>
                    
                    <div style="padding: var(--md-sys-spacing-6);">
                        <!-- Resumo Geral -->
                        <div style="background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); padding: var(--md-sys-spacing-4); border-radius: var(--md-sys-shape-corner-medium); margin-bottom: var(--md-sys-spacing-6);">
                            <h3 style="margin: 0 0 var(--md-sys-spacing-3) 0; display: flex; align-items: center; gap: var(--md-sys-spacing-2);">
                                <span class="material-symbols-outlined">savings</span>
                                Resumo da Economia
                            </h3>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--md-sys-spacing-4);">
                                <div style="text-align: center;">
                                    <div style="font-size: 1.5rem; font-weight: 700;">R$ ${analysis.currentTotal.toFixed(2)}</div>
                                    <small>Total Atual</small>
                                </div>
                                <div style="text-align: center;">
                                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--md-sys-color-success);">R$ ${analysis.bestTotal.toFixed(2)}</div>
                                    <small>Melhor Cenário</small>
                                </div>
                                <div style="text-align: center;">
                                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--md-sys-color-success);">R$ ${analysis.totalSavings.toFixed(2)}</div>
                                    <small>Economia Possível</small>
                                </div>
                                <div style="text-align: center;">
                                    <div style="font-size: 1.5rem; font-weight: 700;">${analysis.savingsPercent.toFixed(1)}%</div>
                                    <small>% de Economia</small>
                                </div>
                            </div>
                        </div>

                        <!-- Análise por Mercado -->
                        <div style="margin-bottom: var(--md-sys-spacing-6);">
                            <h3 style="margin: 0 0 var(--md-sys-spacing-4) 0; color: var(--md-sys-color-primary);">
                                <span class="material-symbols-outlined" style="vertical-align: middle; margin-right: var(--md-sys-spacing-2);">store</span>
                                Comparação por Mercado
                            </h3>
                            ${analysis.marketComparison.map(market => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--md-sys-spacing-3); border: 1px solid var(--md-sys-color-outline-variant); border-radius: var(--md-sys-shape-corner-medium); margin-bottom: var(--md-sys-spacing-2);">
                                    <div style="display: flex; align-items: center; gap: var(--md-sys-spacing-3);">
                                        ${this.getMarketIcon(market.name)}
                                        <div>
                                            <h4 style="margin: 0; font-weight: 500;">${market.name}</h4>
                                            <small style="color: var(--md-sys-color-on-surface-variant);">${market.itemCount} item(s) disponível(s)</small>
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-weight: 600; color: var(--md-sys-color-primary);">R$ ${market.total.toFixed(2)}</div>
                                        ${market.savings !== 0 ? `
                                            <small style="color: ${market.savings > 0 ? 'var(--md-sys-color-success)' : 'var(--md-sys-color-error)'};">
                                                ${market.savings > 0 ? '-' : '+'}R$ ${Math.abs(market.savings).toFixed(2)}
                                            </small>
                                        ` : '<small>Referência</small>'}
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <!-- Produtos com Maior Economia -->
                        ${analysis.topSavingsItems.length > 0 ? `
                            <div style="margin-bottom: var(--md-sys-spacing-6);">
                                <h3 style="margin: 0 0 var(--md-sys-spacing-4) 0; color: var(--md-sys-color-primary);">
                                    <span class="material-symbols-outlined" style="vertical-align: middle; margin-right: var(--md-sys-spacing-2);">trending_down</span>
                                    Onde Você Mais Economiza
                                </h3>
                                ${analysis.topSavingsItems.slice(0, 5).map(item => `
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--md-sys-spacing-3); background: var(--md-sys-color-success-container); color: var(--md-sys-color-on-success-container); border-radius: var(--md-sys-shape-corner-medium); margin-bottom: var(--md-sys-spacing-2);">
                                        <div style="flex: 1; min-width: 0;">
                                            <h4 style="margin: 0; font-size: 0.875rem; font-weight: 500;">${item.productName}</h4>
                                            <small>${item.currentMarket} → ${item.bestMarket}</small>
                                        </div>
                                        <div style="text-align: right; font-weight: 600;">
                                            -R$ ${item.savings.toFixed(2)}
                                            <br><small>(${item.savingsPercent.toFixed(1)}%)</small>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}

                        <!-- Recomendações -->
                        <div style="background: var(--md-sys-color-tertiary-container); color: var(--md-sys-color-on-tertiary-container); padding: var(--md-sys-spacing-4); border-radius: var(--md-sys-shape-corner-medium);">
                            <h3 style="margin: 0 0 var(--md-sys-spacing-3) 0; display: flex; align-items: center; gap: var(--md-sys-spacing-2);">
                                <span class="material-symbols-outlined">lightbulb</span>
                                Recomendações Inteligentes
                            </h3>
                            ${analysis.recommendations.map(rec => `
                                <div style="margin-bottom: var(--md-sys-spacing-2); display: flex; align-items: start; gap: var(--md-sys-spacing-2);">
                                    <span class="material-symbols-outlined" style="font-size: 1rem; margin-top: 2px;">arrow_forward</span>
                                    <span>${rec}</span>
                                </div>
                            `).join('')}
                        </div>

                        <div style="margin-top: var(--md-sys-spacing-6); text-align: center;">
                            <button class="md-button md-button-filled" onclick="app.optimizeShoppingList(); app.closeModal('savingsModal');">
                                <span class="material-symbols-outlined">auto_fix_high</span>
                                Otimizar Lista Automaticamente
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        document.getElementById('savingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'savingsModal') {
                this.closeModal('savingsModal');
            }
        });
    }

    calculateSavingsAnalysis() {
        const currentTotal = this.shoppingList.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Calcular melhor cenário
        let bestTotal = 0;
        const topSavingsItems = [];
        const marketTotals = { 'Assaí Atacadista': 0, 'Carrefour': 0, 'Pão de Açúcar': 0 };
        const marketItemCounts = { 'Assaí Atacadista': 0, 'Carrefour': 0, 'Pão de Açúcar': 0 };

        this.shoppingList.forEach(item => {
            const product = this.products.find(p => p.id === item.productId);
            if (!product) {
                bestTotal += item.price * item.quantity;
                return;
            }

            // Encontrar melhor preço
            const marketPrices = Object.entries(product.markets);
            const bestMarket = marketPrices.reduce((best, [market, data]) => 
                data.price < best.price ? { market, price: data.price } : best,
                { market: '', price: Infinity }
            );

            const bestPrice = bestMarket.price * item.quantity;
            const currentPrice = item.price * item.quantity;
            const savings = currentPrice - bestPrice;

            bestTotal += bestPrice;

            if (savings > 0.01) {
                topSavingsItems.push({
                    productName: item.productName,
                    currentMarket: item.market,
                    bestMarket: bestMarket.market,
                    savings: savings,
                    savingsPercent: (savings / currentPrice) * 100
                });
            }

            // Calcular totais por mercado
            marketPrices.forEach(([market, data]) => {
                if (marketTotals.hasOwnProperty(market)) {
                    marketTotals[market] += data.price * item.quantity;
                    marketItemCounts[market]++;
                }
            });
        });

        const totalSavings = currentTotal - bestTotal;
        const savingsPercent = currentTotal > 0 ? (totalSavings / currentTotal) * 100 : 0;

        // Preparar comparação por mercado
        const marketComparison = Object.entries(marketTotals)
            .map(([name, total]) => ({
                name,
                total,
                itemCount: marketItemCounts[name],
                savings: Math.min(...Object.values(marketTotals)) - total
            }))
            .sort((a, b) => a.total - b.total);

        // Gerar recomendações
        const recommendations = [];
        
        if (totalSavings > 10) {
            recommendations.push(`Você pode economizar R$ ${totalSavings.toFixed(2)} escolhendo os melhores preços!`);
        }
        
        if (topSavingsItems.length > 0) {
            recommendations.push(`${topSavingsItems.length} produto(s) tem preços melhores em outros mercados.`);
        }
        
        const bestMarket = marketComparison[0];
        if (bestMarket && bestMarket.itemCount > this.shoppingList.length * 0.6) {
            recommendations.push(`${bestMarket.name} tem os melhores preços para a maioria dos seus itens.`);
        }
        
        if (recommendations.length === 0) {
            recommendations.push('Parabéns! Você já está com uma lista bem otimizada.');
        }

        return {
            currentTotal,
            bestTotal,
            totalSavings,
            savingsPercent,
            topSavingsItems: topSavingsItems.sort((a, b) => b.savings - a.savings),
            marketComparison,
            recommendations
        };
    }

    optimizeShoppingList() {
        let optimizedCount = 0;

        this.shoppingList.forEach(item => {
            const product = this.products.find(p => p.id === item.productId);
            if (!product) return;

            // Encontrar melhor preço
            const marketPrices = Object.entries(product.markets);
            const bestMarket = marketPrices.reduce((best, [market, data]) => 
                data.price < best.price ? { market, price: data.price, unit: data.unit } : best,
                { market: '', price: Infinity, unit: '' }
            );

            if (bestMarket.price < item.price) {
                item.market = bestMarket.market;
                item.price = bestMarket.price;
                item.unit = bestMarket.unit;
                optimizedCount++;
            }
        });

        this.saveShoppingList();
        this.renderShoppingList();
        this.updateCounters();

        if (optimizedCount > 0) {
            this.showToast(`✨ ${optimizedCount} item(s) otimizado(s) para melhores preços!`, 'success', 4000);
        } else {
            this.showToast('✅ Sua lista já está otimizada!', 'success', 3000);
        }
    }

    // PDF Export com layout personalizado
    async exportToPDF() {
        if (this.shoppingList.length === 0) {
            this.showToast('📋 Adicione itens à lista para exportar', 'warning', 3000);
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Configurações do PDF
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            let yPosition = margin;

            // Header com logo e título
            doc.setFillColor(103, 80, 164); // Primary color
            doc.rect(0, 0, pageWidth, 40, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont(undefined, 'bold');
            doc.text('🛒 Precinho', margin, 25);
            
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            doc.text('Lista de Compras Inteligente', margin, 35);

            // Data e hora
            const now = new Date();
            const dateStr = now.toLocaleDateString('pt-BR');
            const timeStr = now.toLocaleTimeString('pt-BR');
            doc.text(`Gerado em: ${dateStr} às ${timeStr}`, pageWidth - margin - 60, 25);

            yPosition = 60;

            // Resumo geral
            const analysis = this.calculateSavingsAnalysis();
            const totalItems = this.shoppingList.reduce((sum, item) => sum + item.quantity, 0);
            
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('Resumo da Lista', margin, yPosition);
            yPosition += 15;

            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            
            // Box do resumo
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 25, 'F');
            doc.setDrawColor(200, 200, 200);
            doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 25);

            const resumeInfo = [
                `Total de Itens: ${totalItems}`,
                `Valor Total: R$ ${analysis.currentTotal.toFixed(2)}`,
                `Economia Possível: R$ ${analysis.totalSavings.toFixed(2)} (${analysis.savingsPercent.toFixed(1)}%)`,
                `Mercados: ${Object.keys(this.shoppingList.reduce((markets, item) => {
                    markets[item.market] = true;
                    return markets;
                }, {})).length}`
            ];

            resumeInfo.forEach((info, index) => {
                const x = margin + 5 + (index % 2) * (pageWidth - 2 * margin) / 2;
                const y = yPosition + Math.floor(index / 2) * 8;
                doc.text(info, x, y);
            });

            yPosition += 35;

            // Agrupar itens por mercado
            const groupedByMarket = this.shoppingList.reduce((groups, item) => {
                if (!groups[item.market]) {
                    groups[item.market] = [];
                }
                groups[item.market].push(item);
                return groups;
            }, {});

            // Lista de itens por mercado
            Object.entries(groupedByMarket).forEach(([market, items]) => {
                // Verificar se precisa de nova página
                if (yPosition > pageHeight - 60) {
                    doc.addPage();
                    yPosition = margin;
                }

                const marketTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

                // Header do mercado
                doc.setFillColor(103, 80, 164);
                doc.rect(margin, yPosition - 2, pageWidth - 2 * margin, 12, 'F');
                
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text(`🏪 ${market}`, margin + 5, yPosition + 6);
                doc.text(`R$ ${marketTotal.toFixed(2)}`, pageWidth - margin - 30, yPosition + 6);
                
                yPosition += 20;

                // Itens do mercado
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(9);
                doc.setFont(undefined, 'normal');

                items.forEach((item, index) => {
                    if (yPosition > pageHeight - 30) {
                        doc.addPage();
                        yPosition = margin;
                    }

                    const itemTotal = item.price * item.quantity;
                    
                    // Linha zebrada
                    if (index % 2 === 0) {
                        doc.setFillColor(248, 248, 248);
                        doc.rect(margin, yPosition - 3, pageWidth - 2 * margin, 10, 'F');
                    }

                    // Nome do produto (limitado para caber na linha)
                    let productName = item.productName;
                    if (productName.length > 50) {
                        productName = productName.substring(0, 47) + '...';
                    }
                    
                    doc.text(productName, margin + 2, yPosition + 3);
                    
                    // Quantidade e preço unitário
                    doc.text(`${item.quantity}x`, margin + 100, yPosition + 3);
                    doc.text(`R$ ${item.price.toFixed(2)}`, margin + 115, yPosition + 3);
                    
                    // Total do item
                    doc.setFont(undefined, 'bold');
                    doc.text(`R$ ${itemTotal.toFixed(2)}`, pageWidth - margin - 25, yPosition + 3);
                    doc.setFont(undefined, 'normal');

                    // Informações adicionais (categoria, marca, embalagem)
                    const additionalInfo = [];
                    if (item.category) additionalInfo.push(item.category);
                    if (item.brand) additionalInfo.push(item.brand);
                    if (item.packageInfo) additionalInfo.push(item.packageInfo);
                    
                    if (additionalInfo.length > 0) {
                        doc.setFontSize(7);
                        doc.setTextColor(100, 100, 100);
                        doc.text(additionalInfo.join(' • '), margin + 2, yPosition + 8);
                        doc.setTextColor(0, 0, 0);
                        doc.setFontSize(9);
                    }

                    yPosition += 12;
                });

                yPosition += 10;
            });

            // Footer com dicas
            if (yPosition > pageHeight - 40) {
                doc.addPage();
                yPosition = margin;
            }

            doc.setFillColor(240, 240, 240);
            doc.rect(margin, yPosition, pageWidth - 2 * margin, 30, 'F');
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text('💡 Dicas de Economia:', margin + 5, yPosition + 10);
            
            doc.setFont(undefined, 'normal');
            doc.setFontSize(8);
            
            const tips = [
                '• Compare sempre os preços por unidade/kg/litro',
                '• Verifique promoções e cupons antes de comprar',
                '• Considere comprar em atacado para itens não perecíveis',
                '• Use o Precinho para otimizar suas compras automaticamente'
            ];

            tips.forEach((tip, index) => {
                doc.text(tip, margin + 5, yPosition + 15 + (index * 5));
            });

            // Rodapé final
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(
                    `Página ${i} de ${pageCount} • Gerado pelo Precinho - Comparador de Preços Inteligente`,
                    margin,
                    pageHeight - 10
                );
            }

            // Salvar PDF
            const fileName = `Lista_Compras_Precinho_${dateStr.replace(/\//g, '-')}.pdf`;
            doc.save(fileName);
            
            this.showToast('📄 PDF exportado com sucesso!', 'success', 4000);
            
        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
            this.showToast('❌ Erro ao exportar PDF. Tente novamente.', 'error', 4000);
        }
    }

    // Toast Notifications
    showToast(message, type = 'info', duration = 3000) {
        if (!this.elements.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning',
            info: 'info'
        };

        toast.innerHTML = `
            <span class="material-symbols-outlined" style="flex-shrink: 0;">${icons[type] || 'info'}</span>
            <span style="flex: 1;">${message}</span>
            <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; padding: 0; margin-left: var(--md-sys-spacing-2);">
                <span class="material-symbols-outlined" style="font-size: 1rem;">close</span>
            </button>
        `;

        this.elements.toastContainer.appendChild(toast);

        // Auto-remover toast
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    }
}

// Inicializar aplicação
const app = new PrecinhoApp();