import express from 'express';
import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import axios from 'axios';

const app = express();
let qrCodeData = null;
let isConnected = false;
const SEU_ID = "costaesilvaerica";
const PRODUTOS = ['iphone 15','jbl boombox','tenis nike','air fryer','smartwatch','perfume importado','geladeira'];
let indice = 0;

app.get('/', async (req,res)=>{
  if(isConnected) return res.send('<h1 style="text-align:center;margin-top:100px">✅ BOT ON - CONECTADO</h1>');
  if(!qrCodeData) return res.send('<h1 style="text-align:center;margin-top:100px">Gerando QR... atualiza em 10s</h1>');
  const qrImage = await QRCode.toDataURL(qrCodeData);
  res.send(`<center><img src="${qrImage}" style="width:330px;border:12px solid #000;margin-top:30px"><p>Escaneia no WhatsApp</p></center>`);
});
app.listen(process.env.PORT||10000, ()=>console.log('WEB OK'));

async function buscarOferta(){
  const termo = PRODUTOS[indice % PRODUTOS.length]; indice++;
  const { data } = await axios.get(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=15`);
  const p = data.results[Math.floor(Math.random()*10)];
  const antigo = p.original_price || (p.price*1.35);
  const desc = Math.round((1-p.price/antigo)*100);
  let foto = p.thumbnail.replace('http://','https://').replace('-I.jpg','-O.jpg');
  const link = `https://www.mercadolivre.com.br/social/${SEU_ID}?matt_tool=84859939&matt_source=WHATSAPP&url=${encodeURIComponent(p.permalink)}`;
  return { titulo:p.title, preco:p.price.toFixed(2), antigo:antigo.toFixed(2), desc:desc>5?desc:35, foto, link };
}
async function baixarFoto(url){
  try{
    const r = await axios.get(url, { responseType:'arraybuffer', headers:{'User-Agent':'Mozilla/5.0','Referer':'https://www.mercadolivre.com.br/','Accept':'image/*'}});
    return Buffer.from(r.data);
  }catch{ return null; }
}
async function start(){
  const { state, saveCreds } = await useMultiFileAuthState('./auth_nova');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version, auth: state,
    browser:['Achadinhos','Chrome','1.0'],
    syncFullHistory:false,
    markOnlineOnConnect:false,
    shouldSyncHistoryMessage:()=>false,
    getMessage:async()=>undefined
  });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async(u)=>{
    const { qr, connection, lastDisconnect } = u;
    if(qr){ qrCodeData=qr; console.log('QR GERADO'); }
    if(connection==='open'){
      isConnected=true; qrCodeData=null;
      console.log('CONECTADO SEM BAD MAC');
      await new Promise(r=>setTimeout(r,4000));
      const enviar=async()=>{
        try{
          const o = await buscarOferta();
          const legenda = `🔥 *${o.titulo.substring(0,80).toUpperCase()}* 🔥\n\n❌ De: R$ ${o.antigo}\n✅ Por: *R$ ${o.preco}* - ${o.desc}% OFF\n\n👉 Compre aqui:\n${o.link}`;
          const grupos = await sock.groupFetchAllParticipating();
          console.log('GRUPOS ENCONTRADOS:', Object.keys(grupos).length);
          for(let id in grupos){ console.log('Grupo:', grupos[id].subject); }
          const buf = await baixarFoto(o.foto);
          for(let id in grupos){
            try{
              if(buf) await sock.sendMessage(id,{image:buf,caption:legenda});
              else await sock.sendMessage(id,{text:legenda});
              await new Promise(r=>setTimeout(r,2500));
            }catch(e){ console.log('Erro grupo', e.message); }
          }
          console.log('ENVIO FINALIZADO:', o.titulo);
        }catch(e){ console.log('Erro geral:', e.message); }
      };
      await enviar();
      setInterval(enviar, 3*60*1000);
    }
    if(connection==='close'){
      isConnected=false;
      console.log('Desconectado, reconectando...');
      setTimeout(()=>start(),3000);
    }
  });
}
start();
