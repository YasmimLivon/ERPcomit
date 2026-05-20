const TOKEN_KEY = "app_auth_token";
const apifuncionarios = "http://localhost:5243/api/Funcionarios";


export async function apiFetch(endpoint, method = 'GET', data = null) {
    const config = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (data !== null) {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${apifuncionarios}/${endpoint}`, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.mensagem || `Erro HTTP: ${response.status}`);
        }

        if (response.status === 204) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error(`Erro na requisição para ${endpoint}:`, error);
        throw error;
    }
}


export async function carregarTabeladeFuncionarios() {
    try {
        const funcionarios = await apiFetch('Get-Funcionarios', 'GET');
        const corpoTabela = document.getElementById('tabela-corpo');

        if (!corpoTabela) return;
        corpoTabela.innerHTML = '';

        funcionarios.forEach(func => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${func.id}</td>
                <td>${func.nome}</td>
                <td>${func.salario}</td>
                <td>${func.telefone}</td>
                <td>${func.cargo}</td>
                <td>
                    <button onclick="editarFuncionario(${func.id})">Editar</button>
                    <button onclick="excluirFuncionario(${func.id})">Excluir</button>
                </td>
            `;
            corpoTabela.appendChild(tr);
        });
    } catch (error) {
        alert('Falha ao carregar os funcionários: ' + error.message);
    }
}

export async function enviarNovoFuncionario() {
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

window.editarFuncionario = (id) => console.log('Editar ID:', id);
window.excluirFuncionario = excluirFuncionario;

document.addEventListener('DOMContentLoaded', () => {
    carregarTabeladeFuncionarios();
    
    const btnsalvar = document.getElementById('btn-salvar');
    if (btnsalvar) {
        btnsalvar.addEventListener('click', enviarNovoFuncionario);
    }
});

// Para o Model "caixinha de adicionar novo funcionário"

const modal = document.getElementById('modal-container');
const btnAbrir = document.getElementById('btn-abrir-modal');
const btnFechar = document.getElementById('btn-fechar-modal');
const formCadastro = document.getElementById('form-cadastro');

// Para abrir
btnAbrir.addEventListener('click', () => {
    modal.style.display = 'flex';
});

// Para fechar
btnFechar.addEventListener('click', () => {
    modal.style.display = 'none';
    formCadastro.reset(); // Limpa o form ao fechar
});

// Fechar se clicar fora da caixa branca
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Salvar
formCadastro.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const sucesso = await enviarNovoFuncionario();
    
    if (sucesso) {
        modal.style.display = 'none'; // Fecha o pop-up após cadastrar
    }
});