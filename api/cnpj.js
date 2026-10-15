// api/cnpj.js
export default async function handler(req, res) {
  // Pega o CNPJ que foi enviado na URL (ex: /api/cnpj?cnpj=12345678000190)
  const { cnpj } = req.query;

  if (!cnpj) {
    return res.status(400).json({ error: 'CNPJ é obrigatório' });
  }

  // Limpa qualquer caractere que não seja número
  const cnpjLimpo = cnpj.replace(/\D/g, '');

  if (cnpjLimpo.length !== 14) {
    return res.status(400).json({ error: 'CNPJ inválido' });
  }

  try {
    // A chamada é feita aqui, no servidor da Vercel, sem CORS
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
    
    if (!response.ok) {
      // Se a BrasilAPI retornar erro, repassamos o erro
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    // Retorna os dados para o frontend
    return res.status(200).json(data);

  } catch (error) {
    console.error('Erro na consulta de CNPJ no servidor:', error);
    return res.status(500).json({ error: 'Erro interno ao consultar o CNPJ' });
  }
}
