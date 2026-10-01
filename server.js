const express = require('express');
const axios = require('axios');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const app = express();
let sock;

async function iniciaZap() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  sock = makeWASocket({ auth: state, printQRInTerminal: true });

  // SE NÃO ESTIVER CONECTADO, GERA CÓDIGO DE 8 DÍGITOS
  if (!sock.authState.creds.registered) {
    await new Promise(r => setTimeout(r, 3000));
    const numero = "5511914098689"; // <--- COLOCA SEU NUMERO COM DDD EX: 5511999999999
    const code = await sock.requestPairingCode(numero);
    console.log(`SEU CÓDIGO DE PAREAMENTO: ${code}`);
    global.codigoPareamento = code;
  }

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', (u) => {
    if (u.connection === 'open') {
      console.log('CONECTADO!');
      enviarOfertas();
    }
  });
}

async function enviarOfertas() {
  try {
    const ml = await axios.get('https://api.mercadolibre.com/sites/MLB/search?q=ofertas+do+dia&limit=2&sort=sold_quantity_desc');
    for (let p of ml.data.results) {
      const link = `${p.permalink}?matt_tool=84859939&matt_word=costaesilvaerica`;
      const curto = (await axios.get(`https://is.gd/create.php?format=json&url=${encodeURIComponent(link)}`)).data.shorturl;
      const msg = `🔥 *ACHADINHOS 24H* 🔥\n\n📦 ${p.title}\n💰 *R$ ${p.price}*\n🎟️ Cupom: *MLMELHORESPROMOS*\n👉 ${curto}`;

      const grupos = await sock.groupFetchAllParticipating();
      for (let id in grupos) {
        if (grupos[id].subject.toLowerCase().includes('achadinho')) {
          await sock.sendMessage(id, { text: msg });
        }
      }
    }
  } catch(e){ console.log(e.message) }
}

iniciaZap();
setInterval(() => { if(sock) enviarOfertas() }, 10*60*1000);

app.get('/', (req, res) => {
  res.send(`<h1>Robô 10 MIN ON</h1><h2>Código: ${global.codigoPareamento || 'Gerando... atualize'}</h2><p>Vá no WhatsApp > Aparelhos Conectados > Conectar com número de telefone > Digite esse código</p><a href="/ofertas">Ver ofertas prontas</a>`);
});
app.get('/ofertas', async (req,res)=>{
  const ml = await axios.get('https://api.mercadolibre.com/sites/MLB/search?q=mais+vendidos&limit=3');
  let h=''; for(let p of ml.data.results){ const l=`${p.permalink}?matt_tool=84859939&matt_word=costaesilvaerica`; const c=(await axios.get(`https://is.gd/create.php?format=json&url=${encodeURIComponent(l)}`)).data.shorturl; h+=`<p>🔥 ${p.title}<br>R$ ${p.price}<br>MLMELHORESPROMOS<br>${c}</p><hr>`} res.send(h);
});
app.listen(process.env.PORT || 10000);
