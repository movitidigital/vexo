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
  async function tentarAPI(url, headers = {}, mapearDados = (d) => d, timeoutMs = 2500) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeoutId);

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

      const dadosMapeados = mapearDados(data);

      // Validação: Se a Razão Social estiver vazia, considera falha e vai para a próxima
      if (!dadosMapeados.razao_social || dadosMapeados.razao_social.trim() === '') {
        console.warn(`[API] ${url} retornou Razão Social vazia. Tentando próxima...`);
        return null;
      }

      return dadosMapeados;
    } catch (e) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        console.warn(`[API] ${url} excedeu o tempo limite. Abortando...`);
      } else {
        console.warn(`[API] Falha na requisição para ${url}:`, e.message);
      }
      return null;
    }
  }

  // ==========================================
  // TENTATIVA 1: BrasilAPI
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
      uf: d.uf || '',
      data_inicio_atividade: d.data_inicio_atividade || '',
      natureza_juridica: d.natureza_juridica || '',
      ddd_telefone_1: d.ddd_telefone_1 || d.telefone_1 || ''
    })
  );

  if (brasilApiData) {
    console.log(`✅ [CNPJ] Dados obtidos via BrasilAPI para ${cnpjLimpo}`);
    return res.status(200).json(brasilApiData);
  }

  // ==========================================
  // TENTATIVA 2: OpenCNPJ
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
      municipio: d.municipio || '',
      uf: d.uf || '',
      data_inicio_atividade: d.data_abertura || d.data_inicio_atividade || '',
      natureza_juridica: d.natureza_juridica || '',
      ddd_telefone_1: d.telefone || d.ddd_telefone_1 || ''
    })
  );

  if (openCnpjData) {
    console.log(`✅ [CNPJ] Dados obtidos via OpenCNPJ para ${cnpjLimpo}`);
    return res.status(200).json(openCnpjData);
  }

  // ==========================================
  // TENTATIVA 3: publica.cnpj.ws
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
      municipio: d.estabelecimento?.cidade?.nome || '', 
      uf: d.estabelecimento?.estado?.sigla || '',
      data_inicio_atividade: d.estabelecimento?.data_inicio_atividade || '',
      natureza_juridica: d.natureza_juridica?.descricao || '',
      ddd_telefone_1: (d.estabelecimento?.ddd1 && d.estabelecimento?.telefone1) 
                      ? `${d.estabelecimento.ddd1}${d.estabelecimento.telefone1}` 
                      : (d.estabelecimento?.telefone1 || '')
    })
  );

  if (cnpjWsData) {
    console.log(`✅ [CNPJ] Dados obtidos via publica.cnpj.ws para ${cnpjLimpo}`);
    return res.status(200).json(cnpjWsData);
  }

  // ==========================================
  // TENTATIVA 4: cnpj.pw
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
      uf: d.uf || '',
      data_inicio_atividade: d.data_abertura || d.data_inicio_atividade || '',
      natureza_juridica: d.natureza_juridica || '',
      ddd_telefone_1: d.telefone || d.ddd_telefone_1 || ''
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
