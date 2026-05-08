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
        window.location.href = "Forne&Cli.html";
    }

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        try{
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

            if(!response.ok) throw new Error(dados.message || "Erro desconhecido");
            

            if(dados.token) {
                localStorage.setItem(TOKEN_KEY, dados.token);
                showMessage("Login bem-sucedido!", "success");
                window.location.href = "Forne&Cli.html";
            }
        } catch (error) {
            showMessage(error.message || "Erro ao tentar entrar");
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = "Entrar";
        }
        });
    }