import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import axios from 'axios';
import express from 'express';
const app = express();

async function start(){
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  const sock = makeWASocket({ auth: state, printQRInTerminal: false, browser: ['Achadinhos','Chrome','1.0'] });

  if(!sock.authState.creds.registered){
    const code = await sock.requestPairingCode('5511914098689');
    console.log(`\n\n🔥 SEU CODIGO ERICA: ${code}\nWhatsApp > Aparelhos > Conectar com numero\n\n`);
  }

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async ({connection})=>{
    if(connection==='open'){
      console.log('BOT ON - RENDER OK');
      postar(sock);
      setInterval(()=>postar(sock), 3*60*60*1000);
    }
  });
}

async function postar(sock){
  const h = new Date().toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',hour12:false});
  if(h<8||h>22) return;
  const buscas = ['tenis nike feminino','camiseta nike masculina','tenis nike masculino','blusa nike feminina'];
  try{
    const grupos = await sock.groupFetchAllParticipating();
    const idGrupo = Object.keys(grupos).find(id=>grupos[id].subject.toLowerCase().includes('achadinhos'));
    if(!idGrupo){ console.log('Grupo nao achado'); return; }

    for(let i=0;i<buscas.length;i++){
      const q = buscas[i]; const temCupom = i%2===0;
      const r = await axios.get(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(q+' promoção')}&limit=1`);
      const p = r.data.results[0]; if(!p) continue;
      const link = `${p.permalink}?matt_tool=84859939&matt_word=costaesilvaerica`;
      const short = (await axios.get(`https://is.gd/create.php?format=json&url=${encodeURIComponent(link)}`)).data.shorturl;
      const foto = p.thumbnail.replace('I.jpg','O.jpg');

      const texto = temCupom
     ? `🔻 *PREÇO BAIXOU - ${q.toUpperCase()}*\n\n📦 ${p.title}\n💸 De R$ ${(p.price*1.4).toFixed(2)} por *R$ ${p.price}*\n🎟️ *CUPOM: MLMELHORESPROMOS*\n👉 ${short}`
      : `🔻 *PREÇO BAIXOU - ${q.toUpperCase()}*\n\n📦 ${p.title}\n💸 *R$ ${p.price}* SEM CUPOM\n👉 ${short}`;

      await sock.sendMessage('status@broadcast', { image: { url: foto }, caption: texto });
      await sock.sendMessage(idGrupo, { image: { url: foto }, caption: texto });
      await new Promise(r=>setTimeout(r,10000));
    }
  }catch(e){ console.log(e.message); }
}

start();
app.get('/', (req,res)=>res.send('ERICA BOT ON RENDER'));
app.listen(3000);
}
