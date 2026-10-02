import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

const app = express();
const TOKEN = "8740167282:AAF5yoisDDEt9eTJmexx-TiipbanZm8Rnts";
const CHAT_ID = "@Achadinhos2_ML";
const SEU_USER = "costaesilvaerica";

const bot = new TelegramBot(TOKEN, { polling: false });

const OFERTAS = [
  { titulo: "Fone Bluetooth JBL Wave Buds", preco: "R$ 149", antigo: "R$ 299", foto: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800", link: "https://produto.mercadolivre.com.br/MLB2678426417-fone-de-ouvido-jbl-wave-buds" },
  { titulo: "Smartwatch Xiaomi Band 8", preco: "R$ 199", antigo: "R$ 399", foto: "https://images.unsplash.com/photo-1555421689-d68471e189f2?w=800", link: "https://produto.mercadolivre.com.br/MLB3394567890-xiaomi-smart-band-8" },
  { titulo: "Air Fryer Mondial 4,2L", preco: "R$ 299", antigo: "R$ 499", foto: "https://images.unsplash.com/photo-1585237672814-8ac795c543d7?w=800", link: "https://produto.mercadolivre.com.br/MLB1234567890-fritadeira-air-fryer-mondial" },
];

async function enviar(){
  const o = OFERTAS[Math.floor(Math.random()*OFERTAS.length)];
  // LINK CERTO QUE FUNCIONA - redireciona direto
  const linkAf = `https://www.mercadolivre.com.br/social/${SEU_USER}?matt_tool=84859939&matt_source=TELEGRAM&matt_campaign=ACHADINHOS&matt_word=BOT&url=${encodeURIComponent(o.link)}`;
  
  const legenda = `🔥 *${o.titulo.toUpperCase()}* 🔥\n\n❌ De: ${o.antigo}\n✅ Por: *${o.preco}*\n\n👉 [🛒 COMPRAR COM DESCONTO](${linkAf})`;

  try{
    const r = await axios.get(o.foto, { responseType: 'arraybuffer', timeout: 10000 });
    await bot.sendPhoto(CHAT_ID, Buffer.from(r.data), { caption: legenda, parse_mode: "Markdown" });
    console.log("ENVIADO OK:", o.titulo);
  }catch(e){ console.log("Erro:", e.message); }
}

app.get('/', (req,res)=>res.send('BOT ON'));
app.listen(process.env.PORT || 10000);
enviar();
setInterval(enviar, 5*60*1000);
