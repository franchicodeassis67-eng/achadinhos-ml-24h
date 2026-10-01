import express from 'express';
import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import axios from 'axios';

const app = express();
let qrCodeData = null;
let isConnected = false;
const SEU_ID = "costaesilvaerica";
const PRODUTOS = ['iphone 15','jbl boombox','tenis nike','air fryer','smartwatch','perfume importado'];
let indice = 0;

app.get('/', async (req,res)=>{
  if(isConnected) return res.send('<h1 style="text-align:center;margin-top:100px">✅ BOT ON - CORRIGIDO</h1>');
  if(!qrCodeData) return res.send('<h1 style="text-align:center">Gerando QR... F5 em 10s</h1>');
  const qrImage = await QRCode.toDataURL(qrCodeData);
  res.send(`<div style="text-align:center"><img src="${qrImage}" style="width:340px;border:10px solid black"/><p>Escaneia</p></div>`);
});
app.listen(process.env.PORT||10000);

async function buscarOferta(){
  const termo = PRODUTOS[indice % PRODUTOS.length]; indice++;
  const { data } = await axios.get(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=15`);
  const p = data.results[Math.floor(Math.random()*8)];
  const antigo = p.original_price || (p.price*1.4);
  const desc = Math.round((1-p.price/antigo)*100);
  let foto = p.thumbnail.replace('http://','https://').replace('-I.jpg','-O.jpg').replace('-I.webp','-O.webp');
  const link = `https://www.mercadolivre.com.br/social/${SEU_ID}?matt_tool=84859939&matt_source=WHATSAPP&url=${encodeURIComponent(p.permalink)}`;
  return { titulo:p.title, preco:p.price.toFixed(2), antigo:antigo.toFixed(2), desc:desc>5?desc:42, foto, link };
}
async function baixarFoto(url){
  const r = await axios.get(url, { responseType:'arraybuffer', headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124 Safari/537.36','Referer':'https://www.mercadolivre.com.br/','Accept':'image/*'}});
  return Buffer.from(r.data);
}
async function start(){
  const { state, saveCreds } = await useMultiFileAuthState('./auth_qr');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({ 
    version, auth: state, browser:['Achadinhos','Chrome','1.0'],
    syncFullHistory:false, markOnlineOnConnect:false,
    shouldSyncHistoryMessage:()=>false, getMessage:async()=>undefined
  });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async(u)=>{
    const { qr, connection } = u;
    if(qr) qrCodeData=qr;
    if(connection==='open'){
      isConnected=true; qrCodeData=null; console.log('CONECTADO - SEM TIMEOUT');
      await new Promise(r=>setTimeout(r,5000));
      const enviar=async()=>{
        try{
          const o = await buscarOferta();
          const legenda = `🔥 *${o.titulo.substring(0,75).toUpperCase()}* 🔥\n\n❌ De: R$ ${o.antigo}\n✅ Por: *R$ ${o.preco}* - ${o.desc}% OFF\n\n👉 ${o.link}`;
          const grupos = await sock.groupFetchAllParticipating();
          let buf=null; try{buf=await baixarFoto(o.foto);}catch{}
          for(let id in grupos){
            if(buf) await sock.sendMessage(id,{image:buf,caption:legenda});
            else await sock.sendMessage(id,{text:legenda});
            await new Promise(r=>setTimeout(r,2000));
          }
          console.log('Enviado OK:', o.titulo);
        }catch(e){ console.log('Erro:', e.message); }
      };
      await enviar(); setInterval(enviar, 180000);
    }
    if(connection==='close'){ isConnected=false; setTimeout(()=>start(),4000); }
  });
}
start();
