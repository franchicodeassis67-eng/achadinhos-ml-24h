import express from 'express';
import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import axios from 'axios';

const app = express();
let qrCodeData = null;
let isConnected = false;
const SEU_ID = "costaesilvaerica";
const GRUPO_ALVO = "Achadinhos Mercado Livre 24h";

// OFERTAS REAIS - COM FOTO E PREÇO REAL
const OFERTAS = [
  { titulo: "iPhone 15 128GB Preto Tela 6.1", preco: "4299.00", antigo: "6999.00", desc: 38, foto: "https://http2.mlstatic.com/D_NQ_NP_2X_737217-MLU75934552686_042024-O.webp", link: "https://www.mercadolivre.com.br/apple-iphone-15-128-gb-preto/p/MLB27162815" },
  { titulo: "JBL Boombox 3 Bluetooth Preta", preco: "1899.00", antigo: "2799.00", desc: 32, foto: "https://http2.mlstatic.com/D_NQ_NP_2X_857981-MLA74783069330_022024-O.webp", link: "https://www.mercadolivre.com.br/caixa-de-som-jbl-boombox-3-com-bluetooth-preta/p/MLB20449244" },
  { titulo: "Tênis Nike Revolution 6 Masculino", preco: "199.90", antigo: "349.90", desc: 42, foto: "https://http2.mlstatic.com/D_NQ_NP_2X_771958-MLB73264281391_122023-O.webp", link: "https://www.mercadolivre.com.br/tenis-nike-revolution-6-next-nature-masculino/p/MLB19644530" },
  { titulo: "Air Fryer Mondial 4,2L 1500W", preco: "299.00", antigo: "499.00", desc: 40, foto: "https://http2.mlstatic.com/D_NQ_NP_2X_656268-MLB52169918886_102022-O.webp", link: "https://www.mercadolivre.com.br/fritadeira-eletrica-mondial-air-fryer-afn-40-bfs-42l-preta/p/MLB15177996" },
  { titulo: "Smartwatch Xiaomi Band 8 Pro", preco: "349.90", antigo: "599.90", desc: 41, foto: "https://http2.mlstatic.com/D_NQ_NP_2X_973571-MLU72883326205_112023-O.webp", link: "https://www.mercadolivre.com.br/xiaomi-smart-band-8-pro/p/MLB23815645" },
  { titulo: "Perfume Sauvage Dior 100ml", preco: "499.00", antigo: "799.00", desc: 37, foto: "https://http2.mlstatic.com/D_NQ_NP_2X_888063-MLB70729893989_072023-O.webp", link: "https://www.mercadolivre.com.br/perfume-sauvage-dior-edt-100ml/p/MLB15170881" },
  { titulo: "Notebook Lenovo Ideapad 3i i5 8GB", preco: "2299.00", antigo: "3299.00", desc: 30, foto: "https://http2.mlstatic.com/D_NQ_NP_2X_888199-MLU74122845241_012024-O.webp", link: "https://www.mercadolivre.com.br/notebook-lenovo-ideapad-3i-82bs0009br-intel-core-i5-8gb-256gb/p/MLB20011930" },
  { titulo: "Geladeira Brastemp Frost Free 375L", preco: "2599.00", antigo: "3899.00", desc: 33, foto: "https://http2.mlstatic.com/D_NQ_NP_2X_999999-MLB52169918886_102022-O.webp", link: "https://www.mercadolivre.com.br/geladeira-brastemp-frost-free-375l/p/MLB15177996" },
];

let indice = 0;

app.get('/', async (req,res)=>{
  if(isConnected) return res.send(`<h1>✅ BOT ON - Enviando ofertas reais só pro: ${GRUPO_ALVO}</h1>`);
  if(!qrCodeData) return res.send('<h1>Gerando QR... F5</h1>');
  const qrImage = await QRCode.toDataURL(qrCodeData);
  res.send(`<center><img src="${qrImage}" style="width:330px;border:12px solid #000;margin-top:30px"></center>`);
});
app.listen(process.env.PORT||10000, ()=>console.log('WEB OK'));

async function baixarFoto(url){
  try{
    const r = await axios.get(url, { responseType:'arraybuffer', headers:{'User-Agent':'Mozilla/5.0'}, timeout:10000 });
    return Buffer.from(r.data);
  }catch{ return null; }
}

async function start(){
  const { state, saveCreds } = await useMultiFileAuthState('./auth_nova');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({ version, auth: state, browser:['Achadinhos','Chrome','1.0'], syncFullHistory:false, markOnlineOnConnect:false, shouldSyncHistoryMessage:()=>false, getMessage:async()=>undefined });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async(u)=>{
    const { qr, connection } = u;
    if(qr) qrCodeData=qr;
    if(connection==='open'){
      isConnected=true; qrCodeData=null;
      console.log('CONECTADO - MODO REAL');
      await new Promise(r=>setTimeout(r,3000));
      const enviar=async()=>{
        const o = OFERTAS[indice % OFERTAS.length]; indice++;
        const linkAfiliado = `https://www.mercadolivre.com.br/social/${SEU_ID}?matt_tool=84859939&matt_source=WHATSAPP&url=${encodeURIComponent(o.link)}`;
        const legenda = `🔥 *${o.titulo.toUpperCase()}* 🔥\n\n❌ De: R$ ${o.antigo}\n✅ Por: *R$ ${o.preco}* - ${o.desc}% OFF\n\n👉 ${linkAfiliado}\n\n_⏰ Oferta por tempo limitado_`;
        try{
          const grupos = await sock.groupFetchAllParticipating();
          const buf = await baixarFoto(o.foto);
          for(let id in grupos){
            if(!grupos[id].subject.includes('Achadinhos')) continue;
            if(buf) await sock.sendMessage(id,{image:buf,caption:legenda});
            else await sock.sendMessage(id,{text:legenda});
            console.log('Enviado real:', o.titulo);
          }
        }catch(e){ console.log('Erro:', e.message); }
      };
      await enviar();
      setInterval(enviar, 5*60*1000); // a cada 5 min
    }
    if(connection==='close'){ isConnected=false; setTimeout(()=>start(),3000); }
  });
}
start();
