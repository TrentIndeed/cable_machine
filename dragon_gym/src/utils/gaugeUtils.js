import { MAX_RESISTANCE, TWO_PI } from '../constants/appConstants';

export function getGaugeGeometry(canvas) {
  if (!canvas) {
    return null;
  }
  const rect = canvas.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const radius = Math.min(rect.width, rect.height) / 2 - 10;
  return { rect, centerX, centerY, radius };
}

export function getGaugeHandlePosition(motor) {
  if (!motor || !motor.gaugeCanvas) return null;
  const geometry = getGaugeGeometry(motor.gaugeCanvas);
  if (!geometry) return null;
  const baseProgress = Math.max(0, Math.min(1, motor.baseResistance / MAX_RESISTANCE));
  const angle = -Math.PI / 2 + TWO_PI * baseProgress;
  const x = geometry.centerX + Math.cos(angle) * geometry.radius;
  const y = geometry.centerY + Math.sin(angle) * geometry.radius;
  const handleRadius = Math.max(10, geometry.radius * 0.08);
  return { x, y, handleRadius };
}
