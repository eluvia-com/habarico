// react-draggable's DraggableCore hands the raw native mouse/touch event to onStart/onDrag/onStop
// so both input types share one drag pipeline. Reorder logic driven by document.elementFromPoint
// needs a single clientX/clientY regardless of which event type fired.
export const getEventClientPoint = (
  event: MouseEvent | TouchEvent
): {x: number; y: number} | null => {
  if ('touches' in event) {
    const touch = event.touches[0] ?? event.changedTouches[0];
    return touch ? {x: touch.clientX, y: touch.clientY} : null;
  }
  return {x: event.clientX, y: event.clientY};
};
