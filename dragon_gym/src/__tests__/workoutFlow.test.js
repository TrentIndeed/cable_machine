import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

const setSliderValue = (slider, value) => {
  slider.value = String(value);
  fireEvent.input(slider, { target: { value: String(value) } });
  fireEvent.change(slider, { target: { value: String(value) } });
};

describe('workout flow', () => {
  test('standard flow with cable simulator and pause', () => {
    render(<App />);

    const startWorkout = screen.getByRole('button', { name: /start workout/i });
    fireEvent.click(startWorkout);

    const startSet = screen.getByRole('button', { name: /start set/i });
    expect(startSet).toBeEnabled();
    fireEvent.click(startSet);

    const leftSlider = screen.getByLabelText(/left cable length/i);
    const rightSlider = screen.getByLabelText(/right cable length/i);

    setSliderValue(leftSlider, 2.0);
    setSliderValue(rightSlider, 2.0);

    const leftCableDistance = document.getElementById('leftCableDistance');
    const rightCableDistance = document.getElementById('rightCableDistance');
    expect(leftCableDistance).toHaveTextContent('2.0');
    expect(rightCableDistance).toHaveTextContent('2.0');

    const leftResistance = document.getElementById('leftCurrentResistance');
    const rightResistance = document.getElementById('rightCurrentResistance');
    expect(leftResistance).toBeInTheDocument();
    expect(rightResistance).toBeInTheDocument();

    const pauseButton = screen.getByRole('button', { name: /pause/i });
    fireEvent.click(pauseButton);
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /play/i }));

    fireEvent.click(screen.getByRole('button', { name: /end set/i }));
    fireEvent.click(screen.getByRole('button', { name: /end workout/i }));
  });

  test('force curve pills cycle and eccentric mode', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /start workout/i }));
    fireEvent.click(screen.getByRole('button', { name: /start set/i }));

    const modePill = document.querySelector('.force-pill.mode');
    expect(modePill).toBeInTheDocument();
    fireEvent.click(modePill);
    expect(modePill.textContent).toBeTruthy();

    const eccentricPill = screen.getByRole('button', { name: /eccentric/i });
    fireEvent.click(eccentricPill);

    expect(eccentricPill).toHaveAttribute('aria-pressed', 'true');

    const leftSlider = screen.getByLabelText(/left cable length/i);
    const rightSlider = screen.getByLabelText(/right cable length/i);
    setSliderValue(leftSlider, 3.0);
    setSliderValue(rightSlider, 3.0);

    const eccentricModePill = document.querySelector('.force-pill.eccentric-mode');
    expect(eccentricModePill).toBeInTheDocument();
    fireEvent.click(eccentricModePill);
    expect(eccentricModePill.textContent).toBeTruthy();
  });
});
