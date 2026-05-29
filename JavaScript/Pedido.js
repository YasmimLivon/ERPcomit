document.addEventListener("DOMContentLoaded", () => {

    const TOKEN_KEY = "app_auth_token";
    const API_BASE = "http://localhost:5243/api/Pedidos";
    const API_PARCEIROS = "http://localhost:5243/api/Parceiros/Get-Clientes";
    const API_PRODUTOS = "http://localhost:5243/api/Produtos";
    const API_FINANCEIRO = "http://localhost:5243/api/Financeiro"; 

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
        if (!dataPedidoInput) return;
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
    if (openModalBtn) {
        openModalBtn.onclick = () => {
            if (form) form.reset();
            itensCarrinhoTemporario = [];
            atualizarVisualizacaoCarrinho();
            resetarDataInput();
            if (modal) modal.style.display = "flex";
        };
    }
    
    if (closeModalBtn) {
        closeModalBtn.onclick = () => {
            if (modal) modal.style.display = "none";
        };
    }

    window.addEventListener('click', (e) => {
        if (modal && e.target === modal) {
            modal.style.display = "none";
        }
    });

    // 🔹 CARREGAR LISTAGEM DE PRODUTOS NO SELECT
    async function carregarProdutosNoSelect() {
        if (!produtoIdInput) return;
        try {
            const response = await fetch(API_PRODUTOS);
            if (!response.ok) throw new Error("Erro na requisição de produtos");
            
            cacheProdutos = await response.json();
            produtoIdInput.innerHTML = '<option value="">Selecione um produto</option>';

            if (cacheProdutos && Array.isArray(cacheProdutos)) {
                cacheProdutos.forEach(prod => {
                    produtoIdInput.innerHTML += `
                        <option value="${prod.id}">
                            ${prod.nome} (Estoque: ${prod.estoqueAtual ?? 0})
                        </option>
                    `;
                });
            }
        } catch (error) {
            console.error("Erro ao carregar produtos para o formulário:", error);
            produtoIdInput.innerHTML = '<option value="">Erro ao carregar produtos</option>';
        }
    }

    // Gatilho para preencher o preço unitário sugerido ao mudar o produto
    if (produtoIdInput) {
        produtoIdInput.addEventListener("change", () => {
            const idSelecionado = Number(produtoIdInput.value);
            const produtoEncontrado = cacheProdutos.find(p => p.id === idSelecionado);
            
            if (produtoEncontrado && precoUnitarioInput && quantidadeInput) {
                precoUnitarioInput.value = (produtoEncontrado.preco || produtoEncontrado.precoVenda || 0).toFixed(2);
                quantidadeInput.value = 1; 
            } else if (precoUnitarioInput && quantidadeInput) {
                precoUnitarioInput.value = "";
                quantidadeInput.value = "";
            }
        });
    }

    // 🔹 ADICIONAR PRODUTO NO CARRINHO TEMPORÁRIO (AO CLICAR NO BOTÃO ➕)
    if (btnAdicionarProduto) {
        btnAdicionarProduto.addEventListener("click", () => {
            if (!produtoIdInput || !quantidadeInput || !precoUnitarioInput) return;

            const produtoId = Number(produtoIdInput.value);
            const quantidade = Number(quantidadeInput.value);
            const precoUnitario = Number(precoUnitarioInput.value);

            if (!produtoId || quantidade <= 0 || isNaN(precoUnitario) || precoUnitario < 0) {
                alert("⚠️ Selecione um produto e informe quantidade e preço válidos.");
                return;
            }

            const produtoEncontrado = cacheProdutos.find(p => p.id === produtoId);
            const nomeProduto = produtoEncontrado ? produtoEncontrado.nome : `Produto #${produtoId}`;
            const totalItem = quantidade * precoUnitario;

            itensCarrinhoTemporario.push({
                id: 0,
                produtoId: produtoId,
                quantidade: quantity => quantidade,
                quantidade: quantidade,
                precoUnitario: precoUnitario,
                total: totalItem, 
                nomeVisual: nomeProduto 
            });

            produtoIdInput.value = "";
            quantidadeInput.value = "";
            precoUnitarioInput.value = "";

            atualizarVisualizacaoCarrinho();
        });
    }

    // Atualiza a listagem visual do preview interno e soma o valor total geral
    function atualizarVisualizacaoCarrinho() {
        if (!listaItensPreview) return;
        listaItensPreview.innerHTML = "";
        let somaTotalPedido = 0;

        if (itensCarrinhoTemporario.length === 0) {
            listaItensPreview.innerHTML = '<li style="color: #999; font-style: italic;">Nenhum produto adicionado ainda.</li>';
            if (totalInput) totalInput.value = "0.00";
            return;
        }

        itensCarrinhoTemporario.forEach((item, index) => {
            somaTotalPedido += item.total;

            const li = document.createElement("li");
            li.style.display = "flex";
            li.style.justifyContent = "space-between";
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

        if (totalInput) totalInput.value = somaTotalPedido.toFixed(2);
    }

    // Permite remover um item inserido incorretamente clicando no ❌
    if (listaItensPreview) {
        listaItensPreview.addEventListener("click", (e) => {
            if (e.target.classList.contains("remover-item")) {
                const indexParaRemover = Number(e.target.getAttribute("data-index"));
                itensCarrinhoTemporario.splice(indexParaRemover, 1);
                atualizarVisualizacaoCarrinho();
            }
        });
    }

    // 🔹 CARREGAR MAPA DE NOMES DE CLIENTES
    async function carregarClientes() {
        try {
            const res = await fetch(API_PARCEIROS, { headers: getAuthHeaders() });
            if (res.ok) {
                const clientes = await res.json();
                if (clientes && Array.isArray(clientes)) {
                    clientes.forEach(c => {
                        const id = c.id || c.Id;
                        const nome = c.nome || c.Nome;
                        mapaClientes[id] = nome;
                    });
                }
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
            listaPedidos = data || [];
            renderTabela(listaPedidos);
        } catch (error) {
            console.error("Erro na carga inicial do JS:", error);
        }
    }

    function renderTabela(lista) {
        if (!tabela) return;
        tabela.innerHTML = "";
        
        if (lista && Array.isArray(lista)) {
            lista.forEach(p => {
                const dataFormatada = p.dataPedido ? new Date(p.dataPedido).toLocaleDateString('pt-BR') : "-";
                const nomeCliente = mapaClientes[p.clienteId] || `Cliente #${p.clienteId}`;
                const totalPedido = parseFloat(p.total ?? 0);
                
                tabela.innerHTML += `
                    <tr>
                        <td><strong>#${p.id}</strong></td>
                        <td>${nomeCliente}</td>
                        <td>${dataFormatada}</td>
                        <td><span class="status-badge">${p.status ?? "Pendente"}</span></td>
                        <td>${totalPedido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td>
                            <button class="btn-delete" data-id="${p.id}">🗑️</button>
                        </td>
                    </tr>
                `;
            });
        }
    }

    // 🔹 EXCLUSÃO DE PEDIDOS (DELETE)
    if (tabela) {
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
    }

    // 🔹 FILTRO EM TEMPO REAL
    if (filtroInput) {
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
    }

    // 🔹 SALVAR PEDIDO INTEGRADO À API (POST)
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (itensCarrinhoTemporario.length === 0) {
                alert("❌ Erro: Insira ao menos um produto clicando em 'Adicionar' antes de enviar!");
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

                // 🔹 INTEGRADO: Envia o faturamento do pedido diretamente para a tabela Financeiro
                try {
                    const nomeClienteFaturamento = mapaClientes[body.clienteId] || `Cliente #${body.clienteId}`;
                    await fetch(API_FINANCEIRO, {
                        method: "POST",
                        headers: getAuthHeaders(),
                        body: JSON.stringify({
                            descricao: `Faturamento - Pedido Efetuado (${nomeClienteFaturamento})`,
                            valor: vlrTotalCalculado,
                            tipo: "Vendas", 
                            status: "Pago", 
                            dataVencimento: valorDataPura
                        })
                    });
                } catch (errFin) {
                    console.error("Aviso: Pedido salvo, mas houve erro no envio ao fluxo de caixa:", errFin);
                }

                alert("Pedido gravado e faturamento integrado com sucesso!");
                if (modal) modal.style.display = "none";
                
                form.reset();
                itensCarrinhoTemporario = [];
                atualizarVisualizacaoCarrinho();
                resetarDataInput();
                
                carregarPedidos();
                carregarProdutosNoSelect(); 

            } catch (error) {
                console.error("ERRO POST PEDIDO:", error);
                alert("Não foi possível estabelecer contato com o servidor da API.");
            }
        });
    }

    // 🔹 DISPAROS INICIAIS E AJUSTE DE LAYOUT (SCROLL)
    carregarProdutosNoSelect(); 
    carregarPedidos(); 

    // 📜 ATIVA O SCROLL NA TABELA CASO COMPORTE MUITOS PEDIDOS
    const tabelaCorpo = document.getElementById('tabela-corpo');
    if (tabelaCorpo) {
        const tabelaPai = tabelaCorpo.closest('table')?.parentElement;
        if (tabelaPai) {
            tabelaPai.style.maxHeight = "500px"; // Altura limite fixada
            tabelaPai.style.overflowY = "auto";  // Ativa rolagem vertical
            tabelaPai.style.overflowX = "auto";  // Evita quebra lateral
        }
    }         
});