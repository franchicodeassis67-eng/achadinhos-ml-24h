import express from 'express';
import pkg from '@whiskeysockets/baileys';
const { default: makeWASocket, useMultiFileAuthState } = pkg;

const app = express();
app.get('/', (req,res)=>res.send('BOT ON'));
app.listen(process.env.PORT || 10000, ()=>console.log('WEB OK'));

async function start(){
  const { state, saveCreds } = await useMultiFileAuthState('./auth_final');
  const sock = makeWASocket({ 
    auth: state, 
    browser: ['Chrome','Windows','10'],
    printQRInTerminal: false
  });
  sock.ev.on('creds.update', saveCreds);

  if(!sock.authState.creds.registered){
    console.log('Aguardando 8s pra gerar codigo (evitar bloqueio)...');
    setTimeout(async()=>{
      try{
        const code = await sock.requestPairingCode('5511914098689');
        console.log(`\n\n===== CODIGO NOVO: ${code} =====\nTEM 60 SEGUNDOS!\n\n`);
      }catch(e){ console.log('Erro ao pedir codigo:', e.message); }
    }, 8000); // 8 segundos, não 3!
  }

  sock.ev.on('connection.update', (u)=>{
    console.log('Status:', u.connection);
    if(u.connection==='open') console.log('CONECTOU!!!! SALVOU!');
    if(u.connection==='close'){
      console.log('Fechou, espera 30s pra tentar de novo...');
    }
  });
}
start();
