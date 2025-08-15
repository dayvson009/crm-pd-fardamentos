const { google } = require('googleapis');
const creds = require('../credentials.json');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

// Estenda os plugins Day.js
dayjs.extend(utc);
dayjs.extend(timezone);

// Defina o fuso horário padrão para Recife
// 'America/Recife' é o identificador IANA para o fuso horário de Recife (UTC-3).
dayjs.tz.setDefault('America/Recife');

const spreadsheetId = '1NiwHtaY_rWz_0_RTH7GoyWMzVatkwhahyHtT0Y7bMh4';

async function authSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth: await auth.getClient() });
}

exports.getNovoIDPedido = async () => {
  const sheets = await authSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Pedidos!B2:B',
  });

  const valores = res.data.values || [];
  const ultimosIDs = valores.map(v => parseInt(v[0])).filter(n => !isNaN(n));
  const ultimoID = Math.max(...ultimosIDs, 0);

  return ultimoID + 1;
};

exports.getProximaLinha = async () => {
  const sheets = await authSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Itens!A2:A',
  });
  const linhas = res.data.values?.length || 0;
  return linhas + 2; // +2 porque começa da linha 2
};

exports.getProximaLinhaPedidos = async () => {
  const sheets = await authSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Pedidos!A2:A',
  });
  const linhas = res.data.values?.length || 0;
  return linhas + 2; // +2 porque começa da linha 2
};

exports.addMultiplosItens = async (linhas) => {
  const sheets = await authSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Itens!A2',
    valueInputOption: 'USER_ENTERED',
    resource: { values: linhas }
  });
};

exports.addPedido = async (linha) => {
  const sheets = await authSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Pedidos!A2',
    valueInputOption: 'USER_ENTERED',
    resource: { values: [linha] }
  });
};

// Dashboard

exports.getPedidos = async () => {
  const sheets = await authSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Pedidos!A2:N',
  });

  const linhas = res.data.values || [];

  // Primeiro, arquivar automaticamente pedidos entregues há mais de 10 dias
  await exports.arquivarPedidosAntigos();

  return linhas
    .map((linha) => {
      // Função helper para converter valores numéricos
      const parseNumericValue = (value) => {
        if (value === null || value === undefined || value === '') return 0;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          // Remove caracteres especiais e converte para número
          const cleanValue = value.toString().replace(/[^\d.,-]/g, '').replace(',', '.');
          const num = parseFloat(cleanValue);
          return isNaN(num) ? 0 : num;
        }
        return 0;
      };

      return {
        dataHora: linha[0] || '',
        id: linha[1] || '',
        nome: linha[2] || '',
        telefone: linha[3] || '',
        custoTotal: parseNumericValue(linha[4]),
        valorTotal: parseNumericValue(linha[5]),
        desconto: parseNumericValue(linha[6]),
        valorPago: parseNumericValue(linha[7]),
        valorRestante: parseNumericValue(linha[8]),
        lucroPedido: parseNumericValue(linha[9]),
        dataEntrega: linha[10] || '',
        localEntrega: linha[11] || '',
        status: linha[12] || '',
        observacao: linha[13] || '',
      };
    })
    .filter(pedido => pedido.status !== 'Arquivado'); // Filtrar pedidos arquivados
};

// Função para arquivar automaticamente pedidos entregues há mais de 10 dias
exports.arquivarPedidosAntigos = async () => {
  const sheets = await authSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Pedidos!A2:N',
  });

  const linhas = res.data.values || [];
  const hoje = dayjs.tz();
    
  let pedidosVerificados = 0;
  let pedidosArquivados = 0;
  let pedidosComErro = 0;
  
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const status = linha[12]; // Coluna M (13ª coluna, índice 12)
    const dataEntrega = linha[10]; // Coluna K (11ª coluna, índice 10)
    const idPedido = linha[1]; // Coluna B (2ª coluna, índice 1)
    
    
    // Se o pedido está entregue e tem data de entrega
    if (status === 'Entregue' && dataEntrega) {
      pedidosVerificados++;
      try {
        
        let dataEntregaObj;
        
        // Tentar diferentes formatos de data
        if (typeof dataEntrega === 'string') {
          // Remover espaços e caracteres especiais
          const dataLimpa = dataEntrega.trim().replace(/[^\d\-]/g, '');
          
          // Tentar diferentes formatos sem timezone primeiro
          const formatos = ['YYYY-MM-DD', 'DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY/MM/DD'];
          
          for (const formato of formatos) {
            try {
              dataEntregaObj = dayjs(dataLimpa, formato);
              if (dataEntregaObj.isValid()) {
                break;
              }
            } catch (error) {
            }
          }
        }
        
        if (!dataEntregaObj || !dataEntregaObj.isValid()) {
          pedidosComErro++;
          continue;
        }
        
        // Calcular quantos dias se passaram desde a entrega
        const diasDesdeEntrega = hoje.diff(dataEntregaObj, 'day');
        
        // Se passaram mais de 10 dias desde a entrega, arquivar
        if (diasDesdeEntrega > 10) {
          
          // Atualizar o status para "Arquivado"
          const linhaDestino = i + 2;
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Pedidos!M${linhaDestino}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [['Arquivado']] }
          });
          
          pedidosArquivados++;
        } 
      } catch (error) {
        console.error(`   ❌ Erro ao processar pedido #${idPedido}:`, error);
        pedidosComErro++;
      }
    } 
  }
 
};

exports.getPedidoPorID = async (id) => {
  const sheets = await authSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Pedidos!A2:N',
  });

  const linhas = res.data.values || [];
  const pedido = linhas.find(linha => String(linha[1]) === String(id));

  if (!pedido) return null;

  // Função helper para converter valores numéricos
  const parseNumericValue = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Remove caracteres especiais e converte para número
      const cleanValue = value.toString().replace(/[^\d.,-]/g, '').replace(',', '.');
      const num = parseFloat(cleanValue);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  return {
    dataHora: pedido[0] || '',
    id: pedido[1] || '',
    nome: pedido[2] || '',
    telefone: pedido[3] || '',
    custoTotal: parseNumericValue(pedido[4]),
    valorTotal: parseNumericValue(pedido[5]),
    desconto: parseNumericValue(pedido[6]),
    valorPago: parseNumericValue(pedido[7]),
    valorRestante: parseNumericValue(pedido[8]),
    lucroPedido: parseNumericValue(pedido[9]),
    dataEntrega: pedido[10] || '',
    localEntrega: pedido[11] || '',
    status: pedido[12] || '',
    observacao: pedido[13] || '',
  };
};

exports.atualizarStatusPedido = async (id, novoStatus) => {
  const sheets = await authSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Pedidos!B2:B',
  });

  const linhas = res.data.values || [];
  const index = linhas.findIndex(l => l[0] == id);

  if (index === -1) throw new Error('Pedido não encontrado.');

  const linhaDestino = index + 2;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Pedidos!M${linhaDestino}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [[novoStatus]] }
  });
};

exports.getItensDoPedido = async (idPedido) => {
  const sheets = await authSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Itens!A2:J',
  });

  const dados = res.data.values || [];

  return dados
    .filter(l => String(l[0]) === String(idPedido))
    .map(l => ({
      vestuario: l[1],
      malha: l[2],
      cor: l[3],
      tamanho: l[4],
      quantidade: parseInt(l[5]) || 0,
      estampa: l[6],
      custoUnid: l[7] ? (typeof l[7] === 'string' ? parseFloat(l[7].replace(/[^\d.,]/g, '').replace(',', '.')) : parseFloat(l[7])) || 0 : 0,
      valorUnid: l[8] ? (typeof l[8] === 'string' ? parseFloat(l[8].replace(/[^\d.,]/g, '').replace(',', '.')) : parseFloat(l[8])) || 0 : 0,
      observacao: l[9] || ''
    }));
};

exports.atualizarPedidoCompleto = async (id, pago, entrega, status, obs) => {
  const sheets = await authSheets();

  // 1. Buscar todos os itens da aba Itens com esse ID
  const resI = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Itens!A2:J',
  });

  const valores = resI.data.values || [];
  const itensDoPedido = valores
    .map((v, i) => {
      // Tentar ler os valores como números, mesmo se estiverem em fórmulas
      const valorUnid = v[8] ? (typeof v[8] === 'string' ? parseFloat(v[8].replace(/[^\d.,]/g, '').replace(',', '.')) : parseFloat(v[8])) || 0 : 0;
      const quantidade = parseInt(v[5]) || 0;
      
      return { 
        linha: i + 2, 
        id: v[0], 
        vestuario: v[1],
        malha: v[2],
        cor: v[3],
        tamanho: v[4],
        quantidade: quantidade,
        estampa: v[6],
        custoUnid: v[7],
        valorUnid: valorUnid
      };
    })
    .filter(v => String(v.id) === String(id));

  if (itensDoPedido.length === 0) {
    throw new Error('Nenhum item encontrado para este pedido');
  }

  // 2. Atualizar aba Pedidos
  const resP = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Pedidos!B2:B',
  });

  const linhas = resP.data.values || [];
  const index = linhas.findIndex(l => String(l[0]) === String(id));
  if (index === -1) throw new Error('Pedido não encontrado');

  const linhaDestino = index + 2;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Pedidos!H${linhaDestino}:N${linhaDestino}`,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [[pago, `=H${linhaDestino}-(F${linhaDestino}-G${linhaDestino})`, `=F${linhaDestino}-E${linhaDestino}`, entrega || '', status, obs || '']]
    }
  });
};

exports.getAvisos = async () => {
  const sheets = await authSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Avisos!A2:D',
  });

  const linhas = res.data.values || [];

  return linhas
    .map((l, i) => ({
      linha: i + 2,
      data: l[0] || '',
      para: l[1] || '',
      whatsapp: l[2] || '',
      texto: l[3] || '',
    }))
    .filter(l => l.data && l.texto); // 👈 ignora se estiver vazio
};

exports.salvarAviso = async ({ para, whatsapp, texto }) => {
  const sheets = await authSheets();
  const dataHora = dayjs.tz().format('DD-MM-YYYY HH:mm:ss');

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Avisos!A2',
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [[dataHora, para, whatsapp || '', texto]]
    }
  });
};

exports.deletarAviso = async (linha) => {
  const sheets = await authSheets();
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `Avisos!A${linha}:D${linha}`
  });
};

// Função para buscar estatísticas de pedidos arquivados
exports.getEstatisticasArquivados = async () => {
  const sheets = await authSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Pedidos!A2:M',
  });

  const linhas = res.data.values || [];
  const hoje = dayjs.tz();
  const inicioMes = hoje.startOf('month');
  
  let totalArquivados = 0;
  let arquivadosEsteMes = 0;
  let ultimoArquivamento = null;
  
  linhas.forEach(linha => {
    const status = linha[11];
    const dataHora = linha[0];
    
    if (status === 'Arquivado') {
      totalArquivados++;
      
      try {
        const dataPedido = dayjs.tz(dataHora, 'DD-MM-YYYY HH:mm:ss');
        if (dataPedido.isAfter(inicioMes)) {
          arquivadosEsteMes++;
        }
        
        if (!ultimoArquivamento || dataPedido.isAfter(ultimoArquivamento)) {
          ultimoArquivamento = dataPedido.format('DD/MM/YYYY HH:mm');
        }
      } catch (error) {
        console.error('Erro ao processar data do pedido arquivado:', error);
      }
    }
  });
  
  return {
    totalArquivados,
    arquivadosEsteMes,
    ultimoArquivamento
  };
};