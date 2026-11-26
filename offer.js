(()=>{
  const $=selector=>document.querySelector(selector);
  const dialog=$('#offer-dialog'),form=$('#offer-form'),kind=$('#offer-kind');
  const kindDialog=$('#offer-kind-dialog'),kindPicker=$('#offer-kind-picker');
  const amount=$('#offer-amount'),swap=$('#offer-swap'),other=$('#offer-other'),finance=$('#offer-finance'),error=$('#offer-error');
  const choices=[...document.querySelectorAll('[data-offer-kind]')];
  const labels={money:'Proposta em dinheiro',mixed:'Dinheiro + permuta',swap:'Somente permuta',other:'Outro'};
  const syncModalLock=()=>document.body.classList.toggle('modal-open',dialog.open||kindDialog.open);
  const number=new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  let destination=(window.SITE_CONFIG?.whatsapp||'').replace(/\D/g,'');
  if(destination.length===10||destination.length===11)destination='55'+destination;
  const validPhone=/^55\d{10,11}$/.test(destination);
  if(validPhone)form.action='https://wa.me/'+destination;
  function readAmount(){
    const value=amount.value.trim().replace(/^R\$\s*/i,'').replace(/\s/g,'');
    if(!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(value))return NaN;
    return Number(value.replace(/\./g,'').replace(',','.'));
  }
  function maskAmount(){
    const raw=amount.value;if(raw.includes('-'))return;
    const caret=amount.selectionStart??raw.length;
    const prefix=raw.slice(0,caret).replace(/[^\d,]/g,'');
    const cleaned=raw.replace(/[^\d,]/g,'');
    const comma=cleaned.indexOf(',');
    const integer=(comma<0?cleaned:cleaned.slice(0,comma)).replace(/^0+(?=\d)/,'');
    const fraction=comma<0?'':cleaned.slice(comma+1).replace(/,/g,'').slice(0,2);
    const grouped=integer.replace(/\B(?=(\d{3})+(?!\d))/g,'.');
    const formatted=(grouped||(comma>=0?'0':''))+(comma>=0?','+fraction:'');
    amount.value=formatted;
    let next=formatted.length;
    if(caret<raw.length){let seen=0;for(let i=0;i<formatted.length;i++){if(/[\d,]/.test(formatted[i]))seen++;if(seen>=prefix.length){next=i+1;break}}if(!prefix.length)next=0}
    amount.setSelectionRange(next,next);
  }
  function update(){
    const hasMoney=kind.value==='money'||kind.value==='mixed',hasSwap=kind.value==='mixed'||kind.value==='swap',hasOther=kind.value==='other';
    $('#offer-amount-field').hidden=!hasMoney;amount.disabled=!hasMoney;amount.required=hasMoney;
    $('#offer-swap-field').hidden=!hasSwap;swap.disabled=!hasSwap;swap.required=hasSwap;
    $('#offer-other-field').hidden=!hasOther;other.disabled=!hasOther;other.required=hasOther;
    $('#offer-finance-field').hidden=!hasMoney;finance.disabled=!hasMoney;
    $('#offer-amount-label').textContent=kind.value==='mixed'?'Quanto você oferece em dinheiro?':'Quanto você quer oferecer?';
    $('#offer-amount-help').textContent=kind.value==='mixed'?'Informe só a parte em dinheiro, além da permuta.':'';
    $('#offer-amount-help').hidden=kind.value!=='mixed';
    $('#offer-kind-current').textContent=labels[kind.value];
    choices.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.offerKind===kind.value)));
    const value=readAmount();
    amount.setCustomValidity(hasMoney&&amount.value.trim()&&(!Number.isFinite(value)||value<=0||value>99999999999.99)?'Informe um valor válido em reais, maior que zero. Ex.: 1.000.000,00.':'');
    swap.setCustomValidity(hasSwap&&swap.value&&!swap.value.trim()?'Descreva o bem que você pretende oferecer na permuta.':'');
    other.setCustomValidity(hasOther&&other.value&&!other.value.trim()?'Descreva como seria a sua proposta.':'');
    $('#offer-message').value=window.PropertyMessages.offer({kind:kind.value,amount:value,swap:swap.value,other:other.value,finance:finance.checked});
  }
  document.querySelectorAll('#open-offer,[data-open-offer]').forEach(button=>{button.onclick=()=>{update();error.hidden=true;kindDialog.showModal();kindPicker.setAttribute('aria-expanded','true');syncModalLock()}});
  $('#close-offer').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{if(kindDialog.open)kindDialog.close();syncModalLock()});
  kindPicker.onclick=()=>{kindDialog.showModal();kindPicker.setAttribute('aria-expanded','true');syncModalLock()};
  $('#close-offer-kind').onclick=()=>kindDialog.close();
  kindDialog.addEventListener('close',()=>{kindPicker.setAttribute('aria-expanded','false');syncModalLock()});
  choices.forEach(button=>button.onclick=()=>{kind.value=button.dataset.offerKind;update();kindDialog.close();if(!dialog.open)dialog.showModal();syncModalLock()});
  [dialog,kindDialog].forEach(modal=>modal.addEventListener('click',event=>{if(event.target!==modal)return;const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)modal.close()}));
  amount.addEventListener('input',maskAmount);form.addEventListener('input',update);
  amount.addEventListener('blur',()=>{const value=readAmount();if(Number.isFinite(value)&&value>0&&value<=99999999999.99){amount.value=number.format(value);update()}});
  form.addEventListener('submit',event=>{update();if(!validPhone){event.preventDefault();error.textContent='O contato está indisponível no momento. Tente novamente em breve.';error.hidden=false;return}if(!form.reportValidity())event.preventDefault()});
  update();
})();
