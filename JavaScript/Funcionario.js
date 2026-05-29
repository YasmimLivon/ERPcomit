const TOKEN_KEY = "app_auth_token";
const BASE_URL = "http://localhost:5243/api/Funcionarios";

let listaFuncionariosGlobal = []; // Armazena a lista completa vinda do servidor para busca/filtro

// --- Auxiliares de API ---

export async function apiFetch(endpoint, method = 'GET', data = null) {
    const token = localStorage.getItem(TOKEN_KEY);
    const config = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };

    if (data) config.body = JSON.stringify(data);

    try {
        const response = await fetch(`${BASE_URL}/${endpoint}`, config);
        
        if (response.status === 204) return null;
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.mensagem || `Erro: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Erro em ${endpoint}:`, error);
        throw error;
    }
}

// --- Funções de Interface (UI) ---

function renderizarTabela(lista) {
    const corpoTabela = document.getElementById('tabela-corpo');
    if (!corpoTabela) return;

    if (!lista || !Array.isArray(lista)) {
        corpoTabela.innerHTML = "";
        return;
    }

    corpoTabela.innerHTML = lista.map(f => `
        <tr>
            <td>${f.nome}</td>
            <td>${f.email}</td>
            <td>${f.telefone || '---'}</td>
            <td>${f.cargo}</td>
            <td>R$ ${parseFloat(f.salario || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            <td>
                <div style="display: flex; gap: 10px;">
                    <button class="btn-edit" onclick="editarFuncionario(${f.id})">Editar</button>
                    <button class="btn-delete" onclick="excluirFuncionario(${f.id})">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

export async function carregarTabeladeFuncionarios() {
    try {
        const funcionarios = await apiFetch("Get-Funcionarios");
        listaFuncionariosGlobal = funcionarios || [];
        executarFiltro(); // Renderiza aplicando filtros se houver
    } catch (error) {
        alert('Falha ao carregar funcionários: ' + error.message);
    }
}

function executarFiltro() {
    const seletorFiltro = document.getElementById('filtro-cargo-select');
    const cargoSelecionado = seletorFiltro ? seletorFiltro.value : "";

    if (cargoSelecionado === "") {
        renderizarTabela(listaFuncionariosGlobal);
    } else {
        const filtrados = listaFuncionariosGlobal.filter(f => f.cargo === cargoSelecionado);
        renderizarTabela(filtrados);
    }
}

// --- Lógica de Formulário ---

const getFormData = () => ({
    nome: document.getElementById('nome').value,
    email: document.getElementById('email').value,
    telefone: document.getElementById('telefone').value,
    cargo: document.getElementById('cargo-select').value,
    salario: parseFloat(document.getElementById('salario').value) || 0,
    password: document.getElementById('senha')?.value || ""
});

async function manipularSubmit(e) {
    e.preventDefault();
    const btnSalvar = document.getElementById('btn-salvar-modal');
    const id = btnSalvar ? btnSalvar.dataset.idAtual : null;
    const dados = getFormData();

    try {
        if (id) {
            await apiFetch(`Update-Funcionario/${id}`, 'PUT', dados);
            alert("Atualizado com sucesso!");
        } else {
            await apiFetch('Register-Funcionario', 'POST', dados);
            alert("Cadastrado com sucesso!");
        }
        fecharModal();
        carregarTabeladeFuncionarios();
    } catch (error) {
        alert("Erro na operação: " + error.message);
    }
}

// --- Funções Globais (Expostas para o HTML) ---

window.editarFuncionario = async function(id) {
    try {
        const f = listaFuncionariosGlobal.find(item => item.id === id);
        if (!f) return;

        document.getElementById('nome').value = f.nome || '';
        document.getElementById('email').value = f.email || '';
        document.getElementById('telefone').value = f.telefone || '';
        document.getElementById('cargo-select').value = f.cargo || '';
        document.getElementById('salario').value = f.salario || 0;
        
        const btnSalvar = document.getElementById('btn-salvar-modal');
        if (btnSalvar) {
            btnSalvar.dataset.idAtual = id;
            btnSalvar.innerText = "Atualizar";
        }
        const modal = document.getElementById('modal-container');
        if (modal) modal.style.display = 'flex';
    } catch (error) {
        alert("Erro ao carregar dados para edição.");
    }
};

window.excluirFuncionario = async function(id) {
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) return;
    try {
        await apiFetch(`Delete-Funcionario/${id}`, 'DELETE');
        alert("Excluído com sucesso!");
        carregarTabeladeFuncionarios();
    } catch (error) {
        alert("Erro ao excluir: " + error.message);
    }
};

// --- Gerenciamento do Modal e Eventos ---

const fecharModal = () => {
    const modal = document.getElementById('modal-container');
    const formCadastro = document.getElementById('form-cadastro');
    if (modal) modal.style.display = 'none';
    if (formCadastro) formCadastro.reset();
    const btnSalvar = document.getElementById('btn-salvar-modal');
    if (btnSalvar) {
        delete btnSalvar.dataset.idAtual;
        btnSalvar.innerText = "Salvar";
    }
};

// --- Inicialização ---

document.addEventListener('DOMContentLoaded', () => {
    const formCadastro = document.getElementById('form-cadastro');
    
    // Carrega a listagem base de funcionários
    carregarTabeladeFuncionarios();

    // 📜 CONTROLE DE SCROLL AUTOMÁTICO PARA A LISTAGEM DE FUNCIONÁRIOS
    const tabelaCorpo = document.getElementById('tabela-corpo');
    if (tabelaCorpo) {
        const tabelaPai = tabelaCorpo.closest('table')?.parentElement;
        if (tabelaPai) {
            tabelaPai.style.maxHeight = "500px"; // Limita o tamanho vertical máximo do box
            tabelaPai.style.overflowY = "auto";  // Ativa a barra de rolagem (scroll)
            tabelaPai.style.overflowX = "auto";  // Garante responsividade horizontal
        }
    }

    if (formCadastro) {
        formCadastro.addEventListener('submit', manipularSubmit);
    }

    document.getElementById('btn-abrir-modal')?.addEventListener('click', () => {
        fecharModal(); // Limpa antes de abrir novo
        const modal = document.getElementById('modal-container');
        if (modal) modal.style.display = 'flex';
    });

    document.getElementById('btn-fechar-modal')?.addEventListener('click', fecharModal);
    
    document.getElementById('filtro-cargo-select')?.addEventListener('change', executarFiltro);

    document.getElementById('btn-sair')?.addEventListener('click', () => {
        localStorage.removeItem(TOKEN_KEY);
        location.href = "../Login.html";
    });

    // Fechar se clicar fora da caixa branca do modal
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
        window.addEventListener('click', (event) => {
            if (event.target === modalContainer) {
                fecharModal();
            }
        });
    }
});