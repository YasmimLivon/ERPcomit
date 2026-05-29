document.addEventListener("DOMContentLoaded", () => {

    const TOKEN_KEY = "app_auth_token";
    const API_URL = "http://localhost:5243/api/Estoque";
    const API_PRODUTOS = "http://localhost:5243/api/Produtos";

    // 🔹 ELEMENTOS DA INTERFACE
    const btnSair = document.getElementById("btn-sair");
    const btnEntrada = document.querySelector(".btn-entrada");
    const btnSaida = document.querySelector(".btn-saida");
    const modal = document.getElementById("modalMovimentacao");
    const tituloModal = document.getElementById("modalTitulo");
    const inputFiltro = document.getElementById("inputFiltro");

    // 🔹 CAMPOS DO FORMULÁRIO
    const produtoIdInput = document.getElementById("produtoId");
    const tipoSelect = document.getElementById("tipo");
    const quantidadeInput = document.getElementById("quantidade");
    const precoInput = document.getElementById("precoUnitario");
    const dataInput = document.getElementById("data");
    const pedidoInput = document.getElementById("pedidoId");

    const btnConfirmar = document.getElementById("confirmarMov");
    const btnCancelar = document.getElementById("cancelarMov");

    let listaProdutos = [];

    // 🔹 AUXILIAR: GERA CABEÇALHOS COM TOKEN DE AUTENTICAÇÃO
    function getAuthHeaders() {
        return {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem(TOKEN_KEY)
        };
    }

    // 🔹 LOGOUT SEGURO
    if (btnSair) {
        btnSair.addEventListener("click", () => {
            localStorage.removeItem(TOKEN_KEY);
            window.location.href = "../Login.html";
        });
    }

    // 🔹 CARREGAR PRODUTOS NO SELECT (CORRIGIDO: Agora envia o Token)
    async function carregarProdutos() {
        try {
            const response = await fetch(API_PRODUTOS, { headers: getAuthHeaders() });
            
            if (response.status === 401) {
                alert("Sessão expirada ou não autorizada. Por favor, faça login novamente.");
                window.location.href = "../Login.html";
                return;
            }
            
            const produtos = await response.json();

            if (!produtoIdInput) return;
            produtoIdInput.innerHTML = '<option value="">Selecione um produto</option>';

            if (produtos && Array.isArray(produtos)) {
                produtos.forEach(prod => {
                    produtoIdInput.innerHTML += `
                        <option value="${prod.id}">
                            ${prod.nome} (Estoque: ${prod.estoqueAtual ?? 0})
                        </option>
                    `;
                });
            }
        } catch (error) {
            console.error("Erro ao carregar produtos no select:", error);
        }
    }

    // 🔹 RENDER TABELA
    function renderTabela(produtos) {
        const tabela = document.getElementById("tabela-corpo");
        if (!tabela) return;
        tabela.innerHTML = "";

        if (!produtos || produtos.length === 0) {
            tabela.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#999; padding:20px;">Nenhum produto localizado no estoque.</td></tr>`;
            return;
        }

        if (produtos && Array.isArray(produtos)) {
            produtos.forEach(prod => {
                const preco = parseFloat(prod.precoUnitario ?? prod.preco ?? 0);
                tabela.innerHTML += `
                    <tr>
                        <td><strong>${prod.nome}</strong></td>
                        <td>${prod.estoqueAtual ?? 0}</td>
                        <td>${preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td>${prod.codigo ?? "-"}</td>
                    </tr>
                `;
            });
        }
    }

    // 🔹 CARREGAR ESTOQUE NA TABELA (CORRIGIDO: Agora envia o Token)
    async function carregarEstoque() {
        try {
            const response = await fetch(API_PRODUTOS, { headers: getAuthHeaders() });
            
            if (response.status === 401) {
                console.warn("Usuário não autenticado ao listar estoque.");
                return;
            }

            listaProdutos = await response.json();
            renderTabela(listaProdutos);
        } catch (error) {
            console.error("Erro ao carregar lista do estoque:", error);
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

    // 🔹 ABRIR MODAL: ENTRADA
    if (btnEntrada && modal && tipoSelect) {
        btnEntrada.addEventListener("click", () => {
            if (tituloModal) tituloModal.textContent = "Entrada de Produto";
            tipoSelect.value = 0;
            modal.classList.remove("hidden");
            carregarProdutos();
        });
    }

    // 🔹 ABRIR MODAL: SAÍDA
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

    // 🔹 ENVIAR MOVIMENTAÇÃO (CORRIGIDO: Captura melhorada de erros 403/400)
    if (btnConfirmar) {
        btnConfirmar.addEventListener("click", async () => {
            if (!produtoIdInput || !quantidadeInput) return;

            const produtoId = parseInt(produtoIdInput.value);
            const quantidade = parseInt(quantidadeInput.value);

            if (!produtoId || !quantidade || quantidade <= 0) {
                alert("Por favor, selecione um produto e informe uma quantidade válida!");
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
                    headers: getAuthHeaders(),
                    body: JSON.stringify(body)
                });

                // Tratamento específico se o usuário não tiver permissão no C# (Erro 403)
                if (response.status === 403) {
                    alert("❌ Acesso negado: Seu usuário não tem permissão de Funcionário/Admin para movimentar o estoque.");
                    return;
                }

                if (!response.ok) {
                    const textoErro = await response.text();
                    let mensagemAmigavel = "Erro na validação do servidor.";
                    try {
                        const jsonErro = JSON.parse(textoErro);
                        mensagemAmigavel = jsonErro.mensagem || jsonErro.title || textoErro;
                    } catch {
                        if (textoErro) mensagemAmigavel = textoErro;
                    }
                    throw new Error(mensagemAmigavel);
                }

                alert("🎉 Movimentação realizada com sucesso!");

                if (modal) modal.classList.add("hidden");

                // Limpar campos com segurança
                if (produtoIdInput) produtoIdInput.value = "";
                if (quantidadeInput) quantidadeInput.value = "";
                if (precoInput) precoInput.value = "";
                if (dataInput) dataInput.value = "";
                if (pedidoInput) pedidoInput.value = "";

                // Atualiza a listagem geral
                carregarEstoque();

            } catch (error) {
                console.error("Erro na requisição POST do estoque:", error);
                alert("Erro: " + error.message);
            }
        });
    }

    // 🔹 INICIALIZAÇÃO DA PÁGINA
    carregarEstoque();

    // 📜 AJUSTE DE ROLAGEM DA TABELA
    const tabelaCorpo = document.getElementById('tabela-corpo');
    if (tabelaCorpo) {
        const tabelaPai = tabelaCorpo.closest('table')?.parentElement;
        if (tabelaPai) {
            tabelaPai.style.maxHeight = "500px"; 
            tabelaPai.style.overflowY = "auto";  
            tabelaPai.style.overflowX = "auto";  
        }
    }

    // Fechar ao clicar fora da área interna do modal
    if (modal) {
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.classList.add("hidden");
            }
        });
    }
});