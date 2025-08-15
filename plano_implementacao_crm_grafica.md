## ✅ Plano de Implementação - Sistema CRM / PDV Gráfica (Node.js + EJS + Google Sheets)

### 🗂️ Estrutura do Projeto

* [x] Criar estrutura base Node.js com Express
* [x] Configurar EJS para renderização de páginas
* [x] Criar pastas: `/views`, `/public`, `/controllers`, `/services`
* [x] Criar menu lateral fixo para todas as páginas (layout base)
* [x] Colocar Menu na página de pedidos e Avisos
* [x] Separar a página de Vendas e Pedidos como rotas diferentes

---

### 📦 Integração com Google Sheets

* [x] Criar projeto no Google Cloud Console
* [x] Habilitar API do Google Sheets
* [x] Criar credenciais (OAuth com acesso a planilha)
* [x] Gerar e salvar o `credentials.json`
* [x] Conectar com planilha "Financeiro Gráfica"
* [x] Criar serviço `googleSheetsService.js` com funções de leitura e escrita

---

### 🧾 Tela: `/pdv`

#### Modo: Vendas

* [x] Criar botão "Vendas" que ativa esse modo
* [x] Campos: Produto (select), Quantidade, Desconto, Valor Pago, Forma Pagamento, Status, Observação
* [x] Puxar lista de produtos da aba `Produtos`
* [x] Mostrar valor total do produto selecionado (preço unitário x quantidade)
* [x] Atualizar valor total em tempo real ao inserir desconto
* [x] Usar PROCV na planilha para os campos automáticos:
* [x] Adicionar as formulas ao registrar uma venda no pdvController
  * [x] Custo (R\$): `=SEERRO(PROCV(C2;Produtos!A:D;2;0)*D2;0)`
  * [x] Valor Total (R\$): `=SEERRO(PROCV(C2;Produtos!A:D;3;0)*D2;0)`
  * [x] Valor Restante (R\$): `=H2-(F2-G2)`
* [x] No Select Forma de Pagamento deixar uma opção de "Pendente".
* [x] Gerar ID sequencial real lendo último valor da coluna B (ID Pedido) e somar +1
* [x] Registrar linha na aba `Vendas` com DataHora e colunas relevantes
* [x] Botões: Registrar, Cancelar

#### Modo: Pedidos

* [x] Criar botão "Pedidos" que ativa esse modo
* [x] Campos adicionais: Nome, Telefone, E-mail (opcional), Data Entrega
* [x] Permitir adicionar vários itens ao pedido (botão "Adicionar")
* [x] Exibir lista de itens adicionados
* [x] Calcular valor total e valor restante
* [x] Organizar o total com desconto
* [x] Na tabela Pedidos adicionar Valor restante no código de Pedidos formula
* [x] Ao salvar um pedido somar automaticamente o valor restante na planilha
* [ ] Ao clicar em "Concluir":
  * [x] Inserir uma linha para cada item na aba `Vendas` (com mesmo ID de pedido)
  * [x] Criar linha na aba `Pedidos` com resumo do pedido (campos definidos)
  * [x] Adicionar um Loading para saber que está salvando
  * [x] Adicionar um popup mais discreto ao salvar com sucesso | falha, aqueles verdes que ficam no topo da página

---

### 📋 Tela: `/dashboard`

* [x] Criar 6 colunas: Orçamentos, Pedidos, Arte, Produção, Expedição, Entregue
* [x] Carregar pedidos da aba `Pedidos` e exibir como cards
* [x] Permitir mover cards entre colunas (drag-and-drop)
* [x] Atualizar status na planilha ao soltar card
* [x] Ao clicar em um card:
  * [x] Exibir detalhes do pedido em popup
  * [x] Permitir editar itens, valores, status
  * [x] Botão WhatsApp para cliente
  * [x] Finalizar o Front-end

---

### 📝 Tela: `/avisos`

* [x] Criar cards com título (destinatário) e conteúdo (texto do aviso)
* [x] Formulário com: "Para" (select), WhatsApp (opcional), Conteúdo
* [x] Salvar dados na aba `Avisos`

---

### 🔐 Login (futuro)

* [ ] Estrutura básica de autenticação
* [ ] Registrar nome do operador junto aos registros
* [ ] Log de ações por usuário

---

### 🎨 Estilo Visual

* [x] Tema branco com cinza claro
* [x] Botões e destaques em azul
* [ ] Layout responsivo (desktop/mobile)
* [x] Sidebar fixa com links para PDV, Dashboard, Avisos

---

### ✅ Finalização

* [ ] Testes gerais
* [ ] Otimização de carregamento
* [ ] Documentação do sistema
* [ ] Deploy (local ou hospedado)

### Dash de Resumo
* Mês que vem puxar relatório:
* [ ] Qual período mais tem venda, puxando pela quantidade de pedidos num dia ou semana e não pelo valor
* [ ] Puxar qual serviço mais é solicitado no mês
* [ ] Qual é o carro chefe da empresa
* [ ] O que devo focar mais e melhorar

### Ajustes
* [ ] Em PEDIDO, quando salva um valor com desconto, o valor total ta diminuindo mas não deveria, pq o total permanece imutavel.
* [x] Precisa colocar os itens como pago quando concluir o pedido, pq na venda fica os valores como pendente ainda
* [x] Dashboard de pedidos, remover undefined que fica em cima de Produto, e em valor pago colocar float, e observação se for vazio colocar "" e não undefined
* [ ] Adicionar M² - Adicionar campo, na planilha de produtos adicionar a uma coluna chamada Unidade, pq pode ser "unidade ou m2", ele vai só calcular no valor total para registrar o pedido, e no back-end se houver m2 ele vai por na tabela o valor total do m² e não a formula que está programada. (adicionar campos Largura e Altura)
* [x] Colocar tudo de volta num campo de venda só, sem ser loja 1 e loja 2 no menu
* [x] Ao registrar data hora colocar o Timezone -3
* [x] Quando registra um pedido com mais de um item ele pega a linha seguinte pra colocar na formula do valor do produto, Mas não ta pegando o próximo item, só o primeiro item, acho melhor ao registrar venda colocar o valor do pedido mesmo sem formula
* [ ] No Pedido, é bom mostrar a soma dos itens no caso o total geral
* [x] No Dashboard, mostrar a data de entrega com uma tag (vermelha em atraso ou perto de vencer o prazo, amarela 2 dias antes de vencer), mas se tiver com status entregue não fica colorido