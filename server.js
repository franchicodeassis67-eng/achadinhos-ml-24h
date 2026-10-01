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
  if(isConnected) return res.send('<h1 style="text-align:center;margin-top:100px">✅ BOT AFILIADO ON - DIRETO</h1>');
  if(!qrCodeData) return res.send('<h1 style="text-align:center">Gerando QR... F5 em 10s</h1>');
  const qrImage = await QRCode.toDataURL(qrCodeData);
  res.send(`<div style="text-align:center"><img src="${qrImage}" style="width:340px;border:10px solid black"/></div>`);
});
app.listen(process.env.PORT||10000, ()=>console.log('WEB OK'));

async function buscarOferta(){
  const termo = PRODUTOS[indice % PRODUTOS.length];
  indice++;
  const { data } = await axios.get(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=20`, { timeout:10000 });
  const p = data.results[Math.floor(Math.random()*10)];
  const antigo = p.original_price || (p.price*1.5);
  const desc = Math.round((1-p.price/antigo)*100);
  // foto ORIGINAL do ML sem proxy
  const foto = p.thumbnail.replace('http://','https://');
  const linkAfiliado = `https://www.mercadolivre.com.br/social/${SEU_ID}?matt_tool=84859939&matt_source=WHATSAPP&url=${encodeURIComponent(p.permalink)}`;
  return { titulo:p.title, preco:p.price.toFixed(2), antigo:antigo.toFixed(2), desc:desc>5?desc:45, foto, link: linkAfiliado };
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
          const legenda = `🔥 *${o.titulo.substring(0,70).toUpperCase()}* 🔥\n\n❌ De: R$ ${o.antigo}\n✅ Por: *R$ ${o.preco}* - ${o.desc}% OFF\n\n👉 Link com desconto:\n${o.link}`;
          const grupos = await sock.groupFetchAllParticipating();
          for(let id in grupos){
            try{
              await sock.sendMessage(id, { image:{url:o.foto}, caption:legenda });
            }catch{
              // se foto falhar, manda só texto pra não parar
              await sock.sendMessage(id, { text:legenda + `\n\nFoto: ${o.foto}` });
            }
            await new Promise(r=>setTimeout(r,3000));
          }
          console.log('Enviado OK');
        }catch(e){ console.log('Erro enviar:', e.message); }
      };
      await enviar();
      setInterval(enviar, 180000);
    }
    if(connection==='close'){ isConnected=false; setTimeout(()=>start(),5000); }
  });
}
start();
