const TOKEN_KEY = "app_auth_token";
const BASE_URL = "http://localhost:5243/api/Funcionarios";

let listaFuncionariosGlobal = []; // Armazena a lista completa vinda do servidor

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

<<<<<<< HEAD
<<<<<<< Updated upstream

=======
>>>>>>> a23c09dfac10f7026dc2ba7db281ffd8203876e5
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
<<<<<<< HEAD
            `;
            corpoTabela.appendChild(tr);
        });
=======
// Renderiza os dados passados por parâmetro na tabela
function renderizarTabela(lista) {
    const corpoTabela = document.getElementById('tabela-corpo');
    if (!corpoTabela) return;

    corpoTabela.innerHTML = lista.map(f => `
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
}

export async function carregarTabeladeFuncionarios() {
    try {
        const funcionarios = await apiFetch("Get-Funcionarios");
        listaFuncionariosGlobal = funcionarios || []; // Alimenta o cache global
        
        // Aplica o filtro atual caso o usuário já tenha selecionado uma opção
        executarFiltro();
>>>>>>> Stashed changes
=======
            </tr>
        `).join('');
>>>>>>> a23c09dfac10f7026dc2ba7db281ffd8203876e5
    } catch (error) {
        alert('Falha ao carregar: ' + error.message);
    }
}

<<<<<<< HEAD
<<<<<<< Updated upstream
export async function enviarNovoFuncionario() {
    // Paa checar as informações, coloquei um esquema de verificação de erro
=======
// Realiza a filtragem comparando o cargo selecionado
function executarFiltro() {
    const seletorFiltro = document.getElementById('filtro-cargo-select');
    if (!seletorFiltro) {
        renderizarTabela(listaFuncionariosGlobal);
        return;
    }

    const cargoSelecionado = seletorFiltro.value;

    if (cargoSelecionado === "") {
        renderizarTabela(listaFuncionariosGlobal);
    } else {
        const filtrados = listaFuncionariosGlobal.filter(f => f.cargo === cargoSelecionado);
        renderizarTabela(filtrados);
    }
}

=======
>>>>>>> a23c09dfac10f7026dc2ba7db281ffd8203876e5
const getFormData = () => ({
    nome: document.getElementById('nome').value,
    email: document.getElementById('email').value,
    telefone: document.getElementById('telefone').value,
    cargo: document.getElementById('cargo-select').value,
<<<<<<< HEAD
    cpf: document.getElementById('cpf').value,
    salario: parseFloat(document.getElementById('salario').value),
    password: document.getElementById('senha')?.value 
});
>>>>>>> Stashed changes

    const ids = ['nome', 'email', 'cargo-select', 'salario', 'senha'];
    
    // Teste para ver quem é o nulo
    for (let id of ids) {
        if (!document.getElementById(id)) {
            console.error(`O elemento com ID "${id}" não foi encontrado no HTML!`);
            return; // Para a execução antes de dar o erro de "null"
        }
    }

    const payload = {
        Nome: document.getElementById('nome').value,
        Email: document.getElementById('email').value,
        Telefone: document.getElementById('telefone').value,
        Password: document.getElementById('senha').value,
        Cargo: document.getElementById('cargo-select').value,
        Salario: parseFloat(document.getElementById('salario').value)
    };

    try {
        const resposta = await apiFetch('Register-Funcionario', 'POST', payload);
        alert('Funcionário registrado com sucesso!');
        
        const form = document.getElementById('form-cadastro');
        if (form) form.reset();
        
        carregarTabeladeFuncionarios();
        return resposta;
    } catch (error) {
        alert('Erro ao cadastrar: ' + error.message);
    }
}

export async function atualizarDadosFuncionario(id) {
    const dados = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value,
        cargo: document.getElementById('cargo').value,
        salario: parseFloat(document.getElementById('salario').value)
    };

    try {
        await apiFetch(`Update-Funcionario/${id}`, 'PUT', dados);
        alert('Cadastro atualizado com sucesso!');
        carregarTabeladeFuncionarios();
    } catch (error) {
        alert('Erro ao atualizar: ' + error.message);
    }
}

export async function excluirFuncionario(id) {
    if (confirm('Tem certeza que deseja excluir esse funcionário?')) {
        try {
            await apiFetch(`Delete-Funcionario/${id}`, 'DELETE');
            alert('Cadastro excluído com sucesso!');
            carregarTabeladeFuncionarios();
        } catch (error) {
            alert('Erro ao excluir: ' + error.message);
        }
    }
}

window.editarFuncionario = async function(id) {
    try {
        const lista = await apiFetch('Get-Funcionarios', 'GET');
     
        const func = lista.find(f => f.id === id);

<<<<<<< Updated upstream
        if (func) {
            document.getElementById('nome').value = func.nome;
            document.getElementById('email').value = func.email;
            document.getElementById('cargo-select').value = func.cargo;
            document.getElementById('salario').value = func.salario;
            
            const btnSalvar = document.getElementById('btn-salvar-modal');
            btnSalvar.dataset.idAtual = id;
            btnSalvar.innerText = "Atualizar";

            document.getElementById('modal-container').style.display = 'flex';
        }
=======
        document.getElementById('nome').value = f.nome;
        document.getElementById('email').value = f.email;
        document.getElementById('telefone').value = f.telefone;
        document.getElementById('cargo-select').value = f.cargo;
        document.getElementById('cpf').value = f.cpf || '';
        document.getElementById('salario').value = f.salario;
        
        const btnSalvar = document.getElementById('btn-salvar-modal');
        btnSalvar.dataset.idAtual = id;
        btnSalvar.innerText = "Atualizar";
        document.getElementById('modal-container').style.display = 'flex';
>>>>>>> Stashed changes
    } catch (error) {
        console.error("Erro ao carregar dados para edição:", error);
    }
};

window.excluirFuncionario = excluirFuncionario;

document.addEventListener('DOMContentLoaded', () => {
    carregarTabeladeFuncionarios();
    
    const btnsalvar = document.getElementById('btn-salvar');
    if (btnsalvar) {
        btnsalvar.addEventListener('click', enviarNovoFuncionario);
    }
<<<<<<< Updated upstream
=======
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

// Ouvinte de evento mapeado para detectar mudanças no select de filtro
document.getElementById('filtro-cargo-select')?.addEventListener('change', executarFiltro);

// Logout
document.getElementById('btn-sair')?.addEventListener('click', () => {
    localStorage.removeItem(TOKEN_KEY);
    location.href = "../Login.html";
>>>>>>> Stashed changes
=======
    salario: parseFloat(document.getElementById('salario').value),
    password: document.getElementById('senha')?.value 
>>>>>>> a23c09dfac10f7026dc2ba7db281ffd8203876e5
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