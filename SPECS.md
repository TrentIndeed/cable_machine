# SPECIFICATIONS

> **Coordinate system** (for all positions below):
> Origin at **inside left–back–bottom** of the enclosure.
> **X** left→right, **Y** bottom→top, **Z** back (−) → front (+).
> Enclosure internal clear volume used for coordinates.

## Enclosure

* **External**: 650 (W) × 360 (H) × 220 (D) mm (nominal).
* **Wall/door**: 2–3 mm steel or 4–6 mm aluminum equivalent.
* **Divider panel**: at **X = 460 mm** (6 mm thick) → **Left bay** (mechanics) and **Right bay** (electronics).
* **Front slot (fairlead window)**: 70 × 25 mm centered at **(X = 460 mm, Y = 200 mm, Z = +110 mm)**.

### Mounting to rack

* Backplate pattern suitable for 2×2 uprights or strap hooks.
* Recommended: 3‑point mount with **two 5/8″ quick‑release pins** and a **bottom ledge**.
* Optional: **strap/ratchet** mount with corner protectors and rubber pads.

## Drive system — geometry

**Drum**

* OD **100 mm**, face **80 mm** (machine from 6061‑T6 tube).
* Cable groove: light crown (≈0.5–1 mm) or shallow helical lay; 3/16″ wire rope.
* Drum center **(X = 438.4 mm, Y = 200 mm, Z = +35 mm)**.
* Shaft **Ø20 mm** keyed (DIN 6885 key 6×6 mm), through‑shaft across left and right side plates.

**Pulleys & belts (HTD‑8M, 30 mm wide)**

* Stage‑1: **22T → 60T**
  • 22T (motor shaft) center **(X = 130.0, Y = 200.0, Z = −35.0)**
  • 60T (jackshaft) center **(X = 269.6, Y = 200.0, Z = −35.0)**
  • Belt: **624‑8M‑30** (nominal). **Center distance C ≈ 139.6 mm**.
* Stage‑2: **22T → 48T** (shared jackshaft → drum shaft)
  • 22T (jackshaft) center **(X = 269.6, Y = 200.0, Z = +35.0)**
  • 48T (drum shaft) center **(X = 438.4, Y = 200.0, Z = +35.0)**
  • Belt: **624‑8M‑30** (nominal). **Center distance C ≈ 168.8 mm**.
* **Plane separation (depth)**: Stage‑1 at **Z = −35 mm**, Stage‑2 at **Z = +35 mm** → **70 mm** gap.
* **Pulley pitch diameters** (mm): 22T ≈ **56.0**; 48T ≈ **122.2**; 60T ≈ **152.8**.
* **Overall ratio (22→60, 22→48)**: **\~5.95 : 1**.
* **Alternate**: if 60T is out of stock, use **64T** (PD ≈ 163.0 mm), belt 624‑8M‑30 with **C ≈ 128.9 mm**; new overall ratio ≈ **6.35 : 1**.

**Motor** (left bay)

* 2000 W AC servo, with brake & 17‑bit absolute encoder.
* Frame: **130×130 mm**, body length with brake **279 mm**.
* Shaft **Ø22 mm**, length **57 mm**, keyway **40 mm**.
* Mount base such that shaft axis is at **(X = 130.0, Y = 200.0, Z = −35.0)** aligned to the 22T pulley.
* Provide ≥ **15 mm** clearance rear and underside for airflow/cable bend radius.

**Jackshaft**

* Through‑shaft **Ø20 mm** keyed, center at **(X = 269.6, Y = 200.0)**.
* Axial positions: 60T at **Z = −35**; 22T at **Z = +35**.
* Supported by **two 20 mm ID bearings** in the left and right side plates (see Bearings section).

**Drum shaft**

* Through‑shaft **Ø20 mm** keyed, center at **(X = 438.4, Y = 200.0, Z = +35.0)**.
* Two bearings in side plates.

**Belts**

* Nominal length each: **624‑8M‑30** (verify tension range).
* Belt centerline height **Y = 200 mm** (± a few mm via slot‑tensioners).
* Tensioners: eccentric idlers or slotted motor/jack plates providing ±**8–10 mm** C‑adjust.

## Bearings & supports

* **Side plates** (left bay): 6–8 mm steel/aluminum, each with bearing seats at the three shaft centers above.
* Bearing style: **UCFL204‑20 (flange)** or **UCP204‑20 (pillow block)** for Ø20 mm; for motor shaft, use motor’s own front bearing only (no external).
* Seat positions:

  * Motor pulley (no external bearing): **(X = 130.0, Y = 200.0)**
  * Jackshaft bearings: **(X = 269.6, Y = 200.0)** on **both** side plates.
  * Drum shaft bearings: **(X = 438.4, Y = 200.0)** on **both** side plates.

## Cable path

* **Drum** → front **roller fairlead** at **(X ≈ 460, Y = 200, Z = +110)** → external **swivel sheave** (double‑sheave for 2:1 reeve as needed).
* Cable: **3/16″ (7×19) galvanized**; use proper **thimble + swage** at hooks/anchors.
* **Load cell (500 lbf S‑beam)** inline at the exit or on a short link before the swivel; mount so the tension axis is colinear with cable pull.

## Electronics bay (right)

* Divider at **X = 460 mm**. Right‑bay keep‑outs: X ∈ \[460..650], Y ∈ \[0..360], Z ∈ \[−110..+110].
* **Transformer (3 kVA)**: place **(X center ≈ 540, Y center ≈ 80, Z ≈ −30)**, 220×120×140 mm block.
* **Servo drive**: **(X ≈ 600, Y ≈ 190, Z ≈ −40)**, 140×220×70 mm.
* **Braking resistor (500 W/100 Ω)**: **(X ≈ 610, Y ≈ 310, Z ≈ +60)**, 200×40×40 mm; vent path top/right.
* **Main power button (22 mm)** on front panel at **(X = 630, Y = 180)**.
* **E‑stop (22 mm, maintained)** on front panel at **(X = 630, Y = 220)**.
* **UI dial/screen** on left side panel (projecting through): center **(X = 10 mm from left wall, Y = 220 mm, Z = 0)**; use gasket.

## Parts & interfaces (sizing)

**Motor & drive**

* 2 kW AC servo, brake, 17‑bit absolute encoder.
* Rated 2000 RPM, no‑load 3000 RPM.
* Shaft Ø22 mm, key 6×6 mm.

**Pulleys (30 mm wide, HTD‑8M)**

* **22‑8M‑30‑1008** (×2) — smalls for motor & jackshaft.
* **60‑8M‑30‑2012** — large, Stage‑1 jackshaft. *(Alt: 64‑8M‑30‑2517 if 60T unavailable)*
* **48‑8M‑30‑2012** — large, Stage‑2 drum shaft.

**Bushings**

* **1008‑22 mm** (motor).
* **1008‑20 mm** (jackshaft small).
* **2012‑20 mm** (48T & 60T on Ø20 shafts).
* **2517‑20 mm** (if using 64T).

**Belts**

* Gates or equivalent: **624‑8M‑30** (×2).
* If center‑distance deviates, re‑compute length or re‑slot mounts.

**Drum & shafts**

* Drum stock: **6061‑T6**, OD to **100 mm**, face **80 mm**, wall ≥ **6 mm**, keyed hub.
* **Ø20 mm** CRS/4140 shafts, chamfered, with M6/M8 end‑tapped if you use end‑retainers.

**Bearings**

* Four units total for jack & drum (two shafts × two sides).
* UCFL/UCP‑204‑20 style (Ø20 mm), greaseable, self‑aligning.

**Cable hardware**

* Wire rope: **3/16″, 7×19**.
* Thimbles, aluminum or copper swages per spec; WLL ≥ working load × safety factor.
* **Fairlead**: 4‑roller ATV/UTV type sized for 3/16″ steel cable.
* **Swivel block**: **double‑sheave**, 3/16″ groove, WLL ≥ total system load.

**Controls**

* **M5Stack M5Dial** (ESP32‑S3), 6–36 V input, BLE/Wi‑Fi.
* 22 mm **power pushbutton** (IP65), LED 24 V.
* 22 mm **E‑stop** (maintained, twist release).

**Power**

* **Transformer**: **≥3 kVA**, 120→240 VAC.
* **Braking resistor**: **100 Ω, 500 W** aluminum‑housed on heatsink or chassis with airflow.

## Wiring overview (summary)

* **AC in (120 V)** → fused inlet → **E‑stop** (if on mains) → **3 kVA step‑up** → **AC servo drive (240 V)** → **servo motor**.
* **Drive DC bus** → **braking resistor** via drive terminals.
* **PE ground**: mains ground to chassis, transformer frame, drive PE, motor frame, fairlead, and front hardware.
* **Control 24 V**: from drive aux or DC‑DC for the M5Dial + buttons/LED.
* **Load cell**: 5 V excitation, differential signal into ADC (isolate/condition as needed).

## Fasteners & clearances

* Guard all belt runs; keep **≥10 mm** clearance belt edge→wall.
* Use Nyloc or thread‑locker on all vibration‑prone joints.
* Provide **service door** access to right bay; maintain **20–30 mm** free air all sides of resistor & drive.

## Performance notes

* With **100 mm OD** drum and **5.95:1** ratio:

  * \~**5.9 mph** cable at **3000 RPM** (no‑load).
  * \~**3.9 mph** cable at **2000 RPM** (rated).
* Using **2:1 reeve** halves speed and doubles available force.
* Switching to **64T** raises ratio \~**+6%**, slightly slower/firmer feel.

## Tolerances & adjustments

* Position tolerances: **±0.5 mm** for shaft centers; **±0.2 mm** for bearing bores; slot lengths per tension range.
* After assembly, **shim** to align belt planes within **±0.25 mm**.

## Bill of materials (summary)

* 2 kW AC servo + drive + brake + encoder (130 mm frame).
* HTD‑8M pulleys: 22T (×2), 60T (×1), 48T (×1). *(Alt: 64T for the 60T)*
* Taper bushings: 1008‑22, 1008‑20, 2012‑20 (and **2517‑20** if 64T).
* Belts: 624‑8M‑30 (×2).
* Drum: 100 mm OD × 80 mm face, 6061‑T6; keyed hub.
* Shafts: Ø20 mm keyed (jack & drum).
* Bearings: UCFL/UCP‑204‑20 (×4).
* Fairlead + swivel block (double‑sheave).
* Load cell 500 lbf S‑beam + conditioner.
* Transformer (≥3 kVA), braking resistor 100 Ω/500 W.
* UI (M5Dial), power button (22 mm), E‑stop (22 mm).
* Enclosure 650×360×220 mm with divider at X=460 mm, front slot 70×25 mm.
* Hardware, wiring, guards, and mount kit.

---

## Appendix — key dimensions (quick table)

| Item                     | Value                              |
| ------------------------ | ---------------------------------- |
| Enclosure (W×H×D)        | 650×360×220 mm                     |
| Divider X                | 460 mm                             |
| Belt planes Z            | −35 mm (Stage‑1), +35 mm (Stage‑2) |
| Pulley centers Y         | 200 mm                             |
| Motor 22T center (X,Y,Z) | (130.0, 200.0, −35.0)              |
| Jack 60T center (X,Y,Z)  | (269.6, 200.0, −35.0)              |
| Jack 22T center (X,Y,Z)  | (269.6, 200.0, +35.0)              |
| Drum 48T center (X,Y,Z)  | (438.4, 200.0, +35.0)              |
| Drum center (X,Y,Z)      | (438.4, 200.0, +35.0)              |
| Centers C (22↔60)        | 139.6 mm (belt 624‑8M‑30)          |
| Centers C (22↔48)        | 168.8 mm (belt 624‑8M‑30)          |
| Drum OD × face           | 100 mm × 80 mm                     |
| Overall ratio            | \~5.95 : 1 (22→60, 22→48)          |
| Alt ratio                | \~6.35 : 1 (22→64, 22→48)          |
| Cable speed @2000 RPM    | \~1.76 m/s (≈3.94 mph)             |
| Cable speed @3000 RPM    | \~2.64 m/s (≈5.91 mph)             |

> If you change pulley tooth counts or belt length, **recompute center distances**:
> $L ≈ 2C + \tfrac{π}{2}(D+d) + \tfrac{(D-d)^2}{4C}$, where **L** is belt pitch length, **D/d** are pitch diameters.
