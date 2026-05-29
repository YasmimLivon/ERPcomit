const TOKEN_KEY = "app_auth_token";

// logout seguro
const btnSair = document.getElementById("btn-sair");
if (btnSair) {
  btnSair.addEventListener("click", () => {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = "../Login.html";
  });
}

const API_URL = "http://localhost:5243/api/Estoque";
const API_PRODUTOS = "http://localhost:5243/api/Produtos";

const btnEntrada = document.querySelector(".btn-entrada");
const btnSaida = document.querySelector(".btn-saida");

const modal = document.getElementById("modalMovimentacao");
const tituloModal = document.getElementById("modalTitulo");

// CAMPOS
const produtoIdInput = document.getElementById("produtoId");
const tipoSelect = document.getElementById("tipo");
const quantidadeInput = document.getElementById("quantidade");
const precoInput = document.getElementById("precoUnitario");
const dataInput = document.getElementById("data");
const pedidoInput = document.getElementById("pedidoId");

const btnConfirmar = document.getElementById("confirmarMov");
const btnCancelar = document.getElementById("cancelarMov");

const inputFiltro = document.getElementById("inputFiltro");

let listaProdutos = [];

// 🔹 CARREGAR PRODUTOS (SELECT)
async function carregarProdutos() {
    try {
        const response = await fetch(API_PRODUTOS);
        const produtos = await response.json();

        if (!produtoIdInput) return;
        produtoIdInput.innerHTML = '<option value="">Selecione um produto</option>';

        if (produtos && Array.isArray(produtos)) {
            produtos.forEach(prod => {
                produtoIdInput.innerHTML += `
                    <option value="${prod.id}">
                        ${prod.nome} (Estoque: ${prod.estoqueAtual})
                    </option>
                `;
            });
        }
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
    }
}

// 🔹 RENDER TABELA
function renderTabela(produtos) {
    const tabela = document.getElementById("tabela-corpo");
    if (!tabela) return;
    tabela.innerHTML = "";

    if (produtos && Array.isArray(produtos)) {
        produtos.forEach(prod => {
            const preco = parseFloat(prod.precoUnitario ?? 0);
            tabela.innerHTML += `
                <tr>
                    <td>${prod.nome}</td>
                    <td>${prod.estoqueAtual}</td>
                    <td>${preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td>${prod.codigo ?? "-"}</td>
                </tr>
            `;
        });
    }
}

// 🔹 CARREGAR ESTOQUE
async function carregarEstoque() {
    try {
        const response = await fetch(API_PRODUTOS);
        listaProdutos = await response.json();
        renderTabela(listaProdutos);
    } catch (error) {
        console.error("Erro ao carregar estoque:", error);
    }
}

// 🔹 FILTRO AUTOMÁTICO
if (inputFiltro) {
    inputFiltro.addEventListener("input", () => {
        const filtro = inputFiltro.value.toLowerCase();

        const filtrados = listaProdutos.filter(prod =>
            (prod.nome && prod.nome.toLowerCase().includes(filtro)) ||
            (prod.codigo && prod.codigo.toLowerCase().includes(filtro)) ||
            (prod.fornecedor && prod.fornecedor.toLowerCase().includes(filtro))
        );

        renderTabela(filtrados);
    });
}

// 🔹 ABRIR MODAL (COM VERIFICAÇÕES DE SEGURANÇA)
if (btnEntrada && modal && tipoSelect) {
    btnEntrada.addEventListener("click", () => {
        if (tituloModal) tituloModal.textContent = "Entrada de Produto";
        tipoSelect.value = 0;
        modal.classList.remove("hidden");
        carregarProdutos();
    });
}

if (btnSaida && modal && tipoSelect) {
    btnSaida.addEventListener("click", () => {
        if (tituloModal) tituloModal.textContent = "Saída de Produto";
        tipoSelect.value = 1;
        modal.classList.remove("hidden");
        carregarProdutos();
    });
}

// 🔹 FECHAR MODAL
if (btnCancelar && modal) {
    btnCancelar.addEventListener("click", () => {
        modal.classList.add("hidden");
    });
}

// 🔹 ENVIAR MOVIMENTAÇÃO
if (btnConfirmar) {
    btnConfirmar.addEventListener("click", async () => {
        if (!produtoIdInput || !quantidadeInput) return;

        const produtoId = parseInt(produtoIdInput.value);
        const quantidade = parseInt(quantidadeInput.value);

        if (!produtoId || !quantidade) {
            alert("Selecione um produto e informe a quantidade!");
            return;
        }

        const body = {
            produtoId: produtoId,
            tipo: parseInt(tipoSelect.value),
            quantidade: quantidade,
            precoUnitario: parseFloat(precoInput.value) || 0,
            data: dataInput.value 
                ? new Date(dataInput.value).toISOString() 
                : new Date().toISOString(),
            pedidoId: pedidoInput.value 
                ? parseInt(pedidoInput.value) 
                : null
        };

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem(TOKEN_KEY)
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const erro = await response.text();
                throw new Error(erro);
            }

            alert("Movimentação realizada com sucesso!");

            if (modal) modal.classList.add("hidden");

            // Limpar campos de forma segura
            if (produtoIdInput) produtoIdInput.value = "";
            if (quantidadeInput) quantidadeInput.value = "";
            if (precoInput) precoInput.value = "";
            if (dataInput) dataInput.value = "";
            if (pedidoInput) pedidoInput.value = "";

            carregarEstoque();

        } catch (error) {
            console.error(error);
            alert("Erro: " + error.message);
        }
    });
}

// 🔹 INICIALIZAÇÃO E TRATAMENTO DE SCROLL
document.addEventListener("DOMContentLoaded", () => {
    carregarEstoque();

    // 📜 ATIVA O SCROLL NA TABELA CASO COMPORTE MUITOS PRODUTOS
    const tabelaCorpo = document.getElementById('tabela-corpo');
    if (tabelaCorpo) {
        const tabelaPai = tabelaCorpo.closest('table')?.parentElement;
        if (tabelaPai) {
            tabelaPai.style.maxHeight = "500px"; // Altura limite fixada
            tabelaPai.style.overflowY = "auto";  // Ativa rolagem vertical
            tabelaPai.style.overflowX = "auto";  // Evita estouro lateral em telas pequenas
        }
    }

    // Fechar se clicar fora da caixa branca do modal
    if (modal) {
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.classList.add("hidden");
            }
        });
    }
});