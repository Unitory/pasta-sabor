/**
 * Página de Carrinho - Pasta & Sabor
 * Gerencia a exibição do carrinho e FINALIZAÇÃO de pedido
 */

(function() {
    'use strict';

    // Configuração
    const CUSTOMER_STORAGE_KEY = 'pastaesabor_customer';

    // WhatsApp que recebe os pedidos (só números, com 55 + DDD)
    // TESTE: número da Vick. Trocar pelo da loja (5514996394451) antes de lançar.
    const WHATSAPP_NUMBER = '5514998042458';

    // Supabase: registra o pedido e gera o número dele
    const SUPABASE_URL = 'https://ofwpocthtfssffyxagve.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9md3BvY3RodGZzc2ZmeXhhZ3ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMzgzNDgsImV4cCI6MjEwNTcxNDM0OH0.OOUdG9Pem_gwTkbH6Ke9o28E_C8Ua97MwfW5bqMtr5k';
    const db = (window.supabase && window.supabase.createClient)
        ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
        : null;

    /**
     * Registra o pedido no Supabase e devolve o número dele.
     * Se falhar ou demorar mais de 5s, devolve null e o WhatsApp abre mesmo assim.
     */
    async function saveOrder(items, formData) {
        if (!db) return null;
        try {
            const call = db.rpc('place_order', {
                p_customer_name: formData.name,
                p_customer_phone: formData.phone,
                p_items: items.map(function (i) { return { id: i.id, qty: i.qty }; }),
                p_delivery: formData.delivery === 'entrega',
                p_address: formData.address,
                p_reference: formData.reference,
                p_payment: formData.payment,
                p_notes: formData.notes
            });
            const timeout = new Promise(function (resolve) {
                setTimeout(function () { resolve({ data: null, error: 'timeout' }); }, 5000);
            });
            const res = await Promise.race([call, timeout]);
            if (res.error) {
                console.warn('Pedido não registrado no Supabase:', res.error);
                return null;
            }
            return res.data;
        } catch (err) {
            console.warn('Pedido não registrado no Supabase:', err);
            return null;
        }
    }

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
    function buildWhatsAppMessage(formData, orderId) {
        const items = getCartItems();
        const subtotal = getCartTotal();
        const entrega = formData.delivery === 'entrega';
        const fee = entrega ? DELIVERY_FEE : 0;

        // Cabeçalho
        let message = orderId
            ? `Olá! Quero confirmar meu pedido *#${orderId}*:\n\n`
            : 'Olá! Quero confirmar meu pedido:\n\n';

        // Lista de itens
        message += '*Itens do Pedido:*\n';
        let hasConsulte = false;
        items.forEach(function(item) {
            if (item.price > 0) {
                const sub = item.price * item.qty;
                message += `• ${item.qty}x ${item.name} — ${brl(sub)}\n`;
            } else {
                message += `• ${item.qty}x ${item.name} — a combinar\n`;
                hasConsulte = true;
            }
        });

        // Valores
        message += `\n*Subtotal:* ${brl(subtotal)}${hasConsulte ? ' _(itens "a combinar" não incluídos)_' : ''}\n`;
        message += entrega
            ? `*Entrega:* ${brl(fee)}\n`
            : '*Retirada no local:* grátis\n';
        message += `*Total: ${brl(subtotal + fee)}*${hasConsulte ? ' + itens a combinar' : ''}\n\n`;

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
    async function handleCheckout(e) {
        e.preventDefault();

        // Verificar se há itens no carrinho
        const items = getCartItems();
        if (items.length === 0) {
            alert('Seu carrinho está vazio!');
            window.location.href = 'our-menu.html';
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

        // Desabilitar botão imediatamente (evitar duplo envio)
        var btn = document.getElementById('checkout-button');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-check"></i> Enviando...';
        }

        // Abre a aba já no clique (senão o navegador bloqueia o pop-up
        // por causa da espera do Supabase) e depois manda para o WhatsApp
        var waWindow = window.open('', '_blank');

        // Registrar no Supabase e montar a mensagem com o número do pedido
        var orderId = await saveOrder(items, formData);
        var message = buildWhatsAppMessage(formData, orderId);
        var whatsappUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);

        // Mostrar painel de confirmação e limpar carrinho
        showOrderConfirmed(items, formData, orderId);
        clearCart();

        if (waWindow && !waWindow.closed) {
            waWindow.location.href = whatsappUrl;
        } else {
            window.location.href = whatsappUrl;
        }
    }

    /**
     * Exibe o painel de confirmação com resumo do pedido
     * @param {Array} items - Itens do carrinho
     * @param {Object} formData - Dados do formulário
     */
    function showOrderConfirmed(items, formData, orderId) {
        var cartContent = document.getElementById('cart-content');
        var emptyCart = document.getElementById('empty-cart');
        var confirmed = document.getElementById('order-confirmed');

        if (cartContent) cartContent.style.display = 'none';
        if (emptyCart) emptyCart.style.display = 'none';
        if (!confirmed) return;

        // Montar resumo dos itens
        var summaryEl = document.getElementById('oc-summary');
        if (summaryEl) {
            var entrega = formData.delivery === 'entrega';
            var fee = entrega ? DELIVERY_FEE : 0;
            var subtotal = getCartTotal();
            var html = orderId
                ? '<div class="ps-oc-summary-item"><strong>Pedido #' + orderId + '</strong><span></span></div>'
                : '';
            items.forEach(function(item) {
                var sub = item.price > 0
                    ? 'R$ ' + (item.price * item.qty).toFixed(2).replace('.', ',')
                    : 'a combinar';
                html += '<div class="ps-oc-summary-item">' +
                    '<span><span class="qty">' + item.qty + 'x</span>' + item.name + '</span>' +
                    '<span>' + sub + '</span>' +
                    '</div>';
            });
            html += '<div class="ps-oc-summary-total">' +
                '<span>' + (entrega ? 'Total (com entrega)' : 'Total (retirada)') + '</span>' +
                '<span>R$ ' + (subtotal + fee).toFixed(2).replace('.', ',') + '</span>' +
                '</div>';
            summaryEl.innerHTML = html;
        }

        confirmed.style.display = 'block';
        confirmed.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
