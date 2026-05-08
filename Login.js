const API_URL = 'http://localhost:5243/api';
const TOKEN_KEY = 'app_auth_token';

function showMessage(texto, type = "error") {
    const msgBox = document.getElementById("mensagemBox") || document.getElementById("MensagemBox");
    if (!msgBox) return;
    
    msgBox.textContent = texto;
    msgBox.className = type === "error" ? "msg-error" : "msg-success";
    msgBox.style.display = "block";
    msgBox.style.color = type === "error" ? "#ff4d4d" : "#2ecc71"; // Garantia visual

    setTimeout(() => {
        msgBox.style.display = "none";
    }, 4000);
}

    // botao De Sair Global
    const btnSair = document.getElementById("btn-sair");
    if (btnSair) {
        btnSair.addEventListener("click", () => {
            localStorage.removeItem(TOKEN_KEY);
            window.location.href = "Login.html";
        });
    }

//login
const loginForm = document.getElementById("form-login");
if (loginForm) {
    const loginEmail = document.getElementById("login-email");
    const loginPassword = document.getElementById("login-senha");
    const loginButton = document.getElementById("btn-login");

    if (localStorage.getItem(TOKEN_KEY)) {
        window.location.href = "Pages/Forne&Cli.html";
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
                alert("❌ Senha incorreta ou usuário não encontrado!"); // O ALERT QUE VOCÊ PEDIU
            }
            throw new Error(dados.message || "Erro ao fazer login");
        }

        if (dados.token) {
            localStorage.setItem(TOKEN_KEY, dados.token);
            window.location.href = "Pages/Forne&Cli.html";
        }

    } catch (error) {
        // Exibe o erro na sua função de mensagem customizada, se houver
        if (typeof showMessage === "function") {
            showMessage(error.message, "error");
        }
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Entrar";
    }
})};