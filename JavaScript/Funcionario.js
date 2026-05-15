const TOKEN_KEY = "app_auth_token";

const API_GET = "http://localhost:5243/api/Funcionarios/Get-Funcionarios";
const API_POST = "http://localhost:5243/api/Funcionarios/Register-Funcionario";
const API_DELETE = "http://localhost:5243/api/Funcionarios/Delete-Funcionario";
const API_PUT = "http://localhost:5243/api/Funcionarios/Update-Funcionario";

// 🔹 CONTROLE DE EDIÇÃO
let editandoId = null;

// 🔹 LOGOUT
document.getElementById("btn-sair")?.addEventListener("click", () => {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = "../Login.html";
});

// 🔹 ELEMENTOS
const modal = document.getElementById("modal-container");
const btnAbrir = document.querySelector(".btn-adicionar");
const btnFechar = document.getElementById("btn-fechar-modal");
const form = document.getElementById("form-cadastro");
const tabela = document.getElementById("tabela-corpo");
const btnFiltrar = document.querySelector(".btn-filtrar");

// 🔹 INPUTS
const nomeInput = document.getElementById("nome");
const emailInput = document.getElementById("email");
const cargoInput = document.querySelector("select[name='cargo']");
const salarioInput = document.getElementById("salario");
const senhaInput = document.getElementById("senha");

// 🔹 HEADER
function getAuthHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.getItem(TOKEN_KEY)
    };
}

// 🔹 MODAL
btnAbrir.addEventListener("click", () => {
    editandoId = null; 
    form.reset();
    modal.style.display = "flex";
});

btnFechar.addEventListener("click", () => {
    modal.style.display = "none";
});

// 🔹 LISTA
let listaFuncionarios = [];

async function carregarFuncionarios() {
    try {
        const res = await fetch(API_GET, {
            headers: getAuthHeaders()
        });

        if (!res.ok) throw new Error("Erro ao carregar funcionários");

        listaFuncionarios = await res.json();
        renderTabela(listaFuncionarios);

    } catch (error) {
        console.error(error);
        alert("Erro ao carregar funcionários");
    }
}

// 🔹 RENDER
function renderTabela(lista) {
    tabela.innerHTML = "";

    lista.forEach(f => {
        tabela.innerHTML += `
            <tr>
                <td>${f.nome}</td>
                <td>${f.cpfCnpj ?? "-"}</td>
                <td>${f.cidade ?? "-"}</td>
                <td>${f.telefone ?? "-"}</td>
                <td>${f.cargo ?? "-"}</td>
                <td class="acao">
                    <button onclick="editarFuncionario(${f.id})">✏️</button>
                    <button onclick="excluirFuncionario(${f.id})">🗑️</button>
                </td>
            </tr>
        `;
    });
}

// 🔹 FILTRO
btnFiltrar.addEventListener("click", () => {
    const termo = prompt("Digite o nome do funcionário:");

    if (!termo) {
        renderTabela(listaFuncionarios);
        return;
    }

    const filtrados = listaFuncionarios.filter(f =>
        f.nome?.toLowerCase().includes(termo.toLowerCase())
    );

    renderTabela(filtrados);
});

// 🔹 EDITAR (ABRE MODAL)
function editarFuncionario(id) {
    const func = listaFuncionarios.find(f => f.id === id);

    if (!func) return;

    editandoId = id;

    nomeInput.value = func.nome || "";
    emailInput.value = func.email || "";
    cargoInput.value = func.cargo || "";
    salarioInput.value = func.salario || 0;
    senhaInput.value = ""; // Senha geralmente não retorna por segurança

    modal.style.display = "flex";
}

// 🔹 SALVAR (POST ou PUT)
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Montando o body conforme a exigência da sua API
    const body = {
        nome: nomeInput.value.trim(),
        email: emailInput.value.trim(),
        password: senhaInput.value,    // Alterado para 'password'
        role: "funcionarios",          // Valor fixo solicitado
        cargo: cargoInput.value,
        salario: parseFloat(salarioInput.value) || 0
    };

    // Se for edição, precisamos enviar o ID no corpo
    if (editandoId) {
        body.id = editandoId;
    }

    const url = editandoId ? API_PUT : API_POST;

    try {
        const res = await fetch(url, {
            method: editandoId ? "PUT" : "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const erro = await res.text();
            alert("Erro na API: " + erro);
            return;
        }

        alert(editandoId ? "Funcionário atualizado!" : "Funcionário cadastrado!");

        modal.style.display = "none";
        form.reset();
        editandoId = null;

        carregarFuncionarios();

    } catch (error) {
        console.error(error);
        alert("Erro inesperado: " + error.message);
    }
});

// 🔹 EXCLUIR
async function excluirFuncionario(id) {
    if (!confirm("Deseja excluir este funcionário?")) return;

    try {
        const res = await fetch(`${API_DELETE}?id=${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem(TOKEN_KEY)
            }
        });

        if (!res.ok) {
            const erro = await res.text();
            throw new Error(erro);
        }

        alert("Funcionário excluído!");
        carregarFuncionarios();

    } catch (error) {
        console.error(error);
        alert("Erro: " + error.message);
    }
}

// 🔹 INIT
carregarFuncionarios();