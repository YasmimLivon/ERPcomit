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


const btnAdd = document.getElementById("btn-add-produto");
const container = document.getElementById("produtos-container");

btnAdd.addEventListener("click", () => {
  const novoItem = document.createElement("div");
  novoItem.classList.add("produto-item");

  novoItem.innerHTML = `
    <div class="input-row">
      <div class="input-group">
        <label>Produto / Serviço</label>
        <input type="text" name="produto[]" required />
      </div>

      <div class="input-group">
        <label>Quantidade</label>
        <input type="number" name="quantidade[]" required placeholder="0" />
      </div>
    </div>

    <div class="input-group">
      <label>Preço Unitario</label>
      <input type="text" name="preco[]" required placeholder="R$ 0,00" />
    </div>

    <button type="button" class="remover-produto" style="
      background:#ff002b;
      color:white;
      border:none;
      padding:5px 10px;
      border-radius:10px;
      cursor:pointer;
      margin-bottom:10px;
    ">
      Remover
    </button>
  `;

  container.appendChild(novoItem);
});

container.addEventListener("click", function(e) {
  if (e.target.classList.contains("remover-produto")) {
    e.target.parentElement.remove();
  }
});