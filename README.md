# 🌍 EARTH SHOOTER 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Language: Vanilla JS](https://img.shields.io/badge/Language-Vanilla%20JS-F7DF1E?logo=javascript&logoColor=black)](javascript)
[![Engine: HTML5 Canvas](https://img.shields.io/badge/Engine-HTML5%20Canvas-E34F26?logo=html5&logoColor=white)](html5)

An intense, chaotic, top-down arena shooter that just *runs*—no plugins, no loading screens, no BS. Built entirely from scratch with plain old **Vanilla JavaScript** and **HTML5 Canvas**.

Survive endless alien swarms, hoard space XP, break the scaling with ridiculous upgrade synergies, and try not to get spaghettified by a literal black hole.

👉 **[CLICK HERE TO PLAY LIVE!](https://iearthez.github.io/EarthShooter/)**

---

## 🔥 Why this is (hopefully) fun

*   **Snappy AF Controls:** I hate input lag in browser games, so I wrote a custom physics/movement model. It feels tight, responsive, and drifts exactly how you want a spacecraft to drift.
*   **No Assets? No Problem:** All sound effects (pew pews, cosmic detonations, level-up melodies) are synthesized in real-time via the **Web Audio API**. Zero audio files to download.
*   **Trippy Space Backgrounds:** The backdrop isn't a static image. It's a living spacetime grid that physically warps, stretches, and bends around heavy gravity fields and active black holes.
*   **Maximum Juice:** Packed with screen shake, floating combat text, cascading shockwaves, and an absurd amount of particle physics.

---

## 🎮 How to Play

*   **Movement:** `W`, `A`, `S`, `D` keys to slide around space.
*   **Aim & Fire:** Move your **Mouse** to aim the turret. Hold `Left Click` to unleash hell.
*   **The Mission:** Stay alive. Magnetize the floating XP gems, optimize your randomized upgrade cards, and push your build as far as possible before the cosmos humbles you.

---

## 👾 The S.P.A.C.E. Threat Matrix

The game director forces tougher compositions down your throat the longer you survive. Enemies don't just scale linearly anymore—their stats now spike **exponentially** over time. Past level 100 is absolute bullet hell nightmare fuel.

| Threat Class | Visual ID | Behavior Protocol |
| :--- | :---: | :--- |
| **Basic** | 🔴 | Standard frontline cannon fodder. Dumb but plentiful. |
| **Shooter** | 🔵 | Cowards. They maintain distance and fire long-range orbs. |
| **Heavy** | 🟣 | Massive, slow-moving tanks that hit like an absolute truck. |
| **Sprinter** | 🟡 | High-velocity glass cannons. Vaporize these instantly. |
| **Juggernaut** | 🟤 | Heavy-metal blockades. Pure bullet sponges. |
| **Swarmer** | 🟢 | Low HP flunkies moving in weird wavy sine patterns to bait your aim. |
| **Sniper** | 🟠 | High-threat hazards that project lethal ordinance from completely off-screen. |
| **The Phantom** | 🟢✨ | *NEW.* Stealth stalkers that phase completely out of visibility while closing in. |
| **The True Juggernaut** | ⚪ | *NEW.* Monolithic white battleships with a colossal health matrix. Spawns past Level 18. |

---

## 🌌 Cosmic Boss Anomalies

Survive long enough, and the background music stops while the normal swarms clear out. Bosses follow a strict collision protocol—they will queue up to fight you one-on-one instead of stacking up on top of each other.

### 🌀 Level 7 — TON-618 Singularity
A monstrous black hole that destabilizes the canvas grid. It generates massive directional gravity pull, dragging your ship toward its center while erupting spiraling waves of purple projectiles.

### ☀️ Level 15 — SOLAR FLARE CORE
A volatile star core that channels blinding solar radiation. It projects massive, sweeping god-rays across the field that will melt your hulls instantly unless you time your attacks and puncture its exposed shielding.

---

## 🛠️ Game-Breaking Upgrades

Leveling up rolls 3 random upgrade options. Stack them strategically to build an unstoppable weapon of mass destruction:

*   **Weapon Core:** `Rapid Fire` (Faster reload speeds) \| `Spread Shot` (Adds multiple projectiles per shot) \| `Heavy Rounds` (Boosts raw bullet payload and impact size).
*   **Navigation:** `Agility` (Increases thruster acceleration and max speed thresholds).
*   **Defense & Regeneration:** `Vitality` (+20 Max HP and a full heal) \| `Titanium Armor` (Flat damage mitigation) \| `Nano-Regen` (Passive hull repairs).
*   **Cosmic Tech:** `High-Velocity Rounds` (Instant cross-screen bullet travel) \| `Colossal Warheads` (Comically massive bullets) \| `Critical Targeting` (RNG double damage factor).
*   **The Catalyst Modifiers (New):**
    *   ⚡ **Piercing Rounds:** Projectiles rip straight through targets, cleaving dense packs.
    *   🌀 **Chrono Flux:** Taking damage has a chance to slow time down by 60% for 3 seconds.
    *   🌌 **Void Harvest:** Permanently scales all incoming XP gains by +25%.
    *   🛡️ **Aegis Shield:** Flat 15% damage mitigation stacking up to 60%.
    *   🩸 **Vampiric Strike:** Gives a percentage chance to restore hull plating upon killing enemies.

---

## ⚙️ Engineering Changelog

```diff
+ ADDED: Exponential enemy scaling matrix to ensure an actual endgame challenge.
+ ADDED: Anti-overlap boss queue protocols (No more overlapping 2v1 boss encounters).
+ ADDED: Interactive Distant Space events (Supernovas, starbursts, rogue cosmic holes).
- RESOLVED: The Infinite XP Cascade Loop (Massive level-up milestones now clear excess XP properly).

*45% of the stuff is created/generated/produced by Google Gemini, other 55% is pure my creativity and hardwork squeezed with AI's help!