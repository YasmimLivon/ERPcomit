document.addEventListener("DOMContentLoaded", () => {

    const TOKEN_KEY = "app_auth_token";
    
    // 🔹 DECLARAÇÃO DAS ROTAS (CORREÇÃO DO ERRO UNDEFINED)
    const API_GET = "https://winxs-api.azurewebsites.net/api/Produtos";
    const API_BASE = "https://winxs-api.azurewebsites.net/api/Produtos";
    const API_POST = "https://winxs-api.azurewebsites.net/api/Produtos/cadastrar";

    // 🔹 LOGOUT
    document.getElementById("btn-sair")?.addEventListener("click", () => {
        localStorage.clear(); 
        window.location.href = "../Index.html";
    });

    // 🔹 ELEMENTOS
    const modal = document.getElementById("productModal");
    const openModalBtn = document.getElementById("openModalBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const form = document.getElementById("productForm");
    const tabela = document.getElementById("tabela-corpo");
    const filtroInput = document.getElementById("inputFiltro");

    // 🔹 INPUTS
    const nomeInput = document.getElementById("nome");
    const codigoInput = document.getElementById("codigo");
    const precoInput = document.getElementById("preco");
    const quantidadeInput = document.getElementById("quantidade");
    const tipoInput = document.getElementById("tipo");
    const ativoInput = document.getElementById("ativo");

    // 🔹 VARIÁVEIS DE ESTADO
    let listaProdutos = [];
    let produtoIdEdicao = null; 

    // 🔹 DECODIFICA DADOS DO USUÁRIO LOGADO
    function obterDadosUsuarioLogado() {
        const token = localStorage.getItem(TOKEN_KEY);
        let idEncontrado = Number(localStorage.getItem("usuario_id") || localStorage.getItem("usuarioId") || 0);
        let nomeEncontrado = localStorage.getItem("usuario_nome") || localStorage.getItem("usuarioNome") || "Cliente";
        let roleEncontrada = localStorage.getItem("usuario_role") || localStorage.getItem("usuarioRole") || "cliente";

        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const payload = JSON.parse(window.atob(base64));
                
                const idToken = payload["nameid"] || payload["id"] || payload["Id"] || payload["sub"];
                if (idToken) idEncontrado = Number(idToken);

                const nomeToken = payload["nome"] || payload["unique_name"] || payload["name"];
                if (nomeToken) nomeEncontrado = nomeToken;

                const roleToken = payload["role"] || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
                if (roleToken) roleEncontrada = roleToken;
            } catch (e) {
                console.error("Erro ao decodificar token de produtos:", e);
            }
        }
        return { id: idEncontrado, nome: nomeEncontrado, role: roleEncontrada };
    }

    // 🔹 VERIFICA SE PERTENCE À EQUIPE DE FUNCIONÁRIOS
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

    // 🔹 TOKEN HEADER
    function getAuthHeaders() {
        return {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem(TOKEN_KEY)
        };
    }

    // 🔹 CONTROLE DO MODAL
    if (openModalBtn) {
        openModalBtn.onclick = () => {
            produtoIdEdicao = null; 
            if (form) form.reset();
            const btnSalvar = form ? form.querySelector("button[type='submit']") : null;
            if (btnSalvar) btnSalvar.textContent = "Cadastrar Produto";
            if (modal) modal.style.display = "flex";
        };
    }
    
    if (closeModalBtn) closeModalBtn.onclick = () => { if (modal) modal.style.display = "none"; };

    if (modal) {
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = "none";
        });
    }

    // 🔹 CARREGAR PRODUTOS
    async function carregarProdutos() {
        try {
            const res = await fetch(API_GET, { headers: getAuthHeaders() });

            if (!res.ok) {
                const erro = await res.text();
                console.error("ERRO GET:", erro);
                alert("Erro ao carregar produtos");
                return;
            }

            const data = await res.json();
            listaProdutos = data || [];
            renderTabela(listaProdutos);

        } catch (error) {
            console.error("ERRO JS:", error);
            alert("Erro ao conectar com API");
        }
    }

    // 🔹 RENDER TABELA (BOTÕES VISÍVEIS EXCLUSIVAMENTE PARA FUNCIONÁRIOS)
    function renderTabela(lista) {
        if (!tabela) return;
        tabela.innerHTML = "";

        const ehEquipe = verificarSeEhFuncionarioOuAdmin();

        if (lista && Array.isArray(lista)) {
            lista.forEach(p => {
                const precoVal = parseFloat(p.precoUnitario ?? p.preco ?? 0);

                // Se não for equipe, renderiza um traço comum
                let acoesHtml = `<span style="color: #aaa;">-</span>`;
                
                // Se for equipe, injeta os botões de controle
                if (ehEquipe) {
                    acoesHtml = `
                        <button class="btn-edit-prod" data-id="${p.id}" style="background-color: #341f97; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-weight: bold; margin-right: 5px;">Editar</button>
                        <button class="btn-delete-prod" data-id="${p.id}" style="background: none; border: none; font-size: 16px; cursor: pointer; vertical-align: middle;">🗑️</button>
                    `;
                }

                tabela.innerHTML += `
                    <tr>
                        <td>${p.nome}</td>
                        <td>${precoVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td>${p.codigo ?? "-"}</td>
                        <td>${p.estoqueAtual ?? p.quantidade ?? 0}</td>
                        <td>${p.tipo ?? "-"}</td>
                        <td style="font-weight: 500; color: #555;">${p.fornecedor || "Geral/Admin"}</td> 
                        <td>${p.ativo ? "✔️" : "❌"}</td>
                        <td style="text-align: center;">
                            ${acoesHtml}
                        </td>
                    </tr>
                `;
            });
        }
    }

    // 🔹 EVENTOS INTERNOS DA TABELA (EDITAR / DELETAR)
    if (tabela) {
        tabela.addEventListener("click", async (e) => {
            // AÇÃO EDITAR
            if (e.target.classList.contains("btn-edit-prod")) {
                const idProd = e.target.getAttribute("data-id");
                const produto = listaProdutos.find(p => p.id == idProd);

                if (produto) {
                    produtoIdEdicao = produto.id;
                    
                    if (nomeInput) nomeInput.value = produto.nome;
                    if (codigoInput) codigoInput.value = produto.codigo ?? "";
                    if (precoInput) precoInput.value = (produto.precoUnitario ?? produto.preco ?? 0);
                    if (quantidadeInput) quantidadeInput.value = (produto.estoqueAtual ?? produto.quantidade ?? 0);
                    if (tipoInput) tipoInput.value = produto.tipo ?? "Geral";
                    if (ativoInput) ativoInput.checked = produto.ativo;

                    const btnSalvar = form ? form.querySelector("button[type='submit']") : null;
                    if (btnSalvar) btnSalvar.textContent = "Salvar Alterações";

                    if (modal) modal.style.display = "flex";
                }
            }

            // AÇÃO EXCLUIR
            if (e.target.classList.contains("btn-delete-prod")) {
                const idProd = e.target.getAttribute("data-id");
                if (confirm(`Tem certeza que deseja remover este produto definitivamente?`)) {
                    try {
                        const res = await fetch(`${API_BASE}/${idProd}`, {
                            method: "DELETE",
                            headers: getAuthHeaders()
                        });

                        if (res.ok || res.status === 204) {
                            alert("🎉 Produto removido com sucesso!");
                            carregarProdutos();
                        } else {
                            alert("Não foi possível excluir o produto.");
                        }
                    } catch (error) {
                        console.error("Erro ao deletar produto:", error);
                    }
                }
            }
        });
    }

    // 🔹 FILTRO
    if (filtroInput) {
        filtroInput.addEventListener("input", () => {
            const valor = filtroInput.value.toLowerCase();
            const filtrados = listaProdutos.filter(p =>
                (p.nome && p.nome.toLowerCase().includes(valor)) || 
                (p.fornecedor && p.fornecedor.toLowerCase().includes(valor))
            );
            renderTabela(filtrados);
        });
    }

    // 🔹 CADASTRAR OU ATUALIZAR PRODUTO
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!nomeInput || !nomeInput.value.trim()) {
                alert("Nome é obrigatório!");
                return;
            }

            const rawPreco = precoInput ? precoInput.value.toString() : "0";
            const precoFinal = parseFloat(rawPreco.replace(",", ".")) || 0;

            const body = {
                nome: nomeInput.value.trim(),
                descricao: nomeInput.value.trim(),
                precoUnitario: precoFinal,
                estoqueAtual: quantidadeInput ? Number(quantidadeInput.value) : 0,
                codigo: (codigoInput && codigoInput.value.trim()) || "SEM-CODIGO",
                tipo: (tipoInput && tipoInput.value.trim()) || "Geral",
                ativo: ativoInput ? ativoInput.checked : true,
                fornecedor: "Geral/Admin"
            };

            try {
                let urlFinal = API_POST;
                let metodoFinal = "POST";

                if (produtoIdEdicao !== null) {
                    body.id = produtoIdEdicao;
                    urlFinal = `${API_BASE}/${produtoIdEdicao}`;
                    metodoFinal = "PUT";
                } else {
                    body.id = 0;
                }

                const res = await fetch(urlFinal, {
                    method: metodoFinal,
                    headers: getAuthHeaders(),
                    body: JSON.stringify(body)
                });

                if (!res.ok) {
                    const textoErro = await res.text();
                    alert("Erro ao salvar produto: " + (textoErro || "Resposta inválida"));
                    return;
                }

                alert(produtoIdEdicao !== null ? "🎉 Produto atualizado com sucesso!" : "🎉 Produto cadastrado com sucesso!");
                if (modal) modal.style.display = "none";
                form.reset();
                produtoIdEdicao = null;
                carregarProdutos();

            } catch (error) {
                console.error("ERRO:", error);
                alert("Erro ao conectar com API");
            }
        });
    }

    carregarProdutos();
});