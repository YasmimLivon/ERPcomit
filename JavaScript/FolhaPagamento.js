const API_URL = "http://localhost:5243/api";
const TOKEN_KEY = "app_auth_token";

let funcionarioAtualId = null; 
let folhaAtualId = null; 

const $ = (id) => document.getElementById(id);

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

[inputSalarioBase, inputHorasExtra, inputInss, inputIrrf, inputBeneficios, inputFaltas].forEach(el => {
    if (el) el.oninput = calcularFolhaNoModal;
});

async function buscarFuncionarioPorNome() {
    const nomeValue = inputNome.value.trim();
    if (nomeValue.length < 3) return;

    const token = localStorage.getItem(TOKEN_KEY);
    try {
        const res = await fetch(`${API_URL}/Funcionarios/Get-Funcionarios`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const funcionarios = await res.json();
        const encontrado = funcionarios.find(f => f.nome.toLowerCase().includes(nomeValue.toLowerCase()));

        if (encontrado) {
            funcionarioAtualId = encontrado.id;
            inputCargo.value = encontrado.cargo || "";
            inputCpf.value = encontrado.cpf || "";
            inputSalarioBase.value = encontrado.salario || 0;
            calcularFolhaNoModal();
        }
    } catch (e) {
        console.error("Erro ao buscar funcionário:", e);
    }
}
if (inputNome) inputNome.onblur = buscarFuncionarioPorNome;

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
                const idFolha = f.id; 
                const nome = f.nomeFuncionario;
                const cpf = f.cpfFuncionario;
                const cargo = f.cargo;
                const faltas = f.faltasOutros || 0; 
                const bruto = f.salarioBruto || 0;
                const descontos = f.totalDesconto || 0;

                corpoTabela.innerHTML += `
                    <tr>
                        <td>${nome}</td>
                        <td>${cpf}</td>
                        <td>${cargo}</td>
                        <td>${faltas !== undefined ? faltas : 0}</td>
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
                    console.error("Aviso: Folha gravada, mas o fluxo de caixa do painel não pôde ser atualizado:", errFin);
                }

                alert(folhaAtualId ? "Atualizado com sucesso!" : "Folha cadastrada e integrada ao Financeiro!");
                fecharModal();
                carregarTabelaFolhas();
            } else {
                const erroServer = await res.json();
                console.error("Erro da API:", erroServer);
                alert("Erro na validação dos dados. Verifique o console.");
            }
        } catch (e) {
            alert("Erro ao conectar com o servidor.");
        }
    };
}

window.editarFolha = async (id) => {
    const token = localStorage.getItem(TOKEN_KEY);
    try {
        const res = await fetch(`${API_URL}/FolhadePagamento/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const f = await res.json();

        folhaAtualId = f.id;
        funcionarioAtualId = f.funcionariosId;
        
        const resFunc = await fetch(`${API_URL}/Funcionarios/Get-Funcionarios`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const funcs = await resFunc.json();
        const funcRef = funcs.find(x => x.id === f.funcionariosId);

        if (inputNome) inputNome.value = funcRef ? funcRef.nome : "";
        if (inputCpf) inputCpf.value = funcRef ? funcRef.cpf : "";
        if (inputCargo) inputCargo.value = f.cargo;
        if (inputSalarioBase) inputSalarioBase.value = f.salarioBruto;
        if (inputHorasExtra) inputHorasExtra.value = f.horaExtra;
        if (inputInss) inputInss.value = f.inss;
        if (inputIrrf) inputIrrf.value = f.irrf;
        if (inputBeneficios) inputBeneficios.value = f.beneficios;
        if (inputFaltas) inputFaltas.value = f.faltasOutros;

        if (btnSalvarModal) btnSalvarModal.innerText = "Atualizar";
        if (modal) modal.style.display = "flex";
        calcularFolhaNoModal();
    } catch (e) {
        alert("Erro ao carregar dados.");
    }
};

window.excluirFolha = async (id) => {
    if (!id) {
        alert("Erro: ID da folha não encontrado.");
        return;
    }

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

// 🔹 CONFIGURAÇÕES DE SCROLL E COMPORTAMENTOS DA TELA
document.addEventListener('DOMContentLoaded', () => {
    carregarTabelaFolhas();
    
    // 📜 INSTANCIAÇÃO AUTOMÁTICA DA ALTURA E SCROLL DA LISTAGEM
    const tabelaCorpo = document.getElementById('tabela-corpo');
    if (tabelaCorpo) {
        const tabelaPai = tabelaCorpo.closest('table')?.parentElement;
        if (tabelaPai) {
            tabelaPai.style.maxHeight = "500px"; // Limita o tamanho vertical máximo da lista
            tabelaPai.style.overflowY = "auto";  // Ativa a descida de página interna (scroll)
            tabelaPai.style.overflowX = "auto";  // Evita estouro lateral em telas menores
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

    // Fechar se o usuário clicar no background escuro do modal
    if (modal) {
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                fecharModal();
            }
        });
    }
});