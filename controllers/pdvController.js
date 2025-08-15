const sheets = require('../services/googleSheetsService');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

// Estenda os plugins Day.js
dayjs.extend(utc);
dayjs.extend(timezone);

// Defina o fuso horário padrão para Recife
// 'America/Recife' é o identificador IANA para o fuso horário de Recife (UTC-3).
dayjs.tz.setDefault('America/Recife');

exports.renderPdvPedidos = async (req, res) => {
  res.render('pdvPedidos', { currentPage: 'pdvPedidos' });
};

exports.registrarPedido = async (req, res) => {
  try {
    const { nome, telefone, email, dataEntrega, localEntrega, valorPago, desconto, formaPagamento, itens, observacaoGeral } = req.body;

    if (!nome || !telefone || !itens || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).send('Dados inválidos');
    }

    const dataHora = dayjs.tz().format('DD-MM-YYYY HH:mm:ss');
    const novoID = await sheets.getNovoIDPedido();
    const linha = await sheets.getProximaLinha();
    const linhaPedidos = await sheets.getProximaLinhaPedidos();

    let valorTotal = 0;
    let custoTotalCalculado = 0;

    // 1. Registrar cada item na aba "Itens"
    const registrosItens = itens.map((item, index) => {
      // Garantir que os valores sejam números
      const custoUnid = parseFloat(item.custoUnid) || 0;
      const valorUnid = parseFloat(item.valorUnid) || 0;
      const quantidade = parseInt(item.quantidade) || 0;
      
      // Calcular o valor total bruto (antes do desconto) para este item
      const valorTotalBrutoItem = valorUnid * quantidade;
      
      valorTotal += valorTotalBrutoItem; // Agora é o total bruto
      custoTotalCalculado += custoUnid * quantidade;
      
      return [
        novoID, // pedido
        item.vestuario || '',
        item.malha || '',
        item.cor || '',
        item.tamanho || '',
        quantidade,
        item.estampa || '',
        custoUnid,
        valorUnid,
        item.observacao || ''
      ];
    });

    await sheets.addMultiplosItens(registrosItens);

    // 2. Registrar resumo na aba "Pedidos"
    // Colunas: DataHora, Nº do Pedido, Cliente, Telefone, Custo total, Valor total, Desconto, Valor pago, Valor Restante, Lucro Pedido, Data de Entrega, Local Entrega, Status, Observações
    const resumoPedido = [
      dataHora,
      novoID,
      nome,
      telefone,
      custoTotalCalculado, // Custo total calculado automaticamente
      valorTotal, // Valor total BRUTO (antes do desconto)
      parseFloat(desconto) || 0,
      parseFloat(valorPago) || 0, 
      `=H${linhaPedidos}-(F${linhaPedidos}-G${linhaPedidos})`, // Valor Restante será calculado na planilha
      `=F${linhaPedidos}-E${linhaPedidos}`, // Lucro Pedido será calculado na planilha
      dataEntrega || '',
      localEntrega || '',
      'Pedidos',
      observacaoGeral || '' // Observação geral do pedido
    ];
    await sheets.addPedido(resumoPedido);

    res.status(200).json({ message: 'Pedido registrado com sucesso!' });
  } catch (err) {
    console.error('Erro ao registrar pedido:', err);
    res.status(500).json({ message: 'Erro interno do servidor ao registrar pedido.' });
  }
};


//// DASHBOARD

exports.dashboardPedidos = async (req, res) => {
  try {
    // Primeiro, aplicar arquivamento automático
    await sheets.arquivarPedidosAntigos();
    
    // Depois buscar os pedidos (já filtrados para excluir arquivados)
    const pedidos = await sheets.getPedidos();
    const porStatus = {};

    // Agrupar por status
    pedidos.forEach(p => {
      const status = p.status || 'Orçamentos';
      if (!porStatus[status]) porStatus[status] = [];
      porStatus[status].push(p);
    });

    res.render('painelpedidos', { 
      porStatus, 
      currentPage: 'painelpedidos'
    });
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    res.status(500).send('Erro interno do servidor');
  }
};

exports.atualizarStatusPedido = async (req, res) => {
  const { idPedido, novoStatus } = req.body;
  try {
    await sheets.atualizarStatusPedido(idPedido, novoStatus);
    res.send('Status atualizado!');
  } catch (e) {
    console.error('Erro ao atualizar status:', e);
    res.status(500).send('Erro ao atualizar status.');
  }
};

exports.getItensDoPedido = async (req, res) => {
  const id = req.query.id;
  const itens = await sheets.getItensDoPedido(id);
  res.json(itens);
};

exports.editarPedido = async (req, res) => {
  const { id, pago, dataEntrega, observacao } = req.body;
  const pedido = await sheets.getPedidoPorID(id);
  const status = pedido.status;
  
  try {
    // Chamar a função do service para atualizar o pedido
    await sheets.atualizarPedidoCompleto(id, pago, dataEntrega, status, observacao);
    res.send('Pedido atualizado com sucesso');
  } catch (e) {
    console.error('Erro ao editar pedido:', e);
    res.status(500).send('Erro ao editar pedido');
  }
};

exports.getAvisos = async (req, res) => {
  const avisos = await sheets.getAvisos();
  res.render('avisos', { avisos, currentPage: 'avisos' });
};

exports.salvarAviso = async (req, res) => {
  const { para, whatsapp, texto } = req.body;
  try {
    await sheets.salvarAviso({ para, whatsapp, texto });
    res.redirect('/avisos');
  } catch (err) {
    console.error('Erro ao salvar aviso:', err);
    res.status(500).send('Erro ao salvar aviso.');
  }
};

exports.deletarAviso = async (req, res) => {
  const { linha } = req.body;
  try {
    await sheets.deletarAviso(linha);
    res.redirect('/avisos');
  } catch (err) {
    console.error('Erro ao deletar aviso:', err);
    res.status(500).send('Erro ao deletar aviso');
  }
};

exports.getEstatisticasArquivados = async (req, res) => {
  try {
    const estatisticas = await sheets.getEstatisticasArquivados();
    res.json(estatisticas);
  } catch (error) {
    console.error('Erro ao buscar estatísticas de arquivados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.testarArquivamento = async (req, res) => {
  try {
    
    // Primeiro, buscar estatísticas antes do arquivamento
    const estatisticasAntes = await sheets.getEstatisticasArquivados();
    
    // Executar o arquivamento
    await sheets.arquivarPedidosAntigos();
    
    // Buscar estatísticas depois do arquivamento
    const estatisticasDepois = await sheets.getEstatisticasArquivados();
    
    const pedidosArquivados = estatisticasDepois.totalArquivados - estatisticasAntes.totalArquivados;
    
    res.json({ 
      message: 'Teste de arquivamento concluído. Verifique os logs do console.',
      pedidosArquivados: pedidosArquivados,
      totalAntes: estatisticasAntes.totalArquivados,
      totalDepois: estatisticasDepois.totalArquivados
    });
  } catch (error) {
    console.error('Erro no teste de arquivamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.visualizarRecibo = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar o pedido pelo ID
    const pedido = await sheets.getPedidoPorID(id);
    
    if (!pedido) {
      return res.status(404).render('erro', { 
        message: 'Pedido não encontrado',
        error: 'O pedido solicitado não foi encontrado em nossa base de dados.'
      });
    }

    // Buscar itens do pedido
    const itens = await sheets.getItensDoPedido(id);
    
    // Determinar se deve mostrar dados sensíveis baseado no status
    const mostrarDadosSensiveis = pedido.status !== 'Entregue';
    
    // Preparar dados para renderização
    const dadosRecibo = {
      pedido: {
        id: pedido.id,
        nome: mostrarDadosSensiveis ? pedido.nome : 'Cliente',
        telefone: mostrarDadosSensiveis ? pedido.telefone : '***',
        dataHora: pedido.dataHora,
        dataEntrega: pedido.dataEntrega,
        localEntrega: pedido.localEntrega,
        status: pedido.status,
        valorTotal: pedido.valorTotal,
        desconto: pedido.desconto,
        valorPago: pedido.valorPago,
        valorRestante: pedido.valorRestante,
        observacao: pedido.observacao
      },
      itens: itens,
      mostrarDadosSensiveis: mostrarDadosSensiveis
    };

    res.render('recibo', { dadosRecibo });
    
  } catch (error) {
    console.error('Erro ao visualizar recibo:', error);
    res.status(500).render('erro', { 
      message: 'Erro interno do servidor',
      error: 'Ocorreu um erro ao carregar o recibo. Tente novamente mais tarde.'
    });
  }
};
