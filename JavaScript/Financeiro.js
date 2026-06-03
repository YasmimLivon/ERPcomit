const TOKEN_KEY = "app_auth_token";
const apifinanceiro = "https://winxs-api.azurewebsites.net/api/Financeiro";

// Botão De Sair Global
const btnSair = document.getElementById("btn-sair");
if (btnSair) {
  btnSair.addEventListener("click", () => {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = "../Index.html";
  });
}

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

        if (financeiro && Array.isArray(financeiro)) {
            financeiro.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.tipo}</td>
                    <td>${item.vencimento ? new Date(item.vencimento).toLocaleDateString('pt-BR') : '-'}</td>
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
        valor: parseFloat(document.getElementById('valor').value.replace(',', '.')) || 0,
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
        // 🔹 CORRIGIDO: idEdicao alterado para usar o parâmetro "id" recebido na função
        await apiFetch(`${id}`, 'PUT', dados);
        alert('Cadastro atualizado com sucesso!');
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
            if (btnSalvar) {
                btnSalvar.dataset.idAtual = id;
                btnSalvar.innerText = "Atualizar";
            }

            const modalContainer = document.getElementById('modal-container');
            if (modalContainer) modalContainer.style.display = 'flex';
        }
    } catch (error) {
        console.error("Erro ao carregar dados para edição:", error);
        alert("Erro ao buscar dados do registro.");
    }
};

window.excluirFinanceiro = excluirFinanceiro;

// 🔹 CONFIGURAÇÕES DE SCROLL E COMPORTAMENTOS DA TELA
document.addEventListener('DOMContentLoaded', () => {
    carregarTabeladoFinanceiro();
    
    // 📜 AJUSTE DE SCROLL AUTOMÁTICO PARA A TABELA
    // Procura o container pai da sua tabela para aplicar rolagem caso ela cresça muito
    const tabelaCorpo = document.getElementById('tabela-corpo');
    if (tabelaCorpo) {
        const tabelaPai = tabelaCorpo.closest('table')?.parentElement;
        if (tabelaPai) {
            tabelaPai.style.maxHeight = "500px"; // Limita a altura máxima da listagem
            tabelaPai.style.overflowY = "auto";  // Ativa o Scroll vertical quando necessário
            tabelaPai.style.overflowX = "auto";  // Ativa Scroll horizontal se a tela encolher demais
        }
    }

    const modal = document.getElementById('modal-container');
    const btnAbrir = document.getElementById('btn-abrir-modal');
    const btnFechar = document.getElementById('btn-fechar-modal');
    const formCadastro = document.getElementById('form-cadastro');

    if (btnAbrir && modal) {
        btnAbrir.addEventListener('click', () => {
            modal.style.display = 'flex';
        });
    }

    if (btnFechar && modal && formCadastro) {
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

    if (modal && formCadastro) {
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
    }

    if (formCadastro) {
        formCadastro.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btnSalvar = document.getElementById('btn-salvar-modal');
            const idEdicao = btnSalvar ? btnSalvar.dataset.idAtual : null;
          
            try {
                const dados = {
                    Vencimento: document.getElementById('vencimento').value,
                    Descricao: document.getElementById('descricao').value,
                    Valor: parseFloat(document.getElementById('valor').value) || 0,
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
        
                if (btnSalvar) {
                    delete btnSalvar.dataset.idAtual;
                    btnSalvar.innerText = "Salvar";
                }
                if (modal) modal.style.display = 'none'; 
                formCadastro.reset();
                carregarTabeladoFinanceiro();
        
            } catch (error) {
                alert("Erro ao processar: " + error.message);
            }
        });
    }
}); 