const API_URL = 'https://winxs-api.azurewebsites.net/api';
const TOKEN_KEY = 'app_auth_token';

const form = document.getElementById("form-login");

if (form) {
    const email = document.getElementById("login-email");
    const senha = document.getElementById("login-senha");
    const btn = document.getElementById("btn-login");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        try {
            btn.disabled = true;
            btn.textContent = "Entrando...";

            // 🔥 ENVIO COMPATÍVEL COM QUALQUER BACKEND
            const body = {
                email: email.value,
                senha: senha.value,
                password: senha.value,
                Email: email.value,
                Password: senha.value
            };

            console.log("📤 Enviando:", body);

            const response = await fetch(`${API_URL}/Login/entrar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

            // 🔥 evita crash se API quebrar
            let dados = {};
            try {
                dados = await response.json();
            } catch {
                console.warn("API não retornou JSON");
            }

            console.log("📥 Resposta:", response.status, dados);

            // 🔴 ERROS
            if (!response.ok) {
                if (response.status === 401) {
                    alert("❌ Email ou senha incorretos");
                } else if (response.status === 500) {
                    alert("💥 Erro interno no servidor (backend)");
                } else {
                    alert("Erro ao fazer login");
                }
                return;
            }

            // 🔥 TOKEN FLEXÍVEL
            const token =
                dados.token ||
                dados.Token ||
                dados.accessToken;

            if (!token) {
                console.error("Sem token:", dados);
                alert("API não retornou token");
                return;
            }

            localStorage.setItem(TOKEN_KEY, token);

            alert("Login realizado com sucesso!");

            window.location.href = "../Pages/Dashboard.html";

        } catch (err) {
            console.error("Erro geral:", err);
            alert("Erro de conexão com servidor");
        } finally {
            btn.disabled = false;
            btn.textContent = "Entrar";
        }
    });
}