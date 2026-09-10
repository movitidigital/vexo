/**
 * SISTEMA ERP INTEGRADO - VEXO HUB
 * Configuração de Bases de Dados Separadas
 */

const ID_PLANILHA_PROPRIO = "1ULyXmZjrHlTXJ7cl0jlL_ugriHzZ4W8Q-6ExvkPm6qg";
const ID_PLANILHA_PARCEIROS = "1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4";

// Função utilitária para obter a planilha correta conforme o contexto
// Certifique-se que esta função existe no code.gs
function getDb(tipoContexto) {
  const ID_PLANILHA_PROPRIO = "1ULyXmZjrHlTXJ7cl0jlL_ugriHzZ4W8Q-6ExvkPm6qg";
  const ID_PLANILHA_PARCEIROS = "1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4";
  const id = (tipoContexto === 'PARCEIRO') ? ID_PLANILHA_PARCEIROS : ID_PLANILHA_PROPRIO;
  return SpreadsheetApp.openById(id);
}

/**
 * SISTEMA ERP INTEGRADO - GOOGLE APPS SCRIPT
 * Versão: 5.0 (Gestão de Usuários, Permissões e Perfil com Foto)
 */

function doGet(e) {
  // Verificar se há parâmetro de página
  const page = e && e.parameter && e.parameter.page;
  const usuarioLogado = e && e.parameter && e.parameter.session 
    ? JSON.parse(e.parameter.session) 
    : null;
  
  // Se for solicitação de página específica
  if (page === 'dashboard_parceiro') {
    return HtmlService.createTemplateFromFile('dashboard_parceiro')
      .evaluate()
      .setTitle('VEXO HUB | Parceiro')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  // Página de pesquisa de satisfação
  if (page === 'pesquisa') {
    return HtmlService.createTemplateFromFile('pesquisa_satisfacao')
      .evaluate()
      .setTitle('VEXO HUB | Avaliação')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  // Login padrão
  return HtmlService.createTemplateFromFile('login')
    .evaluate()
    .setTitle('VEXO HUB | Login')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Inclusão de arquivos
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
function loadModule(pageName, tipoAcesso) {
  try {
    const contexto = (tipoAcesso || 'PROPRIO').toUpperCase().trim();
    let arquivoNome = pageName.toLowerCase().trim();

    console.log(`🔍 Carregando módulo: ${pageName} | Contexto: ${contexto} | Arquivo base: ${arquivoNome}`);

    // Lista de módulos sem sufixo
    const modulosSemSufixo = [
  'pedidos_gestao',
  'dashboard',
  'login',
  'home_freelancer',
  'meus_pedidos'   // 🔥 ADICIONADO
];

    // Decisão do nome do arquivo
    if (modulosSemSufixo.includes(arquivoNome)) {
      console.log(`📦 Módulo especial (sem sufixo): ${arquivoNome}`);
    } else if (contexto === 'PARCEIRO' && !arquivoNome.endsWith('_parceiro')) {
      arquivoNome = arquivoNome + '_parceiro';
      console.log(`📦 Adicionando sufixo _parceiro: ${arquivoNome}`);
    }

    console.log(`✅ Nome final do arquivo: ${arquivoNome}.html`);

    // Tentativa de carregar o arquivo
    let html;
    try {
      html = HtmlService.createHtmlOutputFromFile(arquivoNome).getContent();
    } catch (fileError) {
      console.error(`❌ Erro ao acessar o arquivo ${arquivoNome}.html:`, fileError.message);
      // Se for home_freelancer e falhar, tenta carregar home_parceiro como fallback
      if (arquivoNome === 'home_freelancer') {
        console.warn(`⚠️ O módulo ${arquivoNome} não foi encontrado. Exibindo fallback.`);
        html = HtmlService.createHtmlOutputFromFile('home_parceiro').getContent();
        // Adiciona um aviso visual no topo
        html = `<div style="background:#fef3c7; padding:10px; text-align:center; border-bottom:2px solid #f59e0b; color:#92400e; font-weight:600;">⚠️ O módulo home_freelancer ainda não foi criado. Exibindo o dashboard padrão de parceiro temporariamente.</div>` + html;
        return html;
      }
      throw fileError; // Se não for o freelancer, repassa o erro
    }

    console.log(`✅ Módulo ${arquivoNome} carregado com sucesso!`);
    return html;

  } catch (e) {
    console.error(`❌ Erro ao carregar módulo [${pageName}]:`, e.message);
    return `
      <div style="padding: 60px 20px; text-align: center; font-family: 'Inter', sans-serif;">
        <div style="background: white; padding: 40px; border-radius: 24px; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0;">
          <span style="font-size: 48px; display: block; margin-bottom: 20px;">📦</span>
          <h2 style="font-weight: 700; font-size: 20px; margin-bottom: 10px; color: #1e293b;">
            Módulo em construção
          </h2>
          <p style="color: #64748b; line-height: 1.6; margin-bottom: 20px;">
            O arquivo <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${pageName}.html</code> 
            não foi encontrado no sistema.
          </p>
          <p style="font-size: 12px; color: #94a3b8; margin-bottom: 20px;">
            Erro: ${e.message}
          </p>
          <button onclick="location.reload()" style="padding: 10px 24px; background: #1e293b; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600;">
            Recarregar Página
          </button>
        </div>
      </div>
    `;
  }
}

function getPerfilUsuario() {
  try {
    // 🔥 TENTA PEGAR O USUÁRIO PELA SESSÃO DO FRONTEND
    // Como o Google Apps Script não tem acesso direto ao sessionStorage,
    // precisamos de uma abordagem diferente
    
    const emailLogado = Session.getActiveUser().getEmail().toLowerCase();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("USERS");
    
    if (!sheet) return { email: emailLogado, cargo: "VISITANTE" };

    const dados = sheet.getDataRange().getValues();
    
    // 🔥 IMPORTANTE: Seu sistema usa MATRÍCULA (Coluna A) como login
    // Mas getPerfilUsuario usa EMAIL (Coluna E)
    // Vamos tentar ambas as formas
    
    // 1. TENTA POR EMAIL PRIMEIRO
    for (let i = 1; i < dados.length; i++) {
      const emailBase = String(dados[i][4] || "").toLowerCase().trim(); // Coluna E
      const cargoBase = String(dados[i][5] || "").toUpperCase().trim(); // Coluna F
      
      if (emailBase === emailLogado && emailLogado !== "") {
        return {
          email: emailLogado,
          cargo: cargoBase,
          nome: String(dados[i][2]).toUpperCase(),
          matricula: String(dados[i][0])
        };
      }
    }
    
    // 2. SE NÃO ACHOU POR EMAIL, TENTA PEGAR DA SESSÃO (Passado pelo frontend)
    // Esta função será chamada com parâmetros do frontend
    return { email: emailLogado, cargo: "VISITANTE", nome: "USUÁRIO" };
    
  } catch (e) {
    console.error("Erro em getPerfilUsuario:", e);
    return { email: "erro", cargo: "ERRO" };
  }
}




// --- MÓDULO DE GESTÃO DE USUÁRIOS ---

function getListaUsuariosDetalhada() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName("USERS");
  if (!sh) return [];

  const data = sh.getDataRange().getDisplayValues(); // Pega como texto formatado
  const usuarios = [];

  for (let i = 1; i < data.length; i++) {
    usuarios.push({
      user: data[i][0],      // Matrícula (Login)
      nome: data[i][2],      // Nome
      sobrenome: data[i][3], // Sobrenome
      email: data[i][4],     // Email
      role: data[i][5],      // Cargo
      active: data[i][6],    // Status (Ex: ATIVO)
      permissoes: data[i][7] ? data[i][7].split(',') : [],
      photoUrl: data[i][8]   // URL da Foto
    });
  }
  return usuarios; // Se retornar vazio aqui, a tabela não carrega
}

function salvarUsuarioCompleto(dados) {
  try {
    const ss = SpreadsheetApp.getActive();
    const sh = ss.getSheetByName("USERS");
    if (!sh) return { success: false, message: "Erro: Aba 'USERS' não encontrada." };

    const data = sh.getDataRange().getValues();
    const matricula = dados.user.toString().trim();
    
    // Preparar os dados na ordem da planilha:
    // [0]Matrícula, [1]Senha, [2]Nome, [3]Sobrenome, [4]Email, [5]Cargo, [6]Status, [7]Perms, [8]Foto
    let novaLinha = [
      matricula,
      dados.pass,
      dados.nome,
      dados.sobrenome,
      dados.email,
      dados.role,
      dados.active,
      dados.permissoes.join(','),
      dados.photoUrl
    ];

    // Lógica de Busca para Edição
    let linhaEncontrada = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString().trim() === matricula) {
        linhaEncontrada = i + 1;
        // Se estiver editando e a senha estiver vazia no form, mantém a senha atual da planilha
        if (!dados.pass || dados.pass.trim() === "") {
          novaLinha[1] = data[i][1];
        }
        break;
      }
    }

    if (linhaEncontrada !== -1) {
      // ATUALIZAÇÃO (EDIÇÃO)
      sh.getRange(linhaEncontrada, 1, 1, novaLinha.length).setValues([novaLinha]);
      return { success: true, message: "Colaborador " + dados.nome + " atualizado com sucesso!" };
    } else {
      // NOVO CADASTRO
      if (!dados.pass || dados.pass.trim() === "") {
        return { success: false, message: "Erro: Defina uma senha para o novo colaborador." };
      }
      sh.appendRow(novaLinha);
      return { success: true, message: "Novo colaborador " + dados.nome + " cadastrado com sucesso!" };
    }
  } catch (e) {
    return { success: false, message: "Erro no servidor: " + e.toString() };
  }
}

// --- MÓDULO DE VENDAS ---

function registrarVenda(dados) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName("VENDAS") || ss.insertSheet("VENDAS");
  
  if (sh.getLastRow() === 0) {
    sh.appendRow(["DATA", "VENDEDOR", "CLIENTE", "PRODUTO", "VALOR", "EMAIL", "COMISSÃO", "STATUS PAGAMENTO"]);
  }

  const valorVenda = parseFloat(dados.valor.toString().replace(',', '.'));
  const comissao = valorVenda * 0.10; 

  try {
    sh.appendRow([
      new Date(), 
      dados.vendedor, 
      dados.cliente, 
      dados.produto, 
      valorVenda, 
      dados.email, 
      comissao, 
      "Pendente"
    ]);

    if(dados.email && dados.email.includes("@")) {
      MailApp.sendEmail({
        to: dados.email,
        subject: "Confirmação de Pedido - " + dados.cliente,
        htmlBody: `<h2>Olá, ${dados.cliente}!</h2><p>Seu pedido de <b>${dados.produto}</b> no valor de <b>R$ ${valorVenda.toFixed(2)}</b> foi registrado.</p>`
      });
    }

    return { success: true };
  } catch(e) {
    return { success: false, message: e.message };
  }
}


// --- MÓDULO DE PROSPECÇÃO ---

function getVendedoresAtivos() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName("USERS"); // Aba confirmada
  
  if (!sh) return [{matricula: 'ERRO', nome: 'Aba USERS não encontrada'}];
  
  const data = sh.getDataRange().getValues();
  const vendedores = [];

  // Ajuste conforme suas colunas: A=Matrícula, C=Nome, D=Sobrenome, G=Status
  for (let i = 1; i < data.length; i++) {
    const matricula = data[i][0]; // Coluna A
    const nome = data[i][2];      // Coluna C
    const sobrenome = data[i][3]; // Coluna D
    const status = data[i][6];    // Coluna G

    // Filtra pelo Status "Ativo"
    if (status && status.toString().trim() === "Ativo") {
      vendedores.push({
        matricula: matricula,
        nomeCompleto: `${nome} ${sobrenome}`
      });
    }
  }
  return vendedores;
}

/**
 * Salva metas individuais (Array de objetos)
 */
function salvarMetasIndividuais(listaMetas) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('METAS_INDIVIDUAIS') || ss.insertSheet('METAS_INDIVIDUAIS');
  
  listaMetas.forEach(m => {
    sheet.appendRow([m.mes, m.ano, m.matricula, m.nome, m.fat, m.port, m.reneg]);
  });
  return "Metas registradas com sucesso!";
}

/**
 * Registra a prospecção seguindo a ordem rigorosa de colunas A até T.
 * CONTATO ALT. movido para a penúltima coluna (S) e ORIGEM na última coluna (T).
 * CÓDIGO gerado de forma sequencial (ex: L-1000, L-1001...).
 */
function registrarProspeccao(dados) {
  try {
    // 🔍 LOG PARA DEBUG NO APPS SCRIPT
    console.log("=== DADOS RECEBIDOS NO SERVIDOR ===");
    console.log("tipoCliente:", dados.tipoCliente);
    console.log("dataAbertura:", dados.dataAbertura);
    console.log("naturezaJuridica:", dados.naturezaJuridica);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("PROSPECCAO") || ss.insertSheet("PROSPECCAO");
    
    // 1. Verificar se o cabeçalho está correto (com a nova coluna X)
    if (sheet.getLastRow() === 0) {
      const cabecalho = [
        "CÓDIGO", "DATA REGISTRO", "CNPJ", "RAZÃO SOCIAL", "ADMINISTRADOR", 
        "CONTATO CNPJ", "FIDELIDADE", "CEP", "LOGRADOURO", "Nº", "BAIRRO", 
        "CIDADE", "UF", "COMPL.", "STATUS", "USUARIO LANÇOU", "USUARIO CAPTOU", 
        "OBSERVAÇÕES", "CONTATO ALT.", "ORIGEM", 
        "",  // Coluna T (reservada)
        "NATUREZA JURÍDICA",   // Coluna U (21)
        "DATA ABERTURA",       // Coluna V (22)
        "TIPO CLIENTE",        // Coluna W (23)
        "ULTIMA_ATUALIZACAO"   // Coluna X (24) ← NOVA
      ];
      sheet.appendRow(cabecalho);
      sheet.getRange("A1:X1").setFontWeight("bold").setBackground("#2c3e50").setFontColor("white");
    }

    // 2. LÓGICA DO CÓDIGO SEQUENCIAL
    let codigoGerado = "L-1000";
    const ultimaLinha = sheet.getLastRow();

    if (ultimaLinha > 1) {
      const ultimoCodigo = String(sheet.getRange(ultimaLinha, 1).getValue());
      const apenasNumeros = ultimoCodigo.replace(/\D/g, '');
      if (apenasNumeros !== "") {
        const proximoNumero = parseInt(apenasNumeros, 10) + 1;
        codigoGerado = "L-" + proximoNumero;
      }
    }

    const dataAgora = new Date();
    const razaoSocial = (dados.razao || "SEM RAZÃO").toUpperCase();
    const statusAtual = (dados.status || "DISPONÍVEL").toUpperCase();
    
    const enderecoFinal = dados.logradouro || dados.endereco || "";
    const ufFinal = dados.estado || dados.uf || "";

    // 3. Montagem da Linha (agora com 24 colunas: A até X)
    // A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9, K=10, L=11, M=12,
    // N=13, O=14, P=15, Q=16, R=17, S=18, T=19, U=20, V=21, W=22, X=23
    const linhaDados = [
      codigoGerado,                     // A (0)
      dataAgora,                        // B (1)
      dados.cnpj || "",                 // C (2)
      razaoSocial,                      // D (3)
      dados.admin || "",                // E (4)
      dados.contato || "",              // F (5)
      dados.fidelidade || "",           // G (6)
      dados.cep || "",                  // H (7)
      enderecoFinal,                    // I (8)
      dados.numero || "",               // J (9)
      dados.bairro || "",               // K (10)
      dados.cidade || "",               // L (11)
      ufFinal,                          // M (12)
      dados.complemento || "",          // N (13)
      statusAtual,                      // O (14)
      dados.usuario || "SISTEMA",       // P (15)
      "",                               // Q (16) - USUARIO CAPTOU
      dados.obs || "",                  // R (17)
      dados.contato_alt || "",          // S (18)
      dados.origem || "",               // T (19)
      dados.naturezaJuridica || "",     // U (20)
      dados.dataAbertura || "",         // V (21)
      dados.tipoCliente || "",          // W (22)
      dataAgora                         // X (23) - ULTIMA_ATUALIZACAO (mesma data de criação)
    ];

    // 🔍 LOG DA LINHA QUE SERÁ GRAVADA
    console.log("Linha a ser gravada:", JSON.stringify(linhaDados));

    sheet.appendRow(linhaDados);
    SpreadsheetApp.flush();

    return { 
      success: true, 
      codigo: codigoGerado 
    };

  } catch (e) {
    console.error("Erro no Servidor: " + e.toString());
    return { 
      success: false, 
      message: "Erro no Servidor: " + e.toString() 
    };
  }
}

// --- FUNÇÃO PARA SALVAR FOTO NO GOOGLE DRIVE ---

function uploadFotoPerfil(base64Data, fileName) {
  try {
    // 1. Localizar ou criar a estrutura de pastas
    const nomePastaPai = "appssheet";
    const nomePastaFotos = "FOTOPERFIL";
    
    let pastaPai = DriveApp.getFoldersByName(nomePastaPai);
    let pastaApp = pastaPai.hasNext() ? pastaPai.next() : DriveApp.createFolder(nomePastaPai);
    
    let pastaFotosIter = pastaApp.getFoldersByName(nomePastaFotos);
    let pastaDestino = pastaFotosIter.hasNext() ? pastaFotosIter.next() : pastaApp.createFolder(nomePastaFotos);
    
    // 2. Limpar foto antiga do usuário (opcional, para não lotar o Drive)
    let arquivosAntigos = pastaDestino.getFilesByName(fileName);
    while (arquivosAntigos.hasNext()) {
      arquivosAntigos.next().setTrashed(true);
    }
    
    // 3. Decodificar e Salvar o novo arquivo
    const contentType = base64Data.substring(5, base64Data.indexOf(';'));
    const bytes = Utilities.base64Decode(base64Data.split(',')[1]);
    const blob = Utilities.newBlob(bytes, contentType, fileName);
    
    const arquivo = pastaDestino.createFile(blob);
    
    // --- O PULO DO GATO ESTÁ AQUI ---
    // Define permissão pública de visualização para evitar erro 403 no navegador
    arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const fileId = arquivo.getId();
    
    // 4. Retornar a URL de Thumbnail (Formato compatível com o Frontend)
    // O parâmetro sz=w300 define o tamanho, carregando mais rápido que a imagem original
    const urlThumbnail = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w300";
    
    return { 
      success: true, 
      url: urlThumbnail 
    };
    
  } catch (e) {
    return { success: false, message: "Erro no Upload: " + e.message };
  }
}
/**
 * Salva a venda e define o status inicial para a Gestão de Pedidos
 */
function salvarVendaNoSheet(dados) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheetVendas = ss.getSheetByName("VENDAS");
    const abaUsers = ss.getSheetByName("USERS");
    
    // 1. BUSCA O NOME + SOBRENOME NA ABA 'USERS'
    let nomeCompletoIdentificado = "NÃO LOCALIZADO";
    const loginBusca = String(dados.consultorVenda || "").toUpperCase().trim();

    if (abaUsers && loginBusca !== "") {
      const dadosUsers = abaUsers.getDataRange().getValues();
      for (let i = 1; i < dadosUsers.length; i++) {
        const usernamePlanilha = String(dadosUsers[i][1]).toUpperCase().trim();
        if (usernamePlanilha === loginBusca) {
          const nome = String(dadosUsers[i][2] || "").trim();      
          const sobrenome = String(dadosUsers[i][3] || "").trim(); 
          nomeCompletoIdentificado = (nome + " " + sobrenome).trim().toUpperCase();
          break;
        }
      }
    }

    if (nomeCompletoIdentificado === "NÃO LOCALIZADO") {
       nomeCompletoIdentificado = loginBusca;
    }

    // 2. VERIFICA OU CRIA A ABA VENDAS (Ajustado para incluir até AI)
    if (!sheetVendas) {
      sheetVendas = ss.insertSheet("VENDAS");
      let cabecalho = new Array(35).fill(""); // Aumentado para 35 colunas (A até AI)
      cabecalho[0] = "DIA VENC."; cabecalho[1] = "DATA VENDA"; cabecalho[2] = "CNPJ";
      cabecalho[3] = "RAZÃO SOCIAL"; cabecalho[4] = "MODALIDADE"; cabecalho[5] = "PLANO";
      cabecalho[6] = "NÚMERO DA LINHA"; cabecalho[7] = "VALOR CONTRATADO"; cabecalho[8] = "OPERADORA DOADORA";
      cabecalho[9] = "CONSULTOR (NOME COMPLETO)"; 
      cabecalho[10] = "CONSULTOR DO INPUT";       
      cabecalho[24] = "STATUS DO PEDIDO";         
      cabecalho[31] = "CÓDIGO DO CLIENTE"; 
      cabecalho[32] = "CÓDIGO DO ADMINISTRADOR"; 
      cabecalho[34] = "INSCRIÇÃO ESTADUAL"; // Coluna AI (Índice 34) - Ajustado typo
      
      sheetVendas.appendRow(cabecalho);
      sheetVendas.getRange("A1:AI1").setFontWeight("bold").setBackground("#f3f4f6");
    }

    const formatarDataBR = (dataWeb) => {
      if (!dataWeb || dataWeb.indexOf("-") === -1) return dataWeb;
      const partes = dataWeb.split("-"); 
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    };

    const dataVendaFormatada = formatarDataBR(dados.dataVenda);

    // 3. GRAVA AS LINHAS NA ABA VENDAS
    dados.linhas.forEach(item => {
      let valorNumerico = 0;
      if (item.valor) {
        valorNumerico = typeof item.valor === "string" 
          ? parseFloat(item.valor.replace("R$", "").replace(/\./g, "").replace(",", ".").trim()) 
          : item.valor;
      }

      // Criamos um array de 35 posições (Índice 0 ao 34 = Coluna A até AI)
      let novaLinha = new Array(35).fill(""); 
      novaLinha[0]  = dados.vencimento;
      novaLinha[1]  = dataVendaFormatada;
      novaLinha[2]  = dados.cnpj;
      novaLinha[3]  = dados.razao;
      novaLinha[4]  = dados.modalidade;
      novaLinha[5]  = item.plano;
      novaLinha[6]  = item.numero;
      novaLinha[7]  = valorNumerico;
      novaLinha[8]  = item.operadora || "-";
      novaLinha[9]  = nomeCompletoIdentificado; 
      novaLinha[10] = dados.consultorInput || ""; // Agora preenche se vier do formulário

      novaLinha[11] = dados.cep;
      novaLinha[12] = dados.endereco;
      novaLinha[13] = dados.numeroEndereco;
      novaLinha[14] = dados.complemento;
      novaLinha[15] = dados.bairro;
      novaLinha[16] = dados.cidade;
      novaLinha[17] = dados.uf;
      novaLinha[18] = dados.cpfAdmin;
      novaLinha[19] = dados.nomeAdmin;
      novaLinha[20] = dados.email;
      novaLinha[21] = dados.contatoFin;
      novaLinha[22] = dados.radar;
      novaLinha[23] = dados.p2b;
      novaLinha[24] = "PENDENTE DE INPUT";

      novaLinha[31] = dados.codigoCliente || ""; 
      novaLinha[32] = dados.codigoAdmin || "";   
      
      // 🌟 GRAVAÇÃO DA INSCRIÇÃO ESTADUAL NA COLUNA AI (Índice 34)
      novaLinha[34] = dados.ie || ""; 

      sheetVendas.appendRow(novaLinha);
    });

    // 🌟 CHAMA O GATILHO DO CRM AQUI!
    // Pega as informações do cliente desta venda e joga pro banco de dados oficial de CLIENTES
    registrarClienteNoCRM(dados);

    SpreadsheetApp.flush(); 
    return { success: true, message: "Venda registrada com sucesso! Status: PENDENTE DE INPUT" };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
/**
 * Atualiza o status e gerencia notas de auditoria e datas de ativação
 */
function atualizarColunaStatus(rowId, novoStatus, dataAtivacao, dataBocManual, nomeUsuarioLogado) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("VENDAS");
    const linhaReal = parseInt(rowId) + 1; 
    const statusLimpo = String(novoStatus).toUpperCase().trim();
    
    const celulaZ = sheet.getRange(linhaReal, 26);  // Coluna Z
    const celulaAJ = sheet.getRange(linhaReal, 36); // Coluna AJ
    const celulaAK = sheet.getRange(linhaReal, 37); // Coluna AK (Data RADAR)

    // Atualiza o Status (Coluna Y)
    sheet.getRange(linhaReal, 25).setValue(novoStatus);

    // 🌟 LÓGICA DO BACKOFFICE (PASSO 3)
    if (statusLimpo.includes("3. DOCS VALIDADOS")) {
      const dataParaNota = dataBocManual ? dataBocManual : Utilities.formatDate(new Date(), "America/Sao_Paulo", "dd/MM/yyyy");
      
      let auditor = "Sistema";
      
      try {
        const emailLogado = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
        const abaUsuarios = ss.getSheetByName("USERS");
        
        if (abaUsuarios && emailLogado) {
          const dadosUsuarios = abaUsuarios.getDataRange().getValues();
          
          for (let i = 1; i < dadosUsuarios.length; i++) {
            let emailPlanilha = String(dadosUsuarios[i][1] || "").toLowerCase().trim();
            
            if (emailPlanilha === String(emailLogado).toLowerCase().trim()) {
              auditor = dadosUsuarios[i][2];
              break;
            }
          }
        }
      } catch (erroBusca) {
        console.error("Erro ao buscar usuário na aba USERS: ", erroBusca);
      }
      
      if (auditor === "Sistema" && nomeUsuarioLogado && nomeUsuarioLogado !== "Sistema") {
        auditor = nomeUsuarioLogado;
      }
      
      celulaAJ.setValue(dataParaNota); 
      celulaAJ.setNote("✅ Aprovado por: " + auditor); 
    }

    // ============================================================
    // 🌟 LÓGICA DE ATIVAÇÃO (PASSO 6) - COM BUSCA DE DATA EM AK
    // ============================================================
    if (statusLimpo.includes("6. ATIVADO")) {
      
      // 🔥 1. DETERMINA A DATA DE ATIVAÇÃO (prioridade: parâmetro > coluna Z > coluna AK)
      let dataAtivacaoFinal = dataAtivacao;
      
      // Se o parâmetro veio vazio, tenta pegar da coluna Z
      if (!dataAtivacaoFinal || dataAtivacaoFinal.toString().trim() === "") {
        const valorZ = celulaZ.getValue();
        if (valorZ && valorZ.toString().trim() !== "") {
          dataAtivacaoFinal = valorZ;
          Logger.log(`📥 Data de ativação obtida da coluna Z: ${dataAtivacaoFinal}`);
        }
      }
      
      // Se ainda estiver vazio, tenta pegar da coluna AK (Data RADAR)
      if (!dataAtivacaoFinal || dataAtivacaoFinal.toString().trim() === "") {
        const valorAK = celulaAK.getValue();
        if (valorAK && valorAK.toString().trim() !== "") {
          dataAtivacaoFinal = valorAK;
          Logger.log(`📥 Data de ativação obtida da coluna AK: ${dataAtivacaoFinal}`);
        }
      }

      // Se tiver data, processa
      if (dataAtivacaoFinal && dataAtivacaoFinal.toString().trim() !== "") {
        Logger.log(`✅ [atualizarColunaStatus] Ativação com data: ${dataAtivacaoFinal}`);
        
        // Atualiza a coluna Z com a data final (se não estiver preenchida)
        if (!celulaZ.getValue() || celulaZ.getValue().toString().trim() === "") {
          celulaZ.setValue(dataAtivacaoFinal);
          Logger.log(`📝 Data copiada para coluna Z: ${dataAtivacaoFinal}`);
        }

        // 🔥 2. PROCESSAR CRIAÇÃO/ATUALIZAÇÃO DAS FATURAS
        try {
          // Busca todos os dados da linha (38 colunas: A até AL)
          const dadosLinha = sheet.getRange(linhaReal, 1, 1, 38).getValues()[0];
          const modalidade = dadosLinha[4] || "";
          
          // Se for RENEG, remove da FATURAS e não cria
          if (modalidade && modalidade.toString().toUpperCase().trim() === "RENEG") {
            removerClienteDaAbaFaturas(dadosLinha[2], dadosLinha[6]);
            Logger.log(`🗑️ [atualizarColunaStatus] RENEG detectada, removido da FATURAS.`);
          } else {
            // Monta objeto com os dados da venda
            const venda = {
              codigoCliente: dadosLinha[31] || "",
              nomeCliente: dadosLinha[3] || "",
              nomeResponsavel: dadosLinha[19] || "",
              cpfCnpj: dadosLinha[2] || "",
              plano: dadosLinha[5] || "",
              linhaTel: dadosLinha[6] || "",
              contatoFinanceiro: dadosLinha[21] || "",
              email: dadosLinha[20] || "",
              dataVencBase: dadosLinha[0],
              dataPrimeiroCad: dadosLinha[1],
              dataAtivacao: dataAtivacaoFinal,
              modalidade: modalidade,
              origem: "VEXO PRÓPRIO (ativação)"
            };
            
            // Processa a venda (insere ou atualiza na FATURAS)
            processarVendaIndividualParaFaturas(venda);
            Logger.log(`✅ [atualizarColunaStatus] FATURAS atualizada para linha ${linhaReal}.`);
          }
        } catch (e) {
          Logger.log(`❌ [atualizarColunaStatus] Erro ao processar faturas: ${e.message}`);
        }
      } else {
        Logger.log(`⚠️ [atualizarColunaStatus] Status ATIVADO, mas nenhuma data de ativação encontrada.`);
      }
    } 
    
    // 🌟 LÓGICA DE RETROCESSO (se voltar para etapas iniciais, remove a data e as faturas)
    else if (statusLimpo.startsWith("1.") || statusLimpo.startsWith("2.")) {
      // Limpa as células de data e notas
      celulaZ.clearContent().clearNote();
      celulaAJ.clearContent().clearNote();
      sheet.getRange(linhaReal, 27, 1, 5).clearContent();
      
      // 🔥 Remover o cliente da FATURAS se houver
      try {
        const dadosLinha = sheet.getRange(linhaReal, 1, 1, 38).getValues()[0];
        removerClienteDaAbaFaturas(dadosLinha[2], dadosLinha[6]);
        Logger.log(`🗑️ [atualizarColunaStatus] Cliente removido da FATURAS (retrocesso).`);
      } catch (e) {
        Logger.log(`❌ [atualizarColunaStatus] Erro ao remover faturas: ${e.message}`);
      }
    }
    
    return { success: true };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}
/**
 * Função Auxiliar para calcular o cronograma M1, M2, M3, M7, M14
 */
function calcularDatasFaturas(dataAtivacaoStr, diaVenc) {
  const partes = dataAtivacaoStr.split("/");
  // Mês no JS começa em 0 (Janeiro = 0)
  const dataBase = new Date(partes[2], partes[1] - 1, partes[0]);
  
  function adicionarMesesEGerar(qtdMeses) {
    // Cria a data futura mantendo o dia do vencimento escolhido
    let d = new Date(dataBase.getFullYear(), dataBase.getMonth() + qtdMeses, diaVenc);
    
    // Lógica Pro-rata: Se a data calculada for igual ou anterior à ativação, pula 1 mês
    if (d <= dataBase) {
      d.setMonth(d.getMonth() + 1);
    }
    
    return Utilities.formatDate(d, Session.getScriptTimeZone(), "dd/MM/yyyy");
  }

  return {
    m1: adicionarMesesEGerar(1),
    m2: adicionarMesesEGerar(2),
    m3: adicionarMesesEGerar(3),
    m7: adicionarMesesEGerar(7),
    m14: adicionarMesesEGerar(14)
  };
}
function buscarDadosDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetVendas = ss.getSheetByName("VENDAS");
  const sheetMetas = ss.getSheetByName("METAS_CONFIG");
  const sheetUsers = ss.getSheetByName("USERS"); 

  if (!sheetVendas || !sheetMetas || !sheetUsers) {
    return { erro: true, msg: "Abas VENDAS, METAS_CONFIG ou USERS não encontradas." };
  }

  // 1. MAPEAMENTO DE USUÁRIOS E FOTOS
  const dataUsers = sheetUsers.getDataRange().getValues();
  let mapaUsuarios = {};
  let mapaFotos = {}; 
  let listaConsultores = []; 

  for (let u = 1; u < dataUsers.length; u++) {
    const matriculaID = String(dataUsers[u][0] || "").trim().toUpperCase(); 
    const nome = String(dataUsers[u][2] || "").trim();                     
    const sobrenome = String(dataUsers[u][3] || "").trim();                
    const urlFoto = String(dataUsers[u][8] || "").trim(); 
    
    if (nome || sobrenome) {
      const nomeCompleto = (nome + " " + sobrenome).toUpperCase().trim();
      if (matriculaID) mapaUsuarios[matriculaID] = nomeCompleto;
      mapaFotos[nomeCompleto] = urlFoto; 
      if (!listaConsultores.includes(nomeCompleto)) listaConsultores.push(nomeCompleto);
    }
  }
  listaConsultores.sort();

  // 2. BUSCAR METAS DO MÊS ATUAL
  const hoje = new Date();
  const mesAtualNumerico = hoje.getMonth() + 1; 
  const anoAtual = hoje.getFullYear();
  const dataMetas = sheetMetas.getDataRange().getValues();

  let metaFaturamento = 0, metaPortabilidade = 0, metaRenegociacao = 0; 
  let metaFaturamentoSup = 0, metaPortabilidadeSup = 0, metaRenegociacaoSup = 0;
  let metaEncontrada = false;

  const mapaMeses = {
    "JANEIRO": 1, "FEVEREIRO": 2, "MARÇO": 3, "MARCO": 3,
    "ABRIL": 4, "MAIO": 5, "JUNHO": 6, "JULHO": 7, "AGOSTO": 8,
    "SETEMBRO": 9, "OUTUBRO": 10, "NOVEMBRO": 11, "DEZEMBRO": 12
  };

  for (let i = 1; i < dataMetas.length; i++) {
    const row = dataMetas[i];
    let valorMes = row[1];
    let valorAno = parseInt(String(row[2]).trim());

    if (typeof valorMes === 'string') {
      const textoLimpo = valorMes.toUpperCase().trim();
      valorMes = mapaMeses[textoLimpo] || parseInt(textoLimpo);
    }

    if (valorMes === mesAtualNumerico && valorAno === anoAtual) {
      const limparValor = (v) => (typeof v === 'number') ? v : parseFloat(String(v || "0").replace(/[^\d.,-]/g, '').replace(",", ".")) || 0;
      metaFaturamento = limparValor(row[5]);    metaFaturamentoSup = limparValor(row[6]); 
      metaPortabilidade = limparValor(row[8]);  metaPortabilidadeSup = limparValor(row[9]);
      metaRenegociacao = limparValor(row[11]);  metaRenegociacaoSup = limparValor(row[12]);
      metaEncontrada = true;
      break;
    }
  }

  // 3. PROCESSAMENTO DAS VENDAS
  const dataVendas = sheetVendas.getDataRange().getValues();
  const todasNotas = sheetVendas.getRange(1, 26, dataVendas.length).getNotes(); 

  let ranking = {};
  let listaVendasDashboard = [];

  // Função auxiliar para extrair data de diversos formatos
  function extrairData(valor) {
    if (!valor) return null;
    if (valor instanceof Date) return valor;
    if (typeof valor === 'string') {
      const partes = valor.split(/[\/\-\.]/);
      if (partes.length === 3) {
        let ano = parseInt(partes[2]);
        if (ano < 100) ano += 2000;
        const mes = parseInt(partes[1]) - 1;
        const dia = parseInt(partes[0]);
        const d = new Date(ano, mes, dia);
        if (!isNaN(d.getTime())) return d;
      }
    }
    return null;
  }

  for (let i = 1; i < dataVendas.length; i++) {
    const row = dataVendas[i];
    const statusBruto = String(row[24] || "").toUpperCase().trim();
    
    // Ignora apenas vendas canceladas
    if (statusBruto.includes("CANCELADO")) continue;

    // --- DATA DE ATIVAÇÃO (COLUNA AK - Índice 36) ---
    const dataAtivacao = extrairData(row[36]); // AK

    // Determina se a venda é de receita (modalidades que geram faturamento)
    const modalidade = String(row[4] || "").toUpperCase().trim();
    let modalidadeParaPainel = modalidade;
    if (modalidade.includes("MIGRA")) modalidadeParaPainel = "MIGRAÇÃO TT";
    else if (modalidade.includes("ATIVA")) modalidadeParaPainel = "PRIMEIRA ATIVAÇÃO";
    else if (modalidade.includes("ADITIVO")) modalidadeParaPainel = "ADITIVO";

    const isReceita = modalidadeParaPainel === "MIGRAÇÃO TT" || 
                      modalidadeParaPainel === "PRIMEIRA ATIVAÇÃO" || 
                      modalidadeParaPainel === "ADITIVO" || 
                      modalidade.includes("PORTABIL");

    // Só processa se for receita (evita contabilizar MIDs, etc)
    if (!isReceita) continue;

    const valor = (typeof row[7] === 'number') ? row[7] : parseFloat(String(row[7] || "0").replace(/[^\d.,-]/g, '').replace(",", ".")) || 0;
    const matriculaVenda = String(row[8] || "").trim().toUpperCase(); 
    let nomeParaExibir = mapaUsuarios[matriculaVenda] || String(row[9] || "DESCONHECIDO").toUpperCase().trim();

    // Lógica de inclusão:
    // - Se NÃO tem data de ativação (AK vazio) → inclui como PENDENTE (arrasta para o mês atual)
    // - Se TEM data de ativação e é do mês atual → inclui como ATIVADO
    // - Se TEM data de ativação e é de mês anterior → NÃO inclui (já contabilizada)
    let incluir = false;
    let statusFinalPainel = "PENDENTE";
    let dataParaDashboard = null;

    if (dataAtivacao) {
      // Verifica se a ativação ocorreu no mês atual
      if (dataAtivacao.getMonth() + 1 === mesAtualNumerico && dataAtivacao.getFullYear() === anoAtual) {
        incluir = true;
        statusFinalPainel = "ATIVADO";
        dataParaDashboard = dataAtivacao;
      } else {
        // Ativação em outro mês: não inclui
        incluir = false;
      }
    } else {
      // Sem data de ativação: pendente, inclui sempre
      incluir = true;
      statusFinalPainel = "PENDENTE";
      dataParaDashboard = hoje; // para exibição, usamos a data de hoje como referência
    }

    if (incluir) {
      // Atualiza ranking (soma o valor)
      ranking[nomeParaExibir] = (ranking[nomeParaExibir] || 0) + valor;

      // Adiciona à lista de vendas para exibição no Kanban
      const dataFormatada = Utilities.formatDate(dataParaDashboard, "GMT-3", "dd/MM/yyyy");
      listaVendasDashboard.push({
        cliente: row[3],
        plano: row[5] || modalidade,
        valor: valor,
        modalidade: modalidadeParaPainel,
        status: statusFinalPainel,
        data: dataFormatada 
      });
    }
  }

  return {
    metaValor: metaFaturamento,
    metaSup: metaFaturamentoSup, 
    portMeta: metaPortabilidade,
    portSup: metaPortabilidadeSup, 
    renegMeta: metaRenegociacao,
    renegSup: metaRenegociacaoSup, 
    ranking: ranking,
    fotos: mapaFotos,
    consultores: listaConsultores,
    vendas: listaVendasDashboard,
    erro: !metaEncontrada,
    msgErro: !metaEncontrada ? `Meta de ${mesAtualNumerico}/${anoAtual} não encontrada.` : ""
  };
}
function salvarMetasConfig(dados) {
  // 1. TENTA IDENTIFICAR O PERFIL PELO SISTEMA
  let perfil;
  try {
    perfil = getPerfilUsuario();
  } catch(e) {
    perfil = { cargo: "DESCONHECIDO", nome: "Usuário" };
  }
  
  // 2. IDENTIFICAÇÃO DE SEGURANÇA VIA GOOGLE
  const emailLogado = Session.getEffectiveUser().getEmail(); // Session.getEffectiveUser() é mais estável para scripts
  const donoPlanilha = SpreadsheetApp.getActiveSpreadsheet().getOwner();
  const emailDono = donoPlanilha ? donoPlanilha.getEmail() : "";

  // 3. REGRA DE ACESSO: Se for Administrador OU se for o Dono da Planilha (Você)
  // Adicionei Session.getActiveUser().getEmail() como redundância
  const emailAtivo = Session.getActiveUser().getEmail();

  const ehAdmin = (perfil.cargo === "ADMINISTRADOR");
  const ehDono = (emailLogado === emailDono || emailAtivo === emailDono);

  if (!ehAdmin && !ehDono) {
    console.error(`⚠️ Acesso negado: Logado=${emailLogado}, Perfil=${perfil.cargo}`);
    return "❌ Erro: Acesso negado. Apenas o cargo ADMINISTRADOR pode alterar as metas do sistema.";
  }

  // 4. CONFIGURAÇÃO DA PLANILHA
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("METAS_CONFIG");
  
  if (!sheet) {
    sheet = ss.insertSheet("METAS_CONFIG");
    sheet.appendRow([
      "ID_PERIODO", "MES", "ANO", "DATA_REGISTRO", 
      "FAT_MIN", "FAT_TARGET", "FAT_SUP", 
      "PORT_MIN", "PORT_TARGET", "PORT_SUP", 
      "RENEG_MIN", "RENEG_TARGET", "RENEG_SUP"
    ]);
    sheet.getRange("A1:M1").setFontWeight("bold").setBackground("#d1d3d4");
  }
  
  const idPeriodo = dados.mes + "/" + dados.ano;
  
  // 5. FORMATAÇÃO NUMÉRICA (Evita que o Sheets salve como texto)
  const formatarNum = (val) => {
    if (typeof val === "number") return val;
    let n = String(val || "0").replace("R$", "").replace(/\./g, "").replace(",", ".").trim();
    return parseFloat(n) || 0;
  };

  // 6. SALVAMENTO
  try {
    sheet.appendRow([
      idPeriodo,
      dados.mes,
      dados.ano,
      new Date(), 
      formatarNum(dados.fatMin), 
      formatarNum(dados.fatTarget), 
      formatarNum(dados.fatSup),
      formatarNum(dados.portMin), 
      formatarNum(dados.portTarget), 
      formatarNum(dados.portSup),
      formatarNum(dados.renegMin), 
      formatarNum(dados.renegTarget), 
      formatarNum(dados.renegSup)
    ]);
    
    const nomeExibicao = perfil.nome && perfil.nome !== "Usuário" ? perfil.nome : emailLogado.split('@')[0];
    return "✅ Meta para " + idPeriodo + " salva com sucesso por " + nomeExibicao + "!";
    
  } catch (erro) {
    return "❌ Erro ao gravar na planilha: " + erro.message;
  }
}
/**
 * Busca uma meta específica pelo ID Período (MES/ANO)
 */
function consultarMetaExistente(mes_nome, ano) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("METAS_CONFIG");
  if (!sheet) return null;

  const valores = sheet.getDataRange().getValues();
  // idBusca depende de como você salvou. Se salvou como "02/2026", use o número.
  // Aqui vamos buscar pelo nome do mês e ano que vem do Select.
  
  for (let i = valores.length - 1; i >= 1; i--) {
    // Considerando que a Coluna B é o Nome do Mês e C é o Ano
    if (valores[i][1] === mes_nome && valores[i][2].toString() === ano.toString()) {
      return {
        fatMin: valores[i][4], fatTarget: valores[i][5], fatSup: valores[i][6],
        portMin: valores[i][7], portTarget: valores[i][8], portSup: valores[i][9],
        renegMin: valores[i][10], renegTarget: valores[i][11], renegSup: valores[i][12]
      };
    }
  }
  return null;
}

/**
 * Busca as últimas 5 metas salvas para o Histórico
 */
function buscarUltimasMetas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("METAS_CONFIG");
  if (!sheet) return [];

  const valores = sheet.getDataRange().getValues();
  if (valores.length <= 1) return [];

  // Pega as últimas 5 linhas, remove duplicatas de período se houver
  const historico = [];
  const periodosVistos = new Set();

  for (let i = valores.length - 1; i >= 1; i--) {
    const periodo = valores[i][1] + "/" + valores[i][2];
    if (!periodosVistos.has(periodo)) {
      historico.push({
        periodo: periodo,
        mes_nome: valores[i][1],
        ano: valores[i][2]
      });
      periodosVistos.add(periodo);
    }
    if (historico.length >= 5) break;
  }
  return historico;
}
function excluirMetaSistêmica(mes_nome, ano) {
  // 🛡️ TRAVA DE SEGURANÇA: Validação de Cargo + Chave Mestra (Dono)
  let perfil;
  try {
    perfil = getPerfilUsuario();
  } catch(e) {
    perfil = { cargo: "DESCONHECIDO", nome: "Usuário" };
  }
  
  // Identificação de segurança via Google (E-mail)
  const emailLogado = Session.getEffectiveUser().getEmail();
  const donoPlanilha = SpreadsheetApp.getActiveSpreadsheet().getOwner();
  const emailDono = donoPlanilha ? donoPlanilha.getEmail() : "";
  const emailAtivo = Session.getActiveUser().getEmail();

  // Regra: Permite se for cargo ADMINISTRADOR OU se for o dono da planilha (Você)
  const ehAdmin = (perfil.cargo === "ADMINISTRADOR");
  const ehDono = (emailLogado === emailDono || emailAtivo === emailDono);

  if (!ehAdmin && !ehDono) {
    console.error(`⚠️ Tentativa de exclusão negada: ${emailLogado} (${perfil.cargo})`);
    return "❌ Erro: Você não tem permissão para excluir metas. Ação restrita ao Administrador.";
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("METAS_CONFIG");
  if (!sheet) return "❌ Erro: Aba de configurações de metas não encontrada.";

  const valores = sheet.getDataRange().getValues();
  const nomeUsuario = perfil.nome && perfil.nome !== "Usuário" ? perfil.nome : emailLogado.split('@')[0];
  
  // Percorre de baixo para cima para excluir a versão mais recente primeiro
  for (let i = valores.length - 1; i >= 1; i--) {
    // Coluna 1 (B) é o MÊS e Coluna 2 (C) é o ANO (índices 1 e 2 no array)
    if (String(valores[i][1]).trim().toUpperCase() === String(mes_nome).trim().toUpperCase() && 
        String(valores[i][2]).trim() === String(ano).trim()) {
      
      sheet.deleteRow(i + 1); 
      return "✅ Meta de " + mes_nome + "/" + ano + " excluída com sucesso por " + nomeUsuario + "!";
    }
  }
  
  return "⚠️ Nenhuma meta encontrada para " + mes_nome + "/" + ano + ".";
}
function buscarLogoPelaWeb(nomeEmpresa, localidade) {
  // Criamos uma consulta precisa: "Logo Empresa X Cidade Y"
  const query = `${nomeEmpresa} ${localidade} logo`;
  
  try {
    // Usamos o serviço de busca do Google (requer uma chave de API gratuita)
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&searchType=image&key=SUA_CHAVE_API&cx=SEU_CX_ID`;
    
    const response = UrlFetchApp.fetch(url);
    const json = JSON.parse(response.getContentText());
    
    // Retorna a primeira imagem encontrada ou um fallback
    if (json.items && json.items.length > 0) {
      return json.items[0].link; 
    }
  } catch (e) {
    console.log("Erro na busca: " + e);
  }
  return null; // Caso não encontre nada
}

/**
 * Busca leads para o MURAL (Disponíveis para qualquer um captar)
 * Regra: Status deve ser "DISPONÍVEL" e Responsável (Usuário Captou) deve estar vazio
 * Versão Otimizada: Retorna todos os dados necessários para o Card Premium do CRM
 */
function getLeadsDisponiveis() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("PROSPECCAO");
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  const disponiveis = [];

  for (let i = 1; i < data.length; i++) {
    // Evita ler linhas totalmente em branco no final da planilha
    if (!data[i][0]) continue; 

    const status = data[i][14] ? data[i][14].toString().trim().toUpperCase() : ""; // Coluna O (14)
    const responsavel = data[i][16] ? data[i][16].toString().trim() : "";           // Coluna Q (16)

    if (status === "DISPONÍVEL" && responsavel === "") {
      disponiveis.push({
        id: data[i][0],               // Coluna A (0) - CÓDIGO
        cnpj: data[i][2],             // Coluna C (2) - CNPJ
        razao: data[i][3],            // Coluna D (3) - RAZÃO SOCIAL
        admin: data[i][4],            // Coluna E (4) - ADMINISTRADOR
        contato: data[i][5],          // Coluna F (5) - CONTATO CNPJ
        cidade: data[i][11],          // Coluna L (11) - CIDADE
        uf: data[i][12],              // Coluna M (12) - UF
        contato_alt: data[i][18]      // Coluna S (18) - CONTATO ALT.
      });
    }
  }
  
  // Retorna a lista invertida para que os LEADS MAIS RECENTES fiquem no topo do Mural
  return disponiveis.reverse();
}

/**
 * Busca leads para o KANBAN (Visão Global para Admin/Backoffice e Privada para Consultores)
 * Versão Otimizada Premium com NOVAS ETAPAS: OPORTUNIDADE, CONTATO, APRESENTAÇÃO, NEGOCIAÇÃO, FECHADO
 */
function getMeusLeadsKanban(usuario) {
  if (!usuario) return [];
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("PROSPECCAO");
  const shU = ss.getSheetByName("USERS");
  if (!sheet || !shU) return [];

  const data = sheet.getDataRange().getValues();
  const dU = shU.getDataRange().getValues();
  const meusLeads = [];
  
  // Mapeamento de status antigos para novos (Compatibilidade retroativa)
  const mapaStatus = {
    "ABORDAGEM": "CONTATO",
    "PROPOSTA": "APRESENTACAO",
    "ANALISE": "NEGOCIACAO",
    "ANÁLISE": "NEGOCIACAO",
    "FECHADO": "FECHADO",
    "DISPONÍVEL": "OPORTUNIDADE",
    "DISPONIVEL": "OPORTUNIDADE"
  };
  
  // FUNÇÃO AUXILIAR: Remove acentos e padroniza o texto para comparação
  const normalizar = (texto) => {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toUpperCase();
  };

  const parametroBusca = normalizar(usuario);
  const hoje = new Date();
  
  // 1. IDENTIFICAÇÃO DE CARGO E ALIASES (IDENTIDADES)
  let cargoUser = "";
  let aliasesDoUsuario = [parametroBusca]; 
  
  for (let j = 1; j < dU.length; j++) {
    const matriculaPlanilha = normalizar(dU[j][0]); // Coluna A
    const usernamePlanilha  = normalizar(dU[j][1]); // Coluna B
    const nomePlanilha      = normalizar(dU[j][2]); // Coluna C
    const sobrenomePlanilha = normalizar(dU[j][3]); // Coluna D
    const nomeCompleto      = normalizar(nomePlanilha + " " + sobrenomePlanilha);

    if (matriculaPlanilha === parametroBusca || usernamePlanilha === parametroBusca || nomeCompleto === parametroBusca || nomePlanilha === parametroBusca) {
      cargoUser = normalizar(dU[j][5]); // Coluna F
      
      if (usernamePlanilha) aliasesDoUsuario.push(usernamePlanilha);
      if (nomePlanilha)     aliasesDoUsuario.push(nomePlanilha);
      if (nomeCompleto)     aliasesDoUsuario.push(nomeCompleto);
      break;
    }
  }

  const eGestor = cargoUser.includes("ADMINISTRADOR") || 
                  cargoUser.includes("BACKOFFICE") || 
                  cargoUser.includes("PROPRIETARIO");

  // 2. FILTRAGEM DOS LEADS
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue; 

    // Coluna Q (Índice 16) - Responsável
    const responsavelPlanilha = normalizar(data[i][16]); 
    // Coluna O (Índice 14) - Status
    const statusBruto = String(data[i][14] || "").toUpperCase().trim();
    
    // 🔄 CONVERTE STATUS ANTIGO PARA NOVO (Compatibilidade)
    let statusNovo = mapaStatus[statusBruto] || statusBruto;
    
    // Se ainda não mapeou, mantém o original em maiúsculo
    if (!statusNovo) statusNovo = statusBruto;
    
    // Ignora leads disponíveis (Mural) e vazios
    if (statusBruto !== "DISPONÍVEL" && statusBruto !== "DISPONIVEL" && statusBruto !== "") {
      
      // Se for gestor ou se o responsável na planilha for uma das identidades do usuário
      if (eGestor || aliasesDoUsuario.indexOf(responsavelPlanilha) !== -1) {
        
        const dataRegistro = data[i][1]; // Coluna B
        let tempoTotalFunil = 0;
        
        if (dataRegistro instanceof Date) {
          tempoTotalFunil = Math.floor(Math.abs(hoje - dataRegistro) / (1000 * 3600 * 24));
        }

        meusLeads.push({
          id: String(data[i][0]),
          razao: String(data[i][3] || "Sem Razão Social").toUpperCase(),
          cnpj: data[i][2] || "",
          contato: data[i][5] || "",
          contato_alt: data[i][18] || "",
          bairro: data[i][10] || "",
          cidade: data[i][11] || "",
          uf: data[i][12] || "",
          status: statusNovo, // 🌟 STATUS JÁ CONVERTIDO PARA NOVA ETAPA
          vendedor: String(data[i][16] || ""),
          captador: String(data[i][16] || "Não informado"),
          diasParado: tempoTotalFunil,
          diasNoFunil: tempoTotalFunil,
          podeExcluir: eGestor
        });
      }
    }
  }
  return meusLeads.reverse();
}

function atribuirLead(idLead, usuario, statusInicial) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("PROSPECCAO");
    if (!sheet) {
      return { success: false, message: "Aba PROSPECCAO não encontrada." };
    }

    // Garante que a coluna AS exista e esteja configurada
    garantirColunaUltimaAtualizacao();

    const COL_ULTIMA_ATUALIZACAO = 45; // Coluna AS (fixa)
    const data = sheet.getDataRange().getValues();
    const novoStatus = (statusInicial || "OPORTUNIDADE").toUpperCase();
    const agora = new Date();
    const agoraFormatada = Utilities.formatDate(agora, "GMT-3", "dd/MM/yyyy HH:mm");

    console.log(`🎯 Atribuindo lead ${idLead} para ${usuario || "não informado"} com status ${novoStatus}`);

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(idLead)) {
        // 1. Status (Coluna O = 15)
        sheet.getRange(i + 1, 15).setValue(novoStatus);

        // 2. Responsável (Coluna Q = 17) – limpa se for DISPONÍVEL
        if (novoStatus === "DISPONÍVEL") {
          sheet.getRange(i + 1, 17).setValue("");
        } else {
          sheet.getRange(i + 1, 17).setValue(usuario || "");
        }

        // 3. Data de última atualização (Coluna AS = 45) - FIXA
        sheet.getRange(i + 1, COL_ULTIMA_ATUALIZACAO).setValue(agora);

        // 4. Histórico (Coluna R = 18)
        const historicoAtual = data[i][17] || "";
        let registroMovimentacao = "";
        if (novoStatus === "DISPONÍVEL") {
          registroMovimentacao = `------------------------------\n🔄 LEAD DEVOLVIDO AO MURAL (${agoraFormatada})\n👤 Responsável anterior: ${data[i][16] || "Ninguém"}\nStatus: DISPONÍVEL\n\n`;
        } else {
          registroMovimentacao = `------------------------------\n🎯 LEAD CAPTADO (${agoraFormatada}) - 👤 ${usuario || "Sistema"}\nStatus inicial: ${novoStatus}\n\n`;
        }
        const novoHistorico = registroMovimentacao + historicoAtual;
        sheet.getRange(i + 1, 18).setValue(novoHistorico);

        SpreadsheetApp.flush();
        return { success: true, message: `Lead atualizado para ${novoStatus}` };
      }
    }
    return { success: false, message: "Lead não encontrado" };
  } catch (e) {
    console.error("Erro em atribuirLead:", e);
    return { success: false, message: e.toString() };
  }
}


/**
 * Muda o status do lead na planilha PROSPECCAO
 */
function mudarStatus(rowId, novoStatus) {
  let dataAtivacao = null;
  let dataBocManual = null;

  // 1. Pergunta para o Passo 3
  if (novoStatus.includes("3. DOCS VALIDADOS BOC")) {
    dataBocManual = prompt("Qual data o pedido foi APROVADO PELO BOC VENDAS? (DD/MM/AAAA)");
    
    // Se o usuário clicar em cancelar ou deixar vazio, interrompemos o processo
    if (!dataBocManual) {
      if (typeof notificacaoVexo === 'function') notificacaoVexo("Operação cancelada. A data é obrigatória.", "warning");
      return; 
    }
  }

  // 2. Pergunta para o Passo 6 (Ativação)
  if (novoStatus === "6. ATIVADO") {
    dataAtivacao = prompt("Informe a data de ativação (DD/MM/AAAA):");
    if (!dataAtivacao) return;
  }

  // Envia os dados para o servidor
  google.script.run
    .withSuccessHandler(r => {
      if(r.success) {
        if (typeof notificacaoVexo === 'function') notificacaoVexo("Status atualizado!");
        carregarPedidosGestao();
      }
    })
    .atualizarColunaStatus(rowId, novoStatus, dataAtivacao, dataBocManual);
}

/**
 * Adiciona uma anotação ao histórico do lead (Timeline)
 */
/**
 * Adiciona um comentário na Coluna R, identificando o usuário logado e a hora.
 */
function adicionarComentarioLead(idLead, comentario, usuarioLogado) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("PROSPECCAO");
  if (!sheet) return { success: false, message: "Aba não encontrada" };
  
  const data = sheet.getDataRange().getValues();
  
  // Se o frontend enviou o nome, usamos ele. Se não, tentamos pegar o e-mail do Google (opcional)
  let user = (usuarioLogado && usuarioLogado.toString().trim() !== "") ? usuarioLogado : "Consultor";

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(idLead)) {
      const agora = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yy HH:mm");
      const historicoAtual = data[i][17] || ""; 
      
      // Montagem da nota com o nome do usuário corrigido
      const novaAnotacao = `------------------------------\n🗓️ ${agora} - 👤 ${user}:\n${comentario}\n\n${historicoAtual}`;
      
      sheet.getRange(i + 1, 18).setValue(novaAnotacao);
      
      return { 
        success: true, 
        novoHistorico: novaAnotacao 
      };
    }
  }
  return { success: false, message: "Lead não encontrado" };
}

/**
 * Busca o histórico de interações, Razão Social e CNPJ para exibir no Modal
 */
function getHistoricoLead(idLead) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("PROSPECCAO");
  
  if (!sheet) return { empresa: "Erro", cnpj: "", historico: "Aba não encontrada" };

  const data = sheet.getDataRange().getValues();

  // Procurar o lead pelo ID (Coluna A - Índice 0)
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(idLead)) {
      
      // --- AJUSTE DE ÍNDICES DE ACORDO COM SEU REGISTRO ---
      const rua    = data[i][8]  || ""; // Coluna I (Logradouro)
      const num    = data[i][9]  || ""; // Coluna J (Nº)
      const bairro = data[i][10] || ""; // Coluna K (Bairro)
      const cidade = data[i][11] || ""; // Coluna L (Cidade)
      const uf     = data[i][12] || ""; // Coluna M (UF)
      
      // Montagem da string de busca exata para o Google Maps
      // Formato: Rua Nome, Numero - Bairro, Cidade - UF
      const enderecoCompleto = `${rua}${num ? ', ' + num : ''}${bairro ? ' - ' + bairro : ''}, ${cidade} - ${uf}`;

      return {
        empresa: data[i][3],       // Coluna D: RAZÃO SOCIAL
        cnpj: data[i][2],          // Coluna C: CNPJ
        contato: data[i][5],       // Coluna F: TELEFONE 1
        contato_alt: data[i][18],  // Coluna S: TELEFONE 2
        endereco: enderecoCompleto, // Endereço agora com número garantido
        ramo: data[i][13] || "Geral / Outros", // Coluna N: RAMO
        historico: data[i][17] || "Nenhuma interação registrada até o momento." // Coluna R
      };
    }
  }

  return { empresa: "Não encontrado", cnpj: "", historico: "" };
}
function buscarDadosRelatorioGeral(dataInicio, dataFim) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    SpreadsheetApp.flush(); 

    const extrairData = (val) => {
      if (!val || val === "") return null;
      if (val instanceof Date) return new Date(val.getFullYear(), val.getMonth(), val.getDate(), 12, 0, 0);
      
      let match = String(val).match(/\b(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?\b/);
      if (match) {
        let p1 = parseInt(match[1]);
        let p2 = parseInt(match[2]);
        let p3 = match[3] ? parseInt(match[3]) : null;
        
        if (p2 > 1000 && p3 === null) return new Date(p2, p1 - 1, 1, 12, 0, 0); 
        
        let ano = p3 !== null ? p3 : new Date().getFullYear();
        if (ano < 100) ano += 2000;
        return new Date(ano, p2 - 1, p1, 12, 0, 0);
      }
      return null;
    };

    const shCom = ss.getSheetByName("COMISSAO");
    let fatorBase = 1.2; 
    let fatorAditivo = 0.3;
    let fatorPortabilidade = 0; 
    let fatorM7 = 0;
    let fatorM14 = 0;

    if (shCom) {
      const parseFator = (val) => {
        if (!val) return 0;
        if (typeof val === 'number') return val > 10 ? val / 100 : val;
        return parseFloat(String(val).replace(',', '.').replace('%', '')) / 100;
      };
      fatorBase = parseFator(shCom.getRange("B3").getValue()) || 1.2;
      fatorAditivo = parseFator(shCom.getRange("B4").getValue()) || 0.3;
      fatorPortabilidade = parseFator(shCom.getRange("B15").getValue()) || 0; 
      fatorM7 = parseFator(shCom.getRange("B16").getValue()) || 0; 
      fatorM14 = parseFator(shCom.getRange("B17").getValue()) || 0; 
    }

    const shVendas = ss.getSheetByName("VENDAS");
    let vendasFiltradas = [];
    let notasFiltradas = [];
    let portabilidadesM1 = []; 
    
    // 🌟 NOVOS COFRES DE PERMANÊNCIA
    let countGrossM1 = 0; // Contador de elegibilidade
    let vendasSafraM7 = []; // Faturamento da safra M7
    let vendasSafraM14 = []; // Faturamento da safra M14
    
    if (shVendas) {
      const rangeVendas = shVendas.getDataRange();
      const valoresBrutos = rangeVendas.getValues(); 
      const valoresDisplay = rangeVendas.getDisplayValues(); 
      const notas = rangeVendas.getNotes();        
      
      const dtInit = dataInicio ? new Date(dataInicio + "T00:00:00") : new Date(2000, 0, 1);
      const dtEnd = dataFim ? new Date(dataFim + "T23:59:59") : new Date(2100, 0, 1);
      
      const anoFil = dtInit.getFullYear();
      const mesFil = dtInit.getMonth();

      // Linhas do tempo relativas ao filtro do painel
      const dtInitM1 = new Date(anoFil, mesFil - 1, 1);
      const dtEndM1 = new Date(anoFil, mesFil, 0, 23, 59, 59);

      const dtInitM8 = new Date(anoFil, mesFil - 8, 1);
      const dtEndM8 = new Date(anoFil, mesFil - 7, 0, 23, 59, 59);

      const dtInitM15 = new Date(anoFil, mesFil - 15, 1);
      const dtEndM15 = new Date(anoFil, mesFil - 14, 0, 23, 59, 59);

      const cabecalho = valoresBrutos[0];
      const colDataInput = 1; 
      const colVal = cabecalho.findIndex(c => /VALOR/i.test(c));
      const colMod = cabecalho.findIndex(c => /MODALIDADE/i.test(c));
      const colAJ = 35; 
      
      for (let i = 1; i < valoresBrutos.length; i++) {
        let valAJ = valoresBrutos[i][colAJ];
        let valInput = valoresBrutos[i][colDataInput];
        let dataCompetencia = null;
        let foiValidadoBOC = false;

        let dataAJFormatada = extrairData(valAJ);
        let dataInputFormatada = extrairData(valInput);

        if (dataAJFormatada) {
          const modStr = String(valoresBrutos[i][colMod]).toUpperCase();
          const isGross = /PRIMEIR[OA]|NOVA|PORT|ADITIVO|UPGRADE/i.test(modStr) && !modStr.includes("MIGRA") && !modStr.includes("RENEG");

          // Cofres do M-1 (Portabilidade e Contagem de Gross para Elegibilidade)
          if (dataAJFormatada >= dtInitM1 && dataAJFormatada <= dtEndM1) {
            if (modStr.includes("PORTA") || modStr.includes("MNP")) portabilidadesM1.push(valoresDisplay[i]);
            if (isGross) countGrossM1++;
          }

          // Cofre da Safra M7 (Resgate de M-8)
          if (isGross && dataAJFormatada >= dtInitM8 && dataAJFormatada <= dtEndM8) {
            vendasSafraM7.push(valoresDisplay[i]);
          }

          // Cofre da Safra M14 (Resgate de M-15)
          if (isGross && dataAJFormatada >= dtInitM15 && dataAJFormatada <= dtEndM15) {
            vendasSafraM14.push(valoresDisplay[i]);
          }
        }

        if (dataAJFormatada) {
          dataCompetencia = dataAJFormatada;
          foiValidadoBOC = true;
        } else if (valAJ && String(valAJ).trim() !== "") {
          dataCompetencia = dataInputFormatada;
          foiValidadoBOC = true;
        } else {
          foiValidadoBOC = false;
          if (dataInputFormatada && dataInputFormatada < dtInit) {
            dataCompetencia = new Date(dtInit.getTime()); 
          } else {
            dataCompetencia = dataInputFormatada;
          }
        }

        if (dataCompetencia) {
          let dia = String(dataCompetencia.getDate()).padStart(2, '0');
          let mes = String(dataCompetencia.getMonth() + 1).padStart(2, '0');
          let ano = dataCompetencia.getFullYear();
          valoresDisplay[i][colDataInput] = `${dia}/${mes}/${ano}`; 
        }

        // Filtro Principal (Espelho Atual)
        if (dataCompetencia && dataCompetencia >= dtInit && dataCompetencia <= dtEnd) {
          const mod = String(valoresBrutos[i][colMod]).toUpperCase();
          let valBruto = valoresBrutos[i][colVal];
          let valorVenda = typeof valBruto === 'number' ? valBruto : parseFloat(String(valBruto || "0").replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
          let comissaoTBP = 0;

          if (foiValidadoBOC) {
            if (/PRIMEIR[OA]|NOVA|PORT|MIGRA/i.test(mod)) {
              comissaoTBP = valorVenda * fatorBase;
            } else if (/ADITIVO|UPGRADE/i.test(mod)) {
              comissaoTBP = valorVenda * fatorAditivo;
            }

            let statusAtual = String(valoresDisplay[i][24]);
            if (!statusAtual.toUpperCase().includes("ATIVAD")) {
              valoresDisplay[i][24] = "ATIVADO - " + statusAtual;
            }
          }

          valoresDisplay[i][40] = comissaoTBP;
          vendasFiltradas.push(valoresDisplay[i]);
          notasFiltradas.push(notas[i]);
        }
      }
    }
    
    return {
      success: true,
      vendas: vendasFiltradas,
      portabilidadesM1: portabilidadesM1,
      countGrossM1: countGrossM1,   // 🌟 Enviando contagem de elegibilidade
      vendasSafraM7: vendasSafraM7, // 🌟 Enviando array de vendas de M-8
      vendasSafraM14: vendasSafraM14, // 🌟 Enviando array de vendas de M-15
      notasVendas: notasFiltradas,
      leads: [],
      configTBP: { fatorBase, fatorAditivo },
      fatorPortabilidade: fatorPortabilidade,
      fatorM7: fatorM7,   // 🌟 Fator B16
      fatorM14: fatorM14  // 🌟 Fator B17
    };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function renderizarGraficoModalidades(resumo, total) {
  const container = document.getElementById('chart-modalidades');
  if(!container) return;
  container.innerHTML = "";
  
  Object.entries(resumo).sort((a,b) => b[1] - a[1]).forEach(([nome, valor]) => {
    const perc = total > 0 ? ((valor / total) * 100).toFixed(0) : 0;
    container.innerHTML += `
      <div style="margin-bottom:18px; animation: fadeInModal 0.3s ease-out;">
        <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:6px;">
          <span style="font-weight:bold; color:#1e3c72;">${nome}</span>
          <b style="color:#2e7d32;">${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (${perc}%)</b>
        </div>
        <div style="background:#f1f5f9; height:10px; border-radius:10px; overflow:hidden;">
          <div style="background: linear-gradient(90deg, #1e3c72, #2a5298); height:100%; width:${perc}%; border-radius:10px; transition: width 1s ease-in-out;"></div>
        </div>
      </div>`;
  });
}
/**
 * Busca todos os nomes de usuários cadastrados na aba USUARIOS.
 * Certifique-se de que a aba se chama exatamente "USUARIOS".
 */
function buscarNomesUsuarios() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("USERS");
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    const consultores = [];

    for (let i = 1; i < data.length; i++) {
      const status = String(data[i][6] || "").trim().toUpperCase(); // Coluna G
      const cargo = String(data[i][5] || "").trim().toUpperCase(); // Coluna F
      const nome = String(data[i][2] || "").trim();
      const sobrenome = String(data[i][3] || "").trim();
      const matricula = String(data[i][0] || "").trim();

      // Filtra: status ATIVO e cargo CONSULTOR DE VENDAS
      if (status === "ATIVO" && cargo === "CONSULTOR DE VENDAS" && matricula !== "") {
        const nomeCompleto = (nome + " " + sobrenome).trim().toUpperCase();
        consultores.push({
          matricula: matricula,
          nome: nomeCompleto || nome.toUpperCase()
        });
      }
    }

    // Ordenar por nome
    consultores.sort((a, b) => a.nome.localeCompare(b.nome));
    return consultores;
  } catch (e) {
    console.error("Erro ao buscar consultores ativos:", e);
    return [];
  }
}
/**
 * Retorna a URL do Script para o redirecionamento de Logout
 */
function getAppUrl() {
  return ScriptApp.getService().getUrl();
}
// --- [MÓDULO DE HIERARQUIA VIA BANCO] ---

function getPermissoesPorCargo(nomeCargo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("CARGOS_CONFIG");
  if (!sheet) return "";
  
  const dados = sheet.getDataRange().getValues();
  for (let i = 1; i < dados.length; i++) {
    if (dados[i][0] === nomeCargo) return dados[i][1]; 
  }
  return ""; 
}

function salvarConfigCargo(cargo, permissoes) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("CARGOS_CONFIG");
    
    // 1. Garante que a aba existe
    if (!sheet) {
      sheet = ss.insertSheet("CARGOS_CONFIG");
      sheet.appendRow(["CARGO", "PERMISSOES"]);
      SpreadsheetApp.flush(); // Força o Google a criar a aba antes de prosseguir
    }
    
    const lastRow = sheet.getLastRow();
    let encontrou = false;

    // 2. Só percorre se houver dados além do cabeçalho
    if (lastRow > 1) {
      const dados = sheet.getRange(1, 1, lastRow, 2).getValues();
      for (let i = 1; i < dados.length; i++) {
        if (dados[i][0].toString().trim() === cargo.toString().trim()) {
          sheet.getRange(i + 1, 2).setValue(permissoes);
          encontrou = true;
          break;
        }
      }
    }

    // 3. Se não encontrar ou for o primeiro registro
    if (!encontrou) {
      sheet.appendRow([cargo, permissoes]);
    }
    
    SpreadsheetApp.flush(); // Garante a gravação imediata no banco de dados
    return "Sucesso: Configuração de " + cargo + " salva!";
    
  } catch (e) {
    return "Erro no Servidor: " + e.toString();
  }
}


// Substitua a função loginServer existente por esta versão corrigida
function loginServer(username, password, tipoAcesso) {
  try {
    console.log(`🔐 Tentativa de login - Usuário: ${username}, Tipo: ${tipoAcesso}`);
    
    // 1. O sistema seleciona o "cofre" correto baseado na escolha da tela (PROPRIO ou PARCEIRO)
    const ss = getDb(tipoAcesso);
    const sh = ss.getSheetByName("USERS");
    
    if (!sh) {
      console.error(`❌ Aba USERS não encontrada no banco ${tipoAcesso}`);
      return { success: false, message: "Aba USERS não encontrada no banco de dados selecionado." };
    }

    const data = sh.getDataRange().getDisplayValues();
    const inputMatricula = username.toString().trim().toLowerCase();
    const inputPass = password.toString().trim();

    console.log(`🔍 Buscando usuário: ${inputMatricula} no banco ${tipoAcesso}`);

    for (let i = 1; i < data.length; i++) {
      // Desestruturação correta das colunas da USERS
      // Coluna A (0): Matrícula
      // Coluna B (1): Senha
      // Coluna C (2): Nome
      // Coluna D (3): Sobrenome
      // Coluna E (4): Email
      // Coluna F (5): Cargo
      // Coluna G (6): Status
      // Coluna H (7): Permissões
      // Coluna I (8): Foto URL
      // Coluna J (9): BANCO_DE_DADOS_ID (NOVA)
      const matRow = String(data[i][0] || "").trim().toLowerCase();
      const passRow = String(data[i][1] || "").trim();
      const nomeRow = String(data[i][2] || "").trim();
      const sobrenomeRow = String(data[i][3] || "").trim();
      const emailRow = String(data[i][4] || "").trim();
      const roleRow = String(data[i][5] || "").trim().toUpperCase();
      const activeRow = String(data[i][6] || "").trim().toUpperCase();
      const permRow = String(data[i][7] || "");
      const photoRow = String(data[i][8] || "");
      const bancoDeDadosId = String(data[i][9] || "").trim(); // 🔥 COLUNA J
      
      console.log(`📋 Linha ${i}: Mat="${matRow}", Status="${activeRow}", Cargo="${roleRow}", BancoId="${bancoDeDadosId}"`);
      
      // Validação de Matrícula e Senha
      if (matRow === inputMatricula && passRow === inputPass) {
        
        const status = activeRow;
        if (status === "ATIVO" || status === "TRUE") {
          
          // Regra de negócio: Converte Proprietário para Administrador na sessão
          let roleFinal = roleRow;
          if (roleFinal === "PROPRIETÁRIO" || roleFinal === "PROPRIETARIO") {
            roleFinal = "ADMINISTRADOR";
          }
          
          const nomeCompleto = (nomeRow + " " + sobrenomeRow).trim() || nomeRow;
          
          console.log(`✅ Login bem-sucedido! Usuário: ${nomeCompleto}, Cargo: ${roleFinal}, Banco: ${tipoAcesso}`);
          
          // 🔥 MONTA O OBJETO DO USUÁRIO COM TODOS OS DADOS RELEVANTES
          const usuario = {
            username: nomeCompleto,
            role: roleFinal,
            matricula: matRow,
            email: emailRow,
            bancoDeDadosId: bancoDeDadosId || null,
            tipoAcesso: tipoAcesso, // Guarda o tipo de acesso (PROPRIO/PARCEIRO)
            photoUrl: photoRow || "",
            permissoes: permRow ? permRow.split(',') : []
          };

          // 🔥 SALVA NA SESSÃO DO APPS SCRIPT PARA USO EM FUNÇÕES POSTERIORES
          PropertiesService.getScriptProperties().setProperty('usuario_logado', JSON.stringify(usuario));
          console.log(`💾 Usuário salvo na sessão do Apps Script. bancoDeDadosId: ${usuario.bancoDeDadosId || 'null'}`);

          // 🔥 RETORNA TUDO PARA O FRONTEND, INCLUINDO O BANCO_DE_DADOS_ID
          return { 
            success: true, 
            username: nomeCompleto, 
            role: roleFinal, 
            photoUrl: photoRow || "", 
            permissoes: permRow ? permRow.split(',') : [],
            tipoAcesso: tipoAcesso,
            matricula: matRow,
            email: emailRow,
            bancoDeDadosId: bancoDeDadosId || null
          };
        } else {
          console.warn(`⚠️ Usuário ${inputMatricula} está inativo (${status})`);
          return { success: false, message: "Usuário inativo. Procure o administrador." };
        }
      }
    }
    
    console.warn(`❌ Login falhou: ${inputMatricula} não encontrado no banco ${tipoAcesso}`);
    return { success: false, message: "Acesso negado: Usuário ou senha incorretos." };

  } catch (e) {
    console.error(`❌ Erro em loginServer: ${e.toString()}`);
    return { success: false, message: "Erro de conexão com o banco: " + e.toString() };
  }
}


/**
 * Função auxiliar para listar todos os cargos e suas definições (Uso interno/ADM)
 */
function getDefinicoesCargos() {
  const sh = SpreadsheetApp.getActive().getSheetByName("CARGOS_CONFIG");
  if (!sh) return [];
  const data = sh.getDataRange().getValues();
  // Retorna um array de objetos para facilitar o manuseio no Frontend
  return data.slice(1).map(r => ({ cargo: r[0], permissoes: r[1] }));
}

/**
 * Busca e processa dados para o Financeiro Master
 * Restrito ao cargo ADMINISTRADOR
 */
function getDadosFinanceirosMaster() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetVendas = ss.getSheetByName("VENDAS");
    if (!sheetVendas) return { success: false, msg: "Aba VENDAS não encontrada." };

    const data = sheetVendas.getDataRange().getValues();
    const resumo = [];
    const metasVendedores = {};

    // 1. CONSOLIDAÇÃO (Descobrir o nível de cada vendedor no mês)
    for (let i = 1; i < data.length; i++) {
      const status = String(data[i][24] || "").toUpperCase().trim();
      // Considera apenas vendas que geram comissão
      if (status.includes("ATIVADO") || status.includes("DOCUMENTAÇÃO OK")) {
        const vendedor = String(data[i][9] || "Sem Vendedor").trim();
        const valor = parseFloat(data[i][7]) || 0;
        const tipo = String(data[i][6] || "").toUpperCase().trim();

        if (!metasVendedores[vendedor]) {
          metasVendedores[vendedor] = { fat: 0, port: 0, mid: 0 };
        }
        
        metasVendedores[vendedor].fat += valor;
        if (tipo.includes("PORT")) metasVendedores[vendedor].port += valor;
        if (tipo.includes("MID")) metasVendedores[vendedor].mid += 1;
      }
    }

    // 2. PROCESSAMENTO (Aplicar a regra de percentual sobre cada linha)
    for (let i = 1; i < data.length; i++) {
      const status = String(data[i][24] || "").toUpperCase().trim();
      if (status.includes("ATIVADO") || status.includes("DOCUMENTAÇÃO OK")) {
        const vendedor = String(data[i][9] || "Sem Vendedor").trim();
        const valorVenda = parseFloat(data[i][7]) || 0;
        const tipo = String(data[i][6] || "").toUpperCase().trim();
        const meta = metasVendedores[vendedor];

        // --- REGRA 1: REMUNERAÇÃO BÁSICA (Sobre o Faturamento Total) ---
        let percBase = 0;
        if (meta.fat >= 2700) percBase = 0.75;      // SUPERADO
        else if (meta.fat >= 2500) percBase = 0.50; // TARGET
        else if (meta.fat >= 2000) percBase = 0.35; // MÍNIMO
        
        let valorComissaoBase = valorVenda * percBase;

        // --- REGRA 2: ADICIONAL PORT-IN (Somente se a venda for Portabilidade) ---
        let valorAdicionalPort = 0;
        if (tipo.includes("PORT")) {
          let percPort = 0;
          if (meta.port >= 810) percPort = 0.45;
          else if (meta.port >= 750) percPort = 0.30;
          else if (meta.port >= 600) percPort = 0.15;
          valorAdicionalPort = valorVenda * percPort;
        }

        // --- REGRA 3: ADICIONAL MID (Somente se a venda for MID) ---
        let valorAdicionalMid = 0;
        if (tipo.includes("MID")) {
          let percMid = 0;
          if (meta.mid >= 7) percMid = 0.45;
          else if (meta.mid >= 5) percMid = 0.30;
          else if (meta.mid >= 3) percMid = 0.15;
          valorAdicionalMid = valorVenda * percMid;
        }

        const totalDaLinha = valorComissaoBase + valorAdicionalPort + valorAdicionalMid;

        resumo.push({
          data: data[i][1] instanceof Date ? Utilities.formatDate(data[i][1], "GMT-3", "dd/MM/yyyy") : String(data[i][1]),
          cliente: data[i][3],
          consultor: vendedor,
          modalidade: tipo || "VENDA",
          valorVenda: valorVenda,
          comissaoConsultor: totalDaLinha,
          status: status
        });
      }
    }

    return { success: true, dados: resumo.reverse() };
  } catch (e) {
    return { success: false, msg: e.toString() };
  }
}
/**
 * Calcula a comissão detalhada de um vendedor para um mês específico
 */
function calcularExtratoConsultor(emailConsultor, mesReferencia) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetVendas = ss.getSheetByName("VENDAS");
    const dadosVendas = sheetVendas.getDataRange().getValues();
    
    let totalFaturamento = 0;
    let totalPortabilidade = 0;
    let totalRenegociacaoMID = 0;
    let vendasDetalhadas = [];

    // 1. Coleta de dados das vendas do consultor no mês
    for (let i = 1; i < dadosVendas.length; i++) {
      const row = dadosVendas[i];
      const dataVenda = new Date(row[1]); // Coluna B
      const vendedor = row[9]; // Coluna J (ajuste se necessário para email ou nome)
      
      if (vendedor === emailConsultor && dataVenda.getMonth() === mesReferencia) {
        const valor = parseFloat(row[7]) || 0; // Coluna H
        const tipoVenda = row[6]; // Exemplo: Coluna G (Portabilidade, Nova, etc)
        
        totalFaturamento += valor;
        if (tipoVenda === "PORTABILIDADE") totalPortabilidade += valor;
        if (tipoVenda === "RENEGOCIAÇÃO MID") totalRenegociacaoMID++;

        vendasDetalhadas.push({
          data: Utilities.formatDate(dataVenda, "GMT-3", "dd/MM"),
          cliente: row[3], // Coluna D
          valor: valor,
          tipo: tipoVenda
        });
      }
    }

    // 2. Aplicação da Tabela de Metas (Baseado na sua imagem)
    let percentBase = 0, percentPortin = 0, percentMid = 0;

    // Faixa de Faturamento
    if (totalFaturamento >= 2700) { percentBase = 0.75; }
    else if (totalFaturamento >= 2500) { percentBase = 0.50; }
    else if (totalFaturamento >= 2000) { percentBase = 0.35; }

    // Faixa de Portabilidade (Adicional)
    if (totalPortabilidade >= 810) { percentPortin = 0.45; }
    else if (totalPortabilidade >= 750) { percentPortin = 0.30; }
    else if (totalPortabilidade >= 600) { percentPortin = 0.15; }

    // Faixa de Renegociação MID (Adicional)
    if (totalRenegociacaoMID >= 7) { percentMid = 0.45; }
    else if (totalRenegociacaoMID >= 5) { percentMid = 0.30; }
    else if (totalRenegociacaoMID >= 3) { percentMid = 0.15; }

    const remuneracaoBasica = totalFaturamento * percentBase;
    const remuneracaoPortin = totalPortabilidade * percentPortin;
    const remuneracaoMid = (totalFaturamento * 0.05) * percentMid; // Exemplo de base para MID

    return {
      success: true,
      resumo: {
        vendedor: emailConsultor,
        faturamento: totalFaturamento,
        portabilidade: totalPortabilidade,
        qtdMid: totalRenegociacaoMID,
        totalComissao: remuneracaoBasica + remuneracaoPortin + remuneracaoMid
      },
      vendas: vendasDetalhadas
    };
  } catch (e) {
    return { success: false, msg: e.toString() };
  }
}
/**
 * 🎯 BUSCA METAS (Sincronizada com o Filtro de Mês/Ano)
 * VERSÃO CORRIGIDA - Aceita tanto nome do mês quanto número
 */
function buscarMetasAtuais(mesFiltro, anoFiltro) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("METAS_CONFIG");
    if (!sheet) {
      console.warn("⚠️ Aba METAS_CONFIG não encontrada");
      return null;
    }

    const data = sheet.getDataRange().getValues();
    
    // Se não vier parâmetro, usa o mês atual (fallback)
    const hoje = new Date();
    let mesAlvo = mesFiltro ? parseInt(mesFiltro) : hoje.getMonth() + 1;
    let anoAlvo = anoFiltro ? parseInt(anoFiltro) : hoje.getFullYear();
    
    // Mapeamento de nomes de meses (suporta português e inglês)
    const mapaMeses = {
      "JANEIRO": 1, "JANUARY": 1, "JAN": 1, "01": 1, "1": 1,
      "FEVEREIRO": 2, "FEBRUARY": 2, "FEB": 2, "02": 2, "2": 2,
      "MARÇO": 3, "MARCO": 3, "MARCH": 3, "MAR": 3, "03": 3, "3": 3,
      "ABRIL": 4, "APRIL": 4, "APR": 4, "04": 4, "4": 4,
      "MAIO": 5, "MAY": 5, "05": 5, "5": 5,
      "JUNHO": 6, "JUNE": 6, "JUN": 6, "06": 6, "6": 6,
      "JULHO": 7, "JULY": 7, "JUL": 7, "07": 7, "7": 7,
      "AGOSTO": 8, "AUGUST": 8, "AUG": 8, "08": 8, "8": 8,
      "SETEMBRO": 9, "SEPTEMBER": 9, "SEP": 9, "09": 9, "9": 9,
      "OUTUBRO": 10, "OCTOBER": 10, "OCT": 10, "10": 10,
      "NOVEMBRO": 11, "NOVEMBER": 11, "NOV": 11, "11": 11,
      "DEZEMBRO": 12, "DECEMBER": 12, "DEC": 12, "12": 12
    };

    // Converter mês alvo para número (caso venha como string)
    let mesAlvoNum = parseInt(mesAlvo);
    if (isNaN(mesAlvoNum)) {
      mesAlvoNum = mapaMeses[String(mesAlvo).toUpperCase().trim()] || hoje.getMonth() + 1;
    }

    console.log(`🔍 Buscando meta para: ${mesAlvoNum}/${anoAlvo}`);

    for (let i = 1; i < data.length; i++) {
      const valorMes = data[i][1]; // Coluna B
      const valorAno = Number(data[i][2]); // Coluna C

      let mesPlanilha;
      
      // Converte o valor da planilha para número do mês
      if (typeof valorMes === 'string') {
        const textoLimpo = valorMes.toUpperCase().trim();
        mesPlanilha = mapaMeses[textoLimpo] || parseInt(textoLimpo);
      } else if (typeof valorMes === 'number') {
        mesPlanilha = valorMes;
      } else {
        continue; // Pula se não conseguir identificar
      }

      // Comparação numérica
      if (mesPlanilha === mesAlvoNum && valorAno === anoAlvo) {
        console.log(`✅ Meta encontrada para ${mesAlvoNum}/${anoAlvo}`);
        return {
          fat:  { min: Number(data[i][4] || 0), target: Number(data[i][5] || 0), sup: Number(data[i][6] || 0) },
          port: { min: Number(data[i][7] || 0), target: Number(data[i][8] || 0), sup: Number(data[i][9] || 0) },
          mid:  { min: Number(data[i][10] || 0), target: Number(data[i][11] || 0), sup: Number(data[i][12] || 0) }
        };
      }
    }
    
    console.log(`⚠️ Meta NÃO encontrada para ${mesAlvoNum}/${anoAlvo}, usando valores padrão (10% para tudo)`);
    return null;
    
  } catch (e) {
    console.error("Erro em buscarMetasAtuais:", e);
    return null;
  }
}



/**
 * AUXILIAR: Busca as metas de QUANTIDADE de MIDs na METAS_CONFIG
 *   Col. K (índice 10) → mínimo
 *   Col. L (índice 11) → target
 *   Col. M (índice 12) → superado
 */
function getMetasMidQtd(mes, ano) {
  try {
    const ss    = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName("METAS_CONFIG");
    if (!sheet) return { min: 0, target: 0, sup: 0 };

    const nomesMeses = {
      "01":"JANEIRO","02":"FEVEREIRO","03":"MARÇO","04":"ABRIL",
      "05":"MAIO","06":"JUNHO","07":"JULHO","08":"AGOSTO",
      "09":"SETEMBRO","10":"OUTUBRO","11":"NOVEMBRO","12":"DEZEMBRO"
    };
    const nomeMes = nomesMeses[String(mes).padStart(2,'0')] || mes.toUpperCase();
    const anoNum  = parseInt(ano);
    const dados   = sheet.getDataRange().getValues();

    for (let i = 1; i < dados.length; i++) {
      const mesCel = String(dados[i][1] || "").toUpperCase().trim(); // col. B
      const anoCel = parseInt(dados[i][2] || 0);                     // col. C
      if (mesCel === nomeMes && anoCel === anoNum) {
        return {
          min:    parseInt(dados[i][10] || 0), // col. K
          target: parseInt(dados[i][11] || 0), // col. L
          sup:    parseInt(dados[i][12] || 0)  // col. M
        };
      }
    }
    return { min: 0, target: 0, sup: 0 };
  } catch(e) {
    console.error("getMetasMidQtd erro: " + e.message);
    return { min: 0, target: 0, sup: 0 };
  }
}


/**
 * 2. FUNÇÃO PRINCIPAL DO FINANCEIRO AJUSTADA
 * RESUMO CONSOLIDADO (PAINEL GERAL) - COM FILTRO POR CARGO
 * 🔥 SINCRONIZADA COM O EXTRATO: Mesma regra base de percentuais mínimos
 */
function getResumoConsolidadoFinanceiro(mesFiltro, anoFiltro, nomeConsultorLogado, cargoUsuario) {
  try {
    console.log(`🔍 Consolidando ${mesFiltro}/${anoFiltro}`);
    
    const isAdmin = (cargoUsuario === "ADMINISTRADOR" || cargoUsuario === "BACKOFFICE");
    const nomeBusca = (nomeConsultorLogado || "").toUpperCase().trim();

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetVendas = ss.getSheetByName("VENDAS");
    
    const metasConfig = buscarMetasAtuais(mesFiltro, anoFiltro);
    const percentuais = buscarPercentuaisComissao();
    
    if (!percentuais) {
      return { success: false, msg: "Configure a aba PERCENTUAIS_CONFIG" };
    }
    
    const dataVendas = sheetVendas.getDataRange().getValues();
    const cabecalho = dataVendas[0];

    const colVend = cabecalho.findIndex(c => /VENDEDOR|CONSULTOR/i.test(c));
    const colVal = cabecalho.findIndex(c => /VALOR/i.test(c));
    const colMod = cabecalho.findIndex(c => /MODALIDADE/i.test(c));
    const colAJ = 35;

    const mesAlvo = String(mesFiltro).padStart(2, '0');
    const anoAlvo = String(anoFiltro);
    
    let totaisLoja = { fat: 0, port: 0, midVal: 0, midQtd: 0 };
    let individuais = {};

    for (let i = 1; i < dataVendas.length; i++) {
      const linha = dataVendas[i];
      const valAJ = linha[colAJ];
      if (!valAJ || valAJ === "") continue;

      let mesFinal, anoFinal;
      if (valAJ instanceof Date) {
        mesFinal = String(valAJ.getMonth() + 1).padStart(2, '0');
        anoFinal = String(valAJ.getFullYear());
      } else {
        let match = String(valAJ).match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/);
        if (!match) continue;
        mesFinal = match[2].padStart(2, '0');
        anoFinal = match[3].length === 2 ? "20" + match[3] : match[3];
      }

      if (mesFinal !== mesAlvo || anoFinal !== anoAlvo) continue;

      const vendedor = String(linha[colVend] || "S/V").toUpperCase().trim();
      const valor = parseFloat(linha[colVal]) || 0;
      const mod = String(linha[colMod] || "").toUpperCase();

      if (/PRIMEIRA|NOVA|PORT|ADITIVO|MIGRA/i.test(mod)) {
        totaisLoja.fat += valor;
      }
      if (/PORT/i.test(mod)) {
        totaisLoja.port += valor;
      }
      if (/MID|RENEG/i.test(mod)) {
        totaisLoja.midQtd++;
        totaisLoja.midVal += valor;
      }

      if (!individuais[vendedor]) {
        individuais[vendedor] = { fat: 0, port: 0, midVal: 0, midQtd: 0, gross: 0 };
      }
      if (/PRIMEIRA|NOVA|PORT|ADITIVO|MIGRA/i.test(mod)) {
        individuais[vendedor].fat += valor;
        if (!mod.includes("MIGRA")) individuais[vendedor].gross++;
      }
      if (/PORT/i.test(mod)) {
        individuais[vendedor].port += valor;
      }
      if (/MID|RENEG/i.test(mod)) {
        individuais[vendedor].midQtd++;
        individuais[vendedor].midVal += valor;
      }
    }

    // ============================================
    // PASSO 2: DEFINIR TAXAS (ALINHADO AO EXTRATO)
    // AGORA USANDO A BASE (coluna K) QUANDO NÃO ATINGE A META
    // ============================================
    
    let taxaFat = percentuais.fat.base;     // ← BASE
    let statusFat = `BASE - Taxa ${taxaFat}%`;
    
    if (metasConfig && metasConfig.fat) {
      if (metasConfig.fat.sup > 0 && totaisLoja.fat >= metasConfig.fat.sup) {
        taxaFat = percentuais.fat.sup;
        statusFat = `SUPERADO - Taxa ${taxaFat}%`;
      } else if (metasConfig.fat.target > 0 && totaisLoja.fat >= metasConfig.fat.target) {
        taxaFat = percentuais.fat.target;
        statusFat = `TARGET - Taxa ${taxaFat}%`;
      } else if (metasConfig.fat.min > 0 && totaisLoja.fat >= metasConfig.fat.min) {
        taxaFat = percentuais.fat.min;
        statusFat = `MÍNIMO - Taxa ${taxaFat}%`;
      } else {
        // ✅ NÃO ATINGIU A META → USA A BASE (coluna K)
        taxaFat = percentuais.fat.base;
        statusFat = `NÃO ATINGIU META - Taxa BASE ${taxaFat}%`;
      }
    }
    
    let taxaPort = percentuais.port.base;     // ← BASE
    let statusPort = `BASE - Taxa ${taxaPort}%`;
    
    if (metasConfig && metasConfig.port) {
      if (metasConfig.port.sup > 0 && totaisLoja.port >= metasConfig.port.sup) {
        taxaPort = percentuais.port.sup;
        statusPort = `SUPERADO - Taxa ${taxaPort}%`;
      } else if (metasConfig.port.target > 0 && totaisLoja.port >= metasConfig.port.target) {
        taxaPort = percentuais.port.target;
        statusPort = `TARGET - Taxa ${taxaPort}%`;
      } else if (metasConfig.port.min > 0 && totaisLoja.port >= metasConfig.port.min) {
        taxaPort = percentuais.port.min;
        statusPort = `MÍNIMO - Taxa ${taxaPort}%`;
      } else {
        // ✅ NÃO ATINGIU A META → USA A BASE (coluna K)
        taxaPort = percentuais.port.base;
        statusPort = `NÃO ATINGIU META - Taxa BASE ${taxaPort}%`;
      }
    }
    
    let taxaMid = percentuais.reneg.base;     // ← BASE
    let statusMid = `BASE - Taxa ${taxaMid}%`;
    const gatilho60 = metasConfig?.fat?.min ? metasConfig.fat.min * 0.60 : 0;
    const lojaDesbloqueada = (gatilho60 === 0 || totaisLoja.fat >= gatilho60);
    
    if (!lojaDesbloqueada) {
      taxaMid = 0;
      statusMid = "BLOQUEADO - Loja < 60% da meta FAT";
    } else if (metasConfig && metasConfig.mid) {
      if (metasConfig.mid.sup > 0 && totaisLoja.midQtd >= metasConfig.mid.sup) {
        taxaMid = percentuais.reneg.sup;
        statusMid = `SUPERADO - Taxa ${taxaMid}%`;
      } else if (metasConfig.mid.target > 0 && totaisLoja.midQtd >= metasConfig.mid.target) {
        taxaMid = percentuais.reneg.target;
        statusMid = `TARGET - Taxa ${taxaMid}%`;
      } else if (metasConfig.mid.min > 0 && totaisLoja.midQtd >= metasConfig.mid.min) {
        taxaMid = percentuais.reneg.min;
        statusMid = `MÍNIMO - Taxa ${taxaMid}%`;
      } else {
        // ✅ NÃO ATINGIU A META → USA A BASE (coluna K)
        taxaMid = percentuais.reneg.base;
        statusMid = `NÃO ATINGIU META MÍNIMA - Taxa BASE ${taxaMid}%`;
      }
    }

    let listaFinal = [];
    let totaisGerais = { receita: 0, port: 0, midVal: 0, midQtd: 0, comissao: 0, grossTotal: 0 };

    for (let consultor in individuais) {
      const d = individuais[consultor];
      
      if (!isAdmin && consultor !== nomeBusca) continue;
      
      const vBase = d.fat * (taxaFat / 100);
      const vPort = d.port * (taxaPort / 100);
      const vMid = d.midVal * (taxaMid / 100);
      const total = vBase + vPort + vMid;
      
      totaisGerais.receita += d.fat;
      totaisGerais.port += d.port;
      totaisGerais.midVal += d.midVal;
      totaisGerais.midQtd += d.midQtd;
      totaisGerais.grossTotal += d.gross;
      totaisGerais.comissao += total;

      listaFinal.push({
        consultor: consultor,
        faturamentoTotal: d.fat,
        gross: d.gross,
        vPort: d.port,
        vReneg: d.midVal,
        midQtd: d.midQtd,
        total: total
      });
    }

    return {
      success: true,
      totais: totaisGerais,
      lista: listaFinal.sort((a, b) => b.total - a.total),
      taxasLoja: {
        fat: taxaFat,
        port: taxaPort,
        mid: taxaMid,
        statusFat: statusFat,
        statusPort: statusPort,
        statusMid: statusMid,
        lojaDesbloqueada: lojaDesbloqueada
      },
      totaisLoja: totaisLoja
    };

  } catch (e) {
    console.error("❌ Erro:", e);
    return { success: false, msg: e.toString() };
  }
}

// Função auxiliar para formatar moeda
function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}
/**
 * 2. GERA DADOS PARA O EXTRATO INDIVIDUAL
 * 🔥 CORRIGIDA: Agora recebe os TOTAIS DA LOJA e as TAXAS corretas
 */
function getDadosComissaoIndividual(nomeConsultor, mesFiltro, anoFiltro) {
  try {
    // 🔥 BUSCA AS METAS DO PERÍODO
    const metas = buscarMetasAtuais(mesFiltro, anoFiltro);
    
    // 🔥 BUSCA OS PERCENTUAIS DA CONFIGURAÇÃO (já com a BASE da coluna K)
    const taxas = buscarPercentuaisComissao();
    
    if (!taxas) {
      return { success: false, msg: "Configuração de percentuais não encontrada" };
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetVendas = ss.getSheetByName("VENDAS");
    
    const dataVendas = sheetVendas.getDataRange().getValues();
    const cabecalho = dataVendas[0];
    
    const colVend = cabecalho.findIndex(c => /VENDEDOR|CONSULTOR/i.test(c));
    const colVal = cabecalho.findIndex(c => /VALOR/i.test(c));
    const colMod = cabecalho.findIndex(c => /MODALIDADE/i.test(c));
    const colCli = cabecalho.findIndex(c => /RAZÃO SOCIAL/i.test(c));
    const colTel = 6;
    const colDataAJ = 35;
    
    let lBase = [], lPort = [], lMid = [];
    let fatConsultor = 0, portConsultor = 0, midQtdConsultor = 0, midValConsultor = 0, grossConsultor = 0;
    
    // 🔥 ACUMULADORES DA LOJA
    let fatLoja = 0, portLoja = 0, midQtdLoja = 0, midValLoja = 0, grossLoja = 0;
    
    const mesAlvo = String(mesFiltro).padStart(2, '0');
    const anoAlvo = String(anoFiltro);
    
    // 🔥 PRIMEIRA PASSADA: Calcula TOTAIS DA LOJA e do CONSULTOR
    for (let i = 1; i < dataVendas.length; i++) {
      const linha = dataVendas[i];
      const valAJ = linha[colDataAJ];
      
      if (!valAJ || valAJ === "") continue;
      
      let mesFinal, anoFinal;
      if (valAJ instanceof Date) {
        mesFinal = String(valAJ.getMonth() + 1).padStart(2, '0');
        anoFinal = String(valAJ.getFullYear());
      } else {
        const match = String(valAJ).match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/);
        if (!match) continue;
        mesFinal = match[2].padStart(2, '0');
        anoFinal = match[3].length === 2 ? "20" + match[3] : match[3];
      }
      
      if (mesFinal !== mesAlvo || anoFinal !== anoAlvo) continue;
      
      const valor = parseFloat(linha[colVal]) || 0;
      const mod = String(linha[colMod] || "").toUpperCase();
      const vendedor = String(linha[colVend] || "S/V").toUpperCase().trim();
      
      // 🔥 Soma para a LOJA (todos os vendedores)
      if (/PRIMEIRA|NOVA|PORT|ADITIVO|MIGRA/i.test(mod)) {
        fatLoja += valor;
        if (!mod.includes("MIGRA")) grossLoja++;
      }
      if (/PORT/i.test(mod)) portLoja += valor;
      if (/MID|RENEG/i.test(mod)) {
        midQtdLoja++;
        midValLoja += valor;
      }
      
      // 🔥 Soma para o CONSULTOR específico
      if (vendedor === nomeConsultor) {
        const dataVenda = linha[colDataAJ];
        let dataFormatada = "";
        if (dataVenda instanceof Date) {
          dataFormatada = Utilities.formatDate(dataVenda, "GMT-3", "dd/MM/yyyy");
        } else {
          const match = String(dataVenda).match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/);
          if (match) dataFormatada = `${match[1]}/${match[2]}/${match[3]}`;
        }
        
        const dadosLinha = {
          data: dataFormatada,
          cliente: linha[colCli] || "Sem Nome",
          telefone: String(linha[colTel] || "---"),
          valor: valor
        };
        
        if (/PRIMEIRA|NOVA|PORT|ADITIVO|MIGRA/i.test(mod)) {
          fatConsultor += valor;
          if (!mod.includes("MIGRA")) grossConsultor++;
          lBase.push(dadosLinha);
        }
        if (/PORT/i.test(mod)) {
          portConsultor += valor;
          lPort.push(dadosLinha);
        }
        if (/MID|RENEG/i.test(mod)) {
          midQtdConsultor++;
          midValConsultor += valor;
          lMid.push(dadosLinha);
        }
      }
    }
    
    if (fatConsultor === 0 && midQtdConsultor === 0 && portConsultor === 0) {
      return {
        success: false,
        msg: "Nenhuma venda validada pelo BOC encontrada para " + mesAlvo + "/" + anoAlvo + "."
      };
    }
    
    // ============================================================
    // 🔥 DETERMINA AS TAXAS BASEADAS NO DESEMPENHO DA LOJA
    // AGORA USANDO A BASE (coluna K) QUANDO NÃO ATINGE A META
    // ============================================================
    let taxaFatAplicada = taxas.fat.base;     // ← BASE
    let taxaPortAplicada = taxas.port.base;   // ← BASE
    let taxaMidAplicada = taxas.reneg.base;   // ← BASE
    
    let statusFat = `BASE (${taxas.fat.base}%)`;
    let statusPort = `BASE (${taxas.port.base}%)`;
    let statusMid = `BASE (${taxas.reneg.base}%)`;
    let lojaDesbloqueada = true;
    
    if (metas) {
      // --- FATURAMENTO ---
      if (metas.fat.sup > 0 && fatLoja >= metas.fat.sup) {
        taxaFatAplicada = taxas.fat.sup;
        statusFat = `SUPERADO (${formatarMoeda(fatLoja)} ≥ ${formatarMoeda(metas.fat.sup)}) - Taxa: ${taxaFatAplicada}%`;
      } else if (metas.fat.target > 0 && fatLoja >= metas.fat.target) {
        taxaFatAplicada = taxas.fat.target;
        statusFat = `TARGET (${formatarMoeda(fatLoja)} ≥ ${formatarMoeda(metas.fat.target)}) - Taxa: ${taxaFatAplicada}%`;
      } else if (metas.fat.min > 0 && fatLoja >= metas.fat.min) {
        taxaFatAplicada = taxas.fat.min;
        statusFat = `MÍNIMO (${formatarMoeda(fatLoja)} ≥ ${formatarMoeda(metas.fat.min)}) - Taxa: ${taxaFatAplicada}%`;
      } else {
        // ✅ NÃO ATINGIU A META → USA A BASE (coluna K)
        taxaFatAplicada = taxas.fat.base;
        statusFat = `NÃO ATINGIU META - Taxa BASE: ${taxaFatAplicada}%`;
      }
      
      // --- PORTABILIDADE ---
      if (metas.port.sup > 0 && portLoja >= metas.port.sup) {
        taxaPortAplicada = taxas.port.sup;
        statusPort = `SUPERADO (${formatarMoeda(portLoja)} ≥ ${formatarMoeda(metas.port.sup)}) - Taxa: ${taxaPortAplicada}%`;
      } else if (metas.port.target > 0 && portLoja >= metas.port.target) {
        taxaPortAplicada = taxas.port.target;
        statusPort = `TARGET (${formatarMoeda(portLoja)} ≥ ${formatarMoeda(metas.port.target)}) - Taxa: ${taxaPortAplicada}%`;
      } else if (metas.port.min > 0 && portLoja >= metas.port.min) {
        taxaPortAplicada = taxas.port.min;
        statusPort = `MÍNIMO (${formatarMoeda(portLoja)} ≥ ${formatarMoeda(metas.port.min)}) - Taxa: ${taxaPortAplicada}%`;
      } else {
        // ✅ NÃO ATINGIU A META → USA A BASE (coluna K)
        taxaPortAplicada = taxas.port.base;
        statusPort = `NÃO ATINGIU META - Taxa BASE: ${taxaPortAplicada}%`;
      }
      
      // --- RENEGOCIAÇÃO (MID) ---
      const gatilho60 = metas.fat.min ? metas.fat.min * 0.60 : 0;
      lojaDesbloqueada = (gatilho60 === 0 || fatLoja >= gatilho60);
      
      if (!lojaDesbloqueada) {
        taxaMidAplicada = 0;
        statusMid = `BLOQUEADO (Loja não atingiu 60% da meta FAT)`;
      } else if (metas.mid.sup > 0 && midQtdLoja >= metas.mid.sup) {
        taxaMidAplicada = taxas.reneg.sup;
        statusMid = `SUPERADO (${midQtdLoja} MIDs ≥ ${metas.mid.sup}) - Taxa: ${taxaMidAplicada}%`;
      } else if (metas.mid.target > 0 && midQtdLoja >= metas.mid.target) {
        taxaMidAplicada = taxas.reneg.target;
        statusMid = `TARGET (${midQtdLoja} MIDs ≥ ${metas.mid.target}) - Taxa: ${taxaMidAplicada}%`;
      } else if (metas.mid.min > 0 && midQtdLoja >= metas.mid.min) {
        taxaMidAplicada = taxas.reneg.min;
        statusMid = `MÍNIMO (${midQtdLoja} MIDs ≥ ${metas.mid.min}) - Taxa: ${taxaMidAplicada}%`;
      } else {
        // ✅ NÃO ATINGIU A META → USA A BASE (coluna K)
        taxaMidAplicada = taxas.reneg.base;
        statusMid = `NÃO ATINGIU META MÍNIMA - Taxa BASE: ${taxaMidAplicada}%`;
      }
    }
    
    // 🔥 CALCULA OS VALORES FINAIS DO CONSULTOR
    const vBase = fatConsultor * (taxaFatAplicada / 100);
    const vPort = portConsultor * (taxaPortAplicada / 100);
    const vMid = midValConsultor * (taxaMidAplicada / 100);
    const totalFinal = vBase + vPort + vMid;
    
    console.log(`📊 EXTRATO ${nomeConsultor}: FAT:${fatConsultor} x ${taxaFatAplicada}% = ${vBase} | PORT: ${vPort} | MID: ${vMid} | TOTAL: ${totalFinal}`);
    
    return {
      success: true,
      consultor: nomeConsultor,
      referencia: `${mesAlvo}/${anoAlvo}`,
      resumo: {
        fat: fatConsultor,
        portVal: portConsultor,
        midQtd: midQtdConsultor,
        vMidFaturamento: midValConsultor,
        vBase: vBase,
        vPort: vPort,
        vMid: vMid,
        total: totalFinal,
        gross: grossConsultor,
        // Dados da LOJA
        fatTotalLoja: fatLoja,
        portTotalLoja: portLoja,
        midQtdTotalLoja: midQtdLoja,
        fatMinMeta: metas ? metas.fat.min : 0,
        fatTargetMeta: metas ? metas.fat.target : 0,
        fatSupMeta: metas ? metas.fat.sup : 0,
        metaMidMin: metas ? metas.mid.min : 0,
        metaMidTarget: metas ? metas.mid.target : 0,
        metaMidSup: metas ? metas.mid.sup : 0,
        taxaFatAplicada: taxaFatAplicada,
        taxaPortAplicada: taxaPortAplicada,
        taxaMidAplicada: taxaMidAplicada
      },
      taxas: {
        b: taxaFatAplicada + "%",
        p: taxaPortAplicada + "%",
        r: taxaMidAplicada + "%"
      },
      listas: { base: lBase, port: lPort, mid: lMid },
      taxasLoja: {
        fat: taxaFatAplicada,
        port: taxaPortAplicada,
        mid: taxaMidAplicada,
        statusFat: statusFat,
        statusPort: statusPort,
        statusMid: statusMid,
        lojaDesbloqueada: lojaDesbloqueada
      },
      totaisLoja: {
        fat: fatLoja,
        port: portLoja,
        midQtd: midQtdLoja
      }
    };
    
  } catch (e) {
    console.error("Erro em getDadosComissaoIndividual:", e);
    return { success: false, msg: e.toString() };
  }
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}
/**
 * Busca os percentuais de comissão configurados na aba PERCENTUAIS_CONFIG
 * 🔥 CORRIGIDA: SEM valores fixos! Se não encontrar na planilha, retorna null
 * 
 * Estrutura esperada da planilha:
 * Coluna A (0) = ID_REGRA (ex: "ATUAL")
 * Coluna B (1) = FAT_MIN_PERC
 * Coluna C (2) = FAT_TARGET_PERC
 * Coluna D (3) = FAT_SUP_PERC
 * Coluna E (4) = PORT_MIN_PERC
 * Coluna F (5) = PORT_TARGET_PERC
 * Coluna G (6) = PORT_SUP_PERC
 * Coluna H (7) = RENEG_MIN_PERC
 * Coluna I (8) = RENEG_TARGET_PERC
 * Coluna J (9) = RENEG_SUP_PERC
 */
function buscarPercentuaisComissao() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("PERCENTUAIS_CONFIG");
    
    if (!sheet) {
      console.error("❌ Aba PERCENTUAIS_CONFIG não encontrada!");
      return null;
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length < 2) {
      console.error("❌ Aba PERCENTUAIS_CONFIG está vazia! Configure os percentuais na planilha.");
      return null;
    }
    
    // Linha 2 (primeira linha de dados após o cabeçalho)
    const r = data[1];
    
    // Lê os percentuais (colunas B a J)
    const fatMin = r[1];
    const fatTarget = r[2];
    const fatSup = r[3];
    const portMin = r[4];
    const portTarget = r[5];
    const portSup = r[6];
    const renegMin = r[7];
    const renegTarget = r[8];
    const renegSup = r[9];
    
    // 🔥 Lê a coluna K (BASE) – índice 10
    const base = r[10] !== undefined ? Number(r[10]) : 10; // fallback 10
    
    // Valida se todos os campos obrigatórios são números (B a J)
    if (isNaN(Number(fatMin)) || isNaN(Number(fatTarget)) || isNaN(Number(fatSup)) ||
        isNaN(Number(portMin)) || isNaN(Number(portTarget)) || isNaN(Number(portSup)) ||
        isNaN(Number(renegMin)) || isNaN(Number(renegTarget)) || isNaN(Number(renegSup))) {
      console.error("❌ Aba PERCENTUAIS_CONFIG com valores inválidos! Verifique se todos os campos são números.");
      return null;
    }
    
    // A base pode ser 0 ou um número válido; se for inválida, usa 10
    const baseValida = !isNaN(Number(base)) ? Number(base) : 10;
    
    const percentuais = {
      fat: {
        min: Number(fatMin),
        target: Number(fatTarget),
        sup: Number(fatSup),
        base: baseValida   // ← coluna K
      },
      port: {
        min: Number(portMin),
        target: Number(portTarget),
        sup: Number(portSup),
        base: baseValida   // ← coluna K
      },
      reneg: {
        min: Number(renegMin),
        target: Number(renegTarget),
        sup: Number(renegSup),
        base: baseValida   // ← coluna K
      }
    };
    
    console.log("📊 Percentuais carregados da planilha (com BASE):");
    console.log(`   FAT - Mín: ${percentuais.fat.min}% | Target: ${percentuais.fat.target}% | Sup: ${percentuais.fat.sup}% | Base: ${percentuais.fat.base}%`);
    console.log(`   PORT - Mín: ${percentuais.port.min}% | Target: ${percentuais.port.target}% | Sup: ${percentuais.port.sup}% | Base: ${percentuais.port.base}%`);
    console.log(`   RENEG - Mín: ${percentuais.reneg.min}% | Target: ${percentuais.reneg.target}% | Sup: ${percentuais.reneg.sup}% | Base: ${percentuais.reneg.base}%`);
    
    return percentuais;
    
  } catch (e) {
    console.error("❌ Erro em buscarPercentuaisComissao:", e);
    return null;
  }
}


// --- MÓDULO FINANCEIRO ---

function getDadosFinanceiros(mesFiltro, anoFiltro) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetVendas = ss.getSheetByName("VENDAS");
    if (!sheetVendas) return [];

    // 1. Busca Metas e Percentuais para o cálculo real
    const metasConfig = buscarMetasAtuais(); 
    const dataVendas = sheetVendas.getDataRange().getValues();
    const cabecalho = dataVendas[0];

    // Mapeamento de colunas conforme sua estrutura
    const col = {
      dataVenda: 1, // Coluna B
      cliente: 3,   // Coluna D
      telefone: 6,  // Coluna G
      vendedor: cabecalho.findIndex(c => /VENDEDOR|CONSULTOR/i.test(c)),
      valor: cabecalho.findIndex(c => /VALOR/i.test(c)),
      modalidade: cabecalho.findIndex(c => /MODALIDADE/i.test(c)),
      dataAJ: 35 // Coluna AJ (Índice 35)
    };

    const mesAlvo = String(mesFiltro).padStart(2, '0');
    const anoAlvo = String(anoFiltro);
    
    // Objeto para consolidar dados por consultor
    let consolidado = {};

    for (let i = 1; i < dataVendas.length; i++) {
      const linha = dataVendas[i];
      const valAJ = linha[col.dataAJ];

      // 🛑 REGRA SOBERANA: Se AJ estiver vazia, ignora a venda
      if (!valAJ || valAJ === "") continue;

      let mesFinal, anoFinal;

      // Extração da data da Coluna AJ (Trata Date ou String do Backoffice)
      if (valAJ instanceof Date) {
        mesFinal = String(valAJ.getMonth() + 1).padStart(2, '0');
        anoFinal = String(valAJ.getFullYear());
      } else {
        let matchAJ = String(valAJ).match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/);
        if (matchAJ) {
          mesFinal = matchAJ[2].padStart(2, '0');
          anoFinal = matchAJ[3].length === 2 ? "20" + matchAJ[3] : matchAJ[3];
        } else { continue; }
      }

      // Filtro de Competência (Mês/Ano selecionado no Painel)
      if (mesFinal !== mesAlvo || anoFinal !== anoAlvo) continue;

      const nomeVendedor = String(linha[col.vendedor] || "NÃO IDENTIFICADO").toUpperCase().trim();
      const valor = parseFloat(linha[col.valor]) || 0;
      const mod = String(linha[col.modalidade] || "").toUpperCase();

      // 🌟 INICIALIZA O CONSOLIDADO COM AS LISTAS PARA O EXTRATO FUNCIONAR
      if (!consolidado[nomeVendedor]) {
        consolidado[nomeVendedor] = { 
          fat: 0, port: 0, midVal: 0, midQtd: 0, gross: 0,
          listaBase: [], listaPort: [], listaReneg: [] 
        };
      }

      // Prepara os dados da linha para a tabela do Extrato
      let dataVendaFormatada = linha[col.dataVenda];
      if (dataVendaFormatada instanceof Date) {
        dataVendaFormatada = Utilities.formatDate(dataVendaFormatada, "GMT-3", "dd/MM/yyyy");
      } else {
        dataVendaFormatada = String(dataVendaFormatada || "");
      }

      const infoVenda = {
        data: dataVendaFormatada,
        cliente: linha[col.cliente] || "-",
        telefone: linha[col.telefone] || "-",
        valor: valor
      };

      const c = consolidado[nomeVendedor];
      if (/PRIMEIRA|NOVA|PORT|ADITIVO|MIGRA/i.test(mod)) {
        c.fat += valor;
        if (!mod.includes("MIGRA")) c.gross++;
      }
      
      // 🌟 SEPARA CADA VENDA NA SUA LISTA CORRETA
      if (/PORT/i.test(mod)) {
        c.port += valor;
        c.listaPort.push(infoVenda);
      } else if (/MID|RENEG/i.test(mod)) {
        c.midQtd += 1;
        c.midVal += valor;
        c.listaReneg.push(infoVenda);
      } else {
        c.listaBase.push(infoVenda);
      }
    }

    // 2. Transforma o consolidado em lista e calcula a comissão real de cada um
    let listaFinal = [];
    for (let consultor in consolidado) {
      const d = consolidado[consultor];
      
      // Injeta o Gross para cálculo da qualidade (se houver) e meta
      let metasVendedor = JSON.parse(JSON.stringify(metasConfig));
      metasVendedor.grossAtual = d.gross;

      // Chama a função com a nova regra de Renegociação
      const calc = calcularComissaoReal(d.fat, d.port, d.midVal, d.midQtd, metasVendedor);

      listaFinal.push({
        consultor: consultor,
        referencia: `${mesAlvo}/${anoAlvo}`,
        vBase: calc.base,
        vPort: calc.port,
        vReneg: calc.reneg,
        total: calc.total,
        faturamentoTotal: d.fat, // Valor real vendido validado
        // 🌟 EMPACOTA TUDO QUE O EXTRATO PRECISA AQUI:
        resumo: {
          fat: d.fat, portVal: d.port, midQtd: d.midQtd, vMidFaturamento: d.midVal,
          vBase: calc.base, vPort: calc.port, vMid: calc.reneg, total: calc.total, gross: d.gross
        },
        taxas: {
          b: calc.taxas.b + "%", p: calc.taxas.p + "%", m: calc.taxas.r + "%"
        },
        listas: {
          base: d.listaBase, port: d.listaPort, reneg: d.listaReneg
        },
        comissao: calc
      });
    }

    return listaFinal.sort((a, b) => b.total - a.total);

  } catch (e) {
    console.error("Erro getDadosFinanceiros: " + e.message);
    return [];
  }
}


/**
 * 🧮 MOTOR DE CÁLCULO DEFINITIVO - REGRA POR LOJA
 * A faixa de comissão é definida pelo DESEMPENHO DA LOJA (todos os consultores somados)
 * 🔥 CORRIGIDA: Agora todos os consultores recebem a MESMA faixa baseada no total da loja
 */
function calcularComissaoReal(fatReal, portReal, midVal, midQtd, metas, totaisLoja = null) {
  const taxas = buscarPercentuaisComissao();
  if (!taxas) return { total: 0, erro: "Taxas não configuradas" };
  
  let res = { base: 0, port: 0, reneg: 0, total: 0, taxas: { b: 0, p: 0, r: 0 }, travaMetaMinima: false, statusReneg: "" };
  
  // 🔥 REGRA POR LOJA: Usa os TOTAIS DA LOJA (se fornecidos) ou os valores individuais
  const fatLoja = totaisLoja ? totaisLoja.fat : fatReal;
  const portLoja = totaisLoja ? totaisLoja.port : portReal;
  const midQtdLoja = totaisLoja ? totaisLoja.midQtd : midQtd;
  const midValLoja = totaisLoja ? totaisLoja.midVal : midVal;
  
  // 1. FATURAMENTO (BASE) - Baseado no desempenho da LOJA
  if (metas.fat.sup > 0 && fatLoja >= metas.fat.sup) {
    res.taxas.b = taxas.fat.sup;
    res.statusReneg = `LOJA Superou meta FAT (${fatLoja.toFixed(2)} >= ${metas.fat.sup})`;
  } 
  else if (metas.fat.target > 0 && fatLoja >= metas.fat.target) {
    res.taxas.b = taxas.fat.target;
    res.statusReneg = `LOJA Atingiu target FAT (${fatLoja.toFixed(2)} >= ${metas.fat.target})`;
  } 
  else if (metas.fat.min > 0 && fatLoja >= metas.fat.min) {
    res.taxas.b = taxas.fat.min;
    res.statusReneg = `LOJA Atingiu mínimo FAT (${fatLoja.toFixed(2)} >= ${metas.fat.min})`;
  } 
  else {
    res.taxas.b = 10; // Percentual mínimo padrão
    res.statusReneg = `LOJA não atingiu meta FAT (${fatLoja.toFixed(2)} < ${metas.fat.min})`;
  }
  res.base = fatReal * (res.taxas.b / 100);

  // 2. PORTABILIDADE - Baseado no desempenho da LOJA
  if (metas.port.sup > 0 && portLoja >= metas.port.sup) {
    res.taxas.p = taxas.port.sup;
  } 
  else if (metas.port.target > 0 && portLoja >= metas.port.target) {
    res.taxas.p = taxas.port.target;
  } 
  else if (metas.port.min > 0 && portLoja >= metas.port.min) {
    res.taxas.p = taxas.port.min;
  } 
  else {
    res.taxas.p = 10;
  }
  res.port = portReal * (res.taxas.p / 100);

  // 3. RENEGOCIAÇÃO (MID) - Baseado no desempenho da LOJA
  const metaMid = metas.mid || { min: 0, target: 0, sup: 0 };
  const txMid = taxas.reneg || { min: 10, target: 10, sup: 10 };
  
  const qtdReal = Number(midQtdLoja || 0);
  
  // Liberação da loja: 60% da meta mínina de FAT
  const isUnlockedFat = metas.fat.min && (fatLoja >= metas.fat.min * 0.60);
  
  if (!isUnlockedFat) {
    res.taxas.r = 0;
    res.travaMetaMinima = true; 
    res.statusReneg += " | Renegociação BLOQUEADA (Loja < 60% da meta FAT)";
  } else {
    res.travaMetaMinima = false;
    
    // Regra baseada na QUANTIDADE de MIDs da LOJA
    if (metaMid.sup > 0 && qtdReal >= metaMid.sup) {
      res.taxas.r = Number(txMid.sup);
      res.statusReneg += ` | Reneg: Superado (${qtdReal} MIDs >= ${metaMid.sup})`;
    } 
    else if (metaMid.target > 0 && qtdReal >= metaMid.target) {
      res.taxas.r = Number(txMid.target);
      res.statusReneg += ` | Reneg: Target (${qtdReal} MIDs >= ${metaMid.target})`;
    } 
    else if (metaMid.min > 0 && qtdReal >= metaMid.min) {
      res.taxas.r = Number(txMid.min);
      res.statusReneg += ` | Reneg: Mínimo (${qtdReal} MIDs >= ${metaMid.min})`;
    } 
    else {
      res.taxas.r = 10;
      res.statusReneg += ` | Reneg: 10% (${qtdReal} MIDs < ${metaMid.min})`;
    }
  }
  
  res.reneg = midVal * (res.taxas.r / 100);
  res.total = res.base + res.port + res.reneg;
  
  return res;
}

// Função para salvar novos percentuais via Frontend
function salvarPercentuaisConfig(dados) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("PERCENTUAIS_CONFIG");
    
    // Se a aba não existir, criamos ela na hora
    if (!sheet) {
      sheet = ss.insertSheet("PERCENTUAIS_CONFIG");
      sheet.appendRow([
        "ID_REGRA", "FAT_MIN", "FAT_TARGET", "FAT_SUP", 
        "PORT_MIN", "PORT_TARGET", "PORT_SUP", 
        "RENEG_MIN", "RENEG_TARGET", "RENEG_SUP"
      ]);
    }

    // Prepara a linha com ID_REGRA na coluna A e os dados nas demais
    const valores = [[
      "ATUAL", // Coluna A: ID_REGRA
      dados.fat_min, dados.fat_target, dados.fat_sup,
      dados.port_min, dados.port_target, dados.port_sup,
      dados.reneg_min, dados.reneg_target, dados.reneg_sup
    ]];

    // Grava sempre na linha 2 (abaixo do cabeçalho)
    sheet.getRange(2, 1, 1, 10).setValues(valores);
    
    return { success: true };
  } catch (e) {
    return { success: false, msg: e.toString() };
  }
}
/**
 * Busca os percentuais atuais para preencher o Modal no Frontend
 */
function obterConfigPercentuaisParaModal() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("PERCENTUAIS_CONFIG");
    if (!sheet) return null;

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return null;

    const r = data[1]; // Linha 2 (onde estão os dados)
    
    return {
      success: true,
      dados: {
        fat_min: r[1], fat_target: r[2], fat_sup: r[3],
        port_min: r[4], port_target: r[5], port_sup: r[6],
        reneg_min: r[7], reneg_target: r[8], reneg_sup: r[9]
      }
    };
  } catch (e) {
    return { success: false, msg: e.toString() };
  }
}
/**
 * Registra o pagamento detalhado por modalidade para auditoria futura
 */
function registrarPagamento(dados) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("PAGAMENTOS_HIST") || ss.insertSheet("PAGAMENTOS_HIST");
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "ID_PAG", "DATA_REGISTRO", "CONSULTOR", "MES_REF", "ANO_REF", 
        "FAT_TOTAL", "GROSS", "V_BASE", "V_PORT", "V_RENEG", "TOTAL_PAGO", "STATUS"
      ]);
      sheet.getRange("A1:L1").setFontWeight("bold");
    }

    const idPag = "PAG-" + new Date().getTime();
    const dataHoje = new Date();
    
    // Forçamos a conversão para garantir que chegue como número na planilha
    const linha = [
      idPag,
      dataHoje,
      String(dados.consultor),
      dataHoje.getMonth() + 1,
      dataHoje.getFullYear(),
      Number(dados.fatTotal || 0),
      Number(dados.gross || 0),
      Number(dados.vBase || 0),
      Number(dados.vPort || 0),
      Number(dados.vReneg || 0),
      Number(dados.totalPago || 0),
      "PAGO"
    ];

    sheet.appendRow(linha);
    SpreadsheetApp.flush(); // Força a gravação imediata
    
    return { success: true };
  } catch (e) {
    console.error("Erro no registrarPagamento: " + e.toString());
    return { success: false, msg: e.toString() };
  }
}

/**
 * Busca o histórico detalhado para exibição no Frontend
 */
function getHistoricoPagamentos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("PAGAMENTOS_HIST");
  if (!sheet) return [];
  
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  return values.slice(1).map(linha => ({
    data: Utilities.formatDate(new Date(linha[1]), "GMT-3", "dd/MM/yyyy"),
    consultor: linha[2],
    referencia: `${linha[3]}/${linha[4]}`,
    faturamento: linha[5],
    gross: linha[6],
    vBase: linha[7],
    vPort: linha[8],
    vReneg: linha[9],
    total: linha[10]
  })).reverse();
}
/**

/**
 * Consulta CNPJ com sistema de redundância (BrasilAPI -> ReceitaWS)
 */
function consultarDadosCNPJ(cnpj) {
  // 1. Limpeza total: Garante que só existam números
  const cnpjLimpo = String(cnpj).replace(/[^\d]/g, ''); 
  
  if (cnpjLimpo.length !== 14) {
    return { success: false, message: "CNPJ inválido. Deve ter 14 dígitos." };
  }

  // --- TENTATIVA 1: BrasilAPI ---
  try {
    const response = UrlFetchApp.fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`, { 'muteHttpExceptions': true });
    if (response.getResponseCode() === 200) {
      const json = JSON.parse(response.getContentText());
      return {
        success: true,
        razao: json.razao_social || json.nome_fantasia,
        cep: json.cep,
        logradouro: json.logradouro,
        numero: json.numero,
        bairro: json.bairro,
        cidade: json.municipio,
        uf: json.uf,
        complemento: json.complemento || ""
      };
    }
  } catch (e) {
    console.warn("BrasilAPI falhou, tentando backup...");
  }

  // --- TENTATIVA 2: Backup ReceitaWS (Caso a primeira falhe) ---
  try {
    const responseBackup = UrlFetchApp.fetch(`https://receitaws.com.br/v1/cnpj/${cnpjLimpo}`, { 'muteHttpExceptions': true });
    if (responseBackup.getResponseCode() === 200) {
      const jsonB = JSON.parse(responseBackup.getContentText());
      if (jsonB.status !== "ERROR") {
        return {
          success: true,
          razao: jsonB.nome,
          cep: jsonB.cep.replace(/[^\d]/g, ''),
          logradouro: jsonB.logradouro,
          numero: jsonB.numero,
          bairro: jsonB.bairro,
          cidade: jsonB.municipio,
          uf: jsonB.uf,
          complemento: jsonB.complemento || ""
        };
      }
    }
  } catch (e) {
    console.error("Backup também falhou: " + e.toString());
  }

  return { success: false, message: "Serviços de consulta instáveis. Tente novamente ou preencha manualmente." };
}
function registrarLogFaturaAgrupado(indices, ciclos, usuarioNome) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("VENDAS");
    const agora = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy HH:mm");
    const colMap = { "m1": 27, "m2": 28, "m3": 29, "m7": 30, "m14": 31 };

    // Percorre cada linha da planilha que pertence ao grupo
    indices.forEach(linha => {
      ciclos.forEach(ciclo => {
        const col = colMap[ciclo];
        const range = sheet.getRange(linha, col);
        const notaAntiga = range.getNote();
        const novaEntrada = `✅ Enviado por: ${usuarioNome} em ${agora}`;
        
        range.setNote(notaAntiga ? notaAntiga + "\n" + novaEntrada : novaEntrada);
        range.setBackground("#dcfce7"); // Verde para indicar sucesso
      });
    });
    return true;
  } catch (e) {
    return "Erro: " + e.toString();
  }
}

/**
 * REGISTRO VEXO INTELIGENTE: Gravação em Massa por Contrato Corporativo
 * Localiza todas as linhas que compartilham o mesmo DNA (CNPJ + Data de Ativação)
 * e carimba a nota de envio exatamente na célula do ciclo correspondente.
 */
function registrarEnvioEmMassa(cnpjAlvo, dataAtivAlvo, ciclos, nomeUsuario) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("VENDAS");
    if (!sheet) throw new Error("Aba VENDAS não encontrada.");

    const valores = sheet.getDataRange().getValues();
    
    // Funções de normalização para evitar erros de "match"
    const limparCnpj = (v) => String(v || "").replace(/\D/g, '').trim();
    const normalizarData = (d) => {
      if (!d || d === "" || d === "-") return "";
      if (d instanceof Date) return Utilities.formatDate(d, "GMT-3", "dd/MM/yyyy");
      // Caso seja string, remove espaços extras
      return String(d).trim();
    };

    const cnpjBuscado = limparCnpj(cnpjAlvo);
    const dataBuscada = normalizarData(dataAtivAlvo);
    
    // Configuração da Nota de Auditoria
    const agora = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy HH:mm");
    const textoNota = `FATURA ENVIADA\nEnviada por: ${nomeUsuario}\nData/Hora: ${agora}`;
    
    // Mapeamento das colunas de vencimento (AA=27 até AE=31)
    const colMap = { 'm1': 27, 'm2': 28, 'm3': 29, 'm7': 30, 'm14': 31 };

    let linhasProcessadas = 0;

    // Loop pelas linhas da planilha (pula o cabeçalho i=0)
    for (let i = 1; i < valores.length; i++) {
      const cnpjLinha = limparCnpj(valores[i][2]);       // Coluna C (Índice 2)
      const dataAtivLinha = normalizarData(valores[i][25]); // Coluna Z (Índice 25)

      // Verificação: Se o CNPJ e a Data de Ativação batem com o card clicado
      if (cnpjLinha === cnpjBuscado && dataAtivLinha === dataBuscada) {
        
        ciclos.forEach(ciclo => {
          const numColuna = colMap[ciclo.toLowerCase()];
          if (numColuna) {
            // Acessa a célula específica daquela linha e daquele ciclo de vencimento
            const rangeAlvo = sheet.getRange(i + 1, numColuna);
            
            // Grava a anotação (triângulo preto no canto da célula)
            rangeAlvo.setNote(textoNota);
            
            // Estilização visual para conferência na planilha
            rangeAlvo.setBackground("#dcfce7"); // Verde claro (VEXO Success)
            rangeAlvo.setFontColor("#15803d");  // Texto verde escuro
            rangeAlvo.setFontWeight("bold");
          }
        });
        linhasProcessadas++;
      }
    }
    
    // Força o Google Sheets a salvar as alterações antes de responder ao site
    SpreadsheetApp.flush();
    
    return `✅ Sucesso! Notificação registrada em ${linhasProcessadas} linhas do contrato.`;

  } catch (e) {
    console.error("Erro VEXO registrarEnvioEmMassa: " + e.toString());
    return "❌ Erro no servidor: " + e.toString();
  }
}

/**
 * BAIXA FINANCEIRA VEXO PROFISSIONAL
 * Registra o pagamento em todas as linhas do contrato (DNA: CNPJ + Data Ativação).
 * Preserva o histórico de envios e destaca a baixa com nome do usuário e data/hora.
 */
function registrarPagamentoMassa(cnpjAlvo, dataAtivAlvo, ciclos, nomeUsuario) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("VENDAS");
    if (!sheet) throw new Error("Aba VENDAS não encontrada!");

    const rangeCompleto = sheet.getDataRange();
    const valores = rangeCompleto.getValues();
    
    // Normalização para garantir o cruzamento de dados (DNA do contrato)
    const limparCnpj = (v) => String(v || "").replace(/\D/g, '').trim();
    const normalizarData = (d) => {
      if (d instanceof Date) return Utilities.formatDate(d, "GMT-3", "dd/MM/yyyy");
      return String(d || "").trim();
    };

    const cnpjBuscado = limparCnpj(cnpjAlvo);
    const dataBuscada = normalizarData(dataAtivAlvo);
    const agora = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy HH:mm");
    
    // Mapeamento das colunas de ciclos (AA=27 até AE=31)
    const colMap = { 'm1': 27, 'm2': 28, 'm3': 29, 'm7': 30, 'm14': 31 };

    let totalLinhasAfetadas = 0;

    for (let i = 1; i < valores.length; i++) {
      const cnpjLinha = limparCnpj(valores[i][2]);
      const dataAtivLinha = normalizarData(valores[i][25]);

      if (cnpjLinha === cnpjBuscado && dataAtivLinha === dataBuscada) {
        
        ciclos.forEach(ciclo => {
          const numColuna = colMap[ciclo.toLowerCase()];
          if (numColuna) {
            const rangeAlvo = sheet.getRange(i + 1, numColuna);
            const notaAtual = rangeAlvo.getNote();

            // Só aplica se não estiver marcado como PAGO para não sobrescrever histórico útil
            if (!notaAtual.toUpperCase().includes("FATURA PAGA")) {
              
              const novaNota = `✅ FATURA PAGA\n` +
                               `MARCADO POR: ${nomeUsuario.toUpperCase()}\n` +
                               `DATA DA BAIXA: ${agora}\n` +
                               `----------------------------------\n` +
                               (notaAtual ? notaAtual : "Sem histórico anterior.");

              // Aplica as mudanças
              rangeAlvo.setNote(novaNota);
              
              // 🔥 O SEGREDO DO PERSISTÊNCIA: Além da nota, vamos colocar "PAGO" no valor da célula
              // Isso serve como redundância caso o getNotes falhe no F5
              const valorDataOriginal = valores[i][numColuna - 1]; 
              rangeAlvo.setValue("PAGO " + normalizarData(valorDataOriginal));

              // Estilização VEXO Financeiro
              rangeAlvo.setBackground("#e0f2fe"); 
              rangeAlvo.setFontColor("#0369a1");  
              rangeAlvo.setFontWeight("bold");
            }
          }
        });
        totalLinhasAfetadas++;
      }
    }
    
    // FORÇA A GRAVAÇÃO IMEDIATA: Sem isso, o F5 pode ler dados antigos
    SpreadsheetApp.flush();
    
    return `✔️ Pagamento baixado com sucesso em ${totalLinhasAfetadas} linhas do cliente.`;

  } catch (e) {
    console.error("Erro VEXO Pgto: " + e.toString());
    return "❌ Erro ao processar baixa: " + e.toString();
  }
}
function estornarPagamentoVexo(cnpjAlvo, dataAtivAlvo, cicloAlvo) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("VENDAS");
    const valores = sheet.getDataRange().getValues();
    
    const colMap = { 'm1': 27, 'm2': 28, 'm3': 29, 'm7': 30, 'm14': 31 };
    const numColuna = colMap[cicloAlvo.toLowerCase()];
    const limpar = (v) => String(v || "").replace(/\D/g, '').trim();

    for (let i = 1; i < valores.length; i++) {
      const cnpjPlanilha = limpar(valores[i][2]);
      const dataAtivPlanilha = valores[i][25] instanceof Date ? Utilities.formatDate(valores[i][25], "GMT-3", "dd/MM/yyyy") : String(valores[i][25]);

      if (cnpjPlanilha === limpar(cnpjAlvo) && dataAtivPlanilha === dataAtivAlvo) {
        const range = sheet.getRange(i + 1, numColuna);
        
        // 1. Recupera a nota atual
        let notaAtual = range.getNote();
        
        // 2. Remove apenas o bloco que começa com ✅ FATURA PAGA até a linha pontilhada
        // Essa Regex remove o cabeçalho de pagamento mas preserva o que estiver abaixo
        let novaNota = notaAtual.replace(/✅ FATURA PAGA[\s\S]*?----------------------------------\n?/, "").trim();
        
        // 3. Recupera a data original do valor da célula
        let valorExibido = range.getDisplayValue();
        let dataOriginal = valorExibido.replace(/PAGO\s*/i, "").trim();
        
        // 4. Aplica as mudanças preservando o histórico (Fatura Enviada, etc)
        range.setValue(dataOriginal);
        range.setNote(novaNota);
        
        // 5. Se sobrar "FATURA ENVIADA" na nota, voltamos para a cor verde, senão removemos a cor
        if (novaNota.toUpperCase().includes("FATURA ENVIADA")) {
          range.setBackground("#dcfce7"); // Verde suave
          range.setFontColor("#15803d");
        } else {
          range.setBackground(null);
          range.setFontColor(null);
          range.setFontWeight("normal");
        }
      }
    }
    SpreadsheetApp.flush();
    return "Estorno realizado preservando histórico.";
  } catch (e) {
    return "Erro: " + e.toString();
  }
}

function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}
function fazerLogout() {
  // Limpa a memória da sessão
  sessionStorage.removeItem('usuarioLogado');
  sessionStorage.clear();
  
  // Recarrega o IFRAME. Como a memória está vazia, o sistema parará na tela de login.
  window.location.reload(); 
}
function excluirLeadPlanilha(idLead) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("PROSPECCAO"); // Verifique o nome real da aba de leads
  const dados = sheet.getDataRange().getValues();
  
  for (let i = 1; i < dados.length; i++) {
    // Supondo que o ID esteja na Coluna A (índice 0)
    if (dados[i][0].toString() === idLead.toString()) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  throw "Lead não encontrado para exclusão.";
}

// --- FUNÇÃO PARA BUSCAR HISTÓRICO DE CLIENTE ---
function buscarHistoricoCliente(termoBusca) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("VENDAS");
    
    if (!sheet) {
      return { success: false, dados: [], message: "Aba VENDAS não encontrada" };
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: true, dados: [], message: "Planilha vazia" };
    }

    const termo = termoBusca ? termoBusca.toString().toUpperCase().trim() : "";
    if (termo === "") return { success: true, dados: [] };

    // 1. Filtra as linhas buscando pelo CNPJ (índice 2) ou Razão Social (índice 3)
    const resultadosBrutos = data.slice(1).filter(row => {
      const cnpj = String(row[2] || "").toUpperCase();
      const razao = String(row[3] || "").toUpperCase();
      return cnpj.indexOf(termo) !== -1 || razao.indexOf(termo) !== -1;
    });

    // 2. O SEGREDO PROFISSIONAL: Sanitização dos dados
    // Converte tudo para texto e transforma as Datas do Google Sheets em formato Brasileiro (DD/MM/AAAA)
    // Isso impede que o servidor engasgue e retorne "null" (resposta vazia)
    const resultadosSanitizados = resultadosBrutos.map(row => {
      return row.map(celula => {
        if (celula instanceof Date) {
          const dia = String(celula.getDate()).padStart(2, '0');
          const mes = String(celula.getMonth() + 1).padStart(2, '0');
          const ano = celula.getFullYear();
          return `${dia}/${mes}/${ano}`;
        }
        return celula === null || celula === undefined ? "" : String(celula);
      });
    });

    // 3. Retorna os dados limpos e prontos para o HTML ler
    return { 
      success: true, 
      dados: resultadosSanitizados 
    };

  } catch (e) {
    console.error("Erro interno: " + e.toString());
    return { success: false, dados: [], message: e.toString() };
  }
}

/**
 * MOTOR DE RENOVAÇÕES VEXO
 * Busca contratos automáticos (+24 meses) e Agendamentos Manuais
 */
function buscarRenovacoesAutomaticas() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); 

    const resultados = [];
    const mapaCnpjsProcessados = new Set(); 

    // --- 1. BUSCA AGENDAMENTOS MANUAIS (Aba RENOVACOES) ---
    const sheetRenov = ss.getSheetByName("RENOVACOES");
    if (sheetRenov) {
      const dadosRenov = sheetRenov.getDataRange().getValues();
      for (let i = 1; i < dadosRenov.length; i++) {
        const cliente = dadosRenov[i][0];
        const cnpj = String(dadosRenov[i][1] || "").trim();
        const dataProgramada = dadosRenov[i][2]; // Coluna C
        const consultorManual = dadosRenov[i][5]; // ✅ ADICIONADO: Captura a Coluna F (índice 5)
        
        if (!cnpj || !dataProgramada) continue;

        let dataAlvo = null;
        if (dataProgramada instanceof Date) {
          dataAlvo = dataProgramada;
        } else {
          const partes = String(dataProgramada).split("/");
          if (partes.length === 3) {
            dataAlvo = new Date(partes[2], partes[1] - 1, partes[0]);
          }
        }

        if (dataAlvo) {
          dataAlvo.setHours(0, 0, 0, 0);
          
          if (dataAlvo <= hoje) {
            resultados.push({
              razao: cliente,
              cnpj: cnpj,
              dataOriginal: Utilities.formatDate(dataAlvo, ss.getSpreadsheetTimeZone(), "dd/MM/yyyy"),
              tempo: "Agendado",
              tipo: "MANUAL",
              obs: dadosRenov[i][3] || "", // Coluna D
              vendedor: consultorManual // ✅ AGORA O FRONTEND VAI RECEBER O NOME!
            });
            mapaCnpjsProcessados.add(cnpj);
          }
        }
      }
    }

    // --- 2. BUSCA AUTOMÁTICA (Aba VENDAS - Ciclo de 24 meses) ---
    const sheetVendas = ss.getSheetByName("VENDAS");
    if (sheetVendas) {
      const dataVendas = sheetVendas.getDataRange().getValues();
      const mapaUltimasVendas = {};

      for (let i = 1; i < dataVendas.length; i++) {
        const row = dataVendas[i];
        const cnpj = String(row[2] || "").trim();
        const linha = String(row[6] || "").trim();
        const dataVenda = row[1]; // Coluna B
        const status = String(row[24] || "").toUpperCase();

        if (!cnpj || !linha || !dataVenda || !status.includes("ATIVADO")) continue;
        if (mapaCnpjsProcessados.has(cnpj)) continue;

        let dataObjeto = dataVenda instanceof Date ? dataVenda : null;
        if (!dataObjeto) {
          const p = String(dataVenda).split("/");
          if (p.length === 3) dataObjeto = new Date(p[2], p[1] - 1, p[0]);
        }

        if (dataObjeto && !isNaN(dataObjeto.getTime())) {
          const chaveUnica = cnpj + "_" + linha;
          if (!mapaUltimasVendas[chaveUnica] || dataObjeto > mapaUltimasVendas[chaveUnica].dataObjeto) {
            mapaUltimasVendas[chaveUnica] = {
              dataObjeto: dataObjeto,
              dados: {
                razao: row[3],
                cnpj: cnpj,
                dataOriginal: Utilities.formatDate(dataObjeto, ss.getSpreadsheetTimeZone(), "dd/MM/yyyy"),
                plano: row[5],
                linha: linha,
                vendedor: row[9], // Coluna J das Vendas
                tipo: "AUTO"
              }
            };
          }
        }
      }

      for (let chave in mapaUltimasVendas) {
        const item = mapaUltimasVendas[chave];
        const mesesDecorridos = (hoje.getFullYear() - item.dataObjeto.getFullYear()) * 12 + (hoje.getMonth() - item.dataObjeto.getMonth());

        if (mesesDecorridos >= 24) {
          item.dados.tempo = `${mesesDecorridos} meses`;
          resultados.push(item.dados);
        }
      }
    }

    // Ordenação mantida
    resultados.sort((a, b) => {
      if (a.tipo === "MANUAL" && b.tipo !== "MANUAL") return -1;
      if (a.tipo !== "MANUAL" && b.tipo === "MANUAL") return 1;
      return b.tempo - a.tempo;
    });

    return { success: true, dados: resultados };

  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

/**
 * Função auxiliar para buscar o último registro exato de uma linha 
 * para preencher o formulário de RENEG.
 */
function buscarDadosParaReneg(cnpj, linha) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("VENDAS");
    if (!sheet) return { success: false, message: "Aba VENDAS não encontrada." };

    const data = sheet.getDataRange().getValues();
    
    // Filtra buscando o registro exato
    const matches = data.filter(r => 
      String(r[2]).trim() === String(cnpj).trim() && 
      String(r[6]).trim() === String(linha).trim()
    );
    
    if (matches.length > 0) {
      const registroBruto = matches[matches.length - 1];
      
      // Sanitização de dados para evitar "Resposta vazia"
      const registroLimpo = registroBruto.map((celula, index) => {
        // REGRA DE LIMPEZA: Coluna W (índice 22 - RADAR) e Coluna X (índice 23 - P2B)
        // Se for uma renegociação, não queremos os códigos antigos.
        if (index === 22 || index === 23) return ""; 

        if (celula instanceof Date) {
          return Utilities.formatDate(celula, ss.getSpreadsheetTimeZone(), "dd/MM/yyyy");
        }
        return (celula === null || celula === undefined) ? "" : String(celula);
      });

      return { success: true, dado: registroLimpo };
    }
    
    return { success: false, message: "Linha não encontrada na base." };
  } catch (e) {
    return { success: false, message: "Erro no servidor: " + e.toString() };
  }
}
// --- SALVAR AGENDAMENTO MANUAL DE RENOVAÇÃO (VEXO - PADRÃO IDENTIDADE VENDAS) ---
function salvarAgendamentoRenovacao(dados) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("RENOVACOES");
    
    // Cria a aba se não existir
    if (!sheet) {
      sheet = ss.insertSheet("RENOVACOES");
      sheet.appendRow(["CLIENTE", "CNPJ", "DATA RENOVAÇÃO", "OBSERVAÇÕES", "CADASTRADO EM", "USUÁRIO"]);
      sheet.getRange("A1:F1").setFontWeight("bold").setBackground("#f1f5f9");
    }

    // 👤 IDENTIDADE PROFISSIONAL:
    // Recebe o 'usuarioSistema' que o frontend montou (Nome + Sobrenome)
    // Se por um erro crítico vier vazio, usa o prefixo do e-mail do Google como última instância
    let nomeParaGravar = dados.usuarioSistema;

    if (!nomeParaGravar || nomeParaGravar === "USUÁRIO" || nomeParaGravar === "SISTEMA") {
      const emailBackup = Session.getActiveUser().getEmail();
      nomeParaGravar = emailBackup.split('@')[0].toUpperCase();
    }

    // Grava os dados na aba RENOVACOES
    sheet.appendRow([
      dados.cliente, 
      dados.cnpj, 
      dados.dataRenovacao, 
      dados.obs || "-", 
      new Date(),       // Coluna E (Data/Hora do registro)
      nomeParaGravar    // Coluna F (Nome idêntico ao formulário de vendas)
    ]);
    
    SpreadsheetApp.flush(); 
    return { success: true };

  } catch(e) { 
    return { success: false, error: e.toString() }; 
  }
}
function buscarDadosPerformanceDesafio(mesAlvo, anoAlvo) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("VENDAS");
    const data = sheet.getDataRange().getValues();
    
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();

    let faturamentoNoMes = 0; // Ativados que pertencem a este mês
    let pendentesAcumulados = 0; // Pendentes do mês + Pendentes que "sobraram" de meses passados
    const ranking = {};

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const valor = parseFloat(row[7]) || 0; // Coluna H
      const consultor = row[9]; // Coluna J
      const statusBruto = String(row[24] || "").toUpperCase();
      const statusFinal = (statusBruto.includes("ATIVADO") || statusBruto.includes("ATIVADA")) ? "ATIVADO" : statusBruto;

      // --- REGRA DE OURO DA DATA ---
      let dataReferenciaBruta = row[1]; // Por padrão, usa Coluna B (Lançamento)
      
      // Se ativou e tem data preenchida na Coluna Z (índice 25), ela passa a ser a data oficial
      if (statusFinal === "ATIVADO" && row[25]) {
         dataReferenciaBruta = row[25]; 
      }

      if (!dataReferenciaBruta) continue;

      let mesVenda, anoVenda;
      
      // Conversão segura de data para evitar erros (Data Objeto vs String DD/MM/AAAA)
      if (dataReferenciaBruta instanceof Date) {
          mesVenda = dataReferenciaBruta.getMonth() + 1;
          anoVenda = dataReferenciaBruta.getFullYear();
      } else {
          const strData = String(dataReferenciaBruta);
          if (strData.includes("/")) {
              const partes = strData.split("/");
              mesVenda = parseInt(partes[1]);
              anoVenda = parseInt(partes[2]);
          } else {
              const tempDate = new Date(strData);
              if (!isNaN(tempDate.getTime())) {
                  mesVenda = tempDate.getMonth() + 1;
                  anoVenda = tempDate.getFullYear();
              } else {
                  continue;
              }
          }
      }

      // --- REGRA DE EXIBIÇÃO ---

      // CASO 1: CONTRATO ATIVADO
      // Conta no mês exato da sua ATIVAÇÃO
      if (statusFinal === "ATIVADO") {
        if (mesVenda === mesAlvo && anoVenda === anoAlvo) {
          faturamentoNoMes += valor;
          atualizarRankingPerformance(ranking, consultor, valor, "ativado");
        }
      }
      
      // CASO 2: CONTRATO PENDENTE (Qualquer status que não seja ATIVADO ou CANCELADO)
      // Transporta o saldo para o mês atual
      else if (!statusFinal.includes("CANCELADO") && mesAlvo === mesAtual && anoAlvo === anoAtual) {
          pendentesAcumulados += valor;
          atualizarRankingPerformance(ranking, consultor, valor, "pendente");
      }
    }

    return {
      success: true,
      faturamentoAtivado: faturamentoNoMes,
      faturamentoPendente: pendentesAcumulados,
      totalGeral: faturamentoNoMes + pendentesAcumulados,
      ranking: ranking
    };

  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// Função de apoio para o Ranking
function atualizarRankingPerformance(obj, consultor, valor, tipo) {
  if (!obj[consultor]) {
    obj[consultor] = { ativado: 0, pendente: 0 };
  }
  obj[consultor][tipo] += valor;
}

function calcularElegibilidadeCorporate(receitaReal, metaReceita, qtdVendedores) {
  const atingimento = receitaReal / metaReceita;
  let multiplicador = 0;

  if (atingimento < 0.60) {
    multiplicador = 0; // Abaixo de 60% não ganha nada
  } else if (atingimento > 1.10) {
    multiplicador = 1.10; // Trava no teto de 110%
  } else {
    multiplicador = atingimento; // Segue a curva 1:1 (ex: 75% = 0.75)
  }

  const valorBaseVendedor = 2000;
  const totalSubsidio = (qtdVendedores * valorBaseVendedor) * multiplicador;

  return {
    multiplicador: multiplicador,
    atingimentoReal: (atingimento * 100).toFixed(2) + "%",
    valorUnitarioFinal: valorBaseVendedor * multiplicador,
    totalLoja: totalSubsidio
  };
}
function buscarConfiguracoesComissao() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("COMISSAO");
    if (!sheet) return {}; 
    
    const dados = sheet.getDataRange().getValues();
    let config = {};
    
    dados.forEach(linha => {
      if (linha[0]) {
        // Mantemos o nome original para facilitar a comparação com as faixas
        let chave = linha[0].toString().trim();
        config[chave] = linha[1];
      }
    });
    return config;
  } catch (e) {
    return {};
  }
}
// =======================================================
// MÓDULO: CLIENTES FUTUROS (ACOMPANHAMENTO DE PRAZO TIM)
// =======================================================

/**
 * Salva um novo agendamento de Cliente Futuro
 */
function salvarClienteFuturo(dados) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("CLIENTES_FUTUROS");
    
    // 1. CRIAÇÃO AUTOMÁTICA DA ABA (Se não existir)
    if (!sheet) {
      sheet = ss.insertSheet("CLIENTES_FUTUROS");
      sheet.appendRow(["ID_FUTURO", "DATA_REGISTRO", "CNPJ", "NOME_EMPRESA", "TELEFONE", "DATA_AGENDADA", "MOTIVO_RESTRICAO", "CONSULTOR", "STATUS"]);
      sheet.getRange("A1:I1").setFontWeight("bold").setBackground("#1e293b").setFontColor("white");
      sheet.setFrozenRows(1); // Congela o topo para facilitar a gestão
    }

    const idFuturo = "FUT-" + new Date().getTime();
    
    // 2. TRATAMENTO DE DATA (Garante que o Sheets entenda como data real)
    // Se a data vier como string "yyyy-mm-dd", o JS Date resolve
    const dataAlerta = new Date(dados.dataAgendada);
    dataAlerta.setMinutes(dataAlerta.getMinutes() + dataAlerta.getTimezoneOffset()); // Ajuste de fuso horário local

    // 3. INSERÇÃO DOS DADOS
    sheet.appendRow([
      idFuturo,
      new Date(), // Data exata do registro
      dados.cnpj,
      String(dados.nome || "").toUpperCase().trim(),
      dados.telefone,
      dataAlerta, 
      String(dados.motivo || "").toUpperCase().trim(),
      String(dados.consultor || "").toUpperCase().trim(),
      "PENDENTE" 
    ]);
    
    // Força a gravação imediata
    SpreadsheetApp.flush();
    
    // Retorno simplificado para o Toast de Sucesso
    return { 
      success: true, 
      id: idFuturo 
    };

  } catch (e) {
    Logger.log("Erro ao salvar no cofre: " + e.toString());
    return { 
      success: false, 
      message: "Ocorreu uma falha na sincronização com o banco de dados." 
    };
  }
}

/**
 * Busca os clientes futuros agendados e os classifica por data
 */
function buscarClientesFuturos() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("CLIENTES_FUTUROS");
    if (!sheet) return { success: true, dados: [] };

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, dados: [] };

    const hoje = new Date();
    hoje.setHours(0,0,0,0); // Zera as horas para comparar só o dia

    let resultados = [];

    for (let i = 1; i < data.length; i++) {
      const status = String(data[i][8]).trim().toUpperCase();
      
      // Só traz os que ainda não foram resolvidos
      if (status === "PENDENTE") {
        const dataAgendadaStr = data[i][5];
        let dataAgendadaObj;

        // Converte a data do banco para objeto
        if (dataAgendadaStr instanceof Date) {
          dataAgendadaObj = dataAgendadaStr;
        } else {
          const partes = String(dataAgendadaStr).split("-");
          dataAgendadaObj = new Date(partes[0], partes[1] - 1, partes[2]);
        }

        // Calcula a diferença em dias
        const diffTempo = dataAgendadaObj.getTime() - hoje.getTime();
        const diffDias = Math.ceil(diffTempo / (1000 * 3600 * 24));

        let situacao = "NO_PRAZO";
        if (diffDias <= 0) situacao = "ATRASADO_OU_HOJE";
        else if (diffDias <= 7) situacao = "PROXIMO";

        resultados.push({
          id: data[i][0],
          cnpj: data[i][2],
          nome: data[i][3],
          telefone: data[i][4],
          dataAgendada: Utilities.formatDate(dataAgendadaObj, "GMT-3", "dd/MM/yyyy"),
          motivo: data[i][6],
          consultor: data[i][7],
          diasRestantes: diffDias,
          situacao: situacao
        });
      }
    }

    // Ordena para que os urgentes (atrasados/hoje) apareçam primeiro
    resultados.sort((a, b) => a.diasRestantes - b.diasRestantes);

    return { success: true, dados: resultados };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

/**
 * Marca o cliente futuro como resolvido/acionado
 */
function concluirClienteFuturo(idBusca) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("CLIENTES_FUTUROS");
    if (!sheet) return { success: false, message: "Aba não encontrada" };

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === idBusca) {
        sheet.getRange(i + 1, 9).setValue("RESOLVIDO"); // Atualiza a coluna STATUS
        return { success: true, message: "Cliente marcado como contatado!" };
      }
    }
    return { success: false, message: "ID não encontrado." };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function buscarPendentesCofre(vendedor, cargoUsuario) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("CLIENTES_FUTUROS");
    if (!sheet) return [];

    const dados = sheet.getDataRange().getValues();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const normalizar = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
    
    const vendedorBusca = normalizar(vendedor);
    const cargo = String(cargoUsuario || "").toUpperCase().trim();
    const eMaster = (cargo === "ADMINISTRADOR" || cargo === "BACKOFFICE");

    const pendentes = [];

    for (let i = 1; i < dados.length; i++) {
      const nomeEmpresa = dados[i][3]; // Coluna D
      const dataRaw = dados[i][5];     // Coluna F
      const consultorOriginal = dados[i][7]; // Coluna H
      const donoNormalizado = normalizar(consultorOriginal);
      const status = normalizar(dados[i][8]); // Coluna I

      if (!dataRaw) continue;

      let dataLembrete = new Date(dataRaw);
      if (!isNaN(dataLembrete.getTime())) {
        dataLembrete.setHours(0, 0, 0, 0);

        // Lógica de visualização
        const pertenceAoUsuario = eMaster || (donoNormalizado === vendedorBusca);

        if (dataLembrete <= hoje && status !== "RESOLVIDO" && pertenceAoUsuario) {
          const nomeExibicao = eMaster ? `[${consultorOriginal}] ${nomeEmpresa}` : nomeEmpresa;
          pendentes.push({ nome: nomeExibicao });
        }
      }
    }
    return pendentes;
  } catch (e) {
    console.error("Erro: " + e.message);
    return [];
  }
}

/**
 * Gerenciador de Documentos VEXO
 * Cria estrutura de pastas e salva arquivos renomeados.
 * Local: Meu Drive > appssheet > 1 - CLIENTES TIM EMPRESAS > [CNPJ - EMPRESA]
 */
function uploadDocumentosVenda(base64Data, fileName, pastaNome, novoNomeArquivo) {
  try {
    const nomePastaPai = "appssheet"; 
    const nomeSubPasta = "1 - CLIENTES TIM EMPRESAS";
    
    // 1. Localiza ou Cria a Pasta Raiz (appssheet)
    let pastaPai;
    let buscaPai = DriveApp.getFoldersByName(nomePastaPai);
    if (buscaPai.hasNext()) {
      pastaPai = buscaPai.next();
    } else {
      pastaPai = DriveApp.createFolder(nomePastaPai);
    }
    
    // 2. Localiza ou Cria a Subpasta (1 - CLIENTES TIM EMPRESAS)
    let pastaVendas;
    let buscaVendas = pastaPai.getFoldersByName(nomeSubPasta);
    if (buscaVendas.hasNext()) {
      pastaVendas = buscaVendas.next();
    } else {
      pastaVendas = pastaPai.createFolder(nomeSubPasta);
    }
    
    // 3. Localiza ou Cria a pasta específica do Cliente (CNPJ - NOME)
    let pastaCliente;
    let buscaCliente = pastaVendas.getFoldersByName(pastaNome);
    if (buscaCliente.hasNext()) {
      pastaCliente = buscaCliente.next();
    } else {
      pastaCliente = pastaVendas.createFolder(pastaNome);
    }

    // 4. Processamento e Decodificação do Arquivo
    const partes = base64Data.split(',');
    const contentType = partes[0].substring(5, partes[0].indexOf(';'));
    const bytes = Utilities.base64Decode(partes[1]);
    
    // Extrai extensão original e monta o novo nome padronizado
    const extensao = fileName.split('.').pop();
    const nomeFinal = `${novoNomeArquivo}.${extensao}`;
    
    const blob = Utilities.newBlob(bytes, contentType, nomeFinal);
    const arquivo = pastaCliente.createFile(blob);
    
    // Define permissão de visualização para evitar erros de acesso no Backoffice
    arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return { 
      success: true, 
      url: arquivo.getUrl(), 
      pastaUrl: pastaCliente.getUrl(), // Link da pasta para conferência
      nome: nomeFinal 
    };
    
  } catch (e) {
    Logger.log("Erro no Upload Vexo: " + e.toString());
    return { success: false, message: "Erro no servidor: " + e.toString() };
  }
}

/**
 * Busca todas as vendas que o Vendedor lançou mas estão sem documentos/input
 */
function buscarVendasPendentes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("VENDAS");
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const pendentes = [];
  
  // Percorre a planilha (Índice 24 é a Coluna Y - Status)
  for (let i = 1; i < data.length; i++) {
    const status = String(data[i][24] || "").trim().toUpperCase();
    
    if (status === "PENDENTE DE INPUT") {
      pendentes.push({
        linha: i + 1,        // Número físico da linha para facilitar o update depois
        dataVenda: data[i][1] instanceof Date ? Utilities.formatDate(data[i][1], "GMT-3", "dd/MM/yyyy") : data[i][1],
        cnpj: data[i][2],
        razao: data[i][3],
        modalidade: data[i][4],
        vendedor: data[i][9], // Coluna J (Consultor que Vendeu)
        
        // 🌟 NOVA LINHA: Captura a IE da Coluna AI (Índice 34)
        ie: data[i][34] || "" 
      });
    }
  }
  return pendentes.reverse(); // Mostra os mais recentes primeiro
}
function buscarDadosVendaParaEdicao(numLinha) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("VENDAS");
  if (!sheet) return { error: "Aba VENDAS não encontrada." };
  
  const data = sheet.getDataRange().getValues();
  
  // 1. Identifica os dados da linha clicada para usar como filtro de busca
  const indexAlvo = parseInt(numLinha) - 1;
  if (indexAlvo < 0 || indexAlvo >= data.length) return { error: "Linha inválida." };

  const linhaAlvo = data[indexAlvo]; 
  const cnpjAlvo = String(linhaAlvo[2]).trim(); // Coluna C
  const dataVendaAlvo = String(linhaAlvo[1]);   // Coluna B

  let baseData = null;
  let linhasPlanos = [];
  let linhasAfetadas = []; 

  // 2. Varre a planilha para agrupar todos os itens (planos) dessa mesma venda
  for(let i = 1; i < data.length; i++) {
    const cnpjAtual = String(data[i][2]).trim();
    const dataAtual = String(data[i][1]);
    const statusAtual = String(data[i][24]).trim().toUpperCase();

    // Filtro: Mesmo CNPJ, Mesma Data e status PENDENTE
    if(cnpjAtual === cnpjAlvo && dataAtual === dataVendaAlvo && statusAtual === "PENDENTE DE INPUT") {
      
      // Captura os dados fixos do cliente apenas na primeira ocorrência
      if(!baseData) {
        baseData = {
          vencimento: data[i][0],
          dataVenda: data[i][1], 
          cnpj: data[i][2],
          razao: data[i][3],
          modalidade: data[i][4],
          cep: data[i][11],
          endereco: data[i][12],
          numeroEndereco: data[i][13],
          complemento: data[i][14],
          bairro: data[i][15],
          cidade: data[i][16],
          uf: data[i][17],
          cpfAdmin: data[i][18],
          nomeAdmin: data[i][19],
          email: data[i][20],
          contatoFin: data[i][21],
          radar: data[i][22],
          p2b: data[i][23],
          codigoCliente: data[i][31],
          codigoAdmin: data[i][32],
          
          // 🌟 AQUI ESTÁ A CORREÇÃO: Capturando a Inscrição Estadual (Coluna AI)
          ie: data[i][34] || "" 
        };
      }
      
      // Adiciona o plano/número à lista de itens do formulário
      linhasPlanos.push({
        plano: data[i][5],
        numero: data[i][6],
        valor: data[i][7],
        operadora: data[i][8]
      });
      
      // Registra o número real da linha para o update final
      linhasAfetadas.push(i + 1);
    }
  }

  // 3. FORMATAÇÃO DE DATA PARA O INPUT HTML (YYYY-MM-DD)
  if (baseData && baseData.dataVenda) {
    if (baseData.dataVenda instanceof Date) {
      baseData.dataVenda = Utilities.formatDate(baseData.dataVenda, "GMT-3", "yyyy-MM-dd");
    } else if (typeof baseData.dataVenda === "string" && baseData.dataVenda.includes("/")) {
      const p = baseData.dataVenda.split("/");
      // Assume dd/mm/yyyy -> yyyy-mm-dd
      baseData.dataVenda = `${p[2]}-${p[1]}-${p[0]}`;
    }
  }

  return { 
    success: true, 
    base: baseData, 
    linhasPlanos: linhasPlanos, 
    linhasAfetadas: linhasAfetadas 
  };
}

function atualizarStatusInputBackoffice(linhasAfetadas, nomeBackoffice, dados, requestToken) {
  try {
    // 🔥 VERIFICAÇÃO DE IDEMPOTÊNCIA via CacheService
    const cache = CacheService.getScriptCache();
    const processedKey = 'input_processed_' + requestToken;
    if (cache.get(processedKey)) {
      return { success: false, message: "Este pedido já foi processado anteriormente (token duplicado)." };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("VENDAS");
    if (!sheet) throw new Error("Aba VENDAS não encontrada.");

    const linhas = Array.isArray(linhasAfetadas) ? linhasAfetadas : [linhasAfetadas];
    let linhasAtualizadas = 0;
    let mensagemErro = "";

    const ultimaLinha = sheet.getLastRow();
    const agora = new Date();
    const timestamp = Utilities.formatDate(agora, "GMT-3", "dd/MM/yyyy HH:mm:ss");

    // Define o nome do consultor que será gravado (prioriza o selecionado no formulário)
    const consultorInput = dados.consultorInput && dados.consultorInput.trim() !== "" 
                           ? dados.consultorInput 
                           : nomeBackoffice;

    for (let idx = 0; idx < linhas.length; idx++) {
      const linha = parseInt(linhas[idx]);
      
      // 🔥 Validações
      if (linha < 2 || linha > ultimaLinha) {
        mensagemErro = `Linha ${linha} inválida (fora do intervalo 2-${ultimaLinha}).`;
        console.warn(mensagemErro);
        continue;
      }

      const cnpjExistente = sheet.getRange(linha, 3).getValue();
      if (!cnpjExistente || cnpjExistente.toString().trim() === "") {
        mensagemErro = `Linha ${linha} está vazia ou não contém um CNPJ válido.`;
        console.warn(mensagemErro);
        continue;
      }

      const statusAtual = sheet.getRange(linha, 25).getValue();
      if (String(statusAtual).trim().toUpperCase() !== "PENDENTE DE INPUT") {
        mensagemErro = `Linha ${linha} já foi processada (status atual: ${statusAtual}).`;
        console.warn(mensagemErro);
        continue;
      }

      // ============================================
      // 1. ATUALIZA OS CAMPOS EXISTENTES
      // ============================================
      if (dados.vencimento) sheet.getRange(linha, 1).setValue(dados.vencimento);
      if (dados.radar) sheet.getRange(linha, 23).setValue(dados.radar);
      if (dados.p2b) sheet.getRange(linha, 24).setValue(dados.p2b);
      
      // 🔥 COLUNA K (CONSULTOR DO INPUT) – força como texto puro
      const rangeK = sheet.getRange(linha, 11);
      // Define o valor como texto (evita interpretação como data)
      rangeK.setValue(consultorInput);
      // Define o formato da célula como texto puro
      rangeK.setNumberFormat("@");
      // Adiciona nota (comentário) com o nome do usuário e data/hora
      const notaAtual = rangeK.getNote();
      const novaNota = `✅ Input realizado por: ${consultorInput}\n📅 Data/Hora: ${timestamp}\n${notaAtual ? notaAtual + "\n" : ""}`;
      rangeK.setNote(novaNota);
      
      // Endereço completo (colunas L a R)
      sheet.getRange(linha, 12).setValue(dados.cep || "");
      sheet.getRange(linha, 13).setValue(dados.endereco || "");
      sheet.getRange(linha, 14).setValue(dados.numero || "");
      sheet.getRange(linha, 15).setValue(dados.complemento || "");
      sheet.getRange(linha, 16).setValue(dados.bairro || "");
      sheet.getRange(linha, 17).setValue(dados.cidade || "");
      sheet.getRange(linha, 18).setValue(dados.uf || "");
      
      // Dados do administrador (colunas S a V)
      sheet.getRange(linha, 19).setValue(dados.cpfAdmin || "");
      sheet.getRange(linha, 20).setValue(dados.nomeAdmin || "");
      sheet.getRange(linha, 21).setValue(dados.email || "");
      sheet.getRange(linha, 22).setValue(dados.contatoFin || "");
      
      // Códigos do cliente (colunas AF e AG)
      if (dados.codigoCliente) sheet.getRange(linha, 32).setValue(dados.codigoCliente);
      if (dados.codigoAdmin) sheet.getRange(linha, 33).setValue(dados.codigoAdmin);
      
      // 🔥 ATUALIZA O STATUS PARA "1. INPUT REALIZADO"
      sheet.getRange(linha, 25).setValue("1. INPUT REALIZADO");
      
      linhasAtualizadas++;
      console.log(`✅ Linha ${linha} atualizada. Consultor input: ${consultorInput}`);
    }

    SpreadsheetApp.flush();
    cache.put(processedKey, "true", 300);

    if (linhasAtualizadas === 0) {
      return { success: false, message: mensagemErro || "Nenhuma linha pendente foi atualizada." };
    }
    
    return { 
      success: true, 
      message: `${linhasAtualizadas} linha(s) atualizada(s) com sucesso.` 
    };
    
  } catch (e) {
    console.error("❌ Erro no atualizarStatusInputBackoffice: " + e.message);
    return { success: false, message: "Erro no servidor: " + e.toString() };
  }
}
/**
 * FUNÇÃO PARA EXCLUIR REGISTRO DE META
 * Criada para resolver o erro de permissão do Administrador
 */
function deletarMetaHistorico(linha) {
  try {
    // 1. IDENTIFICAÇÃO DE SEGURANÇA (Chave Mestra)
    let perfil;
    try {
      perfil = getPerfilUsuario();
    } catch(e) {
      perfil = { cargo: "DESCONHECIDO" };
    }

    // 🌟 AJUSTE AQUI: Try/Catch interno para evitar que a falha de e-mail trave o sistema
    let emailLogado = "";
    let emailDono = "";
    let emailAtivo = "";

    try {
      emailLogado = Session.getEffectiveUser().getEmail();
      emailAtivo = Session.getActiveUser().getEmail();
      const dono = SpreadsheetApp.getActiveSpreadsheet().getOwner();
      emailDono = dono ? dono.getEmail() : "";
    } catch(e) {
      // Se der erro de permissão aqui, o script continua e tenta validar pelo cargo do perfil
      console.warn("Aguardando validação de sessão do Google...");
    }

    // Regra: Se for o cargo ADMINISTRADOR no sistema OU o dono da planilha no Google
    const ehAdmin = (perfil.cargo === "ADMINISTRADOR");
    const ehDono = (emailLogado !== "" && emailLogado === emailDono) || (emailAtivo !== "" && emailAtivo === emailDono);

    if (!ehAdmin && !ehDono) {
      return "❌ Erro: Você não tem permissão para excluir metas. Ação restrita ao Administrador.";
    }

    // 2. EXECUÇÃO DA EXCLUSÃO
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("METAS_CONFIG");
    
    if (!sheet) {
      return "❌ Erro: Aba 'METAS_CONFIG' não encontrada.";
    }

    const linhaNum = parseInt(linha);
    if (isNaN(linhaNum) || linhaNum < 2) {
      return "❌ Erro: Linha inválida para exclusão.";
    }

    sheet.deleteRow(linhaNum);
    
    return "✅ Registro de meta excluído com sucesso!";

  } catch (e) {
    console.error("Erro ao deletar meta: " + e.message);
    return "❌ Erro técnico ao excluir: " + e.message;
  }
}

/**
 * MOTOR DE INTELIGÊNCIA VEXO - RECEITA ATIVADA LÍQUIDA
 * Filtro Soberano: Coluna AJ (Validação BOC)
 */
function getResumoRelatorio(mesFiltro, anoFiltro) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("VENDAS");
    if (!sheet) return { success: false, msg: "Aba VENDAS não encontrada" };

    const data = sheet.getDataRange().getValues();
    const cabecalho = data[0];

    const colVal = cabecalho.findIndex(c => /VALOR/i.test(c));
    const colMod = cabecalho.findIndex(c => /MODALIDADE/i.test(c));
    const colAJ = 35; // Coluna AJ (Índice 35)

    const mesAlvo = String(mesFiltro).padStart(2, '0');
    const anoAlvo = String(anoFiltro);

    let totais = {
      receitaLiquida: 0,
      ativacoesNovas: 0,
      ticketMedio: 0
    };

    for (let i = 1; i < data.length; i++) {
      const linha = data[i];
      const valAJ = linha[colAJ];

      // 🛑 REGRA SOBERANA: Sem validação na AJ = Venda não ativada (não entra no relatório)
      if (!valAJ || valAJ === "") continue;

      let mesFinal, anoFinal;
      if (valAJ instanceof Date) {
        mesFinal = String(valAJ.getMonth() + 1).padStart(2, '0');
        anoFinal = String(valAJ.getFullYear());
      } else {
        let match = String(valAJ).match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/);
        if (!match) continue;
        mesFinal = match[2].padStart(2, '0');
        anoFinal = match[3].length === 2 ? "20" + match[3] : match[3];
      }

      // Filtro de Competência: Só entra se a VALIDAÇÃO ocorreu no mês selecionado
      if (mesFinal === mesAlvo && anoFinal === anoAlvo) {
        const valor = parseFloat(linha[colVal]) || 0;
        const mod = String(linha[colMod]).toUpperCase();

        // Cálculo de Receita Ativada (Novas, Port, Aditivos, Migrações)
        if (/PRIMEIRA|NOVA|PORT|ADITIVO|MIGRA/i.test(mod)) {
          totais.receitaLiquida += valor;
          
          // Ativações Novas (Gross): Desconsidera Migrações para o contador de unidades
          if (!mod.includes("MIGRA")) {
            totais.ativacoesNovas++;
          }
        }
      }
    }

    totais.ticketMedio = totais.ativacoesNovas > 0 ? totais.receitaLiquida / totais.ativacoesNovas : 0;
    
    return { success: true, dados: totais };

  } catch (e) {
    return { success: false, msg: e.toString() };
  }
}
/**
 * Busca a lista de Planos para o Autocompletar
 * A Coluna A deve ser o Nome e a Coluna B o Valor
 */
function p_buscarPlanos() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("PLANOS");
    
    // Se a aba não existir, retorna vazio para não quebrar o sistema
    if (!sheet) return [];

    // Pega os dados da linha 2 em diante, nas 2 primeiras colunas
    const ultimaLinha = sheet.getLastRow();
    if (ultimaLinha < 2) return []; 
    
    const data = sheet.getRange(2, 1, ultimaLinha - 1, 2).getValues();
    const planos = [];
    
    for (let i = 0; i < data.length; i++) {
      if (data[i][0]) { // Apenas se tiver nome
        planos.push({
          nome: String(data[i][0]).trim(),
          valor: parseFloat(data[i][1]) || 0
        });
      }
    }
    
    return planos;

  } catch (e) {
    Logger.log("Erro ao buscar planos: " + e.message);
    return [];
  }
}

/**
 * Varredura de faturas no intervalo AA até AE da aba VENDAS
 * Lógica: Agrupa por Código (AF). Detecta ausência de Nota do Sheets ou Texto para alertar envio.
 */
function buscarAlertasFaturasSino() {
  try {
    const ss = getDb('PROPRIO');
    const sheet = ss.getSheetByName("VENDAS"); 
    if (!sheet) return [];

    const ultimaLinha = sheet.getLastRow();
    if (ultimaLinha <= 1) return [];

    const dadosEmpresas = sheet.getRange(1, 4, ultimaLinha, 1).getValues(); // Coluna D (Empresa)
    
    // Intervalo AA (27) até AF (32)
    const dadosFinanceiros = sheet.getRange(1, 27, ultimaLinha, 6).getValues(); 
    
    // 🟢 O SEGREDO: Lemos as "Notas" (comentários) inseridas nas células pelo Sheets
    const notasFinanceiras = sheet.getRange(1, 27, ultimaLinha, 6).getNotes(); 

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    let notificacoes = [];
    let codigosJaProcessados = new Set(); 

    for (let i = 1; i < ultimaLinha; i++) {
      const empresa = (dadosEmpresas[i][0] || "").toString().trim();
      const codigoCliente = (dadosFinanceiros[i][5] || "").toString().trim(); // Coluna AF
      
      if (!empresa) continue;

      const chaveAgrupamento = codigoCliente || empresa;
      if (codigosJaProcessados.has(chaveAgrupamento)) continue;

      // Varre as colunas AA até AE (Índices 0 a 4)
      for (let j = 0; j < 5; j++) {
        let celula = dadosFinanceiros[i][j];
        let notaSheets = (notasFinanceiras[i][j] || "").toString().trim(); // Nota do Sheets na célula
        
        if (!celula || celula === "") continue;

        let conteudoStr = celula.toString().toUpperCase().trim();
        if (conteudoStr.includes("PAGO")) continue;

        let dataVenc = null;
        let dataFormatada = "";

        // Extração de Data
        if (Object.prototype.toString.call(celula) === '[object Date]') {
          dataVenc = new Date(celula.getTime());
          dataFormatada = ("0" + dataVenc.getDate()).slice(-2) + "/" + ("0" + (dataVenc.getMonth() + 1)).slice(-2) + "/" + dataVenc.getFullYear();
        } else {
          const regexData = /(\d{2})\/(\d{2})\/(\d{4})/;
          const match = conteudoStr.match(regexData);
          if (match) {
            dataVenc = new Date(match[3], parseInt(match[2]) - 1, match[1]);
            dataFormatada = match[0];
          }
        }

        if (!dataVenc || isNaN(dataVenc.getTime())) continue;

        dataVenc.setHours(0, 0, 0, 0);
        const diffDays = Math.round((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        // 🟢 IDENTIFICA SE PRECISA ENVIAR FATURA
        // Verifica se a célula tem alguma letra (ex: NF, Enviado)
        const contemLetras = /[A-Z]/i.test(conteudoStr);
        // Se NÃO tem letras E NÃO tem Nota do Sheets, a fatura não foi enviada!
        const faturaPendenteEnvio = !contemLetras && notaSheets === "";

        let criarAlerta = false;
        let tipo = '';
        let mensagem = '';

        if (diffDays <= 5 && diffDays >= 0) {
          criarAlerta = true;
          // Se precisa enviar fatura, forçamos o tipo 'erro' (vermelho) para chamar atenção
          tipo = faturaPendenteEnvio ? 'erro' : 'alerta'; 
          let prefixo = faturaPendenteEnvio ? "🚨 ENVIAR FATURA! " : "";
          
          mensagem = prefixo + (diffDays === 0 ? "Vence HOJE!" : `Vence em ${diffDays} dias (${dataFormatada}).`);
        
        } else if (diffDays <= -5) {
          criarAlerta = true;
          tipo = 'erro';
          let prefixo = faturaPendenteEnvio ? "🚨 NÃO ENVIADA E " : "";
          
          mensagem = prefixo + `Atrasada há ${Math.abs(diffDays)} dias! (${dataFormatada})`;
        }

        if (criarAlerta) {
          notificacoes.push({
            titulo: empresa,
            mensagem: mensagem,
            tipo: tipo,
            modulo: 'faturas'
          });
          
          codigosJaProcessados.add(chaveAgrupamento);
          break; 
        }
      }
    }
    return notificacoes;

  } catch (e) {
    console.error("Erro na varredura agrupada VEXO: " + e.toString());
    return [];
  }
}

// =========================================================================
// MOTOR DE HISTÓRICO ANUAL (CHART.JS) - VEXO (ATUALIZADO COLUNA AJ)
// =========================================================================
function buscarHistoricoAnualVexo(cargoLogado, nomeUsuarioLogado) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetVendas = ss.getSheetByName("VENDAS");
  const sheetUsers = ss.getSheetByName("USERS");

  if (!sheetVendas || !sheetUsers) {
    return { erro: true, msg: "Abas VENDAS ou USERS não encontradas." };
  }

  // 1. Mapeia Matrículas -> Nomes
  const dataUsers = sheetUsers.getDataRange().getValues();
  let mapaUsuarios = {};
  
  for (let u = 1; u < dataUsers.length; u++) {
    const matriculaID = String(dataUsers[u][0] || "").trim().toUpperCase(); 
    const nome = String(dataUsers[u][2] || "").trim();                     
    const sobrenome = String(dataUsers[u][3] || "").trim();                
    if (nome || sobrenome) {
      const nomeCompleto = (nome + " " + sobrenome).toUpperCase().trim();
      if (matriculaID) mapaUsuarios[matriculaID] = nomeCompleto;
    }
  }

  // 2. Configurações de Segurança e Mapeamento
  const isAdmin = (cargoLogado === "ADMINISTRADOR" || cargoLogado === "BACKOFFICE");
  const nomeLogadoUpper = String(nomeUsuarioLogado || "").toUpperCase().trim();
  const anoAtual = new Date().getFullYear();
  const mesesAbreviados = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  
  let dadosAgrupados = {};

  // 3. Processa a aba de VENDAS
  const dataVendas = sheetVendas.getDataRange().getValues();
  
  for (let i = 1; i < dataVendas.length; i++) {
    const row = dataVendas[i];
    const statusBruto = String(row[24] || "").toUpperCase().trim();
    
    // Pula se estiver cancelado
    if (statusBruto.includes("CANCELADO")) continue;

    // Regra de Receita (Tim) - Identifica o tipo de modalidade
    const modalidade = String(row[4] || "").toUpperCase().trim();
    let modalidadeParaPainel = modalidade;
    if (modalidade.includes("MIGRA")) modalidadeParaPainel = "MIGRAÇÃO TT";
    else if (modalidade.includes("ATIVA")) modalidadeParaPainel = "PRIMEIRA ATIVAÇÃO";
    else if (modalidade.includes("ADITIVO")) modalidadeParaPainel = "ADITIVO";

    const isReceita = modalidadeParaPainel === "MIGRAÇÃO TT" || 
                      modalidadeParaPainel === "PRIMEIRA ATIVAÇÃO" || 
                      modalidadeParaPainel === "ADITIVO" || 
                      modalidade.includes("PORTABIL");

    // Só contabiliza o que gera faturamento no Dashboard
    if (!isReceita) continue;

    // Identificação do Vendedor da linha
    const matriculaVenda = String(row[8] || "").trim().toUpperCase(); 
    const vendedorDaVenda = mapaUsuarios[matriculaVenda] || String(row[9] || "DESCONHECIDO").toUpperCase().trim();
    
    // Filtro de Segurança por Cargo (Consultor só vê a si mesmo)
    if (!isAdmin && vendedorDaVenda !== nomeLogadoUpper) {
      continue;
    }

    // ====================================================================
    // 🌟 NOVA LÓGICA: DATA DE VALIDAÇÃO DO BACKOFFICE (COLUNA AJ - Índice 35)
    // ====================================================================
    let dataValidacao = null;
    let valAJ = row[35];
    
    // Tenta entender se a coluna AJ tem uma data formatada pelo Sheets ou texto
    if (valAJ instanceof Date) {
      dataValidacao = valAJ;
    } else if (valAJ && String(valAJ).trim() !== "") {
      const partesAJ = String(valAJ).split(/[\/\-\.]/);
      if (partesAJ.length === 3) {
        let anoAJ = partesAJ[2].length === 2 ? "20" + partesAJ[2] : partesAJ[2];
        dataValidacao = new Date(anoAJ, partesAJ[1]-1, partesAJ[0]);
      }
    }

    // Se NÃO tem data validada na coluna AJ, significa que não foi aprovado, então PULA.
    // Se TEM data e é do ano atual, joga o valor para o mês correto.
    if (dataValidacao && dataValidacao.getFullYear() === anoAtual) {
      const mesIndex = dataValidacao.getMonth(); // Janeiro = 0, Dezembro = 11
      const valor = (typeof row[7] === 'number') ? row[7] : parseFloat(String(row[7] || "0").replace(/[^\d.,-]/g, '').replace(",", ".")) || 0;

      // Se for a primeira venda contabilizada desse vendedor, cria o "esqueleto" dos 12 meses
      if (!dadosAgrupados[vendedorDaVenda]) {
        dadosAgrupados[vendedorDaVenda] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      }

      // Soma o valor no mês específico da validação
      dadosAgrupados[vendedorDaVenda][mesIndex] += valor;
    }
  }

  // Prepara a lista alfabética de consultores para o Dropdown (Admin)
  let listaNomesDropdown = Object.keys(dadosAgrupados).sort();

  return {
    erro: false,
    isAdmin: isAdmin,
    nomeLogado: nomeLogadoUpper,
    labelsMeses: mesesAbreviados,
    historicoConsultores: dadosAgrupados,
    listaDropdown: listaNomesDropdown
  };
}

// =========================================================================
// ATUALIZAÇÃO DE STATUS - KANBAN (DRAG & DROP / SELECT)
// =========================================================================
/**
 * Atualiza o status de um lead na planilha PROSPECCAO
 * Também atualiza a data de última movimentação e limpa o responsável se for DISPONÍVEL
 */
function atualizarStatusLeadPlanilha(idLead, novoStatus) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("PROSPECCAO");
    if (!sheet) return { success: false, message: "Aba PROSPECCAO não encontrada." };

    // Garantir que a coluna AS exista e esteja configurada
    garantirColunaUltimaAtualizacao();

    const COL_ULTIMA_ATUALIZACAO = 45; // Coluna AS (fixa)
    const data = sheet.getDataRange().getValues();
    const statusUpper = novoStatus.toUpperCase().trim();
    const agora = new Date();
    const agoraFormatada = Utilities.formatDate(agora, "GMT-3", "dd/MM/yyyy HH:mm");

    // 🔥 Buscar usuário logado dinamicamente (da sessão ou fallback)
    let usuarioLogado = "Sistema";
    try {
      const scriptProps = PropertiesService.getScriptProperties();
      const usuarioSessao = scriptProps.getProperty('usuario_logado');
      if (usuarioSessao) {
        const parsed = JSON.parse(usuarioSessao);
        usuarioLogado = parsed.username || parsed.nome || "Sistema";
      }
    } catch (e) {
      // Fallback: tenta obter e-mail do Google
      try {
        usuarioLogado = Session.getActiveUser().getEmail().split('@')[0] || "Sistema";
      } catch (e2) {
        // Mantém "Sistema"
      }
    }

    // Percorre a planilha buscando pelo Código do Lead (Coluna A)
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(idLead)) {
        // Captura o status anterior antes de atualizar
        const statusAnterior = String(data[i][14] || "INDEFINIDO").toUpperCase().trim();

        // ============================================================
        // 1. ATUALIZAR STATUS (Coluna O = 15)
        // ============================================================
        sheet.getRange(i + 1, 15).setValue(statusUpper);

        // ============================================================
        // 2. LIMPAR RESPONSÁVEL SE FOR DISPONÍVEL (Coluna Q = 17)
        // ============================================================
        if (statusUpper === "DISPONÍVEL") {
          sheet.getRange(i + 1, 17).setValue("");
        }

        // ============================================================
        // 3. ATUALIZAR DATA DE ÚLTIMA MOVIMENTAÇÃO (Coluna AS = 45) - FIXA
        // ============================================================
        sheet.getRange(i + 1, COL_ULTIMA_ATUALIZACAO).setValue(agora);

        // ============================================================
        // 4. REGISTRAR NO HISTÓRICO (Coluna R = 18)
        // ============================================================
        const historicoAtual = data[i][17] || "";
        const usuarioAtual = data[i][16] || "Sistema";
        let registroMovimentacao = "";

        if (statusUpper === "DISPONÍVEL") {
          registroMovimentacao = `------------------------------\n🔄 LEAD DEVOLVIDO AO MURAL (${agoraFormatada})\n👤 Por: ${usuarioLogado}\nStatus anterior: ${statusAnterior}\nResponsável anterior: ${usuarioAtual}\n\n`;
        } else {
          registroMovimentacao = `------------------------------\n📌 STATUS ATUALIZADO (${agoraFormatada})\n👤 Por: ${usuarioLogado}\nDe: ${statusAnterior} → Para: ${statusUpper}\n\n`;
        }

        const novoHistorico = registroMovimentacao + historicoAtual;
        sheet.getRange(i + 1, 18).setValue(novoHistorico);

        SpreadsheetApp.flush();
        return { success: true, message: `Status alterado de ${statusAnterior} para ${statusUpper}` };
      }
    }
    return { success: false, message: "Lead não encontrado no banco de dados." };
  } catch (e) {
    console.error("Erro em atualizarStatusLeadPlanilha:", e);
    return { success: false, message: e.toString() };
  }
}
/**
 * Verifica leads parados há 30 dias e os retorna ao Mural (DISPONÍVEL)
 * Deve ser executada diariamente (via gatilho)
 */
function verificarLeadsParados() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("PROSPECCAO");
  if (!sheet) {
    Logger.log("Aba PROSPECCAO não encontrada.");
    return;
  }

  // Garantir que a coluna AS exista e esteja configurada
  garantirColunaUltimaAtualizacao();

  const COL_ULTIMA_ATUALIZACAO = 45; // Coluna AS (fixa)
  const data = sheet.getDataRange().getValues();
  const agora = new Date();
  const limiteDias = 30;
  let leadsDevolvidos = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const id = String(row[0]).trim();
    const status = String(row[14] || "").toUpperCase().trim(); // Coluna O
    const responsavel = String(row[16] || "").trim(); // Coluna Q
    const ultimaAtualizacao = row[COL_ULTIMA_ATUALIZACAO - 1]; // Coluna AS

    // Só processa se estiver em uma das etapas permitidas
    const etapasPermitidas = ["OPORTUNIDADE", "CONTATO", "APRESENTACAO", "NEGOCIACAO"];
    if (!etapasPermitidas.includes(status)) continue;

    // Se não tiver data de última atualização, usa a data de registro (coluna B, índice 1)
    let dataReferencia = ultimaAtualizacao;
    if (!dataReferencia || dataReferencia === "") {
      dataReferencia = row[1]; // DATA REGISTRO
    }
    if (!(dataReferencia instanceof Date)) {
      dataReferencia = new Date(dataReferencia);
    }
    if (isNaN(dataReferencia.getTime())) continue; // data inválida

    const diffDias = Math.floor((agora - dataReferencia) / (1000 * 60 * 60 * 24));
    if (diffDias >= limiteDias) {
      // Devolver ao mural
      sheet.getRange(i + 1, 15).setValue("DISPONÍVEL"); // Status (coluna O)
      sheet.getRange(i + 1, 17).setValue("");           // Limpa responsável (coluna Q)
      sheet.getRange(i + 1, COL_ULTIMA_ATUALIZACAO).setValue(agora); // Atualiza data na coluna AS

      // Registrar no histórico (coluna R = 18)
      const historicoAtual = row[17] || "";
      const registro = `------------------------------\n⏰ DEVOLUÇÃO AUTOMÁTICA (${Utilities.formatDate(agora, "GMT-3", "dd/MM/yyyy HH:mm")})\nLead parado há ${diffDias} dias sem movimentação. Retornado ao Mural.\n\n`;
      sheet.getRange(i + 1, 18).setValue(registro + historicoAtual);

      leadsDevolvidos++;
      Logger.log(`Lead ${id} devolvido ao Mural (${diffDias} dias parado).`);
    }
  }

  SpreadsheetApp.flush();
  Logger.log(`Total de leads devolvidos: ${leadsDevolvidos}`);
  return `Devolvidos: ${leadsDevolvidos}`;
}
/**
 * Configura um gatilho para executar verificarLeadsParados() diariamente
 * (executar uma vez para ativar)
 */
function configurarGatilhoDevolucao() {
  // Remove gatilhos antigos com o mesmo nome
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'verificarLeadsParados') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Cria um novo gatilho para executar entre 0h e 1h todos os dias
  ScriptApp.newTrigger('verificarLeadsParados')
    .timeBased()
    .atHour(0)
    .everyDays(1)
    .create();
  
  Logger.log("Gatilho diário configurado para verificar leads parados.");
}
/**
 * Salva ou atualiza um agendamento na planilha e sincroniza com Google Agenda
 * 🌟 ATUALIZADO: Com sincronização com Google Calendar - Versão Corrigida
 */
function salvarAgendamentoVexo(dados) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("AGENDA");
    
    // Cria a aba se não existir (agora com 12 colunas)
    if (!sheet) {
      sheet = ss.insertSheet("AGENDA");
      sheet.appendRow(["ID_AGENDA", "CRIADO_EM", "TITULO", "CLIENTE_CNPJ", "DATA_INICIO", "DATA_FIM", "COR", "VENDEDOR", "OBSERVACOES", "STATUS", "TIPO_TAREFA", "GOOGLE_CALENDAR_ID"]);
      sheet.getRange("A1:L1").setFontWeight("bold").setBackground("#0f172a").setFontColor("white");
    }
    
    // Lógica de ID Sequencial
    let idAgenda = dados.id;
    
    if (!idAgenda) {
      const ultimaLinha = sheet.getLastRow();
      if (ultimaLinha <= 1) {
        idAgenda = 1;
      } else {
        const dadosIds = sheet.getRange(2, 1, ultimaLinha - 1, 1).getValues();
        let maiorId = 0;
        for (let i = 0; i < dadosIds.length; i++) {
          let num = parseInt(String(dadosIds[i][0]).replace(/\D/g, '')) || 0;
          if (num > maiorId) maiorId = num;
        }
        idAgenda = maiorId + 1;
      }
    }
    
    // Formata as datas
    const dataInicio = new Date(dados.inicio);
    const dataFim = dados.fim ? new Date(dados.fim) : new Date(dataInicio.getTime() + 60*60*1000);
    
    // Validação das datas
    if (isNaN(dataInicio.getTime())) {
      return { success: false, message: "Data de início inválida", syncStatus: "ERRO_DATA_INICIO" };
    }
    if (isNaN(dataFim.getTime())) {
      return { success: false, message: "Data de fim inválida", syncStatus: "ERRO_DATA_FIM" };
    }
    
    // 🔐 BUSCAR EMAIL DO USUÁRIO NA ABA USERS
    console.log(`🔍 Buscando email para o vendedor: ${dados.vendedor}`);
    const emailUsuario = buscarEmailPorNome(dados.vendedor);
    console.log(`📧 Email encontrado: ${emailUsuario || "NÃO ENCONTRADO"}`);
    
    let googleCalendarId = null;
    let isUpdating = false;
    
    // Se for edição, buscar o ID do Google Calendar existente
    if (dados.id) {
      const valores = sheet.getDataRange().getValues();
      for (let i = 1; i < valores.length; i++) {
        if (String(valores[i][0]) === String(dados.id)) {
          googleCalendarId = valores[i][11]; // Coluna L
          isUpdating = true;
          break;
        }
      }
    }
    
    // 🌟 SINCRONIZAR COM GOOGLE AGENDA
    let eventoGoogle = null;
    let syncStatus = "SEM_SINCRONIA";
    
    // Verifica se o status é Cancelado e se existe ID do Google Calendar
    if (dados.status === "Cancelado" && googleCalendarId) {
      try {
        if (emailUsuario) {
          const calendar = CalendarApp.getCalendarById(emailUsuario);
          if (calendar) {
            try {
              const evento = calendar.getEventById(googleCalendarId);
              if (evento) {
                evento.deleteEvent();
                syncStatus = "CANCELADO_NO_GCAL";
                googleCalendarId = null;
                console.log(`🗑️ Evento removido do Google Calendar: ${googleCalendarId}`);
              }
            } catch(e) {
              console.warn("Evento não encontrado no Google Calendar, apenas removendo da planilha");
              syncStatus = "CANCELADO_SEM_GCAL";
              googleCalendarId = null;
            }
          }
        } else {
          syncStatus = "CANCELADO_SEM_EMAIL";
          googleCalendarId = null;
        }
      } catch(e) {
        console.warn("Erro ao remover evento do Google Calendar:", e.message);
        syncStatus = "ERRO_AO_CANCELAR";
      }
    } 
    // Criar ou atualizar evento (apenas se não for Cancelado)
    else if (dados.status !== "Cancelado") {
      
      // Tenta encontrar o calendário do usuário ou usa o padrão
      let calendar = null;
      let usandoCalendarPadrao = false;
      
      if (emailUsuario && emailUsuario !== "") {
        try {
          calendar = CalendarApp.getCalendarById(emailUsuario);
          if (!calendar) {
            console.warn(`⚠️ Calendário não encontrado para ${emailUsuario}, usando calendário padrão`);
            calendar = CalendarApp.getDefaultCalendar();
            usandoCalendarPadrao = true;
          } else {
            console.log(`✅ Calendário encontrado para: ${emailUsuario}`);
          }
        } catch(e) {
          console.warn(`Erro ao acessar calendário de ${emailUsuario}: ${e.message}, usando calendário padrão`);
          calendar = CalendarApp.getDefaultCalendar();
          usandoCalendarPadrao = true;
        }
      } else {
        // Email não encontrado, usar calendário padrão do script
        calendar = CalendarApp.getDefaultCalendar();
        usandoCalendarPadrao = true;
        syncStatus = "USANDO_CALENDARIO_PADRAO";
        console.log(`🔄 Usando calendário padrão para o vendedor: ${dados.vendedor}`);
      }
      
      if (calendar) {
        const tituloEvento = `[VEXO] ${dados.titulo}${dados.cliente ? ` - ${dados.cliente}` : ''}`;
        const descricao = `📋 TIPO: ${dados.tipo || "Compromisso"}\n👤 CLIENTE: ${dados.cliente || "Não informado"}\n👤 VENDEDOR: ${dados.vendedor}\n📝 OBS: ${dados.obs || "Sem observações"}\n🔗 Gerenciado por VEXO`;
        
        try {
          if (isUpdating && googleCalendarId) {
            // Tenta atualizar evento existente
            try {
              let eventoExistente = calendar.getEventById(googleCalendarId);
              if (eventoExistente) {
                eventoExistente.setTitle(tituloEvento);
                eventoExistente.setDescription(descricao);
                eventoExistente.setTime(dataInicio, dataFim);
                eventoGoogle = eventoExistente;
                syncStatus = usandoCalendarPadrao ? "ATUALIZADO_PADRAO" : "ATUALIZADO";
                console.log(`🔄 Evento atualizado: ${googleCalendarId}`);
              } else {
                // Se não encontrar pelo ID, criar novo
                eventoGoogle = calendar.createEvent(tituloEvento, dataInicio, dataFim, {
                  description: descricao
                });
                syncStatus = usandoCalendarPadrao ? "CRIADO_PADRAO" : "CRIADO";
                console.log(`✨ Novo evento criado (ID não encontrado): ${eventoGoogle.getId()}`);
              }
            } catch(e) {
              // Se falhar ao atualizar, criar novo
              eventoGoogle = calendar.createEvent(tituloEvento, dataInicio, dataFim, {
                description: descricao
              });
              syncStatus = usandoCalendarPadrao ? "CRIADO_PADRAO" : "CRIADO";
              console.log(`✨ Novo evento criado (após erro): ${eventoGoogle.getId()}`);
            }
          } else {
            // Criar novo evento
            eventoGoogle = calendar.createEvent(tituloEvento, dataInicio, dataFim, {
              description: descricao
            });
            syncStatus = usandoCalendarPadrao ? "CRIADO_PADRAO" : "CRIADO";
            console.log(`✨ Novo evento criado: ${eventoGoogle.getId()}`);
          }
          
          if (eventoGoogle) {
            googleCalendarId = eventoGoogle.getId();
            // Adicionar notificação 15 minutos antes
            eventoGoogle.addPopupReminder(15);
            
            // Se estiver usando calendário padrão e tem email do usuário, adiciona como convidado
            if (usandoCalendarPadrao && emailUsuario && emailUsuario !== "") {
              try {
                eventoGoogle.addGuest(emailUsuario);
                syncStatus = syncStatus === "CRIADO_PADRAO" ? "CRIADO_COM_CONVITE" : 
                            (syncStatus === "ATUALIZADO_PADRAO" ? "ATUALIZADO_COM_CONVITE" : syncStatus);
                console.log(`📧 Convite enviado para: ${emailUsuario}`);
              } catch(e) {
                console.warn(`Não foi possível adicionar convite para ${emailUsuario}: ${e.message}`);
              }
            }
          }
        } catch(e) {
          syncStatus = `ERRO_CRIACAO: ${e.message}`;
          console.error("Erro ao criar/atualizar evento no Google Calendar:", e.message);
        }
      } else {
        syncStatus = "CALENDARIO_NAO_DISPONIVEL";
        console.error(`❌ Nenhum calendário disponível para o vendedor: ${dados.vendedor}`);
      }
    }
    
    // Se não houve sincronia por falta de email e não é cancelado, definir status apropriado
    if ((!emailUsuario || emailUsuario === "") && dados.status !== "Cancelado" && syncStatus === "SEM_SINCRONIA") {
      syncStatus = "EMAIL_NAO_ENCONTRADO";
      console.warn(`❌ Email não encontrado para o vendedor: ${dados.vendedor}`);
    }
    
    // Salvar/Atualizar na planilha
    if (dados.id && isUpdating) {
      const valores = sheet.getDataRange().getValues();
      let linhaEncontrada = false;
      
      for (let i = 1; i < valores.length; i++) {
        if (String(valores[i][0]) === String(dados.id)) {
          const row = i + 1;
          sheet.getRange(row, 3).setValue(dados.titulo ? dados.titulo.toUpperCase() : "REUNIÃO");
          sheet.getRange(row, 4).setValue(dados.cliente || "");
          sheet.getRange(row, 5).setValue(dataInicio);
          sheet.getRange(row, 6).setValue(dataFim);
          sheet.getRange(row, 7).setValue(dados.cor || "#3b82f6");
          sheet.getRange(row, 9).setValue(dados.obs || "");
          sheet.getRange(row, 10).setValue(dados.status || "Pendente");
          sheet.getRange(row, 11).setValue(dados.tipo || "Outros");
          if (googleCalendarId) {
            sheet.getRange(row, 12).setValue(googleCalendarId);
          }
          linhaEncontrada = true;
          break;
        }
      }
      
      if (!linhaEncontrada) {
        // Se não encontrou a linha para edição, criar novo registro
        sheet.appendRow([
          idAgenda,
          new Date(),
          String(dados.titulo || "REUNIÃO").toUpperCase().trim(),
          dados.cliente || "",
          dataInicio,
          dataFim,
          dados.cor || "#3b82f6",
          String(dados.vendedor || "SISTEMA").toUpperCase().trim(),
          dados.obs || "",
          dados.status || "Pendente",
          dados.tipo || "Outros",
          googleCalendarId || ""
        ]);
      }
      
      SpreadsheetApp.flush();
      return { success: true, message: "Agendamento atualizado!", syncStatus: syncStatus };
    }
    
    // Novo registro
    sheet.appendRow([
      idAgenda,
      new Date(),
      String(dados.titulo || "REUNIÃO").toUpperCase().trim(),
      dados.cliente || "",
      dataInicio,
      dataFim,
      dados.cor || "#3b82f6",
      String(dados.vendedor || "SISTEMA").toUpperCase().trim(),
      dados.obs || "",
      dados.status || "Pendente",
      dados.tipo || "Outros",
      googleCalendarId || ""
    ]);
    
    SpreadsheetApp.flush();
    
    // Mensagem de retorno personalizada baseada no syncStatus
    let mensagemRetorno = "Agendado com sucesso!";
    if (syncStatus === "CRIADO") mensagemRetorno = "Agendado e sincronizado com Google Agenda do usuário!";
    else if (syncStatus === "CRIADO_PADRAO") mensagemRetorno = "Agendado no calendário padrão!";
    else if (syncStatus === "CRIADO_COM_CONVITE") mensagemRetorno = "Agendado e convite enviado para o email do usuário!";
    else if (syncStatus === "EMAIL_NAO_ENCONTRADO") mensagemRetorno = "Agendado, mas email do usuário não encontrado para sincronização.";
    else if (syncStatus === "CALENDARIO_NAO_ENCONTRADO") mensagemRetorno = "Agendado, mas Google Agenda não encontrado.";
    
    return { success: true, message: mensagemRetorno, syncStatus: syncStatus };
    
  } catch (e) {
    console.error("Erro fatal em salvarAgendamentoVexo:", e.message);
    return { success: false, message: e.toString(), syncStatus: "ERRO_FATAL" };
  }
}

/**
 * Busca o email do usuário pelo nome ou matrícula na aba USERS
 * Coluna A = Matrícula, Coluna C = Nome, Coluna D = Sobrenome, Coluna E = Email
 */
function buscarEmailPorNome(identificador) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("USERS");
    
    if (!sheet) {
      console.warn("❌ Aba USERS não encontrada");
      return null;
    }
    
    const dados = sheet.getDataRange().getValues();
    const busca = String(identificador || "").toUpperCase().trim();
    
    if (!busca) return null;
    
    for (let i = 1; i < dados.length; i++) {
      const matricula = String(dados[i][0] || "").toUpperCase().trim();  // Coluna A
      const nome = String(dados[i][2] || "").toUpperCase().trim();       // Coluna C
      const sobrenome = String(dados[i][3] || "").toUpperCase().trim();  // Coluna D
      const nomeCompleto = (nome + " " + sobrenome).trim();
      const email = dados[i][4];  // Coluna E
      
      // Verifica se o identificador corresponde a Matrícula, Nome ou Nome Completo
      if (busca === matricula || 
          busca === nome || 
          busca === nomeCompleto ||
          (nome && busca.includes(nome)) ||
          (nomeCompleto && busca === nomeCompleto)) {
        
        if (email && email.toString().includes("@")) {
          console.log(`✅ Email encontrado: ${email} para o usuário: ${identificador}`);
          return email.toString().trim();
        } else {
          console.warn(`⚠️ Usuário ${identificador} não possui email válido na coluna E`);
          return null;
        }
      }
    }
    
    console.warn(`❌ Nenhum usuário encontrado com o identificador: ${identificador}`);
    return null;
    
  } catch(e) {
    console.error("Erro ao buscar email:", e.message);
    return null;
  }
}

/**
 * Busca todos os agendamentos formatados para o FullCalendar
 * 🌟 ATUALIZADO: Pinta os cards automaticamente pelo Status e mostra os cancelados
 */
function buscarAgendamentosVexo(usuarioLogado, cargoLogado) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("AGENDA");
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const eventos = [];
    const nomeLogado = String(usuarioLogado || "").toUpperCase().trim();
    const eMaster = (cargoLogado === "ADMINISTRADOR" || cargoLogado === "BACKOFFICE");

    for (let i = 1; i < data.length; i++) {
      
      // 🚨 ATENÇÃO: Remoção do if (status === "CANCELADO") continue; para exibir tudo no calendário
      const donoEvento = String(data[i][7]).toUpperCase().trim();
      
      // Regra de Visão: Admins veem tudo. Consultores veem apenas as próprias agendas.
      if (eMaster || donoEvento === nomeLogado) {
        
        let dInicio = data[i][4];
        let dFim = data[i][5];

        // 🌟 TRAVA DE SEGURANÇA ANTIFALHAS
        if (!dInicio || dInicio === "") continue; 
        if (!(dInicio instanceof Date)) dInicio = new Date(dInicio);
        if (isNaN(dInicio.getTime())) continue; 

        if (!dFim || dFim === "") {
          dFim = new Date(dInicio);
        } else if (!(dFim instanceof Date)) {
          dFim = new Date(dFim);
          if (isNaN(dFim.getTime())) dFim = new Date(dInicio);
        }

        // 🌟 LÓGICA DE CORES PELO STATUS DO BANCO (Coluna J = Índice 9)
        let statusDoBanco = data[i][9] || "Pendente";
        let statusUpper = String(statusDoBanco).toUpperCase();
        let corDoCard = "#3b82f6"; // Azul padrão (Pendente)
        
        if (statusUpper.includes("CONCLU")) {
          corDoCard = "#10b981"; // Verde
        } else if (statusUpper.includes("CANCEL")) {
          corDoCard = "#ef4444"; // Vermelho
        }

        eventos.push({
          id: data[i][0],
          title: data[i][2],
          start: dInicio.toISOString(),
          end: dFim.toISOString(),
          backgroundColor: corDoCard, // 🌟 A cor obedece a Coluna J
          borderColor: corDoCard,
          extendedProps: {
            cliente: data[i][3],
            vendedor: donoEvento,
            obs: data[i][8],
            status: statusDoBanco, // 🌟 Resgata o Status da Coluna J (Índice 9)
            tipo: data[i][10] || "Outros" // Resgata o Tipo de Tarefa da Coluna K (Índice 10)
          }
        });
      }
    }
    return eventos;
  } catch (e) {
    console.error("Erro buscarAgendamentosVexo: " + e.message);
    return []; // Retorna vazio de forma controlada em caso de erro extremo
  }
}

/**
 * Exclui logicamente (cancela) um agendamento e remove do Google Agenda
 * 🌟 ATUALIZADO: Remove completamente do Google Calendar quando cancelado
 */
function excluirAgendamentoVexo(idAgenda) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("AGENDA");
    
    if (!sheet) {
      return { success: false, message: "Aba AGENDA não encontrada", syncStatus: "ERRO_ABA_NAO_ENCONTRADA" };
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(idAgenda)) {
        const googleCalendarId = data[i][11]; // Coluna L - ID do evento no Google Calendar
        const vendedor = data[i][7];           // Coluna H - Nome do vendedor
        const titulo = data[i][2];             // Coluna C - Título do evento
        const dataInicio = data[i][4];         // Coluna E - Data de início
        
        let syncStatus = "CANCELADO_SEM_GCAL";
        let erroMsg = "";
        
        // 🔐 Buscar email do vendedor para remover do Google Calendar
        if (googleCalendarId && googleCalendarId !== "") {
          const emailUsuario = buscarEmailPorNome(vendedor);
          
          if (emailUsuario && emailUsuario !== "") {
            try {
              // Tenta acessar o calendário do usuário
              let calendar = null;
              let usandoCalendarPadrao = false;
              
              try {
                calendar = CalendarApp.getCalendarById(emailUsuario);
                if (!calendar) {
                  // Fallback para calendário padrão se não encontrar
                  calendar = CalendarApp.getDefaultCalendar();
                  usandoCalendarPadrao = true;
                  console.log(`Usando calendário padrão como fallback para remoção`);
                }
              } catch(e) {
                calendar = CalendarApp.getDefaultCalendar();
                usandoCalendarPadrao = true;
                console.log(`Erro ao acessar calendário do usuário, usando padrão: ${e.message}`);
              }
              
              if (calendar) {
                try {
                  // Tenta buscar o evento pelo ID salvo
                  let evento = calendar.getEventById(googleCalendarId);
                  
                  // Se não encontrar pelo ID, tenta buscar pelo título e data aproximada
                  if (!evento && dataInicio) {
                    const dataInicioObj = dataInicio instanceof Date ? dataInicio : new Date(dataInicio);
                    const dataFimObj = new Date(dataInicioObj.getTime() + 60 * 60 * 1000);
                    
                    const eventos = calendar.getEvents(dataInicioObj, dataFimObj);
                    const tituloBusca = String(titulo || "").toUpperCase();
                    
                    for (let ev of eventos) {
                      if (ev.getTitle().toUpperCase().includes(tituloBusca) || 
                          ev.getTitle().toUpperCase().includes("VEXO")) {
                        evento = ev;
                        break;
                      }
                    }
                  }
                  
                  if (evento) {
                    evento.deleteEvent();
                    syncStatus = "CANCELADO_NO_GCAL";
                    console.log(`✅ Evento removido do Google Calendar: ${googleCalendarId} (${usandoCalendarPadrao ? 'calendário padrão' : emailUsuario})`);
                  } else {
                    syncStatus = "CANCELADO_EVENTO_NAO_ENCONTRADO_GCAL";
                    console.warn(`⚠️ Evento ${googleCalendarId} não encontrado no Google Calendar, apenas removendo da planilha`);
                  }
                } catch(e) {
                  syncStatus = "CANCELADO_ERRO_GCAL";
                  erroMsg = e.message;
                  console.error(`❌ Erro ao remover evento ${googleCalendarId} do Google Calendar: ${e.message}`);
                }
              } else {
                syncStatus = "CANCELADO_SEM_CALENDARIO";
                console.warn(`❌ Nenhum calendário disponível para remover o evento`);
              }
            } catch(e) {
              syncStatus = "CANCELADO_ERRO_BUSCA_EMAIL";
              erroMsg = e.message;
              console.error(`❌ Erro ao processar email ${emailUsuario}: ${e.message}`);
            }
          } else {
            syncStatus = "CANCELADO_SEM_EMAIL";
            console.warn(`❌ Email não encontrado para o vendedor: ${vendedor}`);
          }
        } else {
          syncStatus = "CANCELADO_SEM_ID_GCAL";
          console.log(`ℹ️ Evento ${idAgenda} não possui ID do Google Calendar, apenas cancelando na planilha`);
        }
        
        // Atualizar a planilha: mudar status para Cancelado e cor para vermelho
        sheet.getRange(i + 1, 10).setValue("Cancelado");  // Coluna J - Status
        sheet.getRange(i + 1, 7).setValue("#ef4444");     // Coluna G - Cor
        sheet.getRange(i + 1, 12).setValue("");           // Coluna L - Limpar ID do Google Calendar
        
        SpreadsheetApp.flush();
        
        return { 
          success: true, 
          message: "Compromisso cancelado com sucesso!", 
          syncStatus: syncStatus,
          erroMsg: erroMsg
        };
      }
    }
    
    return { success: false, message: "Agendamento não encontrado.", syncStatus: "NAO_ENCONTRADO" };
    
  } catch (e) {
    console.error("Erro fatal em excluirAgendamentoVexo:", e.message);
    return { success: false, message: e.toString(), syncStatus: "ERRO_FATAL" };
  }
}

/**
 * Função para verificar e remover eventos órfãos do Google Calendar
 * (Eventos que estão no calendário mas não existem mais na planilha)
 */
function limparEventosOrfaos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("AGENDA");
  
  if (!sheet) {
    return "Aba AGENDA não encontrada";
  }
  
  const data = sheet.getDataRange().getValues();
  const idsValidos = new Set();
  
  // Coletar todos os IDs válidos da planilha
  for (let i = 1; i < data.length; i++) {
    const gcalId = data[i][11];
    if (gcalId && gcalId !== "") {
      idsValidos.add(gcalId);
    }
  }
  
  // Buscar calendário padrão para verificar eventos
  const calendar = CalendarApp.getDefaultCalendar();
  const hoje = new Date();
  const umAnoAtras = new Date(hoje.getFullYear() - 1, hoje.getMonth(), hoje.getDate());
  
  const eventos = calendar.getEvents(umAnoAtras, hoje);
  let removidos = 0;
  
  for (let evento of eventos) {
    const titulo = evento.getTitle();
    // Verifica se é um evento do VEXO
    if (titulo.includes("[VEXO]")) {
      const eventoId = evento.getId();
      if (!idsValidos.has(eventoId)) {
        // Evento órfão - remover
        evento.deleteEvent();
        removidos++;
        console.log(`🗑️ Evento órfão removido: ${titulo} (${eventoId})`);
      }
    }
  }
  
  return `✅ Limpeza concluída! ${removidos} eventos órfãos removidos do Google Calendar.`;
}

/**
 * Sincroniza todos os eventos pendentes com o Google Agenda
 * Útil para migrar dados antigos
 */
function sincronizarEventosPendentes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("AGENDA");
  
  if (!sheet) {
    return "Aba AGENDA não encontrada";
  }
  
  const data = sheet.getDataRange().getValues();
  let sincronizados = 0;
  let erros = 0;
  
  for (let i = 1; i < data.length; i++) {
    const googleCalendarId = data[i][11];
    const status = String(data[i][9] || "").toUpperCase();
    
    // Só sincroniza se não tiver ID e não estiver cancelado
    if ((!googleCalendarId || googleCalendarId === "") && status !== "CANCELADO") {
      const evento = {
        id: data[i][0],
        titulo: data[i][2],
        cliente: data[i][3],
        inicio: data[i][4],
        fim: data[i][5],
        cor: data[i][6],
        vendedor: data[i][7],
        obs: data[i][8],
        status: data[i][9],
        tipo: data[i][10]
      };
      
      // Converter datas
      if (evento.inicio && !(evento.inicio instanceof Date)) {
        evento.inicio = new Date(evento.inicio);
      }
      if (evento.fim && !(evento.fim instanceof Date)) {
        evento.fim = new Date(evento.fim);
      }
      
      const resultado = salvarAgendamentoVexo(evento);
      if (resultado.success) {
        sincronizados++;
      } else {
        erros++;
      }
      
      // Pequena pausa para não sobrecarregar a API
      Utilities.sleep(500);
    }
  }
  
  return `✅ Sincronização concluída! ${sincronizados} eventos sincronizados, ${erros} erros.`;
}

function registrarClienteNoCRM(dados) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("CLIENTES");
    
    // Cria a aba de Clientes com as colunas corretas se não existir
    if (!sheet) {
      sheet = ss.insertSheet("CLIENTES");
      const cabecalho = [
        "ID_CLIENTE", "DATA_CADASTRO", "CNPJ", "RAZAO_SOCIAL", "INSC_ESTADUAL", 
        "CEP", "ENDERECO", "NUMERO", "COMPLEMENTO", "BAIRRO", "CIDADE", "UF", 
        "CPF_ADMIN", "NOME_ADMIN", "EMAIL", "CONTATO_FINANCEIRO", 
        "LOGIN_ADMIN", "SENHA_MEU_TIM", "TIPO_CLIENTE", "DATA_ABERTURA", 
        "NATUREZA_JURIDICA", "ULTIMA_ATUALIZACAO", "CODIGO_CLIENTE"
      ];
      sheet.appendRow(cabecalho);
      sheet.getRange("A1:W1").setFontWeight("bold").setBackground("#1e3c72").setFontColor("white");
      sheet.setFrozenRows(1);
    }

    const cnpjLimpo = String(dados.cnpj || "").trim();
    if (!cnpjLimpo) return { success: false, message: "CNPJ não informado" };

    // Formata o código do cliente
    const codigoFormatado = formatarCodigoCliente(dados.codigoCliente);

    // Busca se o cliente já existe
    const data = sheet.getDataRange().getValues();
    let linhaExistente = -1;
    let clienteExistente = null;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][2]).trim() === cnpjLimpo) {
        linhaExistente = i + 1;
        clienteExistente = data[i];
        break;
      }
    }

    const agora = new Date();
    const dataFormatada = Utilities.formatDate(agora, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");

    // Prepara os dados do cliente (mapeamento coluna -> valor)
    // Índices base 0 para o array clienteData (23 colunas)
    const valoresAtualizados = {
      0: "",                                 // ID (será definido se novo)
      1: dataFormatada,                      // DATA_CADASTRO
      2: cnpjLimpo,                          // CNPJ
      3: String(dados.razao || "").toUpperCase(),
      4: dados.ie || "",
      5: dados.cep || "",
      6: dados.endereco || "",
      7: dados.numeroEndereco || "",
      8: dados.complemento || "",
      9: dados.bairro || "",
      10: dados.cidade || "",
      11: dados.uf || "",
      12: dados.cpfAdmin || "",
      13: String(dados.nomeAdmin || "").toUpperCase(),
      14: dados.email || "",
      15: dados.contatoFin || "",
      16: dados.codigoAdmin || "",
      17: "",                                // SENHA_MEU_TIM
      18: "",                                // TIPO_CLIENTE
      19: "",                                // DATA_ABERTURA
      20: "",                                // NATUREZA_JURIDICA
      21: dataFormatada,                     // ULTIMA_ATUALIZACAO
      22: codigoFormatado                    // CODIGO_CLIENTE
    };

    if (linhaExistente !== -1 && clienteExistente) {
      // ATUALIZA CLIENTE EXISTENTE: mantém valores antigos quando o novo estiver vazio
      // para não perder informações preenchidas manualmente
      for (let col = 2; col <= 22; col++) { // colunas de 2 a 22 (ignora ID)
        let novoValor = valoresAtualizados[col];
        let valorAntigo = clienteExistente[col];
        
        // Se o novo valor não for vazio, atualiza; senão, mantém o antigo
        if (novoValor && String(novoValor).trim() !== "") {
          sheet.getRange(linhaExistente, col + 1).setValue(novoValor);
        } else if (valorAntigo && String(valorAntigo).trim() !== "") {
          // Mantém o valor antigo (não faz nada)
          continue;
        } else {
          // Se ambos estiverem vazios, deixa em branco
          sheet.getRange(linhaExistente, col + 1).setValue("");
        }
      }
      
      // Força atualização da data de última modificação
      sheet.getRange(linhaExistente, 22).setValue(dataFormatada);
      
      console.log(`Cliente ${cnpjLimpo} atualizado com sucesso!`);
      return { success: true, message: "Cliente atualizado", acao: "atualizado" };
    } 
    else {
      // NOVO CLIENTE - Gera ID sequencial
      let proximoId = 1;
      if (data.length > 1) {
        const ultimoId = sheet.getRange(data.length, 1).getValue();
        proximoId = (parseInt(ultimoId) || 0) + 1;
      }
      valoresAtualizados[0] = proximoId;
      
      // Converte o objeto em array ordenado
      const novaLinha = [];
      for (let i = 0; i <= 22; i++) {
        novaLinha.push(valoresAtualizados[i]);
      }
      sheet.appendRow(novaLinha);
      console.log(`Novo cliente ${cnpjLimpo} adicionado com ID ${proximoId}`);
      return { success: true, message: "Novo cliente adicionado", acao: "novo" };
    }

  } catch (e) {
    console.error("Erro ao registrar no CRM: " + e.message);
    return { success: false, message: e.message };
  }
}

function formatarCodigoCliente(codigo) {
  if (!codigo && codigo !== 0) return "";
  let numStr = String(codigo).replace(/\D/g, '');
  if (numStr.length === 0) return "";
  numStr = numStr.padStart(8, '0').slice(0, 8);
  return numStr.charAt(0) + "." + numStr.slice(1);
}


function sincronizarClientesDaVendas() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetVendas = ss.getSheetByName("VENDAS");
    let sheetClientes = ss.getSheetByName("CLIENTES");
    if (!sheetVendas) return { success: false, message: "Aba VENDAS não encontrada" };
    
    if (!sheetClientes) {
      const novaSheet = ss.insertSheet("CLIENTES");
      const cabecalho = [
        "ID_CLIENTE", "DATA_CADASTRO", "CNPJ", "RAZAO_SOCIAL", "INSC_ESTADUAL", 
        "CEP", "ENDERECO", "NUMERO", "COMPLEMENTO", "BAIRRO", "CIDADE", "UF", 
        "CPF_ADMIN", "NOME_ADMIN", "EMAIL", "CONTATO_FINANCEIRO", 
        "LOGIN_ADMIN", "SENHA_MEU_TIM", "TIPO_CLIENTE", "DATA_ABERTURA", 
        "NATUREZA_JURIDICA", "ULTIMA_ATUALIZACAO", "CODIGO_CLIENTE"
      ];
      novaSheet.appendRow(cabecalho);
      novaSheet.getRange("A1:W1").setFontWeight("bold").setBackground("#1e3c72").setFontColor("white");
      sheetClientes = novaSheet;
    }
    
    const dadosVendas = sheetVendas.getDataRange().getValues();
    const dadosClientes = sheetClientes.getDataRange().getValues();
    
    const normalizarCnpj = (cnpj) => String(cnpj || "").replace(/\D/g, '');
    const normalizarTexto = (txt) => String(txt || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ' ').trim().toUpperCase();
    
    const mapaClientes = new Map();
    for (let i = 1; i < dadosClientes.length; i++) {
      const cnpj = normalizarCnpj(dadosClientes[i][2]);
      const razao = normalizarTexto(dadosClientes[i][3]);
      if (cnpj || razao) mapaClientes.set(cnpj + "|" + razao, { linha: i+1, dados: dadosClientes[i] });
    }
    
    const vendasUnicas = new Map();
    for (let i = 1; i < dadosVendas.length; i++) {
      const linha = dadosVendas[i];
      const cnpj = normalizarCnpj(linha[2]);
      const razao = normalizarTexto(linha[3]);
      if (!cnpj && !razao) continue;
      const chave = cnpj + "|" + razao;
      vendasUnicas.set(chave, linha);
    }
    
    let novos = 0, atualizados = 0;
    const dataAtual = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    
    for (const [chave, linha] of vendasUnicas) {
      const cnpjNorm = normalizarCnpj(linha[2]);
      const razaoNorm = normalizarTexto(linha[3]);
      const codFormatado = formatarCodigoCliente(linha[31] || "");
      
      const dadosVenda = [
        "", "", cnpjNorm, razaoNorm, linha[34] || "", linha[11] || "", linha[12] || "", linha[13] || "",
        linha[14] || "", linha[15] || "", linha[16] || "", linha[17] || "", linha[18] || "",
        normalizarTexto(linha[19] || ""), linha[20] || "", linha[21] || "", linha[32] || "",
        "", "", "", "", dataAtual, codFormatado
      ];
      
      if (!mapaClientes.has(chave)) {
        let novoId = sheetClientes.getLastRow() + 1;
        dadosVenda[0] = novoId;
        dadosVenda[1] = dataAtual;
        sheetClientes.appendRow(dadosVenda);
        novos++;
        mapaClientes.set(chave, { linha: sheetClientes.getLastRow(), dados: dadosVenda });
      } else {
        const info = mapaClientes.get(chave);
        let modificado = false;
        for (let col = 2; col <= 22; col++) { // colunas da planilha (0‑based)
          const existente = info.dados[col] || "";
          const novoValor = dadosVenda[col] || "";
          if (existente === "" && novoValor !== "") {
            sheetClientes.getRange(info.linha, col+1).setValue(novoValor);
            modificado = true;
          }
        }
        if (modificado) {
          sheetClientes.getRange(info.linha, 22).setValue(dataAtual);
          atualizados++;
        }
      }
    }
    
    return { success: true, message: `✅ Sincronização: ${novos} novos, ${atualizados} atualizados.` };
  } catch(e) {
    return { success: false, message: e.message };
  }
}
/**
 * 2. NOVA BUSCA: Agora lê da aba CLIENTES (Deixa sua tela muito mais rápida)
 * Substitui a sua `buscarBaseClientes` antiga.
 */
function buscarBaseClientes() {
  try {
    // 🔥 FORÇA O USO DA PLANILHA PRÓPRIA (onde a aba CLIENTES deve estar)
    const ID_PLANILHA_PROPRIO = "1ULyXmZjrHlTXJ7cl0jlL_ugriHzZ4W8Q-6ExvkPm6qg";
    const ss = SpreadsheetApp.openById(ID_PLANILHA_PROPRIO);
    const sheet = ss.getSheetByName("CLIENTES");
    
    // 📌 SE A ABA NÃO EXISTIR, RETORNA VAZIO E LOG
    if (!sheet) {
      console.warn("⚠️ [buscarBaseClientes] Aba CLIENTES NÃO encontrada na planilha própria.");
      console.warn("   → Execute a função 'migrarClientesParaCRM()' para criar e popular a aba.");
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      console.warn("⚠️ [buscarBaseClientes] Aba CLIENTES está vazia (apenas cabeçalho).");
      console.warn("   → Execute a função 'migrarClientesParaCRM()' para popular os dados.");
      return [];
    }
    
    const clientesList = [];
    const colunas = {
      id: 0, dataCadastro: 1, cnpj: 2, razao: 3, ie: 4,
      cep: 5, endereco: 6, numero: 7, complemento: 8,
      bairro: 9, cidade: 10, uf: 11,
      cpfAdmin: 12, nomeAdmin: 13, email: 14, contatoFin: 15,
      loginAdmin: 16, senha: 17
    };
    
    const camposObrigatorios = [
      'razao', 'ie', 'cep', 'endereco', 'numero', 'bairro', 'cidade', 'uf',
      'nomeAdmin', 'cpfAdmin', 'email', 'contatoFin', 'loginAdmin', 'senha'
    ];
    
    for (let i = 1; i < data.length; i++) {
      const linha = data[i];
      const cnpj = String(linha[colunas.cnpj] || "").trim();
      if (!cnpj) continue; // ignora linhas sem CNPJ
      
      const razao = String(linha[colunas.razao] || "").trim();
      if (!razao && !cnpj) continue;
      
      let camposVazios = 0;
      camposObrigatorios.forEach(campo => {
        const idx = colunas[campo];
        const valor = linha[idx];
        if (!valor || String(valor).trim() === "") {
          camposVazios++;
        }
      });
      
      let dataCadastro = linha[colunas.dataCadastro];
      let dataFormatada = "";
      if (dataCadastro instanceof Date) {
        dataFormatada = Utilities.formatDate(dataCadastro, Session.getScriptTimeZone(), "dd/MM/yyyy");
      } else if (dataCadastro && typeof dataCadastro === 'string') {
        const partes = dataCadastro.split(/[/\-]/);
        if (partes.length === 3) {
          dataFormatada = `${partes[0].padStart(2,'0')}/${partes[1].padStart(2,'0')}/${partes[2]}`;
        } else {
          dataFormatada = dataCadastro;
        }
      }
      
      clientesList.push({
        linha: i + 1,
        id: linha[colunas.id] || "",
        dataCadastro: dataFormatada,
        cnpj: cnpj,
        razao: razao,
        ie: linha[colunas.ie] || "",
        cep: linha[colunas.cep] || "",
        endereco: linha[colunas.endereco] || "",
        numeroEndereco: linha[colunas.numero] || "",
        complemento: linha[colunas.complemento] || "",
        bairro: linha[colunas.bairro] || "",
        cidade: linha[colunas.cidade] || "",
        uf: linha[colunas.uf] || "",
        cpfAdmin: linha[colunas.cpfAdmin] || "",
        nomeAdmin: linha[colunas.nomeAdmin] || "",
        email: linha[colunas.email] || "",
        contatoFin: linha[colunas.contatoFin] || "",
        loginAdmin: linha[colunas.loginAdmin] || "",
        senha: linha[colunas.senha] || "",
        estaIncompleto: camposVazios > 0,
        camposFaltantes: camposVazios
      });
    }
    
    console.log(`✅ [buscarBaseClientes] ${clientesList.length} clientes carregados com sucesso.`);
    return clientesList;
    
  } catch (e) {
    console.error("❌ [buscarBaseClientes] Erro crítico:", e.message);
    // NUNCA retorna undefined ou null, sempre array vazio
    return [];
  }
}

function atualizarCadastroCliente(dadosEditados) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetClientes = ss.getSheetByName("CLIENTES");
    const sheetVendas = ss.getSheetByName("VENDAS");
    
    if (!sheetClientes) return { success: false, message: "Aba CLIENTES não encontrada" };
    
    const linha = parseInt(dadosEditados.linha);
    if (isNaN(linha) || linha < 2) return { success: false, message: "Linha inválida" };
    
    // CNPJ (obtido do frontend ou da planilha)
    let cnpj = dadosEditados.cnpj ? String(dadosEditados.cnpj).trim() : "";
    if (!cnpj) {
      cnpj = sheetClientes.getRange(linha, 3).getDisplayValue().trim();
    }
    const cnpjNorm = cnpj.replace(/\D/g, '');
    
    // Formata o código do cliente
    const codigoFormatado = formatarCodigoCliente(dadosEditados.codigoCliente);
    
    // 1. Atualiza a aba CLIENTES (coluna W)
    sheetClientes.getRange(linha, 4).setValue(String(dadosEditados.razao || "").toUpperCase());
    sheetClientes.getRange(linha, 5).setValue(dadosEditados.ie || "");
    sheetClientes.getRange(linha, 6).setValue(dadosEditados.cep || "");
    sheetClientes.getRange(linha, 7).setValue(dadosEditados.endereco || "");
    sheetClientes.getRange(linha, 8).setValue(dadosEditados.numeroEndereco || "");
    sheetClientes.getRange(linha, 9).setValue(dadosEditados.complemento || "");
    sheetClientes.getRange(linha, 10).setValue(dadosEditados.bairro || "");
    sheetClientes.getRange(linha, 11).setValue(dadosEditados.cidade || "");
    sheetClientes.getRange(linha, 12).setValue(dadosEditados.uf || "");
    sheetClientes.getRange(linha, 13).setValue(dadosEditados.cpfAdmin || "");
    sheetClientes.getRange(linha, 14).setValue(String(dadosEditados.nomeAdmin || "").toUpperCase());
    sheetClientes.getRange(linha, 15).setValue(dadosEditados.email || "");
    sheetClientes.getRange(linha, 16).setValue(dadosEditados.contatoFin || "");
    sheetClientes.getRange(linha, 17).setValue(dadosEditados.loginAdmin || "");
    sheetClientes.getRange(linha, 18).setValue(dadosEditados.senha || "");
    sheetClientes.getRange(linha, 23).setValue(codigoFormatado); // coluna W
    sheetClientes.getRange(linha, 22).setValue(new Date());      // ULTIMA_ATUALIZACAO
    
    // 2. Sincroniza com a aba VENDAS (coluna AF) em todas as linhas com o mesmo CNPJ
    if (sheetVendas && cnpjNorm) {
      const dadosVendas = sheetVendas.getDataRange().getValues();
      let linhasAtualizadas = 0;
      for (let i = 1; i < dadosVendas.length; i++) {
        const cnpjVenda = String(dadosVendas[i][2] || "").replace(/\D/g, '');
        if (cnpjVenda === cnpjNorm) {
          sheetVendas.getRange(i + 1, 32).setValue(codigoFormatado); // coluna AF
          linhasAtualizadas++;
        }
      }
      console.log(`✅ Código ${codigoFormatado} sincronizado em ${linhasAtualizadas} linha(s) da VENDAS`);
    }
    
    SpreadsheetApp.flush();
    return { success: true, message: "Cliente atualizado e sincronizado!" };
    
  } catch (e) {
    console.error("Erro ao atualizar cliente: " + e.message);
    return { success: false, message: e.toString() };
  }
}



/**
 * SCRIPT DE MIGRAÇÃO: Roda apenas uma vez para transferir os clientes antigos da aba VENDAS para a CLIENTES.
 */
function migrarClientesParaCRM() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetVendas = ss.getSheetByName("VENDAS");
  let sheetClientes = ss.getSheetByName("CLIENTES");
  
  // 1. Cria a aba se ela ainda não existir (garantia)
  if (!sheetClientes) {
    sheetClientes = ss.insertSheet("CLIENTES");
    const cabecalho = [
      "ID_CLIENTE", "DATA_CADASTRO", "CNPJ", "RAZAO_SOCIAL", "INSC_ESTADUAL", 
      "CEP", "ENDERECO", "NUMERO", "COMPLEMENTO", "BAIRRO", "CIDADE", "UF", 
      "CPF_ADMIN", "NOME_ADMIN", "EMAIL", "CONTATO_FINANCEIRO", 
      "LOGIN_ADMIN", "SENHA_MEU_TIM"
    ];
    sheetClientes.appendRow(cabecalho);
    sheetClientes.getRange("A1:R1").setFontWeight("bold").setBackground("#1e3c72").setFontColor("white");
    sheetClientes.setFrozenRows(1);
  }

  const dataVendas = sheetVendas.getDataRange().getValues();
  const clientesUnicos = new Map();

  // 2. Lê a aba VENDAS de baixo para cima (Pegando sempre o cadastro mais atualizado de cada CNPJ)
  for (let i = dataVendas.length - 1; i >= 1; i--) {
    const cnpj = String(dataVendas[i][2] || "").trim(); // Coluna C
    
    // Só processa se tiver CNPJ e se ainda não o salvou na memória
    if (cnpj && !clientesUnicos.has(cnpj)) {
      
      // Formata a data (trata os diferentes formatos que o Sheets pode retornar)
      let dataCad = dataVendas[i][1]; // Coluna B
      if (dataCad instanceof Date) {
        dataCad = Utilities.formatDate(dataCad, "GMT-3", "dd/MM/yyyy");
      } else if (typeof dataCad === "string" && dataCad.includes("-")) {
        const p = dataCad.split("-");
        dataCad = `${p[2]}/${p[1]}/${p[0]}`;
      } else {
        dataCad = String(dataCad || "");
      }

      const cliente = [
        0,                                           // A: ID (Placeholder, preencheremos depois)
        dataCad,                                     // B: DATA CADASTRO
        cnpj,                                        // C: CNPJ
        String(dataVendas[i][3] || "").toUpperCase(),// D: RAZÃO SOCIAL
        dataVendas[i][34] || "",                     // E: INSC ESTADUAL (Coluna AI)
        dataVendas[i][11] || "",                     // F: CEP
        dataVendas[i][12] || "",                     // G: ENDEREÇO
        dataVendas[i][13] || "",                     // H: NÚMERO
        dataVendas[i][14] || "",                     // I: COMPLEMENTO
        dataVendas[i][15] || "",                     // J: BAIRRO
        dataVendas[i][16] || "",                     // K: CIDADE
        dataVendas[i][17] || "",                     // L: UF
        dataVendas[i][18] || "",                     // M: CPF ADMIN
        String(dataVendas[i][19] || "").toUpperCase(), // N: NOME ADMIN
        dataVendas[i][20] || "",                     // O: EMAIL
        dataVendas[i][21] || "",                     // P: CONTATO FIN
        dataVendas[i][32] || "",                     // Q: LOGIN ADMIN (Coluna AG)
        dataVendas[i][33] || ""                      // R: SENHA (Coluna AH)
      ];

      clientesUnicos.set(cnpj, cliente);
    }
  }

  // 3. Prepara a lista final
  const listaClientes = Array.from(clientesUnicos.values());
  
  // Inverte a lista para que a inserção siga a ordem cronológica (Id 1 sendo a primeira venda)
  listaClientes.reverse();

  // 4. Trava de Segurança e Definição de IDs Sequenciais
  const ultimaLinhaClientes = sheetClientes.getLastRow();
  let proximoId = 1;
  
  if (ultimaLinhaClientes > 1) {
      proximoId = (parseInt(sheetClientes.getRange(ultimaLinhaClientes, 1).getValue()) || 0) + 1;
  }

  const dataClientesAtuais = sheetClientes.getDataRange().getValues();
  const cnpjsJaCadastrados = new Set();
  
  for(let k = 1; k < dataClientesAtuais.length; k++) {
     cnpjsJaCadastrados.add(String(dataClientesAtuais[k][2]).trim());
  }

  const dadosParaInserir = [];
  
  for (let i = 0; i < listaClientes.length; i++) {
    let cli = listaClientes[i];
    let cnpjCli = cli[2];
    
    // Se o cliente ainda não estiver na aba CLIENTES, adiciona na fila de gravação
    if(!cnpjsJaCadastrados.has(cnpjCli)){
        cli[0] = proximoId++; // Aplica o ID correto e incrementa
        dadosParaInserir.push(cli);
    }
  }

  // 5. Inserção em Massa (Bulk Insert - Alta Performance)
  if (dadosParaInserir.length > 0) {
    sheetClientes.getRange(ultimaLinhaClientes + 1, 1, dadosParaInserir.length, dadosParaInserir[0].length).setValues(dadosParaInserir);
    SpreadsheetApp.flush();
    console.log(`Sucesso! ${dadosParaInserir.length} clientes foram migrados para o novo CRM.`);
    return `Sucesso! ${dadosParaInserir.length} clientes foram migrados.`;
  } else {
    console.log("Nenhum cliente novo para migrar. A base já está atualizada.");
    return "Nenhum cliente novo para migrar. A base já está atualizada.";
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// REGRA DOS 60% — Cole este bloco inteiro no final do seu code.gs
// ═══════════════════════════════════════════════════════════════════════════

function getFatMinMeta(mes, ano) {
  try {
    const ss    = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName("METAS_CONFIG");
    if (!sheet) return 0;

    const nomesMeses = {
      "01": "JANEIRO",  "02": "FEVEREIRO", "03": "MARÇO",
      "04": "ABRIL",    "05": "MAIO",      "06": "JUNHO",
      "07": "JULHO",    "08": "AGOSTO",    "09": "SETEMBRO",
      "10": "OUTUBRO",  "11": "NOVEMBRO",  "12": "DEZEMBRO"
    };
    const nomeMes = nomesMeses[String(mes).padStart(2, '0')] || mes.toUpperCase();
    const anoNum  = parseInt(ano);
    const dados   = sheet.getDataRange().getValues();

    for (let i = 1; i < dados.length; i++) {
      const mesCel = String(dados[i][1] || "").toUpperCase().trim(); // Coluna B
      const anoCel = parseInt(dados[i][2] || 0);                     // Coluna C
      const fatMin = parseFloat(dados[i][4] || 0);                   // Coluna E
      if (mesCel === nomeMes && anoCel === anoNum) return fatMin;
    }
    return 0;
  } catch (e) {
    console.error("getFatMinMeta erro: " + e.message);
    return 0;
  }
}

function getFatTotalLoja(mes, ano) {
  try {
    const ss    = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName("VENDAS");
    if (!sheet) return 0;

    const cabecalho = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const colVal    = cabecalho.findIndex(c => /VALOR/i.test(c));
    const colMod    = cabecalho.findIndex(c => /MODALIDADE/i.test(c));
    const colDataAJ = 35; // Coluna AJ — validação BOC

    const dados  = sheet.getDataRange().getValues();
    const mesNum = parseInt(mes);
    const anoNum = parseInt(ano);
    let total    = 0;

    for (let i = 1; i < dados.length; i++) {
      // 1. Só considera vendas validadas pelo BOC (coluna AJ preenchida)
      const valAJ = dados[i][colDataAJ];
      if (!valAJ || valAJ === "") continue;

      // 2. Determina o mês/ano de competência pela coluna AJ
      let mesFinal, anoFinal;
      if (valAJ instanceof Date) {
        mesFinal = valAJ.getMonth() + 1;
        anoFinal = valAJ.getFullYear();
      } else {
        const match = String(valAJ).match(/\b(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?\b/);
        if (!match) continue;
        mesFinal = parseInt(match[2]);
        anoFinal = match[3] ? parseInt(match[3].length === 2 ? "20" + match[3] : match[3]) : new Date().getFullYear();
      }
      if (mesFinal !== mesNum || anoFinal !== anoNum) continue;

      // 3. Exclui MIDs/Renegociações — o gatilho é baseado em vendas novas
      const mod = String(dados[i][colMod] || "").toUpperCase();
      if (/MID|RENEG/i.test(mod)) continue;

      total += parseFloat(dados[i][colVal] || 0);
    }

    return total;
  } catch (e) {
    console.error("getFatTotalLoja erro: " + e.message);
    return 0;
  }
}

/**
 * EXPORTAÇÃO DE AGENDA - VEXO PROFESSIONAL V2
 * Gera Excel real (.xlsx) e PDF nativo
 */
function exportarAgendaVexo(dataInicioStr, dataFimStr, statusFiltro, usuarioLogado, cargoUsuario, formato) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("AGENDA");
    
    if (!sheet) {
      return { success: false, mensagem: "Aba AGENDA não encontrada" };
    }
    
    const dataInicio = new Date(dataInicioStr + "T00:00:00");
    const dataFim = new Date(dataFimStr + "T23:59:59");
    const dados = sheet.getDataRange().getValues();
    
    // Mapeamento de índices
    const colunas = {
      id: 0, criadoEm: 1, titulo: 2, cliente: 3, dataInicio: 4,
      dataFim: 5, cor: 6, vendedor: 7, observacoes: 8, status: 9, tipo: 10
    };
    
    // Filtrar eventos
    const eventos = [];
    const nomeLogado = (usuarioLogado || "").toUpperCase().trim();
    const eMaster = (cargoUsuario === "ADMINISTRADOR" || cargoUsuario === "BACKOFFICE");
    
    for (let i = 1; i < dados.length; i++) {
      const linha = dados[i];
      const donoEvento = String(linha[colunas.vendedor] || "").toUpperCase().trim();
      
      if (!eMaster && donoEvento !== nomeLogado) continue;
      
      let dataEvento = linha[colunas.dataInicio];
      if (!dataEvento) continue;
      if (!(dataEvento instanceof Date)) dataEvento = new Date(dataEvento);
      if (isNaN(dataEvento.getTime())) continue;
      if (dataEvento < dataInicio || dataEvento > dataFim) continue;
      
      const statusEvento = String(linha[colunas.status] || "Pendente").toUpperCase();
      if (statusFiltro !== "TODOS" && statusEvento !== statusFiltro.toUpperCase()) continue;
      
      eventos.push({
        id: linha[colunas.id],
        titulo: linha[colunas.titulo] || "",
        cliente: linha[colunas.cliente] || "",
        dataInicio: linha[colunas.dataInicio],
        dataFim: linha[colunas.dataFim],
        status: linha[colunas.status] || "Pendente",
        tipo: linha[colunas.tipo] || "Outros",
        vendedor: linha[colunas.vendedor] || "",
        observacoes: linha[colunas.observacoes] || ""
      });
    }
    
    // Ordenar por data de início
    eventos.sort((a, b) => {
      let dateA = a.dataInicio instanceof Date ? a.dataInicio : new Date(a.dataInicio);
      let dateB = b.dataInicio instanceof Date ? b.dataInicio : new Date(b.dataInicio);
      return dateA - dateB;
    });
    
    if (formato === 'excel') {
      return gerarExcelReal(eventos, dataInicioStr, dataFimStr);
    } else {
      return gerarPDFNativo(eventos, dataInicioStr, dataFimStr, usuarioLogado);
    }
    
  } catch (e) {
    return { success: false, mensagem: e.toString() };
  }
}

/**
 * Gera um arquivo Excel real (.xlsx) usando a API do Sheets
 */
function gerarExcelReal(eventos, dataInicio, dataFim) {
  // Criar uma planilha temporária
  const tempSheetName = "TEMP_EXPORT_" + new Date().getTime();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tempSheet = ss.insertSheet(tempSheetName);
  
  try {
    // Configurar cabeçalho do relatório
    tempSheet.getRange(1, 1).setValue("📅 RELATÓRIO DE AGENDA - VEXO").setFontWeight("bold").setFontSize(14);
    tempSheet.getRange(2, 1).setValue(`Período: ${formatarDataBR(dataInicio)} a ${formatarDataBR(dataFim)}`).setFontStyle("italic");
    tempSheet.getRange(3, 1).setValue(`Gerado em: ${Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy HH:mm:ss")}`).setFontStyle("italic");
    
    // Pular uma linha
    tempSheet.getRange(4, 1).setValue("");
    
    // Cabeçalho da tabela
    const cabecalho = ["ID", "TÍTULO", "CLIENTE/EMPRESA", "DATA INÍCIO", "DATA FIM", "STATUS", "TIPO", "VENDEDOR", "OBSERVAÇÕES"];
    tempSheet.getRange(5, 1, 1, cabecalho.length).setValues([cabecalho]);
    
    // Estilizar cabeçalho da tabela
    const headerRange = tempSheet.getRange(5, 1, 1, cabecalho.length);
    headerRange.setFontWeight("bold").setBackground("#3b82f6").setFontColor("white").setHorizontalAlignment("center");
    
    // Popular dados - VERIFICA SE HÁ EVENTOS
    if (eventos && eventos.length > 0) {
      const dadosLinhas = [];
      const formatarData = (data) => {
        if (!data) return "";
        if (data instanceof Date) {
          return Utilities.formatDate(data, "GMT-3", "dd/MM/yyyy HH:mm");
        }
        if (typeof data === 'string') return data;
        return "";
      };
      
      for (const ev of eventos) {
        dadosLinhas.push([
          ev.id || "",
          ev.titulo || "",
          ev.cliente || "",
          formatarData(ev.dataInicio),
          formatarData(ev.dataFim),
          ev.status || "Pendente",
          ev.tipo || "Outros",
          ev.vendedor || "",
          (ev.observacoes || "").length > 100 ? ev.observacoes.substring(0, 100) + "..." : (ev.observacoes || "")
        ]);
      }
      
      // Verifica se dadosLinhas não está vazio antes de tentar escrever
      if (dadosLinhas.length > 0) {
        tempSheet.getRange(6, 1, dadosLinhas.length, cabecalho.length).setValues(dadosLinhas);
        
        // Aplicar cores nas células de status
        for (let i = 0; i < dadosLinhas.length; i++) {
          const status = String(dadosLinhas[i][5]).toUpperCase();
          let cor = null;
          if (status === "PENDENTE") cor = "#fef3c7";
          else if (status === "CONCLUIDO") cor = "#d1fae5";
          else if (status === "CANCELADO") cor = "#fee2e2";
          
          if (cor) {
            tempSheet.getRange(6 + i, 6).setBackground(cor);
          }
        }
      } else {
        // Fallback: se dadosLinhas estiver vazio mesmo com eventos
        tempSheet.getRange(6, 1, 1, cabecalho.length).setValues([["Nenhum dado disponível", "", "", "", "", "", "", "", ""]]);
        tempSheet.getRange(6, 1, 1, cabecalho.length).merge().setHorizontalAlignment("center").setFontColor("#64748b");
      }
    } else {
      // Sem eventos - mensagem amigável
      tempSheet.getRange(6, 1, 1, cabecalho.length).setValues([["📭 Nenhum compromisso encontrado no período selecionado.", "", "", "", "", "", "", "", ""]]);
      tempSheet.getRange(6, 1, 1, cabecalho.length).merge().setHorizontalAlignment("center").setFontColor("#64748b").setFontStyle("italic");
    }
    
    // Ajustar largura das colunas automaticamente
    for (let i = 1; i <= cabecalho.length; i++) {
      tempSheet.autoResizeColumn(i);
    }
    
    // Adicionar bordas à tabela (apenas se houver dados)
    const lastRow = tempSheet.getLastRow();
    if (lastRow >= 5) {
      const numLinhasTabela = lastRow - 4; // Desconta as 5 linhas de cabeçalho
      if (numLinhasTabela > 0) {
        const tableRange = tempSheet.getRange(5, 1, numLinhasTabela + 1, cabecalho.length);
        tableRange.setBorder(true, true, true, true, true, true);
      }
    }
    
    // Adicionar rodapé com total de registros
    const footerRow = lastRow + 2;
    tempSheet.getRange(footerRow, 1, 1, cabecalho.length).merge();
    tempSheet.getRange(footerRow, 1).setValue(`Total de registros: ${eventos ? eventos.length : 0}`).setFontStyle("italic").setFontColor("#94a3b8");
    
    // Congelar a primeira linha da tabela
    tempSheet.setFrozenRows(5);
    
    // Forçar atualização
    SpreadsheetApp.flush();
    
    // Baixar como Excel
    const url = `https://docs.google.com/spreadsheets/d/${ss.getId()}/export?format=xlsx&gid=${tempSheet.getSheetId()}`;
    const token = ScriptApp.getOAuthToken();
    const response = UrlFetchApp.fetch(url, {
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true
    });
    
    const blob = response.getBlob();
    blob.setName(`agenda_${dataInicio}_a_${dataFim}.xlsx`);
    
    // Limpar planilha temporária
    ss.deleteSheet(tempSheet);
    
    return { 
      success: true, 
      conteudo: Utilities.base64Encode(blob.getBytes()),
      nomeArquivo: `agenda_${dataInicio}_a_${dataFim}.xlsx`
    };
    
  } catch (e) {
    // Em caso de erro, tentar limpar a planilha temporária
    try { ss.deleteSheet(tempSheet); } catch(e2) {}
    return { success: false, mensagem: e.toString() };
  }
}

/**
 * Gera um PDF com layout bonito (HTML/CSS) usando window.print()
 */
function gerarPDFNativo(eventos, dataInicio, dataFim, usuarioLogado) {
  try {
    const hoje = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy HH:mm");
    const dataInicioFormatada = formatarDataBR(dataInicio);
    const dataFimFormatada = formatarDataBR(dataFim);
    
    // Estatísticas
    const totalEventos = eventos.length;
    const pendentes = eventos.filter(e => String(e.status).toUpperCase() === "PENDENTE").length;
    const concluidos = eventos.filter(e => String(e.status).toUpperCase() === "CONCLUIDO").length;
    const cancelados = eventos.filter(e => String(e.status).toUpperCase() === "CANCELADO").length;
    
    // Montar HTML com layout bonito
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório de Agenda - VEXO</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Poppins', 'Segoe UI', 'Roboto', Arial, sans-serif;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      padding: 40px;
      color: #1e293b;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 32px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 40px;
      text-align: center;
      color: white;
    }
    
    .header h1 {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    
    .header p {
      color: #94a3b8;
      font-size: 13px;
      margin-top: 8px;
    }
    
    .stats {
      display: flex;
      gap: 20px;
      padding: 30px 40px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .stat-card {
      flex: 1;
      background: white;
      border-radius: 20px;
      padding: 24px;
      text-align: center;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      transition: transform 0.2s;
    }
    
    .stat-card:hover {
      transform: translateY(-2px);
    }
    
    .stat-number {
      font-size: 36px;
      font-weight: 800;
      color: #0f172a;
    }
    
    .stat-label {
      font-size: 12px;
      color: #64748b;
      margin-top: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }
    
    .stat-card.total .stat-number { color: #3b82f6; }
    .stat-card.pendente .stat-number { color: #f59e0b; }
    .stat-card.concluido .stat-number { color: #10b981; }
    .stat-card.cancelado .stat-number { color: #ef4444; }
    
    .table-wrapper {
      padding: 0 40px 40px 40px;
      overflow-x: auto;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    
    th {
      background: #0f172a;
      color: white;
      padding: 14px 12px;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
      text-align: left;
    }
    
    td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    tr:hover {
      background: #f8fafc;
    }
    
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
    }
    
    .status-Pendente {
      background: #fef3c7;
      color: #d97706;
    }
    
    .status-Concluido {
      background: #d1fae5;
      color: #065f46;
    }
    
    .status-Cancelado {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .footer {
      background: #f1f5f9;
      padding: 20px 40px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
    
    .print-hide {
      text-align: center;
      padding: 20px;
      background: white;
    }
    
    .print-btn {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
      border: none;
      padding: 12px 28px;
      border-radius: 30px;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
      margin: 20px;
      transition: all 0.3s;
    }
    
    .print-btn:hover {
      transform: scale(1.02);
      box-shadow: 0 10px 20px rgba(0,0,0,0.2);
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .print-hide {
        display: none;
      }
      .stats {
        break-inside: avoid;
      }
      .stat-card {
        box-shadow: none;
        border: 1px solid #e2e8f0;
      }
      th {
        background: #0f172a !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .status-badge {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>
        <span>📅</span> VEXO
      </h1>
      <p>Relatório de Agenda Estratégica</p>
      <p style="font-size: 12px; margin-top: 12px;">Período: ${dataInicioFormatada} a ${dataFimFormatada} | Gerado por: ${usuarioLogado} | ${hoje}</p>
    </div>
    
    <div class="stats">
      <div class="stat-card total">
        <div class="stat-number">${totalEventos}</div>
        <div class="stat-label">📋 Total de Compromissos</div>
      </div>
      <div class="stat-card pendente">
        <div class="stat-number">${pendentes}</div>
        <div class="stat-label">⏳ Pendentes</div>
      </div>
      <div class="stat-card concluido">
        <div class="stat-number">${concluidos}</div>
        <div class="stat-label">✅ Concluídos</div>
      </div>
      <div class="stat-card cancelado">
        <div class="stat-number">${cancelados}</div>
        <div class="stat-label">❌ Cancelados</div>
      </div>
    </div>
    
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Título</th>
            <th>Cliente</th>
            <th>Data/Hora</th>
            <th>Status</th>
            <th>Tipo</th>
            <th>Vendedor</th>
          </tr>
        </thead>
        <tbody>`;
    
    for (let idx = 0; idx < eventos.length; idx++) {
      const ev = eventos[idx];
      const formatarData = (data) => {
        if (!data) return "-";
        if (data instanceof Date) return Utilities.formatDate(data, "GMT-3", "dd/MM/yyyy HH:mm");
        if (typeof data === 'string') {
          const d = new Date(data);
          if (!isNaN(d.getTime())) return Utilities.formatDate(d, "GMT-3", "dd/MM/yyyy HH:mm");
        }
        return String(data).substring(0, 16);
      };
      
      const statusEv = ev.status || "Pendente";
      const statusClass = statusEv === "Pendente" ? "Pendente" : (statusEv === "Concluido" ? "Concluido" : "Cancelado");
      
      html += `
          <tr>
            <td style="font-weight: 600;">${idx + 1}</td>
            <td><strong>${ev.titulo || "-"}</strong></td>
            <td>${ev.cliente || "-"}</td>
            <td>${formatarData(ev.dataInicio)}</td>
            <td><span class="status-badge status-${statusClass}">${statusEv}</span></td>
            <td>${ev.tipo || "-"}</td>
            <td>${ev.vendedor || "-"}</td>
          </tr>`;
    }
    
    if (eventos.length === 0) {
      html += `
          <tr>
            <td colspan="7" style="text-align: center; padding: 60px; color: #94a3b8;">
              📭 Nenhum compromisso encontrado no período selecionado.
            </td>
          </tr>`;
    }
    
    html += `
        </tbody>
      </table>
    </div>
    
    <div class="footer">
      <p>Relatório gerado automaticamente pelo VEXO - Sistema de Gestão Inteligente</p>
      <p style="margin-top: 8px;">© ${new Date().getFullYear()} VEXO - Todos os direitos reservados</p>
    </div>
  </div>
  
  <div class="print-hide">
    <button class="print-btn" onclick="window.print(); setTimeout(() => window.close(), 500);">
      🖨️ Imprimir / Salvar como PDF
    </button>
  </div>
</body>
</html>`;
    
    // Retornar o HTML para ser renderizado no iframe
    return { 
      success: true, 
      conteudo: html,
      nomeArquivo: `relatorio_agenda_${dataInicio}_a_${dataFim}.html`,
      isHtml: true
    };
    
  } catch (e) {
    return { success: false, mensagem: e.toString() };
  }
}



function gerarCSV(eventos, dataInicio, dataFim) {
  // Cabeçalho do CSV
  const linhas = [
    ['ID', 'TÍTULO', 'CLIENTE/EMPRESA', 'DATA INÍCIO', 'DATA FIM', 'STATUS', 'TIPO', 'VENDEDOR', 'OBSERVAÇÕES']
  ];
  
  const formatarData = (data) => {
    if (!data) return "";
    if (data instanceof Date) {
      const dia = String(data.getDate()).padStart(2, '0');
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const ano = data.getFullYear();
      const hora = String(data.getHours()).padStart(2, '0');
      const minuto = String(data.getMinutes()).padStart(2, '0');
      return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
    }
    return String(data);
  };
  
  for (const ev of eventos) {
    linhas.push([
      ev.id,
      ev.titulo,
      ev.cliente,
      formatarData(ev.dataInicio),
      formatarData(ev.dataFim),
      ev.status,
      ev.tipo,
      ev.vendedor,
      ev.observacoes ? ev.observacoes.replace(/\n/g, ' ') : ""
    ]);
  }
  
  // Converter para CSV
  const csv = linhas.map(linha => 
    linha.map(celula => {
      if (typeof celula === 'string' && (celula.includes(',') || celula.includes('"'))) {
        return `"${celula.replace(/"/g, '""')}"`;
      }
      return celula;
    }).join(',')
  ).join('\n');
  
  const nomeArquivo = `agenda_${dataInicio}_a_${dataFim}.csv`;
  return { success: true, conteudo: csv, nomeArquivo: nomeArquivo };
}

function gerarHTMLPDF(eventos, dataInicio, dataFim, usuarioLogado) {
  const hoje = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy HH:mm");
  const dataInicioFormatada = formatarDataBR(dataInicio);
  const dataFimFormatada = formatarDataBR(dataFim);
  
  // Estatísticas
  const totalEventos = eventos.length;
  const pendentes = eventos.filter(e => String(e.status).toUpperCase() === "PENDENTE").length;
  const concluidos = eventos.filter(e => String(e.status).toUpperCase() === "CONCLUIDO").length;
  const cancelados = eventos.filter(e => String(e.status).toUpperCase() === "CANCELADO").length;
  
  // Montar HTML para o PDF
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório de Agenda - VEXO</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Poppins', 'Segoe UI', Arial, sans-serif;
      background: white;
      padding: 40px;
      color: #1e293b;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
    }
    .header h1 {
      color: #0f172a;
      font-size: 28px;
      margin-bottom: 8px;
    }
    .header p {
      color: #64748b;
      font-size: 13px;
    }
    .stats {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }
    .stat-card {
      flex: 1;
      background: #f8fafc;
      border-radius: 16px;
      padding: 20px;
      text-align: center;
      border: 1px solid #e2e8f0;
    }
    .stat-number {
      font-size: 32px;
      font-weight: 800;
      color: #0f172a;
    }
    .stat-label {
      font-size: 12px;
      color: #64748b;
      margin-top: 5px;
      text-transform: uppercase;
    }
    .stat-card.pendente .stat-number { color: #3b82f6; }
    .stat-card.concluido .stat-number { color: #10b981; }
    .stat-card.cancelado .stat-number { color: #ef4444; }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th {
      background: #0f172a;
      color: white;
      padding: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      text-align: left;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
    }
    tr:hover {
      background: #f8fafc;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 700;
    }
    .status-Pendente { background: #dbeafe; color: #1e40af; }
    .status-Concluido { background: #d1fae5; color: #065f46; }
    .status-Cancelado { background: #fee2e2; color: #991b1b; }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📅 VEXO - Relatório de Agenda</h1>
    <p>Período: ${dataInicioFormatada} a ${dataFimFormatada} | Gerado por: ${usuarioLogado} em ${hoje}</p>
  </div>
  
  <div class="stats">
    <div class="stat-card">
      <div class="stat-number">${totalEventos}</div>
      <div class="stat-label">Total de Compromissos</div>
    </div>
    <div class="stat-card pendente">
      <div class="stat-number">${pendentes}</div>
      <div class="stat-label">Pendentes</div>
    </div>
    <div class="stat-card concluido">
      <div class="stat-number">${concluidos}</div>
      <div class="stat-label">Concluídos</div>
    </div>
    <div class="stat-card cancelado">
      <div class="stat-number">${cancelados}</div>
      <div class="stat-label">Cancelados</div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Data/Hora</th>
        <th>Título</th>
        <th>Cliente</th>
        <th>Tipo</th>
        <th>Status</th>
        <th>Vendedor</th>
      </tr>
    </thead>
    <tbody>
  `;
  
  for (const ev of eventos) {
    const dataInicioEv = ev.dataInicio instanceof Date ? ev.dataInicio : new Date(ev.dataInicio);
    const dataFormatada = Utilities.formatDate(dataInicioEv, "GMT-3", "dd/MM/yyyy HH:mm");
    const status = ev.status || "Pendente";
    
    html += `
      <tr>
        <td>${dataFormatada}</td>
        <td><strong>${ev.titulo || "-"}</strong></td>
        <td>${ev.cliente || "-"}</td>
        <td>${ev.tipo || "-"}</td>
        <td><span class="status-badge status-${status}">${status}</span></td>
        <td>${ev.vendedor || "-"}</td>
      </tr>
    `;
  }
  
  if (eventos.length === 0) {
    html += `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: #94a3b8;">
          📭 Nenhum compromisso encontrado no período selecionado.
        </td>
      </tr>
    `;
  }
  
  html += `
    </tbody>
  </table>
  
  <div class="footer">
    <p>Relatório gerado automaticamente pelo VEXO - Sistema de Gestão Inteligente</p>
  </div>
  
  <div class="no-print" style="text-align: center; margin-top: 20px;">
    <button onclick="window.print()" style="padding: 10px 20px; background: #0f172a; color: white; border: none; border-radius: 8px; cursor: pointer;">🖨️ Imprimir / Salvar PDF</button>
  </div>
</body>
</html>
  `;
  
  const nomeArquivo = `relatorio_agenda_${dataInicio}_a_${dataFim}.html`;
  return { success: true, conteudo: html, nomeArquivo: nomeArquivo };
}

function formatarDataBR(dataStr) {
  if (!dataStr) return "";
  if (typeof dataStr === 'string' && dataStr.includes("-")) {
    const partes = dataStr.split("-");
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  if (dataStr instanceof Date) {
    const dia = String(dataStr.getDate()).padStart(2, '0');
    const mes = String(dataStr.getMonth() + 1).padStart(2, '0');
    const ano = dataStr.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }
  return String(dataStr);
}

function adicionarColunaGoogleAgenda() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("AGENDA");
  
  if (!sheet) {
    console.log("Aba AGENDA não encontrada");
    return;
  }
  
  // Verificar se a coluna L (índice 11) já existe
  const lastCol = sheet.getLastColumn();
  if (lastCol < 12) {
    // Adicionar cabeçalho da coluna Google Agenda ID
    sheet.getRange(1, 12).setValue("GOOGLE_CALENDAR_ID");
    sheet.getRange(1, 12).setFontWeight("bold").setBackground("#0f172a").setFontColor("white");
    console.log("✅ Coluna GOOGLE_CALENDAR_ID adicionada na coluna L");
  } else {
    console.log("⚠️ Coluna GOOGLE_CALENDAR_ID já existe");
  }
}

/**
 * Função de teste para verificar se o email está sendo encontrado corretamente
 */
function testarBuscaEmail(nomeVendedor) {
  const email = buscarEmailPorNome(nomeVendedor);
  if (email) {
    return `✅ Email encontrado: ${email} para o vendedor: ${nomeVendedor}`;
  } else {
    return `❌ Email NÃO encontrado para o vendedor: ${nomeVendedor}. Verifique se o nome está correto na aba USERS (colunas C/D) e se o email está na coluna E.`;
  }
}

/**
 * Salva os dados da etapa CONTATO para um lead específico
 */
function salvarDadosContato(idLead, dadosContato) {
  try {
    console.log("💾 [SERVER] Salvando dados de contato para lead:", idLead);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("PROSPECCAO");
    
    if (!sheet) {
      return { success: false, message: "Aba PROSPECCAO não encontrada" };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return { success: false, message: "Nenhum dado na planilha" };
    }
    
    const cabecalho = data[0];
    const idLeadStr = String(idLead).trim();
    
    // Função auxiliar para garantir que a coluna existe
    const garantirColuna = (nomeColuna) => {
      let idx = cabecalho.indexOf(nomeColuna);
      if (idx === -1) {
        const novaColuna = sheet.getLastColumn() + 1;
        sheet.getRange(1, novaColuna).setValue(nomeColuna);
        sheet.getRange(1, novaColuna).setFontWeight("bold");
        console.log(`📊 [SERVER] Coluna criada: ${nomeColuna} (coluna ${novaColuna})`);
        return novaColuna;
      }
      return idx + 1;
    };
    
    // Garante as colunas
    const colDataContato = garantirColuna("DATA_PRIMEIRO_CONTATO");
    const colMeioContato = garantirColuna("MEIO_CONTATO");
    const colQuemAtendeu = garantirColuna("QUEM_ATENDEU");
    const colInteresse = garantirColuna("INTERESSE_DEMONSTRADO");
    const colPrincipalDor = garantirColuna("PRINCIPAL_DOR");
    const colProximaAcao = garantirColuna("PROXIMA_ACAO_CONTATO");
    
    // Encontra o lead
    let linhaEncontrada = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === idLeadStr) {
        linhaEncontrada = i + 1;
        console.log(`✅ [SERVER] Lead encontrado na linha ${linhaEncontrada}`);
        break;
      }
    }
    
    if (linhaEncontrada === -1) {
      console.error(`❌ [SERVER] Lead ${idLeadStr} não encontrado para salvar`);
      return { success: false, message: `Lead ${idLeadStr} não encontrado` };
    }
    
    const agora = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy HH:mm");
    const usuario = dadosContato.usuario || "Sistema";
    
    // Formata a data
    let dataContatoFormatada = dadosContato.dataPrimeiroContato || "Data não informada";
    if (dataContatoFormatada && dataContatoFormatada !== "Data não informada" && dataContatoFormatada.includes("-")) {
      const partes = dataContatoFormatada.split("-");
      if (partes.length === 3) {
        dataContatoFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
    }
    
    // Constrói o registro para o histórico
    let novoRegistroHistorico = `------------------------------\n`;
    novoRegistroHistorico += `📞 REGISTRO DE CONTATO (${agora}) - 👤 ${usuario}\n`;
    novoRegistroHistorico += `┌─────────────────────────────────────────────\n`;
    novoRegistroHistorico += `│ 📅 Data do Contato: ${dataContatoFormatada}\n`;
    novoRegistroHistorico += `│ 📞 Meio de Contato: ${dadosContato.meioContato || "Não informado"}\n`;
    novoRegistroHistorico += `│ 👤 Quem Atendeu: ${dadosContato.quemAtendeu || "Não informado"}\n`;
    novoRegistroHistorico += `│ ⭐ Interesse: ${dadosContato.interesseDemonstrado || "Não informado"}\n`;
    novoRegistroHistorico += `│ 🎯 Dor/Problema: ${dadosContato.principalDor || "Não informado"}\n`;
    novoRegistroHistorico += `│ 📌 Próxima Ação: ${dadosContato.proximaAcao || "Não informado"}\n`;
    novoRegistroHistorico += `└─────────────────────────────────────────────\n\n`;
    
    // Salva no histórico (Coluna R = 18)
    const historicoAtual = data[linhaEncontrada - 1][17] || "";
    const novoHistorico = novoRegistroHistorico + historicoAtual;
    sheet.getRange(linhaEncontrada, 18).setValue(novoHistorico);
    
    // Salva nos campos específicos
    if (dadosContato.dataPrimeiroContato) {
      sheet.getRange(linhaEncontrada, colDataContato).setValue(dadosContato.dataPrimeiroContato);
    }
    if (dadosContato.meioContato) {
      sheet.getRange(linhaEncontrada, colMeioContato).setValue(dadosContato.meioContato);
    }
    if (dadosContato.quemAtendeu) {
      sheet.getRange(linhaEncontrada, colQuemAtendeu).setValue(dadosContato.quemAtendeu);
    }
    if (dadosContato.interesseDemonstrado) {
      sheet.getRange(linhaEncontrada, colInteresse).setValue(dadosContato.interesseDemonstrado);
    }
    if (dadosContato.principalDor) {
      sheet.getRange(linhaEncontrada, colPrincipalDor).setValue(dadosContato.principalDor);
    }
    if (dadosContato.proximaAcao) {
      sheet.getRange(linhaEncontrada, colProximaAcao).setValue(dadosContato.proximaAcao);
    }
    
    SpreadsheetApp.flush();
    console.log("✅ [SERVER] Dados de contato salvos com sucesso!");
    return { success: true, message: "Dados de contato salvos com sucesso!" };
    
  } catch (e) {
    console.error("❌ [SERVER] Erro ao salvar dados de contato:", e);
    return { success: false, message: e.toString() };
  }
}

/**
 * Busca os dados da etapa CONTATO para um lead específico
 */
function getDadosContatoLead(idLead) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("PROSPECCAO");
    
    if (!sheet) {
      return { success: false, dados: null };
    }
    
    const data = sheet.getDataRange().getValues();
    const cabecalho = data[0];
    
    const colunas = {
      DATA_PRIMEIRO_CONTATO: cabecalho.indexOf("DATA_PRIMEIRO_CONTATO"),
      MEIO_CONTATO: cabecalho.indexOf("MEIO_CONTATO"),
      QUEM_ATENDEU: cabecalho.indexOf("QUEM_ATENDEU"),
      INTERESSE_DEMONSTRADO: cabecalho.indexOf("INTERESSE_DEMONSTRADO"),
      PRINCIPAL_DOR: cabecalho.indexOf("PRINCIPAL_DOR"),
      PROXIMA_ACAO_CONTATO: cabecalho.indexOf("PROXIMA_ACAO_CONTATO")
    };
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(idLead)) {
        return {
          success: true,
          dados: {
            dataPrimeiroContato: colunas.DATA_PRIMEIRO_CONTATO !== -1 ? data[i][colunas.DATA_PRIMEIRO_CONTATO] : "",
            meioContato: colunas.MEIO_CONTATO !== -1 ? data[i][colunas.MEIO_CONTATO] : "",
            quemAtendeu: colunas.QUEM_ATENDEU !== -1 ? data[i][colunas.QUEM_ATENDEU] : "",
            interesseDemonstrado: colunas.INTERESSE_DEMONSTRADO !== -1 ? data[i][colunas.INTERESSE_DEMONSTRADO] : "",
            principalDor: colunas.PRINCIPAL_DOR !== -1 ? data[i][colunas.PRINCIPAL_DOR] : "",
            proximaAcao: colunas.PROXIMA_ACAO_CONTATO !== -1 ? data[i][colunas.PROXIMA_ACAO_CONTATO] : ""
          }
        };
      }
    }
    
    return { success: true, dados: null };
    
  } catch (e) {
    return { success: false, dados: null, message: e.toString() };
  }
}

/**
 * Busca dados completos do lead para o modal unificado
 * VERSÃO COM SANITIZAÇÃO COMPLETA DE TODAS AS COLUNAS
 */
function getDadosCompletosLead(idLead) {
  try {
    console.log("🔍 [SERVER] Buscando lead:", idLead);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("PROSPECCAO");
    
    if (!sheet) {
      console.error("❌ [SERVER] Aba PROSPECCAO não encontrada");
      return { success: false, message: "Aba PROSPECCAO não encontrada" };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      console.error("❌ [SERVER] Nenhum dado na planilha");
      return { success: false, message: "Nenhum dado na planilha" };
    }
    
    const cabecalho = data[0];
    const idLeadStr = String(idLead).trim();
    
    console.log("🔍 [SERVER] Procurando por ID:", idLeadStr);
    
    // Função robusta para sanitizar QUALQUER valor
    const sanitizarValor = (valor) => {
      if (valor === null || valor === undefined) return "";
      
      // Se for Date, formata como string
      if (valor instanceof Date) {
        const dia = String(valor.getDate()).padStart(2, '0');
        const mes = String(valor.getMonth() + 1).padStart(2, '0');
        const ano = valor.getFullYear();
        return `${dia}/${mes}/${ano}`;
      }
      
      // Converte para string
      let texto = String(valor);
      
      // Remove caracteres de controle não imprimíveis
      texto = texto.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
      
      // Substitui múltiplas quebras de linha por espaço
      texto = texto.replace(/\n{2,}/g, ' ');
      texto = texto.replace(/\r/g, ' ');
      
      // Remove caracteres nulos
      texto = texto.replace(/\0/g, '');
      
      // Remove espaços excessivos
      texto = texto.trim();
      
      return texto;
    };
    
    // Procura o lead
    let linhaEncontrada = -1;
    let dadosLinha = null;
    
    for (let i = 1; i < data.length; i++) {
      const idPlanilha = String(data[i][0]).trim();
      if (idPlanilha === idLeadStr) {
        linhaEncontrada = i;
        dadosLinha = data[i];
        console.log(`✅ [SERVER] Lead encontrado na linha ${i+1}`);
        break;
      }
    }
    
    if (linhaEncontrada === -1) {
      console.error(`❌ [SERVER] Lead ${idLeadStr} NÃO encontrado`);
      return { success: false, message: `Lead ${idLeadStr} não encontrado` };
    }
    
    // Função auxiliar para encontrar índice da coluna por nome
    const getColIndex = (nome) => {
      const idx = cabecalho.indexOf(nome);
      return idx !== -1 ? idx : -1;
    };
    
    // Mapeia colunas fixas
    const colunas = {
      id: 0,
      razao: 3,
      cnpj: 2,
      contato: 5,
      contato_alt: getColIndex("CONTATO ALT.") !== -1 ? getColIndex("CONTATO ALT.") : 18,
      admin: 4,
      historico: 17,
      status: 14,
      dataAbertura: getColIndex("DATA ABERTURA") !== -1 ? getColIndex("DATA ABERTURA") : 22,
      logradouro: 8,
      numero: 9,
      bairro: 10,
      cidade: 11,
      uf: 12,
      ramo: 13
    };
    
    // Monta endereço completo (sanitizado)
    const rua = sanitizarValor(dadosLinha[colunas.logradouro]);
    const numero = sanitizarValor(dadosLinha[colunas.numero]);
    const bairro = sanitizarValor(dadosLinha[colunas.bairro]);
    const cidade = sanitizarValor(dadosLinha[colunas.cidade]);
    const uf = sanitizarValor(dadosLinha[colunas.uf]);
    const enderecoCompleto = `${rua}${numero ? ', ' + numero : ''}${bairro ? ' - ' + bairro : ''}, ${cidade} - ${uf}`;
    
    // Ramo
    let ramo = "Geral / Outros";
    if (dadosLinha[colunas.ramo] && dadosLinha[colunas.ramo] !== "") {
      ramo = sanitizarValor(dadosLinha[colunas.ramo]);
    }
    
    // 🔥 BUSCA DADOS DE CONTATO (Colunas X até AC) - COM SANITIZAÇÃO ROBUSTA
    // Mapeia todas as colunas da etapa CONTATO
    const idxDataContato = getColIndex("DATA_PRIMEIRO_CONTATO");
    const idxMeioContato = getColIndex("MEIO_CONTATO");
    const idxQuemAtendeu = getColIndex("QUEM_ATENDEU");
    const idxInteresse = getColIndex("INTERESSE_DEMONSTRADO");
    const idxPrincipalDor = getColIndex("PRINCIPAL_DOR");
    const idxProximaAcao = getColIndex("PROXIMA_ACAO_CONTATO");
    
    // Cria objeto de contato com sanitização rigorosa
    let dadosContato = {
      dataPrimeiroContato: "",
      meioContato: "",
      quemAtendeu: "",
      interesseDemonstrado: "",
      principalDor: "",
      proximaAcao: ""
    };
    
    // Preenche cada campo com sanitização
    if (idxDataContato !== -1 && dadosLinha[idxDataContato]) {
      dadosContato.dataPrimeiroContato = sanitizarValor(dadosLinha[idxDataContato]);
    }
    if (idxMeioContato !== -1 && dadosLinha[idxMeioContato]) {
      dadosContato.meioContato = sanitizarValor(dadosLinha[idxMeioContato]);
    }
    if (idxQuemAtendeu !== -1 && dadosLinha[idxQuemAtendeu]) {
      dadosContato.quemAtendeu = sanitizarValor(dadosLinha[idxQuemAtendeu]);
    }
    if (idxInteresse !== -1 && dadosLinha[idxInteresse]) {
      dadosContato.interesseDemonstrado = sanitizarValor(dadosLinha[idxInteresse]);
    }
    if (idxPrincipalDor !== -1 && dadosLinha[idxPrincipalDor]) {
      dadosContato.principalDor = sanitizarValor(dadosLinha[idxPrincipalDor]);
    }
    if (idxProximaAcao !== -1 && dadosLinha[idxProximaAcao]) {
      dadosContato.proximaAcao = sanitizarValor(dadosLinha[idxProximaAcao]);
    }
    
    // 🔥 SANITIZA O HISTÓRICO (Coluna R)
    let historicoRaw = dadosLinha[colunas.historico] || "Nenhuma interação registrada.";
    let historicoSanitizado = sanitizarValor(historicoRaw);
    if (!historicoSanitizado || historicoSanitizado.trim() === "") {
      historicoSanitizado = "Nenhuma interação registrada.";
    }
    
    const resultado = {
      success: true,
      dados: {
        id: sanitizarValor(dadosLinha[colunas.id]),
        razao: sanitizarValor(dadosLinha[colunas.razao]),
        cnpj: sanitizarValor(dadosLinha[colunas.cnpj]),
        contato: sanitizarValor(dadosLinha[colunas.contato]),
        contato_alt: sanitizarValor(dadosLinha[colunas.contato_alt]),
        endereco: sanitizarValor(enderecoCompleto),
        admin: sanitizarValor(dadosLinha[colunas.admin]),
        ramo: ramo,
        status: sanitizarValor(dadosLinha[colunas.status]),
        historico: historicoSanitizado,
        dataAbertura: sanitizarValor(dadosLinha[colunas.dataAbertura])
      },
      dadosContato: dadosContato
    };
    
    console.log("✅ [SERVER] Dados preparados com sucesso");
    return resultado;
    
  } catch (e) {
    console.error("❌ [SERVER] Erro em getDadosCompletosLead:", e);
    return { success: false, message: e.toString() };
  }
}

// ============================================
// MÓDULO OFERTAS TIM - PERMISSÕES ALINHADAS COM O SISTEMA
// ============================================

/**
 * Verificar permissão do usuário para o módulo OFERTAS
 * 🔥 ALINHADO 100% COM O SEU SISTEMA VEXO
 */
function verificarPermissaoOfertas() {
  try {
    // Usa a função existente getPerfilUsuario() do seu sistema
    const perfil = getPerfilUsuario();
    const cargo = perfil.cargo || "";
    
    console.log("🔍 [OFERTAS] Cargo do usuário:", cargo);
    
    // Definição de quem pode EDITAR (mesmos cargos do seu sistema)
    const cargosEdicao = ["ADMINISTRADOR", "BACKOFFICE", "PROPRIETÁRIO"];
    const podeEditar = cargosEdicao.includes(cargo);
    
    // Definição de quem pode VISUALIZAR
    const cargosVisualizacao = ["ADMINISTRADOR", "BACKOFFICE", "PROPRIETÁRIO", "CONSULTOR DE VENDAS"];
    const podeVisualizar = cargosVisualizacao.includes(cargo);
    
    return {
      success: true,
      podeEditar: podeEditar,
      podeVisualizar: podeVisualizar,
      cargo: cargo,
      nome: perfil.nome || "Usuário"
    };
    
  } catch (e) {
    console.error("❌ [OFERTAS] Erro ao verificar permissão:", e);
    return {
      success: false,
      podeEditar: false,
      podeVisualizar: false,
      cargo: "ERRO",
      nome: "Erro"
    };
  }
}


// ============================================
// MÓDULO OFERTAS TIM - BACKEND CORRIGIDO
// ============================================

/**
 * Busca todas as ofertas da planilha OFERTAS_TIM
 */
function getOfertasTim() {
  try {
    console.log("🔍 [SERVER] Iniciando busca de ofertas...");
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("OFERTAS_TIM");
    
    if (!sheet) {
      console.log("⚠️ [SERVER] Aba OFERTAS_TIM não encontrada!");
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    console.log(`📊 [SERVER] Total de linhas na planilha: ${data.length}`);
    
    if (data.length <= 1) {
      console.log("⚠️ [SERVER] Nenhuma oferta cadastrada (apenas cabeçalho)");
      return [];
    }
    
    const ofertas = [];
    
    for (let i = 1; i < data.length; i++) {
      const ativo = String(data[i][16] || "TRUE").toUpperCase() === "TRUE";
      
      // Pula linhas vazias
      if (!data[i][2] && !data[i][1]) continue;
      
      const oferta = {
        id: data[i][0] || `OFERTA-${String(i).padStart(3,'0')}`,
        nome_interno: data[i][1] || "",
        nome_comercial: data[i][2] || "",
        franquia_plano: data[i][3] || "",
        franquia_bonus: data[i][4] || "",
        franquia_total: data[i][5] || "",
        valor: parseFloat(data[i][6]) || 0,
        destaque: data[i][7] || "",
        tecnologia: data[i][8] || "5G",
        fidelidade: parseInt(data[i][9]) || 12,
        categoria: data[i][10] || "Premium",
        ordem: parseInt(data[i][11]) || 999,
        apps_inclusos: data[i][12] || "",
        vas_seguranca: data[i][13] || "",
        vas_beneficios: data[i][14] || "",
        descricao: data[i][15] || "",
        ativo: ativo
      };
      
      if (ativo) {
        ofertas.push(oferta);
      }
    }
    
    console.log(`✅ [SERVER] ${ofertas.length} ofertas ativas retornadas`);
    console.log(`📦 [SERVER] Primeira oferta: ${JSON.stringify(ofertas[0])}`);
    
    return ofertas;
    
  } catch (e) {
    console.error("❌ [SERVER] Erro em getOfertasTim:", e);
    return [];
  }
}

/**
 * Salvar oferta (APENAS ADMIN/BACKOFFICE/PROPRIETÁRIO)
 * 🔥 CORRIGIDA: Usa getPerfilUsuario() existente no sistema
 */
function salvarOfertaTim(oferta) {
  try {
    // 🔥 Recebe o cargo enviado pelo frontend
    const cargoFrontend = oferta.cargoUsuario || "";
    console.log("📌 Cargo recebido do frontend:", cargoFrontend);
    
    const podeEditar = (cargoFrontend === "ADMINISTRADOR" || cargoFrontend === "BACKOFFICE" || cargoFrontend === "PROPRIETÁRIO");
    
    if (!podeEditar) {
      return { success: false, message: `❌ Acesso negado. Seu cargo é ${cargoFrontend || "não informado"}. Apenas Administradores e Backoffice podem editar ofertas.` };
    }
    
    // Resto do código de salvar oferta (igual ao anterior, mas sem a busca na planilha USERS)
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("OFERTAS_TIM");
    
    if (!sheet) {
      sheet = ss.insertSheet("OFERTAS_TIM");
      const cabecalho = [
        "ID", "NOME_INTERNO", "NOME_COMERCIAL", "FRANQUIA_PLANO", "FRANQUIA_BONUS",
        "FRANQUIA_TOTAL", "VALOR", "DESTAQUE", "TECNOLOGIA", "FIDELIDADE_MESES",
        "CATEGORIA", "ORDEM", "APPS_INCLUSOS", "VAS_SEGURANCA", "VAS_BENEFICIOS",
        "DESCRICAO_COMPLETA", "ATIVO"
      ];
      sheet.appendRow(cabecalho);
      sheet.getRange("A1:Q1").setFontWeight("bold").setBackground("#0f172a").setFontColor("white");
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Calcula franquia total
    let franquiaTotal = oferta.franquia_plano || "";
    if (oferta.franquia_plano && oferta.franquia_bonus) {
      const numPlano = parseInt(oferta.franquia_plano) || 0;
      const numBonus = parseInt(oferta.franquia_bonus) || 0;
      franquiaTotal = `${numPlano + numBonus}GB`;
    }
    
    // Gera ID se não existir
    let id = oferta.id;
    if (!id || id === "") {
      let maiorNum = 0;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] && data[i][0].startsWith("OFERTA-")) {
          const num = parseInt(data[i][0].replace("OFERTA-", ""));
          if (num > maiorNum) maiorNum = num;
        }
      }
      id = `OFERTA-${String(maiorNum + 1).padStart(3, '0')}`;
    }
    
    const novaLinha = [
      id,
      oferta.nome_interno || "",
      oferta.nome_comercial,
      oferta.franquia_plano || "",
      oferta.franquia_bonus || "",
      franquiaTotal,
      oferta.valor,
      oferta.destaque || "",
      oferta.tecnologia,
      oferta.fidelidade,
      oferta.categoria,
      oferta.ordem || 999,
      oferta.apps_inclusos || "",
      oferta.vas_seguranca || "",
      oferta.vas_beneficios || "",
      oferta.descricao || "",
      oferta.ativo ? "TRUE" : "FALSE"
    ];
    
    let linhaEncontrada = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        linhaEncontrada = i + 1;
        break;
      }
    }
    
    if (linhaEncontrada !== -1) {
      sheet.getRange(linhaEncontrada, 1, 1, novaLinha.length).setValues([novaLinha]);
      return { success: true, message: "Oferta atualizada com sucesso!" };
    } else {
      sheet.appendRow(novaLinha);
      return { success: true, message: "Nova oferta adicionada com sucesso!" };
    }
    
  } catch (e) {
    console.error("Erro em salvarOfertaTim:", e);
    return { success: false, message: e.toString() };
  }
}

/**
 * Excluir oferta (APENAS ADMIN/BACKOFFICE/PROPRIETÁRIO)
 * 🔥 VERSÃO CORRIGIDA - RECEBE CARGO DO FRONTEND
 */
function excluirOfertaTim(id, cargoUsuario) {
  try {
    // 🔥 RECEBE O CARGO ENVIADO PELO FRONTEND
    console.log("📌 Excluindo oferta ID:", id);
    console.log("📌 Cargo recebido do frontend:", cargoUsuario);
    
    const podeEditar = (cargoUsuario === "ADMINISTRADOR" || cargoUsuario === "BACKOFFICE" || cargoUsuario === "PROPRIETÁRIO");
    
    if (!podeEditar) {
      return { success: false, message: `❌ Acesso negado. Seu cargo é ${cargoUsuario || "não informado"}. Apenas Administradores e Backoffice podem excluir ofertas.` };
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("OFERTAS_TIM");
    
    if (!sheet) {
      return { success: false, message: "Aba OFERTAS_TIM não encontrada" };
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        sheet.deleteRow(i + 1);
        return { success: true, message: "Oferta excluída com sucesso!" };
      }
    }
    
    return { success: false, message: "Oferta não encontrada" };
    
  } catch (e) {
    console.error("Erro em excluirOfertaTim:", e);
    return { success: false, message: e.toString() };
  }
}

// ============================================
// 🚀 BACKOFFICE - GESTÃO DE PEDIDOS PARCEIROS
// ============================================

/**
 * LISTA TODOS OS PEDIDOS UNIFICADOS (PROPRIO + PARCEIRO)
 * Agrupa por CNPJ e mostra apenas pedidos não concluídos por padrão
 */
function p_listarTodosPedidosBackoffice(filtroStatus = null) {
  try {
    console.log("🚀 Buscando pedidos unificados...");
    
    const ssProprio = SpreadsheetApp.openById("1ULyXmZjrHlTXJ7cl0jlL_ugriHzZ4W8Q-6ExvkPm6qg");
    const ssParceiro = SpreadsheetApp.openById("1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4");
    
    const sheetProprio = ssProprio.getSheetByName("VENDAS");
    const sheetParceiro = ssParceiro.getSheetByName("VENDAS");
    
    let todosPedidos = [];
    
    // ============================================
    // 1. BUSCAR PEDIDOS DA BASE PRÓPRIA (BACKOFFICE)
    // ============================================
    if (sheetProprio) {
      const data = sheetProprio.getDataRange().getValues();
      console.log(`📊 Base PRÓPRIA: ${data.length - 1} linhas`);
      
      for (let i = 1; i < data.length; i++) {
        const linha = data[i];
        if (!linha[3] && !linha[2]) continue;
        
        const statusRaw = String(linha[24] || "PENDENTE DE INPUT").trim();
        if (statusRaw.includes("CANCELADO")) continue;
        
        // Extrair documento (CNPJ/CPF)
        let documento = String(linha[2] || "").replace(/\D/g, '');
        if (!documento && linha[3]) documento = "SEM_DOC";
        
        // Extrair valor
        let valor = 0;
        if (typeof linha[7] === 'number') {
          valor = linha[7];
        } else if (linha[7]) {
          valor = parseFloat(String(linha[7]).replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
        }
        
        // Determinar etapa
        let etapa = 0;
        if (statusRaw.includes("1.")) etapa = 1;
        else if (statusRaw.includes("2.")) etapa = 2;
        else if (statusRaw.includes("3.")) etapa = 3;
        else if (statusRaw.includes("4.")) etapa = 4;
        else if (statusRaw.includes("5.")) etapa = 5;
        else if (statusRaw.includes("6.")) etapa = 6;
        
        todosPedidos.push({
          id: `PROP-${String(i).padStart(5, '0')}`,
          linha: i + 1,
          origem: "PROPRIO",
          documento: documento,
          data_criacao: formatarDataBR(linha[1]),
          cliente: String(linha[3] || "Não informado"),
          cnpj: linha[2] || "",
          ie: linha[34] || "",
          modalidade: linha[4] || "",
          plano: linha[5] || "",
          numero_linha: linha[6] || "",
          valor: valor,
          status_raw: statusRaw,
          status_etapa: etapa,
          parceiro_nome: "BACKOFFICE",
          data_ultima_atualizacao: formatarDataBR(linha[10]),
          data_ativacao: formatarDataBR(linha[25]),
          cep: linha[11] || "",
          endereco: linha[12] || "",
          numero_endereco: linha[13] || "",
          cidade: linha[16] || "",
          uf: linha[17] || "",
          nome_admin: linha[19] || "",
          email: linha[20] || "",
          contato_financeiro: linha[21] || "",
          // Campos para agrupamento
          linhas_agrupadas: [{
            plano: linha[5] || "",
            numero: linha[6] || "",
            valor: valor,
            modalidade: linha[4] || ""
          }]
        });
      }
    }
    
    // ============================================
    // 2. BUSCAR PEDIDOS DA BASE PARCEIRO
    // ============================================
    if (sheetParceiro) {
      const data = sheetParceiro.getDataRange().getValues();
      console.log(`📊 Base PARCEIRO: ${data.length - 1} linhas`);
      
      // Mapear colunas da planilha do parceiro
      // Baseado no seu p_salvarVendaTIM
      for (let i = 1; i < data.length; i++) {
        const linha = data[i];
        if (!linha[3] && !linha[2]) continue;
        
        const statusRaw = String(linha[24] || "PENDENTE DE INPUT").trim();
        if (statusRaw.includes("CANCELADO")) continue;
        
        // Extrair documento (CNPJ está na coluna D - índice 3)
        let documento = String(linha[3] || "").replace(/\D/g, '');
        if (!documento && linha[4]) documento = "SEM_DOC";
        
        // Extrair valor (coluna I - índice 8)
        let valor = 0;
        if (typeof linha[8] === 'number') {
          valor = linha[8];
        } else if (linha[8]) {
          valor = parseFloat(String(linha[8]).replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
        }
        
        // Determinar etapa
        let etapa = 0;
        if (statusRaw.includes("1.")) etapa = 1;
        else if (statusRaw.includes("2.")) etapa = 2;
        else if (statusRaw.includes("3.")) etapa = 3;
        else if (statusRaw.includes("4.")) etapa = 4;
        else if (statusRaw.includes("5.")) etapa = 5;
        else if (statusRaw.includes("6.")) etapa = 6;
        
        todosPedidos.push({
          id: `PAR-${String(i).padStart(5, '0')}`,
          linha: i + 1,
          origem: "PARCEIRO",
          documento: documento,
          data_criacao: formatarDataBR(linha[2]), // Coluna C
          cliente: String(linha[3] || "Não informado"), // Coluna D
          cnpj: linha[3] || "",
          ie: linha[34] || "",
          modalidade: linha[4] || "", // Coluna E
          plano: linha[6] || "", // Coluna G
          numero_linha: linha[7] || "", // Coluna H
          valor: valor,
          status_raw: statusRaw,
          status_etapa: etapa,
          parceiro_nome: String(linha[9] || "").toUpperCase(), // Coluna J
          data_ultima_atualizacao: formatarDataBR(linha[10]), // Coluna K
          data_ativacao: formatarDataBR(linha[25]), // Coluna Z
          cep: linha[11] || "",
          endereco: linha[12] || "",
          numero_endereco: linha[13] || "",
          cidade: linha[16] || "",
          uf: linha[17] || "",
          nome_admin: linha[19] || "",
          email: linha[20] || "",
          contato_financeiro: linha[21] || "",
          linhas_agrupadas: [{
            plano: linha[6] || "",
            numero: linha[7] || "",
            valor: valor,
            modalidade: linha[4] || ""
          }]
        });
      }
    }
    
    // ============================================
    // 3. AGRUPAR PEDIDOS PELO MESMO DOCUMENTO (CNPJ)
    // ============================================
    const pedidosAgrupados = new Map();
    
    todosPedidos.forEach(pedido => {
      const chave = pedido.documento;
      
      if (pedidosAgrupados.has(chave)) {
        // Agrupar linhas do mesmo pedido
        const existente = pedidosAgrupados.get(chave);
        existente.linhas_agrupadas.push(...pedido.linhas_agrupadas);
        
        // Soma valores
        existente.valor += pedido.valor;
        
        // Mantém o status mais avançado
        if (pedido.status_etapa > existente.status_etapa) {
          existente.status_raw = pedido.status_raw;
          existente.status_etapa = pedido.status_etapa;
          existente.data_ultima_atualizacao = pedido.data_ultima_atualizacao;
        }
        
        // Mantém a data mais antiga
        if (pedido.data_criacao < existente.data_criacao) {
          existente.data_criacao = pedido.data_criacao;
        }
        
        // Adiciona parceiros envolvidos
        if (!existente.parceiros_envolvidos) {
          existente.parceiros_envolvidos = [existente.parceiro_nome];
        }
        if (!existente.parceiros_envolvidos.includes(pedido.parceiro_nome)) {
          existente.parceiros_envolvidos.push(pedido.parceiro_nome);
        }
        existente.parceiro_nome = existente.parceiros_envolvidos.join(", ");
        
      } else {
        pedidosAgrupados.set(chave, { ...pedido, linhas_agrupadas: [...pedido.linhas_agrupadas] });
      }
    });
    
    // Converter para array
    let pedidosUnificados = Array.from(pedidosAgrupados.values());
    
    // ============================================
    // 4. ORDENAR POR PRIORIDADE
    // ============================================
    pedidosUnificados.sort((a, b) => {
      // Primeiro por etapa (menor etapa primeiro)
      if (a.status_etapa !== b.status_etapa) {
        return a.status_etapa - b.status_etapa;
      }
      // Depois por data (mais antigo primeiro)
      return String(a.data_criacao).localeCompare(String(b.data_criacao));
    });
    
    console.log(`✅ ${pedidosUnificados.length} pedidos unificados e agrupados`);
    
    return { success: true, pedidos: pedidosUnificados, total: pedidosUnificados.length };
    
  } catch (e) {
    console.error("❌ Erro em p_listarTodosPedidosBackoffice:", e);
    return { success: false, message: e.toString(), pedidos: [] };
  }
}



/**
 * ATUALIZA STATUS DO PEDIDO
 */
function p_atualizarStatusPedidoBackoffice(linha, novoStatus, dataAtivacao, dataBoc, nomeUsuario) {
  try {
    console.log(`🔄 Atualizando pedido linha ${linha} para: ${novoStatus}`);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("VENDAS");
    
    if (!sheet) {
      return { success: false, message: "Aba VENDAS não encontrada" };
    }
    
    const dataAtual = new Date();
    
    // Atualizar status (Coluna Y - índice 25)
    sheet.getRange(linha, 25).setValue(novoStatus);
    
    // Atualizar data da última modificação (Coluna K - índice 11)
    sheet.getRange(linha, 11).setValue(dataAtual);
    
    // Se for ativação (etapa 6)
    if (novoStatus.includes("6. ATIVADO") && dataAtivacao) {
      sheet.getRange(linha, 26).setValue(dataAtivacao); // Coluna Z
    }
    
    // Se for aprovação BOC (etapa 3)
    if (novoStatus.includes("3. DOCS VALIDADOS BOC") && dataBoc) {
      sheet.getRange(linha, 36).setValue(dataBoc); // Coluna AJ
    }
    
    SpreadsheetApp.flush();
    
    return { success: true, message: "Status atualizado com sucesso!" };
    
  } catch (e) {
    console.error("❌ Erro em p_atualizarStatusPedidoBackoffice:", e);
    return { success: false, message: e.toString() };
  }
}

/**
 * DETALHES DO PEDIDO
 */
function p_detalhesPedidoBackoffice(linha) {
  try {
    console.log(`🔍 Buscando detalhes do pedido linha ${linha}`);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("VENDAS");
    
    if (!sheet) {
      return { success: false, message: "Aba VENDAS não encontrada" };
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (linha < 1 || linha >= data.length) {
      return { success: false, message: "Pedido não encontrado" };
    }
    
    const row = data[linha - 1];
    
    // Extrair valor
    let valor = 0;
    if (typeof row[7] === 'number') {
      valor = row[7];
    } else if (row[7]) {
      valor = parseFloat(String(row[7]).replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
    }
    
    // Determinar etapa
    const statusRaw = String(row[24] || "PENDENTE DE INPUT").trim();
    let etapa = 0;
    if (statusRaw.includes("1.")) etapa = 1;
    else if (statusRaw.includes("2.")) etapa = 2;
    else if (statusRaw.includes("3.")) etapa = 3;
    else if (statusRaw.includes("4.")) etapa = 4;
    else if (statusRaw.includes("5.")) etapa = 5;
    else if (statusRaw.includes("6.")) etapa = 6;
    
    const pedido = {
      id: `PED-${String(linha).padStart(5, '0')}`,
      linha: linha,
      data_criacao: formatarDataBR(row[1]),
      cliente: row[3] || "Não informado",
      cnpj: row[2] || "",
      ie: row[34] || "",
      modalidade: row[4] || "",
      plano: row[5] || "",
      numero_linha: row[6] || "",
      valor: valor,
      status_raw: statusRaw,
      status_etapa: etapa,
      data_ultima_atualizacao: formatarDataBR(row[10]),
      data_ativacao: formatarDataBR(row[25]),
      cep: row[11] || "",
      endereco: row[12] || "",
      numero_endereco: row[13] || "",
      cidade: row[16] || "",
      uf: row[17] || "",
      nome_admin: row[19] || "",
      email: row[20] || "",
      contato_financeiro: row[21] || ""
    };
    
    console.log(`✅ Detalhes do pedido ${pedido.id} carregados`);
    
    return { success: true, pedido: pedido };
    
  } catch (e) {
    console.error("❌ Erro em p_detalhesPedidoBackoffice:", e);
    return { success: false, message: e.toString() };
  }
}


// ============================================
// 🚀 MÓDULO GESTÃO DE PEDIDOS - BACKEND
// ============================================

/**
 * LISTA PEDIDOS UNIFICADOS COM PERMISSÕES
 * @param {Object} filtros - Filtros e permissões do usuário
 * @returns {Object} Lista de pedidos
 */
function p_listarPedidosGestao(filtros) {
  try {
    // 🔧 DECLARAÇÃO GLOBAL DA VARIÁVEL PARA EVITAR ReferenceError
    let bancoDeDadosId = null; // ← NOVA LINHA

    console.log("🚀 p_listarPedidosGestao - Filtros:", JSON.stringify(filtros));

    // ============================================
    // 1. FUNÇÕES AUXILIARES
    // ============================================
    function getSafe(array, index, defaultValue = "") {
      if (!array || array.length <= index) return String(defaultValue);
      const val = array[index];
      return val !== null && val !== undefined ? String(val) : String(defaultValue);
    }

    function formatarDataBR(data) {
      if (!data) return "";
      if (data instanceof Date) {
        return Utilities.formatDate(data, "GMT-3", "dd/MM/yyyy HH:mm");
      }
      if (typeof data === "string" && data.includes("/")) return data;
      return String(data);
    }

    function getPlanilhaPorId(bancoId) {
      if (bancoId && bancoId.trim() !== "" && bancoId !== "null") {
        try {
          return SpreadsheetApp.openById(bancoId);
        } catch (e) {
          console.warn(`⚠️ Falha ao abrir planilha ${bancoId}, usando central.`, e);
          return SpreadsheetApp.openById("1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4");
        }
      }
      return SpreadsheetApp.openById("1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4");
    }

    function normalizarTexto(texto) {
      if (!texto) return "";
      return String(texto)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .trim();
    }

    // ============================================
    // 2. IDENTIFICAÇÃO DO USUÁRIO
    // ============================================
    const cargoUsuario = (filtros.cargo || "").toUpperCase().trim();
    const nomeUsuario = normalizarTexto(filtros.nome || "");

    const ehRestrito = (cargoUsuario === "FREELANCER" ||
                        cargoUsuario === "CONSULTOR DE VENDAS" ||
                        cargoUsuario === "PARCEIRO" ||
                        cargoUsuario === "TERCEIRO");

    const ehAdmin = (cargoUsuario === "ADMINISTRADOR" || cargoUsuario === "BACKOFFICE");

    console.log(`👤 Cargo: ${cargoUsuario}, Nome: ${nomeUsuario}, Restrito: ${ehRestrito}, Admin: ${ehAdmin}`);

    const ID_PLANILHA_PROPRIO = "1ULyXmZjrHlTXJ7cl0jlL_ugriHzZ4W8Q-6ExvkPm6qg";
    const ID_PLANILHA_CENTRAL_PARCEIROS = "1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4";

    let todosPedidos = [];

    // ============================================
    // 3. SE FOR RESTRITO → BUSCA APENAS OS PRÓPRIOS PEDIDOS
    // ============================================
    if (ehRestrito) {
      console.log(`🔒 Modo restrito ativado para ${nomeUsuario}`);

      let ss;
      let planilhaOrigem = "";

      if (cargoUsuario === "CONSULTOR DE VENDAS") {
        try {
          ss = SpreadsheetApp.openById(ID_PLANILHA_PROPRIO);
          planilhaOrigem = "propria (consultor)";
          console.log(`📂 CONSULTOR DE VENDAS usando planilha própria: ${ss.getId()}`);
        } catch (e) {
          console.error("❌ Erro ao abrir planilha própria:", e);
          return { success: false, message: "Erro ao acessar planilha própria.", pedidos: [] };
        }
      } else {
        // 🔥 AGORA bancoDeDadosId já está declarado no escopo da função
        try {
          const usuarioSessao = JSON.parse(PropertiesService.getScriptProperties().getProperty('usuario_logado') || '{}');
          bancoDeDadosId = usuarioSessao.bancoDeDadosId || null;
          console.log(`🏦 bancoDeDadosId da sessão: ${bancoDeDadosId || 'NULL'}`);
        } catch (e) {
          console.warn("⚠️ Erro ao ler sessão do usuário:", e);
        }

        if (!bancoDeDadosId) {
          const parceiros = getListaParceirosComBancoProprio();
          const parceiro = parceiros.find(p => 
            p.matricula === nomeUsuario || 
            p.nome.toUpperCase() === nomeUsuario
          );
          if (parceiro && parceiro.bancoDeDadosId) {
            bancoDeDadosId = parceiro.bancoDeDadosId;
            console.log(`🏦 bancoDeDadosId encontrado na lista de parceiros: ${bancoDeDadosId}`);
          }
        }

        if (bancoDeDadosId && bancoDeDadosId !== "null" && bancoDeDadosId.trim() !== "") {
          try {
            ss = SpreadsheetApp.openById(bancoDeDadosId);
            planilhaOrigem = `individual (${bancoDeDadosId})`;
            console.log(`✅ Planilha individual aberta: ${bancoDeDadosId}`);
          } catch (e) {
            console.warn(`⚠️ Falha ao abrir planilha individual ${bancoDeDadosId}, usando central.`, e);
            ss = SpreadsheetApp.openById(ID_PLANILHA_CENTRAL_PARCEIROS);
            planilhaOrigem = "central (fallback)";
          }
        } else {
          ss = SpreadsheetApp.openById(ID_PLANILHA_CENTRAL_PARCEIROS);
          console.log(`📂 Usando planilha central de parceiros: ${ID_PLANILHA_CENTRAL_PARCEIROS}`);
          planilhaOrigem = "central";
        }
      }

      const sheet = ss.getSheetByName("VENDAS");
      if (!sheet) {
        console.warn(`⚠️ Aba VENDAS não encontrada na planilha ${planilhaOrigem}`);
        return { success: true, pedidos: [], total: 0, message: "Nenhum pedido encontrado." };
      }

      const data = sheet.getDataRange().getValues();
      console.log(`📊 Total de linhas na planilha ${planilhaOrigem}: ${data.length - 1}`);

      for (let i = 1; i < data.length; i++) {
        const linha = data[i];
        if (!linha[3] && !linha[2]) continue;

        const statusRaw = getSafe(linha, 24, "PENDENTE DE INPUT").trim();
        if (statusRaw.includes("CANCELADO")) continue;

        const deveFiltrarPorVendedor = (cargoUsuario === "CONSULTOR DE VENDAS" || 
                                        planilhaOrigem === "central" || 
                                        planilhaOrigem === "central (fallback)");

        if (deveFiltrarPorVendedor) {
          const vendedor = normalizarTexto(getSafe(linha, 9, ""));
          const matriculaVendedor = normalizarTexto(getSafe(linha, 8, ""));
          if (vendedor !== nomeUsuario && matriculaVendedor !== nomeUsuario) {
            continue;
          }
        }

        let valor = 0;
        if (typeof linha[7] === 'number') {
          valor = linha[7];
        } else if (linha[7]) {
          valor = parseFloat(String(linha[7]).replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
        }

        let etapa = 0;
        if (statusRaw.includes("1.")) etapa = 1;
        else if (statusRaw.includes("2.")) etapa = 2;
        else if (statusRaw.includes("3.")) etapa = 3;
        else if (statusRaw.includes("4.")) etapa = 4;
        else if (statusRaw.includes("5.")) etapa = 5;
        else if (statusRaw.includes("6.")) etapa = 6;

        let cnpj = getSafe(linha, 2, "").replace(/\D/g, '');
        let modalidade = getSafe(linha, 4, "");

        let dataKey = "";
        if (linha[1]) {
          if (linha[1] instanceof Date) {
            dataKey = Utilities.formatDate(linha[1], "GMT-3", "dd/MM/yyyy");
          } else {
            const dataStr = String(linha[1]);
            const partes = dataStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (partes) {
              dataKey = `${partes[1]}/${partes[2]}/${partes[3]}`;
            }
          }
        }

        let dataVendaStr = "";
        if (linha[1]) {
          if (linha[1] instanceof Date) {
            dataVendaStr = Utilities.formatDate(linha[1], "GMT-3", "dd/MM/yyyy");
          } else {
            const dataStr = String(linha[1]);
            const partes = dataStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (partes) {
              dataVendaStr = `${partes[1]}/${partes[2]}/${partes[3]}`;
            } else {
              dataVendaStr = dataStr.split(' ')[0];
            }
          }
        }

        const id_unico_completo = `${cnpj}|${dataKey}|${modalidade}`;

        todosPedidos.push({
          id: `${planilhaOrigem.includes("propria") ? "PROP" : "PAR"}-${String(i).padStart(5, '0')}`,
          linha: i + 1,
          origem: planilhaOrigem.includes("propria") ? "PROPRIO" : "PARCEIRO",
          id_unico_completo: id_unico_completo,
          cnpj: cnpj,
          data_key: dataKey,
          bancoDeDadosId: (planilhaOrigem.includes("propria") ? null : (bancoDeDadosId || ID_PLANILHA_CENTRAL_PARCEIROS)),
          vencimento: getSafe(linha, 0, ""),
          data_venda: dataVendaStr,
          data_criacao: formatarDataBR(linha[1]),
          cliente: getSafe(linha, 3, "Não informado"),
          ie: getSafe(linha, 34, ""),
          modalidade: modalidade,
          plano: getSafe(linha, 5, ""),
          numero_linha: getSafe(linha, 6, ""),
          valor: valor,
          status_raw: statusRaw,
          status_etapa: etapa,
          vendedor: getSafe(linha, 9, "").toUpperCase().trim(),
          parceiro_nome: planilhaOrigem.includes("propria") ? "BACKOFFICE" : (getSafe(linha, 9, "").toUpperCase().trim()),
          responsavel_nome: getSafe(linha, 9, "").toUpperCase().trim(),
          data_ultima_atualizacao: formatarDataBR(linha[10]),
          data_ativacao: formatarDataBR(linha[25]),
          data_radar: getSafe(linha, 37, ""),
          codigoCliente: getSafe(linha, 31, ""),
          cep: getSafe(linha, 11, ""),
          endereco: getSafe(linha, 12, ""),
          numero_endereco: getSafe(linha, 13, ""),
          complemento: getSafe(linha, 14, ""),
          bairro: getSafe(linha, 15, ""),
          cidade: getSafe(linha, 16, ""),
          uf: getSafe(linha, 17, ""),
          cpf_admin: getSafe(linha, 18, ""),
          nome_admin: getSafe(linha, 19, ""),
          email: getSafe(linha, 20, ""),
          contato_financeiro: getSafe(linha, 21, ""),
          linhas_agrupadas: [{
            plano: getSafe(linha, 5, ""),
            numero: getSafe(linha, 6, ""),
            valor: valor,
            modalidade: modalidade,
            data: dataKey,
            operadora_doadora: getSafe(linha, 8, ""),
            operadora: getSafe(linha, 8, "")
          }]
        });
      }

      if (todosPedidos.length === 0) {
        return { success: true, pedidos: [], total: 0, message: "📭 Nenhum pedido encontrado para você." };
      }

      const pedidosAgrupados = new Map();
      todosPedidos.forEach(pedido => {
        const chave = `${pedido.cnpj || "SEM_DOC"}_${pedido.data_key || "SEM_DATA"}`;
        if (pedidosAgrupados.has(chave)) {
          const existente = pedidosAgrupados.get(chave);
          existente.linhas_agrupadas.push(...pedido.linhas_agrupadas);
          existente.valor += pedido.valor;
          if (pedido.status_etapa > existente.status_etapa) {
            existente.status_raw = pedido.status_raw;
            existente.status_etapa = pedido.status_etapa;
            existente.data_ultima_atualizacao = pedido.data_ultima_atualizacao;
          }
          if (pedido.bancoDeDadosId && !existente.bancoDeDadosId) {
            existente.bancoDeDadosId = pedido.bancoDeDadosId;
          }
          if (pedido.responsavel_nome && !existente.responsavel_nome.includes(pedido.responsavel_nome)) {
            existente.responsavel_nome += `, ${pedido.responsavel_nome}`;
          }
          if (!existente.ie && pedido.ie) existente.ie = pedido.ie;
          if (!existente.cep && pedido.cep) existente.cep = pedido.cep;
          if (!existente.codigoCliente && pedido.codigoCliente) existente.codigoCliente = pedido.codigoCliente;
        } else {
          const novoPedido = { ...pedido };
          novoPedido.id_unico = `${pedido.cnpj}|${pedido.data_key}`;
          novoPedido.linhas_agrupadas = [...pedido.linhas_agrupadas];
          novoPedido.modalidade = pedido.modalidade || 'PRIMEIRA ATIVAÇÃO';
          pedidosAgrupados.set(chave, novoPedido);
        }
      });

      let resultado = Array.from(pedidosAgrupados.values());
      resultado.sort((a, b) => {
        if (a.status_etapa !== b.status_etapa) return a.status_etapa - b.status_etapa;
        return String(b.data_criacao).localeCompare(String(a.data_criacao));
      });

      console.log(`✅ ${resultado.length} pedidos agrupados (CNPJ+DATA) para ${nomeUsuario} na planilha ${planilhaOrigem}`);
      return { success: true, pedidos: resultado, total: resultado.length };
    }

    // ============================================
    // 4. ADMIN / BACKOFFICE → COMPORTAMENTO ORIGINAL COMPLETO
    // ============================================
    if (ehAdmin) {
      console.log(`👑 Modo administrador/backoffice ativado. Buscando todos os pedidos.`);

      const parceirosComBanco = getListaParceirosComBancoProprio();
      const mapaParceirosComBanco = new Map();
      parceirosComBanco.forEach(p => {
        mapaParceirosComBanco.set(p.matricula, p);
      });

      // 4a. Ler planilha própria (BACKOFFICE)
      try {
        const ssProprio = SpreadsheetApp.openById(ID_PLANILHA_PROPRIO);
        const sheetProprio = ssProprio.getSheetByName("VENDAS");
        if (sheetProprio) {
          const data = sheetProprio.getDataRange().getValues();
          console.log(`📊 Base PRÓPRIA: ${data.length - 1} linhas`);

          for (let i = 1; i < data.length; i++) {
            const linha = data[i];
            if (!linha[3] && !linha[2]) continue;

            const statusRaw = getSafe(linha, 24, "PENDENTE DE INPUT").trim();
            if (statusRaw.includes("CANCELADO")) continue;

            const vendedor = getSafe(linha, 9, "").toUpperCase().trim();

            let valor = 0;
            if (typeof linha[7] === 'number') {
              valor = linha[7];
            } else if (linha[7]) {
              valor = parseFloat(String(linha[7]).replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
            }

            let etapa = 0;
            if (statusRaw.includes("1.")) etapa = 1;
            else if (statusRaw.includes("2.")) etapa = 2;
            else if (statusRaw.includes("3.")) etapa = 3;
            else if (statusRaw.includes("4.")) etapa = 4;
            else if (statusRaw.includes("5.")) etapa = 5;
            else if (statusRaw.includes("6.")) etapa = 6;

            let cnpj = getSafe(linha, 2, "").replace(/\D/g, '');
            let modalidade = getSafe(linha, 4, "");

            let dataKey = "";
            if (linha[1]) {
              if (linha[1] instanceof Date) {
                dataKey = Utilities.formatDate(linha[1], "GMT-3", "dd/MM/yyyy");
              } else {
                const dataStr = String(linha[1]);
                const partes = dataStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                if (partes) {
                  dataKey = `${partes[1]}/${partes[2]}/${partes[3]}`;
                }
              }
            }

            let dataVendaStr = "";
            if (linha[1]) {
              if (linha[1] instanceof Date) {
                dataVendaStr = Utilities.formatDate(linha[1], "GMT-3", "dd/MM/yyyy");
              } else {
                const dataStr = String(linha[1]);
                const partes = dataStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                if (partes) {
                  dataVendaStr = `${partes[1]}/${partes[2]}/${partes[3]}`;
                } else {
                  dataVendaStr = dataStr.split(' ')[0];
                }
              }
            }

            todosPedidos.push({
              id: `PROP-${String(i).padStart(5, '0')}`,
              linha: i + 1,
              origem: "PROPRIO",
              cnpj: cnpj,
              data_key: dataKey,
              bancoDeDadosId: null,
              vencimento: getSafe(linha, 0, ""),
              data_venda: dataVendaStr,
              data_criacao: formatarDataBR(linha[1]),
              cliente: getSafe(linha, 3, "Não informado"),
              ie: getSafe(linha, 34, ""),
              modalidade: modalidade,
              plano: getSafe(linha, 5, ""),
              numero_linha: getSafe(linha, 6, ""),
              valor: valor,
              status_raw: statusRaw,
              status_etapa: etapa,
              vendedor: vendedor,
              parceiro_nome: "BACKOFFICE",
              responsavel_nome: vendedor,
              data_ultima_atualizacao: formatarDataBR(linha[10]),
              data_ativacao: formatarDataBR(linha[25]),
              data_radar: getSafe(linha, 36, ""),
              codigoCliente: getSafe(linha, 31, ""),
              cep: getSafe(linha, 11, ""),
              endereco: getSafe(linha, 12, ""),
              numero_endereco: getSafe(linha, 13, ""),
              complemento: getSafe(linha, 14, ""),
              bairro: getSafe(linha, 15, ""),
              cidade: getSafe(linha, 16, ""),
              uf: getSafe(linha, 17, ""),
              cpf_admin: getSafe(linha, 18, ""),
              nome_admin: getSafe(linha, 19, ""),
              email: getSafe(linha, 20, ""),
              contato_financeiro: getSafe(linha, 21, ""),
              linhas_agrupadas: [{
                plano: getSafe(linha, 5, ""),
                numero: getSafe(linha, 6, ""),
                valor: valor,
                modalidade: modalidade,
                data: dataKey,
                operadora_doadora: getSafe(linha, 8, ""),
                operadora: getSafe(linha, 8, "")
              }]
            });
          }
        }
      } catch (e) {
        console.error("❌ Erro ao ler planilha PRÓPRIA:", e);
      }

      // 4b. Ler planilha central de parceiros (apenas para quem NÃO tem banco próprio)
      try {
        const ssCentral = SpreadsheetApp.openById(ID_PLANILHA_CENTRAL_PARCEIROS);
        const sheetCentral = ssCentral.getSheetByName("VENDAS");
        if (sheetCentral) {
          const data = sheetCentral.getDataRange().getValues();
          console.log(`📊 Base CENTRAL PARCEIROS: ${data.length - 1} linhas`);

          for (let i = 1; i < data.length; i++) {
            const linha = data[i];
            if (!linha[3] && !linha[2]) continue;

            const statusRaw = getSafe(linha, 24, "PENDENTE DE INPUT").trim();
            if (statusRaw.includes("CANCELADO")) continue;

            const vendedor = getSafe(linha, 9, "").toUpperCase().trim();
            const matriculaVendedor = getSafe(linha, 8, "").toUpperCase().trim();

            const parceiroInfo = mapaParceirosComBanco.get(vendedor) || mapaParceirosComBanco.get(matriculaVendedor);
            if (parceiroInfo) {
              continue;
            }

            let valor = 0;
            if (typeof linha[7] === 'number') {
              valor = linha[7];
            } else if (linha[7]) {
              valor = parseFloat(String(linha[7]).replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
            }

            let etapa = 0;
            if (statusRaw.includes("1.")) etapa = 1;
            else if (statusRaw.includes("2.")) etapa = 2;
            else if (statusRaw.includes("3.")) etapa = 3;
            else if (statusRaw.includes("4.")) etapa = 4;
            else if (statusRaw.includes("5.")) etapa = 5;
            else if (statusRaw.includes("6.")) etapa = 6;

            let cnpj = getSafe(linha, 2, "").replace(/\D/g, '');
            let modalidade = getSafe(linha, 4, "");

            let dataKey = "";
            if (linha[1]) {
              if (linha[1] instanceof Date) {
                dataKey = Utilities.formatDate(linha[1], "GMT-3", "dd/MM/yyyy");
              } else {
                const dataStr = String(linha[1]);
                const partes = dataStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                if (partes) {
                  dataKey = `${partes[1]}/${partes[2]}/${partes[3]}`;
                }
              }
            }

            let dataVendaStr = "";
            if (linha[1]) {
              if (linha[1] instanceof Date) {
                dataVendaStr = Utilities.formatDate(linha[1], "GMT-3", "dd/MM/yyyy");
              } else {
                const dataStr = String(linha[1]);
                const partes = dataStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                if (partes) {
                  dataVendaStr = `${partes[1]}/${partes[2]}/${partes[3]}`;
                } else {
                  dataVendaStr = dataStr.split(' ')[0];
                }
              }
            }

            todosPedidos.push({
              id: `PAR-${String(i).padStart(5, '0')}`,
              linha: i + 1,
              origem: "PARCEIRO",
              cnpj: cnpj,
              data_key: dataKey,
              bancoDeDadosId: null,
              vencimento: getSafe(linha, 0, ""),
              data_venda: dataVendaStr,
              data_criacao: formatarDataBR(linha[1]),
              cliente: getSafe(linha, 3, "Não informado"),
              ie: getSafe(linha, 34, ""),
              modalidade: modalidade,
              plano: getSafe(linha, 5, ""),
              numero_linha: getSafe(linha, 6, ""),
              valor: valor,
              status_raw: statusRaw,
              status_etapa: etapa,
              vendedor: vendedor,
              parceiro_nome: vendedor,
              responsavel_nome: vendedor,
              data_ultima_atualizacao: formatarDataBR(linha[10]),
              data_ativacao: formatarDataBR(linha[25]),
              data_radar: getSafe(linha, 37, ""),
              codigoCliente: getSafe(linha, 31, ""),
              cep: getSafe(linha, 11, ""),
              endereco: getSafe(linha, 12, ""),
              numero_endereco: getSafe(linha, 13, ""),
              complemento: getSafe(linha, 14, ""),
              bairro: getSafe(linha, 15, ""),
              cidade: getSafe(linha, 16, ""),
              uf: getSafe(linha, 17, ""),
              cpf_admin: getSafe(linha, 18, ""),
              nome_admin: getSafe(linha, 19, ""),
              email: getSafe(linha, 20, ""),
              contato_financeiro: getSafe(linha, 21, ""),
              linhas_agrupadas: [{
                plano: getSafe(linha, 5, ""),
                numero: getSafe(linha, 6, ""),
                valor: valor,
                modalidade: modalidade,
                data: dataKey,
                operadora_doadora: getSafe(linha, 8, ""),
                operadora: getSafe(linha, 8, "")
              }]
            });
          }
        }
      } catch (e) {
        console.error("❌ Erro ao ler planilha CENTRAL PARCEIROS:", e);
      }

      // 4c. Ler planilhas individuais de cada parceiro com banco próprio
      const parceiros = Array.from(mapaParceirosComBanco.values());
      console.log(`📋 ${parceiros.length} parceiros com banco próprio`);

      parceiros.forEach(parceiro => {
        try {
          console.log(`🔍 Processando parceiro: ${parceiro.nome} (${parceiro.matricula}) - Banco: ${parceiro.bancoDeDadosId}`);
          const ss = getPlanilhaPorId(parceiro.bancoDeDadosId);
          const sheet = ss.getSheetByName("VENDAS");
          if (!sheet) {
            console.warn(`⚠️ Aba VENDAS não encontrada na planilha do parceiro ${parceiro.nome}`);
            return;
          }

          const data = sheet.getDataRange().getValues();
          console.log(`📊 Base PARCEIRO INDIVIDUAL (${parceiro.nome}): ${data.length - 1} linhas`);

          if (data.length <= 1) {
            console.log(`ℹ️ Planilha do parceiro ${parceiro.nome} está vazia`);
            return;
          }

          for (let i = 1; i < data.length; i++) {
            const linha = data[i];
            if (!linha[3] && !linha[2]) continue;

            const statusRaw = getSafe(linha, 24, "PENDENTE DE INPUT").trim();
            if (statusRaw.includes("CANCELADO")) continue;

            const vendedor = getSafe(linha, 9, "").toUpperCase().trim();

            let valor = 0;
            if (typeof linha[7] === 'number') {
              valor = linha[7];
            } else if (linha[7]) {
              valor = parseFloat(String(linha[7]).replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
            }

            let etapa = 0;
            if (statusRaw.includes("1.")) etapa = 1;
            else if (statusRaw.includes("2.")) etapa = 2;
            else if (statusRaw.includes("3.")) etapa = 3;
            else if (statusRaw.includes("4.")) etapa = 4;
            else if (statusRaw.includes("5.")) etapa = 5;
            else if (statusRaw.includes("6.")) etapa = 6;

            let cnpj = getSafe(linha, 2, "").replace(/\D/g, '');
            let modalidade = getSafe(linha, 4, "");

            let dataKey = "";
            if (linha[1]) {
              if (linha[1] instanceof Date) {
                dataKey = Utilities.formatDate(linha[1], "GMT-3", "dd/MM/yyyy");
              } else {
                const dataStr = String(linha[1]);
                const partes = dataStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                if (partes) {
                  dataKey = `${partes[1]}/${partes[2]}/${partes[3]}`;
                }
              }
            }

            let dataVendaStr = "";
            if (linha[1]) {
              if (linha[1] instanceof Date) {
                dataVendaStr = Utilities.formatDate(linha[1], "GMT-3", "dd/MM/yyyy");
              } else {
                const dataStr = String(linha[1]);
                const partes = dataStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                if (partes) {
                  dataVendaStr = `${partes[1]}/${partes[2]}/${partes[3]}`;
                } else {
                  dataVendaStr = dataStr.split(' ')[0];
                }
              }
            }

            todosPedidos.push({
              id: `PAR-${parceiro.matricula}-${String(i).padStart(5, '0')}`,
              linha: i + 1,
              origem: "PARCEIRO",
              cnpj: cnpj,
              data_key: dataKey,
              bancoDeDadosId: parceiro.bancoDeDadosId,
              vencimento: getSafe(linha, 0, ""),
              data_venda: dataVendaStr,
              data_criacao: formatarDataBR(linha[1]),
              cliente: getSafe(linha, 3, "Não informado"),
              ie: getSafe(linha, 34, ""),
              modalidade: modalidade,
              plano: getSafe(linha, 5, ""),
              numero_linha: getSafe(linha, 6, ""),
              valor: valor,
              status_raw: statusRaw,
              status_etapa: etapa,
              vendedor: vendedor,
              parceiro_nome: parceiro.nome || vendedor,
              responsavel_nome: parceiro.nome || vendedor,
              data_ultima_atualizacao: formatarDataBR(linha[10]),
              data_ativacao: formatarDataBR(linha[25]),
              data_radar: getSafe(linha, 37, ""),
              codigoCliente: getSafe(linha, 31, ""),
              cep: getSafe(linha, 11, ""),
              endereco: getSafe(linha, 12, ""),
              numero_endereco: getSafe(linha, 13, ""),
              complemento: getSafe(linha, 14, ""),
              bairro: getSafe(linha, 15, ""),
              cidade: getSafe(linha, 16, ""),
              uf: getSafe(linha, 17, ""),
              cpf_admin: getSafe(linha, 18, ""),
              nome_admin: getSafe(linha, 19, ""),
              email: getSafe(linha, 20, ""),
              contato_financeiro: getSafe(linha, 21, ""),
              linhas_agrupadas: [{
                plano: getSafe(linha, 5, ""),
                numero: getSafe(linha, 6, ""),
                valor: valor,
                modalidade: modalidade,
                data: dataKey,
                operadora_doadora: getSafe(linha, 8, ""),
                operadora: getSafe(linha, 8, "")
              }]
            });
          }
        } catch (e) {
          console.error(`❌ Erro ao ler planilha do parceiro ${parceiro.nome}:`, e);
        }
      });

      // 4d. Agrupar todos os pedidos por CNPJ + DATA (sem modalidade)
      const pedidosAgrupados = new Map();
      todosPedidos.forEach(pedido => {
        const chave = `${pedido.cnpj || "SEM_DOC"}_${pedido.data_key || "SEM_DATA"}`;
        if (pedidosAgrupados.has(chave)) {
          const existente = pedidosAgrupados.get(chave);
          existente.linhas_agrupadas.push(...pedido.linhas_agrupadas);
          existente.valor += pedido.valor;
          if (pedido.status_etapa > existente.status_etapa) {
            existente.status_raw = pedido.status_raw;
            existente.status_etapa = pedido.status_etapa;
            existente.data_ultima_atualizacao = pedido.data_ultima_atualizacao;
          }
          if (pedido.status_etapa === 6 && pedido.data_ativacao) {
            existente.data_ativacao = pedido.data_ativacao;
          }
          if (!existente.vencimento && pedido.vencimento) existente.vencimento = pedido.vencimento;
          if (!existente.data_radar && pedido.data_radar) existente.data_radar = pedido.data_radar;
          if (!existente.bancoDeDadosId && pedido.bancoDeDadosId) {
            existente.bancoDeDadosId = pedido.bancoDeDadosId;
          }
          if (pedido.responsavel_nome && !existente.responsavel_nome.includes(pedido.responsavel_nome)) {
            existente.responsavel_nome += `, ${pedido.responsavel_nome}`;
          }
          if (!existente.ie && pedido.ie) existente.ie = pedido.ie;
          if (!existente.cep && pedido.cep) existente.cep = pedido.cep;
          if (!existente.endereco && pedido.endereco) existente.endereco = pedido.endereco;
          if (!existente.cidade && pedido.cidade) existente.cidade = pedido.cidade;
          if (!existente.uf && pedido.uf) existente.uf = pedido.uf;
          if (!existente.nome_admin && pedido.nome_admin) existente.nome_admin = pedido.nome_admin;
          if (!existente.email && pedido.email) existente.email = pedido.email;
          if (!existente.contato_financeiro && pedido.contato_financeiro) existente.contato_financeiro = pedido.contato_financeiro;
          if (!existente.codigoCliente && pedido.codigoCliente) existente.codigoCliente = pedido.codigoCliente;
        } else {
          const novoPedido = { ...pedido };
          novoPedido.id_unico = `${pedido.cnpj}|${pedido.data_key}`;
          novoPedido.linhas_agrupadas = [...pedido.linhas_agrupadas];
          novoPedido.modalidade = pedido.modalidade || 'PRIMEIRA ATIVAÇÃO';
          pedidosAgrupados.set(chave, novoPedido);
        }
      });

      let resultado = Array.from(pedidosAgrupados.values());

      resultado.sort((a, b) => {
        if (a.status_etapa !== b.status_etapa) return a.status_etapa - b.status_etapa;
        return String(b.data_criacao).localeCompare(String(a.data_criacao));
      });

      console.log(`✅ ${resultado.length} pedidos agrupados (CNPJ+DATA) para admin/backoffice`);

      if (resultado.length === 0) {
        return { success: true, pedidos: [], total: 0, message: "📭 Nenhum pedido encontrado." };
      }

      return { success: true, pedidos: resultado, total: resultado.length };
    }

    // ============================================
    // 5. CARGO NÃO RECONHECIDO → RETORNA VAZIO
    // ============================================
    console.warn(`⚠️ Cargo não reconhecido: ${cargoUsuario}`);
    return { success: true, pedidos: [], total: 0, message: "Cargo não autorizado para visualizar pedidos." };

  } catch (e) {
    console.error("❌ Erro em p_listarPedidosGestao:", e);
    return { success: false, message: e.toString(), pedidos: [] };
  }
}
function buscarLinhaPorIdUnico(id_unico, origem) {
  const ss = origem === "PARCEIRO" 
    ? SpreadsheetApp.openById("1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4")
    : SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("VENDAS");
  if (!sheet) return -1;
  
  const data = sheet.getDataRange().getValues();
  const [cnpjAlvo, dataKeyAlvo] = id_unico.split("|");
  
  for (let i = 1; i < data.length; i++) {
    const linha = data[i];
    let cnpjLinha = String(linha[2] || "").replace(/\D/g, '');
    let dataLinha = "";
    if (linha[1] instanceof Date) {
      dataLinha = Utilities.formatDate(linha[1], "GMT-3", "dd/MM/yyyy");
    } else {
      const partes = String(linha[1] || "").match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (partes) dataLinha = `${partes[1]}/${partes[2]}/${partes[3]}`;
    }
    if (cnpjLinha === cnpjAlvo && dataLinha === dataKeyAlvo) {
      return i + 1; // linha real (1-indexed)
    }
  }
  return -1;
}
function p_detalhesPedidoGestao(linha, origem, cnpjParam, dataKeyParam, bancoDeDadosId, modalidade) {
  try {
    console.log(`🔍 Buscando detalhes - linha: ${linha}, origem: ${origem}, cnpj: ${cnpjParam}, data: ${dataKeyParam}`);
    console.log(`🏦 bancoDeDadosId recebido: ${bancoDeDadosId || 'NULL'}`);
    console.log(`⚠️ Parâmetro modalidade ignorado (retornando todas as linhas do pedido)`);

    // ============================================
    // 1. SELECIONAR A PLANILHA CORRETA
    // ============================================
    const PLANILHA_CENTRAL_PARCEIROS = "1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4";
    const PLANILHA_PROPRIO = "1ULyXmZjrHlTXJ7cl0jlL_ugriHzZ4W8Q-6ExvkPm6qg";
    let ss;

    if (bancoDeDadosId && bancoDeDadosId.trim() !== "" && bancoDeDadosId !== "null" && bancoDeDadosId !== "undefined") {
      try {
        ss = SpreadsheetApp.openById(bancoDeDadosId);
        console.log(`✅ Planilha INDIVIDUAL do parceiro aberta para detalhes: ${ss.getId()}`);
      } catch (e) {
        console.error(`❌ Falha ao abrir planilha ${bancoDeDadosId}: ${e.message}`);
        ss = SpreadsheetApp.openById(PLANILHA_CENTRAL_PARCEIROS);
        console.log(`⚠️ Usando planilha central como fallback: ${ss.getId()}`);
      }
    } else if (origem === "PARCEIRO") {
      ss = SpreadsheetApp.openById(PLANILHA_CENTRAL_PARCEIROS);
      console.log(`📂 Usando planilha central de parceiros para detalhes: ${ss.getId()}`);
    } else {
      ss = SpreadsheetApp.openById(PLANILHA_PROPRIO);
      console.log(`📂 Usando planilha própria para detalhes: ${ss.getId()}`);
    }

    const sheet = ss.getSheetByName("VENDAS");
    if (!sheet) {
      return { success: false, message: `Aba VENDAS não encontrada na planilha ${ss.getId()}` };
    }

    let data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return { success: false, message: "Nenhum dado na planilha" };
    }

    // ============================================
    // 2. FUNÇÃO AUXILIAR PARA NORMALIZAR DATA
    // ============================================
    function normalizarDataParaComparacao(data) {
      if (!data) return "";
      if (data instanceof Date) {
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        return `${dia}/${mes}/${ano}`;
      }
      if (typeof data === 'string') {
        data = data.trim();
        let match = data.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (match) {
          return `${match[1].padStart(2, '0')}/${match[2].padStart(2, '0')}/${match[3]}`;
        }
        match = data.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (match) {
          return `${match[3].padStart(2, '0')}/${match[2].padStart(2, '0')}/${match[1]}`;
        }
        const d = new Date(data);
        if (!isNaN(d.getTime())) {
          const dia = String(d.getDate()).padStart(2, '0');
          const mes = String(d.getMonth() + 1).padStart(2, '0');
          const ano = d.getFullYear();
          return `${dia}/${mes}/${ano}`;
        }
      }
      return String(data);
    }

    // ============================================
    // 3. LOCALIZAR TODAS AS LINHAS DO PEDIDO (SEM FILTRO DE MODALIDADE)
    // ============================================
    let linhasDoGrupo = [];

    if (cnpjParam && dataKeyParam) {
      const cnpjBusca = String(cnpjParam).replace(/\D/g, '');
      const dataBusca = normalizarDataParaComparacao(dataKeyParam);

      console.log(`🔎 Buscando por CNPJ: ${cnpjBusca}, Data: ${dataBusca} (todas as modalidades)`);

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        let cnpjLinha = String(row[2] || "").replace(/\D/g, '');
        let dataLinha = normalizarDataParaComparacao(row[1]);

        if (cnpjLinha === cnpjBusca && dataLinha === dataBusca) {
          linhasDoGrupo.push({ linha: i + 1, dados: row });
        }
      }

      if (linhasDoGrupo.length === 0) {
        console.log(`⚠️ Nenhuma linha encontrada com a data exata. Buscando apenas por CNPJ...`);
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          let cnpjLinha = String(row[2] || "").replace(/\D/g, '');
          if (cnpjLinha === cnpjBusca) {
            linhasDoGrupo.push({ linha: i + 1, dados: row });
          }
        }
      }

      if (linhasDoGrupo.length === 0) {
        return { success: false, message: `Nenhuma linha encontrada para CNPJ: ${cnpjBusca} e Data: ${dataBusca}. Tente recarregar a lista.` };
      }

      console.log(`✅ Encontradas ${linhasDoGrupo.length} linhas para o grupo (todas as modalidades)`);
    } else {
      // Fallback: usar a linha informada
      let rowIndex = linha - 1;
      if (rowIndex >= 1 && rowIndex < data.length) {
        linhasDoGrupo.push({ linha: linha, dados: data[rowIndex] });
      } else {
        return { success: false, message: `Linha ${linha} não encontrada. Tente atualizar a lista.` };
      }
    }

    // ============================================
    // 4. CONSOLIDAR OS DADOS DO GRUPO
    // ============================================
    let pedidoConsolidado = null;
    let todasLinhas = [];
    let valorTotal = 0;

    const indiceDataRadar = (origem === "PARCEIRO") ? 37 : 36;
    const indiceNomeParceiro = 35;

    for (let item of linhasDoGrupo) {
      const row = item.dados;
      const linhaAtual = item.linha;

      let valor = 0;
      if (typeof row[7] === 'number') {
        valor = row[7];
      } else if (row[7]) {
        valor = parseFloat(String(row[7]).replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
      }
      valorTotal += valor;

      if (!pedidoConsolidado) {
        let etapa = 0;
        const statusRaw = String(row[24] || "PENDENTE DE INPUT").trim();
        let statusNormalizado = statusRaw;
        if (statusRaw === "INPUT REALIZADO") {
          statusNormalizado = "1. INPUT REALIZADO";
        }
        if (statusNormalizado.includes("1.")) etapa = 1;
        else if (statusNormalizado.includes("2.")) etapa = 2;
        else if (statusNormalizado.includes("3.")) etapa = 3;
        else if (statusNormalizado.includes("4.")) etapa = 4;
        else if (statusNormalizado.includes("5.")) etapa = 5;
        else if (statusNormalizado.includes("6.")) etapa = 6;

        const nomeParceiro = (origem === "PARCEIRO" && row[indiceNomeParceiro]) 
          ? String(row[indiceNomeParceiro]).toUpperCase().trim() 
          : "";
        const consultorVendeu = row[9] ? String(row[9]).toUpperCase().trim() : "";

        const cnpjLimpo = row[2] ? String(row[2]).replace(/\D/g, '') : "";
        let dataKey = "";
        if (row[1] instanceof Date) {
          dataKey = Utilities.formatDate(row[1], "GMT-3", "dd/MM/yyyy");
        } else {
          const dataStr = String(row[1] || "");
          const partes = dataStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
          if (partes) {
            dataKey = `${partes[1]}/${partes[2]}/${partes[3]}`;
          } else {
            dataKey = dataStr.split(' ')[0];
          }
        }

        // 🔥 id_unico sem modalidade (apenas CNPJ|data)
        const id_unico = `${cnpjLimpo}|${dataKey}`;

        const dataRadarRaw = row[indiceDataRadar];
        let dataRadar = "";
        if (dataRadarRaw) {
          if (dataRadarRaw instanceof Date) {
            dataRadar = Utilities.formatDate(dataRadarRaw, "GMT-3", "dd/MM/yyyy");
          } else {
            dataRadar = String(dataRadarRaw);
          }
        }

        // 🔥 ADICIONADO: Código do Cliente (coluna AF, índice 31)
        const codigoCliente = row[31] || "";

        // 🔥 ADICIONADO: Vencimento (coluna A, índice 0)
        const vencimento = row[0] || "";

        pedidoConsolidado = {
          id: `${origem === "PARCEIRO" ? "PAR" : "PROP"}-${String(linhaAtual).padStart(5, '0')}`,
          origem: origem,
          id_unico: id_unico,  // sem modalidade
          cnpj: cnpjLimpo,
          data_criacao: formatarDataBR(row[1]),
          cliente: row[3] || "Não informado",
          ie: row[34] || "",
          status_raw: statusNormalizado,
          status_etapa: etapa,
          data_ultima_atualizacao: formatarDataBR(row[10]),
          data_ativacao: formatarDataBR(row[25]),
          data_radar: dataRadar,
          codigoCliente: codigoCliente,
          vencimento: vencimento,   // 🔥 NOVO CAMPO
          cep: row[11] || "",
          endereco: row[12] || "",
          numero_endereco: row[13] || "",
          cidade: row[16] || "",
          uf: row[17] || "",
          nome_admin: row[19] || "",
          email: row[20] || "",
          contato_financeiro: row[21] || "",
          vendedor: consultorVendeu,
          parceiro_nome: nomeParceiro || consultorVendeu,
          responsavel_nome: nomeParceiro || consultorVendeu,
          valor: 0,
          linhas_agrupadas: []
        };
      }

      // Adiciona a linha atual com operadora_doadora e também operadora (alias)
      todasLinhas.push({
        plano: row[5] || "",
        numero: row[6] || "",
        valor: valor,
        modalidade: row[4] || "",
        data: formatarDataBR(row[1]),
        operadora_doadora: row[8] || "",   // Coluna I (nome original)
        operadora: row[8] || ""            // 🔥 ALIAS para facilitar o frontend
      });
    }

    if (pedidoConsolidado) {
      pedidoConsolidado.valor = valorTotal;
      pedidoConsolidado.linhas_agrupadas = todasLinhas;
      console.log(`✅ Pedido consolidado com ${todasLinhas.length} linha(s) (todas as modalidades)`);
      return { success: true, pedido: pedidoConsolidado };
    } else {
      return { success: false, message: "Não foi possível consolidar os dados do pedido." };
    }

  } catch (e) {
    console.error("❌ Erro em p_detalhesPedidoGestao:", e);
    return { success: false, message: e.toString() };
  }
}
function salvarCodigoClienteBackend(idUnico, origem, codigo, bancoDeDadosId) {
  try {
    console.log(`💾 Salvando código do cliente: ${codigo} para idUnico: ${idUnico}`);
    
    const PLANILHA_CENTRAL_PARCEIROS = "1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4";
    const PLANILHA_PROPRIO = "1ULyXmZjrHlTXJ7cl0jlL_ugriHzZ4W8Q-6ExvkPm6qg";
    let ss;

    if (bancoDeDadosId && bancoDeDadosId.trim() !== "" && bancoDeDadosId !== "null") {
      try {
        ss = SpreadsheetApp.openById(bancoDeDadosId);
      } catch (e) {
        ss = SpreadsheetApp.openById(PLANILHA_CENTRAL_PARCEIROS);
      }
    } else if (origem === "PARCEIRO") {
      ss = SpreadsheetApp.openById(PLANILHA_CENTRAL_PARCEIROS);
    } else {
      ss = SpreadsheetApp.openById(PLANILHA_PROPRIO);
    }

    const sheet = ss.getSheetByName("VENDAS");
    if (!sheet) return { success: false, message: "Aba VENDAS não encontrada." };

    // Extrair CNPJ e data do idUnico
    const [cnpjAlvo, dataAlvoStr] = idUnico.split("|");
    const cnpjLimpo = cnpjAlvo.replace(/\D/g, '');
    const dataAlvoNormalizada = normalizarDataParaComparacao(dataAlvoStr);

    const data = sheet.getDataRange().getValues();
    let linhasAtualizadas = 0;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      let cnpjLinha = String(row[2] || "").replace(/\D/g, '');
      let dataLinha = normalizarDataParaComparacao(row[1]);

      if (cnpjLinha === cnpjLimpo && dataLinha === dataAlvoNormalizada) {
        const linha = i + 1;
        // Atualiza coluna AF (índice 31)
        sheet.getRange(linha, 32).setValue(codigo);
        linhasAtualizadas++;
      }
    }

    // Se não encontrou pela data exata, tenta só pelo CNPJ (fallback)
    if (linhasAtualizadas === 0) {
      for (let i = 1; i < data.length; i++) {
        let cnpjLinha = String(data[i][2] || "").replace(/\D/g, '');
        if (cnpjLinha === cnpjLimpo) {
          sheet.getRange(i + 1, 32).setValue(codigo);
          linhasAtualizadas++;
        }
      }
    }

    // Atualizar também na aba CLIENTES (coluna W)
    try {
      const sheetClientes = ss.getSheetByName("CLIENTES");
      if (sheetClientes) {
        const dadosClientes = sheetClientes.getDataRange().getValues();
        for (let i = 1; i < dadosClientes.length; i++) {
          let cnpjCli = String(dadosClientes[i][2] || "").replace(/\D/g, '');
          if (cnpjCli === cnpjLimpo) {
            sheetClientes.getRange(i + 1, 23).setValue(codigo); // Coluna W
            break;
          }
        }
      }
    } catch (e) {
      console.warn("Não foi possível atualizar a aba CLIENTES:", e.message);
    }

    SpreadsheetApp.flush();
    return { success: true, message: `${linhasAtualizadas} linha(s) atualizada(s).` };

  } catch (e) {
    console.error("Erro ao salvar código do cliente:", e);
    return { success: false, message: e.toString() };
  }
}
function atualizarStatusInputBackofficePorId(id_unico, origem, nomeBackoffice, dados, requestToken, linhaFornecida = null) {
  try {
    console.log("🚀 [INPUT] Iniciando atualização...");
    console.log("📌 id_unico:", id_unico);
    console.log("📌 dados recebidos (completo):", JSON.stringify(dados));

    const cache = CacheService.getScriptCache();
    const processedKey = 'input_processed_' + requestToken;
    if (cache.get(processedKey)) {
      return { success: false, message: "Token duplicado." };
    }

    // ============================================
    // 1. EXTRAIR CNPJ, DATA E MODALIDADE
    // ============================================
    let cnpjAlvo = "", dataAlvo = "", modalidadeAlvo = "";
    if (id_unico && id_unico.includes("|")) {
      const partes = id_unico.split("|");
      cnpjAlvo = partes[0] ? partes[0].replace(/\D/g, '') : "";
      dataAlvo = normalizarDataParaComparacao(partes[1] || "");
      if (partes.length >= 3 && partes[2]) {
        modalidadeAlvo = partes[2].trim().toUpperCase();
      }
    }
    if (!modalidadeAlvo && dados.modalidade) {
      modalidadeAlvo = dados.modalidade.trim().toUpperCase();
    }
    if (!modalidadeAlvo) {
      return { success: false, message: "Modalidade não especificada." };
    }

    console.log(`🔍 CNPJ: "${cnpjAlvo}", DATA: "${dataAlvo}", MODALIDADE: "${modalidadeAlvo}"`);

    // ============================================
    // 2. SELECIONAR A PLANILHA
    // ============================================
    const PLANILHA_CENTRAL_PARCEIROS = "1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4";
    const PLANILHA_PROPRIO = "1ULyXmZjrHlTXJ7cl0jlL_ugriHzZ4W8Q-6ExvkPm6qg";
    let ss, bancoIdUsado = null;
    let bancoId = dados?.bancoDeDadosId || null;

    if (bancoId && bancoId.trim() !== "" && bancoId !== "null" && bancoId !== "undefined") {
      try {
        const testSS = SpreadsheetApp.openById(bancoId);
        if (testSS.getSheetByName("VENDAS")) {
          ss = testSS;
          bancoIdUsado = bancoId;
        } else {
          ss = SpreadsheetApp.openById(PLANILHA_CENTRAL_PARCEIROS);
          bancoIdUsado = PLANILHA_CENTRAL_PARCEIROS;
        }
      } catch (e) {
        ss = SpreadsheetApp.openById(PLANILHA_CENTRAL_PARCEIROS);
        bancoIdUsado = PLANILHA_CENTRAL_PARCEIROS;
      }
    } else if (origem === "PARCEIRO") {
      ss = SpreadsheetApp.openById(PLANILHA_CENTRAL_PARCEIROS);
      bancoIdUsado = PLANILHA_CENTRAL_PARCEIROS;
    } else {
      ss = SpreadsheetApp.openById(PLANILHA_PROPRIO);
      bancoIdUsado = PLANILHA_PROPRIO;
    }

    const sheet = ss.getSheetByName("VENDAS");
    if (!sheet) return { success: false, message: "Aba VENDAS não encontrada." };

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: false, message: "Planilha vazia." };

    // ============================================
    // 3. LOCALIZAR LINHAS DA MODALIDADE
    // ============================================
    let linhasParaAtualizar = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      let cnpjLinha = String(row[2] || "").replace(/\D/g, '');
      let dataLinha = extrairDataLinha(row);
      let modalidadeLinha = String(row[4] || "").trim().toUpperCase();
      if (cnpjLinha === cnpjAlvo && dataLinha === dataAlvo && modalidadeLinha === modalidadeAlvo) {
        linhasParaAtualizar.push(i + 1);
      }
    }

    if (linhasParaAtualizar.length === 0) {
      return {
        success: false,
        message: `Nenhuma linha encontrada para CNPJ=${cnpjAlvo}, DATA=${dataAlvo}, MODALIDADE=${modalidadeAlvo}.`
      };
    }

    console.log(`📌 Encontradas ${linhasParaAtualizar.length} linha(s) para a modalidade ${modalidadeAlvo}`);

    // ============================================
    // 4. ATUALIZAR LINHAS (PRESERVANDO OS DADOS EXISTENTES)
    // ============================================
    const agora = new Date();
    const timestamp = Utilities.formatDate(agora, "GMT-3", "dd/MM/yyyy HH:mm:ss");
    const consultorInput = dados.consultorInput || nomeBackoffice || "Backoffice";
    const nomeUsuarioLogado = dados.nomeUsuarioLogado || nomeBackoffice || "Sistema";

    let linhasAtualizadas = 0;

    for (let linha of linhasParaAtualizar) {
      console.log(`\n🔄 === ATUALIZANDO LINHA ${linha} ===`);

      // Lê a linha atual para preservar dados não enviados
      const linhaAtual = sheet.getRange(linha, 1, 1, 38).getValues()[0];
      let novaLinha = linhaAtual.slice(); // cópia

      // ============================================
      // MAPEAMENTO DE COLUNAS (0-based)
      // ============================================
      // A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9, K=10,
      // L=11, M=12, N=13, O=14, P=15, Q=16, R=17, S=18, T=19, U=20, V=21,
      // W=22, X=23, Y=24, Z=25, AA=26, AB=27, AC=28, AD=29, AE=30,
      // AF=31, AG=32, AH=33, AI=34, AJ=35, AK=36, AL=37

      // ------------------------------------------------------------------
      // 1. CAMPOS QUE SEMPRE DEVEM SER ATUALIZADOS (se vierem preenchidos)
      // ------------------------------------------------------------------
      if (dados.vencimento && dados.vencimento.trim() !== "") {
        novaLinha[0] = dados.vencimento;
        console.log(`  Coluna A (vencimento) → "${dados.vencimento}"`);
      }
      if (dados.radar && dados.radar.trim() !== "") {
        novaLinha[22] = dados.radar;
        console.log(`  Coluna W (radar) → "${dados.radar}"`);
      }
      if (dados.p2b && dados.p2b.trim() !== "") {
        novaLinha[23] = dados.p2b;
        console.log(`  Coluna X (p2b) → "${dados.p2b}"`);
      }
      if (dados.ie && dados.ie.trim() !== "") {
        novaLinha[34] = dados.ie;
        console.log(`  Coluna AI (ie) → "${dados.ie}"`);
      }

      // ------------------------------------------------------------------
      // 2. ENDEREÇO E CONTATOS (L a V) – SÓ ATUALIZAMOS SE VIER PREENCHIDO
      //    CASO CONTRÁRIO, MANTÉM O QUE JÁ ESTAVA NA LINHA
      // ------------------------------------------------------------------
      if (dados.cep && dados.cep.trim() !== "") {
        novaLinha[11] = dados.cep; // L
        console.log(`  Coluna L (CEP) → "${dados.cep}"`);
      } else {
        console.log(`  Coluna L (CEP) → mantido: "${novaLinha[11]}"`);
      }

      if (dados.endereco && dados.endereco.trim() !== "") {
        novaLinha[12] = dados.endereco; // M
        console.log(`  Coluna M (Endereço) → "${dados.endereco}"`);
      } else {
        console.log(`  Coluna M (Endereço) → mantido: "${novaLinha[12]}"`);
      }

      if (dados.numero && dados.numero.trim() !== "") {
        novaLinha[13] = dados.numero; // N
        console.log(`  Coluna N (Nº) → "${dados.numero}"`);
      } else {
        console.log(`  Coluna N (Nº) → mantido: "${novaLinha[13]}"`);
      }

      if (dados.complemento && dados.complemento.trim() !== "") {
        novaLinha[14] = dados.complemento; // O
        console.log(`  Coluna O (Complemento) → "${dados.complemento}"`);
      } else {
        console.log(`  Coluna O (Complemento) → mantido: "${novaLinha[14]}"`);
      }

      if (dados.bairro && dados.bairro.trim() !== "") {
        novaLinha[15] = dados.bairro; // P
        console.log(`  Coluna P (Bairro) → "${dados.bairro}"`);
      } else {
        console.log(`  Coluna P (Bairro) → mantido: "${novaLinha[15]}"`);
      }

      if (dados.cidade && dados.cidade.trim() !== "") {
        novaLinha[16] = dados.cidade; // Q
        console.log(`  Coluna Q (Cidade) → "${dados.cidade}"`);
      } else {
        console.log(`  Coluna Q (Cidade) → mantido: "${novaLinha[16]}"`);
      }

      if (dados.uf && dados.uf.trim() !== "") {
        novaLinha[17] = dados.uf; // R
        console.log(`  Coluna R (UF) → "${dados.uf}"`);
      } else {
        console.log(`  Coluna R (UF) → mantido: "${novaLinha[17]}"`);
      }

      if (dados.cpfAdmin && dados.cpfAdmin.trim() !== "") {
        novaLinha[18] = dados.cpfAdmin; // S
        console.log(`  Coluna S (CPF Admin) → "${dados.cpfAdmin}"`);
      } else {
        console.log(`  Coluna S (CPF Admin) → mantido: "${novaLinha[18]}"`);
      }

      if (dados.nomeAdmin && dados.nomeAdmin.trim() !== "") {
        novaLinha[19] = dados.nomeAdmin; // T
        console.log(`  Coluna T (Nome Admin) → "${dados.nomeAdmin}"`);
      } else {
        console.log(`  Coluna T (Nome Admin) → mantido: "${novaLinha[19]}"`);
      }

      if (dados.email && dados.email.trim() !== "") {
        novaLinha[20] = dados.email; // U
        console.log(`  Coluna U (Email) → "${dados.email}"`);
      } else {
        console.log(`  Coluna U (Email) → mantido: "${novaLinha[20]}"`);
      }

      if (dados.contatoFin && dados.contatoFin.trim() !== "") {
        novaLinha[21] = dados.contatoFin; // V
        console.log(`  Coluna V (Contato Fin) → "${dados.contatoFin}"`);
      } else {
        console.log(`  Coluna V (Contato Fin) → mantido: "${novaLinha[21]}"`);
      }

      // Códigos (AF, AG)
      if (dados.codigoCliente && dados.codigoCliente.trim() !== "") {
        novaLinha[31] = dados.codigoCliente;
        console.log(`  Coluna AF (Cód. Cliente) → "${dados.codigoCliente}"`);
      }
      if (dados.codigoAdmin && dados.codigoAdmin.trim() !== "") {
        novaLinha[32] = dados.codigoAdmin;
        console.log(`  Coluna AG (Cód. Admin) → "${dados.codigoAdmin}"`);
      }

      // ------------------------------------------------------------------
      // 3. DADOS DAS LINHAS (F a I) – SEMPRE ATUALIZADOS
      // ------------------------------------------------------------------
      if (dados.linhas && Array.isArray(dados.linhas)) {
        const idx = linhasParaAtualizar.indexOf(linha);
        const linhaData = (idx >= 0 && idx < dados.linhas.length) ? dados.linhas[idx] : {};

        novaLinha[5] = linhaData.plano || ''; // F
        console.log(`  Coluna F (Plano) → "${linhaData.plano || ''}"`);
        novaLinha[6] = linhaData.numero || ''; // G
        console.log(`  Coluna G (Número) → "${linhaData.numero || ''}"`);
        const valorRaw = linhaData.valor || '';
        const valorNumerico = parseFloat(String(valorRaw).replace(/[^\d.,-]/g, '').replace(',', '.'));
        novaLinha[7] = isNaN(valorNumerico) ? 0 : valorNumerico; // H
        console.log(`  Coluna H (Valor) → "${novaLinha[7]}"`);
        const operadora = linhaData.operadora || linhaData.operadora_doadora || linhaData.operadoraDoadora || '';
        novaLinha[8] = operadora; // I
        console.log(`  Coluna I (Operadora) → "${operadora}"`);
      }

      // ------------------------------------------------------------------
      // 4. CONSULTOR INPUT (K) E NOTA
      // ------------------------------------------------------------------
      novaLinha[10] = consultorInput; // K
      console.log(`  Coluna K (Consultor Input) → "${consultorInput}"`);

      // ------------------------------------------------------------------
      // 5. STATUS (Y)
      // ------------------------------------------------------------------
      novaLinha[24] = "1. INPUT REALIZADO"; // Y
      console.log(`  Coluna Y (Status) → "1. INPUT REALIZADO"`);

      // Grava a linha inteira de uma vez
      sheet.getRange(linha, 1, 1, 38).setValues([novaLinha]);

      // Adiciona nota na coluna K (comentário)
      const rangeK = sheet.getRange(linha, 11);
      const notaAtual = rangeK.getNote();
      const novaNota = `✅ Input realizado por: ${nomeUsuarioLogado}\n📅 Data/Hora: ${timestamp}\n${notaAtual || ''}`;
      rangeK.setNote(novaNota);

      linhasAtualizadas++;
    }

    SpreadsheetApp.flush();
    cache.put(processedKey, "true", 300);

    console.log(`✅ ${linhasAtualizadas} linha(s) atualizada(s).`);
    return {
      success: true,
      message: `${linhasAtualizadas} linha(s) da modalidade ${modalidadeAlvo} atualizada(s) com sucesso.`,
      linhasAtualizadas: linhasAtualizadas,
      modalidade: modalidadeAlvo
    };

  } catch (e) {
    console.error("❌ Erro:", e);
    return { success: false, message: e.toString() };
  }
}
/**
 * Função auxiliar para normalizar data para comparação (dd/MM/yyyy)
 */
function normalizarDataParaComparacao(dataStr) {
  if (!dataStr) return "";
  if (dataStr instanceof Date) {
    return Utilities.formatDate(dataStr, "GMT-3", "dd/MM/yyyy");
  }
  let str = String(dataStr).trim().split(' ')[0]; // remove hora
  let match = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) return `${match[1]}/${match[2]}/${match[3]}`;
  match = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  const d = new Date(str);
  if (!isNaN(d.getTime())) return Utilities.formatDate(d, "GMT-3", "dd/MM/yyyy");
  return str;
}

/**
 * Função auxiliar para extrair data da linha
 */
function extrairDataLinha(linha) {
  if (!linha || linha.length < 2) return "";
  const val = linha[1];
  if (val instanceof Date) {
    return Utilities.formatDate(val, "GMT-3", "dd/MM/yyyy");
  } else if (typeof val === 'string') {
    const match = val.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (match) return `${match[1]}/${match[2]}/${match[3]}`;
    const d = new Date(val);
    if (!isNaN(d.getTime())) return Utilities.formatDate(d, "GMT-3", "dd/MM/yyyy");
  } else if (typeof val === 'number') {
    const d = new Date((val - 25569) * 86400 * 1000);
    if (!isNaN(d.getTime())) return Utilities.formatDate(d, "GMT-3", "dd/MM/yyyy");
  }
  return "";
}


/**
 * ATUALIZA STATUS DO PEDIDO (GESTÃO UNIFICADA)
 */
function p_atualizarStatusPedidoGestao(linha, origem, novoStatus, dataAtivacao, dataBoc, nomeUsuario, idUnico, bancoDeDadosId, modalidade) {
  try {
    console.log(`🔄 [INÍCIO] linha=${linha}, origem=${origem}, status=${novoStatus}`);
    console.log(`🔄 [INÍCIO] idUnico=${idUnico}, modalidade=${modalidade || 'NÃO FORNECIDA'}, bancoDeDadosId=${bancoDeDadosId || 'NÃO FORNECIDO'}`);
    console.log(`🔄 [INÍCIO] nomeUsuario=${nomeUsuario}`);

    // ============================================
    // 1. SELECIONAR A PLANILHA CORRETA
    // ============================================
    const PLANILHA_CENTRAL_PARCEIROS = "1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4";
    const PLANILHA_PROPRIO = "1ULyXmZjrHlTXJ7cl0jlL_ugriHzZ4W8Q-6ExvkPm6qg";
    let ss;
    let planilhaIdentificada = "desconhecida";
    let bancoIdUtilizado = null;

    // 🔥 REGRA 1: Se tem bancoDeDadosId, USA ELE (prioridade máxima)
    if (bancoDeDadosId && bancoDeDadosId.trim() !== "" && bancoDeDadosId !== "null" && bancoDeDadosId !== "undefined") {
      try {
        const testSS = SpreadsheetApp.openById(bancoDeDadosId);
        const testSheet = testSS.getSheetByName("VENDAS");
        if (testSheet) {
          ss = testSS;
          bancoIdUtilizado = bancoDeDadosId;
          planilhaIdentificada = `individual (${bancoDeDadosId})`;
          console.log(`✅ Planilha INDIVIDUAL do parceiro aberta com sucesso: ${ss.getId()}`);
          console.log(`📊 Aba VENDAS encontrada, total de linhas: ${testSheet.getLastRow()}`);
        } else {
          console.warn(`⚠️ Planilha ${bancoDeDadosId} não tem aba VENDAS, usando central como fallback`);
          ss = SpreadsheetApp.openById(PLANILHA_CENTRAL_PARCEIROS);
          bancoIdUtilizado = PLANILHA_CENTRAL_PARCEIROS;
          planilhaIdentificada = "central (fallback - sem aba VENDAS)";
        }
      } catch (e) {
        console.error(`❌ ERRO ao abrir planilha ${bancoDeDadosId}: ${e.message}`);
        try {
          ss = SpreadsheetApp.openById(PLANILHA_CENTRAL_PARCEIROS);
          bancoIdUtilizado = PLANILHA_CENTRAL_PARCEIROS;
          planilhaIdentificada = "central (fallback após erro)";
          console.warn(`⚠️ Usando planilha central como fallback: ${ss.getId()}`);
        } catch (e2) {
          return {
            success: false,
            message: `❌ Erro crítico: Não foi possível acessar a planilha do parceiro (${bancoDeDadosId}) nem a central. Erro: ${e2.message}`
          };
        }
      }
    } 
    else if (origem === "PARCEIRO") {
      ss = SpreadsheetApp.openById(PLANILHA_CENTRAL_PARCEIROS);
      bancoIdUtilizado = PLANILHA_CENTRAL_PARCEIROS;
      planilhaIdentificada = "central (parceiro)";
      console.log(`📂 Usando planilha central de parceiros: ${ss.getId()}`);
    } 
    else {
      ss = SpreadsheetApp.openById(PLANILHA_PROPRIO);
      bancoIdUtilizado = PLANILHA_PROPRIO;
      planilhaIdentificada = "propria";
      console.log(`📂 Usando planilha própria: ${ss.getId()}`);
    }

    // ============================================
    // 2. VALIDAR ABA VENDAS
    // ============================================
    const sheet = ss.getSheetByName("VENDAS");
    if (!sheet) {
      console.error(`❌ Aba VENDAS não encontrada na planilha ${ss.getId()}`);
      return { 
        success: false, 
        message: `❌ Aba VENDAS não encontrada na planilha ${planilhaIdentificada} (ID: ${ss.getId()}).` 
      };
    }

    const totalLinhas = sheet.getLastRow();
    console.log(`📊 Total de linhas na planilha: ${totalLinhas} (incluindo cabeçalho)`);

    if (totalLinhas <= 1) {
      console.warn(`⚠️ Planilha VENDAS está vazia (${ss.getId()})`);
      return {
        success: false,
        message: `❌ A planilha VENDAS está vazia. Nenhum pedido foi encontrado para este parceiro.\n\n` +
                 `🔍 Informações:\n` +
                 `• Planilha usada: ${planilhaIdentificada}\n` +
                 `• ID da planilha: ${ss.getId()}\n` +
                 `• Origem: ${origem}\n` +
                 `• bancoDeDadosId fornecido: ${bancoDeDadosId || "NÃO FORNECIDO"}\n` +
                 `• Linha fornecida: ${linha}\n\n` +
                 `💡 Verifique se as vendas estão sendo gravadas na planilha correta.`
      };
    }

    // ============================================
    // 3. FUNÇÕES AUXILIARES DE NORMALIZAÇÃO
    // ============================================
    function normalizarCnpj(cnpj) {
      return String(cnpj || "").replace(/\D/g, '');
    }

    function normalizarDataParaComparacao(data) {
      if (!data) return "";
      if (data instanceof Date) {
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        return `${dia}/${mes}/${ano}`;
      }
      if (typeof data === 'string') {
        data = data.trim();
        let match = data.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (match) {
          const dia = match[1].padStart(2, '0');
          const mes = match[2].padStart(2, '0');
          const ano = match[3];
          return `${dia}/${mes}/${ano}`;
        }
        match = data.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (match) {
          const dia = match[3].padStart(2, '0');
          const mes = match[2].padStart(2, '0');
          const ano = match[1];
          return `${dia}/${mes}/${ano}`;
        }
        const d = new Date(data);
        if (!isNaN(d.getTime())) {
          const dia = String(d.getDate()).padStart(2, '0');
          const mes = String(d.getMonth() + 1).padStart(2, '0');
          const ano = d.getFullYear();
          return `${dia}/${mes}/${ano}`;
        }
      }
      return String(data);
    }

    // ============================================
    // 4. EXTRAIR CNPJ, DATA E MODALIDADE DO ID_UNICO
    // ============================================
    let cnpjAlvo = "";
    let dataAlvo = "";
    let modalidadeAlvo = "";

    if (idUnico && idUnico.includes("|")) {
      const partes = idUnico.split("|");
      cnpjAlvo = normalizarCnpj(partes[0]);
      dataAlvo = normalizarDataParaComparacao(partes[1] || "");
      if (partes.length >= 3 && partes[2]) {
        modalidadeAlvo = partes[2].trim().toUpperCase();
      }
    }

    if (modalidade && modalidade.trim() !== "") {
      modalidadeAlvo = modalidade.trim().toUpperCase();
    }

    console.log(`🔍 CNPJ alvo: "${cnpjAlvo}"`);
    console.log(`🔍 Data alvo: "${dataAlvo}"`);
    console.log(`🔍 Modalidade alvo: "${modalidadeAlvo || 'TODAS'}"`);
    console.log(`📋 Planilha sendo usada: ${planilhaIdentificada} (ID: ${ss.getId()})`);

    // ============================================
    // 5. LOCALIZAR LINHAS
    // ============================================
    let linhasParaAtualizar = [];
    const dataPlanilha = sheet.getDataRange().getValues();

    if (cnpjAlvo && dataAlvo) {
      console.log(`🔄 [ESTRATÉGIA A] Buscando por CNPJ + DATA + MODALIDADE`);
      console.log(`📊 Total de linhas na planilha: ${dataPlanilha.length - 1} (excluindo cabeçalho)`);
      
      for (let i = 1; i < dataPlanilha.length; i++) {
        const row = dataPlanilha[i];
        const cnpjLinha = normalizarCnpj(row[2]);
        const dataLinha = normalizarDataParaComparacao(row[1]);
        const modalidadeLinha = String(row[4] || "").trim().toUpperCase();
        const status = String(row[24] || "").trim().toUpperCase();
        
        if (cnpjLinha === cnpjAlvo && dataLinha === dataAlvo) {
          if (modalidadeAlvo && modalidadeLinha !== modalidadeAlvo) {
            continue;
          }
          linhasParaAtualizar.push(i + 1);
          console.log(`   ✅ Linha ${i+1} ENCONTRADA (CNPJ+DATA+MODALIDADE) - status: ${status}`);
        }
      }
      console.log(`📌 ESTRATÉGIA A: Encontradas ${linhasParaAtualizar.length} linhas`);
    }

    if (linhasParaAtualizar.length === 0 && linha) {
      const linhaNum = parseInt(linha);
      if (!isNaN(linhaNum) && linhaNum > 0 && linhaNum <= totalLinhas) {
        const row = sheet.getRange(linhaNum, 1, 1, 25).getValues()[0];
        const cnpjLinha = normalizarCnpj(row[2]);
        const dataLinha = normalizarDataParaComparacao(row[1]);
        const modalidadeLinha = String(row[4] || "").trim().toUpperCase();
        const statusAtual = String(row[24] || "").trim().toUpperCase();
        
        console.log(`🔄 [ESTRATÉGIA B] Verificando linha ${linhaNum}:`);
        console.log(`   CNPJ="${cnpjLinha}", Data="${dataLinha}", Modalidade="${modalidadeLinha}", Status="${statusAtual}"`);
        
        if (modalidadeAlvo && modalidadeLinha !== modalidadeAlvo) {
          console.log(`⛔ Linha ${linhaNum} não pertence à modalidade ${modalidadeAlvo} (é ${modalidadeLinha}).`);
        } else {
          linhasParaAtualizar.push(linhaNum);
          console.log(`✅ ESTRATÉGIA B: Linha ${linhaNum} será utilizada (status: ${statusAtual})`);
        }
      }
    }

    if (linhasParaAtualizar.length === 0 && cnpjAlvo) {
      console.log(`🔄 [ESTRATÉGIA C] Buscando linhas por CNPJ: ${cnpjAlvo}`);
      for (let i = 1; i < dataPlanilha.length; i++) {
        const row = dataPlanilha[i];
        const cnpjLinha = normalizarCnpj(row[2]);
        const modalidadeLinha = String(row[4] || "").trim().toUpperCase();
        if (cnpjLinha === cnpjAlvo) {
          if (modalidadeAlvo && modalidadeLinha !== modalidadeAlvo) {
            continue;
          }
          linhasParaAtualizar.push(i + 1);
          console.log(`   ✅ Linha ${i+1} encontrada por CNPJ + MODALIDADE`);
        }
      }
    }

    if (linhasParaAtualizar.length === 0) {
      let msg = `❌ Nenhuma linha encontrada para este pedido.\n\n`;
      msg += `🔍 Informações procuradas:\n`;
      msg += `• CNPJ: ${cnpjAlvo || "(não fornecido)"}\n`;
      msg += `• Data: ${dataAlvo || "(não fornecida)"}\n`;
      msg += `• Modalidade: ${modalidadeAlvo || "(não fornecida)"}\n`;
      msg += `• Planilha usada: ${planilhaIdentificada}\n`;
      msg += `• ID da planilha: ${ss.getId()}\n`;
      msg += `• Origem: ${origem}\n`;
      msg += `• bancoDeDadosId fornecido: ${bancoDeDadosId || "NÃO FORNECIDO"}\n`;
      msg += `• Linha fornecida: ${linha}\n\n`;
      return { success: false, message: msg };
    }

    // ============================================
    // 6. VALIDAÇÃO DE DATA RADAR (para ativação)
    // ============================================
    if (novoStatus.includes("6. ATIVADO")) {
      const primeiraLinha = linhasParaAtualizar[0];
      const colunaRadar = (origem === "PARCEIRO") ? 37 : 36;
      const dataRadar = sheet.getRange(primeiraLinha, colunaRadar).getValue();
      if (!dataRadar || dataRadar.toString().trim() === "") {
        return {
          success: false,
          message: "⚠️ Para ativar o pedido, é obrigatório preencher a Data de Ativação RADAR no detalhe do pedido."
        };
      }
    }

    // ============================================
    // 7. ATUALIZAR AS LINHAS
    // ============================================
    const dataAtual = new Date();
    let atualizadas = 0;
    const linhasAtualizadasList = [];

    const STATUS_MAP = {
      "PENDENTE DE INPUT": 0,
      "1. INPUT REALIZADO": 1,
      "2. ANTIFRAUDE APROVADO": 2,
      "3. DOCS VALIDADOS BOC": 3,
      "4. NOTA FISCAL EMITIDA": 4,
      "5. CONFIRMAÇÃO LOGÍSTICA": 5,
      "6. ATIVADO": 6
    };

    let novoStatusNormalizado = novoStatus.trim().toUpperCase();
    if (novoStatusNormalizado === "INPUT REALIZADO") {
      novoStatusNormalizado = "1. INPUT REALIZADO";
    }
    const novoIndice = STATUS_MAP[novoStatusNormalizado];

    if (novoIndice === undefined) {
      return { success: false, message: `❌ Status inválido: ${novoStatus}` };
    }

    // 🔥 Buscar os dados da linha uma única vez para usar no processamento de faturas
    const linhaPrimeira = linhasParaAtualizar[0];
    const dadosLinha = sheet.getRange(linhaPrimeira, 1, 1, 38).getValues()[0];
    const modalidadeLinha = String(dadosLinha[4] || "").toUpperCase().trim();
    const dataZ = dadosLinha[25]; // Coluna Z
    const dataAK = dadosLinha[36]; // Coluna AK

    for (let idx = 0; idx < linhasParaAtualizar.length; idx++) {
      const linhaAtual = linhasParaAtualizar[idx];
      
      let statusAtual = String(sheet.getRange(linhaAtual, 25).getValue() || "").trim().toUpperCase();
      if (statusAtual === "INPUT REALIZADO") {
        statusAtual = "1. INPUT REALIZADO";
      }
      
      const indiceAtual = STATUS_MAP[statusAtual];

      if (indiceAtual === undefined) {
        console.warn(`⚠️ Status atual não reconhecido: "${statusAtual}" na linha ${linhaAtual}`);
        continue;
      }

      if (indiceAtual === 6 || statusAtual.includes("CANCELADO")) {
        console.log(`⛔ Linha ${linhaAtual} em status final (${statusAtual}), não pode ser alterada.`);
        continue;
      }

      const diff = novoIndice - indiceAtual;
      if (Math.abs(diff) !== 1) {
        console.log(`⛔ Transição inválida para linha ${linhaAtual}: de "${statusAtual}" (${indiceAtual}) para "${novoStatus}" (${novoIndice}). Apenas movimentos de ±1 são permitidos.`);
        continue;
      }

      sheet.getRange(linhaAtual, 25).setValue(novoStatus);
      sheet.getRange(linhaAtual, 11).setValue(dataAtual);

      if (novoStatus.includes("6. ATIVADO") && dataAtivacao) {
        sheet.getRange(linhaAtual, 26).setValue(dataAtivacao);
      }
      if (novoStatus.includes("3. DOCS VALIDADOS BOC") && dataBoc) {
        sheet.getRange(linhaAtual, 36).setValue(dataBoc);
      }

      atualizadas++;
      linhasAtualizadasList.push(linhaAtual);
      console.log(`✅ Linha ${linhaAtual} atualizada de "${statusAtual}" para "${novoStatus}"`);
    }

    SpreadsheetApp.flush();

    if (atualizadas === 0) {
      return { 
        success: false, 
        message: `Nenhuma linha foi atualizada. Verifique se a transição de status é válida (apenas ±1 etapa).` 
      };
    }

    // ============================================
    // 8. 🔥 PROCESSAR FATURAS (SE ATIVADO) - EM TEMPO REAL
    // ============================================
    if (novoStatus.includes("6. ATIVADO")) {
      try {
        // Determina a data final de ativação (prioridade: dataAtivacao > coluna Z > coluna AK)
        let dataFinal = dataAtivacao;
        if (!dataFinal || dataFinal.toString().trim() === "") {
          dataFinal = dataZ;
        }
        if (!dataFinal || dataFinal.toString().trim() === "") {
          dataFinal = dataAK;
        }

        console.log(`🔍 Data final para processar FATURAS: ${dataFinal}`);
        console.log(`🔍 Modalidade: ${modalidadeLinha}`);

        // 🔥 VALIDAÇÃO DA DATA - Se não for uma data válida, não processa
        let dataValida = false;
        let dataObj = null;
        
        if (dataFinal) {
          // Tenta converter para Date
          if (dataFinal instanceof Date) {
            dataObj = dataFinal;
            dataValida = !isNaN(dataObj.getTime());
          } else if (typeof dataFinal === 'string' || typeof dataFinal === 'number') {
            dataObj = new Date(dataFinal);
            dataValida = !isNaN(dataObj.getTime());
          }
        }

        // Se a data for inválida, tenta buscar da coluna Z novamente (última tentativa)
        if (!dataValida) {
          const valZ = sheet.getRange(linhaPrimeira, 26).getValue();
          if (valZ) {
            dataObj = new Date(valZ);
            dataValida = !isNaN(dataObj.getTime());
            if (dataValida) {
              dataFinal = dataObj;
              console.log(`📥 Data obtida da coluna Z (após validação): ${dataFinal}`);
            }
          }
        }

        if (modalidadeLinha === "RENEG") {
          removerClienteDaAbaFaturas(dadosLinha[2], dadosLinha[6]);
          Logger.log(`🗑️ RENEG detectada, removido da FATURAS.`);
        } 
        else if (dataValida && dataObj) {
          // Monta objeto com os dados da venda
          const venda = {
            codigoCliente: dadosLinha[31] || "",
            nomeCliente: dadosLinha[3] || "",
            nomeResponsavel: dadosLinha[19] || "",
            cpfCnpj: dadosLinha[2] || "",
            plano: dadosLinha[5] || "",
            linhaTel: dadosLinha[6] || "",
            contatoFinanceiro: dadosLinha[21] || "",
            email: dadosLinha[20] || "",
            dataVencBase: dadosLinha[0],
            dataPrimeiroCad: dadosLinha[1],
            dataAtivacao: dataObj, // Passa o objeto Date válido
            modalidade: modalidadeLinha,
            origem: origem === "PARCEIRO" ? "PARCEIRO" : "VEXO PRÓPRIO"
          };
          
          processarVendaIndividualParaFaturas(venda);
          Logger.log(`✅ FATURAS atualizada para linha ${linhaPrimeira} com data: ${dataObj}.`);
        } else {
          Logger.log(`⚠️ ATIVADO, mas data de ativação inválida: "${dataFinal}" - Nenhuma fatura criada.`);
        }
      } catch (e) {
        Logger.log(`❌ Erro ao processar faturas: ${e.message}`);
        console.error(e);
      }
    }

    // ============================================
    // 9. RETROCESSO (remover da FATURAS se voltar para etapas iniciais)
    // ============================================
    if (novoStatus.startsWith("1.") || novoStatus.startsWith("2.")) {
      try {
        removerClienteDaAbaFaturas(dadosLinha[2], dadosLinha[6]);
        Logger.log(`🗑️ Cliente removido da FATURAS (retrocesso para etapas iniciais).`);
      } catch (e) {
        Logger.log(`⚠️ Erro ao remover faturas: ${e.message}`);
      }
    }

    console.log(`✅ ${atualizadas} linha(s) atualizada(s) para ${novoStatus} na planilha ${ss.getId()}`);
    return { 
      success: true, 
      message: `✅ ${atualizadas} linha(s) atualizada(s) com sucesso na planilha ${planilhaIdentificada}! (Linhas: ${linhasAtualizadasList.join(', ')})`,
      planilha: ss.getId(),
      linhas: linhasAtualizadasList
    };

  } catch (e) {
    console.error("❌ Erro em p_atualizarStatusPedidoGestao:", e);
    return { 
      success: false, 
      message: `❌ Erro ao processar: ${e.toString()}`,
      stack: e.stack
    };
  }
}

function salvarDataRadarBackend(idUnico, origem, dataRadar, bancoDeDadosId) {
  try {
    console.log(`💾 Salvando data RADAR: ${dataRadar} para idUnico: ${idUnico}`);
    console.log(`🏦 bancoDeDadosId recebido: ${bancoDeDadosId || 'NULL'}`);
    console.log(`📌 Origem: ${origem}`);
    
    // 🔥 VALIDAÇÃO INICIAL DO idUnico
    if (!idUnico || !idUnico.includes("|")) {
      return { success: false, message: "ID único inválido ou mal formatado." };
    }
    
    // ============================================
    // 1. SELECIONAR A PLANILHA CORRETA
    // ============================================
    const PLANILHA_CENTRAL_PARCEIROS = "1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4";
    const PLANILHA_PROPRIO = "1ULyXmZjrHlTXJ7cl0jlL_ugriHzZ4W8Q-6ExvkPm6qg";
    let ss;
    let bancoIdUtilizado = null;

    // 🔥 PRIORIDADE 1: Usar bancoDeDadosId se fornecido
    if (bancoDeDadosId && bancoDeDadosId.trim() !== "" && bancoDeDadosId !== "null" && bancoDeDadosId !== "undefined") {
      try {
        ss = SpreadsheetApp.openById(bancoDeDadosId);
        bancoIdUtilizado = bancoDeDadosId;
        console.log(`✅ Planilha INDIVIDUAL do parceiro aberta: ${ss.getId()}`);
      } catch (e) {
        console.warn(`⚠️ Falha ao abrir planilha ${bancoDeDadosId}, usando central.`, e);
        ss = SpreadsheetApp.openById(PLANILHA_CENTRAL_PARCEIROS);
        bancoIdUtilizado = PLANILHA_CENTRAL_PARCEIROS;
      }
    } 
    // 🔥 PRIORIDADE 2: Se origem é PARCEIRO, usa central
    else if (origem === "PARCEIRO") {
      ss = SpreadsheetApp.openById(PLANILHA_CENTRAL_PARCEIROS);
      bancoIdUtilizado = PLANILHA_CENTRAL_PARCEIROS;
      console.log(`📂 Usando planilha central de parceiros: ${ss.getId()}`);
    } 
    // 🔥 PRIORIDADE 3: Padrão = planilha própria
    else {
      ss = SpreadsheetApp.openById(PLANILHA_PROPRIO);
      bancoIdUtilizado = PLANILHA_PROPRIO;
      console.log(`📂 Usando planilha própria: ${ss.getId()}`);
    }

    const sheet = ss.getSheetByName("VENDAS");
    if (!sheet) {
      return { success: false, message: "Aba VENDAS não encontrada na planilha." };
    }

    // ============================================
    // 2. FUNÇÕES AUXILIARES DE NORMALIZAÇÃO
    // ============================================
    function normalizarCnpj(cnpj) {
      return String(cnpj || "").replace(/\D/g, '');
    }

    function normalizarData(data) {
      if (!data) return "";
      // Se for Date, formata para dd/MM/yyyy
      if (data instanceof Date) {
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        return `${dia}/${mes}/${ano}`;
      }
      // Se for string, tenta converter
      if (typeof data === 'string') {
        data = data.trim();
        // Tenta dd/MM/yyyy
        let match = data.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (match) {
          return `${match[1].padStart(2, '0')}/${match[2].padStart(2, '0')}/${match[3]}`;
        }
        // Tenta dd-MM-yyyy
        match = data.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
        if (match) {
          return `${match[1].padStart(2, '0')}/${match[2].padStart(2, '0')}/${match[3]}`;
        }
        // Tenta yyyy-MM-dd
        match = data.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (match) {
          return `${match[3].padStart(2, '0')}/${match[2].padStart(2, '0')}/${match[1]}`;
        }
        // Tenta converter para Date
        const d = new Date(data);
        if (!isNaN(d.getTime())) {
          const dia = String(d.getDate()).padStart(2, '0');
          const mes = String(d.getMonth() + 1).padStart(2, '0');
          const ano = d.getFullYear();
          return `${dia}/${mes}/${ano}`;
        }
      }
      return String(data);
    }

    // ============================================
    // 3. EXTRAIR CNPJ E DATA DO ID_UNICO
    // ============================================
    const [cnpjAlvo, dataAlvoStr] = idUnico.split("|");
    const cnpjLimpo = normalizarCnpj(cnpjAlvo);
    const dataAlvoNormalizada = normalizarData(dataAlvoStr);

    console.log(`🔍 Buscando CNPJ: "${cnpjLimpo}", Data: "${dataAlvoNormalizada}"`);
    console.log(`📂 Planilha sendo usada: ${bancoIdUtilizado}`);

    // ============================================
    // 4. DEFINIR A COLUNA CORRETA - SEMPRE AK (índice 37)
    // 🔥 CORREÇÃO: Independente da origem, a Data de Ativação RADAR deve ser salva na coluna AK
    // ============================================
    const colunaDataRadar = 37; // AK - sempre a mesma coluna
    console.log(`📌 Coluna RADAR: ${colunaDataRadar} (AK - fixa)`);

    // ============================================
    // 5. BUSCAR E ATUALIZAR AS LINHAS
    // ============================================
    const dataValues = sheet.getDataRange().getValues();
    console.log(`📊 Total de linhas na planilha: ${dataValues.length - 1} (excluindo cabeçalho)`);

    let linhasAtualizadas = 0;
    let linhasEncontradas = [];

    for (let i = 1; i < dataValues.length; i++) {
      const row = dataValues[i];
      let cnpjLinha = normalizarCnpj(row[2]); // Coluna C
      let dataLinha = normalizarData(row[1]); // Coluna B

      // Log para depuração das primeiras linhas
      if (i <= 5) {
        console.log(`   Linha ${i+1}: CNPJ="${cnpjLinha}", Data="${dataLinha}"`);
      }

      if (cnpjLinha === cnpjLimpo && dataLinha === dataAlvoNormalizada) {
        const linha = i + 1;
        linhasEncontradas.push(linha);
        console.log(`✅ Linha ${linha} encontrada!`);
      }
    }

    console.log(`📌 Linhas encontradas: ${linhasEncontradas.length}`);

    if (linhasEncontradas.length === 0) {
      // Busca apenas por CNPJ como fallback
      console.log(`⚠️ Nenhuma linha com a data exata. Buscando apenas por CNPJ...`);
      for (let i = 1; i < dataValues.length; i++) {
        const row = dataValues[i];
        let cnpjLinha = normalizarCnpj(row[2]);
        if (cnpjLinha === cnpjLimpo) {
          linhasEncontradas.push(i + 1);
          console.log(`   ✅ Linha ${i+1} encontrada por CNPJ`);
        }
      }
    }

    if (linhasEncontradas.length === 0) {
      // Mostra amostra de CNPJs da planilha para debug
      let amostra = [];
      for (let i = 1; i < Math.min(dataValues.length, 10); i++) {
        const cnpj = normalizarCnpj(dataValues[i][2]);
        const dataLinha = normalizarData(dataValues[i][1]);
        if (cnpj) amostra.push(`CNPJ=${cnpj}, Data=${dataLinha}`);
      }
      console.log(`📋 Amostra de CNPJs na planilha:\n${amostra.join('\n')}`);
      
      return {
        success: false,
        message: `Nenhuma linha encontrada para CNPJ: ${cnpjLimpo} e Data: ${dataAlvoNormalizada}. Verifique se os dados estão corretos na planilha.`
      };
    }

    // ============================================
    // 6. ATUALIZAR AS LINHAS ENCONTRADAS
    // ============================================
    let atualizadas = 0;
    for (const linha of linhasEncontradas) {
      // Formata a data para dd/MM/yyyy
      let dataFormatada = "";
      if (dataRadar) {
        if (dataRadar.includes("-")) {
          const [ano, mes, dia] = dataRadar.split("-");
          dataFormatada = `${dia}/${mes}/${ano}`;
        } else {
          dataFormatada = dataRadar;
        }
      }
      sheet.getRange(linha, colunaDataRadar).setValue(dataFormatada);
      atualizadas++;
      console.log(`✅ Linha ${linha} atualizada com data RADAR na coluna AK (${colunaDataRadar}): ${dataFormatada}`);
    }

    SpreadsheetApp.flush();

    return {
      success: true,
      message: `${atualizadas} linha(s) atualizada(s) com sucesso na coluna AK (Data Ativação RADAR).`
    };

  } catch (e) {
    console.error("❌ Erro ao salvar data RADAR:", e);
    return { success: false, message: e.toString() };
  }
}
function gerarHTMLPropostaBackend(dados) {
  // Mesma função de geração de HTML do frontend
  const hoje = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");
  // ... (copie o mesmo HTML gerador)
  return `<html>...</html>`;
}


// ============================================
// 🚀 MÓDULO APRESENTAÇÃO - BACKEND V3.0
// ============================================

/**
 * TESTA A CONEXÃO COM O MÓDULO DE OFERTAS
 * Retorna o total de ofertas disponíveis
 */
function testarConexaoOfertas() {
  try {
    const ofertas = getOfertasTim();
    Logger.log(`🔍 Diagnóstico: ${ofertas.length} ofertas encontradas`);
    return { 
      success: true, 
      total: ofertas.length, 
      amostra: ofertas.length > 0 ? ofertas[0] : null 
    };
  } catch (e) {
    Logger.log(`❌ Erro no diagnóstico: ${e.toString()}`);
    return { success: false, error: e.toString() };
  }
}

/**
 * SALVA PROPOSTA COMPLETA (JSON) NA ABA PROSPECCAO
 */
function salvarPropostaCompleta(idLead, dados) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("PROSPECCAO");
    if (!sheet) return { success: false, message: "Aba PROSPECCAO não encontrada" };
    
    const data = sheet.getDataRange().getValues();
    let linhaEncontrada = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(idLead)) {
        linhaEncontrada = i + 1;
        break;
      }
    }
    if (linhaEncontrada === -1) return { success: false, message: "Lead não encontrado" };
    
    // Garantir coluna PROPOSTA_JSON
    const cabecalho = data[0];
    let colProposta = cabecalho.indexOf("PROPOSTA_JSON");
    if (colProposta === -1) {
      const novaCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, novaCol).setValue("PROPOSTA_JSON");
      colProposta = novaCol - 1;
    }
    
    // Salvar JSON
    const propostaJSON = JSON.stringify(dados);
    sheet.getRange(linhaEncontrada, colProposta + 1).setValue(propostaJSON);
    
    // Atualizar status para APRESENTACAO (se ainda não estiver em negociação)
    let etapaAtual = data[linhaEncontrada-1][14]; // Coluna 15 (Índice 14)
    let etapaDefinitiva = etapaAtual; 
    
    if (etapaAtual !== "NEGOCIACAO" && etapaAtual !== "FECHADO") {
      etapaDefinitiva = "APRESENTACAO";
      sheet.getRange(linhaEncontrada, 15).setValue(etapaDefinitiva);
    }
    
    SpreadsheetApp.flush();
    
    // RETORNO LIMPO: Apenas o necessário para o front-end reagir
    return { 
      success: true, 
      message: "Proposta salva com sucesso!",
      novaEtapa: etapaDefinitiva 
    };
    
  } catch(e) {
    // Retorno de erro seguro
    return { success: false, message: e.toString() };
  }
}

/**
 * CARREGA PROPOSTA COMPLETA DA ABA PROSPECCAO
 */
function carregarPropostaCompleta(idLead) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("PROSPECCAO");
    if (!sheet) return { success: false, dados: null };
    
    const data = sheet.getDataRange().getValues();
    const cabecalho = data[0];
    const colProposta = cabecalho.indexOf("PROPOSTA_JSON");
    if (colProposta === -1) return { success: true, dados: null };
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(idLead)) {
        const jsonStr = data[i][colProposta];
        if (jsonStr && jsonStr !== "") {
          try {
            const dados = JSON.parse(jsonStr);
            return { success: true, dados: dados };
          } catch(e) {
            return { success: false, dados: null, message: "Erro ao parsear JSON" };
          }
        }
        break;
      }
    }
    return { success: true, dados: null };
  } catch(e) {
    return { success: false, dados: null, message: e.toString() };
  }
}

/**
 * SALVA OS DADOS DA PROPOSTA/APRESENTAÇÃO NO LEAD
 * Chamado pelo frontend (prospeccao.html) ao clicar em "Salvar Proposta"
 */
function salvarDadosApresentacao(idLead, dados) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("PROSPECCAO");
    
    if (!sheet) {
      return { success: false, message: "Aba PROSPECCAO não encontrada" };
    }
    
    const data = sheet.getDataRange().getValues();
    const cabecalho = data[0];
    
    // Função para garantir que a coluna existe
    const garantirColuna = (nome, valorPadrao = "") => {
      let idx = cabecalho.indexOf(nome);
      if (idx === -1) {
        const novaColuna = sheet.getLastColumn() + 1;
        sheet.getRange(1, novaColuna).setValue(nome);
        sheet.getRange(1, novaColuna).setFontWeight("bold");
        return novaColuna;
      }
      return idx + 1;
    };
    
    // Garante todas as colunas necessárias
    const colOfertaId = garantirColuna("OFERTA_ID");
    const colOfertaNome = garantirColuna("OFERTA_NOME");
    const colOfertaValor = garantirColuna("OFERTA_VALOR");
    const colDataApres = garantirColuna("DATA_APRESENTACAO");
    const colTipoApres = garantirColuna("TIPO_APRESENTACAO");
    const colParticipantes = garantirColuna("PARTICIPANTES");
    const colObs = garantirColuna("OBS_APRESENTACAO");
    const colValorFinal = garantirColuna("VALOR_FINAL_PROP");
    const colDesconto = garantirColuna("DESCONTO");
    const colValidade = garantirColuna("VALIDADE_PROPOSTA");
    const colStatusProp = garantirColuna("STATUS_PROP");
    const colDataProposta = garantirColuna("DATA_PROPOSTA");
    const colLinhasProposta = garantirColuna("LINHAS_PROPOSTA_JSON");
    
    // Encontra o lead pelo ID
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(idLead)) {
        const linha = i + 1;
        const agora = new Date();
        
        // Salva os dados da proposta
        if (dados.oferta_id) sheet.getRange(linha, colOfertaId).setValue(dados.oferta_id);
        if (dados.oferta_nome) sheet.getRange(linha, colOfertaNome).setValue(dados.oferta_nome);
        if (dados.oferta_valor) sheet.getRange(linha, colOfertaValor).setValue(dados.oferta_valor);
        if (dados.data_apresentacao) sheet.getRange(linha, colDataApres).setValue(dados.data_apresentacao);
        if (dados.tipo_apresentacao) sheet.getRange(linha, colTipoApres).setValue(dados.tipo_apresentacao);
        if (dados.participantes) sheet.getRange(linha, colParticipantes).setValue(dados.participantes);
        if (dados.obs) sheet.getRange(linha, colObs).setValue(dados.obs);
        if (dados.valor_final !== undefined) sheet.getRange(linha, colValorFinal).setValue(dados.valor_final);
        if (dados.desconto !== undefined) sheet.getRange(linha, colDesconto).setValue(dados.desconto);
        if (dados.validade) sheet.getRange(linha, colValidade).setValue(dados.validade);
        if (dados.linhas && dados.linhas.length > 0) {
          sheet.getRange(linha, colLinhasProposta).setValue(JSON.stringify(dados.linhas));
        }
        
        // Atualiza status da proposta
        sheet.getRange(linha, colStatusProp).setValue("PROPOSTA_APRESENTADA");
        sheet.getRange(linha, colDataProposta).setValue(agora);
        
        // 🌟 ATUALIZA O STATUS DO LEAD PARA "APRESENTACAO" (se for primeira proposta)
        const statusAtual = data[i][14] || "";
        if (statusAtual === "CONTATO" || statusAtual === "OPORTUNIDADE") {
          sheet.getRange(linha, 15).setValue("APRESENTACAO"); // Coluna O = Status
        }
        
        // Adiciona registro no histórico (Coluna R = índice 18)
        const dataFormatada = Utilities.formatDate(agora, "GMT-3", "dd/MM/yyyy HH:mm");
        const usuario = dados.usuario || "Sistema";
        const valorFormatado = `R$ ${(dados.valor_final || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        
        let registroProposta = `------------------------------\n📊 PROPOSTA APRESENTADA (${dataFormatada}) - 👤 ${usuario}:\n`;
        registroProposta += `• ${dados.linhas ? dados.linhas.length : 1} linha(s) configurada(s)\n`;
        
        if (dados.linhas && dados.linhas.length > 0) {
          dados.linhas.forEach((linha, idx) => {
            registroProposta += `   Linha ${idx + 1}: ${linha.oferta_nome || linha.plano_nome || 'N/I'} - R$ ${(linha.valor_final || 0).toFixed(2)}\n`;
            if (linha.numero) registroProposta += `      Nº: ${linha.numero}\n`;
          });
        } else {
          registroProposta += `• Oferta: ${dados.oferta_nome || "N/I"}\n`;
          registroProposta += `• Valor: ${valorFormatado}\n`;
        }
        
        registroProposta += `• Validade: ${dados.validade || 15} dias\n`;
        registroProposta += `• Apresentação: ${dados.tipo_apresentacao || "N/I"}\n`;
        if (dados.obs) registroProposta += `• Obs: ${dados.obs}\n`;
        registroProposta += `└─────────────────────────────────────────────\n\n`;
        
        const historicoAtual = data[i][17] || "";
        const novoHistorico = registroProposta + historicoAtual;
        sheet.getRange(linha, 18).setValue(novoHistorico);
        
        SpreadsheetApp.flush();
        Logger.log(`✅ Proposta salva para o lead ${idLead}`);
        return { success: true, message: "Proposta salva com sucesso!" };
      }
    }
    
    return { success: false, message: "Lead não encontrado" };
    
  } catch (e) {
    Logger.log(`❌ Erro em salvarDadosApresentacao: ${e.toString()}`);
    return { success: false, message: e.toString() };
  }
}

/**
 * ENVIA A PROPOSTA POR E-MAIL PARA O CLIENTE
 * Gera um HTML profissional e envia via MailApp
 */
function enviarPropostaEmailCliente(idLead, emailCliente, dadosProposta) {
  try {
    // Validações básicas
    if (!emailCliente || emailCliente === "" || emailCliente === "-") {
      return { success: false, message: "E-mail do cliente não informado" };
    }
    
    if (!emailCliente.includes("@")) {
      return { success: false, message: "E-mail inválido" };
    }
    
    // Gera o HTML da proposta
    const htmlProposta = gerarHTMLPropostaParaEmail(dadosProposta);
    
    // Envia o e-mail
    MailApp.sendEmail({
      to: emailCliente,
      subject: `📄 Proposta Comercial TIM - ${dadosProposta.razao || "Empresa"}`,
      htmlBody: htmlProposta,
      replyTo: Session.getActiveUser().getEmail()
    });
    
    // Registra no histórico do lead
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("PROSPECCAO");
    
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(idLead)) {
          const agora = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy HH:mm");
          const usuario = dadosProposta.usuario || "Sistema";
          const registro = `------------------------------\n✉️ PROPOSTA ENVIADA POR E-MAIL (${agora}) - 👤 ${usuario}\n• Para: ${emailCliente}\n• Oferta: ${dadosProposta.oferta?.nome_comercial || dadosProposta.oferta_nome || "N/I"}\n• Valor: R$ ${(dadosProposta.valor_final || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`;
          const historicoAtual = data[i][17] || "";
          sheet.getRange(i + 1, 18).setValue(registro + historicoAtual);
          break;
        }
      }
    }
    
    Logger.log(`✅ E-mail enviado para ${emailCliente}`);
    return { success: true, message: "E-mail enviado com sucesso!" };
    
  } catch (e) {
    Logger.log(`❌ Erro ao enviar e-mail: ${e.toString()}`);
    return { success: false, message: e.toString() };
  }
}

/**
 * GERA O HTML DA PROPOSTA PARA E-MAIL
 * Versão otimizada para envio via MailApp
 */
function gerarHTMLPropostaParaEmail(dados) {
  const hoje = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");
  const oferta = dados.oferta || {};
  const valorOriginal = dados.valor_original || oferta.valor || 0;
  const valorFinal = dados.valor_final || valorOriginal;
  const desconto = dados.desconto || 0;
  const validadeDias = dados.validade_dias || 15;
  
  // Calcula data de validade
  const dataValidade = new Date();
  dataValidade.setDate(dataValidade.getDate() + validadeDias);
  const dataValidadeStr = Utilities.formatDate(dataValidade, "GMT-3", "dd/MM/yyyy");
  
  const formatarMoeda = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  
  // Benefícios
  let beneficiosHTML = "";
  if (oferta.apps_inclusos) {
    beneficiosHTML += `<li>📱 Apps inclusos: ${oferta.apps_inclusos}</li>`;
  }
  if (oferta.vas_seguranca) {
    beneficiosHTML += `<li>🛡️ Segurança: ${oferta.vas_seguranca}</li>`;
  }
  if (oferta.vas_beneficios) {
    beneficiosHTML += `<li>🎁 Benefícios: ${oferta.vas_beneficios}</li>`;
  }
  
  // Calcula franquia total
  let franquiaTotal = oferta.franquia_total || oferta.franquia_plano || "";
  if (oferta.franquia_plano && oferta.franquia_bonus) {
    const numPlano = parseInt(oferta.franquia_plano) || 0;
    const numBonus = parseInt(oferta.franquia_bonus) || 0;
    franquiaTotal = `${numPlano + numBonus}GB`;
  }
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proposta TIM Empresas</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      padding: 40px 20px;
    }
    .email-container {
      max-width: 650px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e3c72 100%);
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      color: white;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .header p {
      color: #94a3b8;
      font-size: 13px;
    }
    .tim-logo {
      display: inline-block;
      background: rgba(255, 255, 255, 0.1);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      color: #f59e0b;
      margin-top: 12px;
    }
    .content {
      padding: 30px;
    }
    .info-box {
      background: #f8fafc;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
    }
    .info-box h3 {
      color: #1e3c72;
      font-size: 14px;
      margin-bottom: 12px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    .label {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .value {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      margin-top: 4px;
    }
    .oferta-box {
      background: #fff7ed;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 24px;
      border: 1px solid #fed7aa;
    }
    .oferta-box h3 {
      color: #ea580c;
      font-size: 14px;
      margin-bottom: 15px;
    }
    .grid-oferta {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .valor-box {
      background: linear-gradient(135deg, #dcfce7, #d1fae5);
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      margin-bottom: 24px;
    }
    .valor-original {
      font-size: 14px;
      color: #64748b;
      text-decoration: line-through;
    }
    .valor-final {
      font-size: 36px;
      font-weight: 800;
      color: #10b981;
      margin: 8px 0;
    }
    .desconto {
      font-size: 12px;
      color: #ef4444;
    }
    .beneficios {
      background: #f8fafc;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .beneficios ul {
      margin-top: 12px;
      padding-left: 24px;
    }
    .beneficios li {
      margin: 8px 0;
      font-size: 13px;
    }
    .footer {
      background: #f8fafc;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #94a3b8;
    }
    .btn-proposta {
      display: inline-block;
      background: #1e3c72;
      color: white;
      padding: 12px 24px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 20px;
    }
    @media (max-width: 600px) {
      .grid-2, .grid-oferta {
        grid-template-columns: 1fr;
        gap: 10px;
      }
      .content { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🚀 PROPOSTA COMERCIAL</h1>
      <p>Soluções em conectividade para sua empresa</p>
      <div class="tim-logo">⚡ TIM EMPRESAS</div>
    </div>
    
    <div class="content">
      <div class="info-box">
        <h3>📋 DADOS DO CLIENTE</h3>
        <div class="grid-2">
          <div>
            <div class="label">RAZÃO SOCIAL</div>
            <div class="value">${escapeHtml(dados.razao || "Cliente")}</div>
          </div>
          <div>
            <div class="label">CNPJ</div>
            <div class="value">${dados.cnpj || "---"}</div>
          </div>
          <div>
            <div class="label">DATA DA PROPOSTA</div>
            <div class="value">${hoje}</div>
          </div>
          <div>
            <div class="label">VALIDADE</div>
            <div class="value">${dataValidadeStr} (${validadeDias} dias)</div>
          </div>
        </div>
      </div>
      
      <div class="oferta-box">
        <h3>📱 OFERTA SELECIONADA</h3>
        <div class="grid-oferta">
          <div>
            <div class="label">PLANO</div>
            <div class="value">${escapeHtml(oferta.nome_comercial || oferta.nome_interno || "Plano TIM")}</div>
          </div>
          <div>
            <div class="label">FRANQUIA</div>
            <div class="value">${franquiaTotal || "-"}</div>
          </div>
          <div>
            <div class="label">TECNOLOGIA</div>
            <div class="value">⚡ ${oferta.tecnologia || "5G"}</div>
          </div>
          <div>
            <div class="label">FIDELIDADE</div>
            <div class="value">${oferta.fidelidade || 12} meses</div>
          </div>
        </div>
      </div>
      
      <div class="valor-box">
        <div class="valor-original">${formatarMoeda(valorOriginal)}</div>
        ${desconto > 0 ? `<div class="desconto">💸 Desconto aplicado: ${formatarMoeda(desconto)}</div>` : ''}
        <div class="valor-final">${formatarMoeda(valorFinal)}</div>
        <div style="font-size: 12px; margin-top: 8px;">*valor mensal + impostos</div>
      </div>
      
      ${beneficiosHTML ? `
      <div class="beneficios">
        <h3>🎁 BENEFÍCIOS INCLUSOS</h3>
        <ul>${beneficiosHTML}</ul>
      </div>
      ` : ''}
      
      ${dados.obs ? `
      <div style="background: #fef3c7; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <strong style="color: #d97706;">📝 OBSERVAÇÕES:</strong>
        <p style="margin-top: 8px; font-size: 13px;">${escapeHtml(dados.obs)}</p>
      </div>
      ` : ''}
      
      <div style="text-align: center; margin-top: 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" bgcolor="#1e3c72" style="border-radius: 12px;">
                    <a href="#" style="display: inline-block; padding: 12px 28px; color: white; text-decoration: none; font-weight: 600; font-size: 14px;">📄 Visualizar Proposta Completa</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    </div>
    
    <div class="footer">
      <p>Esta proposta foi gerada automaticamente pelo sistema VEXO.</p>
      <p>© ${new Date().getFullYear()} VEXO - Gestão Inteligente</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * ESCAPE HTML - Protege contra XSS
 */
function escapeHtml(texto) {
  if (!texto) return "";
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Salva proposta multi-linha no lead
 */
function salvarPropostaMultiLinha() {
  const d = coletarDadosPropostaMultiLinha();
  if (!d) return;
  
  const idLead = document.getElementById('unificado_id_lead')?.value;
  if (!idLead) {
    notificacaoVexo('Lead não identificado!', 'error');
    return;
  }
  
  if (!d.linhas || d.linhas.length === 0) {
    notificacaoVexo('Adicione pelo menos uma linha à proposta!', 'warning');
    return;
  }
  
  const btn = event?.target || document.querySelector('.ap6-btn:last-child');
  const originalText = btn?.innerHTML;
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
  }
  
  // Preparar payload limpo
  const payload = {
    linhas: d.linhas.map(l => ({
      plano_nome: l.plano_nome,
      numero: l.numero,
      tipo: l.tipo,
      valor_original: l.valor_original,
      desconto: l.desconto,
      valor_final: l.valor_final,
      oferta: l.oferta || null
    })),
    total: d.valorFinal,
    subtotal: d.subtotal,
    desconto_total: d.descontoTotal,
    data_apresentacao: d.data_apresentacao,
    tipo_apresentacao: d.tipo_apresentacao,
    participantes: d.participantes,
    validade: d.validadeDias,
    obs: d.obs,
    usuario: d.usuario
  };
  
  google.script.run
    .withSuccessHandler(function(res) {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
      if (res.success) {
        notificacaoVexo('✅ Proposta salva com sucesso!', 'success');
        
        // Avançar para Negociação se ainda não estiver
        const etapaAtual = document.getElementById('modal-unificado-etapa-atual')?.innerText;
        if (etapaAtual !== 'NEGOCIACAO' && etapaAtual !== 'FECHADO') {
          google.script.run
            .withSuccessHandler(() => {
              document.getElementById('modal-unificado-etapa-atual').innerText = 'NEGOCIACAO';
              moverCardNoKanban(idLead, 'NEGOCIACAO');
              if (typeof carregarMeuFunil === 'function') carregarMeuFunil();
            })
            .atualizarStatusLeadPlanilha(idLead, 'NEGOCIACAO');
        }
      } else {
        notificacaoVexo('❌ ' + (res.message || 'Erro ao salvar'), 'error');
      }
    })
    .withFailureHandler(function(err) {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
      notificacaoVexo('❌ Erro de comunicação: ' + err, 'error');
    })
    .salvarPropostaCompleta(idLead, payload);
}

/**
 * Envia proposta multi-linha por e-mail
 */
function enviarPropostaMultiLinhaEmail(idLead, emailCliente, dados) {
  try {
    const html = gerarHTMLPropostaMultiLinhaEmail(dados);
    MailApp.sendEmail({
      to: emailCliente,
      subject: `📄 Proposta Comercial TIM - ${dados.razao} (${dados.quantidade_linhas} linhas)`,
      htmlBody: html
    });
    
    // Registra no histórico
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("PROSPECCAO");
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      const agora = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy HH:mm");
      const usuario = dados.usuario || "Sistema";
      const registro = `------------------------------\n✉️ PROPOSTA MULTI-LINHA ENVIADA (${agora}) - 👤 ${usuario}\n• Para: ${emailCliente}\n• ${dados.quantidade_linhas} linha(s)\n• Valor total: R$ ${dados.total_final.toFixed(2)}\n\n`;
      
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(idLead)) {
          sheet.getRange(i + 1, 18).setValue(registro + (data[i][17] || ""));
          break;
        }
      }
    }
    
    return { success: true, message: "E-mail enviado com sucesso!" };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function gerarHTMLPropostaMultiLinhaEmail(dados) {
  // Versão simplificada para e-mail (você pode adaptar)
  const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const hoje = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy");
  
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Proposta TIM</title></head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h2 style="color: #1e3c72;">⚡ Proposta Comercial TIM Empresas</h2>
  <p><strong>Cliente:</strong> ${dados.razao}</p>
  <p><strong>CNPJ:</strong> ${dados.cnpj || '—'}</p>
  <p><strong>Data:</strong> ${hoje}</p>
  <p><strong>Validade:</strong> ${dados.validade_dias} dias</p>
  
  <h3>📞 Linhas Contratadas (${dados.quantidade_linhas})</h3>
  <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%;">
    <tr bgcolor="#f1f5f9"><th>#</th><th>Número</th><th>Plano</th><th>Valor</th></tr>
    ${dados.linhas.map((l, i) => `<tr><td>${i+1}</td><td>${l.numero || '—'}</td><td>${l.oferta_nome}</td><td>${fmt(l.valor_final)}</td></tr>`).join('')}
  </table>
  
  <div style="margin-top: 20px; padding: 15px; background: #f0fdf4; border-radius: 10px;">
    <p><strong>💰 VALOR TOTAL MENSAL:</strong> <span style="font-size: 24px; color: #10b981;">${fmt(dados.total_final)}</span></p>
  </div>
  
  <hr>
  <p style="font-size: 11px; color: #94a3b8;">Proposta gerada pelo sistema VEXO · Consulte condições contratuais</p>
</body>
</html>`;
}

/**
 * Busca TODOS os vendedores cadastrados (para escolha livre)
 * CORRIGIDA: Agora busca corretamente na aba USERS
 */
function buscarTodosVendedores() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("USERS");
    if (!sheet) {
      console.error("Aba USERS não encontrada");
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    const vendedores = [];
    
    // Pula o cabeçalho (linha 1)
    for (let i = 1; i < data.length; i++) {
      const matricula = String(data[i][0] || "").trim();
      const nome = String(data[i][2] || "").trim();
      const sobrenome = String(data[i][3] || "").trim();
      const cargo = String(data[i][5] || "").toUpperCase().trim();
      const status = String(data[i][6] || "").toUpperCase().trim();
      const nomeCompleto = (nome + " " + sobrenome).trim();
      
      // Considera qualquer usuário ativo como elegível
      const isAtivo = status === "ATIVO" || status === "TRUE";
      
      if (isAtivo && nomeCompleto !== "" && matricula !== "") {
        vendedores.push({
          id: matricula,  // Usa a matrícula como ID único
          nome: nomeCompleto.toUpperCase(),
          cargo: cargo,
          status: status
        });
      }
    }
    
    console.log("Vendedores encontrados:", vendedores.length);
    return vendedores;
    
  } catch(e) {
    console.error("Erro buscarTodosVendedores:", e);
    return [];
  }
}

/**
 * Salva o Time do Mês com metas individuais
 * Estrutura correta das colunas:
 * A: ID_PERIODO (MÊS/ANO)
 * B: MÊS
 * C: ANO
 * D: MATRICULA
 * E: NOME
 * F: CARGO
 * G: META MIN - FAT
 * H: META TARGET FAT
 * I: META SUPERADA FAT
 * J: META MIN - PORT
 * K: META TARGET - PORT
 * L: META SUP - PORT
 * M: META MIN - RENEG
 * N: META TARGET - RENEG
 * O: META SUP - RENEG
 * P: DATA REGISTRO
 * Q: USUARIO REGISTRADOR
 */
function salvarTimeMetas(mes, ano, timeVendedores) {
  try {
    console.log("📝 Salvando Time do Mês para:", mes, ano);
    console.log("📊 Vendedores a salvar:", timeVendedores.length);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("METAS_TIME_MES");
    
    // Cria a aba se não existir
    if (!sheet) {
      console.log("📄 Criando aba METAS_TIME_MES...");
      sheet = ss.insertSheet("METAS_TIME_MES");
      sheet.appendRow([
        "ID_PERIODO", "MES", "ANO", "MATRICULA", "NOME", "CARGO",
        "META_MIN_FAT", "META_TARGET_FAT", "META_SUP_FAT",
        "META_MIN_PORT", "META_TARGET_PORT", "META_SUP_PORT",
        "META_MIN_RENEG", "META_TARGET_RENEG", "META_SUP_RENEG",
        "DATA_REGISTRO", "USUARIO_REGISTRADOR"
      ]);
      sheet.getRange("A1:Q1").setFontWeight("bold").setBackground("#1e3c72").setFontColor("white");
      SpreadsheetApp.flush();
    }
    
    const idPeriodo = `${mes}/${ano}`;
    const data = sheet.getDataRange().getValues();
    
    // Remove registros antigos deste período
    let linhasDeletadas = 0;
    for (let i = data.length - 1; i >= 1; i--) {
      const periodoSalvo = String(data[i][0] || "").trim();
      if (periodoSalvo === idPeriodo) {
        sheet.deleteRow(i + 1);
        linhasDeletadas++;
      }
    }
    console.log(`🗑️ Removidas ${linhasDeletadas} linhas antigas do período ${idPeriodo}`);
    
    // Insere os novos registros
    let linhasInseridas = 0;
    const dataRegistro = new Date();
    const usuario = "ADMIN_SISTEMA"; // Você pode pegar o usuário logado aqui
    
    for (const v of timeVendedores) {
      // Verifica se o vendedor tem os dados necessários
      if (!v.id || !v.nome) {
        console.warn("⚠️ Vendedor ignorado (dados incompletos):", v);
        continue;
      }
      
      sheet.appendRow([
        idPeriodo,                           // A: ID_PERIODO
        mes,                                 // B: MES
        ano,                                 // C: ANO
        v.id,                                // D: MATRICULA
        v.nome,                              // E: NOME
        v.cargo || "VENDEDOR",               // F: CARGO
        Number(v.meta.fat_min) || 0,         // G: META_MIN_FAT
        Number(v.meta.fat_target) || 0,      // H: META_TARGET_FAT
        Number(v.meta.fat_sup) || 0,         // I: META_SUP_FAT
        Number(v.meta.port_min) || 0,        // J: META_MIN_PORT
        Number(v.meta.port_target) || 0,     // K: META_TARGET_PORT
        Number(v.meta.port_sup) || 0,        // L: META_SUP_PORT
        Number(v.meta.mid_min) || 0,         // M: META_MIN_RENEG
        Number(v.meta.mid_target) || 0,      // N: META_TARGET_RENEG
        Number(v.meta.mid_sup) || 0,         // O: META_SUP_RENEG
        dataRegistro,                        // P: DATA_REGISTRO
        usuario                              // Q: USUARIO_REGISTRADOR
      ]);
      linhasInseridas++;
    }
    
    SpreadsheetApp.flush();
    console.log(`✅ Salvo: ${linhasInseridas} vendedores para ${idPeriodo}`);
    
    return { 
      success: true, 
      message: `✅ Time de ${linhasInseridas} vendedor(es) salvo para ${idPeriodo}.` 
    };
    
  } catch(e) {
    console.error("❌ Erro em salvarTimeMetas:", e);
    return { success: false, message: "Erro ao salvar: " + e.toString() };
  }
}


function buscarTimeMetas(mes, ano) {
  try {
    console.log("🔍 Buscando Time do Mês para:", mes, ano);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("METAS_TIME_MES");
    
    if (!sheet) {
      console.log("⚠️ Aba METAS_TIME_MES não encontrada");
      return { time: [] };
    }
    
    const data = sheet.getDataRange().getValues();
    console.log(`📊 Total de linhas na METAS_TIME_MES: ${data.length}`);
    
    if (data.length <= 1) {
      console.log("⚠️ Nenhum dado na aba METAS_TIME_MES");
      return { time: [] };
    }
    
    // Monta o ID_PERIODO de duas formas possíveis
    const periodo1 = `${mes}/${ano}`;      // Ex: "JUNHO/2026"
    const periodo2 = `${mes}/${ano}`;      // Pode ser "6/2026" também
    
    // Normaliza o mês para comparação
    const mapaMeses = {
      "JANEIRO": "01", "FEVEREIRO": "02", "MARÇO": "03", "ABRIL": "04",
      "MAIO": "05", "JUNHO": "06", "JULHO": "07", "AGOSTO": "08",
      "SETEMBRO": "09", "OUTUBRO": "10", "NOVEMBRO": "11", "DEZEMBRO": "12",
      "JAN": "01", "FEB": "02", "MAR": "03", "APR": "04", "MAY": "05", "JUN": "06",
      "JUL": "07", "AUG": "08", "SEP": "09", "OCT": "10", "NOV": "11", "DEC": "12"
    };
    
    const mesNum = mapaMeses[String(mes).toUpperCase().trim()] || String(mes).padStart(2, '0');
    const periodoNum = `${mesNum}/${ano}`;
    
    console.log(`🔍 Buscando por períodos: "${periodo1}" ou "${periodoNum}"`);
    
    const time = [];
    
    for (let i = 1; i < data.length; i++) {
      const linha = data[i];
      const periodoSalvo = String(linha[0] || "").trim(); // Coluna A: ID_PERIODO
      const mesSalvo = String(linha[1] || "").trim().toUpperCase();
      const anoSaved = String(linha[2] || "").trim();
      
      console.log(`  Linha ${i}: periodo="${periodoSalvo}", mes="${mesSalvo}", ano="${anoSaved}"`);
      
      // Comparação flexível
      const matchPeriodo = (periodoSalvo === periodo1 || periodoSalvo === periodoNum);
      const matchMesAno = (mesSalvo === String(mes).toUpperCase().trim() && anoSaved === String(ano));
      
      if (matchPeriodo || matchMesAno) {
        console.log(`  ✅ MATCH encontrado! Vendedor: ${linha[4]}`);
        
        time.push({
          id: String(linha[3] || "").trim(),           // Coluna D: MATRICULA
          nome: String(linha[4] || "").trim(),         // Coluna E: NOME
          cargo: String(linha[5] || "").trim(),        // Coluna F: CARGO
          meta: {
            fat_min: Number(linha[6]) || 0,
            fat_target: Number(linha[7]) || 0,
            fat_sup: Number(linha[8]) || 0,
            port_min: Number(linha[9]) || 0,
            port_target: Number(linha[10]) || 0,
            port_sup: Number(linha[11]) || 0,
            mid_min: Number(linha[12]) || 0,
            mid_target: Number(linha[13]) || 0,
            mid_sup: Number(linha[14]) || 0
          }
        });
      }
    }
    
    console.log(`📋 Total de vendedores encontrados: ${time.length}`);
    return { time: time };
    
  } catch (e) {
    console.error("❌ Erro em buscarTimeMetas:", e);
    return { time: [] };
  }
}
/**
 * 🔥 BUSCA VENDAS REALIZADAS POR VENDEDOR (para o Desafio do Mês individual)
 * Agora busca por MATRÍCULA tanto na coluna I quanto na coluna J da planilha VENDAS
 * Versão otimizada com melhor match e logs detalhados
 */
function buscarVendasParaMetasIndividuais(mesAlvo, anoAlvo) {
  try {
    console.log("🔍 Iniciando busca de vendas para:", mesAlvo, anoAlvo);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("VENDAS");
    if (!sheet) {
      console.error("❌ Aba VENDAS não encontrada");
      return { vendedores: {}, totalLoja: { fat: 0, port: 0, midQtd: 0 } };
    }
    
    // Primeiro, buscar a aba USERS para mapear matrícula -> nome
    const sheetUsers = ss.getSheetByName("USERS");
    let mapaMatriculaParaNome = {};
    let mapaNomeParaMatricula = {}; // 🔥 NOVO: mapeamento reverso
    
    if (sheetUsers) {
      const usersData = sheetUsers.getDataRange().getValues();
      for (let i = 1; i < usersData.length; i++) {
        const matricula = String(usersData[i][0] || "").trim().toUpperCase();
        const nome = String(usersData[i][2] || "").trim().toUpperCase();
        const sobrenome = String(usersData[i][3] || "").trim().toUpperCase();
        const nomeCompleto = (nome + " " + sobrenome).trim();
        
        if (matricula) {
          mapaMatriculaParaNome[matricula] = nomeCompleto;
          // 🔥 Mapeia também o nome completo para a matrícula
          if (nomeCompleto) {
            mapaNomeParaMatricula[nomeCompleto] = matricula;
          }
          // Mapeia apenas o primeiro nome também
          if (nome) {
            mapaNomeParaMatricula[nome] = matricula;
          }
        }
      }
      console.log("📋 Mapa de usuários carregado:", Object.keys(mapaMatriculaParaNome).length, "matrículas");
    }
    
    const data = sheet.getDataRange().getValues();
    console.log(`📊 Total de linhas na VENDAS: ${data.length}`);
    
    // Mapeamento de meses
    const mapaMeses = {
      "JANEIRO": 1, "FEVEREIRO": 2, "MARÇO": 3, "ABRIL": 4,
      "MAIO": 5, "JUNHO": 6, "JULHO": 7, "AGOSTO": 8,
      "SETEMBRO": 9, "OUTUBRO": 10, "NOVEMBRO": 11, "DEZEMBRO": 12
    };
    
    let mesNum = parseInt(mesAlvo);
    if (isNaN(mesNum)) {
      mesNum = mapaMeses[String(mesAlvo).toUpperCase().trim()] || 6;
    }
    const anoNum = parseInt(anoAlvo);
    
    console.log(`📅 Filtrando para: ${mesNum}/${anoNum}`);
    
    const vendedores = {};
    let totalLoja = { fat: 0, port: 0, midQtd: 0 };
    let linhasProcessadas = 0;
    
    for (let i = 1; i < data.length; i++) {
      const linha = data[i];
      
      // 🔥 VERIFICA SE A VENDA FOI VALIDADA (Coluna AJ - índice 35)
      const valAJ = linha[35];
      if (!valAJ || valAJ === "") continue;
      
      // Extrai a data de validação
      let dataValidacao = null;
      if (valAJ instanceof Date) {
        dataValidacao = valAJ;
      } else if (typeof valAJ === 'string') {
        const partes = valAJ.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
        if (partes) {
          let ano = parseInt(partes[3]);
          if (ano < 100) ano += 2000;
          dataValidacao = new Date(ano, parseInt(partes[2]) - 1, parseInt(partes[1]));
        }
      }
      
      if (!dataValidacao || isNaN(dataValidacao.getTime())) continue;
      
      const mesVenda = dataValidacao.getMonth() + 1;
      const anoVenda = dataValidacao.getFullYear();
      
      // Filtra pelo mês/ano selecionado
      if (mesVenda !== mesNum || anoVenda !== anoNum) continue;
      
      // 🔥 IDENTIFICA O VENDEDOR - Tenta várias colunas
      let vendedorId = "";
      let vendedorNome = "";
      let matriculaEncontrada = "";
      
      // Coluna I (índice 8) - Matrícula do vendedor
      const matriculaColI = String(linha[8] || "").trim().toUpperCase();
      // Coluna J (índice 9) - Nome do vendedor
      const nomeColJ = String(linha[9] || "").trim().toUpperCase();
      
      // 🔥 LÓGICA PRIORITÁRIA: Se tem matrícula na coluna I, usa ela
      if (matriculaColI && matriculaColI !== "") {
        matriculaEncontrada = matriculaColI;
        vendedorId = matriculaColI;
        vendedorNome = mapaMatriculaParaNome[matriculaColI] || nomeColJ || matriculaColI;
      } 
      // Se tem nome na coluna J, tenta encontrar a matrícula correspondente
      else if (nomeColJ && nomeColJ !== "") {
        vendedorNome = nomeColJ;
        // Tenta encontrar a matrícula pelo nome no mapa reverso
        matriculaEncontrada = mapaNomeParaMatricula[nomeColJ] || "";
        vendedorId = matriculaEncontrada || nomeColJ;
      } 
      else {
        vendedorId = "SEM_ID";
        vendedorNome = "SEM IDENTIFICAÇÃO";
      }
      
      const valor = parseFloat(linha[7]) || 0;
      const modalidade = String(linha[4] || "").toUpperCase();
      
      // Inicializa o vendedor no objeto (usa o ID real)
      if (!vendedores[vendedorId]) {
        vendedores[vendedorId] = { 
          fat: 0, 
          port: 0, 
          midQtd: 0, 
          gross: 0,
          nome: vendedorNome,
          matricula: matriculaEncontrada  // 🔥 Guarda a matrícula original
        };
      }
      
      // Soma para FATURAMENTO
      if (/PRIMEIRA|NOVA|PORT|ADITIVO|MIGRA/i.test(modalidade)) {
        totalLoja.fat += valor;
        vendedores[vendedorId].fat += valor;
        
        // Gross: desconsidera MIGRAÇÃO
        if (!modalidade.includes("MIGRA")) {
          vendedores[vendedorId].gross++;
        }
      }
      
      // Soma para PORTABILIDADE
      if (/PORT/i.test(modalidade)) {
        totalLoja.port += valor;
        vendedores[vendedorId].port += valor;
      }
      
      // Soma para RENEGOCIAÇÃO MID
      if (/MID|RENEG/i.test(modalidade)) {
        totalLoja.midQtd++;
        vendedores[vendedorId].midQtd++;
      }
      
      linhasProcessadas++;
    }
    
    console.log(`✅ Processadas ${linhasProcessadas} vendas para ${mesNum}/${anoNum}`);
    console.log(`📊 Total Loja: FAT=${totalLoja.fat.toFixed(2)}, PORT=${totalLoja.port.toFixed(2)}, MID=${totalLoja.midQtd}`);
    console.log(`👥 Vendedores encontrados (${Object.keys(vendedores).length}):`);
    for (const [id, dados] of Object.entries(vendedores)) {
      console.log(`   - ID: "${id}" | Nome: "${dados.nome}" | Matrícula: "${dados.matricula || 'N/A'}" | FAT: R$ ${dados.fat.toFixed(2)} | PORT: R$ ${dados.port.toFixed(2)} | MID: ${dados.midQtd}`);
    }
    
    return { vendedores: vendedores, totalLoja: totalLoja };
    
  } catch (e) {
    console.error("❌ Erro em buscarVendasParaMetasIndividuais:", e);
    return { vendedores: {}, totalLoja: { fat: 0, port: 0, midQtd: 0 } };
  }
}
/**
 * Salva os dados do contato e avança o lead para a etapa CONTATO 
 * (se ele estiver em OPORTUNIDADE)
 */
function salvarContatoEAvancar(idLead, dadosContato, usuario) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("PROSPECCAO");
    if (!sheet) return { success: false, message: "Aba PROSPECCAO não encontrada" };
    
    const data = sheet.getDataRange().getValues();
    let linhaEncontrada = -1;
    let statusAtual = "";
    
    // 1. Localizar o lead e obter status atual
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(idLead)) {
        linhaEncontrada = i + 1;
        statusAtual = data[i][14] || ""; // Coluna O (status)
        break;
      }
    }
    
    if (linhaEncontrada === -1) {
      return { success: false, message: "Lead não encontrado" };
    }
    
    // 2. Garantir que as colunas de contato existam (criar se não existirem)
    const cabecalho = data[0];
    const colDataContato = garantirColunaCabecalho(sheet, cabecalho, "DATA_PRIMEIRO_CONTATO");
    const colMeioContato = garantirColunaCabecalho(sheet, cabecalho, "MEIO_CONTATO");
    const colQuemAtendeu = garantirColunaCabecalho(sheet, cabecalho, "QUEM_ATENDEU");
    const colInteresse = garantirColunaCabecalho(sheet, cabecalho, "INTERESSE_DEMONSTRADO");
    const colPrincipalDor = garantirColunaCabecalho(sheet, cabecalho, "PRINCIPAL_DOR");
    const colProximaAcao = garantirColunaCabecalho(sheet, cabecalho, "PROXIMA_ACAO_CONTATO");
    
    // 3. Salvar os dados do contato
    if (dadosContato.dataPrimeiroContato) sheet.getRange(linhaEncontrada, colDataContato).setValue(dadosContato.dataPrimeiroContato);
    if (dadosContato.meioContato) sheet.getRange(linhaEncontrada, colMeioContato).setValue(dadosContato.meioContato);
    if (dadosContato.quemAtendeu) sheet.getRange(linhaEncontrada, colQuemAtendeu).setValue(dadosContato.quemAtendeu);
    if (dadosContato.interesseDemonstrado) sheet.getRange(linhaEncontrada, colInteresse).setValue(dadosContato.interesseDemonstrado);
    if (dadosContato.principalDor) sheet.getRange(linhaEncontrada, colPrincipalDor).setValue(dadosContato.principalDor);
    if (dadosContato.proximaAcao) sheet.getRange(linhaEncontrada, colProximaAcao).setValue(dadosContato.proximaAcao);
    
    // 4. Registrar no histórico
    const agora = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy HH:mm");
    const historicoAtual = data[linhaEncontrada-1][17] || "";
    let novoRegistro = `------------------------------\n📞 CONTATO REGISTRADO (${agora}) - 👤 ${usuario}\n`;
    novoRegistro += `• Meio: ${dadosContato.meioContato}\n`;
    novoRegistro += `• Interesse: ${dadosContato.interesseDemonstrado || 'N/I'}\n`;
    if (dadosContato.principalDor) novoRegistro += `• Dor: ${dadosContato.principalDor}\n`;
    if (dadosContato.proximaAcao) novoRegistro += `• Próxima ação: ${dadosContato.proximaAcao}\n`;
    novoRegistro += `\n`;
    sheet.getRange(linhaEncontrada, 18).setValue(novoRegistro + historicoAtual);
    
    // 5. Avançar etapa se estiver em OPORTUNIDADE
    let statusAtualizado = false;
    if (statusAtual === "OPORTUNIDADE" || statusAtual === "" || statusAtual === "DISPONÍVEL") {
      sheet.getRange(linhaEncontrada, 15).setValue("CONTATO"); // Coluna O = Status
      statusAtualizado = true;
      // Adicionar registro de avanço no histórico
      const historicoAtual2 = sheet.getRange(linhaEncontrada, 18).getValue() || "";
      const registroAvancar = `------------------------------\n🚀 Lead avançado para CONTATO automaticamente (${agora})\n\n`;
      sheet.getRange(linhaEncontrada, 18).setValue(registroAvancar + historicoAtual2);
    }
    
    SpreadsheetApp.flush();
    return { 
      success: true, 
      message: statusAtualizado ? "Dados de contato salvos e lead avançado para CONTATO!" : "Dados de contato salvos com sucesso!",
      statusAtualizado: statusAtualizado
    };
    
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

// Função auxiliar para garantir que a coluna exista
function garantirColunaCabecalho(sheet, cabecalho, nomeColuna) {
  let idx = cabecalho.indexOf(nomeColuna);
  if (idx === -1) {
    const novaColuna = sheet.getLastColumn() + 1;
    sheet.getRange(1, novaColuna).setValue(nomeColuna);
    sheet.getRange(1, novaColuna).setFontWeight("bold");
    return novaColuna;
  }
  return idx + 1;
}
function getComissaoM2M() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("COMISSAO");
  if (!sheet) return 0.15;
  const val = sheet.getRange("B5").getValue();
  if (typeof val === 'number') return val;
  return parseFloat(String(val).replace(',', '.')) || 0.15;
}
function excluirPedidoPlanilha(linhasArray, origem, idUnico, modalidade) {
  try {
    console.log(`🗑️ excluirPedidoPlanilha: linhasArray=${JSON.stringify(linhasArray)}, origem=${origem}, idUnico=${idUnico}`);
    // O parâmetro modalidade é ignorado - sempre exclui todas as linhas do grupo

    const PLANILHA_CENTRAL_PARCEIROS = "1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4";
    const PLANILHA_PROPRIO = "1ULyXmZjrHlTXJ7cl0jlL_ugriHzZ4W8Q-6ExvkPm6qg";
    let ss;
    
    if (origem === "PARCEIRO") {
      ss = SpreadsheetApp.openById(PLANILHA_CENTRAL_PARCEIROS);
    } else {
      ss = SpreadsheetApp.openById(PLANILHA_PROPRIO);
    }
    
    const sheet = ss.getSheetByName("VENDAS");
    if (!sheet) {
      return { success: false, message: "Aba VENDAS não encontrada" };
    }
    
    let linhasParaExcluir = [];
    
    // Se linhasArray foi fornecido, usa ele (exclusão de linhas específicas)
    if (linhasArray && linhasArray.length > 0) {
      linhasParaExcluir = linhasArray;
    } 
    // Caso contrário, usa idUnico para encontrar todas as linhas do grupo (ignorando modalidade)
    else if (idUnico) {
      const partes = idUnico.split("|");
      const cnpjAlvo = partes[0] || "";
      const dataAlvoStr = partes[1] || "";
      
      const cnpjLimpo = cnpjAlvo.replace(/\D/g, '');
      
      // Normaliza a data para dd/MM/yyyy
      let dataAlvoNormalizada = dataAlvoStr;
      if (dataAlvoStr && dataAlvoStr.includes("-")) {
        const [ano, mes, dia] = dataAlvoStr.split("-");
        dataAlvoNormalizada = `${dia}/${mes}/${ano}`;
      }
      
      console.log(`🔍 Buscando linhas para exclusão (todas as modalidades): CNPJ=${cnpjLimpo}, Data=${dataAlvoNormalizada}`);
      
      const data = sheet.getDataRange().getValues();
      let linhasEncontradas = 0;
      
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
        
        // 🔥 Não filtra por modalidade - pega todas as linhas com o mesmo CNPJ e data
        if (cnpjLinha === cnpjLimpo && dataLinha === dataAlvoNormalizada) {
          linhasParaExcluir.push(i + 1);
          linhasEncontradas++;
        }
      }
      
      console.log(`📌 Encontradas ${linhasEncontradas} linhas para exclusão (todas as modalidades)`);
    }
    
    if (linhasParaExcluir.length === 0) {
      return { success: false, message: "Nenhuma linha encontrada para excluir." };
    }
    
    // Ordena decrescente para excluir de baixo para cima
    linhasParaExcluir.sort((a, b) => b - a);
    let excluidas = 0;
    for (let i = 0; i < linhasParaExcluir.length; i++) {
      const linha = parseInt(linhasParaExcluir[i]);
      if (linha > 1 && linha <= sheet.getLastRow()) {
        sheet.deleteRow(linha);
        excluidas++;
        console.log(`✅ Linha ${linha} excluída`);
      } else {
        console.warn(`⚠️ Linha ${linha} inválida ou fora do intervalo`);
      }
    }
    
    SpreadsheetApp.flush();
    return { success: true, message: `${excluidas} linha(s) excluída(s).` };
    
  } catch (e) {
    console.error("❌ Erro em excluirPedidoPlanilha:", e);
    return { success: false, message: e.toString() };
  }
}
function listarLinhasDoPedido(idUnico, origem, modalidade) {
  try {
    const ss = origem === "PARCEIRO" 
      ? SpreadsheetApp.openById("1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4")
      : SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("VENDAS");
    if (!sheet) return { success: false, message: "Aba VENDAS não encontrada" };

    const partes = idUnico.split("|");
    const cnpjAlvo = partes[0] || "";
    const dataAlvoStr = partes[1] || "";
    // Ignoramos a modalidade (partes[2]) - retornamos todas as linhas do pedido

    console.log(`🔍 listarLinhasDoPedido: CNPJ=${cnpjAlvo}, Data=${dataAlvoStr} (todas as modalidades)`);

    const cnpjLimpo = cnpjAlvo.replace(/\D/g, '');
    let dataAlvoNormalizada = "";
    if (dataAlvoStr.includes("/")) {
      dataAlvoNormalizada = dataAlvoStr;
    } else if (dataAlvoStr.includes("-")) {
      const [ano, mes, dia] = dataAlvoStr.split("-");
      dataAlvoNormalizada = `${dia}/${mes}/${ano}`;
    } else {
      dataAlvoNormalizada = dataAlvoStr;
    }

    const data = sheet.getDataRange().getValues();
    const linhas = [];

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
      
      // 🔥 NÃO FILTRA POR MODALIDADE - pega todas as linhas com o mesmo CNPJ e data
      if (cnpjLinha === cnpjLimpo && dataLinha === dataAlvoNormalizada) {
        const numero = row[6] || "Número não informado"; // Coluna G
        linhas.push({ linha: i + 1, numero: String(numero) });
      }
    }

    return { success: true, linhas: linhas };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}
function getSafe(array, index, defaultValue = "") {
  return (array && array.length > index) ? array[index] : defaultValue;
}
/**
 * 💡 ARQUITETURA MULTI-TENANT (Roteamento Dinâmico)
 * Roteia as vendas para o banco de dados próprio do parceiro (Coluna J)
 */
function getBancoDeDadosUsuario(matricula) {
  const ID_CENTRAL = "1GHSetH90ei7WRwcj9YYTQ6V1WihD_GYMXPV4M15FFZ4"; 
  const ssCentral = SpreadsheetApp.openById(ID_CENTRAL);
  
  if (!matricula) {
    console.warn("⚠️ Matrícula não informada. Conectando ao Banco Central.");
    return ssCentral;
  }

  try {
    const sheetUsers = ssCentral.getSheetByName("USERS");
    const dataUsers = sheetUsers.getDataRange().getDisplayValues();
    let dbPersonalizadoId = "";

    // Procura o usuário: Matrícula na coluna A (Índice 0), BD na coluna J (Índice 9)
    for (let i = 1; i < dataUsers.length; i++) {
      if (String(dataUsers[i][0]).trim().toLowerCase() === String(matricula).trim().toLowerCase()) {
        dbPersonalizadoId = String(dataUsers[i][9]).trim(); 
        break;
      }
    }

    // Se a coluna J tem um ID válido (IDs do Sheets têm mais de 20 caracteres)
    if (dbPersonalizadoId && dbPersonalizadoId.length > 20) {
      const ssParceiro = SpreadsheetApp.openById(dbPersonalizadoId);
      console.log(`🚀 Roteamento Ativo: Banco exclusivo do usuário ${matricula} conectado.`);
      return ssParceiro;
    }
    
  } catch (erro) {
    console.error(`❌ Erro ao tentar rotear banco para ${matricula}. Detalhe:`, erro.message);
  }

  // Fallback de Segurança: Se não tiver ID na coluna J ou der erro de permissão
  console.log(`🛡️ Roteamento Fallback: Banco Central acionado para ${matricula}.`);
  return ssCentral;
}
////////////////////////////////FATURAS.HTML///////////////////////////////
/**
 * =======================================================
 * VEXO HUB - MOTOR DO COCKPIT DE RECEBÍVEIS
 * =======================================================
 */
function buscarFaturasPainel() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const aba = ss.getSheetByName("FATURAS");
    
    if (!aba) {
      return { sucesso: false, erro: "Aba 'FATURAS' não encontrada. Verifique se o nome está correto." };
    }
    
    const dados = aba.getDataRange().getValues();
    if (dados.length <= 1) return { sucesso: true, faturas: [] }; // Aba vazia
    
    const faturas = [];
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    
    // O loop ignora o cabeçalho (i=1)
    for (let i = 1; i < dados.length; i++) {
      const linha = dados[i];
      
      // Captura a data de vencimento e ajusta o timezone
      let dataVenc = new Date(linha[6]); 
      let diasAtraso = 0;
      let vencimentoValido = !isNaN(dataVenc.getTime());
      
      if (vencimentoValido && linha[8] !== "PAGO") {
         const diffTempo = hoje.getTime() - dataVenc.getTime();
         diasAtraso = Math.floor(diffTempo / (1000 * 3600 * 24));
      }

      faturas.push({
        idRow: i + 1,
        codigoCliente: linha[0],
        nomeCliente: linha[1],
        cpfCnpj: linha[2],
        plano: linha[3],
        linhaTelefone: linha[4],
        mesParcela: linha[5],
        dataVencimentoFormatada: vencimentoValido ? Utilities.formatDate(dataVenc, Session.getScriptTimeZone(), "dd/MM/yyyy") : "Inválida",
        riscoTim: linha[7], // CRÍTICO ou NORMAL
        statusPagamento: linha[8], // PENDENTE, PAGO, ATRASADO
        origem: linha[9],
        telefoneWpp: linha[10],
        diasAtraso: diasAtraso > 0 ? diasAtraso : 0,
        venceEmDias: diasAtraso < 0 ? Math.abs(diasAtraso) : 0
      });
    }
    
    return { sucesso: true, faturas: faturas };
    
  } catch (erro) {
    return { sucesso: false, erro: erro.toString() };
  }
}
/**
/**
 * ============================================================================
 * API INTERNA - VEXO HUB (VERSÃO ULTRARRÁPIDA COM AGRUPAMENTO)
 * ============================================================================
 */
function obterDadosFaturasFrontend() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const aba = ss.getSheetByName('FATURAS');
  
  if (!aba) {
    return JSON.stringify({ erro: "Aba FATURAS não encontrada no VEXO." });
  }

  const dados = aba.getDataRange().getValues();
  if (dados.length <= 1) {
    return JSON.stringify({ clientes: [] });
  }

  // Lê as notas de todas as células
  const notas = aba.getRange(1, 1, dados.length, dados[0].length).getNotes();

  let mapaClientes = new Map();

  for (let i = 1; i < dados.length; i++) {
    let linha = dados[i];
    let codigoCliente = String(linha[0]).trim();
    if (!codigoCliente) continue;

    if (!mapaClientes.has(codigoCliente)) {
      mapaClientes.set(codigoCliente, {
        codigoCliente: codigoCliente,
        nomeCliente: linha[1],
        nomeResponsavel: linha[2],
        cpfCnpj: linha[3],
        origem: linha[6],
        contatoFinanceiro: linha[7],
        email: linha[8],
        dataCadastro: linha[9] ? new Date(linha[9]).toISOString() : "",
        linhasTelefonicas: []
      });
    }

    let cliente = mapaClientes.get(codigoCliente);

    let pacoteLinha = {
      linhaPlanilha: i + 1,
      plano: linha[4],
      numero: linha[5],
      faturas: []
    };

    let indexAtual = 10; // primeira coluna de data (VENC. M1)
    for (let m = 1; m <= 24; m++) {
      let dataVenc = linha[indexAtual];
      let statusFatura = linha[indexAtual + 1];
      let notaData = notas[i][indexAtual] || ""; // nota da célula de data
      
      // Extrai a data de pagamento da nota (se existir)
      let dataPagamento = null;
      let regexPago = /Pago em (\d{2}\/\d{2}\/\d{4})/;
      let match = notaData.match(regexPago);
      if (match) {
        let partes = match[1].split('/');
        dataPagamento = new Date(partes[2], partes[1]-1, partes[0]);
        dataPagamento.setHours(0, 0, 0, 0);
      }

      if (dataVenc) {
        pacoteLinha.faturas.push({
          mes: m,
          vencimento: new Date(dataVenc).toISOString(),
          status: statusFatura,
          colunaStatusPlanilha: (indexAtual + 1) + 1, // coluna do status (ajuste)
          dataPagamento: dataPagamento ? dataPagamento.toISOString() : null
        });
      }
      indexAtual += 2;
    }

    cliente.linhasTelefonicas.push(pacoteLinha);
  }

  return JSON.stringify({ clientes: Array.from(mapaClientes.values()) });
}
function atualizarStatusFatura(linha, coluna) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const aba = ss.getSheetByName('FATURAS');
  aba.getRange(linha, coluna).setValue("PAGO");
  return "OK";
}
/**
 * Atualiza múltiplas células de status de fatura para "PAGO"
 * @param {Array} celulas - Array de objetos {linha: int, coluna: int}
 */
function atualizarStatusFaturas(celulas) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const aba = ss.getSheetByName('FATURAS');
    if (!aba) {
      return { success: false, message: "Aba FATURAS não encontrada." };
    }

    let atualizadas = 0;
    celulas.forEach(cell => {
      const linha = parseInt(cell.linha);
      const coluna = parseInt(cell.coluna);
      if (!isNaN(linha) && !isNaN(coluna) && linha > 0 && coluna > 0) {
        aba.getRange(linha, coluna).setValue("PAGO");
        atualizadas++;
      }
    });

    SpreadsheetApp.flush();
    return { success: true, message: `${atualizadas} fatura(s) atualizada(s).` };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}
/**
 * Atualiza status de faturas para "PAGO" e registra log na célula de data
 * @param {Array} celulas - Array de objetos {linha, coluna} (coluna é a coluna de STATUS)
 * @param {string} nomeUsuario - Nome do usuário que realizou a ação
 */
function atualizarStatusFaturasComLog(celulas, nomeUsuario) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const aba = ss.getSheetByName('FATURAS');
    if (!aba) {
      return { success: false, message: "Aba FATURAS não encontrada." };
    }

    const agora = new Date();
    const dataHora = Utilities.formatDate(agora, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    const usuario = nomeUsuario || "Sistema";

    let atualizadas = 0;
    celulas.forEach(cell => {
      const linha = parseInt(cell.linha);
      const colunaStatus = parseInt(cell.coluna);
      if (!isNaN(linha) && !isNaN(colunaStatus) && linha > 0 && colunaStatus > 0) {
        // Atualiza status para PAGO
        aba.getRange(linha, colunaStatus).setValue("PAGO");
        
        // Coluna da data de vencimento é a coluna anterior (colunaStatus - 1)
        const colunaData = colunaStatus - 1;
        if (colunaData > 0) {
          const rangeData = aba.getRange(linha, colunaData);
          // Pega a nota atual da célula de data
          let notaAtual = rangeData.getNote() || "";
          // Conta quantos registros de log existem (baseado em linhas com "Pago em")
          const regex = /Pago em/g;
          const matches = (notaAtual.match(regex) || []).length;
          const contador = matches + 1;
          
          // Monta o novo log
          const log = `Pago em ${dataHora} por ${usuario} - Cobrança #${contador}\n`;
          // Adiciona ao início da nota (para manter histórico cronológico reverso)
          const novaNota = log + notaAtual;
          rangeData.setNote(novaNota);
        }
        atualizadas++;
      }
    });

    SpreadsheetApp.flush();
    return { success: true, message: `${atualizadas} fatura(s) atualizada(s) e logs adicionados.` };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}
/**
 * Estorna o status de faturas de "PAGO" para "PENDENTE" e remove o último log da nota
 * @param {Array} celulas - Array de objetos {linha, coluna} (coluna é a coluna de STATUS)
 * @param {string} nomeUsuario - Nome do usuário que realizou a ação (para log opcional)
 */
function estornarStatusFaturas(celulas, nomeUsuario) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const aba = ss.getSheetByName('FATURAS');
    if (!aba) {
      return { success: false, message: "Aba FATURAS não encontrada." };
    }

    let atualizadas = 0;
    celulas.forEach(cell => {
      const linha = parseInt(cell.linha);
      const colunaStatus = parseInt(cell.coluna);
      if (!isNaN(linha) && !isNaN(colunaStatus) && linha > 0 && colunaStatus > 0) {
        // Altera status para PENDENTE
        aba.getRange(linha, colunaStatus).setValue("PENDENTE");
        
        // Coluna da data de vencimento (coluna anterior)
        const colunaData = colunaStatus - 1;
        if (colunaData > 0) {
          const rangeData = aba.getRange(linha, colunaData);
          let notaAtual = rangeData.getNote() || "";
          // Remove a primeira linha da nota (último log adicionado)
          const linhasNota = notaAtual.split('\n');
          // Remove a primeira linha se começar com "Pago em" ou "Estornado em"
          if (linhasNota.length > 0 && (linhasNota[0].startsWith('Pago em') || linhasNota[0].startsWith('Estornado em'))) {
            linhasNota.splice(0, 1);
          }
          // Remove linhas vazias no início
          while (linhasNota.length > 0 && linhasNota[0].trim() === '') {
            linhasNota.splice(0, 1);
          }
          const novaNota = linhasNota.join('\n').trim();
          rangeData.setNote(novaNota);
        }
        atualizadas++;
      }
    });

    SpreadsheetApp.flush();
    return { success: true, message: `${atualizadas} fatura(s) estornada(s).` };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}
function registrarLogWhatsApp(celulas, nomeUsuario) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const aba = ss.getSheetByName('FATURAS');
    if (!aba) {
      return { success: false, message: "Aba FATURAS não encontrada." };
    }

    const agora = new Date();
    const dataHora = Utilities.formatDate(agora, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
    const usuario = nomeUsuario || "Sistema";

    let atualizadas = 0;
    celulas.forEach(cell => {
      const linha = parseInt(cell.linha);
      const colunaStatus = parseInt(cell.coluna);
      if (!isNaN(linha) && !isNaN(colunaStatus) && linha > 0 && colunaStatus > 0) {
        const colunaData = colunaStatus - 1;
        if (colunaData > 0) {
          const rangeData = aba.getRange(linha, colunaData);
          let notaAtual = rangeData.getNote() || "";
          const regex = /WhatsApp enviado em/g;
          const matches = (notaAtual.match(regex) || []).length;
          const contador = matches + 1;
          const log = `WhatsApp enviado em ${dataHora} por ${usuario} - #${contador}\n`;
          const novaNota = log + notaAtual;
          rangeData.setNote(novaNota);
        }
        atualizadas++;
      }
    });

    SpreadsheetApp.flush();
    return { success: true, message: `${atualizadas} logs de WhatsApp registrados.` };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}





/**
 * GATILHO EM TEMPO REAL - Atualiza a aba FATURAS quando a coluna AK (Data RADAR) é alterada
 * Este gatilho é ativado automaticamente sempre que a planilha VENDAS for editada.
 * 
 * 🔥 ATENÇÃO: Configure o gatilho no Apps Script com o nome "onEditTrigger"
 */
function onEditTrigger(e) {
  try {
    // Verifica se a edição foi na aba VENDAS
    const sheet = e.source.getActiveSheet();
    if (sheet.getName() !== "VENDAS") return;

    const range = e.range;
    const colunaEditada = range.getColumn();
    const linhaEditada = range.getRow();

    // Coluna AK é a 37 (A=1, B=2, ..., AK=37)
    const COLUNA_AK = 37;
    const COLUNA_MODALIDADE = 5;  // Coluna E
    const COLUNA_CNPJ = 3;        // Coluna C
    const COLUNA_NOME = 4;        // Coluna D
    const COLUNA_PLANO = 6;       // Coluna F
    const COLUNA_LINHA = 7;       // Coluna G
    const COLUNA_RESPONSAVEL = 20; // Coluna T
    const COLUNA_EMAIL = 21;      // Coluna U
    const COLUNA_CONTATO_FIN = 22; // Coluna V
    const COLUNA_CODIGO_CLIENTE = 32; // Coluna AF
    const COLUNA_DATA_VENC_BASE = 1; // Coluna A
    const COLUNA_DATA_PRIMEIRO_CAD = 2; // Coluna B

    // Só executa se a edição foi na coluna AK (Data RADAR)
    if (colunaEditada !== COLUNA_AK) return;

    // Pula a linha de cabeçalho
    if (linhaEditada === 1) return;

    Logger.log(`🔄 [onEditTrigger] Alteração detectada na linha ${linhaEditada}, coluna AK`);

    // Obtém os dados da linha editada (38 colunas = A até AL)
    const dadosLinha = sheet.getRange(linhaEditada, 1, 1, 38).getValues()[0];
    
    const modalidade = dadosLinha[COLUNA_MODALIDADE - 1] || "";
    const dataRadar = dadosLinha[COLUNA_AK - 1];
    const cnpj = dadosLinha[COLUNA_CNPJ - 1] || "";
    const nomeCliente = dadosLinha[COLUNA_NOME - 1] || "";
    const plano = dadosLinha[COLUNA_PLANO - 1] || "";
    const linhaTel = dadosLinha[COLUNA_LINHA - 1] || "";
    const nomeResponsavel = dadosLinha[COLUNA_RESPONSAVEL - 1] || "";
    const email = dadosLinha[COLUNA_EMAIL - 1] || "";
    const contatoFinanceiro = dadosLinha[COLUNA_CONTATO_FIN - 1] || "";
    const codigoCliente = dadosLinha[COLUNA_CODIGO_CLIENTE - 1] || "";
    const dataVencBase = dadosLinha[COLUNA_DATA_VENC_BASE - 1];
    const dataPrimeiroCad = dadosLinha[COLUNA_DATA_PRIMEIRO_CAD - 1];

    // 🔥 Se for RENEG, ignora e remove da FATURAS se existir
    if (modalidade && modalidade.toString().toUpperCase().trim() === "RENEG") {
      Logger.log(`⏭️ [onEditTrigger] RENEG detectada, removendo da FATURAS se existir.`);
      removerClienteDaAbaFaturas(cnpj, linhaTel);
      return;
    }

    // Se a data RADAR foi preenchida
    if (dataRadar && dataRadar.toString().trim() !== "") {
      Logger.log(`✅ [onEditTrigger] Data RADAR preenchida: ${dataRadar}. Atualizando FATURAS...`);
      
      // Monta um objeto com os dados da venda
      const venda = {
        codigoCliente: codigoCliente,
        nomeCliente: nomeCliente,
        nomeResponsavel: nomeResponsavel,
        cpfCnpj: cnpj,
        plano: plano,
        linhaTel: linhaTel,
        contatoFinanceiro: contatoFinanceiro,
        email: email,
        dataVencBase: dataVencBase,
        dataPrimeiroCad: dataPrimeiroCad,
        dataAtivacao: dataRadar,
        modalidade: modalidade,
        origem: "VEXO PRÓPRIO (tempo real)"
      };

      // Processa e insere/atualiza na FATURAS
      processarVendaIndividualParaFaturas(venda);
      
    } else {
      // Se a data RADAR foi removida (campo vazio), remove o cliente da FATURAS
      Logger.log(`🗑️ [onEditTrigger] Data RADAR removida. Removendo da FATURAS...`);
      removerClienteDaAbaFaturas(cnpj, linhaTel);
    }

  } catch (error) {
    Logger.log(`❌ [onEditTrigger] Erro: ${error.message}`);
  }
}

// ================================================================
// FUNÇÃO AUXILIAR: Processa uma venda individual e atualiza a FATURAS
// ================================================================
function processarVendaIndividualParaFaturas(venda) {
  try {
    // 🔥 LOG DE ENTRADA PARA DIAGNÓSTICO
    Logger.log(`📥 [processarVendaIndividualParaFaturas] Dados recebidos:`);
    Logger.log(`   - dataVencBase: ${venda.dataVencBase} (tipo: ${typeof venda.dataVencBase})`);
    Logger.log(`   - dataAtivacao: ${venda.dataAtivacao}`);
    Logger.log(`   - codigoCliente: ${venda.codigoCliente}`);
    Logger.log(`   - linhaTel: ${venda.linhaTel}`);

    // 🔥 1. EXTRAIR DIA DE VENCIMENTO (COLUNA A) - VERSÃO ROBUSTA
    let diaVencimento = 20; // fallback
    let dataVencBaseRaw = venda.dataVencBase;

    if (dataVencBaseRaw !== undefined && dataVencBaseRaw !== null && dataVencBaseRaw !== "") {
      // Caso 1: É um objeto Date
      if (dataVencBaseRaw instanceof Date && !isNaN(dataVencBaseRaw.getTime())) {
        diaVencimento = dataVencBaseRaw.getDate();
        Logger.log(`📅 Dia extraído de Date: ${diaVencimento}`);
      }
      // Caso 2: É um número (ex: 15, 20, 45567 - número serial do Excel)
      else if (typeof dataVencBaseRaw === 'number') {
        // Se for um número entre 1 e 31, é o dia diretamente
        if (dataVencBaseRaw >= 1 && dataVencBaseRaw <= 31) {
          diaVencimento = Math.floor(dataVencBaseRaw);
          Logger.log(`📅 Dia extraído de número (1-31): ${diaVencimento}`);
        } else {
          // Tenta converter número serial do Excel para data e extrair o dia
          const dataSerial = new Date((dataVencBaseRaw - 25569) * 86400 * 1000);
          if (!isNaN(dataSerial.getTime())) {
            diaVencimento = dataSerial.getDate();
            Logger.log(`📅 Dia extraído de número serial (Excel): ${diaVencimento}`);
          }
        }
      }
      // Caso 3: É uma string
      else if (typeof dataVencBaseRaw === 'string') {
        const str = dataVencBaseRaw.trim();
        // Tenta extrair o dia no início (ex: "15/08/2026", "15", "15.0")
        const match = str.match(/^(\d{1,2})/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num >= 1 && num <= 31) {
            diaVencimento = num;
            Logger.log(`📅 Dia extraído de string (regex): ${diaVencimento}`);
          }
        } else {
          // Tenta converter a string para data
          const dataTest = new Date(str);
          if (!isNaN(dataTest.getTime())) {
            diaVencimento = dataTest.getDate();
            Logger.log(`📅 Dia extraído de string (via Date): ${diaVencimento}`);
          }
        }
      }
      // Caso 4: Outros tipos (boolean, etc.) - ignora
      else {
        Logger.log(`⚠️ Tipo de dataVencBase não reconhecido: ${typeof dataVencBaseRaw}`);
      }
    } else {
      Logger.log(`⚠️ dataVencBase está vazio ou null. Usando dia padrão 20.`);
    }

    // Validação final do dia
    if (diaVencimento < 1 || diaVencimento > 31) {
      Logger.log(`⚠️ Dia inválido: ${diaVencimento}. Usando 20 como padrão.`);
      diaVencimento = 20;
    }

    Logger.log(`📅 DIA DE VENCIMENTO DEFINITIVO: ${diaVencimento}`);

    // 🔥 2. VALIDA A DATA DE ATIVAÇÃO
    let dataAtivacaoObj = null;
    if (venda.dataAtivacao) {
      if (venda.dataAtivacao instanceof Date) {
        dataAtivacaoObj = new Date(venda.dataAtivacao);
      } else {
        dataAtivacaoObj = new Date(venda.dataAtivacao);
      }
    }
    if (!dataAtivacaoObj || isNaN(dataAtivacaoObj.getTime())) {
      Logger.log(`⚠️ Data de ativação inválida: "${venda.dataAtivacao}". Usando data atual.`);
      dataAtivacaoObj = new Date();
    }

    // 🔥 3. DATA PARA A COLUNA J (DATA DE ATIVAÇÃO)
    // Agora a coluna J será preenchida com a data de ativação (AK), não com dataPrimeiroCad
    let dataParaColunaJ = dataAtivacaoObj;
    // Se a data de ativação for inválida, usa a data atual
    if (!dataParaColunaJ || isNaN(dataParaColunaJ.getTime())) {
      dataParaColunaJ = new Date();
    }

    // 🔥 4. CRIA OBJETO TRATADO
    const vendaTratada = {
      codigoCliente: venda.codigoCliente || "",
      nomeCliente: venda.nomeCliente || "",
      nomeResponsavel: venda.nomeResponsavel || "",
      cpfCnpj: venda.cpfCnpj || "",
      plano: venda.plano || "",
      linhaTel: venda.linhaTel || "",
      origem: venda.origem || "VEXO PRÓPRIO",
      contatoFinanceiro: venda.contatoFinanceiro || "",
      email: venda.email || "",
      dataAtivacao: dataAtivacaoObj,
      dataColunaJ: dataParaColunaJ,   // 🔥 NOVO: data para coluna J
      diaVencimento: diaVencimento
    };

    // 🔥 5. CONTINUAÇÃO (INSERIR/ATUALIZAR NA FATURAS)
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let abaFaturas = ss.getSheetByName('FATURAS');
    
    if (!abaFaturas) {
      abaFaturas = ss.insertSheet('FATURAS');
      let cabecalho = ["CÓDIGO CLIENTE", "NOME CLIENTE", "RESPONSÁVEL", "CPF/CNPJ", "PLANO", "LINHA", "ORIGEM", "CONTATO FINANCEIRO", "E-MAIL", "DATA 1º CADASTRO"];
      for (let m = 1; m <= 24; m++) {
        cabecalho.push(`VENC. M${m}`);
        cabecalho.push(`STATUS M${m}`);
      }
      abaFaturas.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho])
        .setFontWeight("bold").setBackground("#1e3c72").setFontColor("white");
      abaFaturas.setFrozenRows(1);
      abaFaturas.setFrozenColumns(6);
    }

    const dadosFaturas = abaFaturas.getDataRange().getValues();
    let linhaExistente = -1;
    for (let i = 1; i < dadosFaturas.length; i++) {
      const codigo = String(dadosFaturas[i][0] || "").trim();
      const linha = String(dadosFaturas[i][5] || "").trim();
      if (codigo === String(vendaTratada.codigoCliente).trim() && linha === String(vendaTratada.linhaTel).trim()) {
        linhaExistente = i + 1;
        break;
      }
    }

    const novaLinha = montarLinhaFatura(vendaTratada);

    if (linhaExistente !== -1) {
      const totalColunas = novaLinha.length;
      abaFaturas.getRange(linhaExistente, 1, 1, totalColunas).setValues([novaLinha]);
      Logger.log(`🔄 Linha ${linhaExistente} atualizada na FATURAS (dia de vencimento: ${diaVencimento}).`);
    } else {
      abaFaturas.appendRow(novaLinha);
      Logger.log(`➕ Nova linha inserida na FATURAS (dia de vencimento: ${diaVencimento}).`);
    }

    SpreadsheetApp.flush();
    return true;

  } catch (e) {
    Logger.log(`❌ [processarVendaIndividualParaFaturas] Erro: ${e.message}`);
    return false;
  }
}
// ================================================================
// FUNÇÃO AUXILIAR: Monta a linha para inserir na FATURAS
// ================================================================
function montarLinhaFatura(venda) {
  // 🔥 DATA DE ATIVAÇÃO
  let dtAtivacaoObj = venda.dataAtivacao instanceof Date ? venda.dataAtivacao : new Date(venda.dataAtivacao);
  if (isNaN(dtAtivacaoObj.getTime())) {
    Logger.log(`⚠️ Data de ativação inválida. Usando data atual.`);
    dtAtivacaoObj = new Date();
  }

  // 🔥 DIA DE VENCIMENTO - USAR O QUE FOI PASSADO
  let diaEscolhido = venda.diaVencimento || 20;
  
  // Validação do dia
  if (diaEscolhido < 1 || diaEscolhido > 31) {
    Logger.log(`⚠️ Dia de vencimento inválido: ${diaEscolhido}. Usando 20.`);
    diaEscolhido = 20;
  }

  Logger.log(`📅 [montarLinhaFatura] Dia de vencimento usado: ${diaEscolhido}`);

  // =========================================================
  // CÁLCULO DA PRIMEIRA FATURA
  // =========================================================
  let dataPrimeiraFatura = new Date(dtAtivacaoObj.getFullYear(), dtAtivacaoObj.getMonth(), diaEscolhido);
  if (dataPrimeiraFatura <= dtAtivacaoObj) {
    dataPrimeiraFatura.setMonth(dataPrimeiraFatura.getMonth() + 1);
  }
  
  let diffDias = Math.floor((dataPrimeiraFatura - dtAtivacaoObj) / (1000 * 3600 * 24));
  if (diffDias < 10) {
    dataPrimeiraFatura.setMonth(dataPrimeiraFatura.getMonth() + 1);
  }

  // =========================================================
  // MONTAGEM DA LINHA
  // =========================================================
  const codigoFormatado = venda.codigoCliente ? String(venda.codigoCliente).trim() : "";

  // 🔥 DATA PARA A COLUNA J: usar a data de ativação (venda.dataColunaJ)
  let dataColunaJ = venda.dataColunaJ instanceof Date ? venda.dataColunaJ : new Date();
  if (isNaN(dataColunaJ.getTime())) {
    dataColunaJ = new Date();
  }

  let linhaCliente = [
    codigoFormatado,
    venda.nomeCliente || "",
    venda.nomeResponsavel || "",
    venda.cpfCnpj || "",
    venda.plano || "",
    venda.linhaTel || "",
    venda.origem || "VEXO PRÓPRIO",
    venda.contatoFinanceiro || "",
    venda.email || "",
    dataColunaJ  // 🔥 COLUNA J = DATA DE ATIVAÇÃO (AK)
  ];

  for (let mes = 1; mes <= 24; mes++) {
    let dataVencimentoMes = new Date(
      dataPrimeiraFatura.getFullYear(),
      dataPrimeiraFatura.getMonth() + (mes - 1),
      diaEscolhido
    );
    linhaCliente.push(dataVencimentoMes);
    linhaCliente.push("PENDENTE");
  }

  Logger.log(`✅ ${linhaCliente.length} colunas geradas. Data da coluna J: ${dataColunaJ}`);

  return linhaCliente;
}

// ================================================================
// FUNÇÃO AUXILIAR: Remove cliente da FATURAS (pelo CNPJ + linha)
// ================================================================
function removerClienteDaAbaFaturas(cnpj, linhaTel) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaFaturas = ss.getSheetByName('FATURAS');
    if (!abaFaturas) return false;

    const dados = abaFaturas.getDataRange().getValues();
    let linhasParaRemover = [];

    const cnpjBusca = String(cnpj).trim();
    const linhaBusca = String(linhaTel).trim();

    for (let i = 1; i < dados.length; i++) {
      const cnpjAtual = String(dados[i][3] || "").trim();
      const linhaAtual = String(dados[i][5] || "").trim();
      if (cnpjAtual === cnpjBusca && linhaAtual === linhaBusca) {
        linhasParaRemover.push(i + 1);
      }
    }

    linhasParaRemover.sort((a, b) => b - a);
    linhasParaRemover.forEach(linha => {
      abaFaturas.deleteRow(linha);
    });

    if (linhasParaRemover.length > 0) {
      Logger.log(`🗑️ ${linhasParaRemover.length} linha(s) removidas da FATURAS.`);
    }

    SpreadsheetApp.flush();
    return true;

  } catch (e) {
    Logger.log(`❌ [removerClienteDaAbaFaturas] Erro: ${e.message}`);
    return false;
  }
}




function criarGatilhoOnEdit() {
  // Remove gatilhos antigos para evitar duplicação
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'onEditTrigger') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Cria o novo gatilho
  ScriptApp.newTrigger('onEditTrigger')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onEdit()
    .create();
  
  Logger.log("✅ Gatilho onEditTrigger criado com sucesso!");
}

/**
 * Retorna a lista de parceiros ativos com banco de dados próprio.
 * Usado pelo módulo financeiro para popular o select de parceiros.
 * @returns {Array} Lista de parceiros { matricula, nome, bancoDeDadosId, cargo, email, status }
 */
function listarParceiros() {
  return getListaParceirosComBancoProprio();
}
/**
 * Garante que a coluna "ULTIMA_ATUALIZACAO" exista na aba PROSPECCAO
 * (coluna X, índice 24, mas pode ser dinâmico)
 */
function garantirColunaUltimaAtualizacao() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("PROSPECCAO");
  if (!sheet) return;

  const COL_AS = 45; // Coluna AS

  // 1. Garante que a planilha tenha pelo menos 45 colunas
  if (sheet.getLastColumn() < COL_AS) {
    sheet.insertColumns(sheet.getLastColumn() + 1, COL_AS - sheet.getLastColumn());
  }

  // 2. Verifica o cabeçalho da coluna AS
  const headerCell = sheet.getRange(1, COL_AS);
  if (headerCell.getValue() !== "ULTIMA_ATUALIZACAO") {
    headerCell.setValue("ULTIMA_ATUALIZACAO");
    headerCell.setFontWeight("bold").setBackground("#2c3e50").setFontColor("white");
  }

  // 3. Preenche a coluna AS com a data atual para leads existentes que estão vazios
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const dataRange = sheet.getRange(2, COL_AS, lastRow - 1, 1);
    const dataValues = dataRange.getValues();
    const dataAtual = new Date();
    let precisaAtualizar = false;

    for (let i = 0; i < dataValues.length; i++) {
      if (!dataValues[i][0] || dataValues[i][0] === "") {
        dataValues[i][0] = dataAtual;
        precisaAtualizar = true;
      }
    }

    if (precisaAtualizar) {
      dataRange.setValues(dataValues);
    }
  }
}