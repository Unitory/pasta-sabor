/**
 * Pasta & Sabor — Auth Header
 * Atualiza o link "Entrar" para mostrar "Minha conta" quando o cliente está logado
 */
(function () {
  var SB_URL = 'https://ofwpocthtfssffyxagve.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9md3BvY3RodGZzc2ZmeXhhZ3ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMzgzNDgsImV4cCI6MjEwNTcxNDM0OH0.OOUdG9Pem_gwTkbH6Ke9o28E_C8Ua97MwfW5bqMtr5k';

  function initHeaderAuth() {
    // Reutilizar cliente existente ou criar um novo
    var client = window.db || supabase.createClient(SB_URL, SB_KEY);
    if (!window.db) window.db = client;

    client.auth.getSession().then(function (res) {
      var session = res.data && res.data.session;
      if (!session) return; // não logado: link permanece "Entrar"

      var firstName = (
        (session.user.user_metadata && session.user.user_metadata.full_name) ||
        session.user.email
      ).split(' ')[0];

      // Atualizar todos os header-login da página (mobile + desktop)
      document.querySelectorAll('.header-login a').forEach(function (link) {
        link.href = 'minha-conta.html';
        var span = link.querySelector('span');
        if (span) span.textContent = firstName;
        link.setAttribute('title', 'Minha conta');
      });
    });
  }

  // Aguardar Supabase estar disponível
  function waitForSupabase(tries) {
    if (typeof supabase !== 'undefined') {
      initHeaderAuth();
    } else if (tries > 0) {
      setTimeout(function () { waitForSupabase(tries - 1); }, 100);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { waitForSupabase(20); });
  } else {
    waitForSupabase(20);
  }
})();
