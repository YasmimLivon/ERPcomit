// auth-guard.js

// 💡 Transformamos em uma função global para que as telas de Produtos, Pedidos e Parceiros possam chamá-la!
function verificarEControlarAcesso() {
    const TOKEN_KEY = 'app_auth_token';
    const token = localStorage.getItem(TOKEN_KEY);
    
    // 1. BARREIRA DE SEGURANÇA: Se não tem token, chuta de volta para o Login
    if (!token) {
        alert("Acesso negado. Por favor, faça login.");
        window.location.href = "../Index.html"; 
        return;
    }

    // 2. DECODIFICA O TOKEN
    let usuarioRole = null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        
        // Pega a role vinda do JWT e transforma tudo em minúsculo para evitar divergências
        const roleCrua = payload["role"] || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "";
        usuarioRole = roleCrua.toLowerCase().trim();
        
    } catch (e) {
        console.error("Erro ao validar permissões do token:", e);
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = "../Index.html";
        return;
    }

    // 3. CONTROLE DE INTERFACE
    const elementosRestritos = document.querySelectorAll('.data-role-only');

    elementosRestritos.forEach(elemento => {
        const allowedAttr = elemento.getAttribute('data-allowed');
        if (!allowedAttr) return;

        // Transforma os atributos do HTML também em minúsculo para comparar perfeitamente
        const rolesPermitidas = allowedAttr.toLowerCase().split(',').map(r => r.trim());

        // Verifica se a role do usuário bate com o HTML
        const temPermissao = rolesPermitidas.includes(usuarioRole) || 
                             rolesPermitidas.some(role => usuarioRole.includes(role) || role.includes(usuarioRole));

        if (!temPermissao) {
            // Esconde de forma segura se não tiver permissão
            elemento.style.setProperty('display', 'none', 'important'); 
            
            // Só valida redirecionamento de URL se for um link real (tag <a>) com href válido
            const hrefAttr = elemento.getAttribute('href');
            if (hrefAttr) {
                const paginaAtual = window.location.pathname.toLowerCase();
                const linkDaPagina = hrefAttr.toLowerCase();
                
                if (paginaAtual.includes(linkDaPagina)) {
                    alert("Você não tem permissão para acessar esta página.");
                    window.location.href = "Dashboard.html";
                }
            }
        } else {
            // Se o usuário tem permissão, garante que o elemento vai aparecer (remove o display: none se houver)
            elemento.style.removeProperty('display');
        }
    });
}

// 💡 Executa automaticamente assim que a página estrutural carregar
document.addEventListener("DOMContentLoaded", verificarEControlarAcesso);