const API_URL = "http://localhost:5243/api";
const TOKEN_KEY = "app_auth_token";

// botao De Sair Global
const btnSair = document.getElementById("btn-sair");
if (btnSair) {
  btnSair.addEventListener("click", () => {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = "../Login.html";
  });
}

<<<<<<< Updated upstream
=======
export async function apiFetch(endpoint, method = 'GET', data = null) {
    const token = localStorage.getItem(TOKEN_KEY);

    const config = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '' 
        }
    };

    if (data !== null) {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${apifinanceiro}/${endpoint}`, config);

        if (!response.ok) {
            const errorText = await response.text(); 
            throw new Error(errorText || `Erro HTTP: ${response.status}`);
        }

        if (response.status === 204) return null;

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        } else {
            return await response.text(); 
        }

    } catch (error) {
        console.error(`Erro na requisição para ${endpoint}:`, error);
        throw error;
    }
}

export async function carregarTabeladoFinanceiro() {
    try {
        const financeiro = await apiFetch('', 'GET');
        const corpoTabela = document.getElementById('tabela-corpo');

        if (!corpoTabela) return;
        corpoTabela.innerHTML = '';

        // Captura o filtro selecionado no topo da página
        const filtroRelatorio = document.getElementById('filtro-relatorio');
        const tipoFiltro = filtroRelatorio ? filtroRelatorio.value : 'pendentes';

        if (financeiro && Array.isArray(financeiro)) {
            financeiro.forEach(item => {
                const statusNormalizado = item.status ? item.status.toLowerCase().trim() : '';

                // Filtro dinâmico: Se escolheu "pendentes", esconde os registros "pago"
                if (tipoFiltro === 'pendentes' && statusNormalizado === 'pago') {
                    return;
                }

                // Filtro dinâmico: Se escolheu "pagos", esconde os registros "pendente"
                if (tipoFiltro === 'pagos' && statusNormalizado === 'pendente') {
                    return;
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.tipo}</td>
                    <td>${new Date(item.vencimento).toLocaleDateString('pt-BR')}</td>
                    <td>${item.descricao}</td>
                    <td>${item.status}</td>
                    <td>R$ ${parseFloat(item.valor).toFixed(2)}</td>
                    <td>${item.observacao || ''}</td>
                    <td>
                        <button class="btn-edit" onclick="editarFinanceiro(${item.id})">Editar</button>
                        <button class="btn-delete" onclick="excluirFinanceiro(${item.id})">🗑️</button>
                    </td>
                `;
                corpoTabela.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar tabela:', error);
    }
}

export async function enviarNovoFinanceiro() {
    const ids = ['tipo', 'descricao', 'valor', 'vencimento', 'status-select'];
    
    for (let id of ids) {
        if (!document.getElementById(id)) {
            console.error(`O elemento com ID "${id}" não foi encontrado no HTML!`);
            return; 
        }
    }

    const payload = {
        tipo: document.getElementById('tipo').value,
        descricao: document.getElementById('descricao').value,
        valor: parseFloat(document.getElementById('valor').value.toString().replace(',', '.')) || 0, 
        vencimento: document.getElementById('vencimento').value,
        status: document.getElementById('status-select').value,
        observacao: document.getElementById('observacao').value
    };

    try {
        const resposta = await apiFetch('', 'POST', payload);
        alert('Folha do financeiro registrada com sucesso!');
        
        const form = document.getElementById('form-cadastro');
        if (form) form.reset();
        
        carregarTabeladoFinanceiro();
        return resposta;
    } catch (error) {
        alert('Erro ao cadastrar folha do financeiro: ' + error.message);
    }
}

export async function atualizarDadosFinanceiro(id) {
    const dados = {
        Vencimento: document.getElementById('vencimento').value,
        Descricao: document.getElementById('descricao').value,
        Valor: parseFloat(document.getElementById('valor').value) || 0,
        Tipo: document.getElementById('tipo').value,
        Status: document.getElementById('status-select').value,
        Categoria: "Geral", 
        Observacao: document.getElementById('observacao').value
    };

    try {
        await apiFetch(`${id}`, 'PUT', dados);
        alert('Cadastro updated com sucesso!');
        carregarTabeladoFinanceiro();
    } catch (error) {
        alert('Erro ao atualizar: ' + error.message);
    }
}

export async function excluirFinanceiro(id) {
    if (confirm('Tem certeza que deseja excluir essa folha do financeiro?')) {
        try {
            await apiFetch(`${id}`, 'DELETE');
            alert('Cadastro excluído com sucesso!');
            carregarTabeladoFinanceiro();
        } catch (error) {
            alert('Erro ao excluir: ' + error.message);
        }
    }
}

window.editarFinanceiro = async function(id) {
    try {
        const lista = await apiFetch('', 'GET'); 
        const func = lista.find(f => f.id === id);

        if (func) {
            document.getElementById('tipo').value = func.tipo || '';
            document.getElementById('vencimento').value = func.vencimento ? func.vencimento.split('T')[0] : '';
            document.getElementById('descricao').value = func.descricao || '';
            document.getElementById('valor').value = func.valor || '';
            
            const campoStatus = document.getElementById('status-select');
            if (campoStatus) {
                campoStatus.value = func.status;
            }

            document.getElementById('observacao').value = func.observacao || '';
            
            const btnSalvar = document.getElementById('btn-salvar-modal');
            btnSalvar.dataset.idAtual = id;
            btnSalvar.innerText = "Atualizar";

            document.getElementById('modal-container').style.display = 'flex';
        }
    } catch (error) {
        console.error("Erro ao carregar dados para edição:", error);
        alert("Erro ao buscar dados do registro.");
    }
};

window.excluirFinanceiro = excluirFinanceiro;

document.addEventListener('DOMContentLoaded', () => {
    carregarTabeladoFinanceiro();
    
    // Atualiza a tabela dinamicamente quando muda o filtro do relatório
    const filtroRelatorio = document.getElementById('filtro-relatorio');
    if (filtroRelatorio) {
        filtroRelatorio.addEventListener('change', () => {
            carregarTabeladoFinanceiro();
        });
    }
    
    const btnSalvarModal = document.getElementById('btn-salvar-modal');
    if (btnSalvarModal) {
        console.log("Botão de salvar configurado.");
    }
});

const modal = document.getElementById('modal-container');
const btnAbrir = document.getElementById('btn-abrir-modal');
const btnFechar = document.getElementById('btn-fechar-modal');
const formCadastro = document.getElementById('form-cadastro');

if (btnAbrir) {
    btnAbrir.addEventListener('click', () => {
        modal.style.display = 'flex';
    });
}

if (btnFechar) {
    btnFechar.addEventListener('click', () => {
        modal.style.display = 'none';
        formCadastro.reset(); 
        const btnSalvar = document.getElementById('btn-salvar-modal');
        if (btnSalvar) {
            delete btnSalvar.dataset.idAtual;
            btnSalvar.innerText = "Salvar";
        }
    });
}

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
        formCadastro.reset();
        const btnSalvar = document.getElementById('btn-salvar-modal');
        if (btnSalvar) {
            delete btnSalvar.dataset.idAtual;
            btnSalvar.innerText = "Salvar";
        }
    }
});

formCadastro.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btnSalvar = document.getElementById('btn-salvar-modal');
    const idEdicao = btnSalvar.dataset.idAtual;
  
    try {
        const dados = {
            Vencimento: document.getElementById('vencimento').value,
            Descricao: document.getElementById('descricao').value,
            Valor: parseFloat(document.getElementById('valor').value.toString().replace(',', '.')) || 0,
            Tipo: document.getElementById('tipo').value,
            Status: document.getElementById('status-select').value,
            Categoria: "Geral", 
            Observacao: document.getElementById('observacao').value
        };
    
        if (idEdicao) {
            await apiFetch(`${idEdicao}`, 'PUT', dados);
            alert("Atualizado com sucesso!");
        } else {
            await apiFetch('', 'POST', dados);
            alert("Cadastrado com sucesso!");
        }
    
        delete btnSalvar.dataset.idAtual;
        btnSalvar.innerText = "Salvar";
        modal.style.display = 'none'; 
        formCadastro.reset();
        carregarTabeladoFinanceiro();
    
    } catch (error) {
        alert("Erro ao processar: " + error.message);
    }
});
>>>>>>> Stashed changes
