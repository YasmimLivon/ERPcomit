document.addEventListener("DOMContentLoaded", () => {

    const TOKEN_KEY = "app_auth_token";
    const URL_DASHBOARD = "http://localhost:5243/api/Financeiro";

    // 🔹 CONFIGURAÇÃO DO BOTÃO SAIR
    const btnSair = document.getElementById("btn-sair");
    if (btnSair) {
        btnSair.addEventListener("click", () => {
            localStorage.removeItem(TOKEN_KEY);
            window.location.href = "../Login.html";
        });
    }

    // 🔹 HEADERS DE AUTENTICAÇÃO INTEGRADOS
    function getAuthHeaders() {
        const token = localStorage.getItem(TOKEN_KEY);
        return {
            "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` })
        };
    }

    // 🔹 REQUISIÇÃO DOS DADOS DA API
    async function buscarDadosDashboard() {
        try {
            const response = await fetch(URL_DASHBOARD, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Falha ao buscar dados no servidor do Dashboard:", error);
            return [];
        }
    }

    // 🔹 PROCESSAMENTO E RENDERIZAÇÃO DOS GRÁFICOS
    async function renderizarDashboard() {
        try {
            const dados = await buscarDadosDashboard() || [];
            
            let valorPago = 0;
            let valorPendente = 0;
            const tiposAgrupados = {};

            // Tratamento matemático dos registros vindos da API
            dados.forEach(item => {
                const valor = parseFloat(item.valor) || 0;
                const status = item.status ? item.status.toLowerCase().trim() : '';
                const tipo = item.tipo || 'Geral';

                // Classifica o volume transacionado por status do fluxo de caixa
                if (status === 'pago') {
                    valorPago += valor;
                } else if (status === 'pendente' || status === 'pendentes') {
                    valorPendente += valor;
                }

                // Agrupa os valores de forma acumulada por Tipo (Vendas, Salários, etc.)
                tiposAgrupados[tipo] = (tiposAgrupados[tipo] || 0) + valor;
            });

            // Injeta os valores calculados formatados nos cards HTML do painel
            const elementoTotalContas = document.getElementById('total-contas');
            const elementoTotalPago = document.getElementById('total-pago');
            const elementoTotalPendente = document.getElementById('total-pendente');

            if (elementoTotalContas) elementoTotalContas.innerText = dados.length;
            
            if (elementoTotalPago) {
                elementoTotalPago.innerText = valorPago.toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                });
            }
            
            if (elementoTotalPendente) {
                elementoTotalPendente.innerText = valorPendente.toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                });
            }

            // Configuração Global de Fontes do Chart.js para combinar com o layout
            if (typeof Chart !== 'undefined') {
                Chart.defaults.font.family = "'Inter', 'Segoe UI', Arial, sans-serif";
                Chart.defaults.color = "#666";

                // Gráfico 1: Volume Financeiro por Situação (Pizza)
                const ctxStatus = document.getElementById('graficoStatus');
                if (ctxStatus) {
                    new Chart(ctxStatus, {
                        type: 'pie',
                        data: {
                            labels: ['Pago', 'Pendente'],
                            datasets: [{
                                data: [valorPago, valorPendente],
                                backgroundColor: ['#2ed573', '#ff4757'],
                                borderWidth: 2,
                                borderColor: '#ffffff'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: { boxWidth: 12, padding: 15 }
                                },
                                title: {
                                    display: true,
                                    text: 'Volume Financeiro por Situação',
                                    font: { size: 15, weight: '600' },
                                    color: '#070C96',
                                    padding: { bottom: 15 }
                                }
                            }
                        }
                    });
                }

                // Gráfico 2: Distribuição por Tipo de Conta (Barras Dinâmicas)
                const ctxTipos = document.getElementById('graficoTipos');
                if (ctxTipos) {
                    new Chart(ctxTipos, {
                        type: 'bar',
                        data: {
                            labels: Object.keys(tiposAgrupados),
                            datasets: [{
                                label: 'Total Acumulado (R$)',
                                data: Object.values(tiposAgrupados),
                                backgroundColor: '#070C96',
                                borderRadius: 6,
                                barThickness: 25
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                title: {
                                    display: true,
                                    text: 'Distribuição por Categoria',
                                    font: { size: 15, weight: '600' },
                                    color: '#070C96',
                                    padding: { bottom: 15 }
                                }
                            },
                            scales: {
                                x: { grid: { display: false } },
                                y: {
                                    beginAtZero: true,
                                    grid: { color: '#eef0f4' }
                                }
                            }
                        }
                    });
                }
            } else {
                console.warn("A biblioteca Chart.js não foi detectada na página.");
            }

        } catch (error) {
            console.error("Erro ao processar as métricas do painel indicador:", error);
        }
    }

    renderizarDashboard();
});