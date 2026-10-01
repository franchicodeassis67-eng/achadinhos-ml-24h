import express from 'express';
import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import axios from 'axios';

const app = express();
let qrCodeData = null;
let isConnected = false;
const SEU_ID = "costaesilvaerica";
const PRODUTOS = ['iphone','jbl','nike','air fryer','smartwatch','perfume importado'];
let indice = 0;

app.get('/', async (req,res)=>{
  if(isConnected) return res.send('<h1 style="text-align:center;margin-top:100px">✅ BOT AFILIADO ON - link direto</h1>');
  if(!qrCodeData) return res.send('<h1 style="text-align:center">Gerando QR... F5 em 10s</h1>');
  const qrImage = await QRCode.toDataURL(qrCodeData);
  res.send(`<div style="text-align:center"><img src="${qrImage}" style="width:340px;border:10px solid black"/></div>`);
});
app.listen(process.env.PORT||10000, ()=>console.log('WEB OK'));

async function buscarOferta(){
  const termo = PRODUTOS[indice % PRODUTOS.length];
  indice++;
  const { data } = await axios.get(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=20`, { timeout:10000 });
  // pega só produtos com foto boa
  const validos = data.results.filter(p=>p.thumbnail && p.permalink);
  const p = validos[Math.floor(Math.random()*5)];
  const antigo = p.original_price || (p.price*1.5);
  const desc = Math.round((1-p.price/antigo)*100);
  
  // FOTO via proxy que nunca bloqueia
  const fotoOriginal = p.thumbnail.replace('http://','https://');
  const fotoProxy = `https://images.weserv.nl/?url=${encodeURIComponent(fotoOriginal)}&w=600&h=600`;

  // LINK DE AFILIADO DIRETO - vai pro produto e te comissiona
  const linkAfiliado = `https://www.mercadolivre.com.br/social/${SEU_ID}?matt_tool=84859939&matt_source=WHATSAPP&matt_campaign=ACHADINHOS24H&url=${encodeURIComponent(p.permalink)}`;

  return { titulo:p.title, preco:p.price.toFixed(2), antigo:antigo.toFixed(2), desc:desc>5?desc:45, foto:fotoProxy, link:linkAfiliado, linkReal:p.permalink };
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
          const legenda = `🔥 *${o.titulo.toUpperCase().substring(0,60)}* 🔥\n\n❌ De: R$ ${o.antigo}\n✅ Por: *R$ ${o.preco}* - ${o.desc}% OFF\n\n👉 Compra aqui com desconto:\n${o.link}\n\n_ Link afiliado, você não paga a mais _`;
          const grupos = await sock.groupFetchAllParticipating();
          for(let id in grupos){
            await sock.sendMessage(id, { image:{url:o.foto}, caption:legenda });
            console.log('Enviado com foto real:', o.titulo);
          }
        }catch(e){ console.log('Erro enviar:', e.message); }
      };
      await enviar();
      setInterval(enviar, 180000);
    }
    if(connection==='close'){ isConnected=false; setTimeout(()=>start(),5000); }
  });
}
start();
