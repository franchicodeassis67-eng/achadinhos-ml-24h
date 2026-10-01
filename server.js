const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const axios = require('axios');
const cron = require('node-cron');
const app = express();

let qrCodeData = null;
let isReady = false;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('qr', (qr) => {
  qrCodeData = qr;
  console.log('QR GERADO - Acesse /qr para ver');
});

client.on('ready', () => {
  isReady = true;
  console.log('WHATSAPP CONECTADO!');
  enviarOfertas();
});

// ROTA PARA VER O QR CODE
app.get('/qr', async (req, res) => {
  if (!qrCodeData) return res.send('<h1>Gerando QR... atualize em 10s</h1>');
  const qrImage = await qrcode.toDataURL(qrCodeData);
  res.send(`<img src="${qrImage}" style="width:300px"><h2>Escaneie no WhatsApp > Aparelhos Conectados</h2>`);
});

app.get('/', (req, res) => {
  if (isReady) res.send('✅ ROBÔ CONECTADO E ENVIANDO A CADA 40 MIN');
  else res.send('<h1>Robô Ligado</h1><a href="/qr"><h2>CLIQUE AQUI PARA VER O QR CODE</h2></a>');
});

// FUNÇÃO QUE PEGA OFERTAS E ENVIA
async function enviarOfertas() {
  try {
    // Busca produtos que mais vendem no ML
    const ml = await axios.get('https://api.mercadolibre.com/sites/MLB/search?q=ofertas+imperdiveis&sort=sold_quantity_desc&limit=5');
    const produtos = ml.data.results;

    for (let p of produtos) {
      const linkAfiliado = p.permalink + '?matt_tool=84859939&matt_word=costaesilvaerica';
      
      // Encurta o link
      let linkCurto = linkAfiliado;
      try {
        const curto = await axios.get(`https://is.gd/create.php?format=json&url=${encodeURIComponent(linkAfiliado)}`);
        linkCurto = curto.data.shorturl;
      } catch(e){}

      const mensagem = `🔥 *ACHADINHO 24H - OFERTA RELÂMPAGO* 🔥\n\n`+
      `📦 *${p.title}*\n\n`+
      `💰 De: R$ ${(p.original_price || p.price*1.3).toFixed(2)}\n`+
      `🔥 Por: *R$ ${p.price.toFixed(2)}*\n\n`+
      `🎟️ *Cupom: MLMELHORESPROMOS*\n\n`+
      `👉 Link com desconto:\n${linkCurto}\n\n`+
      `_Corre que acaba rápido!_`;

      // COLOQUE O ID DO SEU GRUPO AQUI DEPOIS
      const grupos = await client.getChats();
      const grupoAlvo = grupos.find(g => g.isGroup && g.name.toLowerCase().includes('achadinho'));
      
      if(grupoAlvo) {
        await client.sendMessage(grupoAlvo.id._serialized, mensagem);
        await new Promise(r => setTimeout(r, 10000)); // espera 10s entre um e outro
      }
    }
  } catch(err){ console.log(err.message) }
}

// Envia a cada 40 minutos
cron.schedule('*/40 * * * *', () => {
  if(isReady) enviarOfertas();
});

client.initialize();
app.listen(process.env.PORT || 10000);
