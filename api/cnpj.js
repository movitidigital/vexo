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

  // Função auxiliar para tentar uma API e tratar erros/respostas vazias
  async function tentarAPI(url, headers = {}, mapearDados = (d) => d) {
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        console.warn(`API ${url} retornou status ${response.status}`);
        return null;
      }
      const data = await response.json();
      if (!data || Object.keys(data).length === 0) {
        console.warn(`API ${url} retornou JSON vazio`);
        return null;
      }
      return mapearDados(data);
    } catch (e) {
      console.warn(`Falha na API ${url}:`, e.message);
      return null;
    }
  }

  // ==========================================
  // TENTATIVA 1: BrasilAPI (Com User-Agent)
  // ==========================================
  const brasilApiData = await tentarAPI(
    `https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`,
    { 'User-Agent': 'VEXO-Sistema/1.0 (https://vexo-umber.vercel.app)' }
  );

  if (brasilApiData) {
    console.log(`✅ [CNPJ] Dados obtidos via BrasilAPI para ${cnpjLimpo}`);
    return res.status(200).json(brasilApiData);
  }

  // ==========================================
  // TENTATIVA 2: publica.cnpj.ws (Fallback Principal)
  // ==========================================
  console.log(`⚠️ [CNPJ] BrasilAPI falhou. Tentando publica.cnpj.ws...`);
  
  const cnpjWsData = await tentarAPI(
    `https://publica.cnpj.ws/cnpj/${cnpjLimpo}`,
    {},
    (d) => ({
      razao_social: d.razao_social || '',
      cep: d.estabelecimento?.cep || '',
      logradouro: d.estabelecimento?.logradouro || '',
      numero: d.estabelecimento?.numero || '',
      bairro: d.estabelecimento?.bairro || '',
      municipio: d.estabelecimento?.cidade?.nome || '', // Converte o código IBGE para o Nome da Cidade
      uf: d.estabelecimento?.estado?.sigla || ''
    })
  );

  if (cnpjWsData) {
    console.log(`✅ [CNPJ] Dados obtidos via publica.cnpj.ws para ${cnpjLimpo}`);
    return res.status(200).json(cnpjWsData);
  }

  // ==========================================
  // TENTATIVA 3: cnpj.pw (Último recurso)
  // ==========================================
  console.log(`⚠️ [CNPJ] publica.cnpj.ws falhou. Tentando cnpj.pw...`);
  const cnpjPwData = await tentarAPI(`https://api.cnpj.pw/cnpj/${cnpjLimpo}`);

  if (cnpjPwData) {
    console.log(`✅ [CNPJ] Dados obtidos via cnpj.pw para ${cnpjLimpo}`);
    return res.status(200).json({
      razao_social: cnpjPwData.razao_social || cnpjPwData.nome || '',
      cep: cnpjPwData.cep || '',
      logradouro: cnpjPwData.logradouro || '',
      numero: cnpjPwData.numero || '',
      bairro: cnpjPwData.bairro || '',
      municipio: cnpjPwData.municipio || '', 
      uf: cnpjPwData.uf || ''
    });
  }

  // ==========================================
  // FALHA TOTAL
  // ==========================================
  console.error(`❌ [CNPJ] Todas as APIs falharam para ${cnpjLimpo}`);
  return res.status(404).json({ 
    error: 'Não foi possível consultar o CNPJ em nenhuma das fontes disponíveis. Preencha os dados manualmente.' 
  });
};
