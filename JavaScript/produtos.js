document.addEventListener("DOMContentLoaded", () => {

    const TOKEN_KEY = "app_auth_token";

    const API_GET = "http://localhost:5243/api/Produtos";
    const API_POST = "http://localhost:5243/api/Produtos/cadastrar";

    // 🔹 LOGOUT
    document.getElementById("btn-sair")?.addEventListener("click", () => {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = "../Login.html";
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

    // 🔹 TOKEN HEADER
    function getAuthHeaders() {
        return {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem(TOKEN_KEY)
        };
    }

    // 🔹 MODAL
    if (openModalBtn) openModalBtn.onclick = () => { if (modal) modal.style.display = "flex"; };
    if (closeModalBtn) closeModalBtn.onclick = () => { if (modal) modal.style.display = "none"; };

    // Fechar se clicar fora da caixa branca do modal
    if (modal) {
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = "none";
            }
        });
    }

    // 🔹 LISTA
    let listaProdutos = [];

    // 🔹 CARREGAR PRODUTOS
    async function carregarProdutos() {
        try {
            const res = await fetch(API_GET, {
                headers: getAuthHeaders()
            });

            console.log("GET STATUS:", res.status);

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

    // 🔹 RENDER TABELA
    function renderTabela(lista) {
        if (!tabela) return;
        tabela.innerHTML = "";

        if (lista && Array.isArray(lista)) {
            lista.forEach(p => {
                const precoUnitario = parseFloat(p.precoUnitario ?? 0);
                tabela.innerHTML += `
                    <tr>
                        <td>${p.nome}</td>
                        <td>${precoUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td>${p.codigo ?? "-"}</td>
                        <td>${p.estoqueAtual ?? 0}</td>
                        <td>${p.tipo ?? "-"}</td>
                        <td>${p.ativo ? "✔️" : "❌"}</td>
                        <td>
                            <button class="btn-delete" data-id="${p.id}">🗑️</button>
                        </td>
                    </tr>
                `;
            });
        }
    }

    // 🔹 EXCLUIR
    if (tabela) {
        tabela.addEventListener("click", async (e) => {
            if (!e.target.classList.contains("btn-delete")) return;

            const id = e.target.getAttribute("data-id");

            if (!confirm("Deseja excluir este produto?")) return;

            try {
                const res = await fetch(`${API_GET}/${id}`, {
                    method: "DELETE",
                    headers: {
                        "Authorization": "Bearer " + localStorage.getItem(TOKEN_KEY)
                    }
                });

                if (!res.ok) {
                    const erro = await res.text();
                    throw new Error(erro);
                }

                alert("Produto excluído!");
                carregarProdutos();

            } catch (error) {
                console.error(error);
                alert("Erro ao excluir");
            }
        });
    }

    // 🔹 FILTRO
    if (filtroInput) {
        filtroInput.addEventListener("input", () => {
            const valor = filtroInput.value.toLowerCase();

            const filtrados = listaProdutos.filter(p =>
                p.nome && p.nome.toLowerCase().includes(valor)
            );

            renderTabela(filtrados);
        });
    }

    // 🔹 CADASTRAR PRODUTO
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!nomeInput || !nomeInput.value.trim()) {
                alert("Nome é obrigatório!");
                return;
            }

            const rawPreco = precoInput ? precoInput.value.toString() : "0";
            const body = {
                id: 0,
                nome: nomeInput.value.trim(),
                descricao: nomeInput.value.trim(),
                precoUnitario: Number(rawPreco.replace(",", ".")) || 0,
                estoqueAtual: quantidadeInput ? Number(quantidadeInput.value) : 0,
                codigo: (codigoInput && codigoInput.value.trim()) || "SEM-CODIGO",
                tipo: (tipoInput && tipoInput.value.trim()) || "Geral",
                ativo: ativoInput ? ativoInput.checked : true
            };

            console.log("ENVIANDO:", body);

            try {
                const res = await fetch(API_POST, {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify(body)
                });

                console.log("POST STATUS:", res.status);

                let resposta = null;
                try {
                    resposta = await res.json();
                } catch {}

                console.log("RESPOSTA:", resposta);

                if (!res.ok) {
                    alert("Erro ao cadastrar produto");
                    return;
                }

                alert("Produto cadastrado com sucesso!");

                if (modal) modal.style.display = "none";
                form.reset();

                carregarProdutos();

            } catch (error) {
                console.error("ERRO:", error);
                alert("Erro ao conectar com API");
            }
        });
    }

    // 🔹 INIT E CONTROLE DE CONTAINER DE SCROLL
    carregarProdutos();

    // 📜 ADICIONA COMPORTAMENTO DE SCROLL AUTOMÁTICO NA TABELA CASO ELA SEJA MUITO GRANDE
    const tabelaCorpo = document.getElementById('tabela-corpo');
    if (tabelaCorpo) {
        const tabelaPai = tabelaCorpo.closest('table')?.parentElement;
        if (tabelaPai) {
            tabelaPai.style.maxHeight = "500px"; // Teto visual padrão do painel
            tabelaPai.style.overflowY = "auto";  // Ativa a rolagem vertical interna
            tabelaPai.style.overflowX = "auto";  // Garante integridade horizontal em resoluções menores
        }
    }
});