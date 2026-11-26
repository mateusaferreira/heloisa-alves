window.GalleryGeometry=Object.freeze({
  constrain(state,view){const scale=Math.min(5,Math.max(1,state.scale));const limitX=Math.max(0,(view.imageWidth*scale-view.width)/2),limitY=Math.max(0,(view.imageHeight*scale-view.height)/2);return {scale,x:limitX?Math.min(limitX,Math.max(-limitX,state.x)):0,y:limitY?Math.min(limitY,Math.max(-limitY,state.y)):0}},
  zoomAt(state,point,scale){const next=Math.min(5,Math.max(1,scale)),ratio=next/state.scale;return {scale:next,x:point.x-(point.x-state.x)*ratio,y:point.y-(point.y-state.y)*ratio}},
  pinch(anchor,midpoint,scale){const next=Math.min(5,Math.max(1,scale));return {scale:next,x:midpoint.x-anchor.x*next,y:midpoint.y-anchor.y*next}}
});
