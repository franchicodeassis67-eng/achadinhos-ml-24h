import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

const app = express();
const TOKEN = "8740167282:AAF5yoisDDEt9eTJmexx-TiipbanZm8Rnts";
const CHAT_ID = "@Achadinhos2_ML";
const SEU_USER = "costaesilvaerica";
const bot = new TelegramBot(TOKEN, { polling: false });

const OFERTAS = [
  { titulo: "Fone JBL Wave Buds - Bluetooth", preco: "149,90", antigo: "299,90", foto: "https://http2.mlstatic.com/D_NQ_NP_2X_847707-MLA80635305267_112024-F.webp", link: "https://www.mercadolivre.com.br/fone-de-ouvido-jbl-wave-buds/p/MLB15177996" },
  { titulo: "Tênis Nike Revolution 6 Masculino", preco: "199,90", antigo: "349,90", foto: "https://http2.mlstatic.com/D_NQ_NP_2X_612326-MLA71796351269_092023-F.webp", link: "https://www.mercadolivre.com.br/tenis-nike-revolution-6-next-nature-masculino/p/MLB19644530" },
  { titulo: "Smartwatch Xiaomi Band 8", preco: "199,90", antigo: "399,90", foto: "https://http2.mlstatic.com/D_NQ_NP_2X_738765-MLA79495489234_092024-F.webp", link: "https://www.mercadolivre.com.br/xiaomi-smart-band-8/p/MLB2678426417" }
];

async function enviar(){
  const o = OFERTAS[Math.floor(Math.random()*OFERTAS.length)];
  const linkAf = `https://www.mercadolivre.com.br/social/${SEU_USER}?matt_tool=84859939&matt_source=TELEGRAM&matt_campaign=GT&url=${encodeURIComponent(o.link)}`;
  
  const legenda = `⚡️ *${o.titulo.toUpperCase()}* ⚡️\n\n💸 DE: ~R$ ${o.antigo}~\n🔥 POR: *R$ ${o.preco}*\n💳 em 10x de R$ ${(parseFloat(o.preco.replace(',','.'))/10).toFixed(2)}\n\n🔗 👉 [COMPRAR AGORA](${linkAf})\n\n⚠️ Preço pode mudar a qualquer hora!`;

  try{
    const r = await axios.get(o.foto, { responseType: 'arraybuffer', timeout: 15000 });
    await bot.sendPhoto(CHAT_ID, Buffer.from(r.data), { caption: legenda, parse_mode: "Markdown" });
    console.log("ENVIADO:", o.titulo);
  }catch(e){ console.log("Erro:", e.message); }
}

app.get('/', (req,res)=>res.send('BOT ON'));
app.listen(process.env.PORT || 10000, ()=>console.log('OK'));
enviar();
setInterval(enviar, 10*60*1000);
