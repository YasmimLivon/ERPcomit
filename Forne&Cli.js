const API_URL = 'http://localhost:5243/api';
const TOKEN_KEY = 'app_auth_token';
let editandoId = null;

// Atalho prático para selecionar elementos
const $ = (id) => document.getElementById(id);
const tabela = $('tabela-corpo');

// --- 1. LISTAR DADOS ---
async function listarDados() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const [resCli, resForn] = await Promise.all([
            fetch(`${API_URL}/Parceiros/Get-Clientes`, { headers }),
            fetch(`${API_URL}/Parceiros/Get-Fornecedores`, { headers })
        ]);

        if (!resCli.ok || !resForn.ok) throw new Error("Falha na autenticação");

        const clientes = await resCli.json();
        const fornecedores = await resForn.json();

        tabela.innerHTML = "";
        clientes.forEach(item => renderizarLinha(item, "Cliente"));
        fornecedores.forEach(item => renderizarLinha(item, "Fornecedor"));
    } catch (e) { console.error("Erro ao listar:", e.message); }
}

function renderizarLinha(item, tipo) {
    const id = item.id || item.Id;
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${item.nome || item.Nome}</td>
        <td>${item.cpf || item.Cpf || item.cnpj || item.Cnpj || '---'}</td>
        <td>${item.cidade || item.Cidade || "---"}</td>
        <td>${item.telefone || item.Telefone || '---'}</td>
        <td>${tipo}</td>
        <td>
            <button class="btn-edit">Editar</button>
            <button class="btn-delete">🗑️</button>
        </td>
    `;
    row.querySelector('.btn-edit').onclick = () => abrirEdicao(item, tipo);
    row.querySelector('.btn-delete').onclick = () => deletar(id, tipo);
    tabela.appendChild(row);
}

// --- 2. SALVAR (CADASTRO / EDIÇÃO) - CORRIGIDO ---
$('form-cadastro').onsubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem(TOKEN_KEY);
    const tipo = $('tipo').value; // "Cliente" ou "Fornecedor"

    const payload = {
        nome: $('nome').value,
        email: $('email').value,
        telefone: $('telefone').value,
        role: "User"
    };

    // Senha opcional
    const pass = $('password').value;
    if (pass.trim()) payload.password = pass;

    // Documento e Cidade
    if (tipo === "Cliente") {
        payload.cpf = $('documento').value;
        payload.cidade = $('cidade').value;
    } else {
        payload.cnpj = $('documento').value;
    }

    // --- LÓGICA DE URL CORRIGIDA ---
    let endpoint = "";
    if (editandoId) {
        endpoint = `Update-${tipo}/${editandoId}`;
    } else {
        // Resolve o problema do "Fornecedors" vs "Fornecedores"
        endpoint = (tipo === "Cliente") ? "Register-Clientes" : "Register-Fornecedores";
    }

    try {
        const res = await fetch(`${API_URL}/Parceiros/${endpoint}`, {
            method: editandoId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            fecharModais();
            listarDados();
        } else {
            const erroTxt = await res.text();
            alert("Erro na API: " + erroTxt);
        }
    } catch (e) { alert("Erro de conexão com o servidor."); }
};

// --- 3. FILTROS E INTERFACE ---
$('form-filtro').onsubmit = (e) => {
    e.preventDefault();
    const nome = $('filtro-nome').value.toLowerCase();
    const tipo = $('filtro-tipo').value;
    const cidade = $('filtro-cidade').value.toLowerCase();

    document.querySelectorAll('#tabela-corpo tr').forEach(row => {
        const bateNome = row.cells[0].innerText.toLowerCase().includes(nome);
        const bateCid = row.cells[2].innerText.toLowerCase().includes(cidade);
        const bateTipo = (tipo === "Todos" || row.cells[4].innerText === tipo);
        row.style.display = (bateNome && bateCid && bateTipo) ? "" : "none";
    });
    $('modal-filtro').style.display = 'none';
};

$('btn-resetar-filtro').onclick = () => {
    $('form-filtro').reset();
    document.querySelectorAll('#tabela-corpo tr').forEach(row => row.style.display = "");
    $('modal-filtro').style.display = 'none';
};

function abrirEdicao(item, tipo) {
    editandoId = item.id || item.Id;
    $('nome').value = item.nome || item.Nome;
    $('email').value = item.email || item.Email;
    $('telefone').value = item.telefone || item.Telefone;
    $('documento').value = item.cpf || item.Cpf || item.cnpj || item.Cnpj || "";
    $('tipo').value = tipo;
    $('password').value = "";
    $('modal-container').style.display = 'flex';
}

async function deletar(id, tipo) {
    if (!confirm("Excluir?")) return;
    const token = localStorage.getItem(TOKEN_KEY);
    await fetch(`${API_URL}/Parceiros/Delete-${tipo}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    listarDados();
}

function fecharModais() {
    $('modal-container').style.display = 'none';
    $('modal-filtro').style.display = 'none';
}

// Eventos de botões
$('btn-abrir-modal').onclick = () => { editandoId = null; $('form-cadastro').reset(); $('modal-container').style.display = 'flex'; };
$('btn-abrir-filtro').onclick = () => $('modal-filtro').style.display = 'flex';
$('btn-fechar-modal').onclick = $('btn-fechar-filtro').onclick = fecharModais;
$('btn-sair').onclick = () => { localStorage.removeItem(TOKEN_KEY); location.href = "Login.html"; };

document.addEventListener('DOMContentLoaded', listarDados);