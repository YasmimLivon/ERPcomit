const TOKEN_KEY = "app_auth_token";
const URL_DASHBOARD = "http://localhost:5243/api/Financeiro";

// Configuração do botão de sair padrão do sistema
const btnSair = document.getElementById("btn-sair");
if (btnSair) {
    btnSair.addEventListener("click", () => {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = "../Login.html";
    });
}

// Função de requisição local exclusiva do Dashboard para isolar o endpoint
async function buscarDadosDashboard() {
    const token = localStorage.getItem(TOKEN_KEY);
    const config = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '' 
        }
    };

    try {
        const response = await fetch(URL_DASHBOARD, config);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Falha ao buscar dados no servidor do Dashboard:", error);
        return [];
    }
}

async function renderizarDashboard() {
    try {
        // Busca os registros diretamente do banco de dados
        const dados = await buscarDadosDashboard() || [];
        
        let valorPago = 0;
        let valorPendente = 0;
        const tiposAgrupados = {};

        // Processamento matemático dos dados vindos da API
        dados.forEach(item => {
            const valor = parseFloat(item.valor) || 0;
            const status = item.status ? item.status.toLowerCase().trim() : '';
            const tipo = item.tipo || 'Geral';

            if (status === 'pago') {
                valorPago += valor;
            } else if (status === 'pendente') {
                valorPendente += valor;
            }

            // Soma acumulada por tipo de conta (Ex: Pagamento Salário, Fornecedores)
            tiposAgrupados[tipo] = (tiposAgrupados[tipo] || 0) + valor;
        });

        // Injeta os valores calculados diretamente nos elementos HTML da tela
        document.getElementById('total-contas').innerText = dados.length;
        document.getElementById('total-pago').innerText = `R$ ${valorPago.toFixed(2).replace('.', ',')}`;
        document.getElementById('total-pendente').innerText = `R$ ${valorPendente.toFixed(2).replace('.', ',')}`;

        // Gráfico 1: Distribuição de valores por status (Pizza)
        new Chart(document.getElementById('graficoStatus'), {
            type: 'pie',
            data: {
                labels: ['Pago (R$)', 'Pendente (R$)'],
                datasets: [{
                    data: [valorPago, valorPendente],
                    backgroundColor: ['#2ed573', '#ff4757'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Volume Financeiro por Situação',
                        font: { size: 16, weight: 'bold' }
                    }
                }
            }
        });

        // Gráfico 2: Despesas por categoria de conta (Barras)
        new Chart(document.getElementById('graficoTipos'), {
            type: 'bar',
            data: {
                labels: Object.keys(tiposAgrupados),
                datasets: [{
                    label: 'Total Acumulado (R$)',
                    data: Object.values(tiposAgrupados),
                    backgroundColor: '#0036ff',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Distribuição por Tipo de Conta',
                        font: { size: 16, weight: 'bold' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

    } catch (error) {
        console.error("Erro ao processar as métricas do painel indicador:", error);
    }
}

// Inicializa a montagem do painel de dados assim que a árvore DOM estiver pronta
document.addEventListener('DOMContentLoaded', renderizarDashboard);