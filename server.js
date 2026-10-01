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
  if(isConnected) return res.send('<h1 style="text-align:center;margin-top:100px">✅ BOT ON - SEM 403</h1>');
  if(!qrCodeData) return res.send('<h1 style="text-align:center">Gerando QR... F5 em 10s</h1>');
  const qrImage = await QRCode.toDataURL(qrCodeData);
  res.send(`<div style="text-align:center"><img src="${qrImage}" style="width:340px;border:10px solid black"/><p>Escaneia no WhatsApp</p></div>`);
});
app.listen(process.env.PORT||10000, ()=>console.log('WEB OK'));

async function buscarOferta(){
  const termo = PRODUTOS[indice % PRODUTOS.length];
  indice++;
  const { data } = await axios.get(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=15`, { timeout:10000 });
  const p = data.results[Math.floor(Math.random()*8)];
  const antigo = p.original_price || (p.price*1.4);
  const desc = Math.round((1-p.price/antigo)*100);
  const linkAfiliado = `https://www.mercadolivre.com.br/social/${SEU_ID}?matt_tool=84859939&matt_source=WHATSAPP&url=${encodeURIComponent(p.permalink)}`;
  // Pega foto maior e corrige http
  let fotoUrl = p.thumbnail.replace('http://','https://').replace('-I.jpg','-O.jpg').replace('-I.webp','-O.webp');
  return { titulo:p.title, preco:p.price.toFixed(2), antigo:antigo.toFixed(2), desc:desc>5?desc:42, fotoUrl, link: linkAfiliado };
}

async function baixarFotoComoBuffer(url){
  const resp = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': 'https://www.mercadolivre.com.br/',
      'Accept': 'image/avif,image/webp,image/apng,image/*,*/*'
    }
  });
  return Buffer.from(resp.data);
}

async function start(){
  const { state, saveCreds } = await useMultiFileAuthState('./auth_qr');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({ version, auth: state, browser:['Achadinhos','Chrome','1.0'], syncFullHistory:false, markOnlineOnConnect:false });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async(u)=>{
    const { qr, connection } = u;
    if(qr) qrCodeData=qr;
    if(connection==='open'){
      isConnected=true; qrCodeData=null; console.log('CONECTADO');
      await new Promise(r=>setTimeout(r,8000));
      const enviar=async()=>{
        try{
          const o = await buscarOferta();
          const legenda = `🔥 *${o.titulo.substring(0,75).toUpperCase()}* 🔥\n\n❌ De: R$ ${o.antigo}\n✅ Por: *R$ ${o.preco}* - ${o.desc}% OFF\n\n👉 Link com desconto:\n${o.link}`;
          const grupos = await sock.groupFetchAllParticipating();
          let buffer = null;
          try { buffer = await baixarFotoComoBuffer(o.fotoUrl); } catch(e){ console.log('Foto bloqueada, tentando thumb', e.message); }
          
          for(let id in grupos){
            if(buffer){
              await sock.sendMessage(id, { image: buffer, caption: legenda });
            } else {
              await sock.sendMessage(id, { text: legenda + `\n\n📸 ${o.fotoUrl}` });
            }
            await new Promise(r=>setTimeout(r,2500));
          }
          console.log('Enviado OK:', o.titulo);
        }catch(e){ console.log('Erro enviar:', e.message); }
      };
      await enviar();
      setInterval(enviar, 180000);
    }
    if(connection==='close'){ isConnected=false; setTimeout(()=>start(),5000); }
  });
}
start();
