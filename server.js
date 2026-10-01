import express from 'express';
import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import axios from 'axios';

const app = express();
let qrCodeData = null;
let isConnected = false;
const SEU_ID = "costaesilvaerica";

app.get('/', async (req,res)=>{
  if(isConnected) return res.send('<h1>✅ BOT FOTO ON - Achadinhos Mercado Livre 24h</h1>');
  if(!qrCodeData) return res.send('<h1>Gerando QR... F5 em 10s</h1>');
  const qrImage = await QRCode.toDataURL(qrCodeData);
  res.send(`<div style="text-align:center"><h2>Escaneia seu WhatsApp</h2><img src="${qrImage}" style="width:320px;border:10px solid black" /></div>`);
});
app.listen(process.env.PORT || 10000, ()=>console.log('WEB OK'));

async function buscarOferta(){
  const { data } = await axios.get('https://api.mercadolibre.com/sites/MLB/search?q=oferta+do+dia&limit=10&sort=price_asc&official_store=all');
  const p = data.results[Math.floor(Math.random()*5)];
  const link = `https://www.mercadolivre.com.br/social/${SEU_ID}?matt_tool=84859939&url=${encodeURIComponent(p.permalink)}`;
  const antigo = p.original_price || (p.price * 1.35);
  const desc = Math.round((1 - p.price/antigo)*100);
  return {
    titulo: p.title,
    preco: p.price.toFixed(2),
    antigo: antigo.toFixed(2),
    desc,
    foto: p.thumbnail.replace('I.jpg','O.jpg'),
    link
  };
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
      isConnected = true; qrCodeData = null;
      console.log('CONECTADO!');

      setInterval(async ()=>{
        try{
          const o = await buscarOferta();
          const legenda = `🔥 *ACHADINHOS MERCADO LIVRE 24H* 🔥\n\n📦 ${o.titulo}\n\n❌ De: R$ ${o.antigo}\n✅ Por: *R$ ${o.preco}* - ${o.desc}% OFF\n🎟️ *CUPOM: MELHORESOFERTAS*\n\n👉 ${o.link}\n\n⚡ Oferta verificada agora`;
          const grupos = await sock.groupFetchAllParticipating();
          for(let id in grupos){
            if(grupos[id].subject.toLowerCase().includes('achadinhos')){
              await sock.sendMessage(id, { image: { url: o.foto }, caption: legenda });
            }
          }
          await sock.sendMessage('status@broadcast', { image: { url: o.foto }, caption: legenda });
          console.log('Enviou foto no grupo + storys');
        }catch(e){ console.log(e.message) }
      }, 3*60*1000);
    }
    if(connection==='close'){ isConnected=false; setTimeout(()=>start(),5000); }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]; if(!msg.message) return;
    const texto = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase();
    const jid = msg.key.remoteJid;
    if(texto.includes('oi') || texto.includes('oferta')){
      const o = await buscarOferta();
      const legenda = `🔥 *ACHADINHOS MERCADO LIVRE 24H* 🔥\n\n📦 ${o.titulo}\n\n❌ De: R$ ${o.antigo}\n✅ Por: *R$ ${o.preco}* - ${o.desc}% OFF\n🎟️ *CUPOM: MELHORESOFERTAS*\n\n👉 ${o.link}`;
      await sock.sendMessage(jid, { image: { url: o.foto }, caption: legenda });
    }
  });
}
start();
