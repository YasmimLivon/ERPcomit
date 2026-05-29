const API_URL = "http://localhost:5243/api";
const TOKEN_KEY = "app_auth_token";
let editandoId = null;

// Atalho prático para selecionar elementos
const $ = (id) => document.getElementById(id);
const tabela = $("tabela-corpo");

// --- 1. LISTAR DADOS ---
async function listarDados() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;

  try {
    const headers = { Authorization: `Bearer ${token}` };
    const [resCli, resForn] = await Promise.all([
      fetch(`${API_URL}/Parceiros/Get-Clientes`, { headers }),
      fetch(`${API_URL}/Parceiros/Get-Fornecedores`, { headers }),
    ]);

    if (!resCli.ok || !resForn.ok) throw new Error("Falha na autenticação");

    const clientes = await resCli.json();
    const fornecedores = await resForn.json();

    if (!tabela) return;
    tabela.innerHTML = "";
    
    if (clientes && Array.isArray(clientes)) {
        clientes.forEach((item) => renderizarLinha(item, "Cliente"));
    }
    if (fornecedores && Array.isArray(fornecedores)) {
        fornecedores.forEach((item) => renderizarLinha(item, "Fornecedor"));
    }
  } catch (e) {
    console.error("Erro ao listar:", e.message);
  }
}

function renderizarLinha(item, tipo) {
  const id = item.id || item.Id;
  const row = document.createElement("tr");
  row.innerHTML = `
        <td><strong>#${id}</strong></td>
        <td>${item.nome || item.Nome}</td>
        <td>${item.cpf || item.Cpf || item.cnpj || item.Cnpj || "---"}</td>
        <td>${item.cidade || item.Cidade || "---"}</td>
        <td>${item.telefone || item.Telefone || "---"}</td>
        <td>${tipo}</td>
        <td>
            <button class="btn-edit">Editar</button>
            <button class="btn-delete">🗑️</button>
        </td>
    `;
  row.querySelector(".btn-edit").onclick = () => abrirEdicao(item, tipo);
  row.querySelector(".btn-delete").onclick = () => deletar(id, tipo);
  tabela.appendChild(row);
}

// --- 2. SALVAR (CADASTRO / EDIÇÃO) ---
if ($("form-cadastro")) {
    $("form-cadastro").onsubmit = async (e) => {
      e.preventDefault();
      const token = localStorage.getItem(TOKEN_KEY);
      const tipo = $("tipo").value;

      const payload = {
        nome: $("nome").value,
        email: $("email").value,
        telefone: $("telefone").value,
        role: "User",
      };

      const pass = $("password").value;
      if (pass && pass.trim()) payload.password = pass;

      if (tipo === "Cliente") {
        payload.cpf = $("documento").value;
        payload.cidade = $("cidade").value;
      } else {
        payload.cnpj = $("documento").value;
      }

      let endpoint = "";
      if (editandoId) {
        endpoint = `Update-${tipo}/${editandoId}`;
      } else {
        endpoint = tipo === "Cliente" ? "Register-Clientes" : "Register-Fornecedores";
      }

      try {
        const res = await fetch(`${API_URL}/Parceiros/${endpoint}`, {
          method: editandoId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          fecharModais();
          listarDados();
        } else {
          const erroTxt = await res.text();
          alert("Erro na API: " + erroTxt);
        }
      } catch (e) {
        alert("Erro de conexão com o servidor.");
      }
    };
}

// --- 3. FILTROS E INTERFACE ---
if ($("form-filtro")) {
    $("form-filtro").onsubmit = (e) => {
      e.preventDefault();
      const nome = $("filtro-nome").value.toLowerCase();
      const tipo = $("filtro-tipo").value;
      const cidade = $("filtro-cidade").value.toLowerCase();

      document.querySelectorAll("#tabela-corpo tr").forEach((row) => {
        const bateNome = row.cells[1].innerText.toLowerCase().includes(nome);
        const bateCid = row.cells[3].innerText.toLowerCase().includes(cidade);
        const bateTipo = tipo === "Todos" || row.cells[5].innerText === tipo;
        row.style.display = bateNome && bateCid && bateTipo ? "" : "none";
      });
      $("modal-filtro").style.display = "none";
    };
}

if ($("btn-resetar-filtro")) {
    $("btn-resetar-filtro").onclick = () => {
      $("form-filtro").reset();
      document
        .querySelectorAll("#tabela-corpo tr")
        .forEach((row) => (row.style.display = ""));
      $("modal-filtro").style.display = "none";
    };
}

function abrirEdicao(item, tipo) {
  editandoId = item.id || item.Id;
  $("nome").value = item.nome || item.Nome;
  $("email").value = item.email || item.Email;
  $("telefone").value = item.telefone || item.Telefone;
  $("documento").value = item.cpf || item.Cpf || item.cnpj || item.Cnpj || "";
  $("tipo").value = tipo;
  $("label-doc").innerText = tipo === "Cliente" ? "CPF" : "CNPJ";
  $("cidade").value = item.cidade || item.Cidade || "";
  $("password").value = "";
  $("modal-container").style.display = "flex";
}

async function deletar(id, tipo) {
  if (!confirm("Excluir definitivamente este registro?")) return;
  const token = localStorage.getItem(TOKEN_KEY);
  await fetch(`${API_URL}/Parceiros/Delete-${tipo}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  listarDados();
}

function fecharModais() {
  if ($("modal-container")) $("modal-container").style.display = "none";
  if ($("modal-filtro")) $("modal-filtro").style.display = "none";
}

// --- 4. INICIALIZAÇÃO DA DOM E SCROLL CONTROLS ---
document.addEventListener("DOMContentLoaded", () => {
    listarDados();

    // 📜 ADICIONA SCROLL NA TABELA AUTOMATICAMENTE SE HOUVER MUITOS ITENS
    if (tabela) {
        const tabelaPai = tabela.closest('table')?.parentElement;
        if (tabelaPai) {
            tabelaPai.style.maxHeight = "500px"; // Limita o tamanho vertical máximo da listagem
            tabelaPai.style.overflowY = "auto";  // Ativa a barra de scroll interna
            tabelaPai.style.overflowX = "auto";  // Evita estouro horizontal
        }
    }

    // Altera dinamicamente a label do documento dependendo do tipo selecionado
    if ($("tipo")) {
        $("tipo").onchange = () => {
            $("label-doc").innerText = $("tipo").value === "Cliente" ? "CPF" : "CNPJ";
        };
    }

    // Eventos de botões com validações de segurança
    if ($("btn-abrir-modal")) {
        $("btn-abrir-modal").onclick = () => {
          editandoId = null;
          $("form-cadastro").reset();
          $("label-doc").innerText = "CPF";
          $("modal-container").style.display = "flex";
        };
    }

    if ($("btn-abrir-filtro")) {
        $("btn-abrir-filtro").onclick = () => ($("modal-filtro").style.display = "flex");
    }

    if ($("btn-fechar-modal") && $("btn-fechar-filtro")) {
        $("btn-fechar-modal").onclick = $("btn-fechar-filtro").onclick = fecharModais;
    }

    if ($("btn-sair")) {
        $("btn-sair").onclick = () => {
          localStorage.removeItem(TOKEN_KEY);
          location.href = "../Login.html";
        };
    }

    // Fechar se clicar fora da caixa do modal de cadastro
    const modalContainer = $("modal-container");
    if (modalContainer) {
        window.addEventListener('click', (event) => {
            if (event.target === modalContainer) {
                fecharModais();
            }
        });
    }
});