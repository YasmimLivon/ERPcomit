# ERPcomit - Front-end 🎨

![Badge](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow?style=for-the-badge)
![Badge](https://img.shields.io/badge/Interface-Web-blue?style=for-the-badge)

O **ERPcomit Web** é a interface de usuário (Front-end) do sistema de ERP. Desenvolvida para ser intuitiva, responsiva e performática, esta aplicação se conecta à **ERPcomit API** para fornecer uma experiência completa de gerenciamento empresarial, controle de inventário, clientes e vendas.

---

## 🛠️ Tecnologias e Ferramentas Utilizadas

O ecossistema visual e estrutural do projeto conta com as seguintes tecnologias:

* **Framework/Biblioteca Principal:** [React](https://react.dev/) / [Angular](https://angular.io/) / [Vue.js](https://vuejs.org/) *(Ajustar para o utilizado)*
* **Linguagem:** TypeScript / JavaScript
* **Estilização:** Tailwind CSS / Styled Components / Bootstrap
* **Consumo de API:** Axios / Fetch API
* **Gerenciamento de Estado:** Context API / Redux / Pinia

---

## 🏗️ Estrutura do Projeto (Front-end)

A organização dos arquivos segue um padrão limpo e escalável focado em componentes reutilizáveis:

* `src/assets`: Imagens, ícones e arquivos de estilo globais.
* `src/components`: Componentes visuais menores e reutilizáveis (botões, cards, inputs).
* `src/pages`: Telas completas da aplicação (Dashboard, Login, Cadastro de Produtos).
* `src/services`: Configuração do cliente HTTP (Axios) e integração direta com os endpoints da API.
* `src/routes`: Gerenciamento e proteção de rotas (páginas públicas vs. páginas privadas).

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos

Antes de começar, você vai precisar ter instalado em sua máquina:
* [Node.js](https://nodejs.org/) (Versão LTS recomendada)
* Um gerenciador de pacotes como **npm**, **yarn** ou **pnpm**
* A [ERPcomit API](https://github.com/KaickFlauzin08/Projeto.Winxs.Api) rodando localmente (opcional, para testar os dados em tempo real)
