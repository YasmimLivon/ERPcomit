document.addEventListener("DOMContentLoaded", () => {

    const TOKEN_KEY = "app_auth_token";
    const API_BASE = "http://localhost:5243/api/Pedidos";
    const API_PARCEIROS = "http://localhost:5243/api/Parceiros/Get-Clientes";
    const API_PRODUTOS = "http://localhost:5243/api/Produtos";

    // 🔹 LOGOUT
    document.getElementById("btn-sair")?.addEventListener("click", () => {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = "../Login.html";
    });

    // 🔹 ELEMENTOS
    const modal = document.getElementById("pedidoModal");
    const openModalBtn = document.getElementById("openModalBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const form = document.getElementById("pedidoForm");
    const tabela = document.getElementById("tabela-corpo");
    const filtroInput = document.getElementById("inputFiltro");

    // 🔹 INPUTS DO FORM
    const clienteIdInput = document.getElementById("clienteId");
    const statusInput = document.getElementById("status");
    const dataPedidoInput = document.getElementById("dataPedido");
    const totalInput = document.getElementById("total");
    
    // Elemento alterado para capturar o select de produtos
    const produtoIdInput = document.getElementById("produtoId"); 
    const quantidadeInput = document.getElementById("quantidade");
    const precoUnitarioInput = document.getElementById("precoUnitario");

    // Preenche a data atual por padrão no input
    const agora = new Date();
    agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
    dataPedidoInput.value = agora.toISOString().slice(0, 16);

    // 🔹 CÁLCULO AUTOMÁTICO DO TOTAL DO FORMULÁRIO
    function calcularTotalAutomatico() {
        const qtd = Number(quantidadeInput.value) || 0;
        const preco = Number(precoUnitarioInput.value) || 0;
        totalInput.value = (qtd * preco).toFixed(2);
    }
    quantidadeInput.addEventListener("input", calcularTotalAutomatico);
    precoUnitarioInput.addEventListener("input", calcularTotalAutomatico);

    // 🔹 HEADERS COM AUTENTICAÇÃO
    function getAuthHeaders() {
        return {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem(TOKEN_KEY)
        };
    }

    // 🔹 CONTROLE DO MODAL
    openModalBtn.onclick = () => modal.style.display = "flex";
    closeModalBtn.onclick = () => modal.style.display = "none";

    window.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    };

    // Variáveis Globais de Cache
    let listaPedidos = [];
    let mapaClientes = {}; // Dicionário para guardar { id: "Nome do Cliente" }

    // 🔹 CARREGAR PRODUTOS NO SELECT DINÂMICO
    async function carregarProdutosNoSelect() {
        try {
            const response = await fetch(API_PRODUTOS);
            if (!response.ok) throw new Error("Erro na requisição de produtos");
            
            const produtos = await response.json();

            produtoIdInput.innerHTML = '<option value="">Selecione um produto</option>';

            produtos.forEach(prod => {
                produtoIdInput.innerHTML += `
                    <option value="${prod.id}">
                        ${prod.nome} (Estoque: ${prod.estoqueAtual ?? 0})
                    </option>
                `;
            });
        } catch (error) {
            console.error("Erro ao carregar produtos para o formulário:", error);
            produtoIdInput.innerHTML = '<option value="">Erro ao carregar produtos</option>';
        }
    }

    // 🔹 BUSCAR CLIENTES PARA MAPEAMENTO DE NOMES
    async function carregarClientes() {
        try {
            const res = await fetch(API_PARCEIROS, {
                headers: getAuthHeaders()
            });

            if (res.ok) {
                const clientes = await res.json();
                clientes.forEach(c => {
                    const id = c.id || c.Id;
                    const nome = c.nome || c.Nome;
                    mapaClientes[id] = nome;
                });
            } else {
                console.warn("Não foi possível carregar os nomes dos clientes. Mostrando IDs como padrão.");
            }
        } catch (error) {
            console.error("Erro ao integrar nomes de clientes:", error);
        }
    }

    // 🔹 BUSCAR LISTA DE PEDIDOS (GET /api/Pedidos)
    async function carregarPedidos() {
        try {
            // Garante que temos os nomes mapeados e os produtos carregados antes de mostrar a tabela
            await carregarClientes();

            const res = await fetch(API_BASE, {
                headers: getAuthHeaders()
            });

            if (!res.ok) {
                const erro = await res.text();
                console.error("ERRO GET PEDIDOS:", erro);
                alert("Erro ao carregar pedidos");
                return;
            }

            const data = await res.json();
            listaPedidos = data;
            renderTabela(listaPedidos);

        } catch (error) {
            console.error("ERRO JS:", error);
            alert("Erro ao conectar com API de Pedidos");
        }
    }

    // 🔹 RENDERIZAR PEDIDOS NA TABELA (COM NOME TRATADO)
    function renderTabela(lista) {
        tabela.innerHTML = "";

        lista.forEach(p => {
            const dataFormatada = p.dataPedido ? new Date(p.dataPedido).toLocaleDateString('pt-BR') : "-";
            const nomeCliente = mapaClientes[p.clienteId] || `Cliente #${p.clienteId}`;
            
            tabela.innerHTML += `
                <tr>
                    <td><strong>#${p.id}</strong></td>
                    <td>${nomeCliente}</td>
                    <td>${dataFormatada}</td>
                    <td><span class="status-badge">${p.status ?? "Pendente"}</span></td>
                    <td>R$ ${(p.total ?? 0).toFixed(2)}</td>
                    <td>
                        <button class="btn-delete" data-id="${p.id}">🗑️</button>
                    </td>
                </tr>
            `;
        });
    }

    // 🔹 EXCLUIR PEDIDO (DELETE /api/Pedidos/{id})
    tabela.addEventListener("click", async (e) => {
        if (!e.target.classList.contains("btn-delete")) return;

        const id = e.target.getAttribute("data-id");
        if (!confirm(`Deseja realmente excluir o pedido #${id}?`)) return;

        try {
            const res = await fetch(`${API_BASE}/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders()
            });

            if (!res.ok) {
                const erro = await res.text();
                throw new Error(erro);
            }

            alert("Pedido excluído com sucesso!");
            carregarPedidos();

        } catch (error) {
            console.error(error);
            alert("Erro ao excluir pedido");
        }
    });

    // 🔹 FILTRAR POR NOME DO CLIENTE OU ID
    filtroInput.addEventListener("input", () => {
        const valor = filtroInput.value.trim().toLowerCase();

        if (!valor) {
            renderTabela(listaPedidos);
            return;
        }

        const filtrados = listaPedidos.filter(p => {
            const nomeCliente = (mapaClientes[p.clienteId] || "").toLowerCase();
            const idCliente = (p.clienteId || "").toString();
            return nomeCliente.includes(valor) || idCliente.includes(valor);
        });

        renderTabela(filtrados);
    });

    // 🔹 CADASTRAR NOVO PEDIDO (POST /api/Pedidos)
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const vlrTotalCalculado = Number(totalInput.value) || 0;

        // Monta o JSON capturando o valor ID do produto do respectivo <select>
        const body = {
            id: 0,
            clienteId: Number(clienteIdInput.value),
            status: statusInput.value.trim(),
            dataPedido: new Date(dataPedidoInput.value).toISOString().split('T')[0],
            total: vlrTotalCalculado,
            itens: [
                {
                    id: 0,
                    produtoId: Number(produtoIdInput.value), 
                    quantidade: Number(quantidadeInput.value),
                    precoUnitario: Number(precoUnitarioInput.value),
                    total: vlrTotalCalculado
                }
            ]
        };

        console.log("ENVIANDO BODY VALIDADO:", body);

        try {
            const res = await fetch(API_BASE, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const erroServidor = await res.text();
                console.error("Detalhes do Bad Request do Backend:", erroServidor);
                alert("Erro ao cadastrar novo pedido: " + erroServidor);
                return;
            }

            alert("Pedido registrado com sucesso!");

            modal.style.display = "none";
            form.reset();
            
            // Reajusta data para o momento atual
            dataPedidoInput.value = new Date().toISOString().slice(0, 16);

            carregarPedidos();

        } catch (error) {
            console.error("ERRO POST PEDIDO:", error);
            alert("Erro ao conectar com API");
        }
    });

    // 🔹 INICIALIZAÇÃO DA PÁGINA
    carregarProdutosNoSelect(); 
    carregarPedidos();         
});