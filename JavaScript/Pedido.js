document.addEventListener("DOMContentLoaded", () => {

    const TOKEN_KEY = "app_auth_token";
    const API_BASE = "http://localhost:5243/api/Pedidos";
    const API_PARCEIROS = "http://localhost:5243/api/Parceiros/Get-Clientes";
    const API_PRODUTOS = "http://localhost:5243/api/Produtos";
    const API_FINANCEIRO = "http://localhost:5243/api/Financeiro"; // 🔹 Adicionado para integração

    // 🔹 LOGOUT
    document.getElementById("btn-sair")?.addEventListener("click", () => {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = "../Login.html";
    });

    // 🔹 ELEMENTOS DA INTERFACE
    const modal = document.getElementById("pedidoModal");
    const openModalBtn = document.getElementById("openModalBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const form = document.getElementById("pedidoForm");
    const tabela = document.getElementById("tabela-corpo");
    const filtroInput = document.getElementById("inputFiltro");

    // 🔹 CAMPOS DO FORMULÁRIO
    const clienteIdInput = document.getElementById("clienteId");
    const statusInput = document.getElementById("status");
    const dataPedidoInput = document.getElementById("dataPedido");
    const totalInput = document.getElementById("total");
    
    const produtoIdInput = document.getElementById("produtoId"); 
    const quantidadeInput = document.getElementById("quantidade");
    const precoUnitarioInput = document.getElementById("precoUnitario");
    
    const btnAdicionarProduto = document.getElementById("btn-adicionar-produto");
    const listaItensPreview = document.getElementById("lista-itens-preview");

    // Variáveis de Controle Global
    let listaPedidos = [];
    let mapaClientes = {}; 
    let cacheProdutos = []; 
    let itensCarrinhoTemporario = []; 

    // Configura a data e hora local de hoje no input datetime-local
    function resetarDataInput() {
        const agora = new Date();
        agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
        dataPedidoInput.value = agora.toISOString().slice(0, 16);
    }
    resetarDataInput();

    // 🔹 RETORNA OS HEADERS COM AUTENTICAÇÃO JWT
    function getAuthHeaders() {
        return {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem(TOKEN_KEY)
        };
    }

    // 🔹 INTERAÇÕES DO MODAL
    openModalBtn.onclick = () => {
        form.reset();
        itensCarrinhoTemporario = [];
        atualizarVisualizacaoCarrinho();
        resetarDataInput();
        modal.style.display = "flex";
    };
    
    closeModalBtn.onclick = () => modal.style.display = "none";

    window.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    };

    // 🔹 CARREGAR LISTAGEM DE PRODUTOS NO SELECT
    async function carregarProdutosNoSelect() {
        try {
            const response = await fetch(API_PRODUTOS);
            if (!response.ok) throw new Error("Erro na requisição de produtos");
            
            cacheProdutos = await response.json();
            produtoIdInput.innerHTML = '<option value="">Selecione um produto</option>';

            cacheProdutos.forEach(prod => {
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

    // Gatilho para preencher o preço unitário sugerido ao mudar o produto
    produtoIdInput.addEventListener("change", () => {
        const idSelecionado = Number(produtoIdInput.value);
        const produtoEncontrado = cacheProdutos.find(p => p.id === idSelecionado);
        
        if (produtoEncontrado) {
            precoUnitarioInput.value = (produtoEncontrado.preco || produtoEncontrado.precoVenda || 0).toFixed(2);
            quantidadeInput.value = 1; 
        } else {
            precoUnitarioInput.value = "";
            quantidadeInput.value = "";
        }
    });

    // 🔹 ADICIONAR PRODUTO NO CARRINHO TEMPORÁRIO (AO CLICAR NO BOTÃO ➕)
    btnAdicionarProduto.addEventListener("click", () => {
        const produtoId = Number(produtoIdInput.value);
        const quantidade = Number(quantidadeInput.value);
        const precoUnitario = Number(precoUnitarioInput.value);

        if (!produtoId || quantidade <= 0 || isNaN(precoUnitario) || precoUnitario < 0) {
            alert("⚠️ Selecione um produto and informe quantidade e preço válidos.");
            return;
        }

        const produtoEncontrado = cacheProdutos.find(p => p.id === produtoId);
        const nomeProduto = produtoEncontrado ? produtoEncontrado.nome : `Produto #${produtoId}`;
        const totalItem = quantidade * precoUnitario;

        // Adiciona à lista local da sessão do modal
        itensCarrinhoTemporario.push({
            id: 0,
            produtoId: produtoId,
            quantidade: quantidade,
            precoUnitario: precoUnitario,
            total: totalItem, 
            nomeVisual: nomeProduto 
        });

        // Reseta apenas os campos do bloco de item para permitir nova inserção
        produtoIdInput.value = "";
        quantidadeInput.value = "";
        precoUnitarioInput.value = "";

        atualizarVisualizacaoCarrinho();
    });

    // Atualiza a listagem visual do preview interno e soma o valor total geral
    function atualizarVisualizacaoCarrinho() {
        listaItensPreview.innerHTML = "";
        let somaTotalPedido = 0;

        if (itensCarrinhoTemporario.length === 0) {
            listaItensPreview.innerHTML = '<li style="color: #999; font-style: italic;">Nenhum produto adicionado ainda.</li>';
            totalInput.value = "0.00";
            return;
        }

        itensCarrinhoTemporario.forEach((item, index) => {
            somaTotalPedido += item.total;

            const li = document.createElement("li");
            li.style.display = "flex";
            li.style.justify = "space-between";
            li.style.alignItems = "center";
            li.style.marginBottom = "6px";
            li.style.paddingBottom = "4px";
            li.style.borderBottom = "1px solid #eee";

            li.innerHTML = `
                <span><strong>${item.quantidade}x</strong> ${item.nomeVisual} - R$ ${item.total.toFixed(2)}</span>
                <span class="remover-item" data-index="${index}" style="color: #ff4d4d; cursor: pointer; font-weight: bold; padding: 0 5px;">❌</span>
            `;
            listaItensPreview.appendChild(li);
        });

        totalInput.value = somaTotalPedido.toFixed(2);
    }

    // Permite remover um item inserido incorretamente clicando no ❌
    listaItensPreview.addEventListener("click", (e) => {
        if (e.target.classList.contains("remover-item")) {
            const indexParaRemover = Number(e.target.getAttribute("data-index"));
            itensCarrinhoTemporario.splice(indexParaRemover, 1);
            atualizarVisualizacaoCarrinho();
        }
    });

    // 🔹 CARREGAR MAPA DE NOMES DE CLIENTES
    async function carregarClientes() {
        try {
            const res = await fetch(API_PARCEIROS, { headers: getAuthHeaders() });
            if (res.ok) {
                const clientes = await res.json();
                clientes.forEach(c => {
                    const id = c.id || c.Id;
                    const nome = c.nome || c.Nome;
                    mapaClientes[id] = nome;
                });
            }
        } catch (error) {
            console.error("Erro ao cruzar dados de clientes:", error);
        }
    }

    // 🔹 BUSCAR PEDIDOS REGISTRADOS (GET)
    async function carregarPedidos() {
        try {
            await carregarClientes();
            const res = await fetch(API_BASE, { headers: getAuthHeaders() });

            if (!res.ok) {
                console.error("Falha ao recuperar registros de pedidos");
                return;
            }

            const data = await res.json();
            listaPedidos = data;
            renderTabela(listaPedidos);
        } catch (error) {
            console.error("Erro na carga inicial do JS:", error);
        }
    }

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

    // 🔹 EXCLUSÃO DE PEDIDOS (DELETE)
    tabela.addEventListener("click", async (e) => {
        if (!e.target.classList.contains("btn-delete")) return;
        const id = e.target.getAttribute("data-id");
        if (!confirm(`Deseja realmente remover o pedido #${id}?`)) return;

        try {
            const res = await fetch(`${API_BASE}/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders()
            });
            if (res.ok) {
                alert("Pedido excluído!");
                carregarPedidos();
            }
        } catch (error) {
            alert("Erro na operação de exclusão.");
        }
    });

    // 🔹 FILTRO EM TEMPO REAL
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

    // 🔹 SALVAR PEDIDO INTEGRADO À API (POST)
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (itensCarrinhoTemporario.length === 0) {
            alert("❌ Erro: Insira ao menos um produto clicando em 'Adicionar Produto à Lista' antes de enviar!");
            return;
        }

        const vlrTotalCalculado = Number(totalInput.value) || 0;
        const valorDataPura = dataPedidoInput.value.split("T")[0]; 

        const itensTratadosParaEnvio = itensCarrinhoTemporario.map(item => ({
            id: 0,
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            total: item.total 
        }));

        const body = {
            id: 0,
            clienteId: Number(clienteIdInput.value),
            status: statusInput.value.trim(),
            dataPedido: valorDataPura, 
            total: vlrTotalCalculado,
            itens: itensTratadosParaEnvio 
        };

        try {
            const res = await fetch(API_BASE, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const erroServidor = await res.text();
                alert("Erro ao cadastrar novo pedido: " + erroServidor);
                return;
            }

            // 🔹 INTEGRADO: Envia o faturamento do pedido diretamente para a tabela Financeiro do Dashboard
            try {
                const nomeClienteFaturamento = mapaClientes[body.clienteId] || `Cliente #${body.clienteId}`;
                await fetch(API_FINANCEIRO, {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        descricao: `Faturamento - Pedido Efetuado (${nomeClienteFaturamento})`,
                        valor: vlrTotalCalculado,
                        tipo: "Vendas", // Classificação para o gráfico de barras
                        status: "Pago", // Como o pedido foi processado com sucesso, entra como receita realizada
                        dataVencimento: valorDataPura
                    })
                });
            } catch (errFin) {
                console.error("Aviso: Pedido salvo, mas houve erro no envio ao fluxo de caixa:", errFin);
            }

            alert("Pedido gravado e faturamento integrado com sucesso!");
            modal.style.display = "none";
            
            form.reset();
            itensCarrinhoTemporario = [];
            atualizarVisualizacaoCarrinho();
            resetarDataInput();
            
            carregarPedidos();
            carregarProdutosNoSelect(); // Atualiza os números visuais do estoque no combo box

        } catch (error) {
            console.error("ERRO POST PEDIDO:", error);
            alert("Não foi possível estabelecer contato com o servidor da API.");
        }
    });

    // 🔹 DISPAROS INICIAIS
    carregarProdutosNoSelect(); 
    carregarPedidos();          
});