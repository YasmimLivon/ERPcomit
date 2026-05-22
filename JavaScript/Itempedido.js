document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "http://localhost:5243/api/ItemPedido";

  // ✅ CORREÇÃO TOKEN
  const TOKEN_KEY = "token";

  const btnSair = document.getElementById("btn-sair");
  if (btnSair) {
    btnSair.addEventListener("click", () => {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = "../Login.html";
    });
  }

  const modal = document.getElementById("modal-container");
  const btnAbrir = document.getElementById("openModalBtn");
  const btnFechar = document.getElementById("btn-fechar-modal");
  const form = document.getElementById("form-cadastro");
  const tbody = document.querySelector("tbody");

  // INPUTS
  const pedidoInput = document.getElementById("pedidoId");
  const produtoInput = document.getElementById("produtoId");
  const quantidadeInput = document.getElementById("quantidade");
  const precoInput = document.getElementById("precoUnitario");

  // ✅ CORREÇÃO ID
  const inputBusca = document.getElementById("inputFiltro");

  // CONTROLE
  let listaGlobal = [];
  let editandoId = null;

  // =========================
  // MODAL
  // =========================
  btnAbrir.onclick = () => {
    editandoId = null;
    form.reset();
    modal.style.display = "flex";
  };

  btnFechar.onclick = () => {
    modal.style.display = "none";
    editandoId = null;
  };

  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
      editandoId = null;
    }
  };

  // =========================
  // SUBMIT (POST ou PUT)
  // =========================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!pedidoInput || !produtoInput || !quantidadeInput || !precoInput) {
      alert("Erro: algum input não foi encontrado.");
      return;
    }

    const data = {
      pedidoId: parseInt(pedidoInput.value),
      produtoId: parseInt(produtoInput.value),
      quantidade: parseInt(quantidadeInput.value),
      precoUnitario: parseFloat(precoInput.value),
    };

    try {
      let res;

      if (editandoId !== null) {
        res = await fetch(`${API_URL}/${editandoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }

      if (!res.ok) {
        const erro = await res.text();
        console.error(erro);
        throw new Error();
      }

      alert(editandoId ? "Atualizado com sucesso!" : "Cadastrado com sucesso!");

      form.reset();
      modal.style.display = "none";
      editandoId = null;

      carregar();

    } catch (err) {
      alert("Erro ao salvar (veja console)");
    }
  });

  // =========================
  // RENDER TABELA
  // =========================
  function renderizarTabela(lista) {
    tbody.innerHTML = "";

    lista.forEach((item) => {
      tbody.innerHTML += `
        <tr>
          <td>${item.id}</td>
          <td>${item.nomeProduto}</td>
          <td>${item.precoUnitario}</td>
          <td>${item.quantidade}</td>
          <td>${item.total}</td>
          <td class="acao">
            <button class="btn-edit" onclick="editar(${item.id})">Editar</button>
            <button class="btn-delete" onclick="deletar(${item.id})">🗑</button>
          </td>
        </tr>
      `;
    });
  }

  // =========================
  // CARREGAR
  // =========================
  async function carregar() {
    const res = await fetch(API_URL);
    const data = await res.json();

    listaGlobal = data;
    renderizarTabela(data);
  }

  // =========================
  // FILTRO (COM PROTEÇÃO)
  // =========================
  if (inputBusca) {
    inputBusca.addEventListener("input", () => {
      const valor = inputBusca.value.toLowerCase();

      const filtrados = listaGlobal.filter((item) =>
        item.nomeProduto.toLowerCase().includes(valor)
      );

      renderizarTabela(filtrados);
    });
  }

  // =========================
  // EDITAR
  // =========================
  window.editar = function (id) {
    const item = listaGlobal.find((i) => i.id === id);

    if (!item) {
      alert("Item não encontrado");
      return;
    }

    pedidoInput.value = item.pedidoId || "";
    produtoInput.value = item.produtoId || "";
    quantidadeInput.value = item.quantidade || "";
    precoInput.value = item.precoUnitario || "";

    editandoId = id;
    modal.style.display = "flex";
  };

  // =========================
  // DELETE
  // =========================
  window.deletar = async function (id) {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    carregar();
  };

  carregar();
});