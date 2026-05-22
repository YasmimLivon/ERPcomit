# ERPcomit - API 🚀

![Badge](https://img.shields.io/badge/.NET-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![Badge](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow?style=for-the-badge)

O **ERPcomit** é uma interface de programação de aplicações (API) desenvolvida para gerenciar sistemas de ERP (Enterprise Resource Planning). O projeto foi construído com foco em alta performance, manutenibilidade, robustez e escalabilidade, seguindo as melhores práticas do ecossistema .NET moderno.

---

## 🛠️ Tecnologias e Ferramentas Utilizadas

O projeto foi construído utilizando o seguinte conjunto de tecnologias:

* **Linguagem & Framework Principal:** [.NET C#](https://dotnet.microsoft.com/)
* **Acesso a Dados:** [Entity Framework Core](https://learn.microsoft.com/ef/core/) (ou Dapper)
* **Banco de Dados:** SQL Server / PostgreSQL / MySQL *(Ajustar conforme o seu)*
* **Documentação:** [Swagger / OpenAPI](https://swagger.io/)
* **Autenticação & Segurança:** JWT Bearer Token / Identity
* **Testes (Opcional):** xUnit / FluentAssertions / Moq

---

## 🏗️ Arquitetura do Projeto

Para garantir a separação de conceitos e facilidade de evolução, o projeto foi estruturado seguindo os princípios de **Clean Architecture** (ou **DDD - Domain-Driven Design**):

* `ERPcomit.Api`: Camada de apresentação (Controllers, Configurações de Injeção de Dependência, Filtros e Middlewares).
* `ERPcomit.Application`: Camada de aplicação (Serviços, Casos de Uso, DTOs, Mapeamentos e validações).
* `ERPcomit.Domain`: O coração da aplicação (Entidades, Objetos de Valor, Interfaces de Repositórios e Regras de Negócio de ERP).
* `ERPcomit.Infrastructure`: Camada de suporte externo (Implementação de repositórios, contexto do Banco de Dados, integrações de terceiros e serviços de infraestrutura).

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos

Antes de começar, você vai precisar ter instalado em sua máquina:
* SDK do [.NET Core](https://dotnet.microsoft.com/download) (Versão mais recente)
* Um banco de dados configurado (ou Docker instalado)
* Uma IDE como [Visual Studio](https://visualstudio.microsoft.com/), [VS Code](https://code.visualstudio.com/) ou [Rider](https://www.jetbrains.com/rider/)
