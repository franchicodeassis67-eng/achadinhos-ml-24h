import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import express from 'express';
const app = express();
app.get('/', (req,res)=>res.send('ON'));
app.listen(process.env.PORT || 10000);

async function start(){
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  const sock = makeWASocket({ version, auth: state, browser: ['Achadinhos','Chrome','1.0'] });
  sock.ev.on('creds.update', saveCreds);
  if(!sock.authState.creds.registered){
    setTimeout(async()=>{
      const code = await sock.requestPairingCode('5511914098689');
      console.log('\n\n===== CODIGO ERICA: '+code+' =====\n\n');
    }, 3000);
  }
  sock.ev.on('connection.update', ({connection})=>{
    if(connection==='open') console.log('CONECTADO COM SUCESSO!!!');
  });
}
start();
