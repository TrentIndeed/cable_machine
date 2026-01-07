# README

## World's strongest smart gym for power-lifters

### Project introduction: Smart Gym Satellite and Hub System

#### What is it?
This project is a high-performance, modular smart gym system composed of two motorized cable-satellite enclosures and a centralized electronics hub. Each satellite unit houses a powerful AC servo motor and load-bearing mechanics, converting motor torque into precise, smooth cable resistance. The hub contains all high-voltage power conversion, safety systems, motion control, and feedback synchronization across both satellites.

#### Hook: The iron meets intelligence
Imagine a gym that does not just resist your movement, but responds to it. A gym that syncs with your body, adapts to your strength, and allows hyper-precise control over force, speed, and tempo. This project makes that vision real, delivering a cutting-edge resistance training experience through robotics-grade hardware and real-time force feedback.

#### Why it matters
Most existing smart gyms use outdated DC motors, lack true force sensing, and feel like dragging against resistance bands. By contrast, this design provides:
- Industrial-grade torque (up to ~450 lb cable force)
- Real-time closed-loop force feedback using inline S-beam load cells
- Synchronous control over dual channels with EtherCAT and CST mode
- Customizable resistance curves, virtual gravity modes, ballistic and strength profiles
- Expandable UI with BLE or hardwired rotary dials and touchscreens

For athletes, rehab centers, and high-performance home gyms, it redefines what cable training can feel like.

#### How it works
- Satellites: Each unit contains a Delta B3-series servo (1.5-2.0 kW), direct-driving a 10:1 planetary gearbox and a crowned aluminum drum. Cable exits through a fairlead and connects to a user load. Inline load cells measure force, while integrated dials or BLE interfaces allow user control.
- Hub: Powers both satellites via a 48 VDC battery and 7 kW inverter to 240 VAC transformer to Delta servo drives. Also contains:
  - 24 VDC PSU for sensors, brakes, UI
  - EtherCAT master (Beckhoff stack on PC)
  - Dual-channel STO safety relays
  - Shared braking resistor with thermal cutoff
  - EMI filtering, fans, and optional touchscreen
- Software: Runs synchronized CST motion with sub-microsecond alignment. Outer force loop runs on PC, updating torque setpoints in real time based on load cell feedback.

#### How it fits in the market
What this has over RepOne:
- Realtime graph for range of motion
- Large touch screen and interactive display
- Stronger resistance in dual stack
- Better sync with force curves
- Voice control
- Better safety in failure
- Faster at lower weights
- Cable satellites can be moved separately from the rack

Dual-unit sync: EtherCAT Distributed Clocks for sub-microsecond alignment; mirror CST setpoints. Optional cross-couple on load-cell difference to keep handles even.

This is not a toy. It is designed to exceed the performance of Tonal, Vitruvian, or Beyond Power's Voltra at a DIY cost point with industrial-grade performance:
- Compared to Tonal: more raw torque, lower mechanical impedance, true load cell feedback.
- Compared to Vitruvian: no plastic pulley hacks, direct-driven torque through robust steel.
- Compared to Gym Monster or open-source builds: real control fidelity (EtherCAT + CST), not just hobby-grade PID.

#### Why people will want it
- Athletes and lifters: dial in exact eccentric overloads, ballistic reps, or virtual gravity resistance.
- Rehab clinics: use low-speed, force-controlled modes with feedback logging and safety.
- Biohacking and elite home gyms: combine software-defined resistance with haptics, tracking, and session replay.

This project blends mechanical power with software precision and brings robotics-level motion control into the realm of personal fitness.

## Running the UI + server

In two terminals:

1. UI
   - `cd dragon_gym`
   - `npm install`
   - `npm start`
2. ADS bridge
   - `cd server`
   - `npm install`
   - `copy ..\.env.example .env` (then edit values)
   - `npm start`

Single-command option (repo root):
- `npm install`
- `npm run setup`
- `npm start`

When using the single-command option, the UI runs on port 3001 and the ADS bridge runs on port 3002.

## Hybrid mobile app (Play Store wrapper + hosted UI)

The Android app is a thin wrapper that loads the hosted web UI. Updates are primarily done by redeploying the web UI.

1) Build and host the UI
   - Set `REACT_APP_API_BASE` and `REACT_APP_WS_URL` to your ADS bridge host.
   - Build the UI:
     - `npm run build:ui`
   - Deploy `dragon_gym/build` to your web host.

2) Point the Android wrapper at the hosted UI
   - Update `capacitor.config.json` `server.url` to your hosted URL.
   - Use `https` for Play Store builds.

3) Android setup (first time)
   - `npm install`
   - `npm run setup`
   - `npm run cap:add:android`

4) Sync and open in Android Studio
   - `npm run cap:sync`
   - `npm run cap:open:android`

Update flow:
- Web-only changes: redeploy the web UI (no Play Store update needed).
- Native wrapper or config changes: rebuild and upload a new AAB via Android Studio.

Local-only build:
- `npm run build:ui:local` uses `http://localhost:3002` for the ADS bridge.
