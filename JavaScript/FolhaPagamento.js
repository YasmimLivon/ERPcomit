const API_URL = "http://localhost:5243/api";
const TOKEN_KEY = "app_auth_token";

let funcionarioAtualId = null; 
let folhaAtualId = null; 

const $ = (id) => document.getElementById(id);

// Elementos do DOM mapeados conforme o HTML corrigido
const inputNome = $("nome"); 
const inputCargo = $("cargo"); 
const inputCpf = $("cpf");
const inputSalarioBase = $("salario-base");
const inputFaltas = $("faltas");
const inputImpostos = $("impostos");
const inputHorasExtra = $("horas");
const inputSalarioTotal = $("salario-total");
const inputInss = $("inss");
const inputIrrf = $("irrf");
const inputBeneficios = $("beneficios");

const modal = $("modal-container");
const formCadastro = $("form-cadastro");
const btnSalvarModal = $("btn-salvar-modal");

// --- Auxiliares de Cálculo ---

const formatarParaDecimal = (valor) => {
    if (!valor || valor === "") return 0;
    const numero = parseFloat(valor.toString().replace(',', '.'));
    return isNaN(numero) ? 0 : numero;
};

function calcularFolhaNoModal() {
    const salarioBase = formatarParaDecimal(inputSalarioBase.value);
    const horasExtra = formatarParaDecimal(inputHorasExtra.value);
    const beneficios = formatarParaDecimal(inputBeneficios.value);
    
    const inss = formatarParaDecimal(inputInss.value);
    const irrf = formatarParaDecimal(inputIrrf.value);
    const faltas = formatarParaDecimal(inputFaltas.value);

    const ganhos = salarioBase + horasExtra + beneficios;
    const descontos = inss + irrf + faltas; 
    const salarioLiquido = ganhos - descontos;

    if (inputImpostos) inputImpostos.value = descontos.toFixed(2);
    if (inputSalarioTotal) inputSalarioTotal.value = salarioLiquido.toFixed(2);
}

// Vincula o cálculo automático a qualquer mudança de valor nos inputs numéricos
[inputSalarioBase, inputHorasExtra, inputInss, inputIrrf, inputBeneficios, inputFaltas].forEach(el => {
    if (el) el.oninput = calcularFolhaNoModal;
});

// --- Busca Automática de Funcionários ---

async function buscarFuncionarioPorNome() {
    const nomeValue = inputNome.value.trim();
    if (nomeValue.length < 3) return;

    console.log(`🔍 Procurando funcionários com: "${nomeValue}"`);

    const token = localStorage.getItem(TOKEN_KEY);
    try {
        const res = await fetch(`${API_URL}/Funcionarios/Get-Funcionarios`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) {
            console.error(`❌ Erro na API: Status ${res.status}`);
            return;
        }

        const funcionarios = await res.json();
        if (!Array.isArray(funcionarios)) return;

        // Procura tratando maiúsculas/minúsculas e chaves PascalCase/camelCase
        const encontrado = funcionarios.find(f => {
            const nomeObj = f.nome || f.Nome || "";
            return nomeObj.toLowerCase().includes(nomeValue.toLowerCase());
        });

        if (encontrado) {
            funcionarioAtualId = encontrado.id || encontrado.Id;
            
            // Atribui os valores diretamente aos inputs do formulário
            if (inputCargo) inputCargo.value = encontrado.cargo || encontrado.Cargo || "";
            if (inputCpf) inputCpf.value = encontrado.cpf || encontrado.Cpf || "";
            
            const salarioFinal = encontrado.salario || encontrado.Salario || 
                                 encontrado.salarioBruto || encontrado.SalarioBruto || 
                                 encontrado.salarioBase || encontrado.SalarioBase || 0;
            
            if (inputSalarioBase) inputSalarioBase.value = salarioFinal;

            console.log("✅ Inputs preenchidos com os dados do funcionário!");
            
            // Recalcula o salário total e impostos com base no novo salário base carregado
            calcularFolhaNoModal();
        } else {
            funcionarioAtualId = null;
        }
    } catch (e) {
        console.error("❌ Erro ao buscar funcionário:", e);
    }
}

// Escuta a digitação do usuário e dispara a busca automática após 500ms sem digitar
let timeoutBusca = null;
if (inputNome) {
    inputNome.oninput = () => {
        clearTimeout(timeoutBusca);
        timeoutBusca = setTimeout(buscarFuncionarioPorNome, 500);
    };
}

// --- Listagem e Controle da Tabela ---

async function carregarTabelaFolhas() {
    const token = localStorage.getItem(TOKEN_KEY);
    try {
        const res = await fetch(`${API_URL}/FolhadePagamento`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Erro ao buscar folhas");

        const folhas = await res.json();
        const corpoTabela = document.getElementById("tabela-corpo");
        if (!corpoTabela) return;
        
        corpoTabela.innerHTML = "";

        if (folhas && Array.isArray(folhas)) {
            folhas.forEach(f => {
                const idFolha = f.id || f.Id; 
                const nome = f.nomeFuncionario || f.NomeFuncionario;
                const cpf = f.cpfFuncionario || f.CpfFuncionario;
                const cargo = f.cargo || f.Cargo;
                const faltas = f.faltasOutros !== undefined ? f.faltasOutros : (f.FaltasOutros || 0); 
                const bruto = f.salarioBruto || f.SalarioBruto || 0;
                const descontos = f.totalDesconto || f.TotalDesconto || 0;

                corpoTabela.innerHTML += `
                    <tr>
                        <td>${nome}</td>
                        <td>${cpf}</td>
                        <td>${cargo}</td>
                        <td>${faltas}</td>
                        <td>${descontos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td>${bruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td>
                            <button class="btn-edit" onclick="editarFolha(${idFolha})">Editar</button>
                            <button class="btn-delete" onclick="excluirFolha(${idFolha})">🗑️</button>
                        </td>
                    </tr>
                `;
            });
        }
    } catch (e) {
        console.error("Erro na tabela:", e);
    }
}

// --- Criação e Edição de Registros (Submit) ---

if (formCadastro) {
    formCadastro.onsubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem(TOKEN_KEY);

        if (!funcionarioAtualId) {
            alert("Selecione um funcionário válido buscando pelo nome.");
            return;
        }

        const payload = {
            cargo: inputCargo.value,
            salarioBruto: formatarParaDecimal(inputSalarioBase.value),
            horaExtra: formatarParaDecimal(inputHorasExtra.value),
            funcionariosId: parseInt(funcionarioAtualId),
            mesReferencia: new Date().toISOString(),
            inss: formatarParaDecimal(inputInss.value),
            irrf: formatarParaDecimal(inputIrrf.value),
            beneficios: formatarParaDecimal(inputBeneficios.value),
            faltasOutros: formatarParaDecimal(inputFaltas.value)
        };

        const url = folhaAtualId ? `${API_URL}/FolhadePagamento/${folhaAtualId}` : `${API_URL}/FolhadePagamento`;
        const method = folhaAtualId ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // Integração do lançamento de caixa com o Financeiro
                try {
                    const valorLiquidoLancamento = formatarParaDecimal(inputSalarioTotal.value);
                    await fetch(`${API_URL}/Financeiro`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            descricao: `Folha de Pgto - ${inputNome.value}`,
                            valor: valorLiquidoLancamento,
                            tipo: "Salários", 
                            status: "Pago",
                            dataVencimento: new Date().toISOString().split('T')[0]
                        })
                    });
                } catch (errFin) {
                    console.error("Aviso: Falha ao integrar com fluxo de caixa do financeiro:", errFin);
                }

                alert(folhaAtualId ? "Atualizado com sucesso!" : "Folha cadastrada e integrada ao Financeiro!");
                fecharModal();
                carregarTabelaFolhas();
            } else {
                const erroServer = await res.json().catch(() => ({}));
                console.error("Erro retornado do C#:", erroServer);
                alert("Erro na validação do servidor. Verifique o console.");
            }
        } catch (e) {
            alert("Erro ao conectar com o servidor.");
        }
    };
}

// --- Funções Globais da Interface (Window) ---

window.editarFolha = async (id) => {
    const token = localStorage.getItem(TOKEN_KEY);
    try {
        const res = await fetch(`${API_URL}/FolhadePagamento/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const f = await res.json();

        folhaAtualId = f.id || f.Id;
        funcionarioAtualId = f.funcionariosId || f.FuncionariosId;
        
        const resFunc = await fetch(`${API_URL}/Funcionarios/Get-Funcionarios`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const funcs = await resFunc.json();
        const funcRef = funcs.find(x => (x.id || x.Id) === funcionarioAtualId);

        if (inputNome) inputNome.value = funcRef ? (funcRef.nome || funcRef.Nome) : "";
        if (inputCpf) inputCpf.value = funcRef ? (funcRef.cpf || funcRef.Cpf) : "";
        if (inputCargo) inputCargo.value = f.cargo || f.Cargo || "";
        if (inputSalarioBase) inputSalarioBase.value = f.salarioBruto || f.SalarioBruto || 0;
        if (inputHorasExtra) inputHorasExtra.value = f.horaExtra || f.HoraExtra || 0;
        if (inputInss) inputInss.value = f.inss || f.Inss || 0;
        if (inputIrrf) inputIrrf.value = f.irrf || f.Irrf || 0;
        if (inputBeneficios) inputBeneficios.value = f.beneficios || f.Beneficios || 0;
        if (inputFaltas) inputFaltas.value = f.faltasOutros || f.FaltasOutros || 0;

        if (btnSalvarModal) btnSalvarModal.innerText = "Atualizar";
        if (modal) modal.style.display = "flex";
        calcularFolhaNoModal();
    } catch (e) {
        alert("Erro ao carregar dados.");
    }
};

window.excluirFolha = async (id) => {
    if (!id) return;
    if (!confirm("Deseja realmente excluir esta folha?")) return;

    const token = localStorage.getItem(TOKEN_KEY);
    try {
        const res = await fetch(`${API_URL}/FolhadePagamento/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
            alert("Excluído com sucesso!");
            carregarTabelaFolhas();
        } else {
            const msg = await res.text();
            alert("Erro ao excluir: " + msg);
        }
    } catch (e) {
        alert("Erro de conexão com o servidor.");
    }
};

const fecharModal = () => {
    if (modal) modal.style.display = 'none';
    if (formCadastro) formCadastro.reset();
    folhaAtualId = null;
    funcionarioAtualId = null;
    if (btnSalvarModal) btnSalvarModal.innerText = "Salvar";
};

// --- Inicialização ---

document.addEventListener('DOMContentLoaded', () => {
    carregarTabelaFolhas();
    
    const tabelaCorpo = document.getElementById('tabela-corpo');
    if (tabelaCorpo) {
        const tabelaPai = tabelaCorpo.closest('table')?.parentElement;
        if (tabelaPai) {
            tabelaPai.style.maxHeight = "500px"; 
            tabelaPai.style.overflowY = "auto";  
            tabelaPai.style.overflowX = "auto";  
        }
    }

    $("btn-abrir-modal")?.addEventListener('click', () => {
        fecharModal();
        if (modal) modal.style.display = 'flex';
    });
    
    $("btn-fechar-modal")?.addEventListener('click', fecharModal);
    
    $("btn-sair")?.addEventListener('click', () => {
        localStorage.removeItem(TOKEN_KEY);
        location.href = "../Login.html";
    });

    if (modal) {
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                fecharModal();
            }
        });
    }
});