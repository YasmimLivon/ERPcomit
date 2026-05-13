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

// Atalho para selecionar elementos
const $ = (id) => document.getElementById(id);

// Função para fechar qualquer modal
function fecharModais() {
    $("modal-container").style.display = "none";
    $("modal-filtro").style.display = "none";
}

// --- EVENTOS DO MODAL DE CADASTRO ---
// Abrir ao clicar em "Adicionar"
$("btn-abrir-modal").onclick = () => {
    $("form-cadastro").reset(); // Limpa os campos
    $("modal-container").style.display = "flex";
};

// Fechar ao clicar em "Cancelar"
$("btn-fechar-modal").onclick = fecharModais;
// --- EVENTOS DO MODAL DE FILTRO ---
// Abrir ao clicar em "Filtrar"
$("btn-abrir-filtro").onclick = () => {
    $("modal-filtro").style.display = "flex";
};
// Fechar ao clicar em "Cancelar"
$("btn-fechar-filtro").onclick = fecharModais;

// --- FECHAR AO CLICAR FORA ---
// (Opcional: fecha o modal se clicar na parte escura)
window.onclick = (event) => {
    if (event.target.classList.contains('modal-overlay')) {
        fecharModais();
    }
};