export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function quantize(value, step) {
  if (!step) return value;
  return Math.round(value / step) * step;
}

export function formatMotorLabel(id) {
  if (!id) return 'System';
  return `${id.charAt(0).toUpperCase()}${id.slice(1)}`;
}
