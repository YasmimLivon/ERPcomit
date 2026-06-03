const API_URL = "https://winxs-api.azurewebsites.net/api";

document.getElementById("registrationForm").onsubmit = async (e) => {
  e.preventDefault();

  // Mapeia os dados do formulário para o JSON aceito pela API
  const payload = {
    nome: document.getElementById("username").value,
    telefone: document.getElementById("numero").value,
    email: document.getElementById("email").value,
    cpf: document.getElementById("cpf").value,
    password: document.getElementById("password").value,
    
    // Captura o valor do novo input de endereço e envia como 'cidade'
    cidade: document.getElementById("endereco").value, 
    
    // Configuração automática padrão para Cliente
    role: "User"
  };

  try {
    const res = await fetch(`${API_URL}/Parceiros/Register-Clientes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Caso sua rota de registro exija o token guardado no localStorage:
        "Authorization": `Bearer ${localStorage.getItem("app_auth_token")}`
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("Conta criada com sucesso!");
      document.getElementById("registrationForm").reset();


    window.location.href = "../Index.html";
    } else {
      const erroTxt = await res.text();
      alert("Erro ao criar conta: " + erroTxt);
    }
  } catch (e) {
    console.error("Erro na conexão:", e);
    alert("Erro de conexão com o servidor.");
  }
};