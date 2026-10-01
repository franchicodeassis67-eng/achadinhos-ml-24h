import express from 'express';
import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import axios from 'axios';

const app = express();
let qrCodeData = null;
let isConnected = false;
const SEU_ID = "costaesilvaerica";

app.get('/', async (req,res)=>{
  if(isConnected) return res.send('<h1>✅ BOT MERCADO LIVRE 24H CONECTADO!</h1><p>Mandando de 3 em 3 min no grupo + storys</p>');
  if(!qrCodeData) return res.send('<h1>Aguarde... gerando QR. F5 em 10s</h1>');
  const qrImage = await QRCode.toDataURL(qrCodeData);
  res.send(`<div style="text-align:center"><h2>Escaneia</h2><img src="${qrImage}" style="width:320px;border:10px solid black" /></div>`);
});

app.listen(process.env.PORT || 10000, ()=>console.log('WEB OK'));

async function buscarOferta(){
  try{
    const { data } = await axios.get('https://api.mercadolibre.com/sites/MLB/search?q=oferta&limit=1&sort=price_asc');
    const p = data.results[0];
    const link = `${p.permalink}?matt_tool=84859939&matt_word=${SEU_ID}`;
    const antigo = p.original_price || (p.price * 1.3);
    const desc = Math.round((1 - p.price/antigo)*100);
    return `📉 *CAIU DE PREÇO - ${desc}% OFF* 📉\n\n📦 ${p.title}\n❌ Era: R$ ${antigo.toFixed(2)}\n✅ Agora: R$ ${p.price.toFixed(2)}\n\n👉 ${link}\n\n_Grupo Achadinhos Mercado Livre 24h_`;
  }catch(e){
    return `🔥 *OFERTA MERCADO LIVRE* 🔥\n\nConfira essa oferta!\n👉 https://mercadolivre.com.br/social/${SEU_ID}`;
  }
}

async function start(){
  const { state, saveCreds } = await useMultiFileAuthState('./auth_qr');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({ version, auth: state, browser: ['Achadinhos','Chrome','1.0'] });
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (u)=>{
    const { qr, connection } = u;
    if(qr) qrCodeData = qr;
    if(connection==='open'){
      isConnected = true;
      qrCodeData = null;
      console.log('CONECTADO!');

      setInterval(async ()=>{
        try{
          const msg = await buscarOferta();
          const grupos = await sock.groupFetchAllParticipating();
          for(let id in grupos){
            if(grupos[id].subject.toLowerCase().includes('achadinhos')){
              await sock.sendMessage(id, { text: msg });
              console.log('Mandou no grupo: ' + grupos[id].subject);
            }
          }
          await sock.sendMessage('status@broadcast', { text: msg });
          console.log('Mandou no storys');
        }catch(err){ console.log(err.message) }
      }, 3*60*1000);
    }
    if(connection==='close'){
      isConnected = false;
      setTimeout(()=>start(),5000);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if(!msg.message) return;
    const texto = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase();
    const jid = msg.key.remoteJid;
    if(texto.includes('oi') || texto.includes('ofertas') || texto.includes('achadinhos')){
      const oferta = await buscarOferta();
      await sock.sendMessage(jid, { text: oferta });
    }
  });
}
start();
