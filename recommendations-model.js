(() => {
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const pathname = value => value.replace(/\/index\.html$/, '/').replace(/\/$/, '') || '/';
  function select(catalog, currentId, pageUrl, limit = 3) {
    const base = new URL(pageUrl);
    const current = catalog.find(item => item?.id === currentId);
    const seen = new Set();
    return catalog.flatMap(item => {
      if (!item || typeof item.id !== 'string' || !item.id || item.id === currentId || item.status !== 'available' || typeof item.title !== 'string' || !item.title.trim() || typeof item.url !== 'string' || !item.url.trim() || typeof item.image !== 'string' || !item.image.trim() || !Number.isFinite(item.price) || !(item.price > 0)) return [];
      let url, image;
      try {
        url = new URL(item.url, base);
        image = new URL(item.image, base);
      } catch { return []; }
      if (!['http:', 'https:'].includes(url.protocol) || url.origin !== base.origin || !['http:', 'https:'].includes(image.protocol)) return [];
      const path = pathname(url.pathname);
      if (path === pathname(base.pathname) || seen.has(path)) return [];
      seen.add(path);
      let score = 0;
      if (current) {
        if (item.type && current.type && normalize(item.type) === normalize(current.type)) score += 6;
        if (normalize(item.city) === normalize(current.city)) score += 8;
        if (normalize(item.neighborhood) === normalize(current.neighborhood)) score += 5;
        if (current.price > 0) score += Math.max(0, 4 - Math.abs(item.price - current.price) / current.price * 8);
        if (Number.isFinite(item.bedrooms) && Number.isFinite(current.bedrooms)) score += Math.max(0, 2 - Math.abs(item.bedrooms - current.bedrooms));
      }
      return [{...item, url: url.pathname + url.search, image: image.href, score}];
    }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, limit);
  }
  window.RecommendationModel = {select};
})();
