(() => {
 const model=window.PropertyFilters,panel=document.querySelector('#home-map-panel');if(!model||!panel)return;
 const catalog=window.PROPERTY_CATALOG||[],propertyMode=Boolean(document.body.dataset.propertyId),mobile=matchMedia('(max-width:760px)');
 const currency=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
 const compact=value=>value>=1000000?'R$ '+(value/1000000).toLocaleString('pt-BR',{maximumFractionDigits:2})+' mi':'R$ '+(value/1000).toLocaleString('pt-BR',{maximumFractionDigits:1})+' mil';
 const icon=paths=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+paths+'</svg>';
 const icons={price:icon('<path d="M3 3h8l10 10-8 8L3 11V3Z"/><circle cx="7.5" cy="7.5" r="1"/>'),bedrooms:icon('<path d="M3 18V7m0 7h18v4M3 11h18v7M6 11V7h5v4m2 0V7h5v4M3 18v3m18-3v3"/>'),type:icon('<path d="m3 10 9-7 9 7M5 9v12h14V9M10 21v-7h4v7"/>')};
 const titles={price:'Valor do imóvel',bedrooms:'Quartos',type:'Tipo de imóvel'};
 const toolbar=document.createElement('div');toolbar.className='map-filter-toolbar';toolbar.setAttribute('aria-label','Filtros dos imóveis');
 toolbar.innerHTML=Object.keys(titles).map(key=>'<button type="button" class="map-filter-trigger" data-map-filter="'+key+'" aria-haspopup="dialog" aria-expanded="false">'+icons[key]+'<span></span>'+icon('<path d="m7 10 5 5 5-5"/>')+'</button>').join('')+'<button type="button" class="map-filter-clear" hidden>Limpar filtros</button>';
 const clear=toolbar.querySelector('.map-filter-clear'),triggers=[...toolbar.querySelectorAll('[data-map-filter]')];
 const compactTrigger=document.createElement('button');compactTrigger.type='button';compactTrigger.className='map-filter-compact';compactTrigger.hidden=true;compactTrigger.dataset.mapFilter=propertyMode?'price':'all';compactTrigger.setAttribute('aria-haspopup','dialog');compactTrigger.setAttribute('aria-expanded','false');
 compactTrigger.innerHTML=icon('<path d="M3 6h18M3 12h18M3 18h18"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>')+'<span>Filtros</span><span class="map-filter-badge" aria-hidden="true" hidden></span>';
 const summary=document.createElement('p');summary.className='map-filter-summary';summary.hidden=true;summary.setAttribute('aria-live','polite');
 panel.querySelector('.map-back-to-list').after(compactTrigger,summary);
 const browseTrigger=document.querySelector('.home-browse-filter'),browseBadge=browseTrigger?.querySelector('.browse-filter-badge');
 const openers=[...triggers,compactTrigger,...(browseTrigger?[browseTrigger]:[])],badge=compactTrigger.querySelector('.map-filter-badge');
 const search=document.querySelector('.home-search');let searchRow;
 if(search){searchRow=document.createElement('div');searchRow.className='home-search-with-filters';search.before(searchRow);searchRow.append(search);}
 let mapActive=false,opener,field='price',draft,ceiling;
 const dialog=document.createElement('dialog');dialog.className='map-filters-dialog';dialog.id='property-filters-dialog';dialog.setAttribute('aria-labelledby','map-filters-title');
 const radios=(name,options)=>options.map(([value,label])=>'<label class="map-filter-choice"><input type="radio" name="'+name+'" value="'+value+'"><span>'+label+'</span></label>').join('');
 dialog.innerHTML='<form novalidate><div class="map-filters-heading"><h2 id="map-filters-title">Filtrar imóveis</h2><button type="button" class="map-filters-close" aria-label="Fechar filtros">'+icon('<path d="m6 6 12 12M18 6 6 18"/>')+'</button></div><div class="map-filters-fields"><fieldset data-filter-section="price"><legend>Valor do imóvel</legend><div class="map-price-inputs"><label>Mínimo<input name="minPrice" inputmode="numeric" autocomplete="off" placeholder="Sem mínimo" aria-label="Valor mínimo"></label><label>Máximo<input name="maxPrice" inputmode="numeric" autocomplete="off" placeholder="Sem máximo" aria-label="Valor máximo" aria-describedby="map-filter-error"></label></div><div class="map-price-ranges"><input type="range" name="minRange" min="0" step="25000" aria-label="Ajustar valor mínimo"><input type="range" name="maxRange" min="0" step="25000" aria-label="Ajustar valor máximo"></div></fieldset><fieldset data-filter-section="bedrooms"><legend>Quartos</legend><div class="map-filter-segments">'+radios('bedrooms',[[0,'Qualquer'],[1,'1+'],[2,'2+'],[3,'3+'],[4,'4+']])+'</div></fieldset><fieldset data-filter-section="type"><legend>Tipo de imóvel</legend><div class="map-filter-segments map-filter-types">'+radios('type',[['todos','Todos'],['apartamento','Apartamentos'],['casa','Casas']])+'</div></fieldset><p class="map-filter-error" id="map-filter-error" role="status" hidden></p></div><div class="map-filters-footer"><button type="button" class="map-filters-reset">Limpar</button><button type="submit" class="map-filters-apply">Aplicar</button></div></form>';
 document.body.append(dialog);
 const form=dialog.querySelector('form'),min=form.elements.minPrice,max=form.elements.maxPrice,minRange=form.elements.minRange,maxRange=form.elements.maxRange,apply=dialog.querySelector('.map-filters-apply'),error=dialog.querySelector('.map-filter-error');
 const hasFilters=filters=>Object.keys(model.defaults).some(key=>filters[key]!==model.defaults[key]);
 const normalizeText=text=>String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
 function countMatches(filters){const terms=normalizeText(document.querySelector('#property-search')?.value||'').split(/\s+/).filter(Boolean);return catalog.filter(p=>{const card=document.querySelector('[data-home-property] a[href="'+p.url+'"]')?.closest('[data-home-property]');return model.matches(p,filters)&&terms.every(term=>normalizeText(card?.dataset.search||'').includes(term));}).length;}
 function placeToolbar(){
  const compactMap=mobile.matches&&mapActive,filtered=hasFilters(model.get());
  if((mobile.matches&&mapActive)||propertyMode)panel.querySelector('.map-canvas-wrap').prepend(toolbar);else searchRow?.append(toolbar);
  toolbar.hidden=!propertyMode||compactMap||!mapActive;
  compactTrigger.hidden=!compactMap;summary.hidden=!compactMap||!filtered;panel.classList.toggle('has-filter-summary',compactMap&&filtered);
  searchRow?.classList.toggle('has-filters-toolbar',toolbar.parentNode===searchRow&&!toolbar.hidden);
  document.body.classList.toggle('has-browse-filters',!propertyMode);
  document.body.classList.toggle('map-filters-active',mapActive);
 }
 function updateLabels(){const value=model.get();let price='Valor';if(value.minPrice!==null&&value.maxPrice!==null)price=compact(value.minPrice)+' – '+compact(value.maxPrice);else if(value.maxPrice!==null)price='Até '+compact(value.maxPrice);else if(value.minPrice!==null)price='A partir de '+compact(value.minPrice);
  const labels={price,bedrooms:value.bedrooms?value.bedrooms+'+ quartos':'Quartos',type:({todos:'Tipo',apartamento:'Apartamentos',casa:'Casas'})[value.type]};
  for(const button of triggers){const key=button.dataset.mapFilter;button.querySelector('span').textContent=mobile.matches&&key==='price'?'Valor':labels[key];button.setAttribute('aria-label',titles[key]+': '+labels[key]);button.classList.toggle('is-filtered',key==='price'?value.minPrice!==null||value.maxPrice!==null:key==='bedrooms'?value.bedrooms>0:value.type!=='todos');}
  const parts=[];if(value.minPrice!==null||value.maxPrice!==null)parts.push(price);if(value.bedrooms)parts.push(labels.bedrooms);if(value.type!=='todos')parts.push(labels.type);
  summary.textContent=parts.join(' · ');badge.textContent=String(parts.length);badge.hidden=!parts.length;compactTrigger.setAttribute('aria-label','Filtrar imóveis'+(parts.length?' ('+parts.length+' filtros ativos)':''));
  if(browseTrigger){browseBadge.textContent=String(parts.length);browseBadge.hidden=!parts.length;browseTrigger.classList.toggle('is-filtered',!!parts.length);browseTrigger.setAttribute('aria-label','Filtros'+(parts.length?' ('+parts.length+' ativos)':''));}
  clear.hidden=!hasFilters(value);placeToolbar();
 }
 const parse=value=>{const digits=value.replace(/[^\d,]/g,'').split(',')[0];return digits?Number(digits):null;};
 function syncRanges(){ceiling=Math.max(ceiling||0,Math.ceil(Math.max(...catalog.map(p=>p.price),draft.minPrice||0,draft.maxPrice||0)/250000)*250000);minRange.max=maxRange.max=String(ceiling);minRange.value=String(draft.minPrice||0);maxRange.value=String(draft.maxPrice??ceiling);minRange.setAttribute('aria-valuetext',currency.format(Number(minRange.value)));maxRange.setAttribute('aria-valuetext',draft.maxPrice===null?'Sem máximo':currency.format(draft.maxPrice));const ranges=dialog.querySelector('.map-price-ranges');ranges.style.setProperty('--range-start',(Number(minRange.value)/ceiling*100)+'%');ranges.style.setProperty('--range-end',(Number(maxRange.value)/ceiling*100)+'%');}
 function showDraft(){min.value=draft.minPrice===null?'':currency.format(draft.minPrice);max.value=draft.maxPrice===null?'':currency.format(draft.maxPrice);for(const input of form.querySelectorAll('input[type=radio]'))input.checked=String(draft[input.name])===input.value;syncRanges();updatePreview();}
 function readDraft(){draft={minPrice:parse(min.value),maxPrice:parse(max.value),bedrooms:Number(form.elements.bedrooms.value),type:form.elements.type.value};return draft;}
 function updatePreview(){
  try{model.normalize(draft);error.hidden=true;apply.disabled=false;const count=countMatches(draft);apply.textContent=mobile.matches||field==='all'?'Ver '+count+' '+(count===1?'imóvel':'imóveis'):'Aplicar';max.removeAttribute('aria-invalid');}
  catch(exception){error.textContent=exception.message;error.hidden=false;apply.disabled=true;max.setAttribute('aria-invalid','true');}
 }
 function layoutDialog(){
  if(mobile.matches&&mapActive)opener=compactTrigger;else if(!mobile.matches&&opener===compactTrigger)opener=propertyMode?triggers.find(button=>button.dataset.mapFilter===field):browseTrigger;
  dialog.classList.toggle('is-mobile',mobile.matches);
  dialog.classList.toggle('is-unified',field==='all');
  dialog.querySelector('h2').textContent=mobile.matches||field==='all'?'Filtrar imóveis':titles[field];
  for(const section of dialog.querySelectorAll('[data-filter-section]'))section.hidden=!mobile.matches&&field!=='all'&&section.dataset.filterSection!==field;
  if(!mobile.matches&&field!=='all'&&opener){const box=opener.getBoundingClientRect(),width=field==='price'?360:field==='bedrooms'?380:360;dialog.style.width=Math.min(width,innerWidth-32)+'px';dialog.style.left=Math.max(16,Math.min(box.left,innerWidth-width-16))+'px';dialog.style.top=Math.min(box.bottom+9,innerHeight-310)+'px';}else{dialog.style.removeProperty('width');dialog.style.removeProperty('left');dialog.style.removeProperty('top');}
  updatePreview();
 }
 function open(button){opener=button;field=button.dataset.mapFilter;draft=model.get();ceiling=0;showDraft();layoutDialog();for(const trigger of openers)trigger.setAttribute('aria-expanded',String(trigger===opener));dialog.showModal();const heading=dialog.querySelector('h2');heading.tabIndex=-1;const first=mobile.matches||field==='all'?heading:field==='price'?min:dialog.querySelector('[data-filter-section="'+field+'"] input:checked');first?.focus({preventScroll:true});}
 function close(){if(dialog.open)dialog.close();}
 for(const button of openers)button.addEventListener('click',()=>open(button));
 clear.addEventListener('click',()=>model.set(model.defaults));
 dialog.querySelector('.map-filters-close').onclick=close;
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 dialog.addEventListener('close',()=>{for(const button of openers)button.setAttribute('aria-expanded','false');opener?.focus({preventScroll:true});});
 dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)close();});
 for(const input of [min,max])input.addEventListener('input',()=>{const value=parse(input.value);input.value=value===null?'':currency.format(value);readDraft();syncRanges();updatePreview();});
 for(const input of form.querySelectorAll('input[type=radio]'))input.addEventListener('change',()=>{readDraft();updatePreview();});
 minRange.addEventListener('input',()=>{draft.minPrice=Math.min(Number(minRange.value),Number(maxRange.value))||null;showDraft();});
 maxRange.addEventListener('input',()=>{draft.maxPrice=Math.max(Number(maxRange.value),Number(minRange.value));showDraft();});
 dialog.querySelector('.map-filters-reset').onclick=()=>{if(mobile.matches||field==='all')draft={...model.defaults};else if(field==='price')Object.assign(draft,{minPrice:null,maxPrice:null});else draft[field]=model.defaults[field];showDraft();};
 form.addEventListener('submit',event=>{event.preventDefault();readDraft();try{model.normalize(draft);model.set(draft);close();}catch{updatePreview();max.focus();}});
 document.addEventListener('property:filters-changed',updateLabels);
 document.addEventListener('map:view-change',event=>{mapActive=event.detail.active;placeToolbar();});
 mobile.addEventListener('change',()=>{updateLabels();if(dialog.open)layoutDialog();});
 window.addEventListener('resize',()=>{if(dialog.open)layoutDialog();});
 updateLabels();
})();
