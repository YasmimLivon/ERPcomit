const API_URL = 'http://localhost:5243/api';
const TOKEN_KEY = 'app_auth_token';

// --- FUNÇÃO AUXILIAR: DECODIFICAR A ROLE DO TOKEN JWT ---
function obterRoleDoToken(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        
        // Retorna a role procurando tanto pela propriedade curta quanto pelo padrão longo do .NET
        return payload["role"] || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    } catch (e) {
        console.error("Erro ao ler a hierarquia do token:", e);
        return null;
    }
}

// --- FUNÇÃO DE REDIRECIONAMENTO COM BASE NA HIERARQUIA ---
function redirecionarPorHierarquia(token) {
    const roleUsuario = obterRoleDoToken(token);

    switch (roleUsuario) {
        case "admin":
            window.location.href = "Pages/Financeiro.html"; 
            break;
            
        case "funcionarios":
            window.location.href = "Pages/folhadepagamento.html";
            break;
            
        case "fornecedor":
            window.location.href = "Pages/Estoque.Html";
            break;
            
        case "cliente":
            window.location.href = "Pages/itempedido.html";
            break;
            
        default:
            // Se cair aqui, a role não foi identificada ou está errada
            alert("⚠️ Usuário sem permissões configuradas no sistema.");
            localStorage.removeItem(TOKEN_KEY);
            window.location.href = "Login.html";
            break;
    }
}

function showMessage(texto, type = "error") {
    const msgBox = document.getElementById("mensagemBox") || document.getElementById("MensagemBox");
    if (!msgBox) return;
    
    msgBox.textContent = texto;
    msgBox.className = type === "error" ? "msg-error" : "msg-success";
    msgBox.style.display = "block";
    msgBox.style.color = type === "error" ? "#ff4d4d" : "#2ecc71"; 

    setTimeout(() => {
        msgBox.style.display = "none";
    }, 4000);
}

// Botao De Sair Global
const btnSair = document.getElementById("btn-sair");
if (btnSair) {
    btnSair.addEventListener("click", () => {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = "Login.html";
    });
}

// Login
const loginForm = document.getElementById("form-login");
if (loginForm) {
    const loginEmail = document.getElementById("login-email");
    const loginPassword = document.getElementById("login-senha");
    const loginButton = document.getElementById("btn-login");

    // Se já estiver logado antes, intercepta e redireciona direto para a página certa da hierarquia
    const tokenSalvo = localStorage.getItem(TOKEN_KEY);
    if (tokenSalvo) {
        redirecionarPorHierarquia(tokenSalvo);
    }

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            loginButton.disabled = true;
            loginButton.textContent = "Entrando...";

            const response = await fetch(`${API_URL}/Login/entrar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: loginEmail.value,
                    password: loginPassword.value
                })
            });

            const dados = await response.json();

            // Verificação específica para erro de credenciais
            if (!response.ok) {
                if (response.status === 401) {
                    alert("❌ Senha incorreta ou usuário não encontrado!"); 
                }
                throw new Error(dados.message || "Erro ao fazer login");
            }

            // Se a API retornou o token com sucesso
            if (dados.token) {
                // 1. Salva o token no navegador
                localStorage.setItem(TOKEN_KEY, dados.token);
                
                // 2. Executa a análise do token e joga para a página correta da hierarquia
                redirecionarPorHierarquia(dados.token);
            }

        } catch (error) {
            if (typeof showMessage === "function") {
                showMessage(error.message, "error");
            }
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = "Entrar";
        }
    });
}