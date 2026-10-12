# Bloodstream Patrol (סיירת זרם הדם): Project Context

This file holds the full context of the project so far: what exists, how it is built, what was decided and why, and what is still open. Read it before making changes.

- **Owner:** Nir (GitHub `nirro01`). Talks to Claude in Hebrew and English. The game UI is in Hebrew.
- **GitHub repo:** https://github.com/nirro01/bloodstream-patrol (public, currently **empty**: see "Open issues").
- **Live build:** a private claude.ai artifact, https://claude.ai/artifact/4r7g3pntmiLQD72euVG9vg (version 6). Only the owner can open it until it is shared.
- **Last saved version:** v7 "body worlds" on branch `claude/project-thread-g4n55s`, one commit per world on top of v6. `main` still holds v6 until the PR is merged.

---

## 1. What the game is

A 2D cartoon browser game in Hebrew (right to left). The player is a white blood cell that patrols the body and destroys pathogens. The game teaches real immunology and blood facts along the way. The brain character is the narrator and host on the menu screens.

The world looks realistic and the cast stays cartoonish: a lifelike vessel with depth, blur and correct proportions, while the characters keep their faces.

### Core loop
1. Title → pick a white cell type and a difficulty.
2. Level intro card (what is really happening biologically, plus the goal).
3. 3 waves of 26 seconds each → a boss.
4. Defeat the boss → a gap opens in the lower vessel wall → swim into it (diapedesis) to finish the level.
5. Quiz: 2 random questions, +300 points each.
6. Pick 1 of 3 upgrades (kept for the rest of the run).
7. Next level. After level 4 → win screen.

Losing: blood health reaches 0. You can retry the level (score resets to what it was at the level's start) or go back to the menu.

### Controls
- Move: WASD / arrow keys (Hebrew keyboard letters are also mapped), or press and hold the mouse or a finger and the cell follows it.
- Touching a pathogen engulfs it automatically. No attack button.
- **Space** or the round on-screen button: the cell type's special ability.
- **P**: pause. **M**: mute. Sound and music start only after the first click (browser rule).

---

## 2. Levels

| # | Level (Hebrew name) | Wall style | Enemies | Boss | Teaching point |
|---|---|---|---|---|---|
| 1 | Arm blood vessel (כלי דם בזרוע) | vessel | viruses | Virus cluster (צבר וירוסים) | Viruses float freely in plasma (viremia). They **cannot** replicate in red cells, which have no nucleus. Instead they hitchhike on red cells or infect the vessel wall (endothelium). |
| 2 | Lung capillaries (נימי הריאות) | lung (alveoli drawn beyond the wall) | bacteria 65%, viruses 35% | Bacterial colony (מושבת חיידקים) | Bacteria are living cells that divide in two. |
| 3 | Liver sinusoids (סינוסואידים בכבד) | liver (hepatocytes with nuclei) | sporozoites | Liver schizont (סכיזונט כבדי) | Malaria sporozoites invade liver cells, which later release merozoites. |
| 4 | Malaria in the bloodstream (מלריה בזרם הדם) | vessel | merozoites | Rosette (רוזטה) | The one real case where an invader enters red cells: malaria, which is a parasite, not a virus. |

### Enemy behaviour
- **Virus:** goes either for the wall (infects the endothelium → a pulsing green infection site that releases a new virus every ~3.2 s) or for red cells (sticks to the surface as a "hitchhiker", max 2 per cell, without entering it). From wave 2 some viruses dodge the player.
- **Bacteria:** rod shape with a flagellum. Divides every 7–10 s unless eaten (capped at 40 at once).
- **Sporozoite:** fast crescent that heads for the liver wall. Hitting it creates a liver infection site with a 7 s countdown ring, then 4 merozoites burst out.
- **Merozoite:** small teardrop that infects a red cell. The infected cell shows purple ring-stage spots and bursts after ~8 s into 2 merozoites (1 if more than 24 are already on screen).

### Bosses
30 HP × difficulty multiplier. Damage comes from bumping into the boss (0.32 s cooldown, knockback). They spawn minions every ~1.9 s and drift up and down. Defeating one gives +2000 points.

---

## 3. White cell types

| Key | Name | Speed | Size | Ability (Space) | Cooldown | Passive perk |
|---|---|---|---|---|---|---|
| `neut` | Neutrophil (נויטרופיל) | 1.2 | 1.0 | NET burst: engulfs everything within 175 px, 3 boss damage | 7 s | Double points on bacteria |
| `macro` | Macrophage (מקרופאג') | 0.8 | 1.4 | Giant engulf: ×1.7 size for 3 s | 7 s | Double boss damage. Kills infected cells and sites on one touch. |
| `bcell` | B cell (תא B) | 1.0 | 0.85 | Antibody volley: 14 Y-shaped antibodies in a ring | 5 s | Fires 1 antibody per second at the nearest pathogen. A tagged pathogen moves at 45% speed, cannot infect, and is worth ×1.5 points. |
| `nk` | NK cell (תא NK) | 1.1 | 0.9 | Perforin burst: ×1.9 speed for 3 s | 6 s | Kills infected red cells and clears wall sites on one touch |

The other cells need to stay in contact to clear infections: 0.5 s for an infected red cell, 0.7 s for a wall site (a green progress ring shows this).

All four use the same white-cell sprite, recolored at runtime with a canvas `hue-rotate` filter (fallback: a color overlay).

---

## 4. Systems

- **Blood health:** starts at 100 (+20 per EPO upgrade). It is the only lose condition; there are no player hit points. It regenerates 3/s after 1.5 s with no new damage (+50% per regen upgrade). +1.5 per kill, +3 per platelet, +3 per cleared site, +20 per finished wave.
  - Damage (× difficulty): wall infection 5, liver infection 4, site scrolling off screen 8, escaped pathogen 2–4, infected red cell bursting 2, red cell newly infected 1.
- **Fever:** body temperature moves toward 37 °C + infection load (max 40). Above 37.5 °C the player gets faster and pathogens multiply more slowly. A warm orange overlay appears, and the thermometer is shown in the HUD.
- **Chemotaxis:** infection sites, infected cells and the boss emit yellow cytokine dots. A yellow arrow beside the player points to the nearest signal; after a boss it points to the exit gap.
- **Platelets:** collect them for blood health. 1 per 16 red cells, close to the real 1 per 15–20.
- **Ally white cells:** 1 per 650 red cells (the real ratio), only in levels 1 and 4. They drift with the stream and eat what they touch (+40 points).
- **Combo:** kills within 1.6 s of each other chain, up to ×10.
- **Upgrades (pick 1 of 3 between levels):** speed +12%, size +10%, ability cooldown −20%, regen +50%, platelet magnet (only once), max blood +20.
- **Difficulty:**

  | | Easy | Normal | Hard |
  |---|---|---|---|
  | Enemy speed | 0.8 | 1 | 1.2 |
  | Spawn interval | 1.35 | 1 | 0.75 |
  | Damage | 0.7 | 1 | 1.3 |
  | Boss HP | 0.75 | 1 | 1.3 |

- **Quiz:** a bank of 13 Hebrew multiple-choice questions, each with an explanation. 2 random questions per level, with shuffled options.
- **Encyclopedia:** 23 Hebrew entries that unlock on first encounter. The unlock list persists in `localStorage`.
- **Storage keys:** `bp2-best` (high score), `bp2-ency` (unlocked entries), `bp2-muted`. All are wrapped in try/catch.

---

## 5. Realism choices (from the user's own data)

The user supplied these values, and the game uses them in the facts ticker, the banners, the quiz and the proportions on screen:

| Component | Value |
|---|---|
| Red blood cells | 4–6 million / µL |
| White blood cells | 4,000–11,000 / µL |
| Platelets | 150,000–450,000 / µL |
| Plasma | ~55% of blood volume |
| Water in plasma | ~90–92% |
| Albumin | ~3.5–5.0 g/dL |
| Fasting glucose | ~70–99 mg/dL |

Visual realism:
- The plasma background is straw-yellow. Blood only looks red because it is crowded with red cells.
- A far layer of 48 blurred red cells sits behind the action, and red cells tumble (rotate and foreshorten).
- Albumin ovals and glucose hexagons drift in the plasma.
- A microscope vignette darkens the edges, and a **10 µm scale bar** sits in the corner.
- Relative sizes: red cell 7.5 µm ≈ 60 px wide, white cell 12 µm, platelet 2–3 µm. Viruses are deliberately enlarged; a real virus is ~75× smaller than a red cell, and the game says so.

**Accuracy decision (important):** the earlier version had viruses infecting red cells. The user asked whether that was realistic. It isn't: mature red cells have no nucleus or ribosomes. The redesign fixed this. Viruses now hitchhike on red cells or infect the endothelium, and true red-cell invasion appears only in the malaria level. Related real cases mentioned to the user: Parvovirus B19 and Colorado tick fever virus (both infect red-cell precursors), influenza binding to the red-cell surface, HIV → CD4 T cells, dengue → monocytes, Ebola → endothelium.

---

## 6. Files and code structure

```
bloodstream-patrol/          (git repo, branch main)
├── index.html               the whole game: HTML + CSS + JS, about 3,700 lines, no libraries
├── tools/harness.js         headless bot test for every world and level
├── sprites/                 256×256 frames in horizontal strips, transparent PNG
│   ├── brain_hero_idle.png        6 frames (menu)
│   ├── brain_hero_hurt.png        4 frames (game-over screen)
│   ├── red_blood_cell_float.png   8 frames
│   ├── white_blood_cell_idle.png  8 frames
│   ├── white_blood_cell_attack.png 6 frames (frames 2–4 used as the "chomp")
│   ├── virus_idle.png             8 frames
│   └── virus_pop.png              5 frames (death puff, used for every pathogen)
└── PROJECT_CONTEXT.md       this file
```

Source art, kept outside the repo in the previous conversation; ask the user to re-upload it if needed:
- `brain_hero.svg`, `red_blood_cell.svg`, `white_blood_cell.svg`, `virus.svg`: original 512×512 vector characters.
- `make_sprites.py`: Python + cairosvg + Pillow generator for every sprite strip and `sprites.json`. It builds frames procedurally from SVG templates. `FRAME = 256`, and the content is scaled to 0.86 for padding.
- Zips that were delivered to the user: `cell_game_assets.zip` (SVG + PNG), `cell_game_sprites.zip` (strips + json + generator), `bloodstream_patrol_v6.zip` (the game).

Bacteria, sporozoites, merozoites, platelets and bosses are not sprite files. They are drawn procedurally into offscreen canvases at startup (`BACT`, `SPORO`, `MERO`, `PLT`, `drawBoss`).

### `index.html` map, in the order the sections appear
1. CSS. A single dark look by design, with tokens on `:root`. Fonts: **Secular One** (display) and **Rubik** (body) from Google Fonts. Accent lavender `#b49ae8`.
2. HTML overlays: `titleScreen`, `selectScreen`, `introScreen`, `pauseScreen`, `doneScreen`, `quizScreen`, `upScreen`, `overScreen`, `winScreen`, `encyScreen`; HUD buttons `abilityBtn`, `corner` (pause and sound); `toast`.
3. JS `CONTENT`: the `CELLS`, `DIFF`, `LEVELS`, `ENCY`, `QUIZ` and `UPGRADES` objects. **Most text and balance changes happen here.**
4. `AUDIO`: everything is synthesized with WebAudio, with no audio files. `sfx.*` holds the sound effects, and the music is a 118 BPM chiptune loop in A minor (Am–F–C–G) that gets denser on wave 3 and darker during bosses.
5. `SPRITES`: the sheet loader, `tintSheet()`, `sprite()`, and the procedural canvases.
6. `INPUT`.
7. `RUN + LEVEL STATE`: the `run` object (type, diff, level, score, kills, upgrades) and the per-level `g` object (made by `newLevel()`); `spawnEnemy()`, `spawnBoss()`.
8. `SCORING / EVENTS`: `eat()`, `hurtBlood()`, `makeSite()`, `clearSite()`, `killInfectedRbc()`.
9. `ABILITIES`: `useAbility()`, `damageBoss()`.
10. `FLOW`: screen switching (`show(id)`), quiz, upgrades, encyclopedia rendering, button wiring.
11. `UPDATE`: `update(dt)`, the main simulation.
12. `DRAW`: `draw()`, `hud()`. The logical canvas is 960×540 and is scaled to the stage with DPR (device pixel ratio).
13. `LOOP` and `boot()`. The page exposes `window.__bp` for headless testing.

Positions: wall thickness `WALL = 62`; the flow scrolls left at about 90 px/s; the HUD is laid out right to left.

### Testing
`node tools/harness.js [index.html] [seconds]` stubs the DOM and canvas, `eval`s the script, and plays every level of every world (all 4 heroes in the blood world) for 100 simulated seconds with a bot that follows `__bp.botTarget()`. It then forces boss, exit, quiz and upgrades, renders the map, and prints `ALL PASSED` or the failures. The v7 run passed all 29 combinations.

Quick checks used before every publish:
- Syntax: pull out the `<script>` contents and run `node --check`.
- Behaviour: run the harness against `index.html`.

---

## 7. How the project got here (versions)

| Ver | What changed | Why (user request) |
|---|---|---|
| assets | 4 SVG characters plus PNG exports | "create assets for a 2d cartoon game" |
| sprites | 8 animation strips, sprites.json, preview GIF | "i need to animate them" |
| v1 | Playable English game "Bloodstream Patrol": attack button, HP, waves | "create a game… white cell fights viruses" |
| v2 | Easier; healing added (HP regen, blood regen, heal per kill and per wave) | "too hard, the body is not healing" |
| v3 | Far more red cells, plus a decorative background layer | "add much more red cells" |
| v4 | Touching engulfs (no button); Space = boost (×1.75 speed, ×1.5 size, double points); HP removed; music and sound effects | user's gameplay change, plus "add music and sound effects" |
| v5 | Realism: plasma color, blur layer, real ratios, platelets, allies, scale bar, facts ticker | "make it look more realistic" plus the user's blood-value table |
| v6 | Full Hebrew rebuild with **all 12 proposed improvements**: 4 organ levels, 4 cell types, bosses, wall infection, hitchhikers, malaria, bacteria, antibodies, chemotaxis, fever, diapedesis, encyclopedia, quiz, upgrades, difficulty | "תבצע את כל ההצעות" ("do all the suggestions") |

| v7 | Body map home screen and 7 new worlds: heart, lungs, digestive system, kidneys, skin, bone marrow, brain | "תבצע הכל" on the worlds-expansion proposal (`/mnt/project-files/ideas/worlds-expansion.md`) |

Versions 1–5 exist only as artifact history on claude.ai. Git history starts at v6.

---

## 8. Working agreements with the user

- **Every change is a git commit** with a clear message. Use branches for experiments, so the user can always go back ("תחזיר לגרסה X", "go back to version X"). Tag notable versions.
- Push every commit to `nirro01/bloodstream-patrol` once push access works.
- After a change, republish the live artifact (same URL) so the user can play it right away.
- Keep game text in Hebrew. Explanations to the user go in whatever language they write in (usually Hebrew).
- Keep biology accurate. When the game simplifies something, say so in the game (as done for virus size).
- Commit attribution lines used so far:
  ```
  Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
  Claude-Session: <session url>
  ```

---

## 9. Open issues and next steps

1. Pushing works now. v7 (8 worlds) waits in a PR from `claude/project-thread-g4n55s` to `main`.
2. Optional: turn on GitHub Pages for a public playable URL (the game is static: `index.html` plus `sprites/`).
3. Real playtesting. The balance was only tested with a bot. Level 4 (malaria) was the hardest and was tuned down: burst at 8 s, 2 merozoites, damage 2.
4. Ideas offered but not built yet:
   - more brain-hero animations (jump, attack), a red-cell death animation
   - a sprite per cell type instead of tinting

---

## 10. Quick reference: tuning knobs

| What | Where | Current value |
|---|---|---|
| Wave length / count | `update()` | 26 s, 3 waves, then boss |
| Boss HP | `spawnBoss()` | 30 × `DIFF.boss` |
| Spawn interval | `update()` spawning | `max(0.6, 1.9 − wave×0.14) × diff × level mult` (lung ×1.35, malaria ×1.4, ×1.8 during the boss) |
| Red cell spawn | `update()` | every 0.2–0.42 s |
| Player radius | `radius()` | 45 × cell size × upgrades |
| Points | `eat()` | virus 100, bacteria 80, sporozoite 150, merozoite 60; site 200; infected cell 150; boss 2000; quiz 300 |
| Fever effect | `update()` | slowdown = 1 + (temp − 37.5) × 0.35; player speed + (temp − 37.5) × 8% |

---

## 11. Body worlds (v7)

The game opens on a **body map** (`mapScreen`): an SVG silhouette with one spot per world. Finishing a world unlocks the next; progress is saved in `localStorage` key `bp3-prog` as `{open, done}`. A small "פתיחת כל העולמות" link unlocks everything (for parents and testing). The original four levels are now world 1, "זרם הדם".

| # | World | Hero (player) | Meter | Levels and mechanic | Bosses |
|---|---|---|---|---|---|
| 1 | זרם הדם (blood) | pick: neutrophil, macrophage, B cell, NK | בריאות הדם | the v6 levels | cluster, colony, schizont, rosette |
| 2 | הלב | red blood cell | זרימת הדם | heart chambers with valves that open on the beat; coronary artery with plaque and LDL/HDL | thrombus (clot) |
| 3 | הריאות | alveolar macrophage | בריאות הריאות | airway with mucus and cilia (dust, pollen, soot, smoke); alveoli where O2 goes to dark red cells and CO2 leaves | smoke, pneumonia |
| 4 | מערכת העיכול | enzyme with 3 modes (Space: amylase, protease, lipase) | אנרגיה מהמזון | mouth, stomach (acid waves, H. pylori ulcers), small intestine (bile, villi), colon (microbiome balance) | bolus, H. pylori colony, fat globule, salmonella |
| 5 | הכליות | nephron tubule cell | איזון הגוף | sort what the filtrate keeps (glucose, amino acids, salt, water) from what leaves (urea, toxins); ADH level with a hydration gauge | kidney stone |
| 6 | העור והפצע | platelet, then neutrophil | שלמות העור | plug cuts with platelets and fibrin; then clean the wound of staph (allies turn into pus) | big cut, staph colony |
| 7 | מח העצם | stem cell | מאזן תאי הדם | collect 3 same-colour signals (EPO, G-CSF, M-CSF, IL-7, TPO) to make a cell type the body asks for; iron in level 2 | emergency (needs neutrophils), anemia (needs red cells) |
| 8 | המוח | astrocyte, then the signal | עוצמת האות | blood-brain barrier sorting; axon: jump between nodes of Ranvier with Space; synapse: push neurotransmitters into matching receptors | toxin cloud, reflex (timed), memory |

### How a world is built
Each world is one self-contained block in `index.html`, inserted before `// ================= INPUT =================`. It pushes into these registries:
- `WORLDS[]`: `id, name, icon, organ, meter, fever, hero/heroPick, levels, quiz, route, blurb, win, done`.
- `HEROES` (player cells), `KINDS` (entities, mostly through `genericEnemy()` with touch types `eat`, `push`, `collect`, `hazard`), `BOSSES` (`r, hp` as a multiple of 30, `emit`, `move`, `shield`, `noBump`, `need`, `draw`), `SITES`, `PICKUPS` (with optional `onPick`), `WALLSTYLE`, and `MECH` (per-level mechanic hooks: `init, flow, update, bound, drawBack/Mid/Front, hud, alarms, botTarget`).
- Level options include `flow` (0 means a still scene), `rbcFlow`, `bgCells`, `spawnMul`, `waveLen`, `exitTop`, `pickup`, `scale`, `hero`, `modes`, `demands`, `lose`, `bossHint`.
- Encyclopedia entries are added with `Object.assign(ENCY, {...})`; each world has its own quiz bank.
- Helpers: `WD()`, `LV()`, `C()`, `M()`, `perk()`, `award()`, `heal()`, `label()`, `banner()`, `wallShape()`, `infSite()`.

Upgrades marked `pickup: true` are hidden when the next level has no pickups. Known quirk: combos make scores large in later worlds; accepted for now.
