export const ROLES = [
  { id: "drummer",    label: "DRUMMER",    color: "#bb0000" },
  { id: "bass",       label: "BASS",       color: "#0044bb" },
  { id: "guitar",     label: "GUITAR",     color: "#006600" },
  { id: "keys",       label: "KEYS",       color: "#5500aa" },
  { id: "trumpet",    label: "TRUMPET",    color: "#aa5500" },
  { id: "sax",        label: "SAX",        color: "#cc4400" },
  { id: "trombone",   label: "TROMBONE",   color: "#774400" },
  { id: "violin",     label: "VIOLIN",     color: "#005566" },
  { id: "cello",      label: "CELLO",      color: "#334488" },
  { id: "flute",      label: "FLUTE",      color: "#005588" },
  { id: "vocals",     label: "VOCALS",     color: "#880055" },
  { id: "organ",      label: "ORGAN",      color: "#440088" },
  { id: "synth",      label: "SYNTH",      color: "#006644" },
  { id: "marimba",    label: "MARIMBA",    color: "#557700" },
  { id: "harp",       label: "HARP",       color: "#886600" },
  { id: "percussion", label: "PERC",       color: "#883300" },
  { id: "banjo",      label: "BANJO",      color: "#776600" },
  { id: "accordion",  label: "ACCORDION",  color: "#993300" },
  { id: "ukulele",    label: "UKULELE",    color: "#336600" },
  { id: "harmonica",  label: "HARMONICA",  color: "#004488" },
];

export const STYLES = ["SWING", "BEBOP", "FUNK", "LATIN", "BLUES", "FREE"];

export const QUICK_VIBES = [
  "take me to the beach",
  "late night jazz bar",
  "something funky",
  "sunday morning",
  "dark and moody",
  "make it swing",
  "upbeat and happy",
  "smooth and slow",
];

// MPC design tokens
export const T = {
  body:       "#e8e4dc",
  surface:    "#ede9e1",
  panel:      "#dedad2",
  panelDeep:  "#d0ccc4",
  border:     "#b4b0a8",
  borderDark: "#888480",
  shadow:     "rgba(0,0,0,0.22)",
  text:       "#1a1814",
  textMid:    "#5a5650",
  textLight:  "#9a9690",
  accent:     "#cc0000",
  accentDark: "#880000",
  green:      "#116611",
  greenDark:  "#0a440a",
  lcd:        "#b8cc88",
  lcdDark:    "#8aa060",
  lcdText:    "#1e2e08",
  padFace:    "#dedad0",
  padSide:    "#b8b4ac",
  padBorder:  "#a8a49c",
  white:      "#f4f0e8",
};

// Yamaha console tokens
export const Y = {
  body:        "#3a3c3e",
  bodyLight:   "#454749",
  rail:        "#2e3032",
  railLight:   "#383a3c",
  labelTape:   "#d8d4c8",
  labelText:   "#1a1a1a",
  faderTrack:  "#1e2022",
  tickMark:    "#6a6c6e",
  vuGreen:     "#22cc44",
  vuYellow:    "#ddcc00",
  vuRed:       "#ee2200",
  vuOff:       "#1a2018",
  muteRed:     "#dd1111",
  text:        "#c8c4bc",
  textDim:     "#686a6c",
  border:      "#28292b",
  sectionLine: "#222426",
};

export const initPads = Array.from({ length: 16 }, (_, i) => ({
  id:        String(i),
  role:      null,
  tags:      [],
  samples:   [],
  direction: "",
  steps:     new Array(16).fill(0),
}));

export const initChannels = Object.fromEntries(
  initPads.map(p => [p.id, { vol: 0.75, hi: 0, mid: 0, lo: 0, muted: false }])
);

export const initPan = Object.fromEntries(
  initPads.map(p => [p.id, 0.5])
);
