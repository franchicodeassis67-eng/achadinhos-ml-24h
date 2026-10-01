import express from 'express';
import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';

const app = express();
let qrCodeData = null;
let isConnected = false;

// SEU ID DE AFILIADO
const SEU_ID = "costaesilvaerica";

const OFERTAS = [
  { titulo: "iPhone 15 128GB Preto", preco: "4299.00", antigo: "6999.00", desc: 38, link: "https://www.mercadolivre.com.br/apple-iphone-15-128-gb-preto/p/MLB27162815" },
  { titulo: "JBL Boombox 3 Bluetooth", preco: "1899.00", antigo: "2799.00", desc: 32, link: "https://www.mercadolivre.com.br/caixa-de-som-jbl-boombox-3-com-bluetooth-preta/p/MLB20449244" },
  { titulo: "Tenis Nike Revolution 6", preco: "199.90", antigo: "349.90", desc: 42, link: "https://www.mercadolivre.com.br/tenis-nike-revolution-6-next-nature-masculino/p/MLB19644530" },
  { titulo: "Air Fryer Mondial 4,2L", preco: "299.00", antigo: "499.00", desc: 40, link: "https://www.mercadolivre.com.br/fritadeira-eletrica-mondial-air-fryer-afn-40-bfs-42l-preta/p/MLB15177996" },
  { titulo: "Smartwatch Xiaomi Band 8 Pro", preco: "349.90", antigo: "599.90", desc: 41, link: "https://www.mercadolivre.com.br/xiaomi-smart-band-8-pro/p/MLB23815645" },
];

let ultimo = -1;
const sortear = () => { let i; do { i = Math.floor(Math.random()*OFERTAS.length) } while(i===ultimo && OFERTAS.length>1); ultimo=i; return OFERTAS[i]; };

app.get('/', async (req,res)=>{
  if(isConnected) return res.send('<h1>✅ BOT ON - Preview + Afiliado</h1>');
  if(!qrCodeData) return res.send('<h1>Gerando QR... da F5</h1>');
  res.send(`<center><img src="${await QRCode.toDataURL(qrCodeData)}" style="width:330px;border:12px solid #000;margin-top:30px"></center>`);
});
app.listen(process.env.PORT||10000, ()=>console.log('WEB OK'));

async function start(){
  const { state, saveCreds } = await useMultiFileAuthState('./auth_nova');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version, auth: state,
    logger: pino({ level: 'silent' }),
    browser:['Achadinhos','Chrome','1.0'],
    syncFullHistory:false, markOnlineOnConnect:false,
    shouldSyncHistoryMessage:()=>false, getMessage:async()=>undefined
  });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async(u)=>{
    if(u.qr) qrCodeData=u.qr;
    if(u.connection==='open'){
      isConnected=true; qrCodeData=null; console.log('CONECTADO');
      await new Promise(r=>setTimeout(r,3000));
      const enviar = async()=>{
        const o = sortear();
        // LINK DIRETO COM SEU AFILIADO - NÃO USA /social/ MAIS
        const linkAf = `${o.link}?matt_tool=84859939&matt_source=WHATSAPP&matt_medium=Achadinhos&matt_campaign=GRUPO`;
        const legenda = `🔥 *${o.titulo.toUpperCase()}* 🔥\n\n❌ De: R$ ${o.antigo}\n✅ Por: *R$ ${o.preco}* - ${o.desc}% OFF\n\n👉 ${linkAf}\n\n_⏰ Oferta por tempo limitado_`;
        try{
          const grupos = await sock.groupFetchAllParticipating();
          for(let id in grupos){
            if(!grupos[id].subject.toLowerCase().includes('achadinhos')) continue;
            await sock.sendMessage(id,{text: legenda});
            console.log('ENVIADO:', o.titulo, '->', id);
            await new Promise(r=>setTimeout(r,1500));
          }
        }catch(e){ console.log('Erro enviar:', e.message) }
      };
      await enviar();
      setInterval(enviar, 5*60*1000);
    }
    if(u.connection==='close'){ isConnected=false; setTimeout(()=>start(),3000); }
  });
}
start();
