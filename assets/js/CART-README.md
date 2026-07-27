# Sistema de Carrinho - Pasta & Sabor

## 📦 Visão Geral

Sistema de carrinho de compras implementado em JavaScript puro com persistência em `localStorage`. Pronto para migração futura para Supabase.

---

## 🚀 Como Usar

### 1. Adicionar Produto ao Carrinho

```javascript
// Via JavaScript
PastaSaborCart.addToCart('produto-id', 'Nome do Produto', 25.90);

// Via HTML (data-attributes no elemento pai)
<div data-product-id="talharim-limone" 
     data-product-name="Talharim Limone" 
     data-product-price="20.00">
    <button class="tf-button">Adicionar ao carrinho</button>
</div>
```

O sistema automaticamente:
- Busca os `data-attributes` do elemento pai
- Adiciona o produto ao carrinho
- Atualiza o badge do header
- Mostra notificação de sucesso
- Persiste no `localStorage`

### 2. Remover Produto

```javascript
PastaSaborCart.removeFromCart('produto-id');
```

### 3. Atualizar Quantidade

```javascript
// Definir quantidade específica
PastaSaborCart.updateQty('produto-id', 3);

// Incrementar
PastaSaborCart.incrementQty('produto-id');

// Decrementar
PastaSaborCart.decrementQty('produto-id');
```

### 4. Obter Informações do Carrinho

```javascript
// Obter carrinho completo
const cart = PastaSaborCart.getCart();
// Retorna: [{id, name, price, qty}, ...]

// Total em reais
const total = PastaSaborCart.getCartTotal();
// Retorna: 125.50

// Quantidade total de itens
const count = PastaSaborCart.getCartCount();
// Retorna: 5
```

### 5. Limpar Carrinho

```javascript
PastaSaborCart.clearCart();
```

---

## 💾 Estrutura de Dados

### localStorage

**Chave:** `ps_cart`

**Formato:**
```json
[
  {
    "id": "talharim-limone",
    "name": "Talharim Limone Siciliano",
    "price": 20.00,
    "qty": 2
  },
  {
    "id": "risoto-funghi",
    "name": "Risoto Funghi Secco",
    "price": 28.00,
    "qty": 1
  }
]
```

---

## 🎨 Interface Visual

### Badge do Carrinho

- Localização: Header, ícone do carrinho
- Atualização: Automática ao modificar carrinho
- Animação: Pulse ao adicionar item

### Drawer Lateral

- **Abertura:** Clique no ícone do carrinho
- **Conteúdo:**
  - Lista de produtos com quantidade
  - Botões +/− para ajustar quantidade
  - Botão 🗑️ para remover item
  - Total do carrinho
  - Botão "Finalizar Pedido" → cart.html

### Notificação

- Aparece no topo direito ao adicionar item
- Duração: 2 segundos
- Cor: Verde (#4caf50)

---

## 🎨 Classes CSS Criadas

| Classe | Descrição |
|--------|-----------|
| `.ps-cart-drawer` | Container do drawer lateral |
| `.ps-cart-header` | Cabeçalho com título e botão fechar |
| `.ps-cart-items` | Container dos itens |
| `.ps-cart-item` | Item individual do carrinho |
| `.ps-cart-item-info` | Informações do produto (nome, preço) |
| `.ps-cart-item-controls` | Controles de quantidade |
| `.ps-qty-btn` | Botões +/− |
| `.ps-qty-display` | Display da quantidade |
| `.ps-remove-btn` | Botão remover |
| `.ps-cart-footer` | Rodapé com total e checkout |
| `.ps-cart-total` | Display do total |
| `.ps-cart-checkout-btn` | Botão finalizar pedido |
| `.ps-cart-notification` | Notificação de sucesso |
| `.ps-cart-empty` | Mensagem carrinho vazio |

---

## 🔧 Integração com Produtos

### HTML Necessário

```html
<div class="item" 
     data-product-id="produto-id"
     data-product-name="Nome do Produto"
     data-product-price="25.90">
    
    <h6>Nome do Produto</h6>
    <p class="pricing">R$ 25.90</p>
    
    <button class="tf-button">Adicionar ao carrinho</button>
</div>
```

**Importante:**
- `data-product-id`: ID único (sem espaços, use kebab-case)
- `data-product-name`: Nome exato do produto
- `data-product-price`: Preço em formato numérico (use ponto, não vírgula)

---

## 🚀 Migração para Supabase (TODO)

### Funções a Implementar

```javascript
/**
 * Sincronizar carrinho local com Supabase
 * Mesclar carrinho do localStorage com carrinho do usuário logado
 */
async function syncWithSupabase() {
    // TODO: Implementar quando backend estiver pronto
    // 1. Verificar se usuário está logado
    // 2. Buscar carrinho do Supabase
    // 3. Mesclar com carrinho local
    // 4. Salvar resultado em ambos os lugares
}

/**
 * Salvar carrinho no Supabase
 */
async function saveToSupabase(cart) {
    // TODO: Implementar quando backend estiver pronto
    // 1. Pegar user_id do usuário logado
    // 2. Upsert no Supabase
}

/**
 * Carregar carrinho do Supabase
 */
async function loadFromSupabase(userId) {
    // TODO: Implementar quando backend estiver pronto
    // 1. Buscar carrinho do usuário
    // 2. Atualizar localStorage
    // 3. Atualizar UI
}
```

### Schema Supabase Sugerido

```sql
-- Tabela de carrinhos
CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Tabela de itens do carrinho
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(cart_id, product_id)
);

-- Índices para performance
CREATE INDEX idx_cart_user ON carts(user_id);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
```

### Row Level Security (RLS)

```sql
-- Usuário só pode ver seu próprio carrinho
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own cart" ON carts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own cart" ON carts
    FOR UPDATE USING (auth.uid() = user_id);

-- Mesma lógica para cart_items
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own cart items" ON cart_items
    FOR SELECT USING (
        cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid())
    );
```

---

## 🐛 Debug

### Console do Navegador

```javascript
// Ver carrinho completo
console.log(PastaSaborCart.getCart());

// Ver total
console.log('Total: R$', PastaSaborCart.getCartTotal().toFixed(2));

// Ver contagem
console.log('Itens:', PastaSaborCart.getCartCount());

// Limpar carrinho (útil para testes)
PastaSaborCart.clearCart();
```

### localStorage

```javascript
// Ver no console do navegador
localStorage.getItem('ps_cart');

// Limpar manualmente
localStorage.removeItem('ps_cart');
```

---

## 📝 Notas de Desenvolvimento

1. **Validação de Entrada:** Todos os métodos validam entrada antes de processar
2. **Persistência:** Todas as operações persistem automaticamente no localStorage
3. **UI Reativa:** Badge e drawer atualizam automaticamente
4. **Performance:** Operações O(n) onde n é o número de itens (geralmente < 20)
5. **Mobile:** Drawer ocupa 100% da tela em dispositivos móveis

---

## 🔐 Segurança

- ❌ **Não validar preços no frontend** (usuário pode manipular localStorage)
- ✅ **Validar tudo no backend** quando implementar Supabase
- ✅ **Recalcular total no servidor** antes de processar pedido
- ✅ **Verificar estoque no servidor** antes de confirmar

---

## 📱 Responsividade

- Desktop: Drawer 400px de largura
- Mobile: Drawer 100% da tela
- Touch-friendly: Botões com área de toque adequada

---

## 🎯 Próximos Passos

1. [ ] Implementar página cart.html completa
2. [ ] Integrar com Supabase (autenticação)
3. [ ] Sincronização carrinho local ↔ nuvem
4. [ ] Webhook para enviar pedido via WhatsApp
5. [ ] Adicionar cupons de desconto
6. [ ] Adicionar cálculo de frete (se aplicável)
