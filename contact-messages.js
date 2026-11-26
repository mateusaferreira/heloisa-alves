(()=>{
  const url=window.location?.protocol==='https:'?window.location.origin+'/':'https://heloisa-alves-maison-giverny.qualimaqrefrigeracao.chatgpt.site/';
  const money=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
  const property=['🏡 *MAISON GIVERNY*','📍 Gleba Palhano • Londrina/PR','📐 110 m² • 🛏️ 2 quartos • 🚗 2 vagas'];
  window.PropertyMessages=Object.freeze({
    inquiry(){return ['Olá, Heloísa! 👋','Vim pelo seu anúncio e tenho interesse neste imóvel:','',...property,'💰 *Valor anunciado: R$ 1.080.000,00*','','_Pode me passar mais informações sobre este imóvel?_','','🔗 *Link do anúncio*',url].join('\n')},
    offer({kind,amount,swap,other,finance}){
      const hasMoney=kind==='money'||kind==='mixed',hasSwap=kind==='mixed'||kind==='swap';
      const names={money:'Proposta em dinheiro',mixed:'Dinheiro + permuta',swap:'Somente permuta',other:'Outro'};
      const lines=['Olá, Heloísa! 👋','Vim pelo anúncio e gostaria de apresentar uma proposta.','',...property,'💰 *Valor anunciado: R$ 1.080.000,00*','','📝 *MINHA PROPOSTA*','*Modalidade:* '+names[kind]];
      if(hasMoney&&Number.isFinite(amount)&&amount>0)lines.push('💵 *'+(hasSwap?'Valor em dinheiro: ':'Minha oferta: ')+money.format(amount)+'*');
      if(hasSwap)lines.push('','🔄 *Permuta:*',String(swap||'').trim());
      if(kind==='other')lines.push('','💬 *Detalhes da proposta:*',String(other||'').trim());
      if(hasMoney&&finance)lines.push('','🏦 *Financiamento:* Sim, para a parte em dinheiro.');
      lines.push('','_Essa proposta pode ser analisada pelo proprietário?_','','🔗 *Link do anúncio*',url);
      return lines.join('\n');
    }
  });
})();
