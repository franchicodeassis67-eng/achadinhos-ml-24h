import express from 'express';
import pkg from '@whiskeysockets/baileys';
const { useMultiFileAuthState } = pkg;
const makeWASocket = pkg.default;

const app = express();
app.get('/', (req,res)=>res.send('BOT ON'));
app.listen(process.env.PORT || 10000, ()=>console.log('WEB OK'));

async function start(){
  const { state, saveCreds } = await useMultiFileAuthState('./auth_nova');
  const sock = makeWASocket({ auth: state, browser: ['Achadinhos','Chrome','1.0'] });
  sock.ev.on('creds.update', saveCreds);

  if(!sock.authState.creds.registered){
    setTimeout(async()=>{
      try{
        const code = await sock.requestPairingCode('5511914098689');
        console.log(`\n\n===== NOVO CODIGO: ${code} =====\n\n`);
      }catch(e){ console.log('Erro:', e.message); }
    },3000);
  }

  sock.ev.on('connection.update', (u)=>{
    console.log('Status:', u.connection);
    if(u.connection==='open') console.log('CONECTOU!!!');
    if(u.connection==='close'){
      console.log('Fechou, vai gerar novo em 10s');
      setTimeout(()=>start(),10000);
    }
  });
}
start();
