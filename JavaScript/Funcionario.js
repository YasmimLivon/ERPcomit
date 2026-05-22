const TOKEN_KEY = "app_auth_token";
const BASE_URL = "http://localhost:5243/api/Funcionarios";

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

export async function carregarTabeladeFuncionarios() {
    try {
        const funcionarios = await apiFetch("Get-Funcionarios");
        const corpoTabela = document.getElementById('tabela-corpo');
        if (!corpoTabela) return;

        corpoTabela.innerHTML = funcionarios.map(f => `
            <tr>
                <td>${f.nome}</td>
                <td>${f.email}</td>
                <td>${f.telefone}</td>
                <td>${f.cargo}</td>
                <td>R$ ${parseFloat(f.salario).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                <td style="display: flex; gap: 10px;">
                    <button class="btn-edit" onclick="editarFuncionario(${f.id})">Editar</button>
                    <button class="btn-delete" onclick="excluirFuncionario(${f.id})">🗑️</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        alert('Falha ao carregar: ' + error.message);
    }
}

const getFormData = () => ({
    nome: document.getElementById('nome').value,
    email: document.getElementById('email').value,
    telefone: document.getElementById('telefone').value,
    cargo: document.getElementById('cargo-select').value,
    salario: parseFloat(document.getElementById('salario').value),
    password: document.getElementById('senha')?.value 
});

async function manipularSubmit(e) {
    e.preventDefault();
    const btnSalvar = document.getElementById('btn-salvar-modal');
    const id = btnSalvar.dataset.idAtual;
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
        alert(error.message);
    }
}

window.editarFuncionario = async function(id) {
    try {
        const lista = await apiFetch('Get-Funcionarios');
        const f = lista.find(item => item.id === id);
        if (!f) return;

        document.getElementById('nome').value = f.nome;
        document.getElementById('email').value = f.email;
        document.getElementById('cargo-select').value = f.cargo;
        document.getElementById('salario').value = f.salario;
        
        const btnSalvar = document.getElementById('btn-salvar-modal');
        btnSalvar.dataset.idAtual = id;
        btnSalvar.innerText = "Atualizar";
        document.getElementById('modal-container').style.display = 'flex';
    } catch (error) {
        alert("Erro ao carregar dados.");
    }
};

window.excluirFuncionario = async function(id) {
    if (!confirm('Deseja excluir?')) return;
    try {
        await apiFetch(`Delete-Funcionario/${id}`, 'DELETE');
        carregarTabeladeFuncionarios();
    } catch (error) {
        alert(error.message);
    }
};

const modal = document.getElementById('modal-container');
const formCadastro = document.getElementById('form-cadastro');

const fecharModal = () => {
    modal.style.display = 'none';
    formCadastro.reset();
    delete document.getElementById('btn-salvar-modal').dataset.idAtual;
    document.getElementById('btn-salvar-modal').innerText = "Salvar";
};

document.getElementById('btn-abrir-modal')?.addEventListener('click', () => modal.style.display = 'flex');
document.getElementById('btn-fechar-modal')?.addEventListener('click', fecharModal);
formCadastro?.addEventListener('submit', manipularSubmit);

// Logout
document.getElementById('btn-sair')?.addEventListener('click', () => {
    localStorage.removeItem(TOKEN_KEY);
    location.href = "../Login.html";
});

// Inicialização
if (formCadastro) carregarTabeladeFuncionarios();