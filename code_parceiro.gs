/**
 * VEXO HUB - Módulo de Parceiros (PE)
 * Funções exclusivas para o ecossistema de terceiros
 */

// 1. SALVAR VENDA DO PARCEIRO (Versão Multi-tenant Escalável)
function p_salvarVenda(dados) {
  try {
    const ID_CENTRAL = "1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4";
    const ssCentral = SpreadsheetApp.openById(ID_CENTRAL);
    
    // 1. O que o frontend está realmente a enviar?
    const nomeRecebido = String(dados.matriculaUsuario || dados.parceiroNome || "VAZIO").trim().toLowerCase();
    
    // 2. Busca Flexível na aba USERS
    const sheetUsers = ssCentral.getSheetByName("USERS");
    const ultimaLinha = sheetUsers.getLastRow();
    const dataUsers = sheetUsers.getRange(1, 1, ultimaLinha, 10).getValues();
    
    let dbPersonalizadoId = "";
    let acheiUsuario = false;
    
    for (let i = 1; i < dataUsers.length; i++) {
      // Junta as colunas A, B, C, D e E numa única linha de texto para procurar de forma ampla
      let textoDaLinha = String(dataUsers[i].slice(0, 5).join(" ")).toLowerCase();
      
      // Se o que recebemos do frontend estiver algures no meio desta linha do utilizador...
      if (nomeRecebido !== "vazio" && textoDaLinha.includes(nomeRecebido)) {
        acheiUsuario = true;
        dbPersonalizadoId = String(dataUsers[i][9] || "").trim(); // COLUNA J (Índice 9)
        break;
      }
    }
    
    // 3. ROTEAMENTO COM MENSAGEM DE RAIO-X
    let ssDestino;
    let mensagemStatus = "";
    
    if (acheiUsuario && dbPersonalizadoId.length > 20) {
      ssDestino = SpreadsheetApp.openById(dbPersonalizadoId);
      mensagemStatus = `SUCESSO! Venda roteada para o banco do parceiro.`;
    } else {
      ssDestino = ssCentral;
      // ESTA MENSAGEM É A CHAVE PARA DESCOBRIR O ERRO:
      mensagemStatus = `ERRO DE ROTA: Salvo na Central. Procurei por '${nomeRecebido}', Encontrado: ${acheiUsuario}, ID Coluna J: '${dbPersonalizadoId}'`;
    }
    
    // 4. Cria a aba e grava os dados
    let sheet = ssDestino.getSheetByName("VENDAS");
    if (!sheet) sheet = ssDestino.insertSheet("VENDAS");
    
    if (dados.listaLinhas && dados.listaLinhas.length > 0) {
      dados.listaLinhas.forEach(linha => {
        const novaLinha = [
          dados.dataVenc || "", new Date(), dados.cnpj || "", dados.razaoSocial || "", 
          dados.modalidade || "", linha.plano || "", linha.numero || "", linha.valor || "", 
          linha.operadora || "", dados.consultorVendeu || "", dados.parceiroNome || "",
          dados.cep || "", dados.endereco || "", dados.numero || "", dados.compl || "", 
          dados.bairro || "", dados.cidade || "", dados.uf || "", dados.cpfAdmin || "", 
          dados.nomeAdmin || "", dados.email || "", dados.contatoFinanceiro || "",
          "", "", "PENDENTE DE INPUT", "", "", "", "", "", "", "", "", "",
          dados.inscricaoEstadual || "", dados.obs || "", dados.parceiroNome || ""
        ];
        sheet.appendRow(novaLinha);
      });
    } else {
      sheet.appendRow([new Date(), dados.cnpj, dados.razaoSocial, "PENDENTE DE INPUT"]);
    }
    
    return { success: true, msg: mensagemStatus };
    
  } catch (error) {
    return { success: false, msg: "Erro grave: " + error.message };
  }
}

// 2. BUSCAR FINANCEIRO DO PARCEIRO
function p_buscarFinanceiro(idParceiro) {
  const ss = getDb('PARCEIRO');
  const sheet = ss.getSheetByName("FINANCEIRO");
  const data = sheet.getDataRange().getValues();
  
  // Filtra apenas o que pertence a este parceiro específico
  return data.filter(row => row[1] === idParceiro);
}

// 3. BUSCAR ESTOQUE DISPONÍVEL
function p_buscarEstoque() {
  const ss = getDb('PARCEIRO');
  const sheet = ss.getSheetByName("ESTOQUE");
  return sheet.getDataRange().getValues();
}
/**
 * Salva venda vinda do sistema de parceiros (HUB PE)
 * ORDEM DAS COLUNAS IGUAL AO VEXO PRÓPRIO
 * Coluna AK (índice 36) = Nome do Parceiro que lançou a venda
 */
function p_salvarVendaTIM(dados) {
  try {
    // 1. Configuração do Banco de Dados
    const PLANILHA_CENTRAL_PARCEIROS = "1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4";
    let bancoId = dados.bancoDeDadosId ? String(dados.bancoDeDadosId).trim() : null;
    if (bancoId === "null" || bancoId === "") bancoId = null;
    
    let ss;
    try {
      ss = bancoId ? SpreadsheetApp.openById(bancoId) : SpreadsheetApp.openById(PLANILHA_CENTRAL_PARCEIROS);
    } catch (e) {
      return { success: false, message: `❌ Erro ao acessar a planilha: ${e.message}` };
    }
 
    // 2. Obtém ou cria a aba VENDAS
    let sheet = ss.getSheetByName("VENDAS");
    if (!sheet) {
      sheet = ss.insertSheet("VENDAS");
      const cabecalho = [
        "DIA VENC.", "DATA VENDA", "CNPJ", "RAZÃO SOCIAL", "MODALIDADE", "PLANO",
        "NÚMERO DA LINHA", "VALOR CONTRATADO", "OPERADORA DOADORA",
        "CONSULTOR (NOME COMPLETO)", "CONSULTOR DO INPUT",
        "CEP", "ENDEREÇO", "Nº", "COMPL.", "BAIRRO", "CIDADE", "UF",
        "CPF ADMINISTRADOR", "NOME ADMINISTRADOR", "EMAIL", "CONTATO FINANCEIRO",
        "PEDIDO RADAR", "PEDIDO P2B", "STATUS DO PEDIDO",
        "ATIVAÇÃO EM SISTEMA TIM", "M0", "M1", "M2", "M6", "M13",
        "CÓDIGO DO CLIENTE", "ADMINISTRADOR (LOGIN)", "SENHA MEU TIM",
        "INSCRIÇÃO ESTADUAL", "OBSERVAÇÕES", "DATA ATIVAÇÃO RADAR (BACKOFFICE)", "NOME DO PARCEIRO"
      ];
      sheet.appendRow(cabecalho);
      sheet.getRange("1:1").setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }
 
    const listaParaGravar = (dados.listaLinhas && dados.listaLinhas.length > 0) ? dados.listaLinhas : [];
    if (listaParaGravar.length === 0) return { success: false, message: "❌ Nenhuma linha encontrada." };
 
    // Limpeza do CNPJ: apenas números e garantindo 14 dígitos com zero à esquerda
    const cnpjLimpo = dados.cnpj ? String(dados.cnpj).replace(/\D/g, "").padStart(14, "0") : "";
 
    const dataAtual = new Date();
    const dataVencimento = dados.dataVenc || "05";
 
    let linhasGravadas = 0;
    
    // 3. Processamento das linhas
    listaParaGravar.forEach(function(item, index) {
      let modItem = item.modalidade || "PRIMEIRA ATIVAÇÃO";
      if (modItem === "RENEGOCIAÇÃO") modItem = "RENEG.";
 
      const numeroLinha = item.numeroLinha ? item.numeroLinha.replace(/\D/g, "") : "";
      const valorNumerico = Number(item.valor) || 0;
 
      const novaLinha = [
        dataVencimento,                    // A
        dataAtual,                         // B
        cnpjLimpo,                         // C (CNPJ formatado como texto)
        dados.razaoSocial || "",           // D
        modItem,                           // E
        item.plano || "",                  // F
        numeroLinha,                       // G
        valorNumerico,                     // H
        item.operadoraDoadora || "",       // I
        dados.consultorVendeu || "",       // J
        "",                                // K
        dados.cep || "",                   // L (CEP inserido aqui)
        dados.endereco || "",              // M
        dados.numero || "",                // N
        dados.compl || "",                 // O
        dados.bairro || "",                // P
        dados.cidade || "",                // Q
        dados.uf || "",                    // R
        dados.cpfAdmin || "",              // S
        dados.nomeAdmin || "",             // T
        dados.email || "",                 // U
        dados.contatoFinanceiro || "",     // V
        "", "", "PENDENTE DE INPUT", "",   // W, X, Y, Z
        "", "", "", "", "",                // AA a AE
        "", "", "",                        // AF, AG, AH
        dados.inscricaoEstadual || "",     // AI
        dados.obs || "",                   // AJ
        "",                                // AK (Reserva Backoffice)
        dados.parceiroNome || ""           // AL (Nome Parceiro)
      ];
 
      sheet.appendRow(novaLinha);
      
      const ultimaLinha = sheet.getLastRow();
      
      // Formatações específicas para garantir integridade dos dados
      sheet.getRange(ultimaLinha, 3).setNumberFormat("@");             // C: CNPJ como Texto
      sheet.getRange(ultimaLinha, 12).setNumberFormat("@");            // L: CEP como Texto
      sheet.getRange(ultimaLinha, 2).setNumberFormat('dd/MM/yyyy HH:mm');
      sheet.getRange(ultimaLinha, 8).setNumberFormat('R$ #,##0.00');
      
      linhasGravadas++;
    });
 
    SpreadsheetApp.flush();
    return { success: true, message: `✅ Proposta registrada! ${linhasGravadas} linha(s) processadas.` };
 
  } catch (e) {
    return { success: false, message: `❌ Erro crítico: ${e.message}` };
  }
}
 
/**
 * 🔧 FUNÇÃO AUXILIAR - Validar se banco do parceiro está acessível
 * Use isso para testar se a configuração do parceiro está correta
 */
function testarAcessoBancoParceiro(bancoDeDadosId) {
  try {
    if (!bancoDeDadosId || bancoDeDadosId === "null") {
      return { 
        success: false, 
        message: "ID do banco não fornecido ou inválido"
      };
    }
    
    const ss = SpreadsheetApp.openById(bancoDeDadosId);
    const vendas = ss.getSheetByName("VENDAS");
    
    return {
      success: true,
      message: `✅ Banco acessível! Aba VENDAS existe.`,
      planilhaId: ss.getId(),
      totalLinhas: vendas ? vendas.getLastRow() : 0
    };
  } catch (e) {
    return {
      success: false,
      message: `❌ Erro ao acessar o banco: ${e.message}`,
      erro: e.message
    };
  }
}

/**
 * Busca a lista de planos e valores da planilha central VEXO
 * Localizada na aba "PLANOS"
 */
function p_buscarPlanos() {
  try {
    const spreadsheetId = "1ULyXmZjrHlTXJ7cl0jlL_ugriHzZ4W8Q-6ExvkPm6qg";
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName("PLANOS");
    
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    // Remove o cabeçalho e mapeia os dados
    const planos = data.slice(1).map(linha => {
      return {
        nome: linha[0],
        valor: linha[1]
      };
    }).filter(p => p.nome !== ""); // Remove linhas vazias

    return planos;
  } catch (e) {
    console.error("Erro ao buscar planos: " + e.message);
    return [];
  }
}

/**
 * Retorna a URL do Web App para redirecionamento no logout
 */
function getScriptURL() {
  return ScriptApp.getService().getUrl();
}
/**
 * Busca dados reais da planilha para alimentar os cards do Dashboard do Parceiro
 * Local: code_parceiros.gs
 */
function p_buscarKPIDashboard() {
  try {
    // 1. Recupera o usuário logado
    const usuario = JSON.parse(PropertiesService.getScriptProperties().getProperty('usuario_logado') || '{}');
    const nomeParceiro = String(usuario.username || "").trim().toLowerCase();

    // 2. Obtém a aba VENDAS correta (planilha do parceiro ou fallback)
    const sheet = getSheetVendasUsuario(usuario);
    if (!sheet) {
      return { faturamentoMensal: 0, comissaoPrevista: 0, ativacoes: 0, metaPercent: 0, faltaMeta: 10000 };
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      // Sem dados além do cabeçalho
      return { faturamentoMensal: 0, comissaoPrevista: 0, ativacoes: 0, metaPercent: 0, faltaMeta: 10000 };
    }

    let stats = {
      faturamentoMensal: 0,
      comissaoPrevista: 0,
      ativacoes: 0,
      metaPercent: 0,
      faltaMeta: 0
    };

    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    // 3. Itera sobre as vendas (pula o cabeçalho – i = 1)
    for (let i = 1; i < data.length; i++) {
      const linha = data[i];
      
      // --- DATA DA VENDA (COLUNA B – ÍNDICE 1) ---
      let dataVenda = linha[1];
      if (!(dataVenda instanceof Date)) {
        dataVenda = new Date(dataVenda);
      }
      if (isNaN(dataVenda.getTime())) continue; // pula se data inválida
      
      // --- NOME DO PARCEIRO (COLUNA AK – ÍNDICE 36) ---
      const parceiroPlanilha = String(linha[36] || "").trim().toLowerCase();
      
      // --- VALOR (COLUNA H – ÍNDICE 7) ---
      const valorVenda = parseFloat(linha[7]) || 0;
      
      // --- STATUS (COLUNA Y – ÍNDICE 24) ---
      const status = String(linha[24] || "").trim().toUpperCase();

      // FILTRO: mesmo parceiro, data válida, mês e ano atuais
      if (parceiroPlanilha === nomeParceiro &&
          dataVenda.getMonth() === mesAtual && 
          dataVenda.getFullYear() === anoAtual) {
        
        stats.faturamentoMensal += valorVenda;
        
        // Contabiliza ativações (status ATIVADO ou ATIVADA)
        if (status === "ATIVADO" || status === "ATIVADA") {
          stats.ativacoes++;
        }
      }
    }

    // --- REGRAS DE NEGÓCIO ---
    const META_OBJETIVO = 10000; // Ajuste conforme sua meta
    stats.comissaoPrevista = stats.faturamentoMensal * 0.10;
    stats.metaPercent = Math.min((stats.faturamentoMensal / META_OBJETIVO) * 100, 100);
    stats.faltaMeta = Math.max(META_OBJETIVO - stats.faturamentoMensal, 0);

    return stats;

  } catch (e) {
    Logger.log("Erro no Dashboard: " + e.message);
    return { faturamentoMensal: 0, comissaoPrevista: 0, ativacoes: 0, metaPercent: 0, faltaMeta: 10000 };
  }
}

/**
 * Salva um novo comunicado postado pela E&E
 */
function p_salvarComunicado(dados) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("COMUNICADOS");
    
    // Cria a aba se não existir
    if (!sheet) {
      sheet = ss.insertSheet("COMUNICADOS");
      sheet.appendRow(["DATA", "AUTOR", "CATEGORIA", "TITULO", "CONTEUDO"]);
      sheet.getRange("1:1").setFontWeight("bold").setBackground("#f1f5f9");
    }

    const dataHoje = new Date();
    sheet.appendRow([
      dataHoje,
      dados.autor,
      dados.categoria,
      dados.titulo,
      dados.conteudo
    ]);
    
    return true;
  } catch (e) {
    throw new Error("Erro ao postar: " + e.message);
  }
}

/**
 * Busca todos os comunicados para o feed
 */
function p_listarComunicados() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("COMUNICADOS");
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    const posts = [];

    // Pega do mais novo para o mais antigo (Inverte a ordem)
    for (let i = data.length - 1; i >= 1; i--) {
      posts.push({
        data: Utilities.formatDate(new Date(data[i][0]), "GMT-3", "dd/MM/yyyy HH:mm"),
        autor: data[i][1],
        categoria: data[i][2],
        titulo: data[i][3],
        conteudo: data[i][4]
      });
    }
    return posts;
  } catch (e) {
    return [];
  }
}

/**
 * Salva uma nova solicitação de credenciamento
 */
function p_salvarCredenciamento(dados) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('CREDENCIAMENTO');
  
  // Se a aba não existir, cria e define o cabeçalho atualizado
  if (!sheet) {
    sheet = ss.insertSheet('CREDENCIAMENTO');
    sheet.appendRow(['ID', 'DATA', 'STATUS', 'TIPO', 'NOME', 'DOCUMENTO', 'WHATSAPP', 'EMAIL', 'CIDADE', 'LOGIN_GERADO']);
    sheet.getRange("1:1").setFontWeight("bold").setBackground("#f1f5f9");
  }

  const id = "CRED-" + new Date().getTime();
  const data = new Date();
  
  // 🟢 IMPORTANTE: A ordem aqui deve seguir exatamente a ordem das colunas da planilha
  sheet.appendRow([
    id,              // ID
    data,            // DATA
    'PENDENTE',      // STATUS
    dados.tipo,      // TIPO
    dados.nome,      // NOME
    dados.documento, // DOCUMENTO
    dados.whatsapp,  // WHATSAPP
    dados.email,     // 🟢 EMAIL (Campo adicionado agora)
    dados.cidade,    // CIDADE
    ''               // LOGIN_GERADO (Vazio até a aprovação)
  ]);
  
  return true;
}

/**
 * Aprova o parceiro e já cria o acesso na aba USERS
 */
function p_aprovarParceiroFinal(dados) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetUsers = ss.getSheetByName('USERS');
  const sheetCred = ss.getSheetByName('CREDENCIAMENTO');
  
  // 1. Adiciona na aba USERS para liberar o login
  // Formato da aba USERS: [ID, NOME, LOGIN, SENHA, ROLE, STATUS, ...]
  sheetUsers.appendRow([
    "USR-" + new Date().getTime(),
    dados.nome,
    dados.login,
    dados.senha,
    dados.role,
    'ATIVO',
    new Date()
  ]);
  
  // 2. Atualiza o status na aba CREDENCIAMENTO
  const dataCred = sheetCred.getDataRange().getValues();
  for (let i = 1; i < dataCred.length; i++) {
    if (dataCred[i][5] === dados.documento) { // Busca pelo CPF/CNPJ
      sheetCred.getRange(i + 1, 3).setValue('APROVADO');
      sheetCred.getRange(i + 1, 9).setValue(dados.login);
      break;
    }
  }
  
  return true;
}

/**
 * Envia e-mail de Boas-vindas com o Termo de Credenciamento
 */
function p_enviarEmailBoasVindas(dados) {
  const corpoEmail = `
    <div style="font-family: 'Poppins', sans-serif; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 15px; overflow: hidden;">
      <div style="background: #3b82f6; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Bem-vindo à E&E Nordeste!</h1>
      </div>
      <div style="padding: 30px;">
        <p>Olá, <strong>${dados.nome}</strong>,</p>
        <p>É um prazer ter você como nosso parceiro oficial. Seu credenciamento foi <strong>APROVADO</strong> com sucesso.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #64748b;">Suas credenciais de acesso:</p>
          <p style="margin: 10px 0 0 0;"><strong>Link:</strong> <a href="SEU_LINK_DO_SISTEMA">Acessar VEXO HUB</a></p>
          <p style="margin: 5px 0 0 0;"><strong>Usuário:</strong> ${dados.login}</p>
          <p style="margin: 5px 0 0 0;"><strong>Senha:</strong> ${dados.senha}</p>
        </div>

        <p style="font-size: 13px; color: #64748b;">Em anexo, você encontrará o seu Termo de Credenciamento assinado digitalmente.</p>
        <p>Vamos juntos alcançar grandes resultados!</p>
      </div>
      <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
        E&E Nordeste Soluções Digitais LTDA - Garanhuns, PE
      </div>
    </div>
  `;

  // Aqui você pode gerar um PDF se desejar, mas para iniciar, vamos enviar o texto
  MailApp.sendEmail({
    to: dados.email || "ewerton@exemplo.com", // Ideal capturar o e-mail no form
    subject: "✅ Bem-vindo à E&E Nordeste - Seu acesso e termo de parceria",
    htmlBody: corpoEmail
  });
}

/**
 * Lista todos os credenciamentos PENDENTES para gestão Master
 * Local: code_gestao.gs
 */
function p_listarInscritos() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    // Garante que pega a aba correta, se não existir, o front lidará com o array vazio
    const sheet = ss.getSheetByName("CREDENCIAMENTO");
    
    // Fallback de segurança: se a aba não existir, retorna array vazio imediatamente
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    const inscritos = [];

    // Formatação de data (GMT-3 p/ Pernambuco)
    const timezone = Session.getScriptTimeZone();
    
    // Itera pulando o cabeçalho (i = 1)
    for (let i = 1; i < data.length; i++) {
      const linha = data[i];
      const status = String(linha[2] || "").trim().toUpperCase(); // Coluna STATUS

      // FILTRO: Só queremos os que estão pendentes de aprovação
      if (status === "PENDENTE") {
        inscritos.push({
          id: linha[0],           // ID (Coluna A)
          // Normaliza a data para string formatada
          data: linha[1] instanceof Date ? Utilities.formatDate(linha[1], timezone, "dd/MM/yyyy HH:mm") : String(linha[1]), // DATA (Coluna B)
          status: status,         // STATUS (Coluna C)
          tipo: linha[3],         // TIPO (PF/PJ) (Coluna D)
          nome: linha[4],         // NOME (Coluna E)
          documento: linha[5],    // DOCUMENTO (Coluna F)
          whatsapp: linha[6],     // WHATSAPP (Coluna G)
          email: linha[7],        // 🟢 EMAIL (Coluna H) - Novo campo capturado
          cidade: linha[8]        // 🟢 CIDADE/UF (Coluna I) - Índice ajustado para 8
        });
      }
    }
    
    // Retorna os dados para o front-end
    return inscritos;

  } catch (e) {
    // Registra erro no console do Apps Script p/ depuração
    Logger.log("Erro ao listar inscritos: " + e.message);
    // Retorna vazio para o front não travar no loader
    return [];
  }
}

/**
 * Envia o e-mail de Boas-vindas e solicitação de documentos (Checklist)
 */
function p_enviarEmailChecklist(dados) {
  const linkFormulario = "https://forms.gle/UD5ubkXyzv8EiNSJ7";

  const corpoEmail = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      
      <div style="background: linear-gradient(135deg, #1e293b 0%, #3b82f6 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: 1px;">E&E NORDESTE</h1>
        <p style="color: rgba(255,255,255,0.8); margin-top: 10px; font-size: 14px;">Expandindo horizontes com tecnologia e conexão</p>
      </div>

      <div style="padding: 40px 30px; background: white;">
        <h2 style="color: #1e293b; font-size: 20px;">Olá, ${dados.nome}! 👋</h2>
        <p style="line-height: 1.6; color: #475569;">Ficamos muito felizes com o seu interesse em se tornar um parceiro da <b>E&E Nordeste</b>. Analisamos sua solicitação inicial e agora estamos prontos para avançar para a etapa de formalização.</p>
        
        <div style="margin: 30px 0; padding: 25px; background: #f8fafc; border-radius: 12px; border-left: 4px solid #3b82f6;">
          <h3 style="margin-top: 0; font-size: 16px; color: #1e293b;">📋 Checklist de Documentação</h3>
          <p style="font-size: 13px; color: #64748b; margin-bottom: 20px;">Para darmos continuidade ao processo de credenciamento, clique no botão abaixo e anexe os seguintes documentos no formulário oficial:</p>
          
          <ul style="list-style: none; padding: 0; margin: 0 0 25px 0;">
            <li style="margin-bottom: 12px; display: flex; align-items: center;">
              <span style="color: #3b82f6; margin-right: 10px;">✔</span> Cartão CNPJ Atualizado
            </li>
            <li style="margin-bottom: 12px; display: flex; align-items: center;">
              <span style="color: #3b82f6; margin-right: 10px;">✔</span> Contrato Social ou Requerimento de Empresário
            </li>
            <li style="margin-bottom: 12px; display: flex; align-items: center;">
              <span style="color: #3b82f6; margin-right: 10px;">✔</span> Dados Bancários (Extrato da conta)
            </li>
            <li style="margin-bottom: 12px; display: flex; align-items: center;">
              <span style="color: #3b82f6; margin-right: 10px;">✔</span> RG e CPF dos Sócios (ou CNH)
            </li>
            <li style="margin-bottom: 12px; display: flex; align-items: center;">
              <span style="color: #3b82f6; margin-right: 10px;">✔</span> Comprovante de Residência da Empresa
            </li>
          </ul>

          <div style="text-align: center; margin-top: 10px;">
            <a href="${linkFormulario}" target="_blank" style="background-color: #3b82f6; color: white; padding: 15px 25px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
              ENVIAR DOCUMENTAÇÃO AGORA
            </a>
          </div>
        </div>

        <p style="line-height: 1.6; color: #475569;">Assim que você realizar o upload pelo link acima, nosso setor jurídico validará seu cadastro e você receberá suas credenciais de acesso exclusivas.</p>
        
        <p style="margin-top: 30px; font-weight: bold; color: #1e293b;">Vamos juntos construir uma operação espetacular!</p>
      </div>

      <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
        Este é um e-mail automático enviado pelo sistema VEXO HUB.<br>
        <b>E&E Nordeste Soluções Digitais LTDA</b><br>
        Garanhuns - Pernambuco
      </div>
    </div>
  `;

  MailApp.sendEmail({
    to: dados.email,
    subject: "🚀 Falta pouco! Documentação para Parceria E&E Nordeste",
    htmlBody: corpoEmail
  });
}

function p_finalizarTudoComTermo(dados) {
  try {
    // 1. Acessa a planilha de usuários correta
    const ssUsers = SpreadsheetApp.openById("1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4");
    const sheetUsers = ssUsers.getSheetByName("USERS");
    
    // 2. Localiza ou cria a pasta para armazenar os arquivos
    const folderName = "VEXO_SISTEMA_ARQUIVOS";
    let folder = DriveApp.getFoldersByName(folderName).hasNext() ? 
                 DriveApp.getFoldersByName(folderName).next() : 
                 DriveApp.createFolder(folderName);
    
    // 3. Salva o Termo Assinado (PDF)
    const blobTermo = Utilities.newBlob(Utilities.base64Decode(dados.termo.data), 'application/pdf', `Termo_${dados.nome}_${dados.matricula}.pdf`);
    const arquivoTermo = folder.createFile(blobTermo);

    // 4. SALVA A LOGOMARCA E GERA O LINK QUE VOCÊ VALIDOU
    let urlLogoDirect = "";
    if (dados.logo && dados.logo.data) {
      const blobLogo = Utilities.newBlob(Utilities.base64Decode(dados.logo.data), dados.logo.type, `Logo_${dados.nome}_${dados.matricula}`);
      const arquivoLogo = folder.createFile(blobLogo);
      
      // Essencial: Torna o arquivo público para que o link de imagem funcione no portal
      arquivoLogo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      const fileId = arquivoLogo.getId();
      
      // 🟢 FORMATO VALIDADO POR VOCÊ:
      // Montamos o link de perfil usando o ID do arquivo salvo no seu Drive
      urlLogoDirect = "http://googleusercontent.com/profile/picture/" + fileId;
    }

    // 5. Registra o novo usuário na aba USERS (Colunas A até I)
    sheetUsers.appendRow([
      dados.matricula,      // Coluna A
      dados.senha,          // Coluna B
      dados.nome,           // Coluna C
      "",                   // Coluna D (Sobrenome)
      dados.email,          // Coluna E (Login)
      dados.role,           // Coluna F (PARCEIRO ou MASTER)
      "ATIVO",              // Coluna G
      "PARCEIRO MASTER",    // Coluna H
      urlLogoDirect         // Coluna I (Link validado para exibição instantânea)
    ]);

    // 6. Envia o e-mail de Boas-vindas espetacular
    const corpoEmail = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">Seja Bem-vindo(a) ao VEXO HUB!</h1>
          <p style="opacity: 0.9; margin-top: 10px;">Sua parceria com a E&E Nordeste está oficialmente ativa.</p>
        </div>
        <div style="padding: 30px; background: white;">
          <p>Olá, <b>${dados.nome}</b>,</p>
          <p>É com grande satisfação que concluímos seu credenciamento. A partir de agora, você tem acesso à nossa plataforma exclusiva para parceiros.</p>
          
          <div style="background: #f0fdf4; padding: 25px; border-radius: 12px; border: 1px solid #bbf7d0; margin: 25px 0;">
            <h3 style="margin-top: 0; color: #166534; font-size: 16px;">🚀 Suas Credenciais de Acesso:</h3>
            <p style="margin: 10px 0; font-size: 15px;"><b>Login:</b> <span style="color: #059669;">${dados.email}</span></p>
            <p style="margin: 10px 0; font-size: 15px;"><b>Senha Provisória:</b> <span style="color: #059669; font-family: monospace; font-weight: bold; background: #dcfce7; padding: 2px 6px; border-radius: 4px;">${dados.senha}</span></p>
            <hr style="border: 0; border-top: 1px solid #bbf7d0; margin: 15px 0;">
            <p style="margin: 0; font-size: 12px; color: #166534;"><b>Matrícula:</b> ${dados.matricula}</p>
          </div>

          <p style="color: #475569; font-size: 14px;">Anexamos a este e-mail o seu <b>Termo de Credenciamento</b> assinado para sua segurança e arquivo.</p>
          <p style="margin-top: 30px; font-weight: bold; color: #1e293b;">Bons negócios e vamos juntos construir uma operação de sucesso!</p>
        </div>
        <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
          <b>E&E Nordeste Soluções Digitais LTDA</b><br>
          Garanhuns - Pernambuco | Sistema VEXO HUB
        </div>
      </div>
    `;

    MailApp.sendEmail({
      to: dados.email,
      subject: "🎉 Credenciamento Concluído - Bem-vindo à E&E Nordeste",
      htmlBody: corpoEmail,
      attachments: [arquivoTermo.getAs(MimeType.PDF)]
    });

    return true;

  } catch (e) {
    Logger.log("Erro no processamento final: " + e.message);
    throw new Error("Erro ao finalizar credenciamento: " + e.message);
  }
}

// ============================================
// MÓDULO DE SUPORTE TÉCNICO - VEXO HUB
// Sistema completo de tickets para parceiros
// ============================================

/**
 * Cria um novo ticket de suporte
 * @param {Object} dados - Dados do ticket
 * @returns {Object} Resultado da operação
 */
function p_criarTicket(dados) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("TICKETS_SUPORTE");
    
    // Criar aba se não existir
    if (!sheet) {
      sheet = ss.insertSheet("TICKETS_SUPORTE");
      const cabecalho = [
        "ID_TICKET", "DATA_CRIACAO", "PARCEIRO_ID", "PARCEIRO_NOME",
        "TITULO", "DESCRICAO", "PRIORIDADE", "CATEGORIA", "CLIENTE_RELACIONADO",
        "STATUS", "DATA_ULTIMA_ATUALIZACAO", "DATA_RESOLUCAO", "SLA_EXPIRACAO",
        "ANEXOS", "RESPOSTAS", "AVALIACAO_NOTA", "AVALIACAO_COMENTARIO"
      ];
      sheet.appendRow(cabecalho);
      sheet.getRange("A1:Q1").setFontWeight("bold").setBackground("#0f172a").setFontColor("white");
      sheet.setFrozenRows(1);
    }
    
    // Gerar ID único do ticket
    const ultimaLinha = sheet.getLastRow();
    let novoId = 1;
    if (ultimaLinha > 1) {
      const ultimoId = sheet.getRange(ultimaLinha, 1).getValue();
      const num = String(ultimoId).replace(/\D/g, '');
      novoId = (parseInt(num) || 0) + 1;
    }
    const idTicket = "TKT-" + String(novoId).padStart(5, '0');
    
    // Calcular SLA baseado na prioridade (em horas)
    const slas = { baixa: 48, media: 24, alta: 6, urgente: 2 };
    const slaHoras = slas[dados.prioridade] || 24;
    const dataExpiracao = new Date();
    dataExpiracao.setHours(dataExpiracao.getHours() + slaHoras);
    
    const dataAtual = new Date();
    const respostasIniciais = [{
      autor_nome: dados.parceiro_nome,
      autor_tipo: "parceiro",
      mensagem: dados.descricao,
      data: Utilities.formatDate(dataAtual, "GMT-3", "dd/MM/yyyy HH:mm"),
      anexos: dados.anexos || []
    }];
    
    // Inserir na planilha
    sheet.appendRow([
      idTicket,                                    // A: ID_TICKET
      dataAtual,                                   // B: DATA_CRIACAO
      dados.parceiro_id,                          // C: PARCEIRO_ID
      dados.parceiro_nome,                        // D: PARCEIRO_NOME
      dados.titulo,                               // E: TITULO
      dados.descricao,                            // F: DESCRICAO
      dados.prioridade,                           // G: PRIORIDADE
      dados.categoria,                            // H: CATEGORIA
      dados.cliente || "",                        // I: CLIENTE_RELACIONADO
      "aberto",                                   // J: STATUS
      dataAtual,                                  // K: DATA_ULTIMA_ATUALIZACAO
      "",                                         // L: DATA_RESOLUCAO
      dataExpiracao,                              // M: SLA_EXPIRACAO
      JSON.stringify(dados.anexos || []),         // N: ANEXOS
      JSON.stringify(respostasIniciais),          // O: RESPOSTAS
      "",                                         // P: AVALIACAO_NOTA
      ""                                          // Q: AVALIACAO_COMENTARIO
    ]);
    
    // 🌟 ENVIAR NOTIFICAÇÃO PARA O TELEGRAM
    p_notificarNovoTicketTelegram(
      idTicket, 
      dados.titulo, 
      dados.prioridade, 
      dados.categoria, 
      dados.parceiro_nome
    );
    
    SpreadsheetApp.flush();
    
    return { 
      success: true, 
      id: idTicket,
      message: "Ticket criado com sucesso!"
    };
    
  } catch (e) {
    console.error("Erro em p_criarTicket:", e);
    return { success: false, message: e.toString() };
  }
}

/**
 * Lista todos os tickets de um parceiro específico ou todos se for MASTER
 * @param {string} usuarioId - ID do usuário logado (matrícula/email)
 * @param {string} cargoUsuario - Cargo do usuário (PARCEIRO ou MASTER)
 * @returns {Array} Lista de tickets
 */
function p_listarTickets(usuarioId, cargoUsuario) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("TICKETS_SUPORTE");
    
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    const tickets = [];
    const agora = new Date();
    
    // Verifica se o usuário é MASTER (pode ver todos os tickets)
    const isMaster = (cargoUsuario === "MASTER" || cargoUsuario === "ADMINISTRADOR");
    
    for (let i = 1; i < data.length; i++) {
      const linha = data[i];
      const idParceiroTicket = String(linha[2] || "").trim();
      
      // Se NÃO for MASTER, filtra apenas os tickets do próprio parceiro
      if (!isMaster && idParceiroTicket !== String(usuarioId).trim()) {
        continue;
      }
      
      // Calcula SLA restante
      let slaRestante = null;
      const status = linha[9];
      const dataExpiracao = linha[12];
      
      if (status !== "resolvido" && status !== "fechado" && dataExpiracao instanceof Date) {
        const diffMs = dataExpiracao - agora;
        slaRestante = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
      }
      
      // Calcula tempo médio de resposta (primeira resposta do suporte)
      let tempoResposta = null;
      let respostas = [];
      try {
        respostas = JSON.parse(linha[14] || "[]");
        const primeiraRespostaSuporte = respostas.find(r => r.autor_tipo === "suporte");
        if (primeiraRespostaSuporte && linha[1] instanceof Date) {
          const dataCriacao = new Date(linha[1]);
          const dataResposta = parseDataBR(primeiraRespostaSuporte.data);
          if (dataResposta) {
            tempoResposta = Math.round((dataResposta - dataCriacao) / (1000 * 60 * 60));
          }
        }
      } catch(e) {}
      
      tickets.push({
        id: linha[0],
        data_criacao: formatarDataBR(linha[1]),
        parceiro_nome: linha[3],
        parceiro_id: linha[2],
        titulo: linha[4],
        descricao: linha[5],
        prioridade: linha[6],
        categoria: linha[7],
        cliente: linha[8],
        status: linha[9],
        data_ultima_atualizacao: formatarDataBR(linha[10]),
        data_resolucao: formatarDataBR(linha[11]),
        sla_restante: slaRestante,
        anexos: JSON.parse(linha[13] || "[]"),
        respostas: JSON.parse(linha[14] || "[]"),
        avaliacao_nota: linha[15],
        tempo_resposta: tempoResposta
      });
    }
    
    // Ordenar por data (mais recentes primeiro) e prioridade
    tickets.sort((a, b) => {
      const prioridades = { urgente: 0, alta: 1, media: 2, baixa: 3 };
      const priorA = prioridades[a.prioridade] || 2;
      const priorB = prioridades[b.prioridade] || 2;
      if (priorA !== priorB) return priorA - priorB;
      return String(b.id).localeCompare(String(a.id));
    });
    
    return tickets;
    
  } catch (e) {
    console.error("Erro em p_listarTickets:", e);
    return [];
  }
}

/**
 * Adiciona uma resposta a um ticket
 * @param {Object} dados - Dados da resposta
 * @returns {Object} Resultado da operação
 */
function p_responderTicket(dados) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("TICKETS_SUPORTE");
    
    if (!sheet) return { success: false, message: "Aba não encontrada" };
    
    const data = sheet.getDataRange().getValues();
    let linhaEncontrada = -1;
    let ticketAtual = null;
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(dados.ticket_id)) {
        linhaEncontrada = i + 1;
        ticketAtual = data[i];
        break;
      }
    }
    
    if (linhaEncontrada === -1) {
      return { success: false, message: "Ticket não encontrado" };
    }
    
    // 🌟 BLOQUEAR RESPOSTA SE TICKET JÁ ESTIVER RESOLVIDO
    if (ticketAtual[9] === "resolvido" || ticketAtual[9] === "fechado") {
      return { success: false, message: "Ticket já resolvido. Não é possível adicionar mais respostas." };
    }
    
    // Carregar respostas existentes
    let respostas = [];
    try {
      respostas = JSON.parse(ticketAtual[14] || "[]");
    } catch(e) {}
    
    // Adicionar nova resposta
    const novaResposta = {
      autor_nome: dados.autor_nome,
      autor_tipo: dados.autor_tipo,
      mensagem: dados.mensagem,
      data: Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy HH:mm"),
      anexos: dados.anexo_url ? [dados.anexo_url] : []
    };
    respostas.push(novaResposta);
    
    // Atualizar status se necessário
    let novoStatus = ticketAtual[9];
    if (dados.autor_tipo === "parceiro" && (novoStatus === "resolvido" || novoStatus === "fechado")) {
      novoStatus = "em_andamento";
    }
    
    // Atualizar planilha
    sheet.getRange(linhaEncontrada, 11).setValue(new Date()); // DATA_ULTIMA_ATUALIZACAO
    sheet.getRange(linhaEncontrada, 10).setValue(novoStatus); // STATUS
    sheet.getRange(linhaEncontrada, 15).setValue(JSON.stringify(respostas)); // RESPOSTAS
    
    // Se o ticket estava resolvido e o parceiro respondeu, reabrir
    if (ticketAtual[9] === "resolvido" && dados.autor_tipo === "parceiro") {
      sheet.getRange(linhaEncontrada, 12).setValue(""); // Limpar DATA_RESOLUCAO
    }
    
    SpreadsheetApp.flush();
    
    // Enviar notificação para o Telegram
    if (dados.autor_tipo === "parceiro") {
      p_notificarRespostaTelegram(
        dados.ticket_id, 
        ticketAtual[4],
        dados.autor_nome, 
        dados.mensagem
      );
    }
    
    return { success: true, message: "Resposta adicionada com sucesso!" };
    
  } catch (e) {
    console.error("Erro em p_responderTicket:", e);
    return { success: false, message: e.toString() };
  }
}

/**
 * Upload de anexo para ticket
 * @param {string} base64Data - Arquivo em base64
 * @param {string} fileName - Nome do arquivo
 * @param {string} ticketId - ID do ticket
 * @returns {Object} URL do arquivo
 */
function p_uploadAnexoTicket(base64Data, fileName, ticketId) {
  try {
    const nomePastaPai = "VEXO_HUB";
    const nomeSubPasta = "TICKETS_ANEXOS";
    
    // Criar estrutura de pastas
    let pastaPai = DriveApp.getFoldersByName(nomePastaPai);
    let pastaApp = pastaPai.hasNext() ? pastaPai.next() : DriveApp.createFolder(nomePastaPai);
    
    let pastaAnexos = pastaApp.getFoldersByName(nomeSubPasta);
    let pastaDestino = pastaAnexos.hasNext() ? pastaAnexos.next() : pastaApp.createFolder(nomeSubPasta);
    
    // Criar subpasta do ticket
    let pastaTicket = pastaDestino.getFoldersByName(ticketId);
    let pastaFinal = pastaTicket.hasNext() ? pastaTicket.next() : pastaDestino.createFolder(ticketId);
    
    // Processar arquivo
    const partes = base64Data.split(',');
    const contentType = partes[0].substring(5, partes[0].indexOf(';'));
    const bytes = Utilities.base64Decode(partes[1]);
    
    const nomeFinal = `${Date.now()}_${fileName}`;
    const blob = Utilities.newBlob(bytes, contentType, nomeFinal);
    const arquivo = pastaFinal.createFile(blob);
    
    // Tornar público para visualização
    arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return { 
      success: true, 
      url: arquivo.getUrl(),
      fileName: nomeFinal
    };
    
  } catch (e) {
    console.error("Erro em p_uploadAnexoTicket:", e);
    return { success: false, message: e.toString() };
  }
}

/**
 * Avalia um atendimento
 * @param {string} ticketId - ID do ticket
 * @param {number} nota - Nota de 1 a 5
 * @param {string} comentario - Comentário opcional
 * @returns {Object} Resultado
 */
function p_avaliarAtendimento(ticketId, nota, comentario) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("TICKETS_SUPORTE");
    
    if (!sheet) return { success: false, message: "Aba não encontrada" };
    
    const data = sheet.getDataRange().getValues();
    let linhaEncontrada = -1;
    let dadosTicket = null;
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(ticketId)) {
        linhaEncontrada = i + 1;
        dadosTicket = data[i]; // Guarda os dados do ticket
        break;
      }
    }
    
    if (linhaEncontrada === -1) {
      return { success: false, message: "Ticket não encontrado" };
    }
    
    sheet.getRange(linhaEncontrada, 16).setValue(nota);      // AVALIACAO_NOTA
    sheet.getRange(linhaEncontrada, 17).setValue(comentario); // AVALIACAO_COMENTARIO
    
    // 🌟 ENVIAR NOTIFICAÇÃO PARA O TELEGRAM
    // Extrai os dados do ticket para a notificação
    const titulo = dadosTicket[4] || "Ticket sem título";
    const parceiroNome = dadosTicket[3] || "Parceiro";
    
    p_notificarAvaliacaoTelegram(
      ticketId,
      titulo,
      parceiroNome,
      nota,
      comentario || "Sem comentários adicionais"
    );
    
    SpreadsheetApp.flush();
    
    return { success: true, message: "Avaliação registrada! Obrigado!" };
    
  } catch (e) {
    console.error("Erro em p_avaliarAtendimento:", e);
    return { success: false, message: e.toString() };
  }
}

/**
 * Busca a base de conhecimento
 * @returns {Array} Lista de artigos
 */
function p_listarBaseConhecimento() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("BASE_CONHECIMENTO");
    
    // Criar aba se não existir com dados iniciais
    if (!sheet) {
      sheet = ss.insertSheet("BASE_CONHECIMENTO");
      const cabecalho = [
        "ID", "CATEGORIA", "TITULO", "RESUMO", "CONTEUDO", 
        "DATA_CRIACAO", "DATA_ATUALIZACAO", "VISUALIZACOES", "ATIVO"
      ];
      sheet.appendRow(cabecalho);
      sheet.getRange("A1:I1").setFontWeight("bold").setBackground("#0f172a").setFontColor("white");
      
      // Artigos iniciais
      const artigosIniciais = [
        [1, "ativacao", "Como ativar uma nova linha TIM Empresas?", 
         "Guia passo a passo para ativação de linhas empresariais TIM",
         "1. Acesse o portal TIM Empresas\n2. Informe o número da linha\n3. Escolha o plano contratado\n4. Confirme os dados cadastrais\n5. Aguarde a confirmação via SMS\n\nEm até 2 horas a linha estará ativa.",
         new Date(), new Date(), 0, "TRUE"],
        [2, "portabilidade", "Processo de Portabilidade TIM", 
         "Como solicitar portabilidade de números para TIM Empresas",
         "A portabilidade leva em média 3 dias úteis.\n\nPassos:\n1. Solicite a portabilidade no momento da venda\n2. Envie o comprovante de titularidade\n3. Aguarde a confirmação da operadora doadora\n4. Na data agendada, o número será transferido\n\n⚠️ Importante: Não cancele a linha atual antes da portabilidade!",
         new Date(), new Date(), 0, "TRUE"],
        [3, "fatura", "Entendendo a fatura TIM Empresas", 
         "Como ler e interpretar sua fatura TIM",
         "A fatura TIM Empresas contém:\n\n• Serviços Básicos (plano contratado)\n• Serviços Adicionais (VAS, seguros)\n• Ligações e Dados excedentes\n• Descontos e bônus aplicados\n\nVencimento sempre no dia fixo escolhido no contrato.\n\nPagamento pode ser feito via: Pix, Boleto, Cartão de Crédito.",
         new Date(), new Date(), 0, "TRUE"],
        [4, "tecnico", "Problemas de conexão - Soluções", 
         "Resolva problemas de internet e telefonia",
         "Passo a passo para troubleshooting:\n\n1. Reinicie o equipamento (modem/router)\n2. Verifique cabos e conexões\n3. Teste em outro dispositivo\n4. Verifique a cobertura na região\n5. Acesse o portal TIM para verificar se há manutenção programada\n\nSe o problema persistir, registre um chamado técnico.",
         new Date(), new Date(), 0, "TRUE"],
        [5, "financeiro", "Comissões para Parceiros", 
         "Como funciona o pagamento de comissões",
         "As comissões são pagas mensalmente, seguindo as regras:\n\n• Ativação: 100% do valor do plano no primeiro mês\n• Permanência: bônus progressivo M1, M2, M3, M7, M14\n• Portabilidade: bônus adicional de R$ 50 por linha\n• Renegociação: 50% da comissão de nova ativação\n\nO pagamento ocorre até o dia 15 do mês subsequente à ativação.",
         new Date(), new Date(), 0, "TRUE"]
      ];
      
      artigosIniciais.forEach(artigo => sheet.appendRow(artigo));
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    const artigos = [];
    for (let i = 1; i < data.length; i++) {
      const ativo = String(data[i][8] || "TRUE").toUpperCase() === "TRUE";
      if (ativo) {
        artigos.push({
          id: data[i][0],
          categoria: data[i][1],
          titulo: data[i][2],
          resumo: data[i][3],
          conteudo: data[i][4],
          data_criacao: formatarDataBR(data[i][5]),
          data_atualizacao: formatarDataBR(data[i][6]),
          visualizacoes: data[i][7] || 0
        });
      }
    }
    
    return artigos;
    
  } catch (e) {
    console.error("Erro em p_listarBaseConhecimento:", e);
    return [];
  }
}

/**
 * Registra visualização de artigo
 * @param {string} artigoId - ID do artigo
 */
function p_registrarVisualizacaoArtigo(artigoId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("BASE_CONHECIMENTO");
    
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(artigoId)) {
        const visualizacoesAtuais = parseInt(data[i][7]) || 0;
        sheet.getRange(i + 1, 8).setValue(visualizacoesAtuais + 1);
        break;
      }
    }
  } catch(e) {
    console.error("Erro ao registrar visualização:", e);
  }
}

/**
 * Dashboard do Admin - Estatísticas de tickets
 * @returns {Object} Estatísticas gerais
 */
function p_estatisticasTickets() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("TICKETS_SUPORTE");
    
    if (!sheet) return { total: 0, abertos: 0, resolvidos: 0, sla_violados: 0 };
    
    const data = sheet.getDataRange().getValues();
    let total = 0;
    let abertos = 0;
    let emAndamento = 0;
    let resolvidos = 0;
    let slaViolados = 0;
    const agora = new Date();
    
    for (let i = 1; i < data.length; i++) {
      total++;
      const status = data[i][9];
      const dataExpiracao = data[i][12];
      
      if (status === "aberto") abertos++;
      else if (status === "em_andamento") emAndamento++;
      else if (status === "resolvido" || status === "fechado") resolvidos++;
      
      // Verificar SLA violado (apenas tickets abertos)
      if ((status === "aberto" || status === "em_andamento") && dataExpiracao instanceof Date) {
        if (agora > dataExpiracao) slaViolados++;
      }
    }
    
    return {
      total: total,
      abertos: abertos,
      em_andamento: emAndamento,
      resolvidos: resolvidos,
      sla_violados: slaViolados
    };
    
  } catch(e) {
    console.error("Erro em p_estatisticasTickets:", e);
    return { total: 0, abertos: 0, resolvidos: 0, sla_violados: 0 };
  }
}



/**
 * Função auxiliar para formatar data BR
 */
function formatarDataBR(data) {
  if (!data) return "";
  if (data instanceof Date) {
    return Utilities.formatDate(data, "GMT-3", "dd/MM/yyyy HH:mm");
  }
  return String(data);
}

/**
 * Função auxiliar para parse de data BR
 */
function parseDataBR(dataStr) {
  if (!dataStr) return null;
  const partes = dataStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s?(\d{2})?:?(\d{2})?/);
  if (!partes) return null;
  const ano = parseInt(partes[3]);
  const mes = parseInt(partes[2]) - 1;
  const dia = parseInt(partes[1]);
  const hora = parseInt(partes[4]) || 0;
  const min = parseInt(partes[5]) || 0;
  return new Date(ano, mes, dia, hora, min);
}



// ============================================
// CONFIGURAÇÃO DO TELEGRAM
// ============================================

// Token do bot (o que o BotFather te deu)
const TELEGRAM_TOKEN = "8286220789:AAEJYT2kvzMaoYjuoy0L_oNksYznlvzqTU4";

// Seu Chat ID (obtido do link)
const TELEGRAM_CHAT_ID = "8212638223";





/**
 * TESTE: Envia mensagem para verificar se está funcionando
 * Execute esta função manualmente no Apps Script
 */
function p_testarTelegram() {
  const mensagem = `
🤖 <b>VEXO HUB - TESTE CONCLUÍDO!</b>

✅ Seu bot está funcionando perfeitamente!

📅 Teste realizado em: ${new Date().toLocaleString('pt-BR')}

🔔 Você receberá notificações em tempo real quando:
• Parceiros abrirem novos tickets
• Tickets estiverem com SLA próximo do vencimento
• Parceiros responderem aos chamados
• Tickets forem avaliados pelos parceiros

🚀 Sistema pronto para uso!
  `;
  
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  
  const payload = {
    chat_id: TELEGRAM_CHAT_ID,
    text: mensagem,
    parse_mode: "HTML"
  };
  
  const options = {
    method: "POST",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      console.log("✅ Mensagem enviada com sucesso!");
      return "✅ Mensagem enviada! Verifique seu Telegram.";
    } else {
      console.error("❌ Erro:", result.description);
      return "❌ Erro: " + result.description;
    }
  } catch(e) {
    console.error("❌ Exceção:", e);
    return "❌ Erro: " + e.toString();
  }
}



/**
 * Envia mensagem genérica para o Telegram
 */
function p_enviarTelegram(mensagem) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  
  const payload = {
    chat_id: TELEGRAM_CHAT_ID,
    text: mensagem,
    parse_mode: "HTML",
    disable_web_page_preview: false
  };
  
  const options = {
    method: "POST",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    return result.ok;
  } catch(e) {
    console.error("Erro Telegram:", e);
    return false;
  }
}

/**
 * NOTIFICAÇÃO: Novo Ticket
 */
function p_notificarNovoTicketTelegram(ticketId, titulo, prioridade, categoria, parceiroNome) {
  const emojis = {
    urgente: "🔴⚡", alta: "🔴", media: "🟡", baixa: "🟢"
  };
  const emoji = emojis[prioridade] || "🟡";
  
  const mensagem = `
${emoji} <b>🆕 NOVO TICKET DE SUPORTE</b>
━━━━━━━━━━━━━━━━━━━━━
<b>📋 ID:</b> <code>${ticketId}</code>
<b>📌 Título:</b> ${titulo}
<b>⚡ Prioridade:</b> ${prioridade.toUpperCase()}
<b>📂 Categoria:</b> ${categoria}
<b>👤 Parceiro:</b> ${parceiroNome}
━━━━━━━━━━━━━━━━━━━━━
<a href="${ScriptApp.getService().getUrl()}">📋 Clique para atender</a>
  `;
  
  return p_enviarTelegram(mensagem);
}

/**
 * NOTIFICAÇÃO: SLA Próximo do Vencimento
 */
function p_notificarSLATelegram(ticketId, titulo, prioridade, horasRestantes) {
  let emoji = "⚠️";
  let alerta = `Vence em ${horasRestantes} horas`;
  
  if (horasRestantes <= 2) {
    emoji = "🔴🚨";
    alerta = "🔴 URGENTE - VENCE EM MENOS DE 2 HORAS!";
  } else if (horasRestantes <= 6) {
    emoji = "🟠⚠️";
    alerta = `🟠 Vence em ${horasRestantes} horas`;
  }
  
  const mensagem = `
${emoji} <b>⚠️ ALERTA DE SLA</b>
━━━━━━━━━━━━━━━━━━━━━
<b>📋 ID:</b> <code>${ticketId}</code>
<b>📌 Título:</b> ${titulo}
<b>⚡ Prioridade:</b> ${prioridade.toUpperCase()}
<b>⏰ Status:</b> ${alerta}
━━━━━━━━━━━━━━━━━━━━━
<a href="${ScriptApp.getService().getUrl()}">⚡ ATENDER AGORA</a>
  `;
  
  return p_enviarTelegram(mensagem);
}

/**
 * NOTIFICAÇÃO: Parceiro respondeu
 */
function p_notificarRespostaTelegram(ticketId, titulo, parceiroNome, mensagem) {
  const resumo = mensagem.length > 150 ? mensagem.substring(0, 150) + "..." : mensagem;
  
  const msg = `
💬 <b>PARCEIRO RESPONDEU AO TICKET</b>
━━━━━━━━━━━━━━━━━━━━━
<b>📋 ID:</b> <code>${ticketId}</code>
<b>📌 Título:</b> ${titulo}
<b>👤 Parceiro:</b> ${parceiroNome}
━━━━━━━━━━━━━━━━━━━━━
<b>📝 Mensagem:</b>
${resumo}
━━━━━━━━━━━━━━━━━━━━━
<a href="${ScriptApp.getService().getUrl()}">💬 RESPONDER AGORA</a>
  `;
  
  return p_enviarTelegram(msg);
}

/**
 * NOTIFICAÇÃO: Ticket avaliado
 */
function p_notificarAvaliacaoTelegram(ticketId, titulo, parceiroNome, nota, comentario) {
  const estrelas = "⭐".repeat(nota) + "☆".repeat(5 - nota);
  const emoji = nota >= 4 ? "✅" : (nota >= 3 ? "⚠️" : "❌");
  
  const mensagem = `
${emoji} <b>TICKET RESOLVIDO E AVALIADO</b>
━━━━━━━━━━━━━━━━━━━━━
<b>📋 ID:</b> <code>${ticketId}</code>
<b>📌 Título:</b> ${titulo}
<b>👤 Parceiro:</b> ${parceiroNome}
<b>⭐ Avaliação:</b> ${estrelas} (${nota}/5)
${comentario ? `\n<b>💬 Comentário:</b>\n${comentario}` : ''}
  `;
  
  return p_enviarTelegram(mensagem);
}


/**
 * Marca um ticket como resolvido
 * @param {string} ticketId - ID do ticket
 * @param {string} usuarioNome - Nome do usuário que está resolvendo
 * @returns {Object} Resultado da operação
 */
function p_resolverTicket(ticketId, usuarioNome) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("TICKETS_SUPORTE");
    
    if (!sheet) return { success: false, message: "Aba não encontrada" };
    
    const data = sheet.getDataRange().getValues();
    let linhaEncontrada = -1;
    let ticketAtual = null;
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(ticketId)) {
        linhaEncontrada = i + 1;
        ticketAtual = data[i];
        break;
      }
    }
    
    if (linhaEncontrada === -1) {
      return { success: false, message: "Ticket não encontrado" };
    }
    
    if (ticketAtual[9] === "resolvido") {
      return { success: false, message: "Ticket já está resolvido" };
    }
    
    const dataResolucao = new Date();
    const dataFormatada = Utilities.formatDate(dataResolucao, "GMT-3", "dd/MM/yyyy HH:mm");
    
    // Carregar respostas existentes
    let respostas = [];
    try {
      respostas = JSON.parse(ticketAtual[14] || "[]");
    } catch(e) {}
    
    // Adicionar mensagem de resolução no histórico
    const resolucaoResposta = {
      autor_nome: usuarioNome,
      autor_tipo: "suporte",
      mensagem: "✅ Ticket marcado como RESOLVIDO. O chamado foi finalizado.",
      data: dataFormatada,
      anexos: []
    };
    respostas.push(resolucaoResposta);
    
    // Atualizar planilha
    sheet.getRange(linhaEncontrada, 10).setValue("resolvido");  // STATUS
    sheet.getRange(linhaEncontrada, 11).setValue(dataResolucao); // DATA_ULTIMA_ATUALIZACAO
    sheet.getRange(linhaEncontrada, 12).setValue(dataResolucao); // DATA_RESOLUCAO
    sheet.getRange(linhaEncontrada, 15).setValue(JSON.stringify(respostas)); // RESPOSTAS
    
    SpreadsheetApp.flush();
    
    // 🌟 Notificar via Telegram (opcional)
    const parceiroNome = ticketAtual[3] || "Parceiro";
    const titulo = ticketAtual[4] || "Ticket sem título";
    
    try {
      p_notificarTicketResolvido(ticketId, titulo, parceiroNome);
    } catch(e) {
      console.error("Erro ao enviar notificação:", e);
    }
    
    return { 
      success: true, 
      message: "Ticket resolvido com sucesso!" 
    };
    
  } catch (e) {
    console.error("Erro em p_resolverTicket:", e);
    return { success: false, message: e.toString() };
  }
}

/**
 * NOTIFICAÇÃO: Ticket resolvido (Telegram)
 */
function p_notificarTicketResolvidoTelegram(ticketId, titulo, parceiroNome) {
  const mensagem = `
✅ <b>SEU TICKET FOI RESOLVIDO!</b>
━━━━━━━━━━━━━━━━━━━━━
<b>📋 ID:</b> <code>${ticketId}</code>
<b>📌 Título:</b> ${titulo}
<b>👤 Parceiro:</b> ${parceiroNome}
━━━━━━━━━━━━━━━━━━━━━
✅ O suporte resolveu seu chamado.

Se precisar de mais ajuda, você pode reabrir o ticket respondendo a esta mensagem.
  `;
  
  return p_enviarTelegram(mensagem);
}

/**
 * Envia pesquisa de satisfação para o parceiro via Telegram
 * @param {string} ticketId - ID do ticket
 * @param {string} titulo - Título do ticket
 * @param {string} parceiroNome - Nome do parceiro
 */
function p_enviarPesquisaSatisfacao(ticketId, titulo, parceiroNome) {
  const linkPesquisa = p_gerarLinkPesquisa(ticketId);
  
  const mensagem = `
📋 <b>SEU TICKET FOI RESOLVIDO!</b>
━━━━━━━━━━━━━━━━━━━━━
<b>ID:</b> <code>${ticketId}</code>
<b>Título:</b> ${titulo}
<b>Parceiro:</b> ${parceiroNome}
━━━━━━━━━━━━━━━━━━━━━

✅ Seu chamado foi finalizado pelo suporte.

<b>⭐ QUEREMOS SABER SUA OPINIÃO!</b>

Por favor, avalie o atendimento clicando no link abaixo:

🔗 <a href="${linkPesquisa}">Clique aqui para avaliar</a>

Sua avaliação nos ajuda a melhorar cada vez mais!

⏰ O link expira em 30 dias.
  `;
  
  return p_enviarTelegram(mensagem);
}


/**
 * Reabre um ticket que estava resolvido
 * @param {string} ticketId - ID do ticket
 * @param {string} motivo - Motivo da reabertura
 * @param {string} parceiroNome - Nome do parceiro que está reabrindo
 * @returns {Object} Resultado da operação
 */
function p_reabrirTicket(ticketId, motivo, parceiroNome) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("TICKETS_SUPORTE");
    
    if (!sheet) return { success: false, message: "Aba não encontrada" };
    
    const data = sheet.getDataRange().getValues();
    let linhaEncontrada = -1;
    let ticketAtual = null;
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(ticketId)) {
        linhaEncontrada = i + 1;
        ticketAtual = data[i];
        break;
      }
    }
    
    if (linhaEncontrada === -1) {
      return { success: false, message: "Ticket não encontrado" };
    }
    
    // Verificar se o ticket está resolvido
    if (ticketAtual[9] !== "resolvido" && ticketAtual[9] !== "fechado") {
      return { success: false, message: "Apenas tickets resolvidos podem ser reabertos." };
    }
    
    const dataReabertura = new Date();
    const dataFormatada = Utilities.formatDate(dataReabertura, "GMT-3", "dd/MM/yyyy HH:mm");
    
    // Carregar respostas existentes
    let respostas = [];
    try {
      respostas = JSON.parse(ticketAtual[14] || "[]");
    } catch(e) {}
    
    // Adicionar mensagem de reabertura no histórico
    const reaberturaResposta = {
      autor_nome: parceiroNome,
      autor_tipo: "parceiro",
      mensagem: `🔄 TICKET REABERTO\n\nMotivo: ${motivo}\n\nO parceiro solicitou a reabertura deste ticket.`,
      data: dataFormatada,
      anexos: []
    };
    respostas.push(reaberturaResposta);
    
    // Atualizar planilha
    sheet.getRange(linhaEncontrada, 10).setValue("em_andamento");  // STATUS
    sheet.getRange(linhaEncontrada, 11).setValue(dataReabertura);  // DATA_ULTIMA_ATUALIZACAO
    sheet.getRange(linhaEncontrada, 12).setValue("");              // Limpar DATA_RESOLUCAO
    sheet.getRange(linhaEncontrada, 15).setValue(JSON.stringify(respostas)); // RESPOSTAS
    
    SpreadsheetApp.flush();
    
    // 🌟 Notificar equipe sobre reabertura (Telegram)
    const titulo = ticketAtual[4] || "Ticket sem título";
    p_notificarReaberturaTicket(ticketId, titulo, parceiroNome, motivo);
    
    return { 
      success: true, 
      message: "Ticket reaberto com sucesso! O suporte irá analisar o caso novamente." 
    };
    
  } catch (e) {
    console.error("Erro em p_reabrirTicket:", e);
    return { success: false, message: e.toString() };
  }
}

/**
 * Notifica equipe sobre reabertura de ticket (Telegram)
 */
function p_notificarReaberturaTicket(ticketId, titulo, parceiroNome, motivo) {
  const mensagem = `
🔄 <b>TICKET REABERTO PELO PARCEIRO</b>
━━━━━━━━━━━━━━━━━━━━━
<b>📋 ID:</b> <code>${ticketId}</code>
<b>📌 Título:</b> ${titulo}
<b>👤 Parceiro:</b> ${parceiroNome}
━━━━━━━━━━━━━━━━━━━━━
<b>📝 Motivo da reabertura:</b>
${motivo}
━━━━━━━━━━━━━━━━━━━━━
<a href="${ScriptApp.getService().getUrl()}">📋 Clique para atender</a>
  `;
  
  return p_enviarTelegram(mensagem);
}

/**
 * Carrega dados para o relatório de performance do suporte
 */
function p_carregarRelatorioPerformance(dataInicioStr, dataFimStr, prioridadeFiltro, atendenteFiltro) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("TICKETS_SUPORTE");
    
    if (!sheet) {
      return { success: false, message: "Aba TICKETS_SUPORTE não encontrada" };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return retornoVazio();
    }
    
    // Converter strings de data para Date
    const inicio = new Date(dataInicioStr + "T00:00:00");
    const fim = new Date(dataFimStr + "T23:59:59");
    
    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
      return { success: false, message: "Datas inválidas" };
    }
    
    // Estruturas de dados
    let ticketsPorDia = {};
    let prioridades = { urgente: 0, alta: 0, media: 0, baixa: 0 };
    let categorias = {};
    let satisfacaoPorPeriodo = {};
    let atendentes = {};
    let slaVencido = [];
    let totalTickets = 0;
    let totalResolvidos = 0;
    let totalReabertos = 0;
    let somaTemposResposta = 0;
    let countRespostas = 0;
    let somaNotas = 0;
    let countNotas = 0;
    
    for (let i = 1; i < data.length; i++) {
      const linha = data[i];
      let dataCriacao = linha[1];
      
      // Converter data de criação
      if (typeof dataCriacao === 'string') {
        const partes = dataCriacao.split(/[-/]/);
        if (partes.length >= 3) {
          dataCriacao = new Date(partes[0], partes[1] - 1, partes[2]);
        }
      }
      
      if (!(dataCriacao instanceof Date) || isNaN(dataCriacao.getTime())) continue;
      if (dataCriacao < inicio || dataCriacao > fim) continue;
      
      totalTickets++;
      
      const prioridade = linha[6] || "media";
      const status = linha[9] || "aberto";
      const avaliacao = linha[15];
      let respostas = [];
      try {
        respostas = JSON.parse(linha[14] || "[]");
      } catch(e) {}
      
      // Filtro por prioridade
      if (prioridadeFiltro !== 'todas' && prioridade !== prioridadeFiltro) continue;
      
      // Contagem por prioridade
      if (prioridades.hasOwnProperty(prioridade)) prioridades[prioridade]++;
      
      // Tickets por dia
      const diaKey = Utilities.formatDate(dataCriacao, "GMT-3", "dd/MM");
      ticketsPorDia[diaKey] = (ticketsPorDia[diaKey] || 0) + 1;
      
      // Categorias
      const categoria = linha[7] || "outros";
      categorias[categoria] = (categorias[categoria] || 0) + 1;
      
      // Verificar reabertura
      const foiReaberto = respostas.some(r => r.mensagem && r.mensagem.includes("TICKET REABERTO"));
      if (foiReaberto) totalReabertos++;
      
      // Tickets resolvidos
      if (status === "resolvido") {
        totalResolvidos++;
        
        // Tempo de resposta
        const primeiraResposta = respostas.find(r => r.autor_tipo === "suporte");
        if (primeiraResposta && primeiraResposta.data) {
          const dataResposta = parseDataBR(primeiraResposta.data);
          if (dataResposta && !isNaN(dataResposta.getTime())) {
            const diffHoras = (dataResposta - dataCriacao) / (1000 * 60 * 60);
            if (diffHoras > 0 && diffHoras < 720) { // máx 30 dias
              somaTemposResposta += diffHoras;
              countRespostas++;
            }
          }
        }
        
        // Avaliações
        if (avaliacao && avaliacao !== "") {
          const nota = parseInt(avaliacao);
          if (!isNaN(nota) && nota >= 1 && nota <= 5) {
            somaNotas += nota;
            countNotas++;
            
            const mesKey = Utilities.formatDate(dataCriacao, "GMT-3", "MM/yyyy");
            if (!satisfacaoPorPeriodo[mesKey]) {
              satisfacaoPorPeriodo[mesKey] = { soma: 0, count: 0 };
            }
            satisfacaoPorPeriodo[mesKey].soma += nota;
            satisfacaoPorPeriodo[mesKey].count++;
          }
        }
        
        // Dados por atendente
        const respostaResolucao = respostas.find(r => r.mensagem && r.mensagem.includes("RESOLVIDO"));
        if (respostaResolucao && respostaResolucao.autor_nome) {
          const atendente = respostaResolucao.autor_nome;
          if (!atendentes[atendente]) {
            atendentes[atendente] = { resolvidos: 0, somaTempo: 0, countTempo: 0, somaNotas: 0, countNotas: 0 };
          }
          atendentes[atendente].resolvidos++;
          
          if (respostaResolucao.data) {
            const dataResolucao = parseDataBR(respostaResolucao.data);
            if (dataResolucao && !isNaN(dataResolucao.getTime())) {
              const diffHoras = (dataResolucao - dataCriacao) / (1000 * 60 * 60);
              if (diffHoras > 0 && diffHoras < 720) {
                atendentes[atendente].somaTempo += diffHoras;
                atendentes[atendente].countTempo++;
              }
            }
          }
          
          if (avaliacao && avaliacao !== "") {
            const nota = parseInt(avaliacao);
            if (!isNaN(nota)) {
              atendentes[atendente].somaNotas += nota;
              atendentes[atendente].countNotas++;
            }
          }
        }
      }
      
      // SLA vencido
      if (status === "aberto" || status === "em_andamento") {
        let dataExpiracao = linha[12];
        if (typeof dataExpiracao === 'string') {
          const partes = dataExpiracao.split(/[-/]/);
          if (partes.length >= 3) {
            dataExpiracao = new Date(partes[0], partes[1] - 1, partes[2]);
          }
        }
        if (dataExpiracao instanceof Date && !isNaN(dataExpiracao.getTime())) {
          const agora = new Date();
          if (dataExpiracao < agora) {
            const atraso = Math.ceil((agora - dataExpiracao) / (1000 * 60 * 60));
            slaVencido.push({
              id: linha[0] || "N/A",
              parceiro: linha[3] || "N/A",
              titulo: linha[4] || "Sem título",
              prioridade: prioridade,
              atraso: atraso
            });
          }
        }
      }
    }
    
    // Preparar arrays para gráficos
    const diasOrdenados = Object.keys(ticketsPorDia).sort((a, b) => {
      const [diaA, mesA] = a.split('/');
      const [diaB, mesB] = b.split('/');
      if (mesA !== mesB) return parseInt(mesA) - parseInt(mesB);
      return parseInt(diaA) - parseInt(diaB);
    });
    
    const categoriaNomes = {
      ativacao: '📱 Ativação',
      portabilidade: '🔄 Portabilidade',
      fatura: '📄 Fatura',
      tecnico: '⚙️ Técnico',
      financeiro: '💰 Financeiro',
      cancelamento: '❌ Cancelamento',
      outros: '📌 Outros'
    };
    
    const ranking = Object.keys(atendentes).map(nome => ({
      atendente: nome,
      resolvidos: atendentes[nome].resolvidos,
      tmr: atendentes[nome].countTempo > 0 ? atendentes[nome].somaTempo / atendentes[nome].countTempo : 0,
      notaMedia: atendentes[nome].countNotas > 0 ? atendentes[nome].somaNotas / atendentes[nome].countNotas : 0,
      sla: 100
    })).sort((a, b) => b.resolvidos - a.resolvidos);
    
    // Filtrar ranking por atendente
    let rankingFiltrado = ranking;
    if (atendenteFiltro !== 'todos') {
      rankingFiltrado = ranking.filter(r => r.atendente === atendenteFiltro);
    }
    
    return {
      success: true,
      totalTickets: totalTickets,
      totalResolvidos: totalResolvidos,
      totalReabertos: totalReabertos,
      tmr: countRespostas > 0 ? somaTemposResposta / countRespostas : 0,
      slaAtingido: totalTickets > 0 ? (totalResolvidos / totalTickets) * 100 : 0,
      satisfacaoMedia: countNotas > 0 ? somaNotas / countNotas : 0,
      ticketsPorDia: {
        labels: diasOrdenados,
        valores: diasOrdenados.map(k => ticketsPorDia[k])
      },
      prioridades: {
        labels: ['Urgente', 'Alta', 'Média', 'Baixa'],
        valores: [prioridades.urgente, prioridades.alta, prioridades.media, prioridades.baixa]
      },
      categorias: {
        labels: Object.keys(categorias).map(c => categoriaNomes[c] || c),
        valores: Object.keys(categorias).map(c => categorias[c])
      },
      satisfacaoPorPeriodo: {
        labels: Object.keys(satisfacaoPorPeriodo).sort(),
        valores: Object.keys(satisfacaoPorPeriodo).sort().map(k => satisfacaoPorPeriodo[k].soma / satisfacaoPorPeriodo[k].count)
      },
      ranking: rankingFiltrado,
      slaVencido: slaVencido.slice(0, 10),
      listaAtendentes: ['todos', ...ranking.map(r => r.atendente)]
    };
    
  } catch (e) {
    console.error("Erro:", e);
    return { success: false, message: e.toString() };
  }
}
function retornoVazio() {
  return {
    success: true,
    totalTickets: 0,
    totalResolvidos: 0,
    totalReabertos: 0,
    tmr: 0,
    slaAtingido: 0,
    satisfacaoMedia: 0,
    ticketsPorDia: { labels: [], valores: [] },
    prioridades: { labels: ['Urgente', 'Alta', 'Média', 'Baixa'], valores: [0,0,0,0] },
    categorias: { labels: [], valores: [] },
    satisfacaoPorPeriodo: { labels: [], valores: [] },
    ranking: [],
    slaVencido: [],
    listaAtendentes: ['todos']
  };
}

/**
 * Função auxiliar para parse de data flexível
 */
function parseDataBRFlexivel(dataStr) {
  if (!dataStr) return null;
  if (dataStr instanceof Date) return dataStr;
  
  // Formato: dd/MM/yyyy HH:mm
  const partes = dataStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s?(\d{2})?:?(\d{2})?/);
  if (partes) {
    const dia = parseInt(partes[1]);
    const mes = parseInt(partes[2]) - 1;
    const ano = parseInt(partes[3]);
    const hora = parseInt(partes[4]) || 0;
    const min = parseInt(partes[5]) || 0;
    return new Date(ano, mes, dia, hora, min);
  }
  
  return null;
}

// ============================================
// 🚀 MÓDULO DE PEDIDOS PARA PARCEIROS - VERSÃO ENTERPRISE
// LOCAL: code_parceiro.gs
// ============================================

/**
 * CONFIGURAÇÕES GLOBAIS DOS PEDIDOS
 */
const CONFIG_PEDIDOS_PARCEIRO = {
  STATUS_MAP: {
    "PENDENTE DE INPUT": { etapa: 0, label: "📥 Pendente", cor: "#64748b", bg: "#f1f5f9" },
    "1. INPUT REALIZADO": { etapa: 1, label: "✅ Input Realizado", cor: "#3b82f6", bg: "#eff6ff" },
    "2. ANTIFRAUDE APROVADO": { etapa: 2, label: "🔒 Antifraude", cor: "#8b5cf6", bg: "#f3e8ff" },
    "3. DOCS VALIDADOS BOC": { etapa: 3, label: "📋 Docs Validados", cor: "#6366f1", bg: "#e0e7ff" },
    "4. NOTA FISCAL EMITIDA": { etapa: 4, label: "📄 Nota Fiscal", cor: "#f59e0b", bg: "#fffbeb" },
    "5. CONFIRMAÇÃO LOGÍSTICA": { etapa: 5, label: "🚚 Logística", cor: "#10b981", bg: "#ecfdf5" },
    "6. ATIVADO": { etapa: 6, label: "🎉 Ativado!", cor: "#059669", bg: "#d1fae5" }
  },
  TEMPO_CACHE: 30, // segundos
  PLANILHA_VENDAS: "VENDAS"
};

/**
 * 🎯 LISTA PEDIDOS DO PARCEIRO (COM CACHE INTELIGENTE)
 * @param {string} parceiroId - ID/Matrícula do parceiro
 * @param {boolean} forceRefresh - Forçar atualização do cache
 * @returns {Object} Dados dos pedidos com hash para detecção de mudanças
 */
function p_listarMeusPedidos(parceiroId, bancoDeDadosId = null, forceRefresh = false) {
  try {
    // 🔑 Inclui o bancoDeDadosId na chave do cache para isolar dados de cada parceiro
    const cacheKey = `pedidos_parceiro_${parceiroId}_${bancoDeDadosId || 'central'}`;
    const cache = CacheService.getScriptCache();
    
    // Verifica cache se não for força
    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        console.log(`📦 Cache hit para parceiro ${parceiroId} (banco: ${bancoDeDadosId || 'central'})`);
        return parsed;
      }
    }
    
    console.log(`🔍 Buscando pedidos para parceiro ${parceiroId} (banco: ${bancoDeDadosId || 'central'})...`);
    
    // 🆕 Obtém a planilha correta usando o bancoDeDadosId
    const ss = getPlanilhaParceiroPorId(bancoDeDadosId);
    const sheet = ss.getSheetByName(CONFIG_PEDIDOS_PARCEIRO.PLANILHA_VENDAS);
    
    if (!sheet) {
      return { success: false, message: "Aba VENDAS não encontrada", pedidos: [], hash: "" };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: true, pedidos: [], hash: _calcularHashPedidos([]) };
    }
    
    const pedidos = [];
    const agora = new Date();
    const parceiroBusca = String(parceiroId).toUpperCase().trim();
    
    for (let i = 1; i < data.length; i++) {
      const linha = data[i];
      const vendedor = String(linha[9] || "").toUpperCase().trim(); // Coluna J - Consultor que vendeu
      
      // Filtra apenas pedidos do parceiro logado
      if (vendedor !== parceiroBusca) continue;
      
      const statusRaw = String(linha[24] || "PENDENTE DE INPUT").trim();
      const statusInfo = CONFIG_PEDIDOS_PARCEIRO.STATUS_MAP[statusRaw] || CONFIG_PEDIDOS_PARCEIRO.STATUS_MAP["PENDENTE DE INPUT"];
      
      // Calcula tempo desde última atualização
      let ultimaAtualizacao = linha[10]; // Coluna K - DATA_ULTIMA_ATUALIZACAO
      let tempoDecorrido = "";
      if (ultimaAtualizacao instanceof Date) {
        const diffMs = agora - ultimaAtualizacao;
        const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHoras < 1) tempoDecorrido = "agora mesmo";
        else if (diffHoras < 24) tempoDecorrido = `há ${diffHoras} hora(s)`;
        else tempoDecorrido = `há ${Math.floor(diffHoras / 24)} dia(s)`;
      }
      
      // Extrai valor (Coluna I - índice 8)
      let valor = 0;
      if (typeof linha[8] === 'number') {
        valor = linha[8];
      } else if (linha[8]) {
        valor = parseFloat(String(linha[8]).replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
      }
      
      // Monta objeto do pedido
      pedidos.push({
        id: `PED-${String(i).padStart(5, '0')}`,
        linha: i + 1,
        data_criacao: _formatarDataBRPedidos(linha[2]), // Coluna C - DATA DA VENDA
        cliente: String(linha[3] || "Não informado").toUpperCase(), // Coluna D - RAZÃO SOCIAL
        cnpj: linha[3] || "", // Coluna D - CNPJ (ajustar se necessário)
        modalidade: linha[4] || "", // Coluna E - MODALIDADE
        plano: linha[6] || "", // Coluna G - PLANO
        numero_linha: linha[7] || "", // Coluna H - NÚMERO DA LINHA
        valor: valor,
        status_raw: statusRaw,
        status_label: statusInfo.label,
        status_etapa: statusInfo.etapa,
        status_cor: statusInfo.cor,
        status_bg: statusInfo.bg,
        data_ultima_atualizacao: _formatarDataBRPedidos(linha[10]), // Coluna K
        tempo_decorrido: tempoDecorrido,
        data_ativacao: _formatarDataBRPedidos(linha[25]), // Coluna Z
        operadora_doadora: linha[9] || "", // Coluna J
        tem_anexos: linha[13] ? true : false // Coluna N
      });
    }
    
    // Ordena por data mais recente primeiro e depois por etapa
    pedidos.sort((a, b) => {
      if (a.status_etapa !== b.status_etapa) return a.status_etapa - b.status_etapa;
      return String(b.data_criacao).localeCompare(String(a.data_criacao));
    });
    
    const hash = _calcularHashPedidos(pedidos);
    const result = { success: true, pedidos: pedidos, hash: hash, total: pedidos.length };
    
    // Salva no cache com a chave específica do banco
    cache.put(cacheKey, JSON.stringify(result), CONFIG_PEDIDOS_PARCEIRO.TEMPO_CACHE);
    
    console.log(`✅ ${pedidos.length} pedidos encontrados para parceiro ${parceiroId} (banco: ${bancoDeDadosId || 'central'})`);
    return result;
    
  } catch (e) {
    console.error("❌ Erro em p_listarMeusPedidos:", e);
    return { success: false, message: e.toString(), pedidos: [], hash: "" };
  }
}

/**
 * 🔄 VERIFICA MUDANÇAS NOS PEDIDOS (OTIMIZADO PARA POLLING)
 * @param {string} parceiroId - ID do parceiro
 * @param {string} ultimoHash - Hash anterior para comparação
 * @returns {Object} Objeto com mudanças detectadas
 */
function p_verificarMudancasPedidos(parceiroId, bancoDeDadosId = null, ultimoHash) {
  try {
    // Força refresh passando o bancoDeDadosId
    const dadosAtuais = p_listarMeusPedidos(parceiroId, bancoDeDadosId, true);
    
    if (!dadosAtuais.success) {
      return { mudou: false, error: dadosAtuais.message };
    }
    
    const mudou = dadosAtuais.hash !== ultimoHash;
    
    // Se mudou, identifica quais pedidos tiveram alteração
    let pedidosAlterados = [];
    if (mudou && ultimoHash) {
      // Busca dados antigos do cache para comparar (inclui bancoDeDadosId na chave)
      const cache = CacheService.getScriptCache();
      const cacheKey = `pedidos_parceiro_${parceiroId}_${bancoDeDadosId || 'central'}_old`;
      const dadosAntigosRaw = cache.get(cacheKey);
      
      if (dadosAntigosRaw) {
        const dadosAntigos = JSON.parse(dadosAntigosRaw);
        pedidosAlterados = _identificarPedidosAlterados(dadosAntigos.pedidos || [], dadosAtuais.pedidos);
      }
      
      // Salva novo estado como "antigo" para próxima comparação
      cache.put(cacheKey, JSON.stringify(dadosAtuais), CONFIG_PEDIDOS_PARCEIRO.TEMPO_CACHE);
    }
    
    return {
      mudou: mudou,
      pedidos: dadosAtuais.pedidos,
      total: dadosAtuais.total,
      hash: dadosAtuais.hash,
      alterados: pedidosAlterados
    };
    
  } catch (e) {
    console.error("❌ Erro em p_verificarMudancasPedidos:", e);
    return { mudou: false, error: e.toString() };
  }
}

/**
 * 🏷️ DETALHES DO PEDIDO (PARA MODAL)
 * @param {number} linha - Número da linha na planilha
 * @returns {Object} Detalhes completos do pedido
 */
function p_detalhesPedido(linha) {
  try {
    const ss = getDb('PARCEIRO');
    const sheet = ss.getSheetByName(CONFIG_PEDIDOS_PARCEIRO.PLANILHA_VENDAS);
    
    if (!sheet) return { success: false, message: "Aba VENDAS não encontrada" };
    
    const data = sheet.getDataRange().getValues();
    if (linha < 1 || linha >= data.length) return { success: false, message: "Pedido não encontrado" };
    
    const row = data[linha - 1];
    const statusInfo = CONFIG_PEDIDOS_PARCEIRO.STATUS_MAP[row[24]] || CONFIG_PEDIDOS_PARCEIRO.STATUS_MAP["PENDENTE DE INPUT"];
    
    // Extrai valor - COLUNA H (índice 7)
    let valor = 0;
    if (typeof row[7] === 'number') {
      valor = row[7];
    } else if (row[7]) {
      valor = parseFloat(String(row[7]).replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
    }
    
    return {
      success: true,
      pedido: {
        linha: linha,
        id: `PED-${String(linha).padStart(5, '0')}`,
        data_criacao: _formatarDataBRPedidos(row[1]), // Coluna B (data venda)
        cliente: row[3],
        cnpj: row[2], // CNPJ está na coluna C
        ie: row[34] || "",
        modalidade: row[4],
        plano: row[5], // Plano na coluna F
        numero_linha: row[6], // Número na coluna G
        valor: valor,
        operadora_doadora: row[8] || "", // COLUNA I (índice 8)
        consultor_venda: row[9] || "",   // COLUNA J
        consultor_input: row[10] || "",  // COLUNA K
        status: row[24] || "PENDENTE DE INPUT",
        status_info: statusInfo,
        data_ultima_atualizacao: _formatarDataBRPedidos(row[10]), // Coluna K
        data_resolucao: _formatarDataBRPedidos(row[11]),
        data_ativacao: _formatarDataBRPedidos(row[25]),
        cep: row[11],
        endereco: row[12],
        numero_endereco: row[13],
        complemento: row[14],
        bairro: row[15],
        cidade: row[16],
        uf: row[17],
        cpf_admin: row[18],
        nome_admin: row[19],
        email: row[20],
        contato_financeiro: row[21],
        codigo_cliente: row[31],
        codigo_admin: row[32]
      }
    };
    
  } catch (e) {
    console.error("❌ Erro em p_detalhesPedido:", e);
    return { success: false, message: e.toString() };
  }
}

/**
 * 📊 ESTATÍSTICAS DO PARCEIRO (CARDS DO DASHBOARD)
 * @param {string} parceiroId - ID do parceiro
 * @returns {Object} Estatísticas consolidadas
 */
function p_estatisticasPedidos(parceiroId) {
  try {
    const result = p_listarMeusPedidos(parceiroId);
    if (!result.success) return { success: false };
    
    const pedidos = result.pedidos;
    
    const estatisticas = {
      total: pedidos.length,
      total_pendentes_input: 0,
      total_em_andamento: 0,
      total_concluidos: 0,
      valor_total_pedidos: 0,
      valor_total_ativos: 0
    };
    
    pedidos.forEach(p => {
      if (p.status_etapa === 0) estatisticas.total_pendentes_input++;
      else if (p.status_etapa >= 1 && p.status_etapa <= 5) estatisticas.total_em_andamento++;
      else if (p.status_etapa === 6) estatisticas.total_concluidos++;
      
      estatisticas.valor_total_pedidos += p.valor;
      if (p.status_etapa === 6) estatisticas.valor_total_ativos += p.valor;
    });
    
    return { success: true, estatisticas: estatisticas };
    
  } catch (e) {
    console.error("❌ Erro em p_estatisticasPedidos:", e);
    return { success: false };
  }
}

// ============================================
// 🔧 FUNÇÕES AUXILIARES PRIVADAS
// ============================================

function _calcularHashPedidos(obj) {
  const str = JSON.stringify(obj);
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, str);
  return Utilities.base64Encode(digest);
}

function _identificarPedidosAlterados(pedidosAntigos, pedidosNovos) {
  const alterados = [];
  const mapAntigos = new Map();
  
  pedidosAntigos.forEach(p => {
    mapAntigos.set(p.id, p);
  });
  
  pedidosNovos.forEach(p => {
    const antigo = mapAntigos.get(p.id);
    if (antigo && antigo.status_raw !== p.status_raw) {
      alterados.push({
        id: p.id,
        cliente: p.cliente,
        status_anterior: antigo.status_label,
        status_novo: p.status_label,
        status_etapa_nova: p.status_etapa
      });
    }
  });
  
  return alterados;
}

function _formatarDataBRPedidos(data) {
  if (!data) return "";
  if (data instanceof Date) {
    return Utilities.formatDate(data, "GMT-3", "dd/MM/yyyy HH:mm");
  }
  if (typeof data === "string" && data.includes("/")) return data;
  return String(data);
}
/**
 * Obtém a aba VENDAS da planilha correta para o usuário logado
 * @param {Object} usuario - Objeto do usuário (deve conter bancoDeDadosId)
 * @returns {Sheet} A aba VENDAS da planilha do parceiro, ou da central como fallback
 */
function getSheetVendasUsuario(usuario) {
  try {
    // O parâmetro usuario pode ser um objeto com bancoDeDadosId
    const idPlanilha = usuario && usuario.bancoDeDadosId ? String(usuario.bancoDeDadosId).trim() : null;
    console.log(`🔍 getSheetVendasUsuario - idPlanilha recebido: "${idPlanilha}"`);

    let ss;
    if (idPlanilha && idPlanilha !== "" && idPlanilha !== "null") {
      try {
        ss = SpreadsheetApp.openById(idPlanilha);
        console.log(`✅ Planilha do parceiro aberta com sucesso: ${idPlanilha}`);
      } catch (e) {
        console.error(`❌ Falha ao abrir planilha ${idPlanilha}: ${e.message}`);
        // Em vez de fallback silencioso, vamos jogar erro para não mascarar
        throw new Error(`Não foi possível abrir a planilha do parceiro: ${idPlanilha}`);
      }
    } else {
      // Se não tiver ID, usamos a central, mas logamos um aviso
      console.warn(`⚠️ Nenhum bancoDeDadosId fornecido. Usando planilha central.`);
      ss = SpreadsheetApp.openById("1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4");
    }

    let sheet = ss.getSheetByName("VENDAS");
    if (!sheet) {
      console.log(`🆕 Criando aba VENDAS na planilha ${ss.getId()}`);
      sheet = ss.insertSheet("VENDAS");
      const cabecalho = [
        "DIA VENC.", "DATA VENDA", "CNPJ", "RAZÃO SOCIAL", "MODALIDADE", "PLANO",
        "NÚMERO DA LINHA", "VALOR CONTRATADO", "OPERADORA DOADORA",
        "CONSULTOR (NOME COMPLETO)", "CONSULTOR DO INPUT",
        "CEP", "ENDEREÇO", "Nº", "COMPL.", "BAIRRO", "CIDADE", "UF",
        "CPF ADMINISTRADOR", "NOME ADMINISTRADOR", "EMAIL", "CONTATO FINANCEIRO",
        "PEDIDO RADAR", "PEDIDO P2B", "STATUS DO PEDIDO",
        "ATIVAÇÃO EM SISTEMA TIM", "M0", "M1", "M2", "M6", "M13",
        "CÓDIGO DO CLIENTE", "ADMINISTRADOR (LOGIN)", "SENHA MEU TIM",
        "INSCRIÇÃO ESTADUAL", "OBSERVAÇÕES", "NOME DO PARCEIRO",
        "DATA ATIVAÇÃO RADAR"
      ];
      sheet.appendRow(cabecalho);
      sheet.getRange("1:1").setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
      sheet.setFrozenRows(1);
      SpreadsheetApp.flush();
    }
    
    console.log(`📂 Usando planilha ID: ${ss.getId()}`);
    return sheet;
  } catch (e) {
    console.error(`❌ Erro fatal em getSheetVendasUsuario: ${e.message}`);
    throw e; // Repassa o erro para ser tratado por quem chamou
  }
}
function getPlanilhaParceiroPorId(bancoDeDadosId) {
  if (bancoDeDadosId && bancoDeDadosId.trim() !== "") {
    try {
      return SpreadsheetApp.openById(bancoDeDadosId);
    } catch (e) {
      console.warn("Falha ao abrir planilha específica, usando central.", e);
      return SpreadsheetApp.openById("1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4");
    }
  }
  return SpreadsheetApp.openById("1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4");
}
function getListaParceirosComBancoProprio() {
  try {
    console.log("🔍 [getListaParceirosComBancoProprio] Iniciando busca...");
    
    const ssCentral = SpreadsheetApp.openById("1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4");
    const sheetUsers = ssCentral.getSheetByName("USERS");
    
    if (!sheetUsers) {
      console.error("❌ Aba USERS não encontrada na planilha central");
      return [];
    }
    
    const data = sheetUsers.getDataRange().getDisplayValues();
    console.log(`📊 Total de linhas na aba USERS: ${data.length - 1} (excluindo cabeçalho)`);
    
    // Exibe o cabeçalho para debug
    if (data.length > 0) {
      console.log(`📋 Cabeçalho da USERS: ${data[0].join(' | ')}`);
    }
    
    const parceiros = [];
    let usuariosAtivos = 0;
    let usuariosComBanco = 0;
    
    for (let i = 1; i < data.length; i++) {
      const linha = data[i];
      
      // Mapeamento das colunas (baseado na estrutura da USERS)
      const matricula = String(linha[0] || "").trim();        // Coluna A
      const senha = String(linha[1] || "").trim();            // Coluna B
      const nome = String(linha[2] || "").trim();             // Coluna C
      const sobrenome = String(linha[3] || "").trim();        // Coluna D
      const email = String(linha[4] || "").trim();            // Coluna E
      const cargo = String(linha[5] || "").trim().toUpperCase(); // Coluna F
      const status = String(linha[6] || "").trim().toUpperCase(); // Coluna G
      const permissoes = String(linha[7] || "").trim();       // Coluna H
      const photoUrl = String(linha[8] || "").trim();         // Coluna I
      const bancoId = String(linha[9] || "").trim();          // 🔥 Coluna J - BANCO_DE_DADOS_ID
      
      const nomeCompleto = (nome + " " + sobrenome).trim() || nome;
      
      // Log apenas para linhas com dados relevantes
      if (matricula || nome || email) {
        console.log(`📋 Linha ${i}: Matricula="${matricula}", Nome="${nomeCompleto}", Cargo="${cargo}", Status="${status}", BancoId="${bancoId || 'VAZIO'}"`);
      }
      
      // Verifica se o usuário está ativo
      const isAtivo = (status === "ATIVO" || status === "TRUE" || status === "1");
      if (isAtivo) {
        usuariosAtivos++;
      }
      
      // 🔥 CONSIDERA APENAS USUÁRIOS ATIVOS COM BANCO PRÓPRIO
      // O bancoId deve ter mais de 20 caracteres (IDs do Google Sheets têm 44 caracteres)
      const temBancoValido = bancoId && 
                             bancoId !== "" && 
                             bancoId !== "null" && 
                             bancoId !== "NULL" && 
                             bancoId !== "undefined" &&
                             bancoId.length > 10;
      
      if (temBancoValido && isAtivo && matricula) {
        usuariosComBanco++;
        parceiros.push({
          matricula: matricula,
          nome: nomeCompleto || nome || matricula,
          bancoDeDadosId: bancoId,
          cargo: cargo,
          email: email,
          status: status
        });
        console.log(`✅ PARCEIRO ENCONTRADO: ${nomeCompleto} (${matricula}) -> Banco: ${bancoId}`);
      } else if (temBancoValido && !isAtivo) {
        console.log(`⚠️ Usuário ${nomeCompleto} tem banco próprio (${bancoId}) mas está INATIVO (status: ${status})`);
      } else if (!temBancoValido && isAtivo && matricula) {
        // Usuário ativo mas sem banco próprio
        console.log(`ℹ️ Usuário ativo ${nomeCompleto} (${matricula}) NÃO possui banco próprio (usa central)`);
      }
    }
    
    console.log(`📊 Resumo:`);
    console.log(`   - Total de usuários ativos: ${usuariosAtivos}`);
    console.log(`   - Usuários com banco próprio: ${usuariosComBanco}`);
    console.log(`   - Parceiros retornados: ${parceiros.length}`);
    
    // Se encontrou parceiros, mostra os IDs dos bancos
    if (parceiros.length > 0) {
      console.log(`📋 IDs dos bancos encontrados:`);
      parceiros.forEach(p => {
        console.log(`   - ${p.nome}: ${p.bancoDeDadosId}`);
      });
    } else {
      console.warn(`⚠️ NENHUM parceiro com banco próprio foi encontrado!`);
      console.warn(`   Verifique se a coluna J (BANCO_DE_DADOS_ID) está preenchida corretamente.`);
      console.warn(`   Verifique se os usuários estão com status ATIVO.`);
    }
    
    return parceiros;
    
  } catch (e) {
    console.error("❌ Erro ao buscar parceiros com banco próprio:", e);
    console.error(`   Stack: ${e.stack}`);
    return [];
  }
}
function p_buscarComissaoFreelancer() {
  try {
    const usuario = JSON.parse(PropertiesService.getScriptProperties().getProperty('usuario_logado') || '{}');
    const bancoId = usuario.bancoDeDadosId;
    const nomeFreelancer = (usuario.username || usuario.nome || '').toUpperCase().trim();

    if (!bancoId) {
      return { success: false, message: "Banco de dados não configurado." };
    }

    const ss = SpreadsheetApp.openById(bancoId);
    const sheetVendas = ss.getSheetByName("VENDAS");
    const sheetComissao = ss.getSheetByName("COMISSAO");

    if (!sheetVendas) {
      return { success: false, message: "Aba VENDAS não encontrada." };
    }

    // 1. Ler percentuais de comissão (A2 e B2)
    let comissaoVendasPercent = 0;
    let comissaoRenegPercent = 0;
    if (sheetComissao) {
      // 🔥 CORREÇÃO: parseFloat para garantir número e tratar vírgula
      const rawVendas = sheetComissao.getRange("A2").getValue();
      const rawReneg = sheetComissao.getRange("B2").getValue();
      comissaoVendasPercent = parseFloat(String(rawVendas).replace(',', '.')) || 0;
      comissaoRenegPercent = parseFloat(String(rawReneg).replace(',', '.')) || 0;
    }

    // 2. Buscar vendas do freelancer no mês atual
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    const data = sheetVendas.getDataRange().getValues();
    let faturamentoMensal = 0;
    let totalVendas = 0;       // PRIMEIRA ATIVAÇÃO, ADITIVO, PORTABILIDADE, MIGRAÇÃO
    let totalRenegociacoes = 0; // RENEG

    for (let i = 1; i < data.length; i++) {
      const linha = data[i];
      const dataVenda = linha[1];
      let mesVenda, anoVenda;
      if (dataVenda instanceof Date) {
        mesVenda = dataVenda.getMonth();
        anoVenda = dataVenda.getFullYear();
      } else {
        const partes = String(dataVenda).split('/');
        if (partes.length === 3) {
          mesVenda = parseInt(partes[1]) - 1;
          anoVenda = parseInt(partes[2]);
        } else {
          continue;
        }
      }
      if (mesVenda !== mesAtual || anoVenda !== anoAtual) continue;

      const vendedor = String(linha[9] || "").toUpperCase().trim(); // Coluna J
      if (vendedor !== nomeFreelancer) continue;

      const modalidade = String(linha[4] || "").toUpperCase().trim();
      const valor = parseFloat(linha[7]) || 0;

      faturamentoMensal += valor;

      // Classifica a modalidade
      if (modalidade === "PRIMEIRA ATIVAÇÃO" || modalidade === "ADITIVO" || 
          modalidade === "PORTABILIDADE" || modalidade === "MIGRAÇÃO") {
        totalVendas += valor;
      } else if (modalidade === "RENEG" || modalidade === "RENEGOCIAÇÃO") {
        totalRenegociacoes += valor;
      }
    }

    // 🔥 CORREÇÃO: calcular com divisão por 100
    const comissaoVendas = totalVendas * (comissaoVendasPercent / 100);
    const comissaoReneg = totalRenegociacoes * (comissaoRenegPercent / 100);
    const comissaoTotal = comissaoVendas + comissaoReneg;

    return {
      success: true,
      faturamentoMensal: faturamentoMensal,
      comissaoVendas: comissaoVendas,
      comissaoReneg: comissaoReneg,
      comissaoTotal: comissaoTotal,
      percentualVendas: comissaoVendasPercent,
      percentualReneg: comissaoRenegPercent,
      totalVendas: totalVendas,
      totalRenegociacoes: totalRenegociacoes,
      ativacoes: 0 // ou você pode calcular se quiser
    };

  } catch (e) {
    console.error("Erro em p_buscarComissaoFreelancer:", e);
    return { success: false, message: e.toString() };
  }
}
function p_buscarDadosFreelancer(mesParam, anoParam) {
  try {
    const usuario = JSON.parse(PropertiesService.getScriptProperties().getProperty('usuario_logado') || '{}');
    console.log("👤 Usuário:", JSON.stringify(usuario));

    let bancoId = usuario.bancoDeDadosId;
    const ID_CENTRAL = "1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4";

    if (!bancoId || bancoId === "null") {
      bancoId = ID_CENTRAL;
      console.warn("⚠️ Nenhum banco próprio, usando central.");
    }

    const ss = SpreadsheetApp.openById(bancoId);
    const sheetVendas = ss.getSheetByName("VENDAS");
    if (!sheetVendas) {
      return { success: false, message: "Aba VENDAS não encontrada." };
    }

    // ============================================
    // 🔥 LEITURA DOS PERCENTUAIS CORRIGIDA
    // ============================================
    let pctVendas = 0, pctReneg = 0;
    const sheetComissao = ss.getSheetByName("COMISSAO");
    if (sheetComissao) {
      try {
        let rawVendas = sheetComissao.getRange("A2").getValue();
        let rawReneg = sheetComissao.getRange("B2").getValue();

        let numVendas = parseFloat(String(rawVendas).replace(',', '.')) || 0;
        let numReneg = parseFloat(String(rawReneg).replace(',', '.')) || 0;

        // 🔥 CONVERSÃO: se for decimal (0 < valor < 10), multiplica por 100
        if (numVendas > 0 && numVendas < 10) numVendas *= 100;
        if (numReneg > 0 && numReneg < 10) numReneg *= 100;

        pctVendas = numVendas;
        pctReneg = numReneg;
        console.log(`📊 Percentuais ajustados: Vendas=${pctVendas}%, Reneg=${pctReneg}%`);
      } catch (e) {
        console.warn("⚠️ Erro ao ler percentuais", e);
      }
    }

    // Define mês/ano alvo
    const hoje = new Date();
    const mesAlvo = (mesParam !== undefined) ? parseInt(mesParam) - 1 : hoje.getMonth();
    const anoAlvo = (anoParam !== undefined) ? parseInt(anoParam) : hoje.getFullYear();

    const data = sheetVendas.getDataRange().getValues();
    let faturamento = 0, totalVendas = 0, totalReneg = 0, contaLinhas = 0;

    for (let i = 1; i < data.length; i++) {
      const linha = data[i];
      if (!linha[2] && !linha[3]) continue;

      const dataVenda = linha[1];
      let mesVenda, anoVenda;
      if (dataVenda instanceof Date) {
        mesVenda = dataVenda.getMonth();
        anoVenda = dataVenda.getFullYear();
      } else if (typeof dataVenda === 'string') {
        const partes = dataVenda.split('/');
        if (partes.length === 3) {
          mesVenda = parseInt(partes[1]) - 1;
          anoVenda = parseInt(partes[2]);
        } else continue;
      } else continue;

      if (mesVenda !== mesAlvo || anoVenda !== anoAlvo) continue;

      const modalidade = String(linha[4] || "").toUpperCase().trim();
      const valor = parseFloat(linha[7]) || 0;

      contaLinhas++;
      faturamento += valor;

      const isVenda = /PRIMEIRA ATIVAÇÃO|ADITIVO|PORTABILIDADE|MIGRAÇÃO/.test(modalidade);
      const isReneg = /RENEG/.test(modalidade);

      if (isVenda) totalVendas += valor;
      else if (isReneg) totalReneg += valor;
    }

    const comissaoVendas = totalVendas * (pctVendas / 100);
    const comissaoReneg = totalReneg * (pctReneg / 100);
    const comissaoTotal = comissaoVendas + comissaoReneg;

    console.log(`💰 Comissão Vendas: ${comissaoVendas} (${totalVendas} * ${pctVendas}%)`);
    console.log(`💰 Comissão Reneg: ${comissaoReneg} (${totalReneg} * ${pctReneg}%)`);

    return {
      success: true,
      faturamentoMensal: faturamento,
      totalVendas: totalVendas,
      totalRenegociacoes: totalReneg,
      comissaoVendas: comissaoVendas,
      comissaoReneg: comissaoReneg,
      comissaoTotal: comissaoTotal,
      percentualVendas: pctVendas,
      percentualReneg: pctReneg,
      nomeFreelancer: (usuario.username || usuario.nome || 'Freelancer'),
      debug: { contaLinhas, planilhaUsada: bancoId }
    };

  } catch (e) {
    console.error("❌ Erro:", e);
    return { success: false, message: e.toString() };
  }
}
function excluirLinhasDoPedido(linha, origem, idUnico, indicesSelecionados) {
  try {
    console.log(`🗑️ Excluindo linhas específicas do pedido linha ${linha}, origem ${origem}`);
    console.log(`📋 Índices selecionados: ${indicesSelecionados.join(', ')}`);

    const ss = origem === "PARCEIRO"
      ? SpreadsheetApp.openById("1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4")
      : SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("VENDAS");
    if (!sheet) return { success: false, message: "Aba VENDAS não encontrada" };

    // Buscar o pedido pelo id_unico
    const [cnpjAlvo, dataKeyAlvo] = idUnico.split("|");
    const cnpjLimpo = cnpjAlvo.replace(/\D/g, '');
    let dataAlvoNormalizada = "";
    if (dataKeyAlvo.includes("/")) {
      dataAlvoNormalizada = dataKeyAlvo;
    } else if (dataKeyAlvo.includes("-")) {
      const [ano, mes, dia] = dataKeyAlvo.split("-");
      dataAlvoNormalizada = `${dia}/${mes}/${ano}`;
    } else {
      dataAlvoNormalizada = dataKeyAlvo;
    }

    const dataValues = sheet.getDataRange().getValues();
    // Encontrar todas as linhas do pedido
    let linhasDoPedido = [];
    for (let i = 1; i < dataValues.length; i++) {
      const row = dataValues[i];
      let cnpjLinha = String(row[2] || "").replace(/\D/g, '');
      let dataLinha = "";
      if (row[1] instanceof Date) {
        dataLinha = Utilities.formatDate(row[1], "GMT-3", "dd/MM/yyyy");
      } else {
        const match = String(row[1]).match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (match) dataLinha = `${match[1]}/${match[2]}/${match[3]}`;
      }
      if (cnpjLinha === cnpjLimpo && dataLinha === dataAlvoNormalizada) {
        linhasDoPedido.push(i + 1);
      }
    }

    if (linhasDoPedido.length === 0) {
      return { success: false, message: "Pedido não encontrado" };
    }

    // Ordenar de baixo para cima para excluir sem deslocar índices
    const linhasParaExcluir = indicesSelecionados.map(idx => linhasDoPedido[idx]);
    linhasParaExcluir.sort((a, b) => b - a);

    for (let l of linhasParaExcluir) {
      sheet.deleteRow(l);
      console.log(`✅ Linha ${l} excluída`);
    }

    SpreadsheetApp.flush();
    return { success: true, message: `${linhasParaExcluir.length} linha(s) excluída(s) com sucesso.` };

  } catch (e) {
    console.error("❌ Erro em excluirLinhasDoPedido:", e);
    return { success: false, message: e.toString() };
  }
}
function editarVendaNoSheet(dados) {
  try {
    console.log('✏️ Editando pedido (in-place):', dados);

    // 1. Localizar a planilha correta
    let bancoId = dados.bancoDeDadosId;
    if (!bancoId || bancoId === "null") {
      bancoId = "1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4"; // central
    }
    const ss = SpreadsheetApp.openById(bancoId);
    const sheet = ss.getSheetByName("VENDAS");
    if (!sheet) return { success: false, message: "Aba VENDAS não encontrada." };

    // 2. Encontrar todas as linhas com o mesmo CNPJ e data de venda
    const dataVenda = new Date(dados.dataVenda);
    const dataStr = Utilities.formatDate(dataVenda, "GMT-3", "dd/MM/yyyy");
    const cnpj = dados.cnpj;

    const values = sheet.getDataRange().getValues();
    const linhasEncontradas = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      let dataLinha = "";
      if (row[1] instanceof Date) {
        dataLinha = Utilities.formatDate(row[1], "GMT-3", "dd/MM/yyyy");
      } else {
        const match = String(row[1]).match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (match) dataLinha = `${match[1]}/${match[2]}/${match[3]}`;
      }
      if (String(row[2]).replace(/\D/g, '') === cnpj.replace(/\D/g, '') && dataLinha === dataStr) {
        linhasEncontradas.push(i + 1);
      }
    }

    if (linhasEncontradas.length === 0) {
      return { success: false, message: "Nenhuma linha encontrada para editar." };
    }

    // 3. Atualizar dados fixos em todas as linhas
    const colMap = {
      razaoSocial: 3,   // Coluna D
      ie: 34,           // Coluna AI
      cep: 11,          // Coluna L
      endereco: 12,     // Coluna M
      numero: 13,       // Coluna N
      complemento: 14,  // Coluna O
      bairro: 15,       // Coluna P
      cidade: 16,       // Coluna Q
      uf: 17,           // Coluna R
      cpfAdmin: 18,     // Coluna S
      nomeAdmin: 19,    // Coluna T
      email: 20,        // Coluna U
      contatoFinanceiro: 21, // Coluna V
      modalidade: 4,    // Coluna E
      dataVenc: 0,      // Coluna A
      obs: 35           // Coluna AJ
    };

    for (const linha of linhasEncontradas) {
      for (const [campo, colIndex] of Object.entries(colMap)) {
        if (dados[campo] !== undefined && dados[campo] !== null) {
          sheet.getRange(linha, colIndex + 1).setValue(dados[campo]);
        }
      }
    }

    // 4. Atualizar linhas de produtos (planos)
    // Vamos remover as linhas de produtos antigas (que estão associadas a este pedido)
    // e inserir as novas linhas de produtos.
    // Para isso, primeiro removemos as linhas de produtos antigas (apenas as que têm dados de produto)
    // Mas como não temos um marcador específico, vamos usar as próprias linhas encontradas.
    // Como a planilha pode ter linhas extras, precisamos de um critério de identificação.

    // A abordagem mais segura: excluir as linhas antigas e recriar as novas, mas você pediu para não excluir.
    // Então vamos atualizar as células de produto linha por linha.
    const linhasProdutos = linhasEncontradas; // Assumimos que todas as linhas são de produtos
    const novasLinhas = dados.listaLinhas;

    // Se o número de linhas for diferente, precisamos ajustar (adicionar ou remover linhas)
    while (linhasProdutos.length < novasLinhas.length) {
      // Adicionar uma nova linha (inserir uma linha em branco após a última)
      const ultimaLinha = linhasProdutos[linhasProdutos.length - 1];
      sheet.insertRowAfter(ultimaLinha);
      linhasProdutos.push(ultimaLinha + 1);
    }

    // Atualizar as células de produto nas linhas existentes
    for (let i = 0; i < linhasProdutos.length; i++) {
      const linha = linhasProdutos[i];
      if (i < novasLinhas.length) {
        const produto = novasLinhas[i];
        sheet.getRange(linha, 5 + 1).setValue(dados.modalidade || "PRIMEIRA ATIVAÇÃO"); // Coluna E
        sheet.getRange(linha, 6 + 1).setValue(produto.plano || ""); // Coluna F
        sheet.getRange(linha, 7 + 1).setValue(produto.numeroLinha || ""); // Coluna G
        sheet.getRange(linha, 8 + 1).setValue(produto.valor || 0); // Coluna H
        sheet.getRange(linha, 9 + 1).setValue(produto.operadoraDoadora || "NENHUMA"); // Coluna I
        sheet.getRange(linha, 10 + 1).setValue(dados.consultorVendeu || ""); // Coluna J
      } else {
        // Se houver mais linhas que produtos, limpamos as células extras
        sheet.getRange(linha, 5 + 1, 1, 6).clearContent();
      }
    }

    // Se houver mais produtos que linhas (já inserimos linhas extras acima)
    // Atualizar também a data de venda e status (caso tenha mudado)
    for (const linha of linhasProdutos) {
      sheet.getRange(linha, 1 + 1).setValue(dados.dataVenc || "05");
      sheet.getRange(linha, 2 + 1).setValue(new Date(dados.dataVenda));
    }

    SpreadsheetApp.flush();
    return { success: true, message: "Pedido atualizado com sucesso!" };

  } catch (e) {
    console.error("❌ Erro em editarVendaNoSheet:", e);
    return { success: false, message: e.toString() };
  }
}
function p_editarVendaTIM(dados) {
  try {
    console.log('✏️ Editando venda - dados recebidos:', JSON.stringify(dados));
    
    // 🔥 NORMALIZAÇÃO DA MODALIDADE
    let modalidade = dados.modalidade || "PRIMEIRA ATIVAÇÃO";
    if (modalidade === "RENEGOCIAÇÃO") {
      modalidade = "RENEG.";
    }
    
    // 1. Obtém o bancoDeDadosId
    let bancoId = dados.bancoDeDadosId;
    if (!bancoId || bancoId === "null") {
      bancoId = "1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4";
    }
    const ss = SpreadsheetApp.openById(bancoId);
    const sheet = ss.getSheetByName("VENDAS");
    if (!sheet) return { success: false, message: "Aba VENDAS não encontrada." };

    // 2. Extrair modalidade atual (vinda do frontend)
    const modalidadeAtual = dados.modalidadeAtual || modalidade || "PRIMEIRA ATIVAÇÃO";
    console.log(`🎯 Modalidade atual a editar: ${modalidadeAtual}`);

    // 3. Usar idUnico para encontrar as linhas do pedido
    let todasLinhas = [];
    const idUnico = dados.idUnico;
    if (!idUnico) {
      return { success: false, message: "ID único do pedido não fornecido." };
    }

    const [cnpjAlvo, dataAlvoStr] = idUnico.split("|");
    const cnpjLimpo = cnpjAlvo.replace(/\D/g, '');
    let dataAlvoNormalizada = dataAlvoStr;
    if (dataAlvoStr && dataAlvoStr.includes("-")) {
      const [ano, mes, dia] = dataAlvoStr.split("-");
      dataAlvoNormalizada = `${dia}/${mes}/${ano}`;
    }
    
    console.log(`🔍 Buscando linhas com CNPJ: ${cnpjLimpo} e Data: ${dataAlvoNormalizada}`);
    
    const data = sheet.getDataRange().getValues();
    const linhasPedido = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      let cnpjLinha = String(row[2] || "").replace(/\D/g, '');
      let dataLinha = "";
      if (row[1] instanceof Date) {
        dataLinha = Utilities.formatDate(row[1], "GMT-3", "dd/MM/yyyy");
      } else {
        const match = String(row[1]).match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (match) dataLinha = `${match[1]}/${match[2]}/${match[3]}`;
      }
      if (cnpjLinha === cnpjLimpo && dataLinha === dataAlvoNormalizada) {
        const modalidadeLinha = String(row[4] || "").toUpperCase().trim();
        linhasPedido.push({
          linha: i + 1,
          modalidade: modalidadeLinha,
          dados: row
        });
      }
    }

    console.log(`📊 Total de linhas do pedido: ${linhasPedido.length}`);

    // 4. Filtrar apenas as linhas da modalidade atual
    const linhasParaAtualizar = linhasPedido.filter(item => item.modalidade === modalidadeAtual);
    console.log(`🎯 Linhas com modalidade "${modalidadeAtual}": ${linhasParaAtualizar.length}`);

    if (linhasParaAtualizar.length === 0) {
      return { 
        success: false, 
        message: `Nenhuma linha encontrada com a modalidade "${modalidadeAtual}".` 
      };
    }

    // 5. Atualizar campos fixos (apenas nas linhas da modalidade atual)
    const colMap = {
      razaoSocial: 3,
      ie: 34,
      cep: 11,
      endereco: 12,
      numero: 13,
      complemento: 14,
      bairro: 15,
      cidade: 16,
      uf: 17,
      cpfAdmin: 18,
      nomeAdmin: 19,
      email: 20,
      contatoFinanceiro: 21,
      dataVenc: 0,
      obs: 35,
      consultorVendeu: 9
    };

    for (const item of linhasParaAtualizar) {
      const linha = item.linha;
      for (const [campo, colIndex] of Object.entries(colMap)) {
        let valor = dados[campo];
        if (valor !== undefined && valor !== null) {
          sheet.getRange(linha, colIndex + 1).setValue(valor);
        }
      }
    }

    // 6. Atualizar as linhas de produtos (planos) APENAS para a modalidade atual
    const produtos = dados.listaLinhas || [];
    console.log(`📦 Produtos recebidos para a modalidade "${modalidadeAtual}": ${produtos.length}`);

    // Limpar as colunas de produto das linhas atuais
    for (const item of linhasParaAtualizar) {
      const linha = item.linha;
      sheet.getRange(linha, 6, 1, 4).clearContent(); // F, G, H, I
    }

    // Preencher com os novos produtos (na mesma ordem das linhas)
    for (let i = 0; i < Math.min(produtos.length, linhasParaAtualizar.length); i++) {
      const prod = produtos[i];
      const linha = linhasParaAtualizar[i].linha;
      sheet.getRange(linha, 5).setValue(modalidadeAtual);        // Coluna E (modalidade)
      sheet.getRange(linha, 6).setValue(prod.plano || "");       // Coluna F
      sheet.getRange(linha, 7).setValue(prod.numeroLinha || ""); // Coluna G
      sheet.getRange(linha, 8).setValue(prod.valor || 0);        // Coluna H
      sheet.getRange(linha, 9).setValue(prod.operadoraDoadora || ""); // Coluna I
    }

    // Se houver menos produtos que linhas, as linhas extras ficam vazias (já limpas)
    // Se houver mais produtos que linhas, ignoramos o excesso (não criamos novas linhas)

    // 7. Atualizar status do pedido (apenas se for a última modalidade ou se desejar)
    // Mantemos o status como "PENDENTE DE INPUT" ou podemos deixar como estava.
    // Como o frontend controla a edição modalidade por modalidade, não alteramos o status.

    SpreadsheetApp.flush();

    // 8. Retornar sucesso com informações da modalidade atualizada
    return {
      success: true,
      message: `${linhasParaAtualizar.length} linha(s) da modalidade "${modalidadeAtual}" atualizada(s) com sucesso.`,
      modalidadeAtual: modalidadeAtual,
      linhasAtualizadas: linhasParaAtualizar.length
    };

  } catch (e) {
    console.error("❌ Erro em p_editarVendaTIM:", e);
    return { success: false, message: e.toString() };
  }
}

function p_buscarComissaoParceiro(bancoDeDadosId) {
  // Se bancoDeDadosId for null ou vazio, usar a planilha central
  const ss = bancoDeDadosId ? SpreadsheetApp.openById(bancoDeDadosId) : SpreadsheetApp.openById("1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4");
  const sheet = ss.getSheetByName("COMISSAO");
  if (!sheet) {
    // Retornar valores padrão (ex: 10% para todos)
    return { percentuais: { "Acessos Novos": 10, "ADITIVO": 5, "Migração Pré - Consumer PJ": 8, "Canvas Portabilidade": 12, "Corporate M2M": 15, "VAS": 20, "Renegociação": 7, "Ultra fibra": 10 } };
  }
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { percentuais: {} };
  const linha2 = data[1]; // índice 1 é a linha 2
  // Mapear colunas: A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7
  const modalidades = ["Acessos Novos", "ADITIVO", "Migração Pré - Consumer PJ", "Canvas Portabilidade", "Corporate M2M", "VAS", "Renegociação", "Ultra fibra"];
  const percentuais = {};
  for (let i = 0; i < modalidades.length; i++) {
    percentuais[modalidades[i]] = parseFloat(linha2[i]) || 0;
  }
  return { percentuais };
}


/**
 * Normaliza o percentual lido da planilha
 * Se veio como decimal (ex: 1.0 = 100%), retorna { exibicao: 100, calculo: 1.0 }
 * Se veio como inteiro (ex: 100 = 100%), retorna { exibicao: 100, calculo: 1.0 }
 * @param {number} valor - Valor bruto lido da planilha
 * @returns {Object} { exibicao: number, calculo: number }
 */
function normalizarPercentual(valor) {
  if (typeof valor !== 'number' || isNaN(valor)) {
    return { exibicao: 0, calculo: 0 };
  }
  return {
    exibicao: Math.round(valor * 100),
    calculo: valor
  };
}

/**
 * Remove acentos e caracteres especiais de uma string
 */
function removerAcentos(str) {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .trim()
    .toUpperCase();
}

function p_buscarDashboardComissaoParceiro(bancoDeDadosId, nomeParceiro, mesSelecionado, anoSelecionado) {
  var PLANILHA_CENTRAL = "1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4";
  var ss;
  var isPlanilhaCentral = false;
  
  try {
    if (bancoDeDadosId && bancoDeDadosId !== "null" && bancoDeDadosId !== "") {
      ss = SpreadsheetApp.openById(bancoDeDadosId);
      console.log("📂 Usando planilha individual do parceiro:", ss.getId());
    } else {
      ss = SpreadsheetApp.openById(PLANILHA_CENTRAL);
      isPlanilhaCentral = true;
      console.log("📂 Usando planilha central:", ss.getId());
    }
  } catch (e) {
    ss = SpreadsheetApp.openById(PLANILHA_CENTRAL);
    isPlanilhaCentral = true;
    console.log("⚠️ Falha ao abrir planilha individual, usando central:", ss.getId());
  }

  // 1. LER PERCENTUAIS DA ABA COMISSAO
  var sheetCom = ss.getSheetByName("COMISSAO");
  var chaves = ["Acessos Novos", "ADITIVO", "Migração Pré - Consumer PJ", "Canvas Portabilidade", "Corporate M2M", "VAS", "Renegociação", "Ultra fibra"];
  var percentuaisExibicao = {};
  var multiplicadores = {};
  var percentuaisEncontrados = false;

  if (sheetCom) {
    var dataCom = sheetCom.getDataRange().getValues();
    if (dataCom.length >= 2) {
      var linha2 = dataCom[1];
      for (var i = 0; i < chaves.length; i++) {
        var raw = parseFloat(linha2[i]);
        if (!isNaN(raw)) {
          var norm = normalizarPercentual(raw);
          percentuaisExibicao[chaves[i]] = norm.exibicao;
          multiplicadores[chaves[i]] = norm.calculo;
          percentuaisEncontrados = true;
        }
      }
    }
  }
  if (!percentuaisEncontrados) {
    chaves.forEach(function(k) {
      percentuaisExibicao[k] = 10;
      multiplicadores[k] = 0.10;
    });
  }
  console.log("📊 Percentuais:", percentuaisExibicao);

  // 2. BUSCAR VENDAS
  var hoje = new Date();
  var mesAtual = parseInt(mesSelecionado) || (hoje.getMonth() + 1);
  var anoAtual = parseInt(anoSelecionado) || hoje.getFullYear();
  console.log("🔍 Mês/Ano:", mesAtual, anoAtual);

  var sheetVendas = ss.getSheetByName("VENDAS");
  if (!sheetVendas) {
    console.error("❌ Aba VENDAS não encontrada!");
    return { error: "Aba VENDAS não encontrada" };
  }

  var dados = sheetVendas.getDataRange().getValues();
  console.log("📄 Total de linhas na VENDAS:", dados.length);

  var faturamentoPorModalidade = {};
  chaves.forEach(function(k) { faturamentoPorModalidade[k] = 0; });
  var faturamentoMes = 0;
  var faturamentoAprovadoMes = 0;
  var grossAtivoMes = 0;
  var vendasEncontradas = 0;

  // 🔥 Se for planilha central, precisamos filtrar pelo nome do parceiro
  // Se for planilha individual, pegamos todas as vendas (são todas dele)
  var nomeParceiroNorm = isPlanilhaCentral ? removerAcentos(nomeParceiro) : null;

  for (var i = 1; i < dados.length; i++) {
    var linha = dados[i];

    // 🔥 FILTRO: só aplica se for planilha central
    if (isPlanilhaCentral) {
      var colJ = removerAcentos(linha[9] || "");
      var colK = removerAcentos(linha[10] || "");
      var colAK = removerAcentos(linha[36] || "");
      var ehDoParceiro = (colJ === nomeParceiroNorm || colK === nomeParceiroNorm || colAK === nomeParceiroNorm);
      if (!ehDoParceiro) continue;
    }

    var modalidade = String(linha[4] || "").toUpperCase().trim();
    var valor = parseFloat(linha[7]) || 0;
    if (valor === 0) continue;

    // --- Data de input (coluna B) ---
    var dataVenda = linha[1];
    var mesVenda, anoVenda;
    if (dataVenda instanceof Date) {
      mesVenda = dataVenda.getMonth() + 1;
      anoVenda = dataVenda.getFullYear();
    } else if (typeof dataVenda === 'string') {
      var partes = dataVenda.split(/[\/\-]/);
      if (partes.length === 3) {
        mesVenda = parseInt(partes[1]);
        anoVenda = parseInt(partes[2]);
      } else {
        console.warn("⚠️ Data de input inválida:", dataVenda);
        continue;
      }
    } else {
      console.warn("⚠️ Data de input inválida:", dataVenda);
      continue;
    }

    // 🔥 SÓ CONTABILIZA SE A DATA DE INPUT FOR DO MÊS/ANO SELECIONADO
    if (mesVenda === mesAtual && anoVenda === anoAtual) {
      faturamentoMes += valor;
      vendasEncontradas++;
    }

    // --- Data de ativação RADAR (coluna AK - índice 36) ---
    var dataRadar = linha[36];
    var mesRadar, anoRadar;
    if (dataRadar instanceof Date) {
      mesRadar = dataRadar.getMonth() + 1;
      anoRadar = dataRadar.getFullYear();
    } else if (typeof dataRadar === 'string') {
      var partesRadar = dataRadar.split(/[\/\-]/);
      if (partesRadar.length === 3) {
        mesRadar = parseInt(partesRadar[1]);
        anoRadar = parseInt(partesRadar[2]);
      } else {
        mesRadar = null;
      }
    } else {
      mesRadar = null;
    }

    if (mesRadar === mesAtual && anoRadar === anoAtual) {
      faturamentoAprovadoMes += valor;
      if (modalidade.includes("PRIMEIRA ATIVAÇÃO") || modalidade.includes("NOVA") ||
          modalidade.includes("ADITIVO") || modalidade.includes("PORTABILIDADE")) {
        grossAtivoMes++;
      }
    }

    // --- Mapear modalidade para comissão ---
    var chave = null;
    if (modalidade.includes("PRIMEIRA ATIVAÇÃO") || modalidade.includes("NOVA")) chave = "Acessos Novos";
    else if (modalidade.includes("ADITIVO")) chave = "ADITIVO";
    else if (modalidade.includes("MIGRAÇÃO")) chave = "Migração Pré - Consumer PJ";
    else if (modalidade.includes("PORTABILIDADE")) chave = "Canvas Portabilidade";
    else if (modalidade.includes("M2M")) chave = "Corporate M2M";
    else if (modalidade.includes("VAS")) chave = "VAS";
    else if (modalidade.includes("RENEG")) chave = "Renegociação";
    else if (modalidade.includes("ULTRA FIBRA")) chave = "Ultra fibra";
    else continue;

    if (mesVenda === mesAtual && anoVenda === anoAtual) {
      faturamentoPorModalidade[chave] += valor;
    }
  }

  console.log("📊 Total de vendas encontradas no mês:", vendasEncontradas);
  console.log("💰 faturamentoMes:", faturamentoMes);
  console.log("💰 faturamentoAprovadoMes:", faturamentoAprovadoMes);
  console.log("📱 grossAtivoMes:", grossAtivoMes);

  // 3. CALCULAR COMISSÃO
  var comissaoPorModalidade = {};
  var totalFaturamento = 0;
  var totalComissao = 0;
  chaves.forEach(function(chave) {
    var fat = faturamentoPorModalidade[chave] || 0;
    var mult = multiplicadores[chave] || 0;
    var comissao = fat * mult;
    comissaoPorModalidade[chave] = comissao;
    totalFaturamento += fat;
    totalComissao += comissao;
  });

  return {
    percentuaisExibicao: percentuaisExibicao,
    faturamentoPorModalidade: faturamentoPorModalidade,
    comissaoPorModalidade: comissaoPorModalidade,
    totalFaturamento: totalFaturamento,
    totalComissao: totalComissao,
    faturamentoMes: faturamentoMes,
    faturamentoAprovadoMes: faturamentoAprovadoMes,
    grossAtivoMes: grossAtivoMes
  };
}
// ============================================
// GERENCIAMENTO DE ARQUIVOS EMPRESARIAIS
// ============================================

function uploadArquivoEmpresarial(dados) {
  try {
    console.log('📤 Iniciando upload:', dados);
    
    const pastaNome = "VEXO_ARQUIVOS_EMPRESARIAIS";
    const subPastas = {
      'tabela_precos': 'TABELA_PRECOS',
      'mapa_ofertas': 'MAPA_OFERTAS',
      'book_aparelhos': 'BOOK_APARELHOS'
    };
    
    // Criar pasta principal
    let pastaPai = DriveApp.getFoldersByName(pastaNome);
    let pastaApp = pastaPai.hasNext() ? pastaPai.next() : DriveApp.createFolder(pastaNome);
    
    // Criar subpasta
    let subPastaNome = subPastas[dados.tipo] || 'OUTROS';
    let pastaSub = pastaApp.getFoldersByName(subPastaNome);
    let pastaDestino = pastaSub.hasNext() ? pastaSub.next() : pastaApp.createFolder(subPastaNome);
    
    // Decodificar arquivo
    const base64 = dados.arquivo.split(',')[1];
    const bytes = Utilities.base64Decode(base64);
    const blob = Utilities.newBlob(bytes, '', dados.nome + '.' + dados.extensao);
    
    // Salvar
    const arquivo = pastaDestino.createFile(blob);
    arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    console.log('✅ Arquivo salvo:', arquivo.getId());
    
    return {
      success: true,
      id: arquivo.getId(),
      nome: dados.nome + '.' + dados.extensao,
      url: arquivo.getUrl()
    };
    
  } catch (e) {
    console.error('❌ Erro no upload:', e);
    return { success: false, message: e.toString() };
  }
}

function listarArquivosEmpresariais() {
  try {
    const pastaNome = "VEXO_ARQUIVOS_EMPRESARIAIS";
    const resultado = [];
    
    const pastaPai = DriveApp.getFoldersByName(pastaNome);
    if (!pastaPai.hasNext()) {
      console.log('📂 Pasta principal não encontrada, retornando vazio');
      return resultado;
    }
    
    const pastaApp = pastaPai.next();
    const subPastas = pastaApp.getFolders();
    
    while (subPastas.hasNext()) {
      const subPasta = subPastas.next();
      const nomeSubPasta = subPasta.getName().toLowerCase();
      
      // Mapeia o nome da subpasta para o tipo
      let tipo = '';
      if (nomeSubPasta.includes('tabela')) tipo = 'tabela_precos';
      else if (nomeSubPasta.includes('mapa')) tipo = 'mapa_ofertas';
      else if (nomeSubPasta.includes('book')) tipo = 'book_aparelhos';
      else continue;
      
      const arquivos = subPasta.getFiles();
      while (arquivos.hasNext()) {
        const arquivo = arquivos.next();
        const nome = arquivo.getName();
        const ultimoPonto = nome.lastIndexOf('.');
        const nomeSemExt = ultimoPonto > 0 ? nome.substring(0, ultimoPonto) : nome;
        const extensao = ultimoPonto > 0 ? nome.substring(ultimoPonto + 1) : '';
        
        resultado.push({
          id: arquivo.getId(),
          nome: nomeSemExt,
          extensao: extensao,
          tipo: tipo,
          tamanho: arquivo.getSize(),
          data: arquivo.getDateCreated().getTime(),
          url: arquivo.getUrl()
        });
      }
    }
    
    resultado.sort((a, b) => b.data - a.data);
    console.log('📂 Arquivos listados:', resultado.length);
    return resultado;
    
  } catch (e) {
    console.error('❌ Erro ao listar:', e);
    return [];
  }
}

function baixarArquivoEmpresarial(id) {
  try {
    const arquivo = DriveApp.getFileById(id);
    const bytes = arquivo.getBlob().getBytes();
    return {
      success: true,
      base64: Utilities.base64Encode(bytes),
      nome: arquivo.getName()
    };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function visualizarArquivoEmpresarial(id) {
  try {
    const arquivo = DriveApp.getFileById(id);
    return {
      success: true,
      url: arquivo.getUrl()
    };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function excluirArquivoEmpresarial(id) {
  try {
    const arquivo = DriveApp.getFileById(id);
    arquivo.setTrashed(true);
    return { success: true };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

/**
 * Busca comissão completa de um parceiro, incluindo vendas detalhadas.
 * Detecta automaticamente se a aba COMISSAO é simplificada (2 colunas) ou detalhada (8 colunas).
 * @param {string} bancoDeDadosId - ID da planilha do parceiro (ou null para central)
 * @param {string} nomeParceiro - Nome do parceiro (para filtrar na central)
 * @param {string|number} mes - Mês (1-12)
 * @param {string|number} ano - Ano (ex: 2026)
 * @returns {Object} { success, totais, vendas, percentuais, estrutura, planilhaUsada }
 */
function p_getComissaoParceiroCompleta(bancoDeDadosId, nomeParceiro, mes, ano) {
  try {
    const PLANILHA_CENTRAL = "1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4";
    let ss;
    let isCentral = false;

    if (bancoDeDadosId && bancoDeDadosId !== "null" && bancoDeDadosId !== "") {
      try {
        ss = SpreadsheetApp.openById(bancoDeDadosId);
      } catch (e) {
        ss = SpreadsheetApp.openById(PLANILHA_CENTRAL);
        isCentral = true;
      }
    } else {
      ss = SpreadsheetApp.openById(PLANILHA_CENTRAL);
      isCentral = true;
    }

    // ============================================================
    // 1. LER A ABA COMISSAO E DETECTAR A ESTRUTURA
    // ============================================================
    const sheetCom = ss.getSheetByName("COMISSAO");
    let percentuais = {};
    let estrutura = null; // 'simplificado' ou 'detalhado'
    let debugInfo = {};

    if (sheetCom) {
      // Pega os dados da aba COMISSAO (incluindo formatação)
      const dadosCom = sheetCom.getDataRange().getDisplayValues();
      if (dadosCom.length >= 2) {
        // Cabeçalho (linha 1)
        const cabecalho = dadosCom[0];
        // Conta quantas colunas não vazias
        let numColunas = 0;
        for (let i = 0; i < cabecalho.length; i++) {
          if (cabecalho[i] && String(cabecalho[i]).trim() !== "") {
            numColunas++;
          } else {
            break;
          }
        }

        // Linha 2: percentuais
        const linhaPercentuais = dadosCom[1];

        // Função para extrair número de uma string (ex: "100%" → 100, "1,5%" → 1.5)
        function extrairNumero(valor) {
          if (typeof valor === 'number') return valor;
          if (typeof valor === 'string') {
            let str = valor.trim().replace(/%/g, '').replace(/,/g, '.').replace(/[^0-9.]/g, '');
            if (str === '') return 0;
            let num = parseFloat(str);
            return isNaN(num) ? 0 : num;
          }
          return 0;
        }

        if (numColunas === 2) {
          // Simplificado: Coluna A = Vendas, Coluna B = Renegociação
          estrutura = 'simplificado';
          let pVendas = extrairNumero(linhaPercentuais[0]);
          let pReneg = extrairNumero(linhaPercentuais[1]);
          
          // Normaliza: se < 1, multiplica por 100 (assumindo que veio como decimal)
          if (pVendas > 0 && pVendas < 1) pVendas *= 100;
          if (pReneg > 0 && pReneg < 1) pReneg *= 100;
          
          // Arredonda para inteiro
          pVendas = Math.round(pVendas);
          pReneg = Math.round(pReneg);
          
          // Se ainda for zero, usa fallback
          if (pVendas === 0) pVendas = 10;
          if (pReneg === 0) pReneg = 10;
          
          percentuais = {
            'PRIMEIRA ATIVAÇÃO': pVendas,
            'ADITIVO': pVendas,
            'MIGRAÇÃO': pVendas,
            'PORTABILIDADE': pVendas,
            'M2M': pVendas,
            'VAS': pVendas,
            'ULTRA FIBRA': pVendas,
            'Renegociação': pReneg,
            // Para compatibilidade com estrutura detalhada
            'Acessos Novos': pVendas,
            'Canvas Portabilidade': pVendas,
            'Corporate M2M': pVendas
          };
          debugInfo = { estrutura, pVendas, pReneg };
        } else if (numColunas >= 8) {
          // Detalhado: 8 colunas (Acessos Novos, ADITIVO, Migração, Portabilidade, M2M, VAS, Renegociação, Ultra fibra)
          estrutura = 'detalhado';
          const colunas = [
            'Acessos Novos',
            'ADITIVO',
            'Migração Pré - Consumer PJ',
            'Canvas Portabilidade',
            'Corporate M2M',
            'VAS',
            'Renegociação',
            'Ultra fibra'
          ];
          for (let i = 0; i < Math.min(colunas.length, numColunas); i++) {
            let val = extrairNumero(linhaPercentuais[i]);
            if (val > 0 && val < 1) val *= 100;
            val = Math.round(val); // arredonda para inteiro
            if (val === 0) val = 10; // fallback
            percentuais[colunas[i]] = val;
          }
          debugInfo = { estrutura, percentuaisLidos: {...percentuais} };
        }
      }
    }

    // Fallback se não encontrou nada
    if (Object.keys(percentuais).length === 0) {
      percentuais = {
        'PRIMEIRA ATIVAÇÃO': 10,
        'ADITIVO': 10,
        'MIGRAÇÃO': 10,
        'PORTABILIDADE': 10,
        'M2M': 10,
        'VAS': 10,
        'ULTRA FIBRA': 10,
        'Renegociação': 10,
        'Acessos Novos': 10,
        'Canvas Portabilidade': 10,
        'Corporate M2M': 10
      };
    }

    // ============================================================
    // 2. BUSCAR VENDAS DA ABA VENDAS
    // ============================================================
    const sheetVendas = ss.getSheetByName("VENDAS");
    if (!sheetVendas) {
      return { success: false, message: "Aba VENDAS não encontrada." };
    }

    const dados = sheetVendas.getDataRange().getValues();
    const colDataAJ = 35; // AJ
    const colMod = 4;     // E
    const colVal = 7;     // H
    const colCli = 3;     // D
    const colLinha = 6;   // G
    const colDataVenda = 1; // B
    const colVendedor = 9;  // J
    const colCnpj = 2;      // C (para extrair o CNPJ do parceiro)

    const mesAlvo = parseInt(mes);
    const anoAlvo = parseInt(ano);
    const nomeParceiroNorm = nomeParceiro ? String(nomeParceiro).toUpperCase().trim() : "";

    let vendas = [];
    let totais = {
      receita: 0,
      gross: 0,
      portabilidade: 0,
      renegQtd: 0,
      renegVal: 0,
      comissaoTotal: 0
    };
    let cnpjParceiro = '';

    // Mapeamento de modalidade → chave de percentual
    function getChavePercentual(modalidade) {
      const mod = modalidade.toUpperCase().trim();
      if (mod.includes('PRIMEIRA ATIVAÇÃO') || mod.includes('NOVA')) {
        return estrutura === 'detalhado' ? 'Acessos Novos' : 'PRIMEIRA ATIVAÇÃO';
      } else if (mod.includes('ADITIVO')) {
        return 'ADITIVO';
      } else if (mod.includes('MIGRAÇÃO')) {
        return estrutura === 'detalhado' ? 'Migração Pré - Consumer PJ' : 'MIGRAÇÃO';
      } else if (mod.includes('PORTABILIDADE')) {
        return estrutura === 'detalhado' ? 'Canvas Portabilidade' : 'PORTABILIDADE';
      } else if (mod.includes('RENEG')) {
        return 'Renegociação';
      } else if (mod.includes('M2M')) {
        return estrutura === 'detalhado' ? 'Corporate M2M' : 'M2M';
      } else if (mod.includes('VAS')) {
        return 'VAS';
      } else if (mod.includes('ULTRA FIBRA')) {
        return estrutura === 'detalhado' ? 'Ultra fibra' : 'ULTRA FIBRA';
      } else {
        // Fallback: tenta encontrar a chave por similaridade
        return mod;
      }
    }

    for (let i = 1; i < dados.length; i++) {
      const linha = dados[i];

      // Filtro por parceiro (se for planilha central)
      if (isCentral) {
        const vendedor = String(linha[colVendedor] || "").toUpperCase().trim();
        if (vendedor !== nomeParceiroNorm) continue;
      }

      // Data de validação AJ
      const valAJ = linha[colDataAJ];
      if (!valAJ || valAJ === "") continue;

      let dataValidacao = null;
      if (valAJ instanceof Date) {
        dataValidacao = valAJ;
      } else if (typeof valAJ === 'string') {
        const partes = valAJ.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (partes) {
          dataValidacao = new Date(partes[3], partes[2]-1, partes[1]);
        }
      }
      if (!dataValidacao || isNaN(dataValidacao.getTime())) continue;

      const mesVenda = dataValidacao.getMonth() + 1;
      const anoVenda = dataValidacao.getFullYear();
      if (mesVenda !== mesAlvo || anoVenda !== anoAlvo) continue;

      // Captura o CNPJ da primeira venda encontrada
      if (!cnpjParceiro && linha[colCnpj]) {
        cnpjParceiro = String(linha[colCnpj]).replace(/\D/g, '');
      }

      const modalidade = String(linha[colMod] || "").toUpperCase().trim();
      const valor = parseFloat(linha[colVal]) || 0;
      const cliente = linha[colCli] || "";
      const linhaTel = linha[colLinha] || "";
      const dataVenda = linha[colDataVenda] || "";

      // Determinar percentual
      let chave = getChavePercentual(modalidade);
      let perc = percentuais[chave] !== undefined ? percentuais[chave] : 10;

      // Se for simplificado e não for Reneg, usa o mesmo de vendas
      if (estrutura === 'simplificado' && !modalidade.includes('RENEG')) {
        perc = percentuais['PRIMEIRA ATIVAÇÃO'] || 10;
      }

      let comissao = valor * (perc / 100);

      // Acumular totais
      totais.receita += valor;
      if (modalidade.includes('PORTABILIDADE')) {
        totais.portabilidade += valor;
      }
      if (modalidade.includes('RENEG')) {
        totais.renegQtd++;
        totais.renegVal += valor;
      }
      if (!modalidade.includes('MIGRAÇÃO') && !modalidade.includes('RENEG')) {
        totais.gross++;
      }
      totais.comissaoTotal += comissao;

      vendas.push({
        data: dataVenda instanceof Date ? Utilities.formatDate(dataVenda, "GMT-3", "dd/MM/yyyy") : String(dataVenda),
        cliente: cliente,
        modalidade: modalidade,
        linha: linhaTel,
        valor: valor,
        comissaoBase: (modalidade.includes('PORTABILIDADE') || modalidade.includes('RENEG')) ? 0 : comissao,
        comissaoPort: modalidade.includes('PORTABILIDADE') ? comissao : 0,
        comissaoReneg: modalidade.includes('RENEG') ? comissao : 0,
        comissaoTotal: comissao
      });
    }

    // Se ainda não encontrou CNPJ, tenta extrair da primeira venda (fallback)
    if (!cnpjParceiro && vendas.length > 0) {
      // Tenta buscar o CNPJ das vendas já processadas
      // Não temos o CNPJ armazenado nas vendas, então vamos tentar de novo
      for (let i = 1; i < dados.length; i++) {
        const linha = dados[i];
        if (isCentral) {
          const vendedor = String(linha[colVendedor] || "").toUpperCase().trim();
          if (vendedor !== nomeParceiroNorm) continue;
        }
        if (linha[colCnpj]) {
          cnpjParceiro = String(linha[colCnpj]).replace(/\D/g, '');
          break;
        }
      }
    }

    return {
      success: true,
      totais: totais,
      vendas: vendas,
      percentuais: percentuais,
      estrutura: estrutura,
      planilhaUsada: ss.getId(),
      cnpjParceiro: cnpjParceiro, // 🔥 NOVO: CNPJ do parceiro para montar a chave única
      debug: debugInfo
    };

  } catch (e) {
    console.error("Erro em p_getComissaoParceiroCompleta:", e);
    return { success: false, message: e.toString() };
  }
}

/**
 * Salva ou atualiza o status de pagamento de uma venda de parceiro.
 * @param {string} chaveUnica - Identificador único da venda (ex: CNPJ|DATA|LINHA|MODALIDADE)
 * @param {string} status - 'PENDENTE', 'PAGO', 'NAO_PAGO'
 * @param {number} comissaoAprovada - Valor da comissão aprovada (opcional, mantém a anterior se não informado)
 * @param {string} bancoDeDadosId - ID da planilha do parceiro
 * @param {string} usuario - Nome do usuário que fez a ação
 * @returns {Object} { success, message }
 */
function p_salvarStatusPagamentoParceiro(chaveUnica, status, comissaoAprovada, bancoDeDadosId, usuario) {
  try {
    const PLANILHA_CENTRAL = "1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4";
    let ss;
    
    if (bancoDeDadosId && bancoDeDadosId !== "null" && bancoDeDadosId !== "") {
      try {
        ss = SpreadsheetApp.openById(bancoDeDadosId);
      } catch (e) {
        ss = SpreadsheetApp.openById(PLANILHA_CENTRAL);
      }
    } else {
      ss = SpreadsheetApp.openById(PLANILHA_CENTRAL);
    }

    let sheet = ss.getSheetByName("PAGAMENTOS_PARCEIROS");
    if (!sheet) {
      sheet = ss.insertSheet("PAGAMENTOS_PARCEIROS");
      sheet.appendRow(["CHAVE_UNICA", "STATUS", "COMISSAO_APROVADA", "DATA_ATUALIZACAO", "USUARIO"]);
      sheet.getRange("A1:E1").setFontWeight("bold").setBackground("#1e3c72").setFontColor("white");
    }

    const dados = sheet.getDataRange().getValues();
    let linhaExistente = -1;
    for (let i = 1; i < dados.length; i++) {
      if (String(dados[i][0]) === String(chaveUnica)) {
        linhaExistente = i + 1;
        break;
      }
    }

    const agora = new Date();
    const dataFormatada = Utilities.formatDate(agora, "GMT-3", "dd/MM/yyyy HH:mm:ss");

    if (linhaExistente !== -1) {
      // Atualizar registro existente
      if (status !== undefined && status !== null) {
        sheet.getRange(linhaExistente, 2).setValue(status);
      }
      if (comissaoAprovada !== undefined && comissaoAprovada !== null) {
        sheet.getRange(linhaExistente, 3).setValue(comissaoAprovada);
      }
      sheet.getRange(linhaExistente, 4).setValue(dataFormatada);
      sheet.getRange(linhaExistente, 5).setValue(usuario || "Sistema");
    } else {
      // Inserir novo registro
      const novaLinha = [
        chaveUnica,
        status || "PENDENTE",
        comissaoAprovada || 0,
        dataFormatada,
        usuario || "Sistema"
      ];
      sheet.appendRow(novaLinha);
    }

    SpreadsheetApp.flush();
    return { success: true, message: "Status atualizado com sucesso!" };
  } catch (e) {
    console.error("Erro em p_salvarStatusPagamentoParceiro:", e);
    return { success: false, message: e.toString() };
  }
}

/**
 * Busca os status de pagamento para uma lista de vendas (otimizado).
 * @param {Array} chavesUnicas - Array de strings com as chaves únicas
 * @param {string} bancoDeDadosId - ID da planilha do parceiro
 * @returns {Object} Mapeamento chave -> { status, comissaoAprovada }
 */
function p_buscarStatusPagamentoParceiro(chavesUnicas, bancoDeDadosId) {
  try {
    const PLANILHA_CENTRAL = "1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4";
    let ss;
    
    if (bancoDeDadosId && bancoDeDadosId !== "null" && bancoDeDadosId !== "") {
      try {
        ss = SpreadsheetApp.openById(bancoDeDadosId);
      } catch (e) {
        ss = SpreadsheetApp.openById(PLANILHA_CENTRAL);
      }
    } else {
      ss = SpreadsheetApp.openById(PLANILHA_CENTRAL);
    }

    const sheet = ss.getSheetByName("PAGAMENTOS_PARCEIROS");
    if (!sheet) {
      return {};
    }

    const dados = sheet.getDataRange().getValues();
    const mapa = {};
    for (let i = 1; i < dados.length; i++) {
      const chave = String(dados[i][0]);
      if (chavesUnicas.includes(chave)) {
        mapa[chave] = {
          status: dados[i][1] || "PENDENTE",
          comissaoAprovada: parseFloat(dados[i][2]) || 0,
          dataAtualizacao: dados[i][3],
          usuario: dados[i][4]
        };
      }
    }
    return mapa;
  } catch (e) {
    console.error("Erro em p_buscarStatusPagamentoParceiro:", e);
    return {};
  }
}