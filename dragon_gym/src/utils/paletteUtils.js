export function getMotorPalette(motorId) {
  if (motorId === 'right') {
    return {
      primary: 'rgba(60, 216, 143, 0.95)',
      secondary: 'rgba(25, 152, 90, 0.95)',
      glow: 'rgba(60, 216, 143, 0.85)',
      waveFade: 'rgba(60, 216, 143, 0.25)',
      waveDot: 'rgba(60, 216, 143, 0.25)',
    };
  }
  return {
    primary: 'rgba(72, 170, 255, 0.95)',
    secondary: 'rgba(45, 140, 230, 0.95)',
    glow: 'rgba(72, 170, 255, 0.85)',
    waveFade: 'rgba(72, 170, 255, 0.25)',
    waveDot: 'rgba(72, 170, 255, 0.25)',
  };
}
