/**
 * Sistema de Carrinho de Compras - Pasta & Sabor
 * Versão: 1.0
 * Persistência: localStorage
 *
 * Preparado para futura integração com Supabase
 */

(function() {
    'use strict';

    // Configuração
    const STORAGE_KEY = 'pastaesabor_cart';
    const CART_BADGE_CLASS = 'cart-badge';

    // ========================================
    // UTILIDADES DE STORAGE
    // ========================================

    /**
     * Obtém o carrinho do localStorage
     * @returns {Array} Array de itens do carrinho
     */
    function getCart() {
        try {
            const cartData = localStorage.getItem(STORAGE_KEY);
            return cartData ? JSON.parse(cartData) : [];
        } catch (error) {
            console.error('Erro ao ler carrinho do localStorage:', error);
            return [];
        }
    }

    /**
     * Salva o carrinho no localStorage
     * @param {Array} cart - Array de itens do carrinho
     */
    function saveCart(cart) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
            // Disparar evento customizado para sincronização entre abas
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (error) {
            console.error('Erro ao salvar carrinho no localStorage:', error);
        }
    }

    // ========================================
    // FUNÇÕES DO CARRINHO
    // ========================================

    /**
     * Adiciona ou incrementa um produto no carrinho
     * @param {string} id - ID único do produto
     * @param {string} name - Nome do produto
     * @param {number} price - Preço do produto
     * @param {number} qty - Quantidade a adicionar (padrão: 1)
     */
    window.addToCart = function(id, name = null, price = null, qty = 1) {
        // Se name e price não forem fornecidos, buscar do elemento
        if (!name || price === null) {
            const productElement = document.querySelector(`[data-product-id="${id}"]`);
            if (!productElement) {
                console.error(`Produto com ID "${id}" não encontrado`);
                return;
            }
            name = productElement.getAttribute('data-product-name');
            price = parseFloat(productElement.getAttribute('data-product-price'));
        }

        // Validações
        if (!id || !name) {
            console.error('ID e nome do produto são obrigatórios');
            return;
        }

        if (isNaN(price) || price < 0) {
            console.error('Preço inválido');
            return;
        }

        const cart = getCart();
        const existingItem = cart.find(item => item.id === id);

        if (existingItem) {
            // Incrementar quantidade
            existingItem.qty += qty;
        } else {
            // Adicionar novo item
            cart.push({
                id: id,
                name: name,
                price: price,
                qty: qty
            });
        }

        saveCart(cart);
        updateCartBadge();
        showCartFeedback(name, qty);

        console.log(`Produto "${name}" adicionado ao carrinho (qty: ${qty})`);
    };

    /**
     * Remove um produto do carrinho
     * @param {string} id - ID do produto a remover
     */
    window.removeFromCart = function(id) {
        const cart = getCart();
        const filteredCart = cart.filter(item => item.id !== id);

        if (filteredCart.length < cart.length) {
            saveCart(filteredCart);
            updateCartBadge();
            console.log(`Produto "${id}" removido do carrinho`);
        }
    };

    /**
     * Atualiza a quantidade de um produto no carrinho
     * @param {string} id - ID do produto
     * @param {number} qty - Nova quantidade
     */
    window.updateQty = function(id, qty) {
        qty = parseInt(qty);

        if (isNaN(qty) || qty < 0) {
            console.error('Quantidade inválida');
            return;
        }

        const cart = getCart();
        const item = cart.find(item => item.id === id);

        if (item) {
            if (qty === 0) {
                // Remove do carrinho se quantidade for 0
                removeFromCart(id);
            } else {
                item.qty = qty;
                saveCart(cart);
                updateCartBadge();
                console.log(`Quantidade de "${id}" atualizada para ${qty}`);
            }
        }
    };

    /**
     * Obtém o total do carrinho
     * @returns {number} Valor total
     */
    window.getCartTotal = function() {
        const cart = getCart();
        return cart.reduce((total, item) => {
            return total + (item.price * item.qty);
        }, 0);
    };

    /**
     * Obtém a contagem total de itens no carrinho
     * @returns {number} Total de itens
     */
    window.getCartCount = function() {
        const cart = getCart();
        return cart.reduce((count, item) => {
            return count + item.qty;
        }, 0);
    };

    /**
     * Limpa o carrinho completamente
     */
    window.clearCart = function() {
        saveCart([]);
        updateCartBadge();
        console.log('Carrinho limpo');
    };

    /**
     * Obtém todos os itens do carrinho
     * @returns {Array} Array de itens
     */
    window.getCartItems = function() {
        return getCart();
    };

    // ========================================
    // UI E FEEDBACK VISUAL
    // ========================================

    /**
     * Atualiza o badge de contagem no ícone do carrinho
     */
    function updateCartBadge() {
        const count = getCartCount();
        let badge = document.querySelector(`.${CART_BADGE_CLASS}`);

        if (!badge) {
            // Criar badge se não existir
            const cartIcon = document.querySelector('.cart-icon-container');
            if (cartIcon) {
                badge = document.createElement('span');
                badge.className = CART_BADGE_CLASS;
                cartIcon.appendChild(badge);
            } else {
                return; // Sem ícone de carrinho, nada a fazer
            }
        }

        // Atualizar contagem
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }

    /**
     * Mostra feedback visual quando produto é adicionado
     * @param {string} productName - Nome do produto
     * @param {number} qty - Quantidade adicionada
     */
    function showCartFeedback(productName, qty) {
        // Criar elemento de feedback
        const feedback = document.createElement('div');
        feedback.className = 'cart-feedback';
        feedback.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${qty}x ${productName} adicionado${qty > 1 ? 's' : ''} ao carrinho</span>
        `;

        document.body.appendChild(feedback);

        // Animar entrada
        setTimeout(() => {
            feedback.classList.add('show');
        }, 10);

        // Remover após 3 segundos
        setTimeout(() => {
            feedback.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(feedback);
            }, 300);
        }, 3000);
    }

    /**
     * Adiciona ícone do carrinho ao header (se não existir)
     */
    function addCartIconToHeader() {
        // O header já traz o ícone do carrinho (.header-cart) — não duplicar
        if (document.querySelector('.header-cart') || document.querySelector('.cart-icon-container')) {
            return;
        }

        // Encontrar o header
        const headerInner = document.querySelector('#site-header-inner .wrap-inner');
        if (!headerInner) {
            console.warn('Header não encontrado para adicionar ícone do carrinho');
            return;
        }

        // Criar container do ícone
        const cartContainer = document.createElement('div');
        cartContainer.className = 'header-contact cart-icon-container';
        cartContainer.innerHTML = `
            <a href="cart.html" class="cart-link" title="Ver Carrinho">
                <i class="fas fa-shopping-cart"></i>
                <span class="${CART_BADGE_CLASS}" style="display: none;">0</span>
            </a>
        `;

        // Inserir antes do botão WhatsApp
        const whatsappButton = headerInner.querySelector('.flat-button');
        if (whatsappButton) {
            headerInner.insertBefore(cartContainer, whatsappButton);
        } else {
            headerInner.appendChild(cartContainer);
        }
    }

    /**
     * Adiciona estilos mínimos para o badge e feedback
     */
    function addCartStyles() {
        // Verificar se já existe
        if (document.querySelector('#cart-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'cart-styles';
        style.textContent = `
            .cart-icon-container {
                position: relative;
                display: inline-block;
            }

            .cart-icon-container .cart-link {
                position: relative;
                display: inline-block;
                color: inherit;
                text-decoration: none;
                font-size: 20px;
                padding: 10px;
            }

            .cart-icon-container .cart-link:hover {
                color: #e74c3c;
            }

            /* Feedback de adição ao carrinho */
            .cart-feedback {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #2ecc71;
                color: white;
                padding: 15px 20px;
                border-radius: 4px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 10px;
                transform: translateX(400px);
                transition: transform 0.3s ease;
                max-width: 300px;
            }

            .cart-feedback.show {
                transform: translateX(0);
            }

            .cart-feedback i {
                font-size: 20px;
            }

            .cart-feedback span {
                font-size: 14px;
                line-height: 1.4;
            }

            /* Responsivo */
            @media (max-width: 768px) {
                .cart-feedback {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                    font-size: 13px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ========================================
    // INICIALIZAÇÃO
    // ========================================

    /**
     * Inicializa o sistema de carrinho
     */
    function initCart() {
        // Adicionar estilos
        addCartStyles();

        // Adicionar ícone do carrinho ao header
        addCartIconToHeader();

        // Atualizar badge inicial
        updateCartBadge();

        // Escutar mudanças no localStorage (sincronização entre abas)
        window.addEventListener('storage', function(e) {
            if (e.key === STORAGE_KEY) {
                updateCartBadge();
            }
        });

        // Escutar evento customizado de atualização
        window.addEventListener('cartUpdated', function() {
            updateCartBadge();
        });

        console.log('Sistema de carrinho inicializado');
        console.log(`Itens no carrinho: ${getCartCount()}`);
        console.log(`Total: R$ ${getCartTotal().toFixed(2)}`);
    }

    // Inicializar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCart);
    } else {
        initCart();
    }

    // ========================================
    // PREPARAÇÃO PARA SUPABASE
    // ========================================

    /**
     * TODO: Integração com Supabase
     *
     * Funções a implementar:
     * - syncCartWithSupabase(): Sincronizar carrinho local com banco de dados
     * - saveCartToSupabase(userId, cart): Salvar carrinho do usuário
     * - loadCartFromSupabase(userId): Carregar carrinho do usuário
     * - mergeCartOnLogin(localCart, remoteCart): Mesclar carrinhos após login
     *
     * Estrutura da tabela sugerida:
     * - carts (id, user_id, cart_data, updated_at)
     * ou
     * - cart_items (id, user_id, product_id, product_name, price, qty, created_at)
     */

})();
