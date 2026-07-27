/**
 * Pasta & Sabor - Sistema de Carrinho de Compras
 *
 * Carrinho MVP em JavaScript puro com persistência em localStorage.
 * Preparado para migração futura para Supabase.
 *
 * Estrutura do carrinho:
 * [{
 *   id: string,        // ID único do produto
 *   name: string,      // Nome do produto
 *   price: number,     // Preço unitário
 *   qty: number        // Quantidade
 * }]
 */

const PastaSaborCart = (function() {
    'use strict';

    // Chave do localStorage
    const STORAGE_KEY = 'ps_cart';

    // Elementos do DOM (carregados após DOM ready)
    let cartBadge = null;
    let cartIcon = null;
    let cartDrawer = null;

    /**
     * Inicialização do carrinho
     * Carrega elementos do DOM e restaura estado do localStorage
     */
    function init() {
        // Aguardar DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', _initAfterDOM);
        } else {
            _initAfterDOM();
        }
    }

    /**
     * Inicialização após DOM carregado
     * @private
     */
    function _initAfterDOM() {
        // Localizar elementos do header
        cartBadge = document.querySelector('.cart-badge');
        cartIcon = document.querySelector('a[href="cart.html"]');

        // Criar drawer do carrinho
        _createCartDrawer();

        // Atualizar badge com contagem do carrinho
        updateCartBadge();

        // Adicionar eventos aos botões de adicionar ao carrinho
        _attachProductButtons();

        // Adicionar evento de clique no ícone do carrinho
        if (cartIcon) {
            cartIcon.addEventListener('click', _toggleCartDrawer);
        }

        // Fechar drawer ao clicar fora
        document.addEventListener('click', _handleOutsideClick);
    }

    /**
     * Obter carrinho do localStorage
     * @returns {Array} Array de itens do carrinho
     */
    function getCart() {
        try {
            const cart = localStorage.getItem(STORAGE_KEY);
            return cart ? JSON.parse(cart) : [];
        } catch (error) {
            console.error('Erro ao ler carrinho do localStorage:', error);
            return [];
        }
    }

    /**
     * Salvar carrinho no localStorage
     * @param {Array} cart - Array de itens do carrinho
     * @private
     */
    function _saveCart(cart) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
        } catch (error) {
            console.error('Erro ao salvar carrinho no localStorage:', error);
        }
    }

    /**
     * Adicionar produto ao carrinho
     * @param {string} id - ID do produto
     * @param {string} name - Nome do produto
     * @param {number|string} price - Preço do produto
     * @returns {boolean} Sucesso da operação
     */
    function addToCart(id, name, price) {
        try {
            const cart = getCart();
            const priceNum = parseFloat(price);

            // Validar entrada
            if (!id || !name || isNaN(priceNum)) {
                console.error('Dados inválidos para adicionar ao carrinho');
                return false;
            }

            // Verificar se produto já está no carrinho
            const existingItem = cart.find(item => item.id === id);

            if (existingItem) {
                // Incrementar quantidade
                existingItem.qty += 1;
            } else {
                // Adicionar novo item
                cart.push({
                    id: id,
                    name: name,
                    price: priceNum,
                    qty: 1
                });
            }

            _saveCart(cart);
            updateCartBadge();
            _updateCartDrawer();
            _showAddedFeedback();

            return true;
        } catch (error) {
            console.error('Erro ao adicionar produto ao carrinho:', error);
            return false;
        }
    }

    /**
     * Remover produto do carrinho
     * @param {string} id - ID do produto
     * @returns {boolean} Sucesso da operação
     */
    function removeFromCart(id) {
        try {
            let cart = getCart();
            cart = cart.filter(item => item.id !== id);

            _saveCart(cart);
            updateCartBadge();
            _updateCartDrawer();

            return true;
        } catch (error) {
            console.error('Erro ao remover produto do carrinho:', error);
            return false;
        }
    }

    /**
     * Atualizar quantidade de um produto
     * @param {string} id - ID do produto
     * @param {number} qty - Nova quantidade
     * @returns {boolean} Sucesso da operação
     */
    function updateQty(id, qty) {
        try {
            const cart = getCart();
            const qtyNum = parseInt(qty);

            if (isNaN(qtyNum) || qtyNum < 0) {
                console.error('Quantidade inválida');
                return false;
            }

            const item = cart.find(item => item.id === id);

            if (!item) {
                console.error('Produto não encontrado no carrinho');
                return false;
            }

            if (qtyNum === 0) {
                // Remover se quantidade for zero
                return removeFromCart(id);
            }

            item.qty = qtyNum;
            _saveCart(cart);
            updateCartBadge();
            _updateCartDrawer();

            return true;
        } catch (error) {
            console.error('Erro ao atualizar quantidade:', error);
            return false;
        }
    }

    /**
     * Obter total do carrinho
     * @returns {number} Valor total
     */
    function getCartTotal() {
        const cart = getCart();
        return cart.reduce((total, item) => {
            return total + (item.price * item.qty);
        }, 0);
    }

    /**
     * Obter contagem total de itens no carrinho
     * @returns {number} Quantidade total de itens
     */
    function getCartCount() {
        const cart = getCart();
        return cart.reduce((count, item) => count + item.qty, 0);
    }

    /**
     * Atualizar badge do carrinho no header
     */
    function updateCartBadge() {
        if (!cartBadge) return;

        const count = getCartCount();
        cartBadge.textContent = count;

        // Adicionar animação de pulse
        cartBadge.classList.add('pulse');
        setTimeout(() => {
            cartBadge.classList.remove('pulse');
        }, 300);
    }

    /**
     * Criar drawer/dropdown do carrinho
     * @private
     */
    function _createCartDrawer() {
        // Verificar se já existe
        if (document.getElementById('ps-cart-drawer')) return;

        const drawer = document.createElement('div');
        drawer.id = 'ps-cart-drawer';
        drawer.className = 'ps-cart-drawer';
        drawer.innerHTML = `
            <div class="ps-cart-header">
                <h3>Meu Carrinho</h3>
                <button class="ps-cart-close" onclick="PastaSaborCart.closeDrawer()">&times;</button>
            </div>
            <div class="ps-cart-items" id="ps-cart-items">
                <!-- Itens serão inseridos aqui -->
            </div>
            <div class="ps-cart-footer">
                <div class="ps-cart-total">
                    <strong>Total:</strong>
                    <span id="ps-cart-total-value">R$ 0,00</span>
                </div>
                <a href="cart.html" class="ps-cart-checkout-btn">Finalizar Pedido</a>
            </div>
        `;

        document.body.appendChild(drawer);
        cartDrawer = drawer;

        _updateCartDrawer();
    }

    /**
     * Atualizar conteúdo do drawer
     * @private
     */
    function _updateCartDrawer() {
        const itemsContainer = document.getElementById('ps-cart-items');
        const totalElement = document.getElementById('ps-cart-total-value');

        if (!itemsContainer || !totalElement) return;

        const cart = getCart();

        if (cart.length === 0) {
            itemsContainer.innerHTML = '<p class="ps-cart-empty">Seu carrinho está vazio</p>';
            totalElement.textContent = 'R$ 0,00';
            return;
        }

        // Renderizar itens
        itemsContainer.innerHTML = cart.map(item => `
            <div class="ps-cart-item" data-id="${item.id}">
                <div class="ps-cart-item-info">
                    <h4>${item.name}</h4>
                    <p class="ps-cart-item-price">R$ ${item.price.toFixed(2)}</p>
                </div>
                <div class="ps-cart-item-controls">
                    <button onclick="PastaSaborCart.decrementQty('${item.id}')" class="ps-qty-btn">−</button>
                    <span class="ps-qty-display">${item.qty}</span>
                    <button onclick="PastaSaborCart.incrementQty('${item.id}')" class="ps-qty-btn">+</button>
                    <button onclick="PastaSaborCart.removeFromCart('${item.id}')" class="ps-remove-btn">🗑️</button>
                </div>
            </div>
        `).join('');

        // Atualizar total
        totalElement.textContent = `R$ ${getCartTotal().toFixed(2)}`;
    }

    /**
     * Toggle drawer do carrinho
     * @private
     */
    function _toggleCartDrawer(e) {
        e.preventDefault();
        e.stopPropagation();

        if (!cartDrawer) return;

        const isOpen = cartDrawer.classList.contains('open');

        if (isOpen) {
            cartDrawer.classList.remove('open');
        } else {
            _updateCartDrawer();
            cartDrawer.classList.add('open');
        }
    }

    /**
     * Fechar drawer
     */
    function closeDrawer() {
        if (cartDrawer) {
            cartDrawer.classList.remove('open');
        }
    }

    /**
     * Tratar cliques fora do drawer
     * @private
     */
    function _handleOutsideClick(e) {
        if (!cartDrawer || !cartDrawer.classList.contains('open')) return;

        // Verificar se clique foi fora do drawer e do ícone do carrinho
        if (!cartDrawer.contains(e.target) && !cartIcon.contains(e.target)) {
            closeDrawer();
        }
    }

    /**
     * Adicionar eventos aos botões de produtos
     * @private
     */
    function _attachProductButtons() {
        // Botões genéricos com onclick="addToCart(...)"
        const addButtons = document.querySelectorAll('[onclick*="addToCart"]');

        addButtons.forEach(button => {
            // Remover onclick inline se existir
            button.removeAttribute('onclick');

            button.addEventListener('click', function(e) {
                e.preventDefault();

                // Buscar dados do produto no elemento pai ou no próprio botão
                const productEl = this.closest('[data-product-id]') || this;

                const id = productEl.dataset.productId;
                const name = productEl.dataset.productName;
                const price = productEl.dataset.productPrice;

                if (id && name && price) {
                    addToCart(id, name, price);
                } else {
                    console.error('Dados do produto não encontrados:', {id, name, price});
                }
            });
        });
    }

    /**
     * Mostrar feedback visual ao adicionar item
     * @private
     */
    function _showAddedFeedback() {
        // Criar notificação temporária
        const notification = document.createElement('div');
        notification.className = 'ps-cart-notification';
        notification.textContent = '✓ Adicionado ao carrinho';

        document.body.appendChild(notification);

        // Animar entrada
        setTimeout(() => notification.classList.add('show'), 10);

        // Remover após 2 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    /**
     * Incrementar quantidade de um item
     * @param {string} id - ID do produto
     */
    function incrementQty(id) {
        const cart = getCart();
        const item = cart.find(item => item.id === id);
        if (item) {
            updateQty(id, item.qty + 1);
        }
    }

    /**
     * Decrementar quantidade de um item
     * @param {string} id - ID do produto
     */
    function decrementQty(id) {
        const cart = getCart();
        const item = cart.find(item => item.id === id);
        if (item && item.qty > 1) {
            updateQty(id, item.qty - 1);
        } else if (item && item.qty === 1) {
            removeFromCart(id);
        }
    }

    /**
     * Limpar todo o carrinho
     */
    function clearCart() {
        _saveCart([]);
        updateCartBadge();
        _updateCartDrawer();
    }

    // Inicializar automaticamente
    init();

    // API pública
    return {
        // Funções principais
        addToCart: addToCart,
        removeFromCart: removeFromCart,
        updateQty: updateQty,

        // Utilitários
        getCart: getCart,
        getCartTotal: getCartTotal,
        getCartCount: getCartCount,
        clearCart: clearCart,

        // Controles de UI
        updateCartBadge: updateCartBadge,
        closeDrawer: closeDrawer,
        incrementQty: incrementQty,
        decrementQty: decrementQty,

        // Para migração futura Supabase
        // TODO: Implementar syncWithSupabase() quando backend estiver pronto
        // TODO: Implementar saveToSupabase() para persistência em nuvem
        // TODO: Implementar loadFromSupabase() para carregar carrinho do usuário logado
    };
})();

// Expor globalmente para uso inline e console
window.PastaSaborCart = PastaSaborCart;
