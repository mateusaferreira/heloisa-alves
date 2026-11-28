(() => {
  const number=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2});
  const escape=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const paths={
    area:'<rect x="7" y="3" width="10" height="18" rx="1.5"/><path d="M7 7h4M7 11h3M7 15h4M7 19h3"/>',
    bed:'<path d="M3 18V7m0 7h18v4M3 11h18v7M6 11V7h5v4m2 0V7h5v4M3 18v3m18-3v3"/>',
    bath:'<path d="m4 4 2.5 2.5M13.5 6.5a4.95 4.95 0 0 0-7 7M15 5 5 15M14 17v.01M10 16v.01M13 13v.01M16 10v.01M17 14v.01M20 11v.01M11 20v.01"/>',
    car:'<path d="m5 8 2-5h10l2 5m-14 0h14l2 4v7H3v-7l2-4Zm0 11v2m14-2v2M6 13h2m8 0h2"/>',
    pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>'
  };
  const icon=kind=>'<svg class="fact-icon" viewBox="0 0 24 24" aria-hidden="true">'+paths[kind]+'</svg>';
  const entries=p=>[
    {kind:'area',label:'Metragem',value:p.area,text:number.format(p.area)+' m²',description:(p.areaLabel||'Metragem')+': '+number.format(p.area)+' m²'},
    {kind:'bed',label:'Quartos',value:p.bedrooms,text:String(p.bedrooms),description:p.bedrooms+' '+(p.bedrooms===1?'quarto':'quartos')},
    {kind:'bath',label:'Banheiros',value:p.bathrooms,text:String(p.bathrooms),description:p.bathrooms+' '+(p.bathrooms===1?'banheiro':'banheiros')},
    {kind:'car',label:'Vagas',value:p.parking,text:String(p.parking),description:p.parking+' '+(p.parking===1?'vaga':'vagas')}
  ].filter(f=>Number.isFinite(f.value)&&f.value>=0);
  const inline=p=>entries(p).map(f=>'<span class="property-fact" data-fact="'+f.kind+'" role="group" aria-label="'+escape(f.description)+'">'+icon(f.kind)+'<strong>'+escape(f.text)+'</strong></span>').join('');
  const summary=p=>entries(p).map(f=>'<div class="summary-fact" title="'+escape(f.description)+'"><span class="metric-label">'+f.label+'</span><span class="metric-value">'+icon(f.kind)+'<strong>'+escape(f.text)+'</strong></span></div>').join('');
  const street=p=>p.streetName?icon('pin')+'<span>'+escape(p.streetName)+'</span>':'';
  const savings=p=>{const amount=p.marketReference-p.price;if(!Number.isFinite(amount)||amount<=0)return '';const value=amount%1000===0?number.format(amount/1000)+' mil':number.format(amount);return '<span class="property-savings-badge">R$ '+value+' abaixo do mercado</span>';};
  window.PropertyFacts=Object.freeze({inline,summary,street,icon,savings});
})();
