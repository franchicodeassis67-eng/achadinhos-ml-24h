const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');
const express = require('express');
const app = express();

const CONFIG = {
  GRUPO_NOME: 'achadinhos',
  AFFILIATE: 'costaesilvaerica',
  TOOL: '84859939'
};
const SEU_NUMERO = '5511914098689';

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { args: ['--no-sandbox','--disable-setuid-sandbox'] }
});

client.on('qr', () => console.log('Escaneie o QR'));
client.on('pairing_code', (code) => {
  console.clear();
  console.log(`\n\n🔥 SEU CODIGO ERICA: ${code}\nWhatsApp > Aparelhos > Conectar com numero\n\n`);
});

client.on('ready', () => {
  console.log('✅ BOT ON - STORY + GRUPO 3H');
  postarTudo();
  setInterval(postarTudo, 3*60*60*1000);
});

async function criarStory(produto, temCupom){
  const canvas = createCanvas(1080,1920);
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0,0,1080,1920);
  grad.addColorStop(0,'#ff5fa2'); grad.addColorStop(0.5,'#a14bff'); grad.addColorStop(1,'#3d00a0');
  ctx.fillStyle=grad; ctx.fillRect(0,0,1080,1920);
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.roundRect(60,120,960,1530,50); ctx.fill();
  ctx.fillStyle='#000'; ctx.font='bold 50px Arial Black'; ctx.textAlign='center';
  ctx.fillText(produto.categoria.toUpperCase(),540,230);
  ctx.font='bold 26px Arial'; ctx.fillStyle='#555';
  ctx.fillText(produto.titulo.substring(0,55),540,280,900);
  try{ const img=await loadImage(produto.foto); ctx.drawImage(img,140,330,800,680); }catch(e){}
  ctx.font='bold 32px Arial'; ctx.fillStyle='#999';
  ctx.fillText(`De R$ ${(produto.preco*1.4).toFixed(2)}`,540,1080);
  ctx.fillStyle='#ff0000'; ctx.font='bold 36px Arial'; ctx.fillText('🔻 PREÇO BAIXOU!',540,1120);
  ctx.font='900 110px Arial'; ctx.fillStyle='#000'; ctx.fillText(`R$ ${produto.preco}`,540,1240);
  if(temCupom){
    ctx.fillStyle='#FFD600'; ctx.beginPath(); ctx.roundRect(80,1280,920,120,30); ctx.fill();
    ctx.fillStyle='#000'; ctx.font='900 48px Arial'; ctx.fillText('MLMELHORESPROMOS',540,1360);
  }else{
    ctx.fillStyle='#000'; ctx.font='bold 38px Arial'; ctx.fillText('SEM CUPOM - OFERTA DIRETA',540,1360);
  }
  ctx.fillStyle='#8a2be2'; ctx.font='bold 30px Arial';
  ctx.fillText(produto.tamanhos,540,1450);
  ctx.fillText('FRETE GRATIS • ESTOQUE BAIXO',540,1490);
  const fs=require('fs');
  const path=`/tmp/story_${Date.now()}.png`;
  fs.writeFileSync(path, canvas.toBuffer('image/png')); return path;
}

async function postarTudo(){
  const h=parseInt(new Date().toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',hour12:false}));
  if(h<8||h>22){ console.log(`⏰ ${h}h fora 8h-22h`); return; }
  const buscas=[
    { q:'tenis nike feminino promoção', cat:'Calçados Fem', tam:'Num 34 ao 39 | Fem' },
    { q:'camiseta nike masculina promoção', cat:'Roupas Masc', tam:'Tam P ao XGG | Masc' },
    { q:'tenis nike masculino promoção', cat:'Calçados Masc', tam:'Num 38 ao 43 | Masc' },
    { q:'blusa feminina nike farm promoção', cat:'Roupas Fem', tam:'Tam P ao GG | Fem' },
  ];
  try{
    const chats=await client.getChats();
    const grupo=chats.find(c=>c.isGroup&&c.name.toLowerCase().includes(CONFIG.GRUPO_NOME));
    if(!grupo){ console.log('Grupo nao achado'); return; }
    console.log(`\n🔥 ${h}h - POSTANDO 4 PRODUTOS`);
    for(let i=0;i<buscas.length;i++){
      const b=buscas[i]; const temCupom=i%2===0;
      const ml=await axios.get(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(b.q)}&limit=1&price=0-199&sort=sold_quantity_desc`);
      const p=ml.data.results[0]; if(!p) continue;
      const link=`${p.permalink}?matt_tool=${CONFIG.TOOL}&matt_word=${CONFIG.AFFILIATE}`;
      const curto=(await axios.get(`https://is.gd/create.php?format=json&url=${encodeURIComponent(link)}`)).data.shorturl;
      const produto={ foto:p.thumbnail.replace('I.jpg','O.jpg'), preco:p.price, categoria:b.cat, titulo:p.title, tamanhos:b.tam };
      const imgPath=await criarStory(produto,temCupom);
      const media=MessageMedia.fromFilePath(imgPath);
      await client.sendMessage('status@broadcast', media, { caption:`🔻 PREÇO BAIXOU ${b.cat} R$ ${p.price} ${temCupom?'| Cupom MLMELHORESPROMOS':''} 👉 ${curto}` });
      let msgGrupo=temCupom?`*🔻 PREÇO BAIXOU - ${b.cat.toUpperCase()}*\n\n📦 ${p.title}\n💸 De R$ ${(p.price*1.4).toFixed(2)} por *R$ ${p.price}*\n📏 ${b.tam}\n🎟️ *CUPOM: MLMELHORESPROMOS*\n👉 ${curto}`:`*🔻 PREÇO BAIXOU - ${b.cat.toUpperCase()}*\n\n📦 ${p.title}\n💸 *R$ ${p.price}* sem cupom\n📏 ${b.tam}\n👉 ${curto}`;
      await client.sendMessage(grupo.id._serialized, media, { caption:msgGrupo });
      console.log(`✅ ${b.cat} R$ ${p.price}`);
      await new Promise(r=>setTimeout(r,12000));
    }
  }catch(e){ console.log(e.message); }
}

client.initialize();
app.get('/', (req,res)=>res.send('ERICA BOT 3H ON'));
app.listen(3000, ()=>console.log('Server on'));
