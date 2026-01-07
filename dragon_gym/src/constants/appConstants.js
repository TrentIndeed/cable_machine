export const MAX_RESISTANCE = 5;
export const TWO_PI = Math.PI * 2;
export const MAX_TRAVEL_INCHES = 24;
export const ENGAGEMENT_RAMP_INCHES = 1;
export const REP_SPAN_THRESHOLD = 3;
export const MOVEMENT_EPSILON = 0.05;
export const DEFAULT_REP_TARGET = 12;
export const TRAIL_LENGTH = 600;
export const INCHES_PER_MILE = 63360;
export const SECONDS_PER_HOUR = 3600;
export const RETRACTION_SPEED_MPH = 0.2;
export const RETRACTION_SPEED_IPS =
  (RETRACTION_SPEED_MPH * INCHES_PER_MILE) / SECONDS_PER_HOUR;
export const SIM_SLIDER_STEP = 0.1;
export const DEFAULT_RETRACTION_BOTTOM = 1;
export const INITIAL_BASE_RESISTANCE = 1;
export const WEIGHT_ENGAGE_OFFSET = 1;
export const AUTO_TORQUE_MIN_DELTA = 0.1;
export const AUTO_TORQUE_MIN_MS = 250;

export const COMMAND_TYPES = {
  ENABLE: 'Enable',
  DISABLE: 'Disable',
  STOP: 'Stop',
  RESET: 'Reset',
  SET_RESISTANCE: 'SetResistance',
};

export const AXIS_OPTIONS = [
  { value: 1, label: 'Left' },
  { value: 2, label: 'Right' },
  { value: 3, label: 'Both' },
];

export const FONT_OPTIONS = [
  {
    value: 'sf',
    label: 'San Francisco',
    stack:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "San Francisco", system-ui, sans-serif',
  },
  {
    value: 'inter',
    label: 'Inter',
    stack: '"Inter", "SF Pro Text", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },
  {
    value: 'roboto',
    label: 'Roboto',
    stack: '"Roboto", "SF Pro Text", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },
  {
    value: 'open-sans',
    label: 'Open Sans',
    stack:
      '"Open Sans", "SF Pro Text", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },
  {
    value: 'lato',
    label: 'Lato',
    stack: '"Lato", "SF Pro Text", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },
  {
    value: 'nunito',
    label: 'Nunito',
    stack:
      '"Nunito", "SF Pro Text", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },
  {
    value: 'poppins',
    label: 'Poppins',
    stack:
      '"Poppins", "SF Pro Text", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },
  {
    value: 'montserrat',
    label: 'Montserrat',
    stack:
      '"Montserrat", "SF Pro Text", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },
  {
    value: 'source-sans',
    label: 'Source Sans 3',
    stack:
      '"Source Sans 3", "SF Pro Text", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },
  {
    value: 'rubik',
    label: 'Rubik',
    stack: '"Rubik", "SF Pro Text", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },
];
