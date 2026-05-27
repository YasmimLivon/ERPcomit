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
    if (openModalBtn) openModalBtn.onclick = () => modal.style.display = "flex";
    if (closeModalBtn) closeModalBtn.onclick = () => modal.style.display = "none";

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
            listaProdutos = data;
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

        lista.forEach(p => {
            tabela.innerHTML += `
                <tr>
                    <td>${p.nome}</td>
                    <td>R$ ${(p.precoUnitario ?? 0).toFixed(2)}</td>
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

    // 🔹 EXCLUIR (CORRIGIDO)
    if (tabela) {
        tabela.addEventListener("click", async (e) => {
            if (!e.target.classList.contains("btn-delete")) return;

            const id = e.target.getAttribute("data-id");

            if (!confirm("Deseja excluir este produto?")) return;

            try {
                // 🔥 SINTAXE CORRIGIDA AQUI: O '$' agora está corretamente dentro do padrão do template literal
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

            if (!nomeInput.value.trim()) {
                alert("Nome é obrigatório!");
                return;
            }

            const body = {
                id: 0,
                nome: nomeInput.value.trim(),
                descricao: nomeInput.value.trim(),
                precoUnitario: Number(precoInput.value.replace(",", ".")) || 0,
                estoqueAtual: Number(quantidadeInput.value) || 0,
                codigo: codigoInput.value.trim() || "SEM-CODIGO",
                tipo: tipoInput.value.trim() || "Geral",
                ativo: ativoInput.checked
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

                modal.style.display = "none";
                form.reset();

                carregarProdutos();

            } catch (error) {
                console.error("ERRO:", error);
                alert("Erro ao conectar com API");
            }
        });
    }

    // 🔹 INIT
    carregarProdutos();
});