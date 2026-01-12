// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

class MockWebSocket {
  constructor() {
    this.readyState = 1;
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
    if (this.onopen) {
      this.onopen();
    } else {
      setTimeout(() => {
        if (this.onopen) this.onopen();
      }, 0);
    }
  }

  send() {}

  close() {
    if (this.onclose) this.onclose();
  }
}

global.WebSocket = MockWebSocket;
process.env.REACT_APP_DISABLE_ADS = 'true';

global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};

HTMLCanvasElement.prototype.getContext = () => ({
  clearRect: () => {},
  beginPath: () => {},
  arc: () => {},
  fill: () => {},
  stroke: () => {},
  moveTo: () => {},
  lineTo: () => {},
  closePath: () => {},
  fillRect: () => {},
  strokeRect: () => {},
  fillText: () => {},
  translate: () => {},
  rotate: () => {},
  drawImage: () => {},
  save: () => {},
  restore: () => {},
  setLineDash: () => {},
  createLinearGradient: () => ({ addColorStop: () => {} }),
  createRadialGradient: () => ({ addColorStop: () => {} }),
});
