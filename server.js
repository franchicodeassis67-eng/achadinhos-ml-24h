const express = require('express');
const axios = require('axios');
const app = express();

let ultimaOferta = "Gerando ofertas...";

async function gerarOferta() {
  try {
    const ml = await axios.get('https://api.mercadolibre.com/sites/MLB/search?q=ofertas+do+dia&sort=sold_quantity_desc&limit=1');
    const p = ml.data.results[0];
    const linkAfiliado = `${p.permalink}?matt_tool=84859939&matt_word=costaesilvaerica`;
    const curto = (await axios.get(`https://is.gd/create.php?format=json&url=${encodeURIComponent(linkAfiliado)}`)).data.shorturl;
    ultimaOferta = `🔥 *ACHADINHOS 24H* 🔥\n\n📦 ${p.title}\n\n💰 *R$ ${p.price}*\n🎟️ Cupom: *MLMELHORESPROMOS*\n👉 ${curto}\n\nCorre que acaba!`;
    console.log('Nova oferta gerada:', ultimaOferta);
  } catch(e){ console.log(e.message) }
}

gerarOferta();
setInterval(gerarOferta, 10*60*1000); // Gera nova a cada 10 min

app.get('/', (req, res) => {
  const msgEncoded = encodeURIComponent(ultimaOferta);
  res.send(`
  <html>
  <head><meta http-equiv="refresh" content="600"><style>body{font-family:sans-serif;padding:20px;text-align:center}.card{border:2px solid #00a650;padding:20px;border-radius:15px;max-width:500px;margin:20px auto} button{padding:15px 30px;font-size:18px;background:#25D366;color:white;border:none;border-radius:10px;margin:10px}</style></head>
  <body>
    <h1>✅ ROBÔ 24H - ATUALIZA A CADA 10 MIN</h1>
    <div class="card">
      <p style="white-space:pre-wrap;text-align:left;font-size:18px">${ultimaOferta}</p>
      <button onclick="navigator.clipboard.writeText(\`${ultimaOferta.replace(/`/g,'')}\`);alert('Copiado!')">📋 COPIAR TEXTO</button><br>
      <a href="https://wa.me/?text=${msgEncoded}" target="_blank"><button>📲 ENVIAR PRO WHATSAPP</button></a>
      <p>Atualiza sozinho a cada 10 min</p>
    </div>
    <p>Seu link: is.gd + costaesilvaerica + MLMELHORESPROMOS</p>
  </body>
  </html>
  `);
});

app.listen(process.env.PORT || 10000);
