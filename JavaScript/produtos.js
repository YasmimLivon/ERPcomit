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

    // 🔹 INPUTS (Totalmente livre de campos de estoque)
    const nomeInput = document.getElementById("nome");
    const codigoInput = document.getElementById("codigo");
    const precoInput = document.getElementById("preco");
    const tipoInput = document.getElementById("tipo");
    const ativoInput = document.getElementById("ativo");

    // 🔹 TOKEN HEADER
    function getAuthHeaders() {
        return {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem(TOKEN_KEY)
        };
    }

    // 🔹 MODAL CONTROL
    if (openModalBtn) openModalBtn.onclick = () => modal.style.display = "flex";
    if (closeModalBtn) closeModalBtn.onclick = () => modal.style.display = "none";

    // 🔹 CACHE GLOBAL DE DADOS
    let listaProdutos = [];

    // 🔹 CARREGAR PRODUTOS DA API
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

    // 🔹 RENDER TABELA DINÂMICA
    function renderTabela(lista) {
        if (!tabela) return;
        tabela.innerHTML = "";

        lista.forEach(p => {
            const precoFormatado = parseFloat(p.precoUnitario ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            tabela.innerHTML += `
                <tr>
                    <td>${p.nome}</td>
                    <td>${precoFormatado}</td>
                    <td>${p.codigo ?? "-"}</td>
                    <td>${p.tipo ?? "-"}</td>
                    <td>${p.ativo ? "✔️" : "❌"}</td>
                    <td>
                        <button class="btn-delete" data-id="${p.id}">🗑️</button>
                    </td>
                </tr>
            `;
        });
    }

    // 🔹 EXCLUIR PRODUTO
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

                alert("Produto excluído com sucesso!");
                carregarProdutos();

            } catch (error) {
                console.error(error);
                alert("Erro ao excluir produto.");
            }
        });
    }

    // 🔹 FILTRO EM TEMPO REAL
    if (filtroInput) {
        filtroInput.addEventListener("input", () => {
            const valor = filtroInput.value.toLowerCase();

            const filtrados = listaProdutos.filter(p =>
                p.nome && p.nome.toLowerCase().includes(valor)
            );

            renderTabela(filtrados);
        });
    }

    // 🔹 SUBMIT DE CADASTRO (POST)
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!nomeInput.value.trim()) {
                alert("Nome é obrigatório!");
                return;
            }

            // Estrutura limpa enviada ao C# sem chaves de quantidade/estoque
            const body = {
                id: 0,
                nome: nomeInput.value.trim(),
                descricao: nomeInput.value.trim(),
                precoUnitario: Number(precoInput.value.replace(",", ".")) || 0,
                codigo: codigoInput.value.trim() || "SEM-CODIGO",
                tipo: tipoInput.value.trim() || "Geral",
                ativo: ativoInput.checked
            };

            console.log("ENVIANDO PAYLOAD:", body);

            try {
                const res = await fetch(API_POST, {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify(body)
                });

                console.log("POST STATUS:", res.status);

                if (!res.ok) {
                    alert("Erro ao cadastrar produto");
                    return;
                }

                alert("Produto cadastrado com sucesso!");

                modal.style.display = "none";
                form.reset();
                carregarProdutos();

            } catch (error) {
                console.error("ERRO:", error);
                alert("Erro ao conectar com API");
            }
        });
    }

    // 🔹 EXECUÇÃO INICIAL
    carregarProdutos();

});