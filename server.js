import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import * as cheerio from 'cheerio';

const app = express();
const TOKEN = "8740167282:AAF5yoisDDEt9eTJmexx-TiipbanZm8Rnts";
const CHAT_ID = "@Achadinhos2_ML";
const SEU_USER = "costaesilvaerica";
const bot = new TelegramBot(TOKEN, { polling: false });

const LINKS = [
  "https://www.mercadolivre.com.br/apple-iphone-15-128-gb-preto/p/MLB27162815",
  "https://www.mercadolivre.com.br/tenis-nike-revolution-6-next-nature-masculino/p/MLB19644530",
  "https://www.mercadolivre.com.br/fritadeira-eletrica-mondial-air-fryer-afn-40-bfs-42l-preta/p/MLB15177996"
];

const GANCHOS = ["🔥 PREÇO DESPENCU", "⚡️ CORRE QUE ABAIXOU", "💸 METADE DO PREÇO", "🚀 OFERTA RELÂMPAGO", "😱 TÁ MUITO BARATO"];

async function pegarDados(link){
  try{
    const { data } = await axios.get(link, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(data);
    const titulo = $('h1').first().text().trim().substring(0,100);
    const preco = $('.andes-money-amount__fraction').first().text().trim();
    const foto = $('meta[property="og:image"]').attr('content');
    return { titulo, preco, foto };
  }catch(e){
    return { titulo: "Oferta Imperdível", preco: "199", foto: "https://http2.mlstatic.com/D_NQ_NP_2X_123456-MLA.jpg" };
  }
}

async function enviar(){
  const link = LINKS[Math.floor(Math.random()*LINKS.length)];
  const dados = await pegarDados(link);
  const gancho = GANCHOS[Math.floor(Math.random()*GANCHOS.length)];
  const linkAf = `https://www.mercadolivre.com.br/social/${SEU_USER}?matt_tool=84859939&matt_source=TELEGRAM&url=${encodeURIComponent(link)}`;

  const legenda = `${gancho}\n**${dados.titulo}**\n\n💸 DE: ~R$ ${Number(dados.preco)*1.7.toFixed(0)},00~\n🔥 POR: R$ ${dados.preco}\n💳 ou em 10x de R$ ${(dados.preco/10).toFixed(2)} sem juros\n\n🔗 ${linkAf}\n\n⚠️ Preço e estoque sujeitos a alteração.`;

  try{
    const r = await axios.get(dados.foto, { responseType: 'arraybuffer', timeout: 15000 });
    await bot.sendPhoto(CHAT_ID, Buffer.from(r.data), { caption: legenda, parse_mode: "Markdown" });
    console.log("ENVIADO ESTILO GT:", dados.titulo);
  }catch(e){ console.log("Erro:", e.message); }
}

app.get('/', (req,res)=>res.send('BOT GT ON'));
app.listen(process.env.PORT || 10000);
enviar();
setInterval(enviar, 15*60*1000);
