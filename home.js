(() => {
  if(['#valor','#fotos','#detalhes','#caracteristicas','#localizacao'].includes(location.hash)){
    location.replace('/imoveis/maison-giverny/'+location.search+location.hash);return;
  }
  const input=document.querySelector('#property-search'),cards=[...document.querySelectorAll('[data-home-property]')];
  const filters=[...document.querySelectorAll('[data-filter]')],clear=document.querySelector('.home-search-clear'),empty=document.querySelector('.home-empty'),status=document.querySelector('.home-results');
  const normalize=text=>String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  let kind='todos',area=null;
  const places=new Map((window.PROPERTY_MAP_LOCATIONS||[]).map(p=>[p.id,p]));
  const idOf=card=>card.querySelector('a').getAttribute('href').split('/').filter(Boolean).pop();
  function update(resetView=true){
    const terms=normalize(input.value).split(/\s+/).filter(Boolean);let count=0;const ids=[];
    for(const card of cards){const text=normalize(card.dataset.search),id=idOf(card),place=places.get(id);const inArea=!area||(place&&place.lat>=area.south&&place.lat<=area.north&&place.lng>=area.west&&place.lng<=area.east);const visible=(kind==='todos'||card.dataset.kind===kind)&&terms.every(term=>text.includes(term))&&inArea;card.hidden=!visible;if(visible){count++;ids.push(id);}}
    status.textContent=count+(count===1?' imóvel':' imóveis');empty.hidden=count!==0;clear.hidden=!input.value;
    for(const filter of filters)filter.setAttribute('aria-pressed',String(filter.dataset.filter===kind));
    document.dispatchEvent(new CustomEvent('home:results',{detail:{ids,resetView,area:!!area}}));
  }
  input.addEventListener('input',()=>{area=null;update();});
  document.querySelector('.home-search').addEventListener('submit',event=>{event.preventDefault();update();input.blur();});
  for(const filter of filters)filter.addEventListener('click',()=>{kind=filter.dataset.filter;area=null;update();});
  clear.addEventListener('click',()=>{input.value='';area=null;update();input.focus();});
  document.querySelector('.home-reset').addEventListener('click',()=>{input.value='';kind='todos';area=null;update();input.focus();});
  document.addEventListener('home:map-ready',()=>update());
  document.addEventListener('home:map-area',event=>{area=event.detail;update(!area);});
  const syncGeneralInquiry=()=>{if(!window.PropertyMessages?.general)return;const href='https://wa.me/5543988318811?text='+encodeURIComponent(window.PropertyMessages.general());for(const link of document.querySelectorAll('.home-contact-inquiry,a.whatsapp'))link.href=href;};
  syncGeneralInquiry();window.addEventListener('pageshow',syncGeneralInquiry);
  const actions=document.querySelector('.home-contact-actions'),intro=document.querySelector('.home-intro');
  if(actions&&intro){
    const origin=document.createComment('home-contact-position'),desktop=matchMedia('(min-width:761px)');
    actions.before(origin);
    const placeActions=()=>desktop.matches?intro.append(actions):origin.after(actions);
    desktop.addEventListener('change',placeActions);placeActions();
  }
  update();
})();
