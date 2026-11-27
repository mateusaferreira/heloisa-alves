(() => {
  if(['#valor','#fotos','#detalhes','#caracteristicas','#localizacao'].includes(location.hash)){
    location.replace('/imoveis/maison-giverny/'+location.search+location.hash);return;
  }
  const input=document.querySelector('#property-search'),cards=[...document.querySelectorAll('[data-home-property]')];
  const filters=[...document.querySelectorAll('[data-filter]')],clear=document.querySelector('.home-search-clear'),empty=document.querySelector('.home-empty'),status=document.querySelector('.home-results');
  const normalize=text=>String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  let kind='todos';
  function update(){
    const terms=normalize(input.value).split(/\s+/).filter(Boolean);let count=0;
    for(const card of cards){const text=normalize(card.dataset.search);const visible=(kind==='todos'||card.dataset.kind===kind)&&terms.every(term=>text.includes(term));card.hidden=!visible;if(visible)count++;}
    status.textContent=count+(count===1?' imóvel':' imóveis');empty.hidden=count!==0;clear.hidden=!input.value;
    for(const filter of filters)filter.setAttribute('aria-pressed',String(filter.dataset.filter===kind));
  }
  input.addEventListener('input',update);
  document.querySelector('.home-search').addEventListener('submit',event=>{event.preventDefault();update();input.blur();});
  for(const filter of filters)filter.addEventListener('click',()=>{kind=filter.dataset.filter;update();});
  clear.addEventListener('click',()=>{input.value='';update();input.focus();});
  document.querySelector('.home-reset').addEventListener('click',()=>{input.value='';kind='todos';update();input.focus();});
  update();
})();
