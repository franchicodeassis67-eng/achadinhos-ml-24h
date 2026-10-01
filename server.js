async function buscarOferta(){
  const termo = PRODUTOS[indice % PRODUTOS.length]; indice++;
  try{
    const { data } = await axios.get(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=15`, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      timeout: 10000
    });
    const p = data.results[Math.floor(Math.random()*10)];
    const antigo = p.original_price || (p.price*1.35);
    const desc = Math.round((1-p.price/antigo)*100);
    let foto = p.thumbnail.replace('http://','https://').replace('-I.jpg','-O.jpg');
    const link = `https://www.mercadolivre.com.br/social/${SEU_ID}?matt_tool=84859939&matt_source=WHATSAPP&url=${encodeURIComponent(p.permalink)}`;
    return { titulo:p.title, preco:p.price.toFixed(2), antigo:antigo.toFixed(2), desc:desc>5?desc:35, foto, link };
  }catch(e){
    console.log('ML bloqueou 403, usando oferta fake pra teste de grupo');
    return {
      titulo: `${termo.toUpperCase()} EM OFERTA TESTE`,
      preco: "199.90",
      antigo: "299.90",
      desc: 33,
      foto: null,
      link: `https://www.mercadolivre.com.br/social/${SEU_ID}?matt_tool=84859939`
    };
  }
}
