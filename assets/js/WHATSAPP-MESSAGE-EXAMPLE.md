# Exemplo de Mensagem WhatsApp

## Formato da Mensagem Gerada

Quando o cliente finaliza um pedido em `cart.html`, o sistema monta automaticamente uma mensagem formatada e abre o WhatsApp da loja.

---

## Exemplo 1: Entrega com Pix

```
*Olá! Acabei de fazer um pedido no site:*

*📦 Meu Pedido:*
• 2x Talharim Limone Siciliano — R$ 40.00
• 1x Molho Pomodoro Artesanal — R$ 18.00
• 1x Risoto Funghi Secco — R$ 28.00

*Total: R$ 86.00*

*💳 Pagamento:* Pix

*🚚 Entrega em:*
Rua das Flores, 123, Apto 45, Centro, Jaú/SP
Ref: Próximo ao Mercado São João

*👤 Dados:*
Nome: Maria Silva
Tel: (14) 99999-8888

*📝 Observações:*
Por favor, tocar a campainha quando chegar
```

---

## Exemplo 2: Retirada com Dinheiro

```
*Olá! Acabei de fazer um pedido no site:*

*📦 Meu Pedido:*
• 3x Rondelis de Ricota e Espinafre — R$ 75.00
• 2x Molho Sugo Caseiro — R$ 36.00

*Total: R$ 111.00*

*💳 Pagamento:* Dinheiro

*🏪 Retirada na loja*

*👤 Dados:*
Nome: João Santos
Tel: (14) 98888-7777
```

---

## Exemplo 3: Pedido Simples

```
*Olá! Acabei de fazer um pedido no site:*

*📦 Meu Pedido:*
• 1x Combo Massa + Molho — R$ 35.00

*Total: R$ 35.00*

*💳 Pagamento:* Pix

*🚚 Entrega em:*
Av. Brasil, 500, Jardim América, Jaú/SP

*👤 Dados:*
Nome: Pedro Costa
Tel: (14) 97777-6666
```

---

## Estrutura da Mensagem

### Cabeçalho
```
*Olá! Acabei de fazer um pedido no site:*
```

### Itens do Pedido
```
*📦 Meu Pedido:*
• [QTD]x [NOME DO PRODUTO] — R$ [SUBTOTAL]
```
- Cada linha = 1 produto
- Quantidade x Nome — Subtotal (não preço unitário)

### Total
```
*Total: R$ [VALOR TOTAL]*
```

### Pagamento
```
*💳 Pagamento:* [Pix OU Dinheiro]
```

### Entrega/Retirada

**Se Entrega:**
```
*🚚 Entrega em:*
[Endereço Completo]
Ref: [Ponto de Referência] (se informado)
```

**Se Retirada:**
```
*🏪 Retirada na loja*
```

### Dados do Cliente
```
*👤 Dados:*
Nome: [Nome Completo]
Tel: [Telefone]
```

### Observações (opcional)
```
*📝 Observações:*
[Texto das observações]
```
- Só aparece se cliente preencher o campo

---

## Características

✅ **Formatação Markdown do WhatsApp:**
- `*texto*` = negrito
- Emojis para visual amigável

✅ **Informações Completas:**
- Todos os dados necessários para processar o pedido
- Nada fica faltando

✅ **Legível no Mobile:**
- Quebras de linha apropriadas
- Emojis como marcadores visuais

✅ **Pronto para Copiar/Colar:**
- Loja pode copiar info direto da mensagem
- Não precisa pedir dados adicionais

---

## URL Gerada

### Formato
```
https://wa.me/5514996394451?text=[mensagem URL-encoded]
```

### Exemplo Real (URL-encoded)
```
https://wa.me/5514996394451?text=*Ol%C3%A1!%20Acabei%20de%20fazer%20um%20pedido%20no%20site%3A*%0A%0A*%F0%9F%93%A6%20Meu%20Pedido%3A*%0A%E2%80%A2%202x%20Talharim%20Limone%20Siciliano%20%E2%80%94%20R%24%2040.00%0A%0A*Total%3A%20R%24%2040.00*%0A%0A*%F0%9F%92%B3%20Pagamento%3A*%20Pix%0A%0A*%F0%9F%9A%9A%20Entrega%20em%3A*%0ARua%20das%20Flores%2C%20123%0A%0A*%F0%9F%91%A4%20Dados%3A*%0ANome%3A%20Maria%20Silva%0ATel%3A%20(14)%2099999-8888
```

---

## Implementação no Código

### Função: `buildWhatsAppMessage()`
Arquivo: `assets/js/cart-page.js`

```javascript
function buildWhatsAppMessage(cart, data) {
    let message = '*Olá! Acabei de fazer um pedido no site:*\n\n';
    
    // Itens
    message += '*📦 Meu Pedido:*\n';
    cart.forEach(item => {
        const subtotal = item.price * item.qty;
        message += `• ${item.qty}x ${item.name} — R$ ${subtotal.toFixed(2)}\n`;
    });
    
    // Total
    message += `\n*Total: R$ ${total.toFixed(2)}*\n\n`;
    
    // Pagamento
    message += `*💳 Pagamento:* ${data.payment}\n\n`;
    
    // Entrega/Retirada
    if (data.delivery === 'Entrega') {
        message += `*🚚 Entrega em:*\n${data.address}\n`;
        if (data.reference) {
            message += `Ref: ${data.reference}\n`;
        }
    } else {
        message += `*🏪 Retirada na loja*\n`;
    }
    
    // Dados
    message += `\n*👤 Dados:*\n`;
    message += `Nome: ${data.name}\n`;
    message += `Tel: ${data.phone}\n`;
    
    // Observações
    if (data.notes) {
        message += `\n*📝 Observações:*\n${data.notes}\n`;
    }
    
    return message;
}
```

### Abertura do WhatsApp

```javascript
const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
window.open(whatsappUrl, '_blank');
```

- `WHATSAPP_NUMBER = '5514996394451'`
- `encodeURIComponent()` converte para URL-safe
- `window.open()` abre em nova aba

---

## Benefícios

🎯 **Para o Cliente:**
- Rápido e familiar (usa WhatsApp)
- Vê mensagem antes de enviar
- Pode editar se quiser
- Confirmação visual do pedido

🎯 **Para a Loja:**
- Recebe pedido completo e organizado
- Todos os dados necessários
- Não precisa perguntar nada
- Fácil de copiar/processar
- Inicia conversa com cliente

🎯 **Para o Negócio:**
- Conversão imediata (sem cadastro)
- Baixa fricção no checkout
- Relacionamento direto com cliente
- Flexibilidade (loja pode negociar frete, pagamento, etc.)

---

## Próximos Passos (Futuro)

- [ ] Integração com Supabase para salvar pedidos no backend
- [ ] Notificação automática para a loja (webhook)
- [ ] Cálculo de frete automático (se aplicável)
- [ ] Cupons de desconto
- [ ] Status do pedido em tempo real
