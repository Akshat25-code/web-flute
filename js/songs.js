/* ===================================================================
   Web Flute – Song Library (Learn Mode data)
   Each song is a list of notes. A note is { sargam, beats }.
   - sargam: one of Sa Re Ga Ma Pa Dha Ni Sa'  (matches the keys)
   - beats : duration in beats (1 = one beat, 0.5 = half, 2 = held)
   Use { rest:true, beats:n } for a silent gap.
   tempo is in beats-per-minute.

   To add a song: copy a block, change the notes. That's it.
   =================================================================== */

const SONGS = [
  {
    id: 'twinkle',
    title: 'Twinkle Twinkle Little Star',
    level: 'Beginner',
    tempo: 100,
    notes: [
      { sargam: 'Sa', beats: 1 }, { sargam: 'Sa', beats: 1 },
      { sargam: 'Pa', beats: 1 }, { sargam: 'Pa', beats: 1 },
      { sargam: 'Dha', beats: 1 }, { sargam: 'Dha', beats: 1 },
      { sargam: 'Pa', beats: 2 },
      { sargam: 'Ma', beats: 1 }, { sargam: 'Ma', beats: 1 },
      { sargam: 'Ga', beats: 1 }, { sargam: 'Ga', beats: 1 },
      { sargam: 'Re', beats: 1 }, { sargam: 'Re', beats: 1 },
      { sargam: 'Sa', beats: 2 },
    ],
  },
  {
    id: 'sargam-up-down',
    title: 'Sargam (Scale Up & Down)',
    level: 'Beginner',
    tempo: 110,
    notes: [
      { sargam: 'Sa', beats: 1 }, { sargam: 'Re', beats: 1 },
      { sargam: 'Ga', beats: 1 }, { sargam: 'Ma', beats: 1 },
      { sargam: 'Pa', beats: 1 }, { sargam: 'Dha', beats: 1 },
      { sargam: 'Ni', beats: 1 }, { sargam: "Sa'", beats: 2 },
      { sargam: 'Ni', beats: 1 }, { sargam: 'Dha', beats: 1 },
      { sargam: 'Pa', beats: 1 }, { sargam: 'Ma', beats: 1 },
      { sargam: 'Ga', beats: 1 }, { sargam: 'Re', beats: 1 },
      { sargam: 'Sa', beats: 2 },
    ],
  },
  {
    id: 'mary',
    title: 'Mary Had a Little Lamb',
    level: 'Beginner',
    tempo: 110,
    notes: [
      { sargam: 'Ga', beats: 1 }, { sargam: 'Re', beats: 1 },
      { sargam: 'Sa', beats: 1 }, { sargam: 'Re', beats: 1 },
      { sargam: 'Ga', beats: 1 }, { sargam: 'Ga', beats: 1 },
      { sargam: 'Ga', beats: 2 },
      { sargam: 'Re', beats: 1 }, { sargam: 'Re', beats: 1 },
      { sargam: 'Re', beats: 2 },
      { sargam: 'Ga', beats: 1 }, { sargam: 'Pa', beats: 1 },
      { sargam: 'Pa', beats: 2 },
      { sargam: 'Ga', beats: 1 }, { sargam: 'Re', beats: 1 },
      { sargam: 'Sa', beats: 1 }, { sargam: 'Re', beats: 1 },
      { sargam: 'Ga', beats: 1 }, { sargam: 'Ga', beats: 1 },
      { sargam: 'Ga', beats: 1 }, { sargam: 'Ga', beats: 1 },
      { sargam: 'Re', beats: 1 }, { sargam: 'Re', beats: 1 },
      { sargam: 'Ga', beats: 1 }, { sargam: 'Re', beats: 1 },
      { sargam: 'Sa', beats: 2 },
    ],
  },
  {
    id: 'sare-jahan',
    title: 'Sare Jahan Se Accha',
    level: 'Intermediate',
    tempo: 100,
    notes: [
      { sargam: 'Sa', beats: 1 }, { sargam: 'Ga', beats: 1 },
      { sargam: 'Ma', beats: 1 }, { sargam: 'Pa', beats: 1 },
      { sargam: 'Pa', beats: 1 }, { sargam: 'Ma', beats: 0.5 }, { sargam: 'Pa', beats: 0.5 },
      { sargam: 'Dha', beats: 2 },
      { sargam: 'Pa', beats: 1 }, { sargam: 'Ma', beats: 1 },
      { sargam: 'Ga', beats: 1 }, { sargam: 'Re', beats: 1 },
      { sargam: 'Ga', beats: 1 }, { sargam: 'Re', beats: 1 },
      { sargam: 'Sa', beats: 2 },
    ],
  },
  {
    id: 'happy-birthday',
    title: 'Happy Birthday',
    level: 'Beginner',
    tempo: 110,
    notes: [
      { sargam: 'Sa', beats: 0.75 }, { sargam: 'Sa', beats: 0.25 },
      { sargam: 'Re', beats: 1 }, { sargam: 'Sa', beats: 1 },
      { sargam: 'Ma', beats: 1 }, { sargam: 'Ga', beats: 2 },
      { sargam: 'Sa', beats: 0.75 }, { sargam: 'Sa', beats: 0.25 },
      { sargam: 'Re', beats: 1 }, { sargam: 'Sa', beats: 1 },
      { sargam: 'Pa', beats: 1 }, { sargam: 'Ma', beats: 2 },
      { sargam: 'Sa', beats: 0.75 }, { sargam: 'Sa', beats: 0.25 },
      { sargam: "Sa'", beats: 1 }, { sargam: 'Dha', beats: 1 },
      { sargam: 'Ma', beats: 1 }, { sargam: 'Ga', beats: 1 }, { sargam: 'Re', beats: 1 },
      { sargam: 'Ni', beats: 0.75 }, { sargam: 'Ni', beats: 0.25 },
      { sargam: 'Dha', beats: 1 }, { sargam: 'Ma', beats: 1 },
      { sargam: 'Pa', beats: 1 }, { sargam: 'Ma', beats: 2 },
    ],
  },
];
