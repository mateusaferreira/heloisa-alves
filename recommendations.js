(() => {
  const section = document.querySelector('#recommended-properties');
  const dialog = document.querySelector('#recommendations-dialog');
  if (!dialog || !window.RecommendationModel) return;
  const catalog = Array.isArray(window.PROPERTY_CATALOG) ? window.PROPERTY_CATALOG : [];
  const properties = window.RecommendationModel.select(catalog, document.body.dataset.propertyId, location.href, catalog.length);
  // Não publique recomendações vazias, o próprio anúncio ou imóveis fictícios.
  if (!properties.length) return;

  const currency = new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL', maximumFractionDigits:0});
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function icon(name, viewBox = '0 0 32 32') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('viewBox', viewBox);
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#' + name + '-icon');
    svg.append(use);
    return svg;
  }
  function card(property) {
    const item = element('li');
    const link = element('a', 'recommendation-card');
    link.href = property.url;
    link.setAttribute('aria-label', 'Ver imóvel: ' + property.title);
    const photo = element('img');
    photo.src = property.image;
    photo.alt = property.imageAlt || property.title;
    photo.loading = 'lazy';
    photo.decoding = 'async';
    photo.width = 600;
    photo.height = 400;
    const body = element('div', 'recommendation-body');
    body.innerHTML=window.PropertyFacts.savings(property);
    const title = element('h3', 'recommendation-title', property.title);
    const place = element('p', 'recommendation-location');
    place.textContent=[property.neighborhood, property.city].filter(Boolean).join(' · ');
    const street=element('p','recommendation-street property-card-street');street.innerHTML=window.PropertyFacts.street(property);
    const facts = element('p', 'recommendation-facts property-card-facts');
    facts.innerHTML=window.PropertyFacts.inline(property);
    body.append(title, street, place);
    if(property.occupied===true)body.append(element('p','recommendation-occupied','Imóvel locado'));
    body.append(facts, element('p', 'recommendation-price', currency.format(property.price)), element('span', 'recommendation-cta', 'Ver imóvel'));
    link.append(photo, body);
    item.append(link);
    return item;
  }
  for (const list of [section?.querySelector('.recommendations-list'), dialog.querySelector('.recommendations-list')].filter(Boolean)) {
    if (list.dataset.prerendered !== 'true') list.append(...properties.map(card));
  }
  if (section) {
    section.hidden = false;
    section.querySelector('.recommendations-hint').hidden = properties.length < 2;
  } else {
    dialog.querySelector('.recommendations-continue').textContent = 'Continuar navegando';
  }

  const sessionKey = 'ha.recommendations.session.v1', guardKey = '__haRecommendationExit';
  const dwell = 12000, started = Date.now();
  let handled = false, storageAvailable = true, interacted = false;
  let cooldownUntil = 0, timer = 0, previousFocus = null, backExitPending = false;
  const mobile = () => matchMedia('(max-width: 760px), (hover: none), (pointer: coarse)').matches;
  const history = window.history;
  const guardToken = history?.state?.[guardKey] || String(started);
  let guardActive = Boolean(history?.state?.[guardKey]);
  try { handled = Boolean(sessionStorage.getItem(sessionKey)); }
  catch { storageAvailable = false; }
  const otherModal = () => [...document.querySelectorAll('dialog[open]')].some(node => node !== dialog);
  const leave = element('button', 'recommendations-exit', 'Sair da página');
  leave.type = 'button'; leave.hidden = true; dialog.append(leave);
  function clearPending() { clearTimeout(timer); timer = 0; }
  function remember(reason) {
    handled = true; clearPending();
    try { sessionStorage.setItem(sessionKey, reason); return true; }
    catch { storageAvailable = false; return false; }
  }
  function contactTarget(target) {
    if (!(target instanceof Element)) return false;
    if (target.closest('#open-offer,#floating-offer,[data-open-offer],#offer-dialog,#offer-kind-dialog,a.whatsapp,a.group-link')) return true;
    const link = target.closest('a[href]');
    if (!link) return false;
    try {
      const url = new URL(link.href, location.href);
      return url.protocol === 'whatsapp:' || ['wa.me', 'api.whatsapp.com', 'web.whatsapp.com', 'chat.whatsapp.com'].includes(url.hostname);
    } catch { return false; }
  }
  function ready(explicitBack = false) {
    return !handled && storageAvailable && interacted && !dialog.open && !otherModal()
      && document.visibilityState === 'visible' && (explicitBack || document.hasFocus())
      && Date.now() - started >= dwell && Date.now() >= cooldownUntil
      && !document.activeElement?.closest('input,textarea,select,[contenteditable="true"]');
  }
  function show(reason) {
    if (!ready(reason === 'back') || !remember('shown')) return false;
    backExitPending = reason === 'back'; leave.hidden = !backExitPending;
    previousFocus = document.activeElement;
    dialog.showModal(); document.body.classList.add('recommendations-modal-open');
    return true;
  }
  function armBack() {
    clearPending();
    if (!mobile() || !history || history.length < 2 || handled || !storageAvailable || !interacted || guardActive) return;
    const wait = Math.max(started + dwell - Date.now(), cooldownUntil - Date.now(), 0);
    if (wait > 0) { timer = setTimeout(armBack, wait + 50); return; }
    if (!ready(true)) return;
    // One same-URL entry lets Back offer alternatives. It is consumed once and never reinserted.
    try {
      const state = history.state && typeof history.state === 'object' ? history.state : {};
      history.pushState({...state, [guardKey]:guardToken}, '', location.href); guardActive = true;
    } catch { guardActive = false; }
  }
  function interaction(event) {
    interacted = true;
    if (contactTarget(event.target) || event.target instanceof Element && event.target.closest('.recommendation-card')) {
      remember('contact-or-browsing'); if (dialog.open) dialog.close(); return;
    }
    armBack();
  }
  document.addEventListener('pointerdown', interaction, true);
  document.addEventListener('click', interaction, true);
  document.addEventListener('keydown', interaction, true);
  window.addEventListener('scroll', () => { interacted = true; armBack(); }, {passive:true});
  document.addEventListener('mouseout', event => {
    if (!mobile() && !event.relatedTarget && event.clientY <= 0) show('pointer');
  });
  window.addEventListener('popstate', event => {
    if (!guardActive || event.state?.[guardKey] === guardToken) return;
    guardActive = false;
    if (!show('back')) history.back();
  });
  document.addEventListener('visibilitychange', () => {
    clearPending(); if (document.visibilityState === 'visible') armBack();
  });
  document.addEventListener('focusout', armBack);
  window.addEventListener('pagehide', clearPending);
  window.addEventListener('pageshow', () => {
    try { handled = handled || Boolean(sessionStorage.getItem(sessionKey)); } catch { storageAvailable = false; }
    armBack();
  });
  window.addEventListener('resize', armBack, {passive:true});
  new MutationObserver(records => {
    if (!records.some(record => record.target.tagName === 'DIALOG' && record.target !== dialog)) return;
    clearPending(); cooldownUntil = Date.now() + 10000;
    if (otherModal()) { if (dialog.open) dialog.close(); } else armBack();
  }).observe(document.body, {subtree:true, attributes:true, attributeFilter:['open']});
  const close = () => dialog.close();
  dialog.querySelector('.close-button').addEventListener('click', close);
  dialog.querySelector('.recommendations-continue').addEventListener('click', close);
  leave.addEventListener('click', () => { if (backExitPending) { dialog.close(); history.back(); } });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
  });
  dialog.addEventListener('close', () => {
    backExitPending = false; leave.hidden = true;
    document.body.classList.remove('recommendations-modal-open');
    if (previousFocus?.isConnected && !otherModal()) previousFocus.focus({preventScroll:true});
  });
})();
