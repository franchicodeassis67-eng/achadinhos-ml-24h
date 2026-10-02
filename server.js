import express from 'express';
import TelegramBot from 'node-telegram-bot-api';

const app = express();
const TOKEN = "8740167282:AAF5yoisDDEt9eTJmexx-TiipbanZm8Rnts";
const CHAT_ID = "@Achadinhos2_ML";
const SEU_ID = "costaesilvaerica";

const bot = new TelegramBot(TOKEN, { polling: false });

const OFERTAS = [
  { 
    titulo: "iPhone 15 128GB", 
    preco: "R$ 4.299", 
    antigo: "R$ 6.999",
    foto: "https://http2.mlstatic.com/D_Q_NP_2X_802362-MLA71782867330_092023-O.webp",
    link: "https://www.mercadolivre.com.br/apple-iphone-15-128-gb-preto/p/MLB27162815" 
  },
  { 
    titulo: "JBL Boombox 3", 
    preco: "R$ 1.899", 
    antigo: "R$ 2.799",
    foto: "https://http2.mlstatic.com/D_Q_NP_2X_758186-MLA53132351206_012023-O.webp",
    link: "https://www.mercadolivre.com.br/caixa-de-som-jbl-boombox-3-com-bluetooth-preta/p/MLB20449244" 
  },
  { 
    titulo: "Tenis Nike Revolution 6", 
    preco: "R$ 199,90", 
    antigo: "R$ 349,90",
    foto: "https://http2.mlstatic.com/D_Q_NP_2X_648055-MLA54909232477_042023-O.webp",
    link: "https://www.mercadolivre.com.br/tenis-nike-revolution-6-next-nature-masculino/p/MLB19644530" 
  },
  { 
    titulo: "Air Fryer Mondial 4,2L", 
    preco: "R$ 299", 
    antigo: "R$ 499",
    foto: "https://http2.mlstatic.com/D_Q_NP_2X_965733-MLA52454668379_112022-O.webp",
    link: "https://www.mercadolivre.com.br/fritadeira-eletrica-mondial-air-fryer-afn-40-bfs-42l-preta/p/MLB15177996" 
  },
];

async function enviar(){
  const o = OFERTAS[Math.floor(Math.random()*OFERTAS.length)];
  const linkAf = `https://www.mercadolivre.com.br/social/${SEU_ID}?matt_tool=84859939&matt_source=TELEGRAM&url=${encodeURIComponent(o.link)}`;
  const legenda = `🔥 *${o.titulo.toUpperCase()}* 🔥\n\n❌ De: ${o.antigo}\n✅ Por: *${o.preco}*\n\n👉 [🛒 COMPRAR COM DESCONTO](${linkAf})\n\n_⏰ Corre que acaba rápido!_`;
  try{
    await bot.sendPhoto(CHAT_ID, o.foto, { caption: legenda, parse_mode: "Markdown" });
    console.log("ENVIADO COM FOTO:", o.titulo);
  }catch(e){ console.log("Erro foto:", e.message); }
}

app.get('/', (req,res)=>res.send('BOT COM FOTO ON - @Achadinhos2_ML'));
app.listen(process.env.PORT || 10000, ()=>console.log('WEB OK'));

enviar();
setInterval(enviar, 5*60*1000);
