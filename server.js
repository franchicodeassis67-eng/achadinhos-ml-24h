const express = require('express');
const axios = require('axios');
const app = express();

app.get('/', (req, res) => {
  res.send(`
  <h1>✅ ROBÔ ACHADINHOS 24H NO AR</h1>
  <h2><a href="/ofertas">CLIQUE AQUI PARA VER AS OFERTAS PRONTAS</a></h2>
  <p>Esse link gera 5 ofertas com seu código costaesilvaerica + cupom MLMELHORESPROMOS + link curto is.gd</p>
  `);
});

app.get('/ofertas', async (req, res) => {
  try {
    const ml = await axios.get('https://api.mercadolibre.com/sites/MLB/search?q=mais+vendidos&sort=sold_quantity_desc&limit=5');
    let html = '<h1>🔥 OFERTAS PRONTAS PRA COPIAR PRO GRUPO</h1>';
    
    for (let p of ml.data.results) {
      const linkAfiliado = `${p.permalink}?matt_tool=84859939&matt_word=costaesilvaerica`;
      let curto = linkAfiliado;
      try {
        const r = await axios.get(`https://is.gd/create.php?format=json&url=${encodeURIComponent(linkAfiliado)}`);
        curto = r.data.shorturl;
      } catch(e){}

      const msg = `🔥 *ACHADINHO IMPERDÍVEL* 🔥\n\n📦 ${p.title}\n\n💰 Por: *R$ ${p.price}*\n\n🎟️ Cupom: *MLMELHORESPROMOS*\n👉 ${curto}\n\n_Corre que acaba!_`;
      
      html += `<div style="border:1px solid #ccc;padding:15px;margin:15px;border-radius:10px"><p style="white-space:pre-wrap">${msg}</p><button onclick="navigator.clipboard.writeText(\`${msg.replace(/`/g,'')}\`)">COPIAR</button></div>`;
    }
    res.send(html);
  } catch(e){
    res.send('Erro: ' + e.message);
  }
});

app.get('/api/ofertas-json', async (req, res) => {
  // Essa rota o WhatsApp vai usar depois
  try {
    const ml = await axios.get('https://api.mercadolibre.com/sites/MLB/search?q=ofertas&limit=1&sort=sold_quantity_desc');
    const p = ml.data.results[0];
    const linkAfiliado = `${p.permalink}?matt_tool=84859939&matt_word=costaesilvaerica`;
    const curtoReq = await axios.get(`https://is.gd/create.php?format=json&url=${encodeURIComponent(linkAfiliado)}`);
    
    res.json({
      titulo: p.title,
      preco: p.price,
      link_curto: curtoReq.data.shorturl,
      mensagem_pronta: `🔥 ${p.title}\n💰 R$ ${p.price}\n🎟️ Cupom: MLMELHORESPROMOS\n👉 ${curtoReq.data.shorturl}`
    });
  } catch(e){ res.json({error: e.message}) }
});

app.listen(process.env.PORT || 10000, () => console.log('RODANDO'));
