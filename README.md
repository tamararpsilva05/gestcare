# GestCare — Sistema de Monitorização de Grávidas

Aplicação académica de Informática Médica desenvolvida no âmbito da Licenciatura em Engenharia Biomédica (ISEP).

O GestCare é uma plataforma web de monitorização de grávidas que visa melhorar o acompanhamento clínico ao longo das semanas de gestação. Permite à grávida marcar consultas, preencher questionários de bem-estar, consultar a sua agenda e comunicar com o seu médico obstetra. O médico, por sua vez, gere os seus utentes, agenda consultas, consulta a sua agenda clínica e exporta/importa dados em formato XML. O administrador é responsável pela gestão dos médicos e grávidas no sistema.

O projeto está dividido em duas pastas:

- [`Projeto_Infme/src/`](Projeto_Infme/src/) — API REST em Node.js + Express + Mongoose sobre MongoDB
- [`frontend-angular/`](frontend-angular/) — SPA em Angular 17 (standalone components)

## Arquitetura

O sistema segue uma arquitetura de 3 camadas:

**Camada de apresentação** — Angular 17 com componentes standalone, routing protegido por AuthGuard e comunicação com a API via serviços HTTP.

**Camada de lógica de negócio** — Node.js + Express com controllers separados por entidade, autenticação JWT e encriptação de passwords com bcryptjs.

**Camada de dados** — MongoDB com Mongoose, com schemas validados e relações entre coleções via referências ObjectId.

O frontend faz pedidos a `http://localhost:3000/api/*`. Todos os pedidos, exceto os de login, requerem `Authorization: Bearer <jwt>`.

## Modelo de domínio

O sistema conta com as seguintes entidades principais:

- **Grávida** — utente do sistema, associada a um médico obstetra (`idObstetra`)
- **Obstetra** — médico responsável pelo acompanhamento das suas grávidas
- **Administrador** — gere os médicos e grávidas no sistema
- **Consulta** — marcada pela grávida ou pelo médico, com estado (0 = Pendente, 1 = Confirmada, 2 = Cancelada) e campo `criadaPor`
- **Exame** — associado a uma grávida e a um profissional de saúde
- **Notificação** — gerada automaticamente quando uma consulta é marcada ou desmarcada, podendo ser destinada à grávida (`idGravida`) ou ao médico (`idObstetra`)
- **Questionário** — preenchido diariamente pela grávida com dados de bem-estar físico e emocional
- **Profissional de Saúde** — realiza exames às grávidas

## Arranque

### Requisitos

- Node.js 18+
- MongoDB a correr localmente ou MongoDB Atlas
- Angular CLI 17+

### Backend

```bash
cd Projeto_Infme
npm install
cp .env.example .env       # configurar MONGO_URI e JWT_SECRET
node src/server.js         # http://localhost:3000
```

### Frontend

```bash
cd frontend-angular
npm install
ng serve                   # http://localhost:4200
npm install chart.js
```

## Credenciais de acesso

### Administrador
| Email | Password |
|---|---|
| admin.gestcare@gmail.com | Admin123! |

### Médico (criado pelo administrador)
A password inicial de cada médico é gerada aquando do registo do mesmo no perfil do administrador. O médico pode alterá-la após o primeiro login no seu perfil.

| Email | Password |
|---|---|
| rosamaria.obstetra@gmail.com | senhaDoMedico2026 |
| carlossantos.obstetra@gmail.com | senhaDoMedico2026 |
| anasilva.obstetra@gmail.com | senhaDoMedico2026 |
| tiagosilva.obstetra@gmail.com | senhaDoMedico2026 |
| catarinaferreira.obstetra@gmail.com | senhaDoMedico2026 |


### Grávida (registada pelo médico)
A password inicial de cada grávida é gerada aquando do registo da mesma no perfil do médico. A grávida pode alterá-la após o primeiro login no seu perfil.

| Email | Password |
|---|---|
| ritasantos@gmail.com | senhaSegura2026 |
| mariajoana@gmail.com | senhaSegura2026 |
| antoniasilva@gmail.com | senhaSegura2026 |
| eduardapereira@gmail.com | senhaSegura2026 |
| catarinasantos@gmail.com | senhaSegura2026 |
| margaridasilva@gmail.com | senhaSegura2026 |

## Rotas da API

Todas as rotas vivem sob `/api`. Todas requerem JWT exceto as marcadas como **pública**.

### Autenticação

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| POST | `/api/gravidas/login` | Autentica uma grávida, devolve token JWT | pública |
| POST | `/api/obstetras/login` | Autentica um médico obstetra, devolve token JWT | pública |
| POST | `/api/admin/login` | Autentica o administrador, devolve token JWT | pública |

### Grávidas

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/gravidas` | Lista todas as grávidas |
| GET | `/api/gravidas/:id` | Obtém uma grávida por ID |
| GET | `/api/gravidas/obstetra/:idObstetra` | Lista as grávidas de um médico |
| GET | `/api/gravidas/export-xml/:idObstetra` | Exporta as grávidas em XML |
| POST | `/api/gravidas` | Regista uma nova grávida |
| POST | `/api/gravidas/import-xml` | Importa grávidas a partir de um ficheiro XML (validado com XSD) |
| PUT | `/api/gravidas/:id` | Atualiza os dados de uma grávida |
| DELETE | `/api/gravidas/:id` | Elimina uma grávida |

### Obstetras

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/obstetras` | Lista todos os médicos |
| GET | `/api/obstetras/:id` | Obtém um médico por ID |
| POST | `/api/obstetras` | Regista um novo médico |
| PUT | `/api/obstetras/:id` | Atualiza os dados de um médico (com encriptação de password) |
| DELETE | `/api/obstetras/:id` | Elimina um médico |

### Consultas

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/consultas` | Lista consultas (com filtros por `idObstetra` e `dataConsulta`) |
| GET | `/api/consultas/gravida/:id` | Lista consultas de uma grávida |
| GET | `/api/consultas/proxima/:idGravida` | Obtém a próxima consulta de uma grávida |
| GET | `/api/consultas/verificar-disponibilidade` | Verifica conflitos de horário para uma grávida |
| POST | `/api/consultas` | Cria uma nova consulta |
| PUT | `/api/consultas/:id` | Atualiza uma consulta |
| PATCH | `/api/consultas/:id/desmarcar` | Desmarca uma consulta |
| DELETE | `/api/consultas/:id` | Elimina uma consulta |

### Exames

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/exames` | Lista todos os exames  |
| GET | `/api/exames/gravida/:id` | Lista exames de uma grávida |
| POST | `/api/exames` | Cria um novo exame |
| PUT | `/api/exames/:id` | Atualiza um exame |
| PATCH | `/api/exames/:id/desmarcar` | Desmarca um exame |
| DELETE | `/api/exames/:id` | Elimina um exame |

### Notificações

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/notificacoes` | Lista todas as notificações |
| GET | `/api/notificacoes/gravida/:id` | Lista notificações de uma grávida |
| GET | `/api/notificacoes/obstetra/:id` | Lista notificações de um obstetra |
| POST | `/api/notificacoes` | Cria uma nova notificação |
| PUT | `/api/notificacoes/:id` | Atualiza uma notificação |
| DELETE | `/api/notificacoes/:id` | Elimina uma notificação |

### Administrador

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/admin/login` | Login do administrador |
| POST | `/api/admin/registar` | Regista um novo administrador |
| POST | `/api/admin/medicos` | Cria um novo médico |
| GET | `/api/admin/medicos` | Lista todos os médicos |
| DELETE | `/api/admin/medicos/:id` | Elimina um médico |
| GET | `/api/admin/gravidas` | Lista todas as grávidas |
| DELETE | `/api/admin/gravidas/:id` | Elimina uma grávida |
| PUT | `/api/admin/gravidas/:id/estado` | Altera o estado de uma grávida |

### Profissional de Saúde

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/profissionais` | Lista todos os profissionais de saúde |
| POST | `/api/profissionais` | Regista um novo profissional de saúde |
| PUT | `/api/profissionais/:id` | Atualiza um profissional de saúde |
| DELETE | `/api/profissionais/:id` | Elimina um profissional de saúde |

## Estrutura do frontend

```
frontend-angular/src/app/
├── app.component.{ts,html,css}
├── app.config.ts                          # provideRouter + provideHttpClient
├── app.routes.ts                          # rotas protegidas com authGuard
├── guards/
│   └── auth-guard.ts     
    └── auth-guard.spec.ts                   # verifica token e tipo de utilizador
├── services/
│   ├── auth.ts                            # login dos 3 tipos de utilizador
│   ├── gravida.ts                         # CRUD + export/import XML
│   ├── consulta.ts                        # CRUD + verificar disponibilidade
│   ├── exame.ts                           # CRUD de exames
│   ├── notificacao.ts                     # notificações por gravida/obstetra
│   └── obstetra.ts                        # CRUD + perfil do médico
└── components/
    ├── login/                             # página de login (3 perfis)
    ├── dashboard-gravida/
    │   ├── dashboard-gravida              # página inicial da grávida
    │   ├── perfil-gravida                 # perfil + edição + password
    │   ├── consultas                      # marcação de consultas
    │   ├── agenda                         # agenda com calendário semanal
    │   ├── notificacoes                   # confirmação de consultas/exames
    │   ├── questionario                   # questionário diário de bem-estar
    │   └── timeline                       # linha temporal da gravidez
    ├── dashboard-medico/
    │   ├── dashboard-medico               # página inicial do médico
    │   ├── utentes                        # listagem + registo rápido + XML
    │   ├── utente-detalhes                # detalhes de uma grávida
    │   ├── agenda-medico                  # agenda com calendário mensal
    │   ├── marcar-consulta                # marcação de consultas pelo médico
    │   ├── marcar-exames                  # marcação de exames pelo médico
    │   ├── analise                        # análise dos questionários pelo médico (visualização + relatórios+ gráficos)
    │   └── perfil-medico                  # perfil + edição + password
    └── dashboard-admin/
        └── dashboard-admin                # gestão de médicos e grávidas
```

## Funcionalidades principais

### Área da grávida
- Dashboard com resumo de consultas, semanas de gestação e notificações
- Marcação de consultas com verificação de disponibilidade de horários
- Agenda semanal com consultas e exames (estados: Pendente, Confirmada, Concluída)
- Desmarcação de consultas e exames (bloqueada nas 24h anteriores)
- Perfil editável com restrições de validação (semanas ≤ 42, telemóvel com 9 dígitos, etc.)
- Alteração de password após o primeiro login
- Questionários diários de bem-estar com histórico semanal
- Linha temporal da gravidez
- Centro de notificações para confirmar consultas e exames

### Área do médico
- Dashboard com número de utentes, consultas do dia e lembretes de consultas novas
- Notificação quando uma grávida desmarca uma consulta
- Listagem de utentes com pesquisa por nome
- Registo rápido de novas grávidas com cálculo automático das semanas de gestação
- Detalhes de cada utente com linha temporal da gravidez
- Exportação e importação de dados de grávidas em formato XML (validado com XSD)
- Agenda mensal com estados das consultas (Pendente, Confirmada, Realizada)
- Marcação de consultas e exames com verificação de conflitos de horário
- Desmarcação de consultas (bloqueada nas 24h anteriores)
- Perfil editável com alteração de password

### Área do administrador
- Criação de médicos com restrições (idade 25-75, número de ordem formato OM+dígitos)
- Listagem e eliminação de médicos
- Listagem ,eliminação e desativação de grávidas

### XML / XSD
- Exportação das grávidas de um médico para ficheiro XML
- Validação do ficheiro XML contra um esquema XSD antes da importação
- Mensagens de erro detalhadas em caso de dados inválidos (ex: idade fora do intervalo 16-55)
- Importação com deteção de duplicados (atualiza se já existe, cria se não existe)

## Segurança

- Passwords encriptadas com **bcryptjs** (salt de 10 rounds)
- Autenticação via **JWT** com expiração de 1 dia
- AuthGuard no Angular que verifica o token e o tipo de utilizador em cada rota
- Cada médico vê apenas as suas próprias grávidas
- Passwords iniciais não padronizadas com possibilidade de alteração pelo utilizador

## Stack técnica

**Backend:** Node.js, Express, Mongoose, MongoDB, bcryptjs, jsonwebtoken, xmlbuilder2, libxmljs2

**Frontend:** Angular 17 (standalone components), RxJS, FormsModule

## Fora do âmbito

- Sem refresh tokens — o JWT expira em 1 dia e obriga a novo login
- Sem envio de email para comunicar a password inicial à grávida
- Sem chat de comunicação direta entre grávida e médico
