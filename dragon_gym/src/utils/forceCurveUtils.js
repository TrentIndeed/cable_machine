export function getForceCurveCopy(mode, intensityPercent) {
  const pct = Math.round(intensityPercent);
  switch (mode) {
    case 'eccentric':
      return `+${pct}% load on the lowering phase.`;
    case 'chain':
      return `Gradually increases to +${pct}% at the top of the stroke.`;
    case 'band':
      return `Fast ramp to +${pct}% near lockout.`;
    case 'reverse-chain':
      return `Starts +${pct}% heavier and eases off toward the top.`;
    case 'linear':
    default:
      return 'Equal load through the pull and return.';
  }
}

export function getForceCurveMultiplier(mode, normalized, direction, intensityPercent) {
  const clamped = Math.max(0, Math.min(1, normalized));
  const intensity = Math.max(0, Math.min(100, intensityPercent)) / 100;
  const descending = direction < 0;
  switch (mode) {
    case 'eccentric':
      return descending ? 1 + intensity : 1.0;
    case 'chain':
      return 1 + clamped * intensity;
    case 'band':
      return 1 + Math.pow(clamped, 2.2) * intensity;
    case 'reverse-chain':
      return 1 + intensity - clamped * intensity;
    case 'linear':
    default:
      return 1.0;
  }
}

export function getActiveEccentricMode(
  eccentricOverrideEnabled,
  eccentricSelectValue,
  fallbackMode
) {
  if (!eccentricOverrideEnabled || !eccentricSelectValue) {
    return fallbackMode;
  }
  return eccentricSelectValue;
}

export function computeForceMultiplier(
  mode,
  normalized,
  directionHint,
  eccentricOverrideEnabled,
  eccentricSelectValue,
  intensityPercent
) {
  const direction = directionHint < 0 ? -1 : 1;
  const descending = direction < 0;
  const eccentricModeValue = getActiveEccentricMode(
    eccentricOverrideEnabled,
    eccentricSelectValue,
    mode
  );
  const activeMode = descending ? eccentricModeValue : mode;
  return getForceCurveMultiplier(activeMode, normalized, direction, intensityPercent);
}

export function drawForceProfile(
  canvas,
  mode,
  direction,
  intensityPercent
) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(10, 16, 30, 0.92)';
  ctx.fillRect(0, 0, width, height);

  const intensity = Math.max(0, Math.min(100, intensityPercent)) / 100;
  const displayedIntensity = Math.max(intensity, 0.05);

  const padding = {
    top: 28,
    right: 44,
    bottom: 56,
    left: 68,
  };

  const minForce = -displayedIntensity;
  const maxForce = displayedIntensity;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;

  const ySteps = 4;
  for (let i = 0; i <= ySteps; i += 1) {
    const value = minForce + ((maxForce - minForce) / ySteps) * i;
    const y =
      padding.top +
      ((maxForce - value) / (maxForce - minForce || 1)) * plotHeight;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  const xSteps = 4;
  for (let i = 0; i <= xSteps; i += 1) {
    const x = padding.left + (plotWidth / xSteps) * i;
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, height - padding.bottom);
    ctx.stroke();
  }

  const zeroY =
    padding.top + ((maxForce - 0) / (maxForce - minForce || 1)) * plotHeight;
  ctx.strokeStyle = 'rgba(127, 255, 212, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padding.left, zeroY);
  ctx.lineTo(width - padding.right, zeroY);
  ctx.stroke();

  ctx.beginPath();
  for (let i = 0; i <= 120; i += 1) {
    const travel = i / 120;
    const multiplier = getForceCurveMultiplier(mode, travel, direction, intensityPercent);
    const delta = Math.max(minForce, Math.min(maxForce, multiplier - 1));
    const px = padding.left + travel * plotWidth;
    const py =
      padding.top +
      ((maxForce - delta) / (maxForce - minForce || 1)) * plotHeight;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.strokeStyle = 'rgba(72, 170, 255, 0.8)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(127, 255, 212, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.stroke();

  ctx.fillStyle = 'rgba(173, 201, 255, 0.85)';
  ctx.font = '12px "Roboto", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Cable Length', padding.left + plotWidth / 2, height - 16);

  ctx.save();
  ctx.translate(padding.left - 46, padding.top + plotHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Force (%)', 0, 0);
  ctx.restore();

  const tickStep = displayedIntensity / 2;
  const tickValues = [
    -displayedIntensity,
    -tickStep,
    0,
    tickStep,
    displayedIntensity,
  ];
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  tickValues.forEach((value) => {
    const y =
      padding.top +
      ((maxForce - value) / (maxForce - minForce || 1)) * plotHeight;
    const offset = value === minForce ? 12 : value === maxForce ? -4 : 4;
    const percentLabel = `${value > 0 ? '+' : ''}${Math.round(value * 100)}%`;
    ctx.fillText(percentLabel, padding.left - 8, y + offset);
  });
}
