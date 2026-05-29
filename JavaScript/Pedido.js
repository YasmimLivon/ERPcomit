document.addEventListener("DOMContentLoaded", () => {

    const TOKEN_KEY = "app_auth_token";
    const API_BASE = "http://localhost:5243/api/Pedidos";
    const API_PRODUTOS = "http://localhost:5243/api/Produtos";

    // 🔹 ELEMENTOS DA INTERFACE
    const modal = document.getElementById("pedidoModal");
    const openModalBtn = document.getElementById("openModalBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const form = document.getElementById("pedidoForm");
    const tabela = document.getElementById("tabela-corpo");

    // 🔹 CAMPOS DO FORMULÁRIO
    const clienteIdInput = document.getElementById("clienteIdInput");
    const statusInput = document.getElementById("status");
    const dataPedidoInput = document.getElementById("dataPedido");
    const totalInput = document.getElementById("total");
    
    const produtoIdInput = document.getElementById("produtoId"); 
    const quantityInput = document.getElementById("quantidade"); 
    const precoUnitarioInput = document.getElementById("precoUnitario");
    
    const btnAdicionarItem = document.getElementById("btn-adicionar-produto");
    const containerProdutosAdicionados = document.getElementById("lista-itens-preview");

    // 🔹 VARIÁVEIS DE ESTADO
    let cacheProdutos = []; 
    let itensCarrinhoTemporario = []; 
    let pedidoIdEdicao = null; 

    // 🔹 RESGATA INFORMAÇÕES DO USUÁRIO LOGADO
    function obterDadosUsuarioLogado() {
        const token = localStorage.getItem(TOKEN_KEY);
        let idEncontrado = Number(localStorage.getItem("usuario_id") || localStorage.getItem("usuarioId") || localStorage.getItem("id") || 0);
        let nomeEncontrado = localStorage.getItem("usuario_nome") || localStorage.getItem("usuarioNome") || "Cliente";
        let roleEncontrada = localStorage.getItem("usuario_role") || localStorage.getItem("usuarioRole") || "cliente";

        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const payload = JSON.parse(window.atob(base64));
                
                const idToken = payload["nameid"] || payload["id"] || payload["Id"] || payload["userid"] || payload["userId"] || payload["sub"] || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
                if (idToken) idEncontrado = Number(idToken);

                const nomeToken = payload["nome"] || payload["unique_name"] || payload["name"] || payload["given_name"];
                if (nomeToken) nomeEncontrado = nomeToken;

                const roleToken = payload["role"] || payload["Role"] || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
                if (roleToken) roleEncontrada = roleToken;
            } catch (e) {
                console.error("Falha ao descriptografar token:", e);
            }
        }

        // Contingência por nomes comuns se o ID retornar 0 do backend
        if (idEncontrado === 0 && nomeEncontrado) {
            const n = nomeEncontrado.toLowerCase().trim();
            if (n.includes("pedro")) idEncontrado = 1;
            else if (n.includes("joao") || n.includes("joão")) idEncontrado = 2;
            else if (n.includes("brenno")) idEncontrado = 3;
            else if (n.includes("kaick")) idEncontrado = 4;
            else if (n.includes("carlos")) idEncontrado = 5;
        }

        return { id: idEncontrado, nome: nomeEncontrado, role: roleEncontrada };
    }

    // 🔹 VERIFICA SE O USUÁRIO É DA EQUIPE
    function verificarSeEhFuncionarioOuAdmin() {
        const usuario = obterDadosUsuarioLogado();
        const perfil = usuario.role.toLowerCase().trim();
        const nome = usuario.nome.toLowerCase().trim();

        return perfil.includes("funcionario") || 
               perfil.includes("funcionarios") || 
               perfil.includes("admin") || 
               nome.includes("carlos") || 
               nome.includes("brenno");
    }

    function getAuthHeaders() {
        return {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem(TOKEN_KEY)
        };
    }

    // 🔹 CONTROLE DO MODAL DE CADASTRO
    if (openModalBtn) {
        openModalBtn.onclick = (e) => {
            e.preventDefault();
            if (form) form.reset();
            pedidoIdEdicao = null; 
            itensCarrinhoTemporario = [];
            atualizarVisualizacaoCarrinho();

            const usuario = obterDadosUsuarioLogado();
            const ehEquipe = verificarSeEhFuncionarioOuAdmin();

            if (clienteIdInput) {
                if (ehEquipe) {
                    // Funcionário: Pode digitar livremente no campo de texto
                    clienteIdInput.value = usuario.nome; 
                    clienteIdInput.readOnly = false;
                    clienteIdInput.style.backgroundColor = "#fff"; // Fundo branco indica campo editável
                    clienteIdInput.style.color = "#000";
                    clienteIdInput.removeAttribute("data-id-real");
                } else {
                    // Cliente Comum: Fica estritamente travado com suas credenciais
                    clienteIdInput.value = usuario.nome;
                    clienteIdInput.setAttribute("data-id-real", usuario.id);
                    clienteIdInput.readOnly = true;
                    clienteIdInput.style.backgroundColor = "#e9ecef"; // Fundo cinza indica bloqueado
                    clienteIdInput.style.color = "#555";
                }
            }

            if (statusInput) statusInput.value = "Pendente";
            
            const btnRegistrar = form ? form.querySelector(".btn-registrar") : null;
            if (btnRegistrar) btnRegistrar.textContent = "Cadastrar Pedido";

            if (modal) modal.style.display = "flex";
            
            if (dataPedidoInput) {
                const agora = new Date();
                agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
                dataPedidoInput.value = agora.toISOString().slice(0, 16);
            }
        };
    }

    if (closeModalBtn) {
        closeModalBtn.onclick = () => { if (modal) modal.style.display = "none"; };
    }

    // 🔹 ADIÇÃO DE PRODUTOS AO CARRINHO
    if (btnAdicionarItem) {
        btnAdicionarItem.addEventListener("click", (e) => {
            e.preventDefault();
            const prodId = Number(produtoIdInput.value);
            const qtd = Number(quantityInput.value);
            let preco = precoUnitarioInput ? Number(precoUnitarioInput.value) : 0;

            if (!prodId || qtd <= 0) {
                alert("Selecione um produto válido e defina a quantidade.");
                return;
            }

            const produtoEncontrado = cacheProdutos.find(p => p.id === prodId);
            if (preco === 0 && produtoEncontrado) {
                preco = produtoEncontrado.precoUnitario || produtoEncontrado.preco || 0;
            }

            itensCarrinhoTemporario.push({
                produtoId: prodId,
                nomeProduto: produtoEncontrado ? (produtoEncontrado.nome || produtoEncontrado.descricao) : "Item",
                quantidade: qtd,
                precoUnitario: preco,
                total: qtd * preco
            });

            atualizarVisualizacaoCarrinho();
            produtoIdInput.value = "";
            quantityInput.value = "";
            if (precoUnitarioInput) precoUnitarioInput.value = "";
        });
    }

    function atualizarVisualizacaoCarrinho() {
        let valorAcumulado = 0;
        let estruturaHtml = "";
        
        itensCarrinhoTemporario.forEach(i => {
            valorAcumulado += i.total;
            estruturaHtml += `<li>📦 <strong>${i.quantidade}x</strong> ${i.nomeProduto} - R$ ${i.total.toFixed(2)}</li>`;
        });
        
        if (containerProdutosAdicionados) {
            containerProdutosAdicionados.innerHTML = estruturaHtml || "<li>Nenhum produto adicionado ainda.</li>";
        }
        if (totalInput) totalInput.value = valorAcumulado.toFixed(2);
    }

    // 🔹 SALVAR CADASTRO OU ATUALIZAÇÃO
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (itensCarrinhoTemporario.length === 0) {
                alert("Adicione pelo menos um item à lista antes de prosseguir.");
                return;
            }

            const usuario = obterDadosUsuarioLogado();
            const totalFinalCalculado = itensCarrinhoTemporario.reduce((acc, current) => acc + current.total, 0);

            // Determina se envia o ID numérico recuperado ou 0 quando for texto livre digitado pelo funcionário
            let finalClienteId = Number(clienteIdInput.getAttribute("data-id-real")) || 0;
            if (finalClienteId === 0 && !verificarSeEhFuncionarioOuAdmin()) {
                finalClienteId = usuario.id;
            }

            const body = {
                ClienteId: finalClienteId,
                NomeCliente: clienteIdInput.value, // Adicionado para enviar a string digitada à sua API
                Status: (statusInput && statusInput.value) ? statusInput.value : "Pendente",
                DataPedido: dataPedidoInput.value.split("T")[0],
                Total: totalFinalCalculado,
                Itens: itensCarrinhoTemporario.map(i => ({
                    ProdutoId: i.produtoId,
                    Quantidade: i.quantidade,
                    PrecoUnitario: i.precoUnitario
                }))
            };

            if (pedidoIdEdicao !== null) {
                body.Id = pedidoIdEdicao;
            }

            try {
                const urlRequisicao = pedidoIdEdicao !== null ? `${API_BASE}/${pedidoIdEdicao}` : API_BASE;
                const metodoRequisicao = pedidoIdEdicao !== null ? "PUT" : "POST";

                const res = await fetch(urlRequisicao, {
                    method: metodoRequisicao,
                    headers: getAuthHeaders(),
                    body: JSON.stringify(body)
                });

                if (res.ok) {
                    alert(pedidoIdEdicao !== null ? "🎉 Pedido atualizado com sucesso!" : "🎉 Pedido registrado com sucesso!");
                    if (modal) modal.style.display = "none";
                    form.reset();
                    pedidoIdEdicao = null;
                    itensCarrinhoTemporario = [];
                    atualizarVisualizacaoCarrinho();
                    carregarPedidos(); 
                } else {
                    alert("Não foi possível salvar o pedido. Verifique os dados.");
                }
            } catch (err) {
                console.error("Erro na requisição:", err);
            }
        });
    }

    // 🔹 RENDERIZAR TABELA
    function renderTabela(lista) {
        if (!tabela) return;
        tabela.innerHTML = "";

        if (lista.length === 0) {
            tabela.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#999; padding:20px;">Nenhum pedido localizado para este perfil.</td></tr>`;
            return;
        }

        const ehFuncionario = verificarSeEhFuncionarioOuAdmin();

        lista.forEach(p => {
            const dataFmt = p.dataPedido ? new Date(p.dataPedido).toLocaleDateString('pt-BR') : "-";
            const totalFmt = parseFloat(p.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const titular = p.nomeCliente || p.clienteNome || `Pedido (#${p.clienteId})`;

            let acaoHtml = "";
            if (ehFuncionario) {
                acaoHtml = `
                    <button class="btn-edit" data-id="${p.id}" style="background-color: #341f97; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-weight: bold; margin-right: 5px;">Editar</button>
                    <button class="btn-delete" data-id="${p.id}" style="background: none; border: none; font-size: 16px; cursor: pointer; vertical-align: middle;">🗑️</button>
                `;
            } else {
                acaoHtml = `<span style="color:#2ed573; font-weight:bold;">✔ Enviado</span>`;
            }

            tabela.innerHTML += `
                <tr>
                    <td><strong>#${p.id}</strong></td>
                    <td>${titular}</td>
                    <td>${dataFmt}</td>
                    <td><span class="status-badge" style="background: #eccc68; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">${p.status || "Pendente"}</span></td>
                    <td>${totalFmt}</td>
                    <td style="text-align:center;">${acaoHtml}</td>
                </tr>
            `;
        });
    }

    // 🔹 EVENTOS DA TABELA (EDITAR/EXCLUIR)
    if (tabela) {
        tabela.addEventListener("click", async (e) => {
            if (e.target.classList.contains("btn-edit")) {
                const idPedido = e.target.getAttribute("data-id");
                try {
                    const res = await fetch(`${API_BASE}/${idPedido}`, { headers: getAuthHeaders() });
                    if (!res.ok) throw new Error("Erro ao buscar dados do pedido.");

                    const pedido = await res.json();
                    pedidoIdEdicao = pedido.id;

                    if (form) form.reset();
                    
                    if (clienteIdInput) {
                        clienteIdInput.value = pedido.nomeCliente || pedido.clienteNome || `Cliente #${pedido.clienteId}`;
                        clienteIdInput.setAttribute("data-id-real", pedido.clienteId);
                        
                        if (verificarSeEhFuncionarioOuAdmin()) {
                            clienteIdInput.readOnly = false;
                            clienteIdInput.style.backgroundColor = "#fff";
                            clienteIdInput.style.color = "#000";
                        } else {
                            clienteIdInput.readOnly = true;
                            clienteIdInput.style.backgroundColor = "#e9ecef";
                            clienteIdInput.style.color = "#555";
                        }
                    }

                    if (statusInput) statusInput.value = pedido.status;
                    if (totalInput) totalInput.value = parseFloat(pedido.total || 0).toFixed(2);
                    
                    if (dataPedidoInput && pedido.dataPedido) {
                        dataPedidoInput.value = pedido.dataPedido.includes("T") ? pedido.dataPedido.slice(0, 16) : pedido.dataPedido;
                    }

                    itensCarrinhoTemporario = (pedido.itens || []).map(item => ({
                        produtoId: item.produtoId,
                        nomeProduto: item.nomeProduto || `Produto #${item.produtoId}`,
                        quantidade: item.quantidade,
                        precoUnitario: item.precoUnitario,
                        total: item.quantidade * item.precoUnitario
                    }));
                    
                    atualizarVisualizacaoCarrinho();

                    const btnRegistrar = form ? form.querySelector(".btn-registrar") : null;
                    if (btnRegistrar) btnRegistrar.textContent = "Salvar Alterações";

                    if (modal) modal.style.display = "flex";
                } catch (error) {
                    console.error(error);
                }
            }

            if (e.target.classList.contains("btn-delete")) {
                const idPedido = e.target.getAttribute("data-id");
                if (confirm(`Deseja deletar o pedido #${idPedido}?`)) {
                    try {
                        const res = await fetch(`${API_BASE}/${idPedido}`, {
                            method: "DELETE",
                            headers: getAuthHeaders()
                        });
                        if (res.ok || res.status === 204) {
                            alert("Pedido removido!");
                            carregarPedidos(); 
                        }
                    } catch (error) {
                        console.error(error);
                    }
                }
            }
        });
    }

    // 🔹 BUSCAR E FILTRAR PEDIDOS
    async function carregarPedidos() {
        try {
            const res = await fetch(API_BASE, { headers: getAuthHeaders() });
            
            if (res.status === 401 || res.status === 403) {
                renderTabela([]);
                return;
            }

            if (!res.ok) return;

            const todosOsPedidos = await res.json() || [];
            const usuarioLogado = obterDadosUsuarioLogado();
            
            let pedidosFiltrados = [];

            if (verificarSeEhFuncionarioOuAdmin()) {
                pedidosFiltrados = todosOsPedidos;
            } else {
                if (!usuarioLogado.id || usuarioLogado.id === 0) {
                    pedidosFiltrados = todosOsPedidos.filter(p => {
                        const nomeDoPedido = (p.nomeCliente || p.clienteNome || "").toLowerCase().trim();
                        const nomeDoLogado = usuarioLogado.nome.toLowerCase().trim();
                        return nomeDoPedido !== "" && nomeDoPedido === nomeDoLogado;
                    });
                } else {
                    pedidosFiltrados = todosOsPedidos.filter(p => {
                        const idClienteNoPedido = Number(p.clienteId || p.ClienteId || 0);
                        return idClienteNoPedido === usuarioLogado.id;
                    });
                }
            }

            renderTabela(pedidosFiltrados);
        } catch (error) {
            console.error("Erro ao carregar pedidos:", error);
            renderTabela([]); 
        }
    }

    // 🔹 POPULAR SELECT DE PRODUTOS E ALIMENTAR CACHE
    async function carregarListaProdutosSelect() {
        try {
            const res = await fetch(API_PRODUTOS, { headers: getAuthHeaders() });
            if (res.ok) {
                cacheProdutos = await res.json() || [];
                if (produtoIdInput) {
                    produtoIdInput.innerHTML = '<option value="">Selecione um produto</option>';
                    cacheProdutos.forEach(p => {
                        const produtoSelectText = p.nome || p.descricao || `Produto #${p.id}`;
                        produtoIdInput.innerHTML += `<option value="${p.id}">${produtoSelectText}</option>`;
                    });
                }
            }
        } catch (e) {
            console.error("Erro ao carregar produtos no select:", e);
        }
    }

    // Gatilho ao mudar a seleção do produto
    if (produtoIdInput) {
        produtoIdInput.addEventListener("change", () => {
            const produtoEncontrado = cacheProdutos.find(p => p.id === Number(produtoIdInput.value));
            if (produtoEncontrado && precoUnitarioInput) {
                const valorPreco = produtoEncontrado.precoUnitario || produtoEncontrado.preco || 0;
                precoUnitarioInput.value = valorPreco.toFixed(2);
                if (quantityInput) quantityInput.value = 1;
            }
        });
    }

    // Execuções Iniciais ao Carregar Página
    carregarListaProdutosSelect();
    carregarPedidos();

    document.getElementById("btn-sair")?.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "../Login.html";
    });
});