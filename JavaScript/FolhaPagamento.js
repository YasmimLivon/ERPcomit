const API_URL = "http://localhost:5243/api";
const TOKEN_KEY = "app_auth_token";

let funcionarioAtualId = null; 
let folhaAtualId = null; // Nova variável para rastrear o ID real da folha de pagamento
let funcionarioCpf = ""; 

// Atalho prático para selecionar elementos
const $ = (id) => document.getElementById(id);

// Elementos do DOM mapeados por ID
const inputNomeBusca = $("busca-nome"); 
const inputCargo = $("cargo"); 
const inputSalarioBase = $("salario-base");
const inputHorasExtra = $("horas-extra");
const inputTotalImposto = $("total-imposto");
const inputSalarioTotal = $("salario-total");
const inputInss = $("inss");
const inputIrrf = $("irrf");
const inputBeneficios = $("beneficios");
const inputFaltas = $("faltas");

// Elementos do painel de resumo (Lado Direito)
const resumoNome = $("resumo-nome");
const resumoCpf = $("resumo-cpf");
const resumoCargo = $("resumo-cargo");
const resumoFaltas = $("resumo-faltas");
const resumoSalarioBruto = $("resumo-bruto");
const totalBrutoTela = document.querySelector('.total div:nth-child(1) p');
const totalLiquidoTela = document.querySelector('.total div:nth-child(2) p');

// --- 1. FUNÇÃO DE CÁLCULO DINÂMICO EM TEMPO REAL ---
function calcularFolhaNaTela() {
    const salarioBase = parseFloat(inputSalarioBase.value) || 0;
    const horasExtra = parseFloat(inputHorasExtra.value) || 0;
    const inss = parseFloat(inputInss.value) || 0;
    const irrf = parseFloat(inputIrrf.value) || 0;
    const beneficios = parseFloat(inputBeneficios.value) || 0;
    const faltas = parseFloat(inputFaltas.value) || 0;

    // Regras de cálculo idênticas às do Backend C#
    const ganhos = salarioBase + horasExtra + beneficios;
    const descontos = inss + irrf + faltas; 
    const salarioLiquido = ganhos - descontos;

    // Atualiza os inputs de leitura na esquerda
    if (inputTotalImposto) inputTotalImposto.value = descontos.toFixed(2);
    if (inputSalarioTotal) inputSalarioTotal.value = salarioLiquido.toFixed(2);

    // Atualiza o resumo visual na direita (Salário Bruto considerado: Base + Horas Extras)
    const salarioBrutoTotal = salarioBase + horasExtra;
    const cargoTexto = inputCargo ? inputCargo.value : "---";
    atualizarCardResumo(cargoTexto, faltas, salarioBrutoTotal, salarioLiquido);
}

// Vincula o evento a todos os inputs para atualizar ao digitar
[inputSalarioBase, inputHorasExtra, inputInss, inputIrrf, inputBeneficios, inputFaltas].forEach(input => {
    if (input) {
        input.oninput = calcularFolhaNaTela;
    }
});


// --- 2. SESSÃO GET: BUSCAR FUNCIONÁRIO E SUA FOLHA ---
async function processarBuscaPorNome() {
    const nomeValue = inputNomeBusca.value.trim().toLowerCase();
    if (!nomeValue) return;

    // LIMPEZA PREVENTIVA
    funcionarioAtualId = null;
    folhaAtualId = null;
    funcionarioCpf = "";

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return alert("Usuário não autenticado.");

    try {
        const headers = { Authorization: `Bearer ${token}` };
        
        // API 1: Busca o cadastro base do Funcionário
        const resFunc = await fetch(`${API_URL}/Funcionarios/Get-Funcionarios`, { headers });
        if (!resFunc.ok) throw new Error("Erro ao acessar a lista de funcionários.");
        
        const funcionarios = await resFunc.json();
        
        const funcEncontrado = funcionarios.find(f => 
            (f.nome || f.Nome || "").toLowerCase().includes(nomeValue)
        );

        if (!funcEncontrado) {
            alert("Funcionário não encontrado no sistema.");
            limparCalculosEResumo();
            return;
        }

        // Identifica o ID e CPF do funcionário encontrado pelas propriedades mapeadas no C# DTO
        funcionarioAtualId = funcEncontrado.id || funcEncontrado.Id;
        funcionarioCpf = funcEncontrado.cpf || funcEncontrado.CPF || "";

        const nomeCompleto = funcEncontrado.nome || funcEncontrado.Nome;
        const cargoOriginal = funcEncontrado.cargo || funcEncontrado.Cargo || "Não Definido";

        // Atualiza os textos do painel com os dados bases do usuário
        if (resumoNome) resumoNome.innerText = `Nome: ${nomeCompleto}`;
        if (resumoCargo) resumoCargo.innerText = `Cargo: ${cargoOriginal}`;
        if (inputCargo) inputCargo.value = cargoOriginal;
        if (resumoCpf) resumoCpf.innerText = `CPF: ${funcionarioCpf ? funcionarioCpf : "Não localizado"}`;

        // API 2: Consome os dados cadastrados na Folha de Pagamento
        const resFolha = await fetch(`${API_URL}/FolhadePagamento`, { headers });
        if (!resFolha.ok) throw new Error("Erro ao acessar a API de Folha de Pagamento.");

        const folhas = await resFolha.json();
        
        // Procura se esse usuário já tem uma folha registrada vinculada ao seu ID
        const folhaDoFuncionario = folhas.find(folha => 
            (folha.funcionariosId || folha.FuncionariosId) === parseInt(funcionarioAtualId)
        );

        // Se achou uma folha antiga dele, preenche. Se não, usa as informações base do cadastro de funcionários
        if (folhaDoFuncionario) {
            folhaAtualId = folhaDoFuncionario.id || folhaDoFuncionario.Id || null;
            preencherCamposFolha(folhaDoFuncionario);
        } else {
            console.log("Primeira folha do colaborador. Carregando dados base...");
            limparCamposParaNovoRegistro(funcEncontrado);
        }

    } catch (e) {
        console.error("Erro na requisição:", e.message);
        limparCalculosEResumo();
    }
}

// Vincula eventos ao input de busca
if (inputNomeBusca) {
    inputNomeBusca.onblur = processarBuscaPorNome;
    inputNomeBusca.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            processarBuscaPorNome();
        }
    };
}


// --- 3. RENDERIZADORES DE INTERFACE ---
function preencherCamposFolha(item) {
    if (inputCargo) inputCargo.value = item.cargo || item.Cargo || "funcionario";
    if (inputSalarioBase) inputSalarioBase.value = item.salarioBruto || item.SalarioBruto || 0;
    if (inputHorasExtra) inputHorasExtra.value = item.horaExtra || item.HoraExtra || 0;
    if (inputInss) inputInss.value = item.inss || item.Inss || 0;
    if (inputIrrf) inputIrrf.value = item.irrf || item.Irrf || 0;
    if (inputBeneficios) inputBeneficios.value = item.beneficios || item.Beneficios || 0;
    if (inputFaltas) inputFaltas.value = item.faltasOutros || item.FaltasOutros || 0;
    
    calcularFolhaNaTela();
}

function limparCamposParaNovoRegistro(func) {
    // Zera os inputs de adicionais e descontos temporários
    if (inputHorasExtra) inputHorasExtra.value = 0;
    if (inputInss) inputInss.value = 0;
    if (inputIrrf) inputIrrf.value = 0;
    if (inputBeneficios) inputBeneficios.value = 0;
    if (inputFaltas) inputFaltas.value = 0;

    // Carrega o salário base correto mapeado da propriedade 'salario' do FuncionariosDTO
    const cargoOriginal = func.cargo || func.Cargo || "Não Definido";
    const salarioBaseOriginal = func.salario || func.Salario || 0; 
    
    if (inputCargo) inputCargo.value = cargoOriginal;
    if (inputSalarioBase) inputSalarioBase.value = salarioBaseOriginal;
    
    calcularFolhaNaTela();
}

function atualizarCardResumo(cargo, faltas, valorBruto, valorLiquido) {
    if (resumoCargo) resumoCargo.innerText = `Cargo: ${cargo}`;
    if (resumoFaltas) resumoFaltas.innerText = `Faltas: ${faltas || 0}`;
    
    const brutoFormatado = valorBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const liquidoFormatado = valorLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    if (resumoSalarioBruto) resumoSalarioBruto.innerText = `Salário bruto: ${brutoFormatado}`;
    if (totalBrutoTela) totalBrutoTela.innerText = `Salário bruto: ${brutoFormatado}`;
    if (totalLiquidoTela) totalLiquidoTela.innerText = `Salário líquido: ${liquidoFormatado}`;
}


// --- 4. SESSÃO POST: LANÇAR FOLHA E CRIAR DESPESA ---
$("btn-despesa").onclick = async (e) => {
    e.preventDefault();
    if (!funcionarioAtualId) {
        return alert("Por favor, localize um funcionário válido por nome antes de salvar.");
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return alert("Sessão expirada. Faça login novamente.");

    // Ajustado estritamente para bater com as propriedades que o CriarFolhadePagamentoDTO espera
    const payload = {
        cargo: inputCargo ? inputCargo.value : "Não Definido",
        salarioBruto: parseFloat(inputSalarioBase.value) || 0,
        horaExtra: parseFloat(inputHorasExtra.value) || 0,
        funcionariosId: parseInt(funcionarioAtualId),
        mesReferencia: new Date().toISOString(), // Envia a data atual no padrão ISO correto
        inss: parseFloat(inputInss.value) || 0,
        irrf: parseFloat(inputIrrf.value) || 0,
        beneficios: parseFloat(inputBeneficios.value) || 0,
        faltasOutros: parseFloat(inputFaltas.value) || 0
    };

    try {
        const res = await fetch(`${API_URL}/FolhadePagamento`, {
            method: "POST", 
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Folha de pagamento gravada e lançada com sucesso no Financeiro!");
            processarBuscaPorNome(); 
        } else {
            const erroTxt = await res.text();
            alert("Erro na API ao salvar: " + erroTxt);
        }
    } catch (e) {
        alert("Erro de conexão com o servidor.");
    }
};


// --- 5. SESSÃO DELETE: EXCLUIR REGISTRO DA FOLHA ---
if ($("btn-deletar")) {
    $("btn-deletar").onclick = async () => {
        if (!folhaAtualId) return alert("Este funcionário não possui nenhuma folha registrada para ser deletada.");
        if (!confirm("Tem certeza que deseja deletar permanentemente esta folha?")) return;

        const token = localStorage.getItem(TOKEN_KEY);
        try {
            const res = await fetch(`${API_URL}/FolhadePagamento/${folhaAtualId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                alert("Folha de pagamento excluída com sucesso!");
                limparFormularioCompleto();
            } else {
                alert("Falha ao tentar excluir o registro da folha.");
            }
        } catch (e) {
            alert("Erro de conexão ao deletar.");
        }
    };
}


// --- AUXILIARES E LIMPEZA ---
function limparCalculosEResumo() {
    funcionarioAtualId = null;
    folhaAtualId = null;
    funcionarioCpf = "";
    if (inputTotalImposto) inputTotalImposto.value = "";
    if (inputSalarioTotal) inputSalarioTotal.value = "";
    if (resumoNome) resumoNome.innerText = "Nome: ---";
    if (resumoCpf) resumoCpf.innerText = "CPF: ---";
    if (resumoCargo) resumoCargo.innerText = "Cargo: ---";
    if (resumoFaltas) resumoFaltas.innerText = "Faltas: 0";
    if (resumoSalarioBruto) resumoSalarioBruto.innerText = "Salário bruto: R$ 0,00";
    if (totalBrutoTela) totalBrutoTela.innerText = "Salário bruto: R$ 0,00";
    if (totalLiquidoTela) totalLiquidoTela.innerText = "Salário líquido: R$ 0,00";
}

function limparFormularioCompleto() {
    if (inputNomeBusca) inputNomeBusca.value = "";
    if (inputSalarioBase) inputSalarioBase.value = "";
    if (inputHorasExtra) inputHorasExtra.value = "";
    if (inputInss) inputInss.value = "";
    if (inputIrrf) inputIrrf.value = "";
    if (inputBeneficios) inputBeneficios.value = "";
    if (inputFaltas) inputFaltas.value = "";
    limparCalculosEResumo();
}

$("btn-sair").onclick = () => {
    localStorage.removeItem(TOKEN_KEY);
    location.href = "../Login.html";
};