// auth-guard.js

(function verificarEControlarAcesso() {
    const TOKEN_KEY = 'app_auth_token';
    const token = localStorage.getItem(TOKEN_KEY);
    
    // 1. BARREIRA DE SEGURANÇA: Se não tem token, chuta de volta para o Login
    if (!token) {
        alert("Acesso negado. Por favor, faça login.");
        window.location.href = "../Login.html"; 
        return;
    }

    // 2. DECODIFICA O TOKEN
    let usuarioRole = null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        usuarioRole = payload["role"] || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    } catch (e) {
        console.error("Erro ao validar permissões do token:", e);
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = "../Login.html";
        return;
    }

    // 3. CONTROLE DE INTERFACE (Suma apenas com os links <a> restritos)
    document.addEventListener("DOMContentLoaded", () => {
        const elementosRestritos = document.querySelectorAll('.data-role-only');

        elementosRestritos.forEach(elemento => {
            const rolesPermitidas = elemento.getAttribute('data-allowed').split(',');

            // Se a role do usuário NÃO estiver listada no data-allowed, o link <a> some
            if (!rolesPermitidas.includes(usuarioRole)) {
                elemento.style.display = 'none'; // Esconde o link específico
                
                // Segurança extra caso tentem burlar digitando a URL direta na barra do navegador
                const paginaAtual = window.location.pathname.toLowerCase();
                const linkDaPagina = elemento.getAttribute('href').toLowerCase();
                
                if (paginaAtual.includes(linkDaPagina)) {
                    alert("Você não tem permissão para acessar esta página.");
                    
                    // Redireciona para a página padrão permitida daquela role
                    if (usuarioRole === "cliente") window.location.href = "itempedido.html";
                    else if (usuarioRole === "fornecedor") window.location.href = "Estoque.Html";
                    else window.location.href = "folhadepagamento.html";
                }
            }
        });
    });
})();