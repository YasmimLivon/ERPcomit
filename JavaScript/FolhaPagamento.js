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

// --- FUNÇÃO AUXILIAR PARA LIMPAR NÚMEROS (Evita Erro 400) ---
const formatarParaDecimal = (valor) => {
    if (!valor || valor === "") return 0;
    // Converte string para número, aceitando vírgula ou ponto
    const numero = parseFloat(valor.toString().replace(',', '.'));
    return isNaN(numero) ? 0 : numero;
};

// --- 1. CÁLCULO DINÂMICO NO MODAL ---
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
inputNome.onblur = buscarFuncionarioPorNome;

// CARREGAR TABELA (COM CRUZAMENTO DE DADOS)
async function carregarTabelaFolhas() {
    const token = localStorage.getItem(TOKEN_KEY);
    try {
        const res = await fetch(`${API_URL}/FolhadePagamento`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Erro ao buscar folhas");

        const folhas = await res.json();
        const corpoTabela = document.getElementById("tabela-corpo");
        corpoTabela.innerHTML = "";

      folhas.forEach(f => {
    // Pegando os nomes exatos que apareceram no seu console.log
    const idFolha = f.id; 
    const nome = f.nomeFuncionario;
    const cpf = f.cpfFuncionario;
    const cargo = f.cargo;
    
    // ATENÇÃO AQUI: Verifique se estes nomes estão assim no console (letra inicial minúscula)
    const faltas = f.faltasOutros || 0; 
    const bruto = f.salarioBruto || 0;
    const descontos = f.totalDesconto || 0;


    console.log("Valor das faltas para esta linha:", faltas);

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

    } catch (e) {
        console.error("Erro na tabela:", e);
    }
}

//SALVAR / ATUALIZAR (POST/PUT)
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
            alert(folhaAtualId ? "Atualizado!" : "Cadastrado!");
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

// (EDITAR, EXCLUIR, MODAL)
window.editarFolha = async (id) => {
    const token = localStorage.getItem(TOKEN_KEY);
    try {
        const res = await fetch(`${API_URL}/FolhadePagamento/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const f = await res.json();

        folhaAtualId = f.id;
        funcionarioAtualId = f.funcionariosId;
        
        // buscar o nome do funcionário para o input
        const resFunc = await fetch(`${API_URL}/Funcionarios/Get-Funcionarios`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const funcs = await resFunc.json();
        const funcRef = funcs.find(x => x.id === f.funcionariosId);

        inputNome.value = funcRef ? funcRef.nome : "";
        inputCpf.value = funcRef ? funcRef.cpf : "";
        inputCargo.value = f.cargo;
        inputSalarioBase.value = f.salarioBruto;
        inputHorasExtra.value = f.horaExtra;
        inputInss.value = f.inss;
        inputIrrf.value = f.irrf;
        inputBeneficios.value = f.beneficios;
        inputFaltas.value = f.faltasOutros;

        btnSalvarModal.innerText = "Atualizar";
        modal.style.display = "flex";
        calcularFolhaNoModal();
    } catch (e) {
        alert("Erro ao carregar dados.");
    }
};

window.excluirFolha = async (id) => {
    console.log("Deletando folha com ID real:", id); 

    if (!id || id === undefined) {
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
    modal.style.display = 'none';
    formCadastro.reset();
    folhaAtualId = null;
    funcionarioAtualId = null;
    btnSalvarModal.innerText = "Salvar";
};

document.addEventListener('DOMContentLoaded', () => {
    carregarTabelaFolhas();
    $("btn-abrir-modal")?.addEventListener('click', () => {
        fecharModal();
        modal.style.display = 'flex';
    });
    $("btn-fechar-modal")?.addEventListener('click', fecharModal);
    $("btn-sair")?.addEventListener('click', () => {
        localStorage.removeItem(TOKEN_KEY);
        location.href = "../Login.html";
    });
});