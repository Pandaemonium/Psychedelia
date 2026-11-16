/* THE BLOOMING DARK — story and levels.

   A line of story is a string. Its first character says who is speaking:
     "~"  Iris            "@"  you            "%"  the voice with nobody in it (chapter IV)
     "="  her pencil      "!"  the white of opening your eyes (may come before any of the others)
     anything else is narration.
   An object in a list of lines is a stage direction, carried out between lines:
     { win: {lit, sun, glazed} | false }   show the rose window (rings lit from the rim inward, sun in the middle) or put it away
     { scene: n, dur: seconds }            cross-fade the sky        { kal: 0..1 }  fold it
     { sound: 'whoosh' | 'bloom' }         { pause: ms } */
(function (root) {
  'use strict';
  const BD = root.BD = root.BD || {};
  const s3 = Math.sqrt(3) / 2;

  BD.TITLE = 'The Blooming Dark';

  BD.PROLOGUE = [
    { win: { lit: 0, sun: 0 } },
    "Your mother made windows for fifty years, and died in February with one unfinished.",
    "You called her Iris. She said “Mum” was a job title.",
    "It is propped in the east window of her loft now: a rose as wide as your arms, every piece cut and leaded. You finished it yourself. Three weeks of nights.",
    "Every piece but one. In the middle of her drawing, where the number should be, there is a circle with nothing in it. You can see where she rubbed something out.",
    "It was promised to the hospice on the hill two years ago. They got her before they got the window. The fitters come for it at nine.",
    "You asked her, near the end, what went in the middle. She looked past you for a long time, and said: “What’s it doing out?”",
    "It was what she asked every morning. You told her it was raining.",
    "On the shelf above the kiln there is a tea tin. On the lid, in her pencil:",
    "=FOR LOOKING. One spoon. Lie down first.",
    "She always said she had never designed a window in her life. She said she went and got them.",
    "You took that for a figure of speech. You are an optometrist. You like things that can be checked.",
    "It is ten past two. You have held every colour in her racks up to that hole, and every one of them is wrong.",
    "One spoon. It tastes the way a hedge smells.",
    "You lie down on the boards under the window, where you used to lie as a child, and for twenty minutes you feel like a fool.",
    { win: false },
    "Then you close your eyes, and the dark behind your eyelids is not empty.",
    "~There you are. Don’t get up. You’ll only knock something over."
  ];

  BD.CHAPTERS = [
    /* ---------------------------------------------------------------- I
       The lock is the iris of your own eye, seen from behind. */
    {
      numeral: 'I', title: 'The Threshold', scene: 1, hue: 265,
      epigraph: 'If nothing happens, you are trying.', source: 'in pencil, inside the lid of the tin',
      intro: [
        "Rings. Ring inside ring in the dark, each with one bright gap, turning slowly against the others.",
        "@Iris?",
        "~Who else would it be, at this hour.",
        "@You are not her. I am lying on a floor, having drunk a spoonful of hedge.",
        "~Both of those can be true, love. I’m what answers when you call her. Tonight that will have to do.",
        "@That is exactly what she would say.",
        "~Well, then.",
        "~Now. You know what this is. You look into thirty of them a day.",
        "You do. It is an iris, seen from behind. It is your own. The gap in the middle is the one you look out of.",
        "~Twenty years of shining a little light into people’s eyes, and you never once wondered what it was like for the light.",
        "~First door’s the one you look out of. Gently, now. Nothing in here opens by force."
      ],
      levels: [
        {
          type: 'rings', name: 'Dark Adaptation', n: 6, rings: 3,
          links: { 2: [[1, 1]] }, scramble: [2, 3, 1],
          help: '{Click} a ring to turn it · right-click turns it back. Bring every gate to the top.',
          hints: [
            'Each ring carries one bright gate. Bring all three to the top, in line with the light.',
            'The outer ring drags the middle one round with it. Settle the outer ring first, then the middle one on its own.'
          ],
          after: [
            "~There. Twenty minutes in the dark, and the purple comes back.",
            "@Rhodopsin.",
            "~Visual purple, you called it, back when you still wanted me to like your job. The stuff an eye sees the dark with. Light bleaches it out, and the dark gives it back.",
            "~It’s the only thing you ever told me about your work that I wrote down."
          ]
        },
        {
          type: 'rings', name: 'Visual Purple', n: 8, rings: 4,
          links: { 0: [[1, 1]], 1: [[2, -1]], 2: [[3, 1]] }, scramble: [3, 2, 5, 1],
          help: 'Rest the pointer on a ring to see what it drags — and which way.',
          hints: [
            'Rest on a ring before you turn it. Whatever lights up will move too, and a blue tether means it moves the other way.',
            'Nothing drags the innermost ring. Settle it first and never touch it again. Then work outward, one ring at a time.'
          ],
          after: [
            "~Two muscles in an iris. One opens it, one shuts it. They have been arguing since before you were born, and that argument is what looking is.",
            "@Sphincter and dilator.",
            "~I liked it better before it had names."
          ]
        },
        {
          type: 'rings', name: 'The Pupil', n: 8, rings: 5,
          links: { 0: [[1, 1]], 1: [[2, 1]], 2: [[3, -1]], 3: [[4, 1]], 4: [[0, -1], [2, 1]] }, scramble: [1, 3, 2, 5, 2],
          help: 'Five rings. Every one of them is dragged by another.',
          hints: [
            'There is no safe place to begin: the chain closes on itself. Every ring pulls its outer neighbour, and the outermost reaches all the way back to the middle.',
            'Eight turns of a ring undo themselves. So each ring needs somewhere between none and seven, and the order you make them in does not matter at all.',
            'From a fresh start (press R), counting rings from the centre: turn the 1st seven times, the 2nd five, the 3rd six, the 4th three, the 5th six.'
          ]
        }
      ],
      outro: [
        "The last ring comes round. The pupil stands open, black and exact.",
        "~You’d have used drops for that. Two drops, and twenty minutes in the waiting room with a magazine.",
        "You go through. It ought to feel like going in.",
        "It feels like going out. You note that, in the careful way you note things. Then the colour starts, and you forget you ever noted anything."
      ]
    },

    /* --------------------------------------------------------------- II
       Outside the eye: the coloured light falling from her window. */
    {
      numeral: 'II', title: 'The Garden of Light', scene: 2, hue: 150,
      epigraph: 'Glass has no colour. Glass has opinions about light.', source: 'in the margin of the drawing',
      intro: [
        "Colour, standing up all round you like a wood. Leaves the size of doors, in greens you could name by number. You cut some of these yourself.",
        "You are inside her window.",
        "~They used to say I never did a saint if I could do a weed. Quite right. The saints have enough windows.",
        "The flowers are shut. Each one wants a single colour, and will not open for any other.",
        "~People think a red pane is full of red. It’s the other way about. Red is the one thing it won’t keep. It swallows every other colour that comes to it, and lets the red go by.",
        "~So what you see of a thing is what it gives away. Keep hold of that. It will matter later, and not only for glass.",
        "~Go on. Feed my weeds."
      ],
      levels: [
        {
          type: 'prism', name: 'Seedling',
          map: [
            '.......',
            '>..o...',
            '.......',
            'B..P..R',
            '.......',
            'G..o...'
          ],
          help: '{Click} a socket to raise a mirror · again to tilt it · again to lower it.',
          hints: [
            'The prism is hungry too. Bend the white light down into it and see what comes out of the other sides.',
            'Inside a prism, red bends to its left, blue to its right, and green carries straight on. Turn the green, at the bottom, toward its bud.'
          ],
          after: [
            "~You used to lie in this. On the loft floor, under whatever I had up in the frame. You’d lie in the red, and when the red moved, you moved.",
            "~About an inch an hour. Like a cat.",
            "@I thought you were working.",
            "~I was working. I was also watching the red go across your face. I could do both. I never said so, which is a different matter."
          ]
        },
        {
          type: 'prism', name: 'What Magenta Wants',
          map: [
            '.......',
            '...o.o.',
            '.......',
            '>o.P.oo',
            '.......',
            '...o.M.',
            '......G'
          ],
          help: 'A bud opens only on exactly its own colour. Two beams can share one flower.',
          hints: [
            'There is no magenta in the rainbow. It is what you see when red and blue arrive together, with no green between them.',
            'Lead the red round the top and the blue round the bottom until they meet inside the magenta bud. Green wants the far corner.',
            'Some sockets are best left dark. A mirror in the wrong place feeds a flower something it cannot stomach.'
          ],
          after: [
            "@There is no magenta in a rainbow. No such light. It is what an eye makes of red and blue arriving together.",
            "~I know. You told me when you were twelve. I was furious. I’d been paying good money for it.",
            "~So where is it, then, if it isn’t in the light?",
            "@…In whoever is looking.",
            "~Hm. Keep hold of that as well."
          ]
        },
        {
          type: 'prism', name: 'The Canopy',
          map: [
            '..#......',
            '....BY.o.',
            '.....o...',
            '..o..P.o<',
            '>.o.P..o.',
            '.........',
            '....oM#..'
          ],
          help: 'Two suns. Yellow is red with green. Magenta is red with blue.',
          hints: [
            'Each sun gives one red, one green, one blue. Three flowers want five of those six beams, so one of them is free to spill out into the dark.',
            'A flower drinks from every side at once; if a colour it does not want arrives too, it stays shut. And who says a sun must use the prism in front of it?',
            'Send each sun’s light across to the other sun’s prism. Then the yellow bud takes red from below and green from the right; the magenta bud takes blue from above and red from the left.'
          ]
        }
      ],
      outro: [
        "The whole window opens at once: every weed you ever cut for her, lit from behind.",
        "@What goes in the middle, Iris?",
        "~What’s it doing out?",
        "@It is the middle of the night.",
        "~Then it isn’t ready, is it.",
        "The colour thins. Behind the garden something is moving: a slack silver net of light, swaying.",
        "You know that net. It shook on the loft ceiling every bright morning of your childhood. It comes up off the harbour.",
        "~That’s it. Ask where the light was before it got to my glass."
      ]
    },

    /* -------------------------------------------------------------- III
       Before the glass, the light came off the water. */
    {
      numeral: 'III', title: 'The Hall of Mirrors', scene: 3, hue: 195,
      epigraph: 'Only a window with its back painted.', source: 'in pencil, on the back of the workshop mirror',
      intro: [
        "You step out through the glass, and you are standing on the harbour.",
        "Black water, flat calm, every ripple carrying a piece of the sky. A little way off, someone else is standing on it. When you step left, they step right. When you stop, they stop.",
        "~Look straight down into water and it’s a window. Look across it and it’s a mirror. Same water. It only depends what angle you come at it.",
        "~People are the same. You and I only ever came at each other sideways.",
        "~Go on. Ask me what you ask everybody, thirty times a day, with your little lenses.",
        "@…Which is clearer? One, or two?",
        "~Two, at the moment. Ask me again further out."
      ],
      levels: [
        {
          type: 'twins', name: 'Reflection', mode: 'mirror',
          map: [
            '#ab...#',
            '..#..#.',
            '#...#..',
            '...B...',
            '..#.A.#'
          ],
          help: 'Arrow keys or swipe. Your reflection mirrors you: left ⇄ right. Stand on the sun, and bring your reflection to the moon.',
          hints: [
            'Step left and your reflection steps right. Up and down, you travel together.',
            'A wall is a gift. Whoever is blocked stays put while the other keeps moving. It is the only way the distance between you ever changes.',
            'From a fresh start (press R):  ↑  ←  ←  ←  ↑  ↑  →  ↑'
          ],
          after: [
            "~Did you notice? The only time the distance between you changes is when one of you walks into something.",
            "~That’s the pair of us to the life."
          ]
        },
        {
          type: 'twins', name: 'Veils', mode: 'mirror',
          map: [
            '#......',
            '.v...#.',
            '.#.a.##',
            '#.B#..v',
            '..##..g',
            'b...#A#',
            '.g.....'
          ],
          help: 'Gold veils part only for you. Violet veils part only for your reflection.',
          hints: [
            'A veil is a wall to one of you and open air to the other. Use that to fall out of step.',
            'Your reflection’s moon lies far down on the left. Let the reflection be the one that gets stuck while you find your way up to the sun.',
            'From a fresh start (press R):  →  ↑  ↑  ↓  ←  ↑  ↑  ↑  ↓  ←  ←  →  ↓'
          ],
          after: [
            "@Glass for looking through.",
            "~Ah.",
            "@I was nineteen. I told you I was going to train in optics, and that is what you said. You said it the way people say margarine.",
            "~I know how I said it.",
            "~You were the best cutter I ever had, and you were going somewhere I couldn’t follow. I had one clever thing to say, so I said it. I watched it go in.",
            "~I’ve had twenty-six years to think of a better one.",
            "The figure on the water has stopped copying you. It is turning round.",
            "You have looked into the black of ten thousand pupils, and in every one there was a tiny figure holding a light. Pupilla, the Romans called it: little doll. It was always you.",
            "This one is not you. You know those hands. There is a white scar across the left thumb, where a sheet of ruby let go in 1983.",
            "@That is not my reflection.",
            "~It never was, love. A mirror’s only a window with its back painted. I’ve been scraping at this one since February.",
            "~Mind, now. Face to face, everything goes backwards. I’ll go left when you go right, and up when you go down. I can’t help it. I never could."
          ]
        },
        {
          type: 'twins', name: 'Face to Face', mode: 'invert', tint: 'ruby',
          map: [
            '......#',
            '...#..#',
            '#BA....',
            '...v...',
            '....#..',
            'g##.u..',
            '......#'
          ],
          help: 'Iris reverses everything you do: up ⇄ down, left ⇄ right. Gold veils are yours, ruby veils are hers. Meet where the sun and the moon are one.',
          hints: [
            'Face to face, every step you take toward her is a step she takes toward you — until a wall says otherwise.',
            'You begin side by side and are flung apart at once. You can only arrive together by arriving from opposite sides.',
            'From a fresh start (press R):  →  ↑  →  →  ↓  ↓  ←  ←  ↓  ←  ↑  ↑  ↑  →  ←'
          ]
        }
      ],
      outro: [
        "The same square of water, reached from opposite sides. You put your hand flat against nothing at all, and feel a palm.",
        "~There. That was the only way we were ever going to get to the same place. From opposite directions.",
        "The silver goes out of the water. It is a window now, all the way down, and there is no telling which side of it you are on.",
        "~I can’t talk you through this next part. Nobody can. There’s nobody in it.",
        "~It’s what I chalked on the kiln door. Don’t open it to see if you’re ready.",
        "The harbour lets go of the light, and you go up with it."
      ]
    },

    /* --------------------------------------------------------------- IV
       Before the water, the light crossed the dark. */
    {
      numeral: 'IV', title: 'The Shoreless', scene: 4, hue: 285,
      epigraph: 'DO NOT OPEN TO SEE IF IT IS READY.', source: 'chalked on the kiln door',
      intro: [
        "Up off the water. Up through the weather. Up past the place where up stops meaning anything.",
        "You reach for your name, and it is not on the hook where you left it.",
        "Black, and stars that do not twinkle. There is nothing out here for them to twinkle through.",
        "%It is not dark because it is empty.",
        "%It is full. Every inch of it is sunlight, going by at the only speed there is. But light cannot be seen from the side. It is only ever seen by what it lands on.",
        "%The dark is light with nobody in the way.",
        "Something out here is in pieces. It may be a window. It may be you. It does not seem to matter which."
      ],
      levels: [
        {
          type: 'void', name: 'Scattered', n: 3, art: 0,
          scramble: [['r', 0, 1], ['c', 2, 1]],
          help: 'Drag a row sideways, or a column up and down. What slips off one edge returns on the other.',
          hints: [
            'The small picture in the corner is the whole. Slide the pieces until they are that again.',
            'It was scattered in two movements. Undo the last one first: lift the right-hand column by one. Then slide the top row one to the left.'
          ],
          after: [
            "%Nothing fell off the edge. There isn’t one. Whatever leaves by one side is already arriving at the other.",
            "%That is the first good news."
          ]
        },
        {
          type: 'void', name: 'Drift', n: 4, art: 1,
          scramble: [['r', 1, 1], ['c', 2, -1], ['r', 3, 2]],
          help: 'Three movements scattered it. Three will gather it.',
          hints: [
            'Look for a row that is whole but out of place: every piece correct, only shifted. That row was moved last.',
            'From a fresh start (press R): slide the bottom row two places. Push the third column down one. Slide the second row one to the left.'
          ],
          after: [
            "%This is what it was like, at the end.",
            "%Not dark. Wide. The ward went on somewhere in a corner of it, very small, like a radio left on in another room.",
            "%I wasn’t frightened. I would have told you. I was only curious what it was doing out.",
            "%The last morning, I didn’t ask. You told me anyway.",
            "%“Bright,” you said. “Cold, and bright.” I heard that."
          ]
        },
        {
          type: 'void', name: 'The Eye Opens', n: 5, art: 2,
          scramble: [['r', 1, 2], ['c', 3, -1], ['r', 4, 1], ['c', 0, 2]],
          help: 'Further out now. Four movements.',
          hints: [
            'Undo the movements in reverse. The last one moved a column: look for a column whose pieces are right but have slid.',
            'From a fresh start (press R): lift the first column up two. Slide the bottom row one to the left. Push the fourth column down one. Slide the second row two to the left.'
          ]
        }
      ],
      outro: [
        "The pieces close. It is an eye, and it is open, and there is no one behind it and no one in front of it.",
        "%Which is clearer? One, or two?",
        "%One.",
        "%There was only ever the one. It looks out of whatever has a window.",
        "Then, far off, a light that is not a star: too steady, too near, and growing.",
        "Everything out here is streaming away from it. You have been swimming upstream all night.",
        "~There you are. I lost you for a bit. You lost you for a bit."
      ]
    },

    /* ---------------------------------------------------------------- V
       The ray itself: one line, from the sun to a sleeping face. */
    {
      numeral: 'V', title: 'The Thread', scene: 5, hue: 35,
      epigraph: 'Don’t lift the charcoal.', source: 'along the bottom edge of the drawing',
      intro: [
        "A line. One line of light, drawn tight, from the brightness ahead of you to somewhere a very long way behind.",
        "~Turn round. Follow it down. You’re the eye man.",
        "Down through the dark. Down through the weather. Off the harbour, in at an east window, through a wheel of coloured glass —",
        "— and on to the face of someone asleep on a floor.",
        "@That’s me.",
        "~That’s where it lands. It hasn’t set out yet.",
        "~This is where I came for them. Every window I ever made. You go up the light until you find out what it wants to come through, and then you go home and cut it. That’s the whole trade.",
        "~And I drew every one of them in a single line. Lift the charcoal and you start thinking, and then you’ve had it. So: all of it, once, and don’t lift."
      ],
      levels: [
        {
          type: 'thread', name: 'One Line',
          nodes: [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [0, 0]],
          edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0], [1, 3], [3, 5], [5, 7], [7, 1], [1, 8], [8, 5]],
          help: '{Click} a lantern to begin, then trace from lantern to lantern. Draw every line exactly once.',
          hints: [
            'You may begin anywhere — but not every beginning has an ending.',
            'Count the lines that meet at each lantern. Where the number is odd, a line must begin or end. Begin there.',
            'Begin at the lantern in the middle of the top edge.'
          ],
          after: [
            "~Now the colour. Light takes a little of everything it goes through. After that, some roads are only open to it in the colour it’s carrying."
          ]
        },
        {
          type: 'thread', name: 'The Colours You Carry',
          nodes: [[0, -1, 1], [-s3, 0.5, 2], [s3, 0.5, 4], [-s3 / 2, -0.25], [s3 / 2, -0.25], [0, 0.5], [0, -0.25], [-s3 / 4, 0.125], [s3 / 4, 0.125]],
          edges: [[0, 3], [3, 1], [1, 5, 1], [5, 2], [2, 4, 4], [4, 0], [3, 6, 4], [6, 4, 1], [4, 8, 4], [8, 5], [5, 7, 2], [7, 3, 2], [6, 7, 4], [7, 8, 4], [8, 6]],
          help: 'Three wells dye the thread. A coloured line can only be drawn in its own colour; pale lines take any.',
          hints: [
            'Your thread is pale until it touches a well, and then it keeps that colour until it touches another.',
            'Look at the red line that runs into the green well. You can only walk it toward the well: arriving red, leaving green. Lines like that tell you the order of things.',
            'Begin at the red well at the top, and head down to the right. Most of the middle is blue: save it for last.'
          ],
          after: [
            "~You came through me first. Everybody comes through somebody. You’ve been a little bit ruby ever since.",
            "~I’m sorry. And you’re welcome. It’s the same sentence.",
            "@Is that what you are, in here?",
            "~I’m the part of you that’s still my colour. Where did you think I’d be?",
            "~Last one. A window is the only picture with two fronts, and I only ever drew from the inside. You take the outside."
          ]
        },
        {
          type: 'thread', name: 'Both Sides', mirror: true,
          nodes: [
            [0, -1], [s3, -0.5], [s3, 0.5], [0, 1], [-s3, 0.5], [-s3, -0.5],
            [0, -0.5], [s3 / 2, -0.25], [s3 / 2, 0.25], [0, 0.5], [-s3 / 2, 0.25], [-s3 / 2, -0.25]
          ],
          edges: [
            [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
            [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 6],
            [0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11],
            [7, 10], [11, 8], [7, 11], [8, 10]
          ],
          help: 'From the other side of the glass, Iris draws the mirror image of every line you draw. Between you, draw each line once.',
          hints: [
            'A line drawn by either hand is drawn for good. Whatever you leave for her, she must be able to reach.',
            'Lines that cross the middle are drawn by both of you at once: you pass through each other and trade sides.',
            'Begin on a shoulder of the outer ring — not at its crown, and not at its foot.'
          ]
        }
      ],
      outro: [
        "The last line closes. One drawing, seen from both sides of the glass, held together by the dark lines between the pieces.",
        "~People think the lead spoils a window. All those black lines. The lead is the drawing, love. It’s what lets every piece be its own colour and still be one window.",
        "@What goes in the middle, Iris?",
        "~I’d drawn a sun. Gold on ruby, very fine. I was pleased with it.",
        "~Then I spent eleven weeks in that day room, parked in front of a sheet of plywood where my own window should have been, asking you what it was doing out.",
        "~And one morning I thought: you daft woman. There is a perfectly good sun outside.",
        "~The colour is for the people sitting with you. The one in the bed just wants the weather.",
        "@You could have said.",
        "~I said it every morning. I could hardly ask you outright, could I. Not for that. Not after the way I’d put it.",
        "~Clear, love. Your sort. Glass for looking through.",
        "This time she says it the way people say butter.",
        "~Now. Which is clearer? One, or two?",
        "@…They look about the same.",
        "~Then that’s your prescription. It’s how you told me you know you’ve found it: when they can’t tell the two apart. I did listen.",
        "~Come and see what goes in the middle."
      ]
    },

    /* --------------------------------------------------------------- VI
       The middle of the window. The same lock as the first, from the inside. */
    {
      numeral: 'VI', title: 'The Morning', scene: 6, hue: 40,
      epigraph: 'A sun. Gold on ruby.', struck: true, source: 'in the middle of the drawing, rubbed out',
      intro: [
        "Every line in her drawing ends in the middle. So does this one. The middle is the sun.",
        "It has rings. Of course it has rings: shell inside shell, each with its one bright gate, turning.",
        "@It’s the same lock.",
        "~It was always the same lock. Where did you think eyes got the idea?",
        "~Four billion years that thing poured light on the sea with nobody to tell it what it was doing out. So it grew some eyes.",
        "~The light that lands on your face this morning has been trying to get out of there for a hundred thousand years. Not even the same light, the whole way. It gets swallowed and handed on, swallowed and handed on.",
        "@Like a family.",
        "~I didn’t say that. You said that.",
        "~It’s at the last doors now. Somebody has to let the morning out.",
        "@Me?",
        "~You’re not something the light happens to, love. You’re something the light does. Who did you think let it out, every morning of your life?",
        "You find that you are laughing. It is the laugh you used to get in church, with her elbow in your ribs."
      ],
      levels: [
        {
          type: 'rings', name: 'The Same Lock', n: 8, rings: 6, hue0: 52, hueSpan: -62,
          links: { 0: [[1, 1]], 1: [[2, 1]], 2: [[3, 1]], 3: [[4, 1]], 4: [[5, 1]] }, scramble: [3, 2, 5, 1, 6, 4],
          help: 'Six doors. Begin at the heart and work outward: each ring hands its turning on to the next one out.',
          hints: [
            'Each ring drags only its outer neighbour, and nothing drags the innermost. So whatever you settle from the centre outward stays settled.',
            'Bring the innermost gate to the top. Then the second. Then the third. By the sixth, the morning is out.'
          ],
          after: [
            "The last gate comes round, and the morning goes out through it.",
            "You are not watching it go. You are going.",
            "~A hundred thousand years to get out of the house. Eight minutes and twenty seconds to cross the dark.",
            "~It took you nineteen years to get out of that loft, and then you were across town in a quarter of an hour.",
            "~You had to go. Light that stays in the sun is no use to anybody. I knew that. Fifty years of making things to let the light through, and I couldn’t let one child out of the door without a remark.",
            "~Here’s one for your sort. For the light itself there is no eight minutes. No time on the way at all. It leaves, and it lands, and to the light that is one thing.",
            "~As far as the light is concerned, the sun is touching your face.",
            "~So don’t talk to me about gone.",
            { scene: 4, dur: 2.2, kal: 0.4, sound: 'whoosh' },
            "The dark, which is not empty.",
            { scene: 3, dur: 2.2, sound: 'whoosh' },
            "The weather. Then the harbour, coming up fast. You come at it straight, and it lets you through. You come at it aslant, and it throws you, laughing, across her ceiling. Both.",
            { scene: 2, dur: 2.2, sound: 'whoosh' },
            "The glass. Green, and gold. Ruby, mostly. You find you don’t mind.",
            "And in the middle of it, one place where nothing stops you at all.",
            { scene: 1, dur: 2.2, kal: 0, sound: 'whoosh' },
            "An eyelid, lit from outside, is the colour of the inside of a rose. Behind it, an iris. You know what to do with an iris.",
            "And for once you find out what it is like for the light.",
            { scene: 5, dur: 4 },
            "!You open your eyes."
          ]
        }
      ],
      outro: []
    }
  ];

  BD.EPILOGUE = [
    { win: { lit: 5, sun: 1 } },
    "Morning.",
    "The sun has come up out of the harbour and is standing in the hole in the middle of her window, exactly, as if it had been measured for.",
    "The loft floor is covered in colour, and you are lying in it, with one disc of plain white daylight on your face.",
    "You get up. It takes longer than it did when you were seven.",
    "At the back of the rack, behind the rubies, there is a sheet wrapped in brown paper that you would swear was not there yesterday. On the paper, in her pencil:",
    "=FOR LOOKING THROUGH.",
    { win: { lit: 5, sun: 1, glazed: 1 }, sound: 'bloom' },
    "You cut the circle in one pass. Best cutter she ever had.",
    "By lunchtime you will not be able to explain any of it. You’ll say: the sun goes in the middle. And they’ll say: right.",
    "A van is turning on the quay. You are alone in the loft, and nobody asks.",
    "You tell her anyway.",
    "@Sun, Iris. It’s sun."
  ];

  BD.SIGNOFF = 'Now go and see what it’s doing out.';

})(typeof window !== 'undefined' ? window : globalThis);
