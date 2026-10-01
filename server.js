const express = require('express');
const axios = require('axios');
const qrcode = require('qrcode');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const app = express();
let sock, qrDinamico = null;

async function iniciaZap() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  sock = makeWASocket({ auth: state, printQRInTerminal: true });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async (u) => {
    if (u.qr) { qrDinamico = u.qr; console.log('NOVO QR GERADO'); }
    if (u.connection === 'open') { console.log('ZAP CONECTADO'); enviarOfertas(); }
  });
}

async function enviarOfertas() {
  try {
    const ml = await axios.get('https://api.mercadolibre.com/sites/MLB/search?q=ofertas+do+dia&limit=3&sort=sold_quantity_desc');
    for (let p of ml.data.results) {
      const link = `${p.permalink}?matt_tool=84859939&matt_word=costaesilvaerica`;
      const curto = (await axios.get(`https://is.gd/create.php?format=json&url=${encodeURIComponent(link)}`)).data.shorturl;
      const msg = `🔥 *ACHADINHOS 24H* 🔥\n\n📦 ${p.title}\n\n💰 *R$ ${p.price}*\n🎟️ Cupom: *MLMELHORESPROMOS*\n👉 ${curto}\n\nCorre que acaba! 🏃‍♀️`;

      const grupos = await sock.groupFetchAllParticipating();
      for (let id in grupos) {
        if (grupos[id].subject.toLowerCase().includes('achadinho')) {
          await sock.sendMessage(id, { text: msg });
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    }
  } catch(e){ console.log('Erro:', e.message) }
}

iniciaZap();

// A CADA 10 MINUTOS
setInterval(() => { if(sock) enviarOfertas() }, 10*60*1000);

app.get('/qr', async (req, res) => {
  if (!qrDinamico) return res.send('<h1>Aguarde 10s e atualize...</h1><script>setTimeout(()=>location.reload(),5000)</script>');
  const img = await qrcode.toDataURL(qrDinamico);
  res.send(`<center><h1>Escaneie o QR no WhatsApp</h1><img src="${img}" width="350"><p>WhatsApp > Aparelhos Conectados > Conectar aparelho</p></center>`);
});

app.get('/', (req, res) => res.send('<h1>Robô ON - 10 MIN</h1><a href="/qr"><h2>VER QR CODE</h2></a><br><a href="/ofertas">VER OFERTAS</a>'));
app.get('/ofertas', async (req,res)=>{
  try {
    const ml = await axios.get('https://api.mercadolibre.com/sites/MLB/search?q=mais+vendidos&limit=3');
    let h='<h1>OFERTAS PRONTAS</h1>';
    for(let p of ml.data.results){
      const l=`${p.permalink}?matt_tool=84859939&matt_word=costaesilvaerica`;
      const c=(await axios.get(`https://is.gd/create.php?format=json&url=${encodeURIComponent(l)}`)).data.shorturl;
      h+=`<p>🔥 ${p.title}<br>R$ ${p.price}<br>Cupom: MLMELHORESPROMOS<br>${c}</p><hr>`
    }
    res.send(h);
  } catch(e){ res.send(e.message) }
});

app.listen(process.env.PORT || 10000);
