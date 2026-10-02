import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

const app = express();
const TOKEN = "8740167282:AAF5yoisDDEt9eTJmexx-TiipbanZm8Rnts";
const CHAT_ID = "@Achadinhos2_ML";
const SEU_ID = "costaesilvaerica";

const bot = new TelegramBot(TOKEN, { polling: false });

const OFERTAS = [
  { titulo: "iPhone 15 128GB Preto", preco: "4299.00", antigo: "6999.00", desc: 38, link: "https://www.mercadolivre.com.br/apple-iphone-15-128-gb-preto/p/MLB27162815" },
  { titulo: "JBL Boombox 3 Bluetooth", preco: "1899.00", antigo: "2799.00", desc: 32, link: "https://www.mercadolivre.com.br/caixa-de-som-jbl-boombox-3-com-bluetooth-preta/p/MLB20449244" },
  { titulo: "Tenis Nike Revolution 6", preco: "199.90", antigo: "349.90", desc: 42, link: "https://www.mercadolivre.com.br/tenis-nike-revolution-6-next-nature-masculino/p/MLB19644530" },
  { titulo: "Air Fryer Mondial 4,2L", preco: "299.00", antigo: "499.00", desc: 40, link: "https://www.mercadolivre.com.br/fritadeira-eletrica-mondial-air-fryer-afn-40-bfs-42l-preta/p/MLB15177996" },
];

let ultimo = -1;
const sortear = () => { let i; do { i = Math.floor(Math.random()*OFERTAS.length) } while(i===ultimo && OFERTAS.length>1); ultimo=i; return OFERTAS[i]; };

async function pegarFoto(link){
  try{
    const { data } = await axios.get(link, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const m = data.match(/"secure_url":"(https:\/\/http2\.mlstatic\.com\/[^"]+)"/);
    return m? m[1].replace(/\\/g,'') : null;
  }catch{ return null }
}

async function enviar(){
  const o = sortear();
  const foto = await pegarFoto(o.link);
  const linkAf = `https://www.mercadolivre.com.br/social/${SEU_ID}?matt_tool=84859939&matt_source=TELEGRAM&url=${encodeURIComponent(o.link)}`;
  const legenda = `🔥 *${o.titulo.toUpperCase()}* 🔥\n\n❌ De: R$ ${o.antigo}\n✅ Por: *R$ ${o.preco}* - ${o.desc}% OFF\n\n👉 [🛒 COMPRAR COM DESCONTO](${linkAf})\n\n_⏰ Oferta por tempo limitado_`;
  try{
    if(foto) await bot.sendPhoto(CHAT_ID, foto, { caption: legenda, parse_mode: "Markdown" });
    else await bot.sendMessage(CHAT_ID, legenda, { parse_mode: "Markdown" });
    console.log("ENVIADO:", o.titulo);
  }catch(e){ console.log("Erro:", e.message) }
}

app.get('/', (req,res)=>res.send('BOT ON - @Achadinhos2_ML'));
app.listen(process.env.PORT||10000, ()=>console.log('WEB OK'));

await enviar();
setInterval(enviar, 5*60*1000);
