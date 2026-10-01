const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

const SEU_LINK = "costaesilvaerica";
const CUPOM = "MLMELHORESPROMOS";

// 20 OFERTAS MAIS VENDIDAS ML HOJE
const OFERTAS = [
  { nome: "Fone Bluetooth TWS F9", preco: "49,90", antigo: "129,90", id: "MLB1234561" },
  { nome: "Smartwatch D20 Pro", preco: "79,90", antigo: "199,90", id: "MLB1234562" },
  { nome: "Air Fryer 4.2L Mondial", preco: "279,00", antigo: "499,00", id: "MLB1234563" },
  { nome: "Cafeteira Elétrica Cadence", preco: "89,90", antigo: "149,90", id: "MLB1234564" },
  { nome: "Kit 3 Toalhas Banho", preco: "59,90", antigo: "119,90", id: "MLB1234565" },
  { nome: "Aspirador Robô", preco: "399,00", antigo: "799,00", id: "MLB1234566" },
  { nome: "Escova Secadora 3 em 1", preco: "99,90", antigo: "229,90", id: "MLB1234567" },
  { nome: "Caixa de Som JBL Go 3", preco: "189,00", antigo: "299,00", id: "MLB1234568" },
  { nome: "Liquidificador Turbo Power", preco: "119,90", antigo: "199,90", id: "MLB1234569" },
  { nome: "Jogo de Panelas 10pçs", preco: "149,90", antigo: "299,90", id: "MLB1234570" },
  { nome: "Mop Giratório 360", preco: "69,90", antigo: "139,90", id: "MLB1234571" },
  { nome: "Câmera Wi-Fi Segurança", preco: "99,00", antigo: "189,00", id: "MLB1234572" },
  { nome: "Carregador Turbo 33W", preco: "29,90", antigo: "59,90", id: "MLB1234573" },
  { nome: "Kit Organizador Geladeira", preco: "45,90", antigo: "89,90", id: "MLB1234574" },
  { nome: "Luminária Astronauta", preco: "55,90", antigo: "109,90", id: "MLB1234575" },
  { nome: "Tenis Esportivo Masculino", preco: "79,90", antigo: "159,90", id: "MLB1234576" },
  { nome: "Perfume Importado 100ml", preco: "89,90", antigo: "179,90", id: "MLB1234577" },
  { nome: "Projetor 4K HD", preco: "299,00", antigo: "599,00", id: "MLB1234578" },
  { nome: "Balança Digital Bioimpedância", preco: "59,90", antigo: "119,90", id: "MLB1234579" },
  { nome: "Chaleira Elétrica Inox", preco: "69,90", antigo: "129,90", id: "MLB1234580" }
];

async function encurtar(link) {
  try {
    const r = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(link)}`);
    return await r.text();
  } catch { return link; }
}

async function enviarTudo() {
  console.log("ENVIANDO 20 OFERTAS ORGANIZADAS...");
  for (let p of OFERTAS) {
    const longo = `https://www.mercadolivre.com.br/search?query=${p.id}&matt_word=${SEU_LINK}`;
    const curto = await encurtar(longo);
    
    const msg = `🔥 *${p.nome}* 🔥\n💰 De ~R$ ${p.antigo}~ Por *R$ ${p.preco}*\n🎁 Cupom: \`${CUPOM}\`\n🔗 ${curto}\n⚡ _FULL 24h_ \n━━━━━━━━━━━━━━`;
    
    console.log(msg + "\n");
    // COLOCA AQUI: client.sendMessage(seuGrupo, msg)
    await new Promise(r => setTimeout(r, 2000)); // espera 2s entre cada
  }
}

app.get('/', (req, res) => res.send(`<h1>✅ ML 24H ON - ${SEU_LINK}</h1><p>Rodando com cupom ${CUPOM} e links curtos</p>`));
app.listen(PORT, () => { console.log("ON"); enviarTudo(); setInterval(enviarTudo, 40*60*1000); });
