      const enviar=async()=>{
        try{
          const o = await buscarOferta();
          const legenda = `🔥 *${o.titulo.substring(0,75).toUpperCase()}* 🔥\n\n❌ De: R$ ${o.antigo}\n✅ Por: *R$ ${o.preco}* - ${o.desc}% OFF\n\n👉 ${o.link}`;
          const grupos = await sock.groupFetchAllParticipating();
          console.log('GRUPOS ENCONTRADOS:', Object.keys(grupos).length);
          for(let id in grupos){
            console.log('Tentando enviar pra:', grupos[id].subject, id);
          }
          let buf=null; try{buf=await baixarFoto(o.foto);}catch{}
          for(let id in grupos){
            if(buf) await sock.sendMessage(id,{image:buf,caption:legenda});
            else await sock.sendMessage(id,{text:legenda});
            await new Promise(r=>setTimeout(r,2000));
          }
          console.log('Enviado OK:', o.titulo);
        }catch(e){ console.log('Erro:', e.message); }
      };
