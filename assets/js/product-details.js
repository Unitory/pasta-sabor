/**
 * Página "Ver mais" (shop-details.html) - Pasta & Sabor
 * Carrega o produto do Supabase pelo ?id= da URL e os relacionados da mesma categoria.
 */
(function () {
    'use strict';

    var SUPABASE_URL = 'https://ofwpocthtfssffyxagve.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9md3BvY3RodGZzc2ZmeXhhZ3ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMzgzNDgsImV4cCI6MjEwNTcxNDM0OH0.OOUdG9Pem_gwTkbH6Ke9o28E_C8Ua97MwfW5bqMtr5k';

    var CATEGORY_LABEL = {
        talharim: 'Talharins', rondeli: 'Rondelis', risoto: 'Risotos', molho: 'Molhos',
        lasanha: 'Lasanhas', sopa: 'Sopas', arroz: 'Arroz & Grão', sal: 'Sal de Todo Dia', acucar: 'Açúcares'
    };

    /*
     * Modo de preparo e conservação padrão de cada categoria.
     * Vale para todos os produtos da categoria, a não ser que o produto
     * tenha um texto próprio no admin (campo "Modo de preparo e conservação").
     * Categoria com texto vazio: o bloco não aparece.
     * Uma linha por item; linhas que terminam com ":" viram subtítulo.
     */
    var CATEGORY_PREP = {
        talharim:
            'Modo de Preparo:\n' +
            '1. Coloque água para ferver em uma panela grande\n' +
            '2. Adicione 1 colher de sopa de sal quando a água ferver\n' +
            '3. Acrescente o talharim e cozinhe por 3 a 4 minutos\n' +
            '4. Escorra e sirva imediatamente com o molho de sua preferência\n' +
            '\n' +
            'Conservação:\n' +
            '• Manter congelado em temperatura de -18°C ou inferior\n' +
            '• Validade: até 3 meses congelado\n' +
            '• Não recongelar após descongelado',
        rondeli: '',
        risoto: '',
        molho: '',
        lasanha: '',
        sopa: '',
        arroz: '',
        sal: '',
        acucar: ''
    };

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    /** Texto simples -> HTML (quebras de linha e subtítulos terminados em ":") */
    function textToHtml(text) {
        return text.split('\n').map(function (line) {
            var t = esc(line.trim());
            if (/:$/.test(t) && t.length < 60) return '<strong>' + t + '</strong>';
            return t;
        }).join('<br>');
    }

    function finalPrice(p) {
        var promo = parseFloat(p.promo_price);
        var price = parseFloat(p.price) || 0;
        return (promo > 0 && promo < price) ? promo : price;
    }

    function priceDisplay(v) {
        if (!v || v <= 0) return 'Consulte';
        return 'R$ ' + (Number.isInteger(v) ? v : v.toFixed(2).replace('.', ','));
    }

    function imageSrc(url) {
        return url || 'assets/loja/talharim.jpeg';
    }

    function done() {
        document.body.classList.remove('ps-loading');
    }

    function showNotFound() {
        var row = document.querySelector('.product-details .row');
        if (row) {
            row.innerHTML =
                '<div class="col-md-12" style="text-align:center;padding:60px 15px">' +
                '<h3 class="name-product">Produto não encontrado</h3>' +
                '<p class="text">Ele pode ter saído do cardápio.</p>' +
                '<a href="our-menu.html" class="tf-button color-text color-style1">Ver o cardápio</a>' +
                '</div>';
        }
        var related = document.querySelector('.wrap-shop-details');
        if (related) related.style.display = 'none';
        done();
    }

    function fillProduct(p) {
        var price = finalPrice(p);
        var catLabel = CATEGORY_LABEL[p.category] || p.category;

        document.title = p.name + ' | Pasta & Sabor';
        var crumb = document.querySelector('.breadcrumbs ul li:last-child');
        if (crumb) crumb.textContent = p.name;

        var img = document.querySelector('.image-details img');
        if (img) { img.src = imageSrc(p.image_url); img.alt = p.name; }

        var box = document.querySelector('.details_content');
        box.setAttribute('data-product-id', p.id);
        box.setAttribute('data-product-name', p.name);
        box.setAttribute('data-product-price', price > 0 ? price : 0);

        box.querySelector('.name-product').textContent = p.name;
        box.querySelector('.pricing').textContent = priceDisplay(price);

        var desc = box.querySelector('p.text');
        if (desc) {
            if (p.description) { desc.textContent = p.description; desc.style.display = ''; }
            else { desc.style.display = 'none'; }
        }

        // Sem preço: mesmo comportamento do cardápio (não adiciona ao carrinho)
        var addBtn = box.querySelector('button.tf-button');
        if (addBtn && price <= 0) {
            addBtn.disabled = true;
            addBtn.title = 'Entre em contato para consultar o preço';
        }

        // Categoria (leva ao cardápio já filtrado) e remove as tags fixas do template
        var cat = box.querySelector('.tag-category .category');
        if (cat) {
            cat.innerHTML = '<li>Categoria:</li><li><a href="our-menu.html?cat=' +
                encodeURIComponent(p.category) + '">' + esc(catLabel) + '</a></li>';
        }
        var tags = box.querySelector('.tag-category .tag');
        if (tags) tags.remove();

        // Descrição e modo de preparo: texto do produto ou padrão da categoria
        var prep = (p.prep_text || '').trim() || CATEGORY_PREP[p.category] || '';
        var prepTitle = document.querySelector('.title-details');
        var prepBlock = prepTitle ? prepTitle.parentNode : null;
        if (prepBlock) {
            if (prep) {
                prepBlock.querySelector('p.text').innerHTML = textToHtml(prep);
                prepTitle.textContent = 'Modo de Preparo e Conservação';
            } else {
                prepBlock.style.display = 'none';
            }
        }
    }

    function relatedCard(p) {
        var price = finalPrice(p);
        var disabled = price <= 0 ? ' disabled title="Entre em contato para consultar o preço"' : '';
        return '<div class="item-box">' +
            '<div class="item" data-product-id="' + esc(p.id) + '" data-product-name="' + esc(p.name) +
                '" data-product-price="' + (price > 0 ? price : 0) + '">' +
                '<div class="hover-effect"><div class="image">' +
                    '<img src="' + esc(imageSrc(p.image_url)) + '" alt="' + esc(p.name) + '" loading="lazy">' +
                '</div></div>' +
                '<div class="product-content">' +
                    '<h6 class="name-product">' + esc(p.name) + '</h6>' +
                    '<p class="pricing">' + priceDisplay(price) + '</p>' +
                '</div>' +
                '<div class="ps-card-actions">' +
                    '<a href="shop-details.html?id=' + encodeURIComponent(p.id) + '" class="ps-btn ps-btn-details">Ver mais</a>' +
                    '<button type="button" class="ps-btn ps-btn-cart"' + disabled + '>Adicionar ao carrinho</button>' +
                '</div>' +
            '</div></div>';
    }

    function fillRelated(list) {
        var section = document.querySelector('.wrap-shop-details');
        var grid = document.querySelector('.items-shop-related');
        if (!grid || !section) return;
        if (!list.length) { section.style.display = 'none'; return; }
        grid.innerHTML = list.map(relatedCard).join('');
    }

    async function init() {
        var id = new URLSearchParams(window.location.search).get('id');
        if (!id) { window.location.replace('our-menu.html'); return; }

        if (!window.supabase || !window.supabase.createClient) { showNotFound(); return; }
        var db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        try {
            var res = await db.from('products').select('*').eq('id', id).eq('active', true).maybeSingle();
            if (res.error || !res.data) { showNotFound(); return; }
            var p = res.data;
            fillProduct(p);

            // Relacionados: mesma categoria primeiro; completa com outros até 4
            var rel = await db.from('products')
                .select('id, name, category, price, promo_price, image_url')
                .eq('active', true).eq('category', p.category).neq('id', p.id)
                .order('sort_order').limit(4);
            var list = rel.data || [];
            if (list.length < 4) {
                var more = await db.from('products')
                    .select('id, name, category, price, promo_price, image_url')
                    .eq('active', true).neq('category', p.category).gt('price', 0)
                    .order('sort_order').limit(4 - list.length);
                list = list.concat(more.data || []);
            }
            fillRelated(list);
        } catch (err) {
            console.error('Erro ao carregar produto:', err);
            showNotFound();
            return;
        }
        done();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
