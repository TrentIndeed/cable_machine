# README

## What this is

A compact, rack‑mountable, **motorized cable trainer** with an internal spool and a two‑stage HTD‑8M belt reduction, driven by a **2000 W AC servo motor with brake and absolute encoder**. The unit mounts to a 2×2 upright (or strap‑mount), presents a **front fairlead + swivel**, and supports a **2:1 reeve option** for higher force. A **Nest‑style rotary touchscreen** provides local control; Bluetooth enables app control and logging.

Target performance (with 100 mm drum OD, 22→60 then 22→48):

* **Overall ratio:** \~**5.95 : 1**
* **Cable speed:** \~**3.94 mph** at 2000 RPM; \~**5.91 mph** at 3000 RPM (no‑load)
* **Force mode:** 1:1 or 2:1 reeve (2× force / ½ speed)

## How it works (high level)

1. AC mains (120 V) feeds a **3 kVA step‑up transformer** (→ 240 V).
2. 240 V supplies the **AC servo drive**, which controls the **2 kW servo** with regenerative braking into a **500 W / 100 Ω resistor**.
3. Motor torque goes into **Stage‑1 (22T→60T)** and **Stage‑2 (22T→48T)** via **HTD‑8M, 30 mm belts**, then into a **100 mm OD drum** that spools the 3/16″ wire rope.
4. A **front fairlead** guides the cable; a **swivel block** supports direction changes; an optional **2:1 reeve** doubles available force.
5. Control/UX: **M5Stack M5Dial** (ESP32‑S3) + Bluetooth; 22 mm **power button** and **E‑stop** on the front panel.

## Safety essentials

* Use a **maintained E‑stop** in series with the drive’s STO or AC feed.
* Fit **shaft guards** and belt covers.
* Bond all metalwork to **PE ground**. Use **strain relief** on the mains.
* Validate load paths (cable, sheaves, anchor, drum) with a **2× safety factor** minimum.
