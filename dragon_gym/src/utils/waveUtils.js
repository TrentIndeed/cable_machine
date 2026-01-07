export function getWaveFillContext(canvas, width, height) {
  if (!canvas) return null;
  if (!canvas._waveFillCanvas) {
    canvas._waveFillCanvas = document.createElement('canvas');
    canvas._waveFillCtx = canvas._waveFillCanvas.getContext('2d');
  }
  const fillCanvas = canvas._waveFillCanvas;
  const fillCtx = canvas._waveFillCtx;
  if (!fillCtx) return null;
  if (fillCanvas.width !== width || fillCanvas.height !== height) {
    fillCanvas.width = width;
    fillCanvas.height = height;
  }
  return { fillCanvas, fillCtx };
}
