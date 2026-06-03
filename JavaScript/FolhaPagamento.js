const API_FOLHA = "https://winxs-api.azurewebsites.net/api/FolhadePagamento";
const API_FUNCIONARIOS = "https://winxs-api.azurewebsites.net/api/Funcionarios";
const TOKEN_KEY = "app_auth_token";

let funcionarioAtualId = null; 
let folhaAtualId = null; 

const $ = (id) => document.getElementById(id);

// ELEMENTOS
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

const btnAbrirModal = $("btn-abrir-modal");
const btnFecharModal = $("btn-fechar-modal");

// 🔹 FECHAR MODAL
function fecharModal() {
    if (modal) modal.style.display = "none";
    formCadastro.reset();
    folhaAtualId = null;
    funcionarioAtualId = null;
    btnSalvarModal.innerText = "Salvar";
}

// 🔹 CALCULO
const formatarParaDecimal = (valor) => {
    if (!valor) return 0;
    const numero = parseFloat(valor.toString().replace(',', '.'));
    return isNaN(numero) ? 0 : numero;
};

function calcularFolhaNoModal() {
    const ganhos =
        formatarParaDecimal(inputSalarioBase.value) +
        formatarParaDecimal(inputHorasExtra.value) +
        formatarParaDecimal(inputBeneficios.value);

    const descontos =
        formatarParaDecimal(inputInss.value) +
        formatarParaDecimal(inputIrrf.value) +
        formatarParaDecimal(inputFaltas.value);

    inputImpostos.value = descontos.toFixed(2);
    inputSalarioTotal.value = (ganhos - descontos).toFixed(2);
}

[inputSalarioBase, inputHorasExtra, inputInss, inputIrrf, inputBeneficios, inputFaltas]
.forEach(el => el && (el.oninput = calcularFolhaNoModal));

// 🔹 BUSCAR FUNCIONÁRIO (CPF CORRIGIDO)
async function buscarFuncionarioPorNome() {
    const nomeValue = inputNome.value.trim();
    if (nomeValue.length < 3) return;

    const token = localStorage.getItem(TOKEN_KEY);

    const res = await fetch(`${API_FUNCIONARIOS}/Get-Funcionarios`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    const funcionarios = await res.json();

    const encontrado = funcionarios.find(f =>
        (f.nome || f.Nome || "").toLowerCase().includes(nomeValue.toLowerCase())
    );

    if (encontrado) {
        funcionarioAtualId = encontrado.id || encontrado.Id;

        inputCargo.value = encontrado.cargo || encontrado.Cargo || "";

        // 🔥 CORREÇÃO DO CPF AQUI
        inputCpf.value =
            encontrado.cpf ||
            encontrado.Cpf ||
            encontrado.cpfFuncionario ||
            encontrado.CpfFuncionario ||
            "";

        inputSalarioBase.value =
            encontrado.salario ||
            encontrado.Salario ||
            encontrado.salarioBase ||
            encontrado.SalarioBase ||
            0;

        calcularFolhaNoModal();
    }
}

let timeoutBusca;
inputNome && (inputNome.oninput = () => {
    clearTimeout(timeoutBusca);
    timeoutBusca = setTimeout(buscarFuncionarioPorNome, 500);
});

// 🔹 TABELA (CPF GARANTIDO)
async function carregarTabelaFolhas() {
    const token = localStorage.getItem(TOKEN_KEY);

    const [resFolhas, resFunc] = await Promise.all([
        fetch(API_FOLHA, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_FUNCIONARIOS}/Get-Funcionarios`, { headers: { Authorization: `Bearer ${token}` } })
    ]);

    const folhas = await resFolhas.json();
    const funcionarios = await resFunc.json();

    const tabela = $("tabela-corpo");
    if (!tabela) return;

    tabela.innerHTML = "";

    folhas.forEach(f => {
        const idFolha = f.id || f.Id;
        const funcId = f.funcionariosId || f.FuncionariosId;

        const func = funcionarios.find(x => (x.id || x.Id) === funcId);

        const nome =
            f.nomeFuncionario ||
            f.NomeFuncionario ||
            func?.nome ||
            func?.Nome ||
            "Não informado";

        const cpf =
            func?.cpf ||
            func?.Cpf ||
            f.cpfFuncionario ||
            f.CpfFuncionario ||
            "Não informado";

        const cargo =
            f.cargo ||
            f.Cargo ||
            func?.cargo ||
            func?.Cargo ||
            "-";

        tabela.innerHTML += `
            <tr>
                <td>${nome}</td>
                <td>${cpf}</td>
                <td>${cargo}</td>
                <td>${f.faltasOutros ?? 0}</td>
                <td>${Number(f.totalDesconto || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
                <td>${Number(f.salarioBruto || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
                <td>
                    <button class="btn-edit" onclick="editarFolha(${idFolha})">✏️</button>
                    <button class="btn-delete" onclick="excluirFolha(${idFolha})">🗑️</button>
                </td>
            </tr>
        `;
    });
}

// 🔹 EDITAR
window.editarFolha = async (id) => {
    const token = localStorage.getItem(TOKEN_KEY);

    const res = await fetch(`${API_FOLHA}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    const f = await res.json();

    folhaAtualId = f.id || f.Id;
    funcionarioAtualId = f.funcionariosId || f.FuncionariosId;

    const resFunc = await fetch(`${API_FUNCIONARIOS}/Get-Funcionarios`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    const funcs = await resFunc.json();
    const func = funcs.find(x => (x.id || x.Id) === funcionarioAtualId);

    if (func) {
        inputNome.value = func.nome || func.Nome || "";
        inputCpf.value = func.cpf || func.Cpf || "";
        inputCargo.value = func.cargo || func.Cargo || "";
    }

    inputSalarioBase.value = f.salarioBruto || f.SalarioBruto || 0;
    inputHorasExtra.value = f.horaExtra || f.HoraExtra || 0;
    inputInss.value = f.inss || f.Inss || 0;
    inputIrrf.value = f.irrf || f.Irrf || 0;
    inputBeneficios.value = f.beneficios || f.Beneficios || 0;
    inputFaltas.value = f.faltasOutros || f.FaltasOutros || 0;

    calcularFolhaNoModal();

    btnSalvarModal.innerText = "Atualizar";
    modal.style.display = "flex";
};

// 🔹 EXCLUIR
window.excluirFolha = async (id) => {
    if (!confirm("Deseja excluir?")) return;

    const token = localStorage.getItem(TOKEN_KEY);

    await fetch(`${API_FOLHA}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
    });

    carregarTabelaFolhas();
};

// 🔹 SALVAR
formCadastro.onsubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem(TOKEN_KEY);

    const payload = {
        id: folhaAtualId || 0,
        cargo: inputCargo.value,
        salarioBruto: formatarParaDecimal(inputSalarioBase.value),
        horaExtra: formatarParaDecimal(inputHorasExtra.value),
        funcionariosId: funcionarioAtualId,
        mesReferencia: new Date().toISOString(),
        inss: formatarParaDecimal(inputInss.value),
        irrf: formatarParaDecimal(inputIrrf.value),
        beneficios: formatarParaDecimal(inputBeneficios.value),
        faltasOutros: formatarParaDecimal(inputFaltas.value)
    };

    const method = folhaAtualId ? "PUT" : "POST";
    const url = folhaAtualId ? `${API_FOLHA}/${folhaAtualId}` : API_FOLHA;

    const res = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        alert(folhaAtualId 
            ? "Funcionário atualizado com sucesso!" 
            : "Funcionário cadastrado com sucesso!"
        );

        fecharModal();
        carregarTabelaFolhas();
    } else {
        alert("Erro ao salvar");
    }
};

// 🔹 MODAL
btnAbrirModal && (btnAbrirModal.onclick = () => {
    formCadastro.reset();
    folhaAtualId = null;
    funcionarioAtualId = null;
    modal.style.display = "flex";
});

btnFecharModal && (btnFecharModal.onclick = fecharModal);

window.onclick = (e) => {
    if (e.target === modal) fecharModal();
};

// 🔹 INIT
document.addEventListener("DOMContentLoaded", () => {
    carregarTabelaFolhas();

    $("btn-sair")?.addEventListener("click", () => {
        localStorage.removeItem(TOKEN_KEY);
        location.href = "../Index.html";
    });
});