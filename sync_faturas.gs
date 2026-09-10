/**
 * ============================================================================
 * VEXO HUB - MOTOR DE SINCRONIZAÇÃO DE FATURAS (VERSÃO DEFINITIVA)
 * ============================================================================
 * - Lê a aba USERS do Index para achar os IDs.
 * - Lê a aba VENDAS do banco Próprio e dos Parceiros.
 * - Formato Horizontal (1 Linha por Cliente, 24 meses).
 * - Ignora RENEG e TROCA DE TECNOLOGIA E-SIM.
 * - Transcreve o Código do Cliente exatamente como digitado (respeitando pontos).
 */

const CONFIG_BANCOS = {
  VEXO_PROPRIO: '1ULyXmZjrHlTXJ7cl0jlL_ugriHzZ4W8Q-6ExvkPm6qg',
  INDEX_TERCEIROS: '1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4',
  NOME_ABA_INDEX_USERS: 'USERS', // A "lista telefônica"
  NOME_ABA_VENDAS: 'VENDAS'      // Onde estão os dados reais
};

function extrairIDBanco(input) {
  if (!input) return null;
  let str = String(input).trim();
  let match = str.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) return match[1];
  if (str.length > 20) return str; 
  return null;
}

function sincronizarTodasAsVendasParaFaturas() {
  Logger.log("⏳ [1/5] INICIANDO O MOTOR DE SINCRONIZAÇÃO...");
  
  const ssAtual = SpreadsheetApp.getActiveSpreadsheet();
  let abaFaturas = ssAtual.getSheetByName('FATURAS');
  
  // Cria a aba se não existir
  if (!abaFaturas) {
    abaFaturas = ssAtual.insertSheet('FATURAS');
    // CABEÇALHO ATUALIZADO COM AS NOVAS COLUNAS
    let cabecalho = ["CÓDIGO CLIENTE", "NOME CLIENTE", "RESPONSÁVEL", "CPF/CNPJ", "PLANO", "LINHA", "ORIGEM", "CONTATO FINANCEIRO", "E-MAIL", "DATA 1º CADASTRO"];
    for (let m = 1; m <= 24; m++) {
      cabecalho.push(`VENC. M${m}`);
      cabecalho.push(`STATUS M${m}`);
    }
    abaFaturas.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho])
      .setFontWeight("bold").setBackground("#1e3c72").setFontColor("white");
    abaFaturas.setFrozenRows(1);
    abaFaturas.setFrozenColumns(6);
  } else {
    // 🔥 LIMPA A ABA FATURAS (mantém apenas o cabeçalho)
    const ultimaLinha = abaFaturas.getLastRow();
    if (ultimaLinha > 1) {
      abaFaturas.deleteRows(2, ultimaLinha - 1);
    }
    Logger.log("🧹 Aba FATURAS limpa. Apenas o cabeçalho foi mantido.");
  }
  
  // Agora vamos preencher do zero com as vendas filtradas
  let novasFaturasParaInserir = [];
  let relatorio = { proprio: 0, parceirosLidos: 0, parceirosFalhos: 0 };
  let totalRenegIgnorados = 0;
  let totalEsimIgnorados = 0;
  let totalSemAtivacao = 0;

  // ====================================================================
  // EXTRAIR VEXO PRÓPRIO
  // ====================================================================
  try {
    const ssProprio = SpreadsheetApp.openById(CONFIG_BANCOS.VEXO_PROPRIO);
    const abaVendasProprio = ssProprio.getSheetByName(CONFIG_BANCOS.NOME_ABA_VENDAS);
    if (abaVendasProprio) {
      const dadosProprio = abaVendasProprio.getDataRange().getValues();
      // Passamos um Set vazio pois não há duplicatas a controlar (recriamos tudo)
      const novasLinhas = processarVendasHorizontal(dadosProprio, new Set(), "VEXO PRÓPRIO");
      novasFaturasParaInserir = novasFaturasParaInserir.concat(novasLinhas);
      relatorio.proprio = 1;
      Logger.log(`✅ VEXO PRÓPRIO: ${novasLinhas.length} clientes adicionados.`);
    }
  } catch(e) {
    Logger.log("❌ ERRO VEXO PRÓPRIO: " + e.message);
  }

  // ====================================================================
  // EXTRAIR PARCEIROS (Lendo a aba USERS corretamente)
  // ====================================================================
  Logger.log("📡 [3/5] Acedendo ao INDEX DE TERCEIROS (Aba USERS)...");
  try {
    const ssIndexTerceiros = SpreadsheetApp.openById(CONFIG_BANCOS.INDEX_TERCEIROS);
    const abaUsers = ssIndexTerceiros.getSheetByName(CONFIG_BANCOS.NOME_ABA_INDEX_USERS); 
    
    if (abaUsers) {
      const dadosUsers = abaUsers.getDataRange().getValues();
      Logger.log(`📄 Aba USERS aberta. Encontrados ${dadosUsers.length - 1} registros.`);
      
      for (let i = 1; i < dadosUsers.length; i++) {
        const nomeParceiro = dadosUsers[i][2] || dadosUsers[i][0] || `Parceiro Linha ${i+1}`; 
        const linkSujo = dadosUsers[i][9]; // COLUNA J
        
        const idBancoParceiro = extrairIDBanco(linkSujo);
        
        if (idBancoParceiro) {
          Logger.log(`🔍 Lendo parceiro: ${nomeParceiro} (ID: ${idBancoParceiro})`);
          try {
            const ssParceiro = SpreadsheetApp.openById(idBancoParceiro);
            const abaVendasParceiro = ssParceiro.getSheetByName(CONFIG_BANCOS.NOME_ABA_VENDAS);
            
            if (abaVendasParceiro) {
              const dadosParceiro = abaVendasParceiro.getDataRange().getValues();
              const novasLinhas = processarVendasHorizontal(dadosParceiro, new Set(), `Parceiro: ${nomeParceiro}`);
              novasFaturasParaInserir = novasFaturasParaInserir.concat(novasLinhas);
              relatorio.parceirosLidos++;
              Logger.log(`  🟢 Sucesso! ${novasLinhas.length} vendas de ${nomeParceiro}.`);
            } else {
              relatorio.parceirosFalhos++;
              Logger.log(`  🟡 Aviso: O banco de ${nomeParceiro} não tem a aba VENDAS.`);
            }
          } catch(eParceiro) {
            relatorio.parceirosFalhos++;
            Logger.log(`  🔴 Falha ao abrir ${nomeParceiro}: ${eParceiro.message}`);
          }
        }
      }
    } else {
      Logger.log("❌ ERRO: Aba 'USERS' não encontrada no INDEX DE TERCEIROS.");
    }
  } catch(e) {
    Logger.log("❌ ERRO CRÍTICO no INDEX DE TERCEIROS: " + e.message);
  }

  // ====================================================================
  // INSERIR NA ABA FATURAS
  // ====================================================================
  Logger.log("📝 [4/5] Finalizando...");
  let msgFinal = `📊 RELATÓRIO FINAL: Banco Próprio Lidos (${relatorio.proprio}), Parceiros Lidos (${relatorio.parceirosLidos}), Parceiros Falhos (${relatorio.parceirosFalhos}).`;
  Logger.log(msgFinal);
  
  if (novasFaturasParaInserir.length > 0) {
    const totalColunas = novasFaturasParaInserir[0].length;
    // Insere todas as novas linhas a partir da linha 2 (após o cabeçalho)
    abaFaturas.getRange(2, 1, novasFaturasParaInserir.length, totalColunas).setValues(novasFaturasParaInserir);
    
    Logger.log(`🎉 SUCESSO: ${novasFaturasParaInserir.length} faturas adicionadas!`);
    return msgFinal + `\nSUCESSO: ${novasFaturasParaInserir.length} novas faturas adicionadas.`;
  } else {
    Logger.log("⚠️ Nenhuma venda válida encontrada (todas foram filtradas).");
    return msgFinal + `\nNenhuma venda válida encontrada.`;
  }
}

/**
 * Função para formatar o código do cliente respeitando a digitação exata (pontos, sufixos, etc.)
 */
function formatarCodigoTim(codigo) {
  return codigo ? String(codigo).trim() : "";
}

function processarVendasHorizontal(dadosVendas, vendasJaProcessadas, origemStr) {
  let novasFaturas = [];
  
  const formatarCodigoTim = (codigo) => {
    return codigo ? String(codigo).trim() : "";
  };

  let contadores = { semAK: 0, semCodigoLinha: 0, reneg: 0, eSim: 0, duplicada: 0 };
  let totalLinhasAnalisadas = dadosVendas.length - 1;

  for (let i = 1; i < dadosVendas.length; i++) {
    const venda = dadosVendas[i];
    
    const dataVencBase = venda[0];
    const dataPrimeiroCad = venda[1];
    const cpfCnpj = venda[2];
    const nomeCliente = venda[3];
    const modalidade = venda[4];
    const plano = venda[5];
    const linhaTel = venda[6];
    const nomeResponsavel = venda[19];
    const email = venda[20];
    const contatoFinanceiro = venda[21];
    const codigoCliente = venda[31];
    const dataAtivacao = venda[36];

    // 🔥 DIAGNÓSTICO: mostra as primeiras 5 modalidades para verificar
    if (i <= 5) {
      Logger.log(`   🔍 Linha ${i}: Modalidade = "${modalidade}"`);
    }

    // 1. Trava: Sem data de ativação
    if (!dataAtivacao || String(dataAtivacao).trim() === "") {
      contadores.semAK++;
      continue;
    }
    
    // 2. Trava: Sem código ou linha
    if (!codigoCliente || !linhaTel) {
      contadores.semCodigoLinha++;
      continue;
    }
    
    // 3. 🔥 TRAVA: RENEGOCIAÇÃO (verifica se contém "RENEG" em maiúsculas)
    const modalidadeUpper = modalidade ? String(modalidade).toUpperCase().trim() : "";
    if (modalidadeUpper.includes("RENEG")) {
      contadores.reneg++;
      Logger.log(`   🚫 RENEG ignorada: "${modalidadeUpper}" - Cliente: ${nomeCliente}`);
      continue;
    }

    // 4. Trava: E-SIM
    const planoUpper = plano ? String(plano).toUpperCase().trim() : "";
    if (planoUpper === "TROCA DE TECNOLOGIA E-SIM") {
      contadores.eSim++;
      continue;
    }

    // 5. Trava: Duplicidade
    const chaveUnica = String(codigoCliente).trim() + "_" + String(linhaTel).trim();
    if (vendasJaProcessadas.has(chaveUnica)) {
      contadores.duplicada++;
      continue;
    }
    
    // LÓGICA DE DATAS (dia de vencimento)
    let diaEscolhido = 20;
    if (dataVencBase instanceof Date && !isNaN(dataVencBase)) {
      diaEscolhido = dataVencBase.getDate();
    } else if (!isNaN(parseInt(dataVencBase))) {
      diaEscolhido = parseInt(dataVencBase);
    }
    
    let dtAtivacaoObj = new Date(dataAtivacao);
    if (isNaN(dtAtivacaoObj.getTime())) {
      contadores.semAK++;
      continue;
    }
    
    let dataPrimeiraFatura = new Date(dtAtivacaoObj.getFullYear(), dtAtivacaoObj.getMonth(), diaEscolhido);
    if (dataPrimeiraFatura <= dtAtivacaoObj) dataPrimeiraFatura.setMonth(dataPrimeiraFatura.getMonth() + 1);
    
    let diffTempo = dataPrimeiraFatura.getTime() - dtAtivacaoObj.getTime();
    let diffDias = Math.floor(diffTempo / (1000 * 3600 * 24));
    if (diffDias < 10) dataPrimeiraFatura.setMonth(dataPrimeiraFatura.getMonth() + 1);

    const codigoFormatado = formatarCodigoTim(codigoCliente);

    // 🔥 AJUSTE AQUI: coluna J (índice 9) passa a ser dataAtivacao (em vez de dataPrimeiroCad)
    let linhaCliente = [
      codigoFormatado,      // 0: CÓDIGO CLIENTE
      nomeCliente,          // 1: NOME CLIENTE
      nomeResponsavel,      // 2: RESPONSÁVEL
      cpfCnpj,              // 3: CPF/CNPJ
      plano,                // 4: PLANO
      linhaTel,             // 5: LINHA
      origemStr,            // 6: ORIGEM
      contatoFinanceiro,    // 7: CONTATO FINANCEIRO
      email,                // 8: E-MAIL
      dataAtivacao          // 🔥 9: DATA DE ATIVAÇÃO (AK) - substitui dataPrimeiroCad
    ];

    for (let mes = 1; mes <= 24; mes++) {
      let dataVencimentoMes = new Date(dataPrimeiraFatura.getFullYear(), dataPrimeiraFatura.getMonth() + (mes - 1), diaEscolhido);
      linhaCliente.push(dataVencimentoMes);
      linhaCliente.push("PENDENTE");
    }
    
    novasFaturas.push(linhaCliente);
    vendasJaProcessadas.add(chaveUnica);
  }
  
  Logger.log(`  -> RESULTADO ${origemStr}: Analisadas ${totalLinhasAnalisadas} linhas.`);
  Logger.log(`     Aprovadas: ${novasFaturas.length}`);
  Logger.log(`     Recusadas -> Sem AK: ${contadores.semAK} | Sem Cod/Linha: ${contadores.semCodigoLinha} | RENEG: ${contadores.reneg} | E-SIM: ${contadores.eSim} | Duplicadas: ${contadores.duplicada}`);
  
  return novasFaturas;
}