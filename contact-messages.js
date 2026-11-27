(()=>{
  const data={title:'Maison Giverny',neighborhood:'Gleba Palhano',city:'Londrina',state:'PR',area:110,bedrooms:2,parking:2,price:1080000,...(window.PROPERTY_PAGE||{})};
  const url=window.location?.protocol==='https:'?window.location.origin+(window.location.pathname||'/'):(data.canonicalUrl||'https://heloisa-alves-maison-giverny.qualimaqrefrigeracao.chatgpt.site/');
  const money=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
  const number=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2});
  const property=['🏡 *'+data.title.toLocaleUpperCase('pt-BR')+'*','📍 '+data.neighborhood+' • '+data.city+'/'+data.state,'📐 '+number.format(data.area)+' m² • 🛏️ '+data.bedrooms+(data.bedrooms===1?' quarto':' quartos')+' • 🚗 '+data.parking+(data.parking===1?' vaga':' vagas')];
  const asking='💰 *Valor anunciado: '+money.format(data.price)+'*';
  window.PropertyMessages=Object.freeze({
    inquiry(){return ['Olá, Heloísa! 👋','Vim pelo seu anúncio e tenho interesse neste imóvel:','',...property,asking,'','_Pode me passar mais informações sobre este imóvel?_','','🔗 *Link do anúncio*',url].join('\n')},
    offer({kind,amount,swap,other,finance}){
      const hasMoney=kind==='money'||kind==='mixed',hasSwap=kind==='mixed'||kind==='swap';
      const names={money:'Proposta em dinheiro',mixed:'Dinheiro + permuta',swap:'Somente permuta',other:'Outro'};
      const lines=['Olá, Heloísa! 👋','Vim pelo anúncio e gostaria de apresentar uma proposta.','',...property,asking,'','📝 *MINHA PROPOSTA*','*Modalidade:* '+names[kind]];
      if(hasMoney&&Number.isFinite(amount)&&amount>0)lines.push('💵 *'+(hasSwap?'Valor em dinheiro: ':'Minha oferta: ')+money.format(amount)+'*');
      if(hasSwap)lines.push('','🔄 *Permuta:*',String(swap||'').trim());
      if(kind==='other')lines.push('','💬 *Detalhes da proposta:*',String(other||'').trim());
      if(hasMoney&&finance)lines.push('','🏦 *Financiamento:* Sim, para a parte em dinheiro.');
      lines.push('','_Essa proposta pode ser analisada pelo proprietário?_','','🔗 *Link do anúncio*',url);
      return lines.join('\n');
    }
  });
})();
