/**
 * Página de Carrinho - Pasta & Sabor
 * Gerencia a exibição do carrinho e finalização de pedido
 */

(function() {
    'use strict';

    // Configuração
    const CUSTOMER_STORAGE_KEY = 'pastaesabor_customer';

    // ========================================
    // RENDERIZAÇÃO DO CARRINHO
    // ========================================

    const DELIVERY_FEE = 8.00;

    /** Retorna true se a opção escolhida for entrega */
    function isDelivery() {
        const el = document.querySelector('input[name="delivery"]:checked');
        return !el || el.value === 'entrega';
    }

    /** Formata valor em reais */
    function brl(v) {
        return 'R$ ' + v.toFixed(2).replace('.', ',');
    }

    /**
     * Renderiza a lista de itens do carrinho
     */
    function renderCartItems() {
        const items = getCartItems();
        const container = document.getElementById('cart-items-container');

        if (!container) return;

        // Limpar container
        container.innerHTML = '';

        if (items.length === 0) {
            showEmptyCart();
            return;
        }

        showCartContent();

        // Criar tabela de itens
        items.forEach(function(item) {
            const itemRow = createCartItemRow(item);
            container.appendChild(itemRow);
        });

        // Atualizar total
        updateTotalDisplay();
    }

    /**
     * Cria uma linha de item do carrinho
     * @param {Object} item - Item do carrinho
     * @returns {HTMLElement}
     */
    function createCartItemRow(item) {
        const row = document.createElement('div');
        row.className = 'ps-cart-item';

        const subtotal = item.price * item.qty;

        row.innerHTML = `
            <div class="ps-cart-item-info">
                <h6 class="ps-cart-item-name">${item.name}</h6>
                <p class="ps-cart-item-unit">R$ ${item.price.toFixed(2).replace('.', ',')} cada</p>
            </div>
            <div class="ps-cart-qty">
                <button type="button" onclick="decreaseQty('${item.id}')" class="ps-qty-btn" aria-label="Diminuir">
                    <i class="fas fa-minus"></i>
                </button>
                <input type="text" inputmode="numeric" value="${item.qty}" class="ps-qty-input"
                       onchange="updateItemQty('${item.id}', this.value)">
                <button type="button" onclick="increaseQty('${item.id}')" class="ps-qty-btn" aria-label="Aumentar">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
            <div class="ps-cart-item-subtotal">R$ ${subtotal.toFixed(2).replace('.', ',')}</div>
            <button type="button" onclick="removeCartItem('${item.id}')" class="ps-cart-remove" title="Remover">
                <i class="fas fa-trash"></i>
            </button>
        `;

        return row;
    }

    /**
     * Atualiza a exibição do total
     */
    function updateTotalDisplay() {
        const subtotal = getCartTotal();
        const fee = isDelivery() ? DELIVERY_FEE : 0;

        const subEl = document.getElementById('cart-subtotal-display');
        const feeEl = document.getElementById('cart-delivery-display');
        const totalEl = document.getElementById('cart-total-display');
        const noteEl = document.getElementById('cart-delivery-note');

        if (subEl) subEl.textContent = brl(subtotal);
        if (feeEl) feeEl.textContent = fee > 0 ? brl(fee) : 'Grátis';
        if (totalEl) totalEl.textContent = brl(subtotal + fee);
        if (noteEl) noteEl.textContent = fee > 0
            ? 'Taxa de entrega de R$ 8,00 para Barra Bonita'
            : 'Retirada combinada pelo WhatsApp, sem taxa';
    }


    /**
     * Mostra o estado de carrinho vazio
     */
    function showEmptyCart() {
        document.getElementById('empty-cart').style.display = 'block';
        document.getElementById('cart-content').style.display = 'none';
    }

    /**
     * Mostra o conteúdo do carrinho
     */
    function showCartContent() {
        document.getElementById('empty-cart').style.display = 'none';
        document.getElementById('cart-content').style.display = 'flex';
    }

    // ========================================
    // MANIPULAÇÃO DE QUANTIDADE
    // ========================================

    /**
     * Aumenta a quantidade de um item
     * @param {string} id - ID do produto
     */
    window.increaseQty = function(id) {
        const items = getCartItems();
        const item = items.find(function(i) { return i.id === id; });
        if (item) {
            updateQty(id, item.qty + 1);
            renderCartItems();
        }
    };

    /**
     * Diminui a quantidade de um item
     * @param {string} id - ID do produto
     */
    window.decreaseQty = function(id) {
        const items = getCartItems();
        const item = items.find(function(i) { return i.id === id; });
        if (item && item.qty > 1) {
            updateQty(id, item.qty - 1);
            renderCartItems();
        }
    };

    /**
     * Atualiza a quantidade de um item via input
     * @param {string} id - ID do produto
     * @param {string} value - Nova quantidade
     */
    window.updateItemQty = function(id, value) {
        const qty = parseInt(value);
        if (isNaN(qty) || qty < 1) {
            renderCartItems(); // Resetar para valor anterior
            return;
        }
        updateQty(id, qty);
        renderCartItems();
    };

    /**
     * Remove um item do carrinho
     * @param {string} id - ID do produto
     */
    window.removeCartItem = function(id) {
        if (confirm('Deseja remover este item do carrinho?')) {
            removeFromCart(id);
            renderCartItems();
        }
    };

    // ========================================
    // DADOS DO CLIENTE
    // ========================================

    /**
     * Carrega dados salvos do cliente
     */
    function loadCustomerData() {
        try {
            const customerData = localStorage.getItem(CUSTOMER_STORAGE_KEY);
            if (!customerData) return;

            const data = JSON.parse(customerData);

            // Preencher formulário
            if (data.name) document.getElementById('customer-name').value = data.name;
            if (data.phone) document.getElementById('customer-phone').value = data.phone;
            if (data.address) document.getElementById('customer-address').value = data.address;
            if (data.reference) document.getElementById('customer-reference').value = data.reference;

        } catch (error) {
            console.error('Erro ao carregar dados do cliente:', error);
        }
    }

    /**
     * Salva dados do cliente
     * @param {Object} data - Dados do cliente
     */
    function saveCustomerData(data) {
        try {
            localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Erro ao salvar dados do cliente:', error);
        }
    }

    // ========================================
    // FINALIZAÇÃO DO PEDIDO
    // ========================================

    /**
     * Alterna campos conforme entrega ou retirada
     */
    function toggleDeliveryFields() {
        const entrega = isDelivery();
        const campos = document.getElementById('delivery-fields');
        const retirada = document.getElementById('pickup-info');
        const endereco = document.getElementById('customer-address');

        if (campos) campos.style.display = entrega ? '' : 'none';
        if (retirada) retirada.style.display = entrega ? 'none' : 'flex';
        if (endereco) endereco.required = entrega;

        updateTotalDisplay();
    }

    /**
     * Coleta dados do formulário
     * @returns {Object} Dados do formulário
     */
    function collectFormData() {
        return {
            name: document.getElementById('customer-name').value.trim(),
            phone: document.getElementById('customer-phone').value.trim(),
            address: document.getElementById('customer-address').value.trim(),
            reference: document.getElementById('customer-reference').value.trim(),
            notes: document.getElementById('customer-notes').value.trim(),
            payment: document.querySelector('input[name="payment"]:checked')?.value || '',
            delivery: isDelivery() ? 'entrega' : 'retirada'
        };
    }

    /**
     * Valida dados do formulário
     * @param {Object} data - Dados do formulário
     * @returns {boolean}
     */
    function validateFormData(data) {
        if (!data.name) {
            alert('Por favor, preencha seu nome');
            document.getElementById('customer-name').focus();
            return false;
        }

        if (!data.phone) {
            alert('Por favor, preencha seu telefone/WhatsApp');
            document.getElementById('customer-phone').focus();
            return false;
        }

        if (data.delivery === 'entrega' && !data.address) {
            alert('Por favor, preencha o endereço de entrega');
            document.getElementById('customer-address').focus();
            return false;
        }

        if (!data.payment) {
            alert('Por favor, selecione a forma de pagamento');
            return false;
        }

        return true;
    }

    /**
     * Monta a mensagem do WhatsApp
     * @param {Object} formData - Dados do formulário
     * @returns {string} Mensagem formatada
     */
    function buildWhatsAppMessage(formData) {
        const items = getCartItems();
        const subtotal = getCartTotal();
        const entrega = formData.delivery === 'entrega';
        const fee = entrega ? DELIVERY_FEE : 0;

        // Cabeçalho
        let message = 'Olá! Quero confirmar meu pedido:\n\n';

        // Lista de itens
        message += '*Itens do Pedido:*\n';
        items.forEach(function(item) {
            const sub = item.price * item.qty;
            message += `• ${item.qty}x ${item.name} — ${brl(sub)}\n`;
        });

        // Valores
        message += `\n*Subtotal:* ${brl(subtotal)}\n`;
        message += entrega
            ? `*Entrega:* ${brl(fee)}\n`
            : '*Retirada no local:* grátis\n';
        message += `*Total: ${brl(subtotal + fee)}*\n\n`;

        // Forma de pagamento
        message += `*Pagamento:* ${formData.payment}\n\n`;

        // Dados do cliente
        message += entrega ? '*Entrega:*\n' : '*Retirada:*\n';
        message += `${formData.name}\n`;
        message += `${formData.phone}\n`;

        if (entrega) {
            message += `${formData.address}\n`;
            if (formData.reference) {
                message += `Ref: ${formData.reference}\n`;
            }
        }

        // Observações
        if (formData.notes) {
            message += `\n*Observações:*\n${formData.notes}`;
        }

        return message;
    }

    /**
     * Finaliza o pedido e abre WhatsApp
     * @param {Event} e - Evento de submit
     */
    function handleCheckout(e) {
        e.preventDefault();

        // Verificar se há itens no carrinho
        const items = getCartItems();
        if (items.length === 0) {
            alert('Seu carrinho está vazio!');
            window.location.href = 'our-shop.html';
            return;
        }

        // Coletar dados
        const formData = collectFormData();

        // Validar
        if (!validateFormData(formData)) {
            return;
        }

        // Salvar dados do cliente para próximas compras (sem observações)
        saveCustomerData({
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
            reference: formData.reference
        });

        // Montar mensagem
        const message = buildWhatsAppMessage(formData);

        // Codificar para URL
        const encodedMessage = encodeURIComponent(message);

        // Abrir WhatsApp
        const whatsappUrl = `https://wa.me/5514996394451?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');

        // Opcional: Limpar carrinho após enviar (descomentar se desejar)
        // setTimeout(function() {
        //     if (confirm('Pedido enviado! Deseja limpar o carrinho?')) {
        //         clearCart();
        //         window.location.href = 'index.html';
        //     }
        // }, 1000);
    }

    // ========================================
    // INICIALIZAÇÃO
    // ========================================

    /**
     * Inicializa a página do carrinho
     */
    function initCartPage() {
        // Renderizar itens do carrinho
        renderCartItems();

        // Carregar dados salvos do cliente
        loadCustomerData();

        // Configurar evento de submit do formulário
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', handleCheckout);
        }

        // Alternar entre entrega e retirada
        document.querySelectorAll('input[name="delivery"]').forEach(function(radio) {
            radio.addEventListener('change', toggleDeliveryFields);
        });
        toggleDeliveryFields();

        // Escutar mudanças no carrinho
        window.addEventListener('cartUpdated', function() {
            renderCartItems();
        });

        console.log('Página de carrinho inicializada');
    }

    // Inicializar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCartPage);
    } else {
        initCartPage();
    }

})();
