import express from 'express';
import pkg from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
const { default: makeWASocket, useMultiFileAuthState } = pkg;

const app = express();
let qrCodeData = null;
let isConnected = false;

app.get('/', async (req,res)=>{
  if(isConnected) return res.send('<h1>✅ BOT CONECTADO! Pode fechar.</h1>');
  if(!qrCodeData) return res.send('<h1>Aguarde... gerando QR em 10s. Atualize a página (F5)</h1>');
  const qrImage = await QRCode.toDataURL(qrCodeData);
  res.send(`
    <div style="text-align:center; margin-top:30px; font-family: sans-serif">
      <h2>Escaneia com seu WhatsApp</h2>
      <p>WhatsApp > Aparelhos conectados > Conectar aparelho</p>
      <img src="${qrImage}" style="width:300px; border:10px solid black;" />
      <p>Atualize a página se expirar (30 seg)</p>
    </div>
  `);
});

app.listen(process.env.PORT || 10000, ()=>console.log('WEB OK'));

async function start(){
  const { state, saveCreds } = await useMultiFileAuthState('./auth_qr');
  const sock = makeWASocket({ auth: state, browser: ['Achadinhos','Chrome','1.0'] });
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (u)=>{
    const { qr, connection } = u;
    if(qr){
      qrCodeData = qr;
      console.log('NOVO QR GERADO! Abre o link do Render pra escanear!');
    }
    if(connection==='open'){
      isConnected = true;
      qrCodeData = null;
      console.log('CONECTOU!!!!!');
    }
    if(connection==='close'){
      console.log('Desconectou, gerando outro QR em 5s...');
      setTimeout(()=>start(),5000);
    }
  });
}
start();
