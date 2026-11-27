(() => {
  const defaults=Object.freeze({minPrice:null,maxPrice:null,bedrooms:0,type:'todos'});
  let state={...defaults};
  function normalize(value){
    const price=v=>v===null||v===undefined||v===''?null:Number(v);
    const next={minPrice:price(value.minPrice),maxPrice:price(value.maxPrice),bedrooms:Number(value.bedrooms||0),type:value.type||'todos'};
    if([next.minPrice,next.maxPrice].some(v=>v!==null&&(!Number.isFinite(v)||v<0)))throw new RangeError('Informe um valor válido.');
    if(next.minPrice!==null&&next.maxPrice!==null&&next.minPrice>next.maxPrice)throw new RangeError('O valor máximo deve ser maior ou igual ao mínimo.');
    if(![0,1,2,3,4].includes(next.bedrooms)||!['todos','apartamento','casa'].includes(next.type))throw new RangeError('Filtro inválido.');
    return next;
  }
  function matches(property,filters=state){return (filters.minPrice===null||property.price>=filters.minPrice)&&(filters.maxPrice===null||property.price<=filters.maxPrice)&&property.bedrooms>=filters.bedrooms&&(filters.type==='todos'||property.type.toLocaleLowerCase('pt-BR')===filters.type);}
  function set(patch){const next=normalize({...state,...patch});if(Object.keys(defaults).every(key=>next[key]===state[key]))return false;state=next;document.dispatchEvent(new CustomEvent('property:filters-changed',{detail:{...state}}));return true;}
  window.PropertyFilters=Object.freeze({defaults,get:()=>({...state}),set,matches,normalize});
})();
