import express from 'express';
import pkg from '@whiskeysockets/baileys';
const { useMultiFileAuthState } = pkg;
const makeWASocket = pkg.default;

const app = express();
app.get('/', (req,res)=>res.send('BOT ERICA ON - 24H'));
app.listen(process.env.PORT || 10000, ()=>console.log('WEB OK - LIVE'));

console.log('Iniciando bot...');

async function start(){
  try{
    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    console.log('Auth ok, criando socket...');
    
    const sock = makeWASocket({ 
      auth: state, 
      printQRInTerminal: false,
      browser: ['Achadinhos','Chrome','1.0'] 
    });
    
    sock.ev.on('creds.update', saveCreds);
    
    if(!sock.authState.creds.registered){
      console.log('Gerando codigo...');
      await new Promise(r=>setTimeout(r,2000));
      const code = await sock.requestPairingCode('5511914098689');
      console.log('\n\n===== CODIGO ERICA: '+code+' =====\n\n');
    }
    
    sock.ev.on('connection.update', (up)=>{
      console.log('Status:', up.connection);
      if(up.connection==='open') console.log('CONECTADO COM SUCESSO!!!');
    });
    
  }catch(e){
    console.log('ERRO:', e.message);
  }
}
start();
