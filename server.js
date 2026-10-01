import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys';
import axios from 'axios';
import express from 'express';
const app = express();
app.get('/', (req,res)=>res.send('ERICA BOT ON'));
app.listen(process.env.PORT || 10000);

async function start(){
 try{
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  const sock = makeWASocket({ auth: state, printQRInTerminal: false, browser: ['Achadinhos','Chrome','1.0'] });

  if(!sock.authState.creds.registered){
    const code = await sock.requestPairingCode('5511914098689');
    console.log(`\n\n🔥 CODIGO ERICA: ${code} 🔥\n\n`);
  }
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', ({connection})=>{
    if(connection==='open'){
      console.log('BOT CONECTADO');
      postar(sock);
      setInterval(()=>postar(sock), 3*60*60*1000);
    }
  });
 }catch(e){ console.log('Erro bot:', e.message); }
}

async function postar(sock){
  try{
    const h = parseInt(new Date().toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',hour12:false}));
    if(h<8||h>22) return;
    const buscas = ['tenis nike feminino','camiseta nike masculina','tenis nike masculino','blusa nike feminina'];
    const grupos = await sock.groupFetchAllParticipating();
    const idGrupo = Object.keys(grupos).find(id=>grupos[id].subject.toLowerCase().includes('achadinhos'));
    if(!idGrupo) return;
    for(let i=0;i<buscas.length;i++){
      const q = buscas[i]; const temCupom = i%2===0;
      const r = await axios.get(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(q)}&limit=1`);
      const p = r.data.results[0]; if(!p) continue;
      const link = `${p.permalink}?matt_tool=84859939&matt_word=costaesilvaerica`;
      const short = (await axios.get(`https://is.gd/create.php?format=json&url=${encodeURIComponent(link)}`)).data.shorturl;
      const texto = `${temCupom?'🔻 COM CUPOM':'🔻 SEM CUPOM'} - ${q}\n\n📦 ${p.title}\n💸 R$ ${p.price} ${temCupom?'\n🎟️ MLMELHORESPROMOS':''}\n👉 ${short}`;
      await sock.sendMessage('status@broadcast', { image: { url: p.thumbnail.replace('I.jpg','O.jpg') }, caption: texto });
      await sock.sendMessage(idGrupo, { image: { url: p.thumbnail.replace('I.jpg','O.jpg') }, caption: texto });
      await new Promise(r=>setTimeout(r,10000));
    }
  }catch(e){ console.log(e.message); }
}
start();
