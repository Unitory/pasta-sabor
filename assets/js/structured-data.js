/**
 * Pasta & Sabor - Structured Data (JSON-LD)
 * Schema.org markup para SEO e Google Business
 */

(function() {
  'use strict';

  // Schema: Local Business (Restaurant)
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": "https://pastasabor.vercel.app/#restaurant",
    "name": "Pasta & Sabor",
    "alternateName": "Pasta e Sabor",
    "description": "Massas artesanais feitas à mão em Barra Bonita/SP. Especialidade em talharins, risotos, rondelis, lasanhas e molhos autorais. Produtos congelados para sua praticidade.",
    "url": "https://pastasabor.vercel.app",
    "logo": "https://pastasabor.vercel.app/assets/logo/logo.jpeg",
    "image": [
      "https://pastasabor.vercel.app/assets/logo/logo.jpeg",
      "https://pastasabor.vercel.app/assets/loja/rondelli-damasco.jpeg",
      "https://pastasabor.vercel.app/assets/loja/lasanha-queijo.jpg",
      "https://pastasabor.vercel.app/assets/loja/talharim.jpeg"
    ],
    "priceRange": "$$",
    "servesCuisine": ["Italian", "Brazilian"],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Barra Bonita",
      "addressRegion": "SP",
      "addressCountry": "BR",
      "postalCode": "17340-000"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -22.4925,
      "longitude": -48.5581
    },
    "telephone": "+55-14-99639-4451",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "18:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Saturday",
        "opens": "09:00",
        "closes": "14:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Sunday",
        "opens": "00:00",
        "closes": "00:00",
        "description": "Sob encomenda"
      }
    ],
    "sameAs": [
      "https://www.instagram.com/pastaesabore",
      "https://wa.me/5514996394451"
    ],
    "areaServed": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": -22.4925,
        "longitude": -48.5581
      },
      "geoRadius": "30000"
    },
    "hasMenu": "https://pastasabor.vercel.app/our-menu.html",
    "acceptsReservations": "True"
  };

  // Schema: Organization
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://pastasabor.vercel.app/#organization",
    "name": "Pasta & Sabor",
    "url": "https://pastasabor.vercel.app",
    "logo": "https://pastasabor.vercel.app/assets/logo/logo.jpeg",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+55-14-99639-4451",
      "contactType": "customer service",
      "availableLanguage": "Portuguese",
      "areaServed": "BR"
    },
    "sameAs": [
      "https://www.instagram.com/pastaesabore"
    ]
  };

  // Schema: Website
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://pastasabor.vercel.app/#website",
    "url": "https://pastasabor.vercel.app",
    "name": "Pasta & Sabor",
    "description": "Massas artesanais em Barra Bonita/SP",
    "publisher": {
      "@id": "https://pastasabor.vercel.app/#organization"
    },
    "inLanguage": "pt-BR"
  };

  // Schema: Breadcrumb List (dinâmico por página)
  function getBreadcrumbSchema() {
    const path = window.location.pathname;
    const breadcrumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Início",
          "item": "https://pastasabor.vercel.app/"
        }
      ]
    };

    const pageMap = {
      'about.html': { name: 'Nossa História', position: 2 },
      'our-menu.html': { name: 'Cardápio', position: 2 },
      'our-shop.html': { name: 'Loja', position: 2 },
      'contact.html': { name: 'Contato', position: 2 },
      'shop-details.html': { name: 'Detalhes do Produto', position: 2 },
      'cart.html': { name: 'Carrinho', position: 2 }
    };

    Object.keys(pageMap).forEach(function(page) {
      if (path.includes(page)) {
        breadcrumbs.itemListElement.push({
          "@type": "ListItem",
          "position": pageMap[page].position,
          "name": pageMap[page].name,
          "item": "https://pastasabor.vercel.app/" + page
        });
      }
    });

    return breadcrumbs;
  }

  // Injetar schemas no head
  function injectSchema(schema) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  // Executar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      injectSchema(localBusiness);
      injectSchema(organization);
      injectSchema(website);
      injectSchema(getBreadcrumbSchema());
    });
  } else {
    injectSchema(localBusiness);
    injectSchema(organization);
    injectSchema(website);
    injectSchema(getBreadcrumbSchema());
  }

})();
