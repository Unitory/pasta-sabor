/**
 * Pasta & Sabor - Página do Carrinho
 *
 * Lógica específica da página cart.html:
 * - Renderizar itens do carrinho
 * - Gerenciar dados do cliente
 * - Finalizar pedido via WhatsApp
 * - Salvar histórico de pedidos
 */

(function() {
    'use strict';

    // Constantes
    const CUSTOMER_DATA_KEY = 'ps_customer';
    const ORDERS_HISTORY_KEY = 'ps_orders';
    const WHATSAPP_NUMBER = '5514996394451';

    // Elementos do DOM
    let emptyCartState, cartContent, cartItemsTbody, cartPageTotal;
    let checkoutForm, customerName, customerPhone, customerAddress;
    let customerReference, customerNotes, paymentMethod, deliveryMethod;

    /**
     * Inicialização da página
     */
    function init() {
        // Aguardar DOM carregar
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
        // Localizar elementos
        emptyCartState = document.getElementById('empty-cart-state');
        cartContent = document.getElementById('cart-content');
        cartItemsTbody = document.getElementById('cart-items-tbody');
        cartPageTotal = document.getElementById('cart-page-total');
        checkoutForm = document.getElementById('checkout-form');

        // Campos do formulário
        customerName = document.getElementById('customer-name');
        customerPhone = document.getElementById('customer-phone');
        customerAddress = document.getElementById('customer-address');
        customerReference = document.getElementById('customer-reference');
        customerNotes = document.getElementById('customer-notes');
        paymentMethod = document.getElementById('payment-method');
        deliveryMethod = document.getElementById('delivery-method');

        // Renderizar carrinho
        renderCart();

        // Carregar dados salvos do cliente
        loadCustomerData();

        // Adicionar evento ao formulário
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', handleCheckout);
        }

        // Adicionar máscara de telefone
        if (customerPhone) {
            customerPhone.addEventListener('input', _formatPhone);
        }

        // Monitorar mudanças no select de entrega
        if (deliveryMethod) {
            deliveryMethod.addEventListener('change', _handleDeliveryChange);
        }
    }

    /**
     * Renderizar carrinho na página
     */
    function renderCart() {
        const cart = PastaSaborCart.getCart();

        if (!cart || cart.length === 0) {
            // Mostrar estado vazio
            emptyCartState.style.display = 'block';
            cartContent.style.display = 'none';
            return;
        }

        // Mostrar conteúdo do carrinho
        emptyCartState.style.display = 'none';
        cartContent.style.display = 'block';

        // Renderizar itens na tabela
        cartItemsTbody.innerHTML = cart.map(item => {
            const subtotal = item.price * item.qty;
            return `
                <tr data-product-id="${item.id}">
                    <td class="product-name">${item.name}</td>
                    <td class="product-price">R$ ${item.price.toFixed(2)}</td>
                    <td class="product-qty">
                        <div class="qty-controls">
                            <button type="button" class="qty-btn" onclick="decrementCartItem('${item.id}')">−</button>
                            <input type="number" value="${item.qty}" min="1"
                                   onchange="updateCartItem('${item.id}', this.value)"
                                   class="qty-input">
                            <button type="button" class="qty-btn" onclick="incrementCartItem('${item.id}')">+</button>
                        </div>
                    </td>
                    <td class="product-subtotal">R$ ${subtotal.toFixed(2)}</td>
                    <td class="product-remove">
                        <button type="button" class="remove-btn" onclick="removeCartItem('${item.id}')" title="Remover item">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Atualizar total
        updateTotal();
    }

    /**
     * Atualizar total do carrinho
     */
    function updateTotal() {
        const total = PastaSaborCart.getCartTotal();
        if (cartPageTotal) {
            cartPageTotal.textContent = `R$ ${total.toFixed(2)}`;
        }
    }

    /**
     * Incrementar quantidade de um item
     * @param {string} id - ID do produto
     */
    window.incrementCartItem = function(id) {
        PastaSaborCart.incrementQty(id);
        renderCart();
    };

    /**
     * Decrementar quantidade de um item
     * @param {string} id - ID do produto
     */
    window.decrementCartItem = function(id) {
        PastaSaborCart.decrementQty(id);
        renderCart();
    };

    /**
     * Atualizar quantidade de um item
     * @param {string} id - ID do produto
     * @param {number} qty - Nova quantidade
     */
    window.updateCartItem = function(id, qty) {
        const qtyNum = parseInt(qty);
        if (qtyNum > 0) {
            PastaSaborCart.updateQty(id, qtyNum);
            renderCart();
        }
    };

    /**
     * Remover item do carrinho
     * @param {string} id - ID do produto
     */
    window.removeCartItem = function(id) {
        if (confirm('Deseja remover este item do carrinho?')) {
            PastaSaborCart.removeFromCart(id);
            renderCart();
        }
    };

    /**
     * Carregar dados salvos do cliente
     */
    function loadCustomerData() {
        try {
            const saved = localStorage.getItem(CUSTOMER_DATA_KEY);
            if (!saved) return;

            const data = JSON.parse(saved);

            // Preencher campos
            if (customerName && data.name) customerName.value = data.name;
            if (customerPhone && data.phone) customerPhone.value = data.phone;
            if (customerAddress && data.address) customerAddress.value = data.address;
            if (customerReference && data.reference) customerReference.value = data.reference;
            if (paymentMethod && data.payment) paymentMethod.value = data.payment;
            if (deliveryMethod && data.delivery) deliveryMethod.value = data.delivery;

        } catch (error) {
            console.error('Erro ao carregar dados do cliente:', error);
        }
    }

    /**
     * Salvar dados do cliente
     * @param {Object} data - Dados do formulário
     */
    function saveCustomerData(data) {
        try {
            localStorage.setItem(CUSTOMER_DATA_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Erro ao salvar dados do cliente:', error);
        }
    }

    /**
     * Processar checkout
     * @param {Event} e - Evento de submit
     */
    function handleCheckout(e) {
        e.preventDefault();

        const cart = PastaSaborCart.getCart();

        // Validar carrinho não vazio
        if (!cart || cart.length === 0) {
            alert('Seu carrinho está vazio!');
            return;
        }

        // Coletar dados do formulário
        const formData = {
            name: customerName.value.trim(),
            phone: customerPhone.value.trim(),
            address: customerAddress.value.trim(),
            reference: customerReference.value.trim(),
            payment: paymentMethod.value,
            delivery: deliveryMethod.value,
            notes: customerNotes.value.trim()
        };

        // Validar campos obrigatórios
        if (!formData.name || !formData.phone || !formData.payment || !formData.delivery) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        // Se for entrega, endereço é obrigatório
        if (formData.delivery === 'Entrega' && !formData.address) {
            alert('Por favor, informe o endereço para entrega.');
            customerAddress.focus();
            return;
        }

        // Salvar dados do cliente
        saveCustomerData(formData);

        // Montar mensagem do WhatsApp
        const message = buildWhatsAppMessage(cart, formData);

        // Salvar pedido no histórico
        saveOrder(cart, formData);

        // Abrir WhatsApp
        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');

        // Limpar carrinho após 2 segundos (dar tempo de abrir o WhatsApp)
        setTimeout(() => {
            if (confirm('Pedido enviado! Deseja limpar o carrinho?')) {
                PastaSaborCart.clearCart();
                window.location.href = 'index.html';
            }
        }, 2000);
    }

    /**
     * Montar mensagem para WhatsApp
     * @param {Array} cart - Itens do carrinho
     * @param {Object} data - Dados do cliente
     * @returns {string} Mensagem formatada
     */
    function buildWhatsAppMessage(cart, data) {
        let message = '*Olá! Acabei de fazer um pedido no site:*\n\n';

        // Itens do pedido
        message += '*📦 Meu Pedido:*\n';
        cart.forEach(item => {
            const subtotal = item.price * item.qty;
            message += `• ${item.qty}x ${item.name} — R$ ${subtotal.toFixed(2)}\n`;
        });

        // Total
        const total = PastaSaborCart.getCartTotal();
        message += `\n*Total: R$ ${total.toFixed(2)}*\n\n`;

        // Forma de pagamento
        message += `*💳 Pagamento:* ${data.payment}\n\n`;

        // Entrega ou Retirada
        if (data.delivery === 'Entrega') {
            message += `*🚚 Entrega em:*\n${data.address}\n`;
            if (data.reference) {
                message += `Ref: ${data.reference}\n`;
            }
        } else {
            message += `*🏪 Retirada na loja*\n`;
        }

        // Dados do cliente
        message += `\n*👤 Dados:*\n`;
        message += `Nome: ${data.name}\n`;
        message += `Tel: ${data.phone}\n`;

        // Observações
        if (data.notes) {
            message += `\n*📝 Observações:*\n${data.notes}\n`;
        }

        return message;
    }

    /**
     * Salvar pedido no histórico
     * @param {Array} cart - Itens do carrinho
     * @param {Object} data - Dados do cliente
     */
    function saveOrder(cart, data) {
        try {
            // Obter histórico existente
            const history = JSON.parse(localStorage.getItem(ORDERS_HISTORY_KEY) || '[]');

            // Criar novo pedido
            const order = {
                id: Date.now().toString(), // ID único baseado em timestamp
                date: new Date().toISOString(),
                items: cart,
                customer: data,
                total: PastaSaborCart.getCartTotal(),
                status: 'Enviado' // Status inicial
            };

            // Adicionar ao histórico
            history.unshift(order); // Adicionar no início (mais recente primeiro)

            // Limitar histórico a 50 pedidos
            if (history.length > 50) {
                history.pop();
            }

            // Salvar
            localStorage.setItem(ORDERS_HISTORY_KEY, JSON.stringify(history));

        } catch (error) {
            console.error('Erro ao salvar pedido no histórico:', error);
        }
    }

    /**
     * Formatar telefone enquanto digita
     * @private
     */
    function _formatPhone(e) {
        let value = e.target.value.replace(/\D/g, ''); // Remove não-dígitos

        // Aplicar máscara (14) 99999-9999
        if (value.length <= 10) {
            value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
        } else {
            value = value.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
        }

        e.target.value = value;
    }

    /**
     * Tratar mudança no método de entrega
     * @private
     */
    function _handleDeliveryChange(e) {
        const isDelivery = e.target.value === 'Entrega';

        // Tornar endereço obrigatório apenas para entrega
        if (customerAddress) {
            customerAddress.required = isDelivery;

            // Dar feedback visual
            if (isDelivery) {
                customerAddress.parentElement.style.opacity = '1';
                customerReference.parentElement.style.opacity = '1';
            } else {
                customerAddress.parentElement.style.opacity = '0.6';
                customerReference.parentElement.style.opacity = '0.6';
            }
        }
    }

    // Inicializar
    init();

})();
