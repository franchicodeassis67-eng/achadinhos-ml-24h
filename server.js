import express from 'express';
import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import axios from 'axios';

const app = express();
let qrCodeData = null;
let isConnected = false;
const SEU_ID = "costaesilvaerica";
const PRODUTOS = ['celular xiaomi','fone bluetooth','smartwatch','jbl','tenis nike','air fryer'];
let indice = 0;

app.get('/', async (req,res)=>{
  if(isConnected) return res.send('<h1 style="text-align:center;margin-top:100px">✅ BOT ON - foto corrigida</h1>');
  if(!qrCodeData) return res.send('<h1 style="text-align:center">Gerando QR... F5 em 10s</h1>');
  const qrImage = await QRCode.toDataURL(qrCodeData);
  res.send(`<div style="text-align:center"><img src="${qrImage}" style="width:340px;border:10px solid black"/></div>`);
});
app.listen(process.env.PORT||10000, ()=>console.log('WEB OK'));

async function getImageBuffer(url){
  try{
    const r = await axios.get(url, { responseType:'arraybuffer', headers:{'User-Agent':'Mozilla/5.0'}, timeout:10000 });
    if(r.data) return Buffer.from(r.data);
  }catch(e){}
  try{
    // reserva que SEMPRE funciona
    const r2 = await axios.get('https://picsum.photos/600', { responseType:'arraybuffer', timeout:10000 });
    return Buffer.from(r2.data);
  }catch(e){
    return null;
  }
}

async function buscarOferta(){
  const termo = PRODUTOS[indice % PRODUTOS.length];
  indice++;
  try{
    const { data } = await axios.get(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=10`, { headers:{'User-Agent':'Mozilla/5.0'}, timeout:10000 });
    const p = data.results[Math.floor(Math.random()*5)];
    const antigo = p.original_price || (p.price*1.45);
    const desc = Math.round((1-p.price/antigo)*100);
    const fotoUrl = p.thumbnail.replace('http://','https://').replace('I.jpg','O.jpg');
    const buffer = await getImageBuffer(fotoUrl);
    return { titulo:p.title, preco:p.price.toFixed(2), antigo:antigo.toFixed(2), desc:desc>5?desc:40, buffer, link:`https://www.mercadolivre.com.br/social/${SEU_ID}?matt_tool=84859939&url=${encodeURIComponent(p.permalink)}` };
  }catch(e){
    const buffer = await getImageBuffer('https://picsum.photos/600');
    return { titulo:`Oferta ${termo} - Achadinhos 24h`, preco:"79.90", antigo:"199.90", desc:60, buffer, link:`https://www.mercadolivre.com.br/social/${SEU_ID}` };
  }
}

async function start(){
  const { state, saveCreds } = await useMultiFileAuthState('./auth_qr');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({ version, auth: state, browser:['Achadinhos','Chrome','1.0'] });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async(u)=>{
    const { qr, connection } = u;
    if(qr) qrCodeData=qr;
    if(connection==='open'){
      isConnected=true; qrCodeData=null; console.log('CONECTADO');
      const enviar=async()=>{
        try{
          const o = await buscarOferta();
          const legenda = `🔥 *ACHADINHOS ML 24H* 🔥\n\n📦 ${o.titulo}\n❌ De: R$ ${o.antigo}\n✅ Por: *R$ ${o.preco}* - ${o.desc}% OFF\n🎟️ CUPOM: MELHORESOFERTAS\n\n👉 ${o.link}`;
          const grupos = await sock.groupFetchAllParticipating();
          for(let id in grupos){
            if(o.buffer){
              await sock.sendMessage(id, { image:o.buffer, caption:legenda });
            }else{
              await sock.sendMessage(id, { text:legenda });
            }
          }
          console.log('Enviado OK:', o.titulo);
        }catch(err){
          console.log('Erro no enviar:', err.message);
        }
      };
      await enviar();
      setInterval(enviar, 180000);
    }
    if(connection==='close'){ isConnected=false; setTimeout(()=>start(),5000); }
  });
}
start();
