document.addEventListener("DOMContentLoaded", () => {

    const TOKEN_KEY = "app_auth_token";
    const URL_FINANCEIRO = "http://localhost:5243/api/Financeiro";
    const URL_PEDIDOS = "http://localhost:5243/api/Pedidos"; 

    // 🔹 CONFIGURAÇÃO DO BOTÃO SAIR
    const btnSair = document.getElementById("btn-sair");
    if (btnSair) {
        btnSair.addEventListener("click", () => {
            localStorage.clear(); 
            window.location.href = "../Login.html";
        });
    }

    // 🔹 HEADERS DE AUTENTICAÇÃO
    function getAuthHeaders() {
        const token = localStorage.getItem(TOKEN_KEY);
        return {
            "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` })
        };
    }

    // 🔹 MAPEAR ID POR NOME (CASO O BACKEND NÃO RETORNE ID NO TOKEN)
    function obterIdPorNome(nome) {
        if (!nome) return 0;
        const n = nome.toLowerCase().trim();
        if (n.includes("pedro")) return 1; 
        if (n.includes("joao") || n.includes("joão")) return 2; 
        if (n.includes("brenno")) return 3; 
        if (n.includes("kaick")) return 4;
        if (n.includes("carlos")) return 5; 
        if (n.includes("cliente2")) return 2; 
        if (!isNaN(n) && n !== "") return Number(n);
        return 0;
    }

    // 🔹 EXTRAÇÃO COMPLETA DOS DADOS DO USUÁRIO
    function obterDadosDoUsuario() {
        const token = localStorage.getItem(TOKEN_KEY);
        
        // Pega valores salvos no localStorage como plano B
        let idSalvo = Number(localStorage.getItem("usuario_id") || localStorage.getItem("usuarioId") || 0);
        let nomeSalvo = localStorage.getItem("usuario_nome") || localStorage.getItem("usuarioNome") || "";
        let roleSalva = localStorage.getItem("usuario_role") || localStorage.getItem("usuarioRole") || "cliente";

        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                
                const payload = JSON.parse(jsonPayload);
                
                // Mapeia o nome em qualquer propriedade que ele possa vir do .NET
                const nomeDetectado = payload["nome"] || payload["unique_name"] || payload["sub"] || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || "";
                if (nomeDetectado) nomeSalvo = nomeDetectado.trim();

                // Mapeia a Role
                const roleDetectada = payload["role"] || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "";
                if (roleDetectada) roleSalva = roleDetectada.trim();

                // Procura o ID em todas as variações possíveis de Claims do JWT
                const idDetectado = payload["nameid"] || payload["id"] || payload["Id"] || payload["sub"] || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
                if (idDetectado && Number(idDetectado) !== 0) {
                    idSalvo = Number(idDetectado);
                } else if (nomeSalvo) {
                    idSalvo = obterIdPorNome(nomeSalvo);
                }

            } catch (error) {
                console.error("Erro ao decodificar token:", error);
            }
        }

        return { id: idSalvo, nome: nomeSalvo, role: roleSalva };
    }

    // 🔹 VERIFICA SE É FUNCIONÁRIO/ADMIN
    function verificarSeEhFuncionarioOuAdmin() {
        const usuario = obterDadosDoUsuario();
        const perfil = usuario.role.toLowerCase().trim();
        const nome = usuario.nome.toLowerCase().trim();
        
        return perfil.includes("funcionario") || 
               perfil.includes("admin") || 
               nome.includes("carlos") || 
               nome.includes("brenno");
    }

    // 🔹 BUSCAR FINANCEIRO
    async function buscarDadosFinanceiro() {
        if (!verificarSeEhFuncionarioOuAdmin()) return [];
        try {
            const response = await fetch(URL_FINANCEIRO, { method: 'GET', headers: getAuthHeaders() });
            if (!response.ok) throw new Error(`Erro HTTP Financeiro: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Falha ao buscar dados no servidor do Financeiro:", error);
            return [];
        }
    }

    // 🔹 BUSCAR PEDIDOS
    async function buscarDadosPedidos() {
        try {
            const response = await fetch(URL_PEDIDOS, { method: 'GET', headers: getAuthHeaders() });
            if (!response.ok) throw new Error(`Erro HTTP Pedidos: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Falha ao buscar dados no servidor de Pedidos:", error);
            return [];
        }
    }

    // 🔹 PROCESSAMENTO PRINCIPAL
    async function renderizarDashboard() {
        try {
            if (typeof Chart === 'undefined') {
                console.warn("A biblioteca Chart.js não foi detectada na página.");
                return;
            }

            Chart.defaults.font.family = "'Inter', 'Segoe UI', Arial, sans-serif";
            Chart.defaults.color = "#666";

            const ehEquipe = verificarSeEhFuncionarioOuAdmin();
            const usuarioLogado = obterDadosDoUsuario();

            // ==========================================
            // PARTE 1: PROCESSAR FINANCEIRO (EQUIPE APENAS)
            // ==========================================
            const dadosFinanceiro = await buscarDadosFinanceiro() || [];
            let valorPago = 0;
            let valorPendente = 0;
            const tiposAgrupados = {};

            dadosFinanceiro.forEach(item => {
                const valor = parseFloat(item.valor) || 0;
                const status = item.status ? item.status.toLowerCase().trim() : '';
                const tipo = item.tipo || 'Geral';

                if (status === 'pago') valorPago += valor;
                else if (status === 'pendente' || status === 'pendentes') valorPendente += valor;
                
                tiposAgrupados[tipo] = (tiposAgrupados[tipo] || 0) + valor;
            });

            const elementoTotalContas = document.getElementById('total-contas');
            const elementoTotalPago = document.getElementById('total-pago');
            const elementoTotalPendente = document.getElementById('total-pendente');

            if (elementoTotalContas) elementoTotalContas.innerText = dadosFinanceiro.length;
            if (elementoTotalPago) elementoTotalPago.innerText = valorPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            if (elementoTotalPendente) elementoTotalPendente.innerText = valorPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            // Esconde a seção financeira se for cliente comum
            const secaoFinanceira = document.querySelector('.financeiro-section'); 
            if (!ehEquipe && secaoFinanceira) {
                secaoFinanceira.style.display = "none";
            }

            // Oculta/Mostra gráficos financeiros
            const containerFin1 = document.getElementById('graficoStatus')?.parentElement;
            const containerFin2 = document.getElementById('graficoTipos')?.parentElement;
            
            if (!ehEquipe) {
                if (containerFin1) containerFin1.style.display = "none";
                if (containerFin2) containerFin2.style.display = "none";
            } else {
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
                        options: { responsive: true, maintainAspectRatio: false }
                    });
                }

                const ctxTipos = document.getElementById('graficoTipos');
                if (ctxTipos) {
                    new Chart(ctxTipos, {
                        type: 'bar',
                        data: {
                            labels: Object.keys(tiposAgrupados),
                            datasets: [{ label: 'Total Acumulado (R$)', data: Object.values(tiposAgrupados), backgroundColor: '#070C96' }]
                        },
                        options: { responsive: true, maintainAspectRatio: false }
                    });
                }
            }

            // ==========================================
            // PARTE 2: FILTRO INTELIGENTE DE PEDIDOS (CORREÇÃO DO BUG ZERADO)
            // ==========================================
            const todosOsPedidos = await buscarDadosPedidos() || [];
            let dadosPedidos = [];

            if (ehEquipe) {
                dadosPedidos = todosOsPedidos;
            } else {
                const idUsuario = usuarioLogado.id;
                const nomeUsuario = usuarioLogado.nome.toLowerCase().trim();

                dadosPedidos = todosOsPedidos.filter(p => {
                    const idNoPedido = Number(p.clienteId || p.ClienteId || 0);
                    
                    // Comparações redundantes por String caso o ID falhe
                    const nomeNoPedido = (p.nomeCliente || p.clienteNome || p.nome || "").toLowerCase().trim();
                    
                    const idBate = (idNoPedido === idUsuario && idUsuario !== 0);
                    const nomeBate = (nomeUsuario !== "" && nomeNoPedido !== "" && (nomeNoPedido.includes(nomeUsuario) || nomeUsuario.includes(nomeNoPedido)));

                    return idBate || nomeBate;
                });
            }

            let vlrPagoPedidos = 0;
            let vlrPendentePedidos = 0;
            const pedidosPorData = {}; 

            dadosPedidos.forEach(p => {
                const totalPedido = parseFloat(p.total ?? p.valorTotal ?? 0) || 0;
                const statusPedido = p.status ? p.status.toLowerCase().trim() : 'pendente';
                const dataFormatada = p.dataPedido ? p.dataPedido.split("T")[0] : 'Sem Data';

                if (statusPedido === 'pago' || statusPedido === 'finalizado/pago' || statusPedido === 'finalizado') {
                    vlrPagoPedidos += totalPedido;
                } else {
                    vlrPendentePedidos += totalPedido;
                }

                pedidosPorData[dataFormatada] = (pedidosPorData[dataFormatada] || 0) + totalPedido;
            });

            // Atualiza os Cards de Pedidos na Tela
            const elementoTotalPedidos = document.getElementById('total-pedidos');
            const elementoTotalPagoPedidos = document.getElementById('total-pago-pedidos');
            const elementoTotalPendentePedidos = document.getElementById('total-pendente-pedidos');

            if (elementoTotalPedidos) elementoTotalPedidos.innerText = dadosPedidos.length;
            if (elementoTotalPagoPedidos) elementoTotalPagoPedidos.innerText = vlrPagoPedidos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            if (elementoTotalPendentePedidos) elementoTotalPendentePedidos.innerText = vlrPendentePedidos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            // Renderiza Gráfico de Pizza de Pedidos
            const ctxStatusPedidos = document.getElementById('graficoStatusPedidos');
            if (ctxStatusPedidos) {
                new Chart(ctxStatusPedidos, {
                    type: 'pie',
                    data: {
                        labels: ['Pagos', 'Pendentes'],
                        datasets: [{
                            data: [vlrPagoPedidos, vlrPendentePedidos],
                            backgroundColor: ['#10ac84', '#ff9f43'], 
                            borderWidth: 2,
                            borderColor: '#ffffff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom' },
                            title: { display: true, text: ehEquipe ? 'Volume de Pedidos por Status (Global)' : 'Meus Pedidos por Status', font: { size: 15, weight: '600' }, color: '#070C96' }
                        }
                    }
                });
            }

            // Renderiza Gráfico de Linha/Barra de Consumo Diário
            const ctxTiposPedidos = document.getElementById('graficoTiposPedidos');
            if (ctxTiposPedidos) {
                const datasOrdenadas = Object.keys(pedidosPorData).sort();
                const valoresOrdenados = datasOrdenadas.map(data => pedidosPorData[data]);

                new Chart(ctxTiposPedidos, {
                    type: 'bar',
                    data: {
                        labels: datasOrdenadas.length > 0 ? datasOrdenadas : ["Sem registros"],
                        datasets: [{
                            label: 'Valor (R$)',
                            data: valoresOrdenados.length > 0 ? valoresOrdenados : [0],
                            backgroundColor: '#54a0ff',
                            borderRadius: 6,
                            barThickness: 20
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { 
                            legend: { display: false }, 
                            title: { display: true, text: ehEquipe ? 'Faturamento Diário de Pedidos' : 'Histórico Diário de Consumo', font: { size: 15, weight: '600' }, color: '#070C96' } 
                        }
                    }
                });
            }

        } catch (error) {
            console.error("Erro ao renderizar gráficos:", error);
        }
    }

    renderizarDashboard();
});