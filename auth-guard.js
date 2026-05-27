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

    // 3. CONTROLE DE INTERFACE E REDIRECIONAMENTO UNIFICADO
    document.addEventListener("DOMContentLoaded", () => {
        const elementosRestritos = document.querySelectorAll('.data-role-only');

        elementosRestritos.forEach(elemento => {
            const allowedAttr = elemento.getAttribute('data-allowed');
            if (!allowedAttr) return;

            const rolesPermitidas = allowedAttr.split(',');

            // Se a role do usuário NÃO estiver listada no data-allowed, o link sumirá da barra lateral
            if (!rolesPermitidas.includes(usuarioRole)) {
                elemento.style.display = 'none'; // Esconde o link específico
                
                // Segurança extra: Caso tentem burlar digitando a URL direta na barra do navegador
                const paginaAtual = window.location.pathname.toLowerCase();
                const linkDaPagina = elemento.getAttribute('href').toLowerCase();
                
                if (paginaAtual.includes(linkDaPagina)) {
                    alert("Você não tem permissão para acessar esta página.");
                    
                    // 🔹 ALTERAÇÃO: Todos os usuários sem permissão na página atual são mandados para o Dashboard
                    window.location.href = "Pages/Dashboard.html";
                }
            }
        });
    });
})();