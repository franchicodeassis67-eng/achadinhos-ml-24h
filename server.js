import express from 'express';
import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import axios from 'axios';

const app = express();
let qrCodeData = null;
let isConnected = false;
const SEU_ID = "costaesilvaerica";

app.get('/', async (req, res) => {
  if (isConnected) return res.send('<h1 style="font-family:sans-serif;text-align:center;margin-top:100px">✅ BOT FOTO ON<br><br>Deixa essa aba aberta</h1>');
  if (!qrCodeData) return res.send('<h1 style="font-family:sans-serif;text-align:center;margin-top:100px">Gerando QR... atualiza em 10s</h1>');
  const qrImage = await QRCode.toDataURL(qrCodeData);
  res.send(`<div style="text-align:center;margin-top:20px"><h2>Escaneia em 20 seg</h2><img src="${qrImage}" style="width:340px;border:12px solid black" /></div>`);
});

app.listen(process.env.PORT || 10000, () => console.log('WEB OK'));

async function buscarOferta() {
  try {
    const { data } = await axios.get('https://api.mercadolibre.com/sites/MLB/search?q=celular+oferta&limit=5', { timeout: 10000 });
    const p = data.results[0];
    const antigo = p.original_price || (p.price * 1.4);
    const desc = Math.round((1 - p.price / antigo) * 100);
    return {
      titulo: p.title,
      preco: p.price.toFixed(2),
      antigo: antigo.toFixed(2),
      desc: desc > 0? desc : 35,
      foto: p.thumbnail.replace('I.jpg', 'O.jpg').replace('http://', 'https://'),
      link: `https://www.mercadolivre.com.br/social/${SEU_ID}?matt_tool=84859939&url=${encodeURIComponent(p.permalink)}`
    };
  } catch (e) {
    console.log('API falhou, usando fixa:', e.message);
    return {
      titulo: "Fone Bluetooth TWS Oferta 24H - Achadinhos ML",
      preco: "39.90",
      antigo: "129.90",
      desc: 69,
      foto: "https://http2.mlstatic.com/D_NQ_NP_2X_800645-MLA71782870430_092023-O.webp",
      link: `https://www.mercadolivre.com.br/social/${SEU_ID}`
    };
  }
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_qr');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({ version, auth: state, browser: ['Achadinhos', 'Chrome', '1.0'] });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (u) => {
    const { qr, connection } = u;
    if (qr) {
      qrCodeData = qr;
      console.log('QR GERADO - escaneia rapido');
    }
    if (connection === 'open') {
      isConnected = true;
      qrCodeData = null;
      console.log('BOT CONECTADO COM SUCESSO');

      // Manda 1 oferta de teste assim que conecta
      try {
        const o = await buscarOferta();
        const legenda = `🔥 *ACHADINHOS ML 24H* 🔥\n\n📦 ${o.titulo}\n❌ De: R$ ${o.antigo}\n✅ Por: *R$ ${o.preco}* - ${o.desc}% OFF\n🎟️ CUPOM: MELHORESOFERTAS\n\n👉 ${o.link}`;
        const grupos = await sock.groupFetchAllParticipating();
        console.log(`Achei ${Object.keys(grupos).length} grupos`);
        for (let id in grupos) {
          console.log('Grupo:', grupos[id].subject);
          await sock.sendMessage(id, { image: { url: o.foto }, caption: legenda });
          console.log('Enviado pra', grupos[id].subject);
        }
      } catch (e) {
        console.log('Erro no envio inicial:', e.message);
      }

      // Loop a cada 3 minutos
      setInterval(async () => {
        try {
          const o = await buscarOferta();
          const legenda = `🔥 *ACHADINHOS ML 24H* 🔥\n\n📦 ${o.titulo}\n❌ De: R$ ${o.antigo}\n✅ Por: *R$ ${o.preco}* - ${o.desc}% OFF\n\n👉 ${o.link}`;
          const grupos = await sock.groupFetchAllParticipating();
          for (let id in grupos) {
            await sock.sendMessage(id, { image: { url: o.foto }, caption: legenda });
          }
          await sock.sendMessage('status@broadcast', { image: { url: o.foto }, caption: legenda }).catch(()=>{});
          console.log('Loop enviado');
        } catch (e) {
          console.log('Erro loop:', e.message);
        }
      }, 180000);
    }
    if (connection === 'close') {
      isConnected = false;
      console.log('Desconectado, tentando reconectar em 5s');
      setTimeout(() => start(), 5000);
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message) return;
    if (msg.key.fromMe) return;
    const texto = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase();
    console.log('Recebi:', texto);
    if (texto.includes('oi')) {
      const o = await buscarOferta();
      const legenda = `🔥 *ACHADINHOS ML 24H* 🔥\n\n📦 ${o.titulo}\n✅ Por: *R$ ${o.preco}* - ${o.desc}% OFF\n\n👉 ${o.link}`;
      await sock.sendMessage(msg.key.remoteJid, { image: { url: o.foto }, caption: legenda });
    }
  });
}

start();
