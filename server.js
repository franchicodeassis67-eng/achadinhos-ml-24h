import express from 'express';
import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import axios from 'axios';

const app = express();
let qrCodeData = null;
let isConnected = false;
const SEU_ID = "costaesilvaerica";

app.get('/', async (req, res) => {
  if (isConnected) return res.send('<h1>✅ BOT FOTO ON</h1>');
  if (!qrCodeData) return res.send('<h1>Gerando QR... F5 em 10s</h1>');
  const qrImage = await QRCode.toDataURL(qrCodeData);
  res.send(`<div style="text-align:center"><img src="${qrImage}" style="width:320px;border:10px solid black" /></div>`);
});

app.listen(process.env.PORT || 10000, () => console.log('WEB OK'));

async function buscarOferta() {
  const { data } = await axios.get('https://api.mercadolibre.com/sites/MLB/search?q=oferta&limit=10');
  const p = data.results[0];
  const antigo = p.original_price || (p.price * 1.35);
  const desc = Math.round((1 - p.price / antigo) * 100);
  return {
    titulo: p.title,
    preco: p.price.toFixed(2),
    antigo: antigo.toFixed(2),
    desc: desc,
    foto: p.thumbnail.replace('I.jpg', 'O.jpg'),
    link: `https://www.mercadolivre.com.br/social/${SEU_ID}?matt_tool=84859939&url=${encodeURIComponent(p.permalink)}`
  };
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_qr');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({ version, auth: state, browser: ['Achadinhos', 'Chrome', '1.0'] });
  
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (u) => {
    const { qr, connection } = u;
    if (qr) qrCodeData = qr;
    if (connection === 'open') {
      isConnected = true;
      qrCodeData = null;
      console.log('CONECTADO');
      setInterval(async () => {
        try {
          const o = await buscarOferta();
          const legenda = `🔥 ACHADINHOS ML 24H 🔥\n\n${o.titulo}\nDe: R$ ${o.antigo} Por: R$ ${o.preco} - ${o.desc}% OFF\n\n${o.link}`;
          const grupos = await sock.groupFetchAllParticipating();
          for (let id in grupos) {
            if (grupos[id].subject.toLowerCase().includes('achadinhos')) {
              await sock.sendMessage(id, { image: { url: o.foto }, caption: legenda });
            }
          }
          await sock.sendMessage('status@broadcast', { image: { url: o.foto }, caption: legenda });
        } catch (e) {
          console.log(e.message);
        }
      }, 180000);
    }
    if (connection === 'close') {
      isConnected = false;
      setTimeout(() => start(), 5000);
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message) return;
    if (msg.key.fromMe) return;
    const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    console.log('Recebi:', texto);
    if (texto.toLowerCase().includes('oi')) {
      const o = await buscarOferta();
      const legenda = `🔥 ACHADINHOS ML 24H 🔥\n\n${o.titulo}\nDe: R$ ${o.antigo} Por: R$ ${o.preco}\n\n${o.link}`;
      await sock.sendMessage(msg.key.remoteJid, { image: { url: o.foto }, caption: legenda });
    }
  });
}

start();
