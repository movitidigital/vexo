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

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
    
    // 1. Verifica se a resposta da BrasilAPI foi bem-sucedida
    if (!response.ok) {
      const errorText = await response.text();
      console.error('BrasilAPI respondeu com erro:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `BrasilAPI retornou erro ${response.status}` 
      });
    }

    // 2. Verifica se a resposta tem conteúdo antes de tentar converter para JSON
    const responseText = await response.text();
    if (!responseText || responseText.trim() === '') {
      console.error('BrasilAPI retornou corpo vazio para o CNPJ:', cnpjLimpo);
      return res.status(404).json({ 
        error: 'CNPJ não encontrado na base de dados' 
      });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Erro ao converter resposta da BrasilAPI para JSON:', parseError);
      return res.status(500).json({ error: 'Resposta inválida da BrasilAPI' });
    }

    // 3. Verifica se o objeto retornado está realmente preenchido
    if (!data || Object.keys(data).length === 0) {
      return res.status(404).json({ 
        error: 'CNPJ não encontrado na base de dados' 
      });
    }

    // Sucesso: retorna os dados
    return res.status(200).json(data);

  } catch (error) {
    console.error('Erro na consulta de CNPJ no servidor:', error);
    return res.status(500).json({ error: 'Erro interno ao consultar o CNPJ' });
  }
}
