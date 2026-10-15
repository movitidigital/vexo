// api/cnpj.js
module.exports = async function handler(req, res) {
  const { cnpj } = req.query;

  if (!cnpj) {
    return res.status(400).json({ error: 'CNPJ é obrigatório' });
  }

  const cnpjLimpo = cnpj.replace(/\D/g, '');

  if (cnpjLimpo.length !== 14) {
    return res.status(400).json({ error: 'CNPJ inválido' });
  }

  // Função auxiliar para tentar uma API, tratar erros e validar o conteúdo
  async function tentarAPI(url, headers = {}, mapearDados = (d) => d) {
    try {
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        console.warn(`[API] ${url} retornou status ${response.status}`);
        return null;
      }

      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        console.warn(`[API] ${url} retornou corpo vazio`);
        return null;
      }

      const data = JSON.parse(responseText);
      if (!data || Object.keys(data).length === 0) {
        console.warn(`[API] ${url} retornou JSON vazio`);
        return null;
      }

      // Mapeia os dados para o formato do VEXO
      const dadosMapeados = mapearDados(data);

      // 🔥 VALIDAÇÃO CRUCIAL: Se a Razão Social estiver vazia, consideramos falha e passamos para a próxima API
      if (!dadosMapeados.razao_social || dadosMapeados.razao_social.trim() === '') {
        console.warn(`[API] ${url} retornou Razão Social vazia. Tentando próxima...`);
        return null;
      }

      return dadosMapeados;
    } catch (e) {
      console.warn(`[API] Falha na requisição para ${url}:`, e.message);
      return null;
    }
  }

  // ==========================================
  // TENTATIVA 1: BrasilAPI (Com User-Agent)
  // ==========================================
  const brasilApiData = await tentarAPI(
    `https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`,
    { 'User-Agent': 'VEXO-Sistema/1.0 (https://vexo-umber.vercel.app)' },
    (d) => ({
      razao_social: d.razao_social || d.nome || '',
      cep: d.cep || '',
      logradouro: d.logradouro || '',
      numero: d.numero || '',
      bairro: d.bairro || '',
      municipio: d.municipio || '',
      uf: d.uf || ''
    })
  );

  if (brasilApiData) {
    console.log(`✅ [CNPJ] Dados obtidos via BrasilAPI para ${cnpjLimpo}`);
    return res.status(200).json(brasilApiData);
  }

  // ==========================================
  // TENTATIVA 2: OpenCNPJ (Nova API de fallback)
  // ==========================================
  console.log(`⚠️ [CNPJ] BrasilAPI falhou. Tentando OpenCNPJ...`);
  
  const openCnpjData = await tentarAPI(
    `https://api.opencnpj.org/${cnpjLimpo}`,
    {},
    (d) => ({
      razao_social: d.razao_social || '',
      cep: d.cep || '',
      logradouro: d.logradouro || '',
      numero: d.numero || '',
      bairro: d.bairro || '',
      municipio: d.municipio || '', // OpenCNPJ geralmente já traz o nome da cidade
      uf: d.uf || ''
    })
  );

  if (openCnpjData) {
    console.log(`✅ [CNPJ] Dados obtidos via OpenCNPJ para ${cnpjLimpo}`);
    return res.status(200).json(openCnpjData);
  }

  // ==========================================
  // TENTATIVA 3: publica.cnpj.ws (Fallback com mapeamento de cidade)
  // ==========================================
  console.log(`⚠️ [CNPJ] OpenCNPJ falhou. Tentando publica.cnpj.ws...`);
  
  const cnpjWsData = await tentarAPI(
    `https://publica.cnpj.ws/cnpj/${cnpjLimpo}`,
    {},
    (d) => ({
      razao_social: d.razao_social || '',
      cep: d.estabelecimento?.cep || '',
      logradouro: d.estabelecimento?.logradouro || '',
      numero: d.estabelecimento?.numero || '',
      bairro: d.estabelecimento?.bairro || '',
      // 🔥 Aqui está a correção do código IBGE: extrai o nome da cidade
      municipio: d.estabelecimento?.cidade?.nome || '', 
      uf: d.estabelecimento?.estado?.sigla || ''
    })
  );

  if (cnpjWsData) {
    console.log(`✅ [CNPJ] Dados obtidos via publica.cnpj.ws para ${cnpjLimpo}`);
    return res.status(200).json(cnpjWsData);
  }

  // ==========================================
  // TENTATIVA 4: cnpj.pw (Último recurso)
  // ==========================================
  console.log(`⚠️ [CNPJ] publica.cnpj.ws falhou. Tentando cnpj.pw...`);
  const cnpjPwData = await tentarAPI(
    `https://api.cnpj.pw/cnpj/${cnpjLimpo}`,
    {},
    (d) => ({
      razao_social: d.razao_social || d.nome || '',
      cep: d.cep || '',
      logradouro: d.logradouro || '',
      numero: d.numero || '',
      bairro: d.bairro || '',
      municipio: d.municipio || '', 
      uf: d.uf || ''
    })
  );

  if (cnpjPwData) {
    console.log(`✅ [CNPJ] Dados obtidos via cnpj.pw para ${cnpjLimpo}`);
    return res.status(200).json(cnpjPwData);
  }

  // ==========================================
  // FALHA TOTAL
  // ==========================================
  console.error(`❌ [CNPJ] Todas as APIs falharam ou retornaram dados incompletos para ${cnpjLimpo}`);
  return res.status(404).json({ 
    error: 'Não foi possível consultar os dados públicos deste CNPJ nas fontes disponíveis. Preencha os dados manualmente.' 
  });
};
