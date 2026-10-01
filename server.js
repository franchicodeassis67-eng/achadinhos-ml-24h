import express from 'express';
import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';

const app = express();
let qrCodeData = null;
let isConnected = false;
let sockGlobal = null;

// Seu ID de afiliado do Mercado Livre - TROCA AQUI
const AFILIADO_ML = "SEU_ID_AQUI"; 

app.get('/', async (req,res)=>{
  if(isConnected) return res.send('<h1>✅ BOT ACHADINHOS ML 24H CONECTADO! Tá rodando 24h</h1><p>Deixe o Render ligado.</p>');
  if(!qrCodeData) return res.send('<h1>Aguarde... gerando QR. Dá F5 em 10 segundos</h1>');
  const qrImage = await QRCode.toDataURL(qrCodeData);
  res.send(`
    <div style="text-align:center; margin-top:30px; font-family: sans-serif">
      <h2>Escaneia com seu WhatsApp</h2>
      <p>WhatsApp > Aparelhos conectados > Conectar aparelho</p>
      <img src="${qrImage}" style="width:320px; border:10px solid black;" />
      <p>Se expirar, atualize a página (F5)</p>
    </div>
  `);
});

app.listen(process.env.PORT || 10000, ()=>console.log('WEB OK'));

async function start(){
  const { state, saveCreds } = await useMultiFileAuthState('./auth_qr');
  const sock = makeWASocket({ auth: state, browser: ['Achadinhos','Chrome','1.0'] });
  sockGlobal = sock;
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (u)=>{
    const { qr, connection } = u;
    if(qr) qrCodeData = qr;
    if(connection==='open'){
      isConnected = true;
      qrCodeData = null;
      console.log('BOT CONECTADO COM SUCESSO!');
    }
    if(connection==='close'){
      isConnected = false;
      console.log('Desconectou, tentando de novo em 5s...');
      setTimeout(()=>start(),5000);
    }
  });

  // ===== AQUI COMEÇA A LÓGICA DO BOT =====
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if(!msg.message) return; // LIBERADO PRA RESPONDER PRA VC MESMO
    const texto = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase();
    const jid = msg.key.remoteJid;

    console.log(`Mensagem de ${jid}: ${texto}`);

    if(texto.includes('oi') || texto.includes('menu') || texto.includes('achadinhos')){
      await sock.sendMessage(jid, {
        text: `🔥 *ACHADINHOS ML 24H* 🔥\n\nFala! Eu fico 24h procurando as melhores ofertas do Mercado Livre pra você!\n\n📲 *Comandos:*\n- Digite *OFERTAS* pra ver as top ofertas de hoje\n- Digite *ELETRONICOS*\n- Digite *CASA*\n\nJá manda OFERTAS aí 👇`
      });
    }
    
    if(texto.includes('ofertas')){
      await sock.sendMessage(jid, {
        text: `💣 *TOP 3 OFERTAS DE HOJE* 💣\n\n1️⃣ Fone Bluetooth - De R$199 por R$89\n👉 https://mercadolivre.com.br/SEU_LINK_AQUI\n\n2️⃣ Smartwatch - De R$300 por R$129\n👉 https://mercadolivre.com.br/SEU_LINK_AQUI\n\n3️⃣ Caixa de Som JBL - De R$400 por R$199\n👉 https://mercadolivre.com.br/SEU_LINK_AQUI\n\nQuer que eu mande ofertas automaticas todo dia? Digite *ATIVAR*`
      });
    }
  });
}
start();
