# CRM para Gestão de Fardamentos

Sistema de CRM desenvolvido para gestão de pedidos de fardamentos, com controle de status, itens e acompanhamento financeiro.

## Mudanças Implementadas

### 1. Remoção do PDV de Vendas
- ✅ Removido arquivo `views/pdvVendas.ejs`
- ✅ Removidas funções relacionadas ao PDV de vendas do controller
- ✅ Removidas rotas relacionadas ao PDV de vendas
- ✅ Removidas funções relacionadas ao PDV de vendas do service
- ✅ Atualizado sidebar para remover referências ao PDV de vendas

### 2. Nova Estrutura da Planilha

#### Aba "Pedidos"
- **DataHora**: Data e hora do pedido (automático)
- **Nº do Pedido**: Sequencial automático
- **Cliente**: Nome do cliente
- **Telefone**: Telefone do cliente
- **Custo total**: Custo total calculado automaticamente
- **Valor total**: Soma dos itens do pedido
- **Desconto**: Desconto aplicado
- **Valor pago**: Valor já pago
- **Valor Restante**: Fórmula `=H2-(F2-G2)`
- **Lucro Pedido**: Fórmula `=F2-E2`
- **Data de Entrega**: Data de entrega
- **Local Entrega**: Local de entrega
- **Status**: Status do pedido
- **Observações**: Observações gerais

#### Aba "Itens"
- **pedido**: ID do pedido
- **Vestuário**: Tipo de vestuário
- **Malha**: Tipo de malha
- **Cor**: Cor do produto
- **Tamanho**: Tamanho do produto
- **quantidade**: Quantidade
- **Estampa**: Tipo de estampa
- **Custo unid.**: Custo unitário
- **Valor unid.**: Valor unitário
- **Observação**: Observação do item

### 3. Status dos Pedidos
Os pedidos podem ter os seguintes status:
- Orçamentos
- Pedidos
- Arte
- Corte
- Costura
- Estampa
- Embalagem
- Expedição
- Entregue

### 4. Funcionalidades Mantidas
- ✅ Gestão de pedidos
- ✅ Dashboard de pedidos com drag & drop
- ✅ Sistema de avisos
- ✅ Visualização de recibos
- ✅ Gestão de status de pedidos
- ✅ Arquivamento automático de pedidos entregues

## Configuração

### 1. Credenciais
Coloque o arquivo `credentials.json` na raiz do projeto. Este arquivo deve conter as credenciais de autenticação do Google Sheets API.

### 2. Planilha
Configure a planilha do Google Sheets com as abas:
- **Pedidos**: Para resumo dos pedidos
- **Itens**: Para itens individuais dos pedidos
- **Avisos**: Para sistema de avisos

### 3. Instalação
```bash
npm install
npm start
```

## Estrutura do Projeto

```
crm-pd-fardamentos/
├── app.js                 # Arquivo principal
├── routes.js              # Rotas da aplicação
├── controllers/           # Controladores
│   └── pdvController.js   # Controller principal
├── services/              # Serviços
│   └── googleSheetsService.js # Integração com Google Sheets
├── views/                 # Views EJS
│   ├── pdvPedidos.ejs     # Formulário de novo pedido
│   ├── painelpedidos.ejs  # Dashboard de pedidos
│   ├── recibo.ejs         # Visualização de recibo
│   ├── avisos.ejs         # Sistema de avisos
│   └── partials/          # Partials
│       └── sidebar.ejs    # Menu lateral
└── public/                # Arquivos estáticos
    ├── css/
    └── images/
```

## Uso

1. **Novo Pedido**: Acesse a página inicial para criar um novo pedido
2. **Dashboard**: Visualize e gerencie todos os pedidos
3. **Status**: Arraste os pedidos entre as colunas para atualizar o status
4. **Recibo**: Visualize o recibo de qualquer pedido
5. **Avisos**: Gerencie avisos e notificações

## Tecnologias

- **Backend**: Node.js + Express
- **Frontend**: EJS + JavaScript
- **Banco**: Google Sheets (via API)
- **Autenticação**: Google Cloud Service Account
