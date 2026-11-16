# The Blooming Dark

A psychonautic puzzle voyage: one unfinished window, one spoon of tea, one night.

Your mother made stained-glass windows for fifty years, and died with one unfinished. It is propped in the east window of her loft: a rose as wide as your arms, every piece cut and leaded except the one in the middle, which her drawing leaves blank. The fitters come for it at nine. On the shelf above the kiln there is a tea tin, and on the lid, in her pencil: *For looking. One spoon. Lie down first.*

She always said she never designed a window in her life. She said she went and got them.

## Play

Open `index.html` in a current browser (Chrome, Edge, Firefox, Safari). No install, no build, no server.

Best with headphones, fullscreen (`F`), in a dark room. The game is made of intense, shifting colour and light; there is a **Gentle visuals** switch on the title screen and in the menu that slows the motion and softens the flashes.

Progress saves in the browser automatically. If you played an earlier version, your unlocked levels are kept; press **Begin** to hear the story from the start.

## The night, in six parts

The story is told between the puzzles, and the puzzles are part of how it is told. This table says what you do, not what it means.

| | Chapter | The puzzle |
|---|---|---|
| I | The Threshold | A lock of concentric rings. Turning one ring drags others with it, some of them backwards. Bring every gate into line. |
| II | The Garden of Light | White light splits into red, green and blue. Raise mirrors to feed each flower exactly its own colour. Magenta needs red and blue to arrive together. |
| III | The Hall of Mirrors | You and the figure on the water move at once. It mirrors you, then reverses you. Walls and veils are the only way to fall out of step, and into place. |
| IV | The Shoreless | Something cut into tiles on a surface with no edge. Rows and columns slide and wrap around. Gather it. |
| V | The Thread | Draw each figure in one unbroken line. Then with a thread that changes colour. Then with someone else drawing the mirror image from the other side of the glass. |
| VI | The Morning | The same lock as the first, from the inside. |

Each chapter card carries a small copy of the window. It lights from the rim inward as the night goes on.

## Controls

| | |
|---|---|
| Mouse / touch | Everything. Click, drag, swipe. |
| Right-click or Shift-click | Turn a ring or cycle a mirror the other way |
| Arrows / WASD | Move (Hall of Mirrors) |
| `Z` | Step back |
| `R` | Begin the puzzle again |
| `H` | Ask Iris for a hint. Ask again for a stronger one; the last hint is usually the answer. |
| `M` | Sound on / off |
| `F` | Fullscreen |
| `Esc` | Chapters menu |
| `Space` / `Enter` / click | Continue the story. The **skip** button in the corner passes over the rest of a passage. |

Finishing the game unlocks **Wander**: the seven worlds as a free kaleidoscope.

## How it is made

Plain HTML, CSS and JavaScript with no dependencies. The only network request is for three web fonts, and the game falls back to system fonts offline.

```
index.html          the page
css/style.css       title, story, menus, HUD
js/logic.js         the rules of all five kinds of puzzle (no DOM; shared with the verifier)
js/story.js         every line of text, every level, and the stage directions between lines
js/shader.js        the background: one WebGL fragment shader, seven worlds
js/audio.js         generative music and sound, synthesised live (no audio files)
js/core.js          drawing helpers: glow, light, particles
js/rose.js          the rose window
js/puzzle-*.js      one renderer per kind of puzzle
js/game.js          the director: story flow, input, saving, the frame loop
tools/verify.js     proves every level can be solved
```

To check the levels after editing `js/story.js`:

```
node tools/verify.js
```

It brute-forces or searches each puzzle and prints the shortest solution it finds.

Shortcuts for development, added to the address:

- `?go=3.2` jumps straight to chapter 3, level 2 (`?go=7` plays the epilogue)
- `?scene=4` shows one background world on its own (0 to 6); add `&rose=5.1.1` to stage the window (rings lit, sun, glazed)
- `&auto=300` advances the story by itself every 300 ms
