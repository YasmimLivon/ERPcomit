const TOKEN_KEY = "app_auth_token";
// logout
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

        produtoIdInput.innerHTML = '<option value="">Selecione um produto</option>';

        produtos.forEach(prod => {
            produtoIdInput.innerHTML += `
                <option value="${prod.id}">
                    ${prod.nome} (Estoque: ${prod.estoqueAtual})
                </option>
            `;
        });

    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
    }
}

// 🔹 RENDER TABELA
function renderTabela(produtos) {
    const tabela = document.getElementById("tabela-corpo");
    tabela.innerHTML = "";

    produtos.forEach(prod => {
        tabela.innerHTML += `
            <tr>
                <td>${prod.nome}</td>
                <td>${prod.estoqueAtual}</td>
                <td>${prod.precoUnitario ?? 0}</td>
                <td>${prod.codigo ?? "-"}</td>
                <td>${prod.fornecedor ?? "-"}</td>
            </tr>
        `;
    });
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

// 🔹 ABRIR MODAL
btnEntrada.addEventListener("click", () => {
    tituloModal.textContent = "Entrada de Produto";
    tipoSelect.value = 0;
    modal.classList.remove("hidden");
    carregarProdutos();
});

btnSaida.addEventListener("click", () => {
    tituloModal.textContent = "Saída de Produto";
    tipoSelect.value = 1;
    modal.classList.remove("hidden");
    carregarProdutos();
});

// 🔹 FECHAR MODAL
btnCancelar.addEventListener("click", () => {
    modal.classList.add("hidden");
});

// 🔹 ENVIAR MOVIMENTAÇÃO
btnConfirmar.addEventListener("click", async () => {
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

        modal.classList.add("hidden");

        // limpar campos
        produtoIdInput.value = "";
        quantidadeInput.value = "";
        precoInput.value = "";
        dataInput.value = "";
        pedidoInput.value = "";

        carregarEstoque();

    } catch (error) {
        console.error(error);
        alert("Erro: " + error.message);
    }
});

// 🔹 INICIAR
carregarEstoque();