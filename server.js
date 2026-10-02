import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

const app = express();
const TOKEN = "8740167282:AAF5yoisDDEt9eTJmexx-TiipbanZm8Rnts";
const CHAT_ID = "@Achadinhos2_ML";
const SEU_ID = "costaesilvaerica";

const bot = new TelegramBot(TOKEN, { polling: false });

const OFERTAS = [
  { titulo: "Tênis Nike Revolution 6", preco: "R$ 199,90", antigo: "R$ 349,90", foto: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800", link: "https://www.mercadolivre.com.br/tenis-nike-revolution-6-next-nature-masculino/p/MLB19644530" },
  { titulo: "JBL Boombox 3", preco: "R$ 1.899", antigo: "R$ 2.799", foto: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800", link: "https://www.mercadolivre.com.br/caixa-de-som-jbl-boombox-3-com-bluetooth-preta/p/MLB20449244" },
  { titulo: "Air Fryer Mondial 4,2L", preco: "R$ 299", antigo: "R$ 499", foto: "https://images.unsplash.com/photo-1585237672814-8ac795c543d7?w=800", link: "https://www.mercadolivre.com.br/fritadeira-eletrica-mondial-air-fryer-afn-40-bfs-42l-preta/p/MLB15177996" },
  { titulo: "iPhone 15 128GB", preco: "R$ 4.299", antigo: "R$ 6.999", foto: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800", link: "https://www.mercadolivre.com.br/apple-iphone-15-128-gb-preto/p/MLB27162815" },
];

async function enviar(){
  const o = OFERTAS[Math.floor(Math.random()*OFERTAS.length)];
  const linkAf = `https://www.mercadolivre.com.br/social/${SEU_ID}?matt_tool=84859939&url=${encodeURIComponent(o.link)}`;
  const legenda = `🔥 *${o.titulo.toUpperCase()}* 🔥\n\n❌ De: ${o.antigo}\n✅ Por: *${o.preco}*\n\n👉 [🛒 COMPRAR COM DESCONTO](${linkAf})\n\n_⏰ Oferta por tempo limitado!_`;
  try{
    const r = await axios.get(o.foto, { responseType: 'arraybuffer', timeout: 10000 });
    await bot.sendPhoto(CHAT_ID, Buffer.from(r.data), { caption: legenda, parse_mode: "Markdown" });
    console.log("ENVIADO COM FOTO OK:", o.titulo);
  }catch(e){
    console.log("Erro foto:", e.message);
    await bot.sendMessage(CHAT_ID, legenda, { parse_mode: "Markdown" });
  }
}

app.get('/', (req,res)=>res.send('BOT ON'));
app.listen(process.env.PORT || 10000);

enviar();
setInterval(enviar, 5*60*1000);
