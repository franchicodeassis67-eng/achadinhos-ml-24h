import express from 'express';
import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys';
import axios from 'axios';

const app = express();
app.get('/', (req,res)=>res.send('BOT ERICA ON'));
app.listen(process.env.PORT || 10000, ()=>console.log('WEB OK'));

async function iniciar(){
  try{
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['Achadinhos','Chrome','1.0']
    });

    sock.ev.on('creds.update', saveCreds);

    if(!sock.authState.creds.registered){
      let codigo = await sock.requestPairingCode('5511914098689');
      console.log('CODIGO ERICA: ' + codigo);
    }

    sock.ev.on('connection.update', (up)=>{
      if(up.connection === 'open'){
        console.log('CONECTADO');
        enviar(sock);
        setInterval(()=>enviar(sock), 10800000);
      }
    });

  }catch(e){ console.log('Erro start: ' + e.message); }
}

async function enviar(sock){
  try{
    const hora = new Date().getHours();
    if(hora < 8 || hora > 22) return;

    const lista = ['tenis nike feminino','camiseta nike masculina'];
    const grupos = await sock.groupFetchAllParticipating();
    const idGrupo = Object.keys(grupos).find(k => grupos[k].subject.toLowerCase().includes('achadinhos'));
    if(!idGrupo){ console.log('Grupo nao achado'); return; }

    for(let q of lista){
      let r = await axios.get('https://api.mercadolibre.com/sites/MLB/search?q=' + encodeURIComponent(q) + '&limit=1');
      let p = r.data.results[0];
      if(!p) continue;
      let link = p.permalink + '?matt_tool=84859939&matt_word=costaesilvaerica';
      let curto = await axios.get('https://is.gd/create.php?format=json&url=' + encodeURIComponent(link));
      let texto = '🔻 ' + q.toUpperCase() + '\n📦 ' + p.title + '\n💸 R$ ' + p.price + '\n👉 ' + curto.data.shorturl;
      await sock.sendMessage(idGrupo, { image: { url: p.thumbnail.replace('I.jpg','O.jpg') }, caption: texto });
    }
  }catch(e){ console.log('Erro enviar: ' + e.message); }
}

iniciar();
