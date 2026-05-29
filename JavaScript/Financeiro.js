const TOKEN_KEY = "app_auth_token";
const apifinanceiro = "http://localhost:5000/api/Financeiro";

// botao De Sair Global
const btnSair = document.getElementById("btn-sair");
if (btnSair) {
  btnSair.addEventListener("click", () => {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = "../Login.html";
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
            const errorText = await response.text(); // Lê como texto primeiro
            throw new Error(errorText || `Erro HTTP: ${response.status}`);
        }

        if (response.status === 204) return null;

        // VERIFICAÇÃO IMPORTANTE:
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        } else {
            return await response.text(); // Se for apenas texto, retorna o texto
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

        // Correção do erro do código
        // O segredo aqui é garantir que 'financeiro' seja um array
        if (financeiro && Array.isArray(financeiro)) {
            financeiro.forEach(item => {
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
    // Paa checar as informações, coloquei um esquema de verificação de erro

    const ids = ['tipo', 'descricao', 'valor', 'vencimento', 'status-select'];
    
    // Teste para ver quem é o nulo
    for (let id of ids) {
        if (!document.getElementById(id)) {
            console.error(`O elemento com ID "${id}" não foi encontrado no HTML!`);
            return; // Para a execução antes de dar o erro de "null"
        }
    }

    const payload = {
        // Dentro de enviarNovoFinanceiro e no submit do form, mude o Valor para número:
    
    tipo: document.getElementById('tipo').value,
    descricao: document.getElementById('descricao').value,
    valor: parseFloat(document.getElementById('valor').value.replace(',', '.')) || 0, // Converte para número
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
    Valor: parseFloat(document.getElementById('valor').value),
    Tipo: document.getElementById('tipo').value,
    Status: document.getElementById('status-select').value,
    Categoria: "Geral", // Adicione um valor padrão ou crie um campo no HTML
    Observacao: document.getElementById('observacao').value
    };

    try {
        await apiFetch(`${idEdicao}`, 'PUT', dados);
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
        const lista = await apiFetch('', 'GET'); // Ajustado para a rota correta
     
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
    
    const btnSalvarModal = document.getElementById('btn-salvar-modal');
    if (btnSalvarModal) {
        console.log("Botão de salvar configurado.");
    }
});

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
    
    const btnSalvar = document.getElementById('btn-salvar-modal');
    const idEdicao = btnSalvar.dataset.idAtual;
  
    try {
          const dados = {
          Vencimento: document.getElementById('vencimento').value,
          Descricao: document.getElementById('descricao').value,
          Valor: parseFloat(document.getElementById('valor').value) || 0,
          Tipo: document.getElementById('tipo').value,
          Status: document.getElementById('status-select').value,
          Categoria: "Geral", // Campo obrigatório no seu CriarFinanceiroDTO
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
  

    