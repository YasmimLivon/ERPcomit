const TOKEN_KEY = "app_auth_token";
const BASE_URL = "http://localhost:5243/api/Parceiros";

let listaParceirosGlobal = []; // Armazena a lista unificada para busca e filtro local

// --- Auxiliares de API ---

async function apiFetch(endpoint, method = 'GET', data = null) {
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
        
        // 🚨 SE DER 401 (UNAUTHORIZED), CHUTA DIRETO PARA O LOGIN
        if (response.status === 401) {
            alert("Sessão expirada ou não autorizada. Por favor, faça login novamente.");
            localStorage.removeItem(TOKEN_KEY);
            window.location.href = "../Login.html";
            return null;
        }
        
        if (response.status === 204) return [];
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.mensagem || `Erro: ${response.status}`);
        }
        
        return await response.json().catch(() => []);
    } catch (error) {
        console.error(`Erro crítico em ${endpoint}:`, error);
        // Lança o erro para a frente para o Promise.all saber que a requisição faliu de verdade
        throw error; 
    }
}
// --- Funções de Interface (UI) ---

function renderizarTabela(lista) {
    const corpoTabela = document.getElementById('tabela-corpo');
    if (!corpoTabela) return;

    if (!lista || !Array.isArray(lista) || lista.length === 0) {
        corpoTabela.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#999; padding:20px;">Nenhum registro localizado.</td></tr>`;
        return;
    }

    corpoTabela.innerHTML = lista.map(item => {
        const id = item.id || item.Id;
        const nome = item.nome || item.Nome;
        const documento = item.cpf || item.Cpf || item.cnpj || item.Cnpj || "---";
        const cidade = item.cidade || item.Cidade || "---";
        const telefone = item.telefone || item.Telefone || "---";
        const tipo = item.tipoParceiro || item.Tipo || (item.cpf ? "Cliente" : "Fornecedor");

        return `
            <tr>
                <td><strong>#${id}</strong></td>
                <td>${nome}</td>
                <td>${documento}</td>
                <td>${cidade}</td>
                <td>${telefone}</td>
                <td>${tipo}</td>
                <td>
                    <div style="display: flex; gap: 10px;">
                        <button class="data-role-only btn-edit" data-allowed="funcionarios,admin" onclick="editarParceiro(${id}, '${tipo}')">Editar</button>
                        <button class="data-role-only btn-delete" data-allowed="funcionarios,admin" onclick="excluirParceiro(${id}, '${tipo}')">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // 💡 REAPLICA A SEGURANÇA: Avisa o auth-guard para esconder os botões caso o usuário seja um cliente
    if (typeof verificarEControlarAcesso === "function") {
        verificarEControlarAcesso();
    }
}

async function listarDados() {
    const corpoTabela = document.getElementById('tabela-corpo');
    if (corpoTabela) {
        corpoTabela.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#666; padding:20px;">Carregando dados...</td></tr>`;
    }

    try {
        // 🔹 Faz as duas chamadas simultâneas para o seu backend
        const [clientes, fornecedores] = await Promise.all([
            apiFetch("Get-Clientes"),
            apiFetch("Get-Fornecedores")
        ]);

        // Garante que os dados sejam arrays válidos antes do map
        const listaClientes = Array.isArray(clientes) ? clientes : [];
        const listaFornecedores = Array.isArray(fornecedores) ? fornecedores : [];

        // Injeta o tipo correto para controle do Front-end
        const clientesMarcados = listaClientes.map(c => ({ ...c, tipoParceiro: "Cliente" }));
        const fornecedoresMarcados = listaFornecedores.map(f => ({ ...f, tipoParceiro: "Fornecedor" }));

        // Une as duas coleções no array global
        listaParceirosGlobal = [...clientesMarcados, ...fornecedoresMarcados];
        
        executarFiltro();
    } catch (error) {
        console.error("Erro geral ao listar dados:", error);
        if (corpoTabela) {
            corpoTabela.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#d9534f; padding:20px;">Erro ao processar dados do servidor.</td></tr>`;
        }
    }
}

function executarFiltro() {
    const filtroNome = document.getElementById('filtro-nome')?.value.toLowerCase() || "";
    const filtroTipo = document.getElementById('filtro-tipo')?.value || "Todos";
    const filtroCidade = document.getElementById('filtro-cidade')?.value.toLowerCase() || "";

    const filtrados = listaParceirosGlobal.filter(item => {
        const nome = (item.nome || item.Nome || "").toLowerCase();
        const cidade = (item.cidade || item.Cidade || "").toLowerCase();
        const tipo = item.tipoParceiro;

        const bateNome = nome.includes(filtroNome);
        const bateCidade = cidade.includes(filtroCidade);
        const bateTipo = (filtroTipo === "Todos" || tipo === filtroTipo);

        return bateNome && bateCidade && bateTipo;
    });

    renderizarTabela(filtrados);
}

// --- Lógica de Formulário ---

const getFormData = (tipo) => {
    const payload = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value,
        role: "User"
    };

    const pass = document.getElementById('password')?.value;
    if (pass && pass.trim() !== "") payload.password = pass;

    if (tipo === "Cliente") {
        payload.cpf = document.getElementById('documento').value;
        payload.cidade = document.getElementById('cidade').value;
    } else {
        payload.cnpj = document.getElementById('documento').value;
    }

    return payload;
};

async function manipularSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const id = form.dataset.idAtual;
    const tipo = document.getElementById('tipo').value;
    const dados = getFormData(tipo);

    let endpoint = "";
    let metodo = "POST";

    if (id) {
        endpoint = `Update-${tipo}/${id}`;
        metodo = "PUT";
    } else {
        endpoint = tipo === "Cliente" ? "Register-Clientes" : "Register-Fornecedores";
    }

    try {
        const token = localStorage.getItem(TOKEN_KEY);
        const response = await fetch(`${BASE_URL}/${endpoint}`, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify(dados)
        });

        if (response.ok || response.status === 204) {
            alert(`${tipo} salvo com sucesso!`);
            fecharModais();
            listarDados();
            return;
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.mensagem || `Erro: ${response.status}`);
    } catch (error) {
        alert("Erro na operação: " + error.message);
    }
}

// --- Funções Globais (Expostas via Window) ---

window.editarParceiro = function(id, tipo) {
    const item = listaParceirosGlobal.find(p => (p.id === id || p.Id === id) && p.tipoParceiro === tipo);
    if (!item) return;

    document.getElementById('nome').value = item.nome || item.Nome || '';
    document.getElementById('email').value = item.email || item.Email || '';
    document.getElementById('telefone').value = item.telefone || item.Telefone || '';
    document.getElementById('documento').value = item.cpf || item.Cpf || item.cnpj || item.Cnpj || '';
    document.getElementById('tipo').value = tipo;
    document.getElementById('cidade').value = item.cidade || item.Cidade || '';
    document.getElementById('password').value = '';

    document.getElementById('label-doc').innerText = tipo === "Cliente" ? "CPF" : "CNPJ";

    const formCadastro = document.getElementById('form-cadastro');
    if (formCadastro) {
        formCadastro.dataset.idAtual = id;
    }

    const modalTitulo = document.querySelector('#modal-container h2');
    if (modalTitulo) modalTitulo.innerText = "Editar Registro";

    const modal = document.getElementById('modal-container');
    if (modal) modal.style.display = 'flex';
};

window.excluirParceiro = async function(id, tipo) {
    if (!confirm(`Deseja realmente excluir permanentemente este ${tipo}?`)) return;
    
    const sufixoTipo = tipo === "Cliente" ? "Cliente" : "Fornecedor";
    
    try {
        const token = localStorage.getItem(TOKEN_KEY);
        const response = await fetch(`${BASE_URL}/Delete-${sufixoTipo}/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        });

        if (response.ok || response.status === 204) {
            alert(`${tipo} excluído com sucesso!`);
            listarDados();
            return;
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.mensagem || `Erro: ${response.status}`);
    } catch (error) {
        alert("Erro ao excluir: " + error.message);
    }
};

function fecharModais() {
    const modalContainer = document.getElementById('modal-container');
    const modalFiltro = document.getElementById('modal-filtro');
    const formCadastro = document.getElementById('form-cadastro');

    if (modalContainer) modalContainer.style.display = 'none';
    if (modalFiltro) modalFiltro.style.display = 'none';
    
    if (formCadastro) {
        formCadastro.reset();
        delete formCadastro.dataset.idAtual;
    }

    const modalTitulo = document.querySelector('#modal-container h2');
    if (modalTitulo) modalTitulo.innerText = "Cadastrar Novo";
    
    document.getElementById('label-doc').innerText = "CPF";
}

// --- Inicialização ---

document.addEventListener('DOMContentLoaded', () => {
    listarDados();

    const formCadastro = document.getElementById('form-cadastro');
    if (formCadastro) {
        formCadastro.addEventListener('submit', manipularSubmit);
    }

    const formFiltro = document.getElementById('form-filtro');
    if (formFiltro) {
        formFiltro.addEventListener('submit', (e) => {
            e.preventDefault();
            executarFiltro();
            document.getElementById('modal-filtro').style.display = 'none';
        });
    }

    document.getElementById('tipo')?.addEventListener('change', (e) => {
        document.getElementById('label-doc').innerText = e.target.value === "Cliente" ? "CPF" : "CNPJ";
    });

    document.getElementById('btn-abrir-modal')?.addEventListener('click', () => {
        fecharModais();
        const modal = document.getElementById('modal-container');
        if (modal) modal.style.display = 'flex';
    });

    document.getElementById('btn-abrir-filtro')?.addEventListener('click', () => {
        const modalFiltro = document.getElementById('modal-filtro');
        if (modalFiltro) modalFiltro.style.display = 'flex';
    });

    document.getElementById('btn-fechar-modal')?.addEventListener('click', fecharModais);
    document.getElementById('btn-fechar-filtro')?.addEventListener('click', fecharModais);

    document.getElementById('btn-resetar-filtro')?.addEventListener('click', () => {
        document.getElementById('form-filtro')?.reset();
        executarFiltro();
        document.getElementById('modal-filtro').style.display = 'none';
    });

    document.getElementById('btn-sair')?.addEventListener('click', () => {
        localStorage.removeItem(TOKEN_KEY);
        location.href = "../Login.html";
    });

    window.addEventListener('click', (event) => {
        const modalContainer = document.getElementById('modal-container');
        const modalFiltro = document.getElementById('modal-filtro');
        if (event.target === modalContainer || event.target === modalFiltro) {
            fecharModais();
        }
    });
});