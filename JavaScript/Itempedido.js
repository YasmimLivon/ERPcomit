document.addEventListener("DOMContentLoaded", () => {

    const TOKEN_KEY = "app_auth_token";
    const API_URL = "http://localhost:5243/api/ItemPedido";

    // ELEMENTS
    const modal = document.getElementById("modal-container");
    const btnAbrirModal = document.getElementById("openModalBtn");
    const btnFecharModal = document.getElementById("btn-fechar-modal");
    const formCadastro = document.getElementById("form-cadastro");
    const tabelaCorpo = document.querySelector("tbody");
    const filtroInput = document.getElementById("inputFiltro");

    // INPUTS FORM
    const pedidoIdInput = document.getElementById("pedidoId");
    const produtoIdInput = document.getElementById("produtoId");
    const quantidadeInput = document.getElementById("quantidade");
    const precoUnitarioInput = document.getElementById("precoUnitario");
    const descricaoInput = document.getElementById("descricao");
    const btnSalvarModal = document.getElementById("btn-salvar-modal");

    let listaVendasGlobal = [];
    let idItemEditando = null;

    // AUTH HEADERS
    function getAuthHeaders() {
        const token = localStorage.getItem(TOKEN_KEY);
        return {
            "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` })
        };
    }

    // LOGOUT
    document.getElementById("btn-sair")?.addEventListener("click", () => {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = "../Login.html";
    });

    // CONTROL MODAL
    if (btnAbrirModal) {
        btnAbrirModal.onclick = () => {
            idItemEditando = null;
            formCadastro.reset();
            document.getElementById("role").value = "User";
            if (btnSalvarModal) {
                btnSalvarModal.innerText = "Salvar";
                delete btnSalvarModal.dataset.idAtual;
            }
            modal.style.display = "flex";
        };
    }

    if (btnFecharModal) {
        btnFecharModal.onclick = () => {
            modal.style.display = "none";
            formCadastro.reset();
            idItemEditando = null;
        };
    }

    // CARREGAR VENDAS (GET)
    async function carregarVendas() {
        try {
            const res = await fetch(API_URL, { headers: getAuthHeaders() });
            
            if (!res.ok) {
                const erro = await res.text();
                console.error("Erro no GET:", erro);
                alert("Erro ao carregar o módulo de vendas.");
                return;
            }

            const data = await res.json();
            listaVendasGlobal = data || [];
            renderizarTabela(listaVendasGlobal);
        } catch (error) {
            console.error("Erro de conexão:", error);
            alert("Não foi possível conectar à API de vendas.");
        }
    }

    // RENDERIZAR TABELA
    function renderizarTabela(lista) {
        if (!tabelaCorpo) return;
        tabelaCorpo.innerHTML = "";

        lista.forEach(item => {
            const preco = parseFloat(item.precoUnitario ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const total = parseFloat(item.total ?? (item.precoUnitario * item.quantidade)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            tabelaCorpo.innerHTML += `
                <tr>
                    <td>${item.id}</td>
                    <td>${item.nomeProduto || `ID: ${item.produtoId}`}</td>
                    <td>${preco}</td>
                    <td>${item.quantidade}</td>
                    <td>${total}</td>
                    <td style="display: flex; gap: 10px;">
                        <button class="btn-edit" data-id="${item.id}">Editar</button>
                        <button class="btn-delete" data-id="${item.id}">🗑️</button>
                    </td>
                </tr>
            `;
        });
    }

    // CAPTURA CLIQUES DA TABELA (EDITAR E DELETAR)
    if (tabelaCorpo) {
        tabelaCorpo.addEventListener("click", async (e) => {
            const id = e.target.getAttribute("data-id");
            if (!id) return;

            if (e.target.classList.contains("btn-delete")) {
                // OPERAÇÃO DE EXCLUSÃO (DELETE)
                if (!confirm("Deseja realmente remover este item do pedido?")) return;
                try {
                    const res = await fetch(`${API_URL}/${id}`, {
                        method: "DELETE",
                        headers: getAuthHeaders()
                    });

                    if (!res.ok) {
                        const erro = await res.json();
                        throw new Error(erro.mensagem || "Erro ao deletar");
                    }

                    alert("Item removido com sucesso!");
                    carregarVendas();
                } catch (error) {
                    alert(error.message);
                }
            } 
            
            else if (e.target.classList.contains("btn-edit")) {
                // PREPARAR INTERFACE PARA EDIÇÃO (PUT)
                const item = listaVendasGlobal.find(v => v.id == id);
                if (!item) return;

                pedidoIdInput.value = item.pedidoId;
                produtoIdInput.value = item.produtoId;
                quantidadeInput.value = item.quantidade;
                precoUnitarioInput.value = item.precoUnitario;
                descricaoInput.value = item.descricaoPedido || "";

                idItemEditando = id;
                if (btnSalvarModal) {
                    btnSalvarModal.innerText = "Atualizar";
                    btnSalvarModal.dataset.idAtual = id;
                }
                modal.style.display = "flex";
            }
        });
    }

    // FILTRO EM TEMPO REAL
    if (filtroInput) {
        filtroInput.addEventListener("input", () => {
            const valor = filtroInput.value.toLowerCase();
            const filtrados = listaVendasGlobal.filter(item => 
                (item.nomeProduto && item.nomeProduto.toLowerCase().includes(valor)) ||
                (item.id && item.id.toString().includes(valor))
            );
            renderizarTabela(filtrados);
        });
    }

    // SUBMIT FORMULÁRIO (POST / PUT)
    if (formCadastro) {
        formCadastro.addEventListener("submit", async (e) => {
            e.preventDefault();

            const quantidade = parseInt(quantidadeInput.value);
            const precoUnitario = parseFloat(precoUnitarioInput.value);

            if (idItemEditando) {
                // Payload para UpdateItemPedidoDTO (PUT)
                const payloadPut = {
                    quantidade: quantidade,
                    precoUnitario: precoUnitario,
                    total: quantidade * precoUnitario
                };

                try {
                    const res = await fetch(`${API_URL}/${idItemEditando}`, {
                        method: "PUT",
                        headers: getAuthHeaders(),
                        body: JSON.stringify(payloadPut)
                    });

                    if (!res.ok) {
                        const erroText = await res.text();
                        alert(erroText || "Erro ao atualizar item.");
                        return;
                    }

                    alert("Item de pedido atualizado!");
                    modal.style.display = "none";
                    formCadastro.reset();
                    idItemEditando = null;
                    carregarVendas();
                } catch (error) {
                    alert("Erro ao conectar ao servidor.");
                }

            } else {
                // Payload para CriarItemPedidoVendaDTO (POST)
                const payloadPost = {
                    produtoId: parseInt(produtoIdInput.value),
                    pedidoId: parseInt(pedidoIdInput.value),
                    quantidade: quantidade,
                    precoUnitario: precoUnitario
                };

                try {
                    const res = await fetch(API_URL, {
                        method: "POST",
                        headers: getAuthHeaders(),
                        body: JSON.stringify(payloadPost)
                    });

                    if (!res.ok) {
                        const erroText = await res.text();
                        alert(erroText || "Erro ao cadastrar venda.");
                        return;
                    }

                    alert("Venda realizada com sucesso!");
                    modal.style.display = "none";
                    formCadastro.reset();
                    carregarVendas();
                } catch (error) {
                    alert("Erro ao conectar ao servidor.");
                }
            }
        });
    }

    // INITIALIZATION
    carregarVendas();
});