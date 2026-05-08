const API_URL = "http://localhost:5243/api";
const TOKEN_KEY = "app_auth_token";

// botao De Sair Global
const btnSair = document.getElementById("btn-sair");
if (btnSair) {
  btnSair.addEventListener("click", () => {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = "../Login.html";
  });
}


const modal = document.getElementById("productModal");
const openBtn = document.getElementById("openModalBtn");
const closeBtn = document.getElementById("closeModalBtn");
const form = document.getElementById("productForm");

// Abrir Modal
openBtn.onclick = function () {
  modal.style.display = "flex";
};

// Fechar Modal no X
closeBtn.onclick = function () {
  modal.style.display = "none";
};

// Fechar ao clicar fora do modal
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

// Simular envio
form.onsubmit = function (e) {
  e.preventDefault();
  alert("Produto salvo com sucesso!");
  modal.style.display = "none";
  form.reset();
};
