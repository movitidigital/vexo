// api/cnpj.js
module.exports = async function handler(req, res) {
  const { cnpj } = req.query;

  // 1. Validação inicial
  if (!cnpj) {
    return res.status(400).json({ error: 'CNPJ é obrigatório' });
  }

  const cnpjLimpo = cnpj.replace(/\D/g, '');

  if (cnpjLimpo.length !== 14) {
    return res.status(400).json({ error: 'CNPJ inválido' });
  }

  // Função auxiliar para tentar uma API e tratar erros/respostas vazias
  async function tentarAPI(url, headers = {}) {
    try {
      const response = await fetch(url, { headers });
      
      // Se a resposta não for OK (ex: 404, 500), retorna null
      if (!response.ok) {
        console.warn(`API ${url} retornou status ${response.status}`);
        return null;
      }

      const responseText = await response.text();
      
      // Se o corpo da resposta estiver vazio, retorna null
      if (!responseText || responseText.trim() === '') {
        console.warn(`API ${url} retornou corpo vazio`);
        return null;
      }

      const data = JSON.parse(responseText);
      
      // Se o objeto JSON estiver vazio, retorna null
      if (!data || Object.keys(data).length === 0) {
        console.warn(`API ${url} retornou JSON vazio`);
        return null;
      }

      return data;
    } catch (e) {
      console.warn(`Falha na requisição para ${url}:`, e.message);
      return null;
    }
  }

  // ==========================================
  // TENTATIVA 1: BrasilAPI (Com User-Agent para evitar bloqueio 403)
  // ==========================================
  const brasilApiData = await tentarAPI(
    `https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`,
    { 
      'User-Agent': 'VEXO-Sistema/1.0 (https://vexo-umber.vercel.app)' 
    }
  );

  if (brasilApiData) {
    console.log(`✅ [CNPJ] Dados obtidos via BrasilAPI para ${cnpjLimpo}`);
    return res.status(200).json(brasilApiData);
  }

  // ==========================================
  // TENTATIVA 2: Fallback (cnpj.pw)
  // ==========================================
  console.log(`⚠️ [CNPJ] BrasilAPI falhou. Tentando cnpj.pw para ${cnpjLimpo}...`);
  
  const cnpjPwData = await tentarAPI(`https://api.cnpj.pw/cnpj/${cnpjLimpo}`);

  if (cnpjPwData) {
    console.log(`✅ [CNPJ] Dados obtidos via cnpj.pw para ${cnpjLimpo}`);
    
    // Mapeia os campos da cnpj.pw para o formato esperado pelo frontend do VEXO
    const dadosNormalizados = {
      razao_social: cnpjPwData.razao_social || cnpjPwData.nome || '',
      cep: cnpjPwData.cep || '',
      logradouro: cnpjPwData.logradouro || '',
      bairro: cnpjPwData.bairro || '',
      municipio: cnpjPwData.municipio || '',
      uf: cnpjPwData.uf || '',
      numero: cnpjPwData.numero || ''
    };

    return res.status(200).json(dadosNormalizados);
  }

  // ==========================================
  // FALHA TOTAL
  // ==========================================
  console.error(`❌ [CNPJ] Todas as APIs falharam para ${cnpjLimpo}`);
  return res.status(404).json({ 
    error: 'Não foi possível consultar o CNPJ em nenhuma das fontes disponíveis. Preencha os dados manualmente.' 
  });
};
