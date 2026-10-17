// Google Fonts Noto Emoji Animation CDN
// Base URLs: https://fonts.gstatic.com/s/e/notoemoji/latest/{codepoint}/512.webp
// Fallback:  https://fonts.gstatic.com/s/e/notoemoji/latest/{codepoint}/512.gif

export const BATTLE_EMOTE_CATEGORIES = [
  { id: "all", label: "All Emotes" },
  { id: "taunt", label: "Tease & Taunt" },
  { id: "hype", label: "Hype & Flex" },
  { id: "reaction", label: "Reactions" },
];

export const BATTLE_EMOTES = [
  // --- Tease & Taunt ---
  {
    id: "smirk",
    name: "Smirk",
    teaseText: "Too Easy! 😏",
    codepoint: "1f60f",
    category: "taunt",
    fallbackEmoji: "😏",
  },
  {
    id: "lmao",
    name: "ROFL",
    teaseText: "LMAO! 🤣",
    codepoint: "1f923",
    category: "taunt",
    fallbackEmoji: "🤣",
  },
  {
    id: "clown",
    name: "Clown",
    teaseText: "Clowned! 🤡",
    codepoint: "1f921",
    category: "taunt",
    fallbackEmoji: "🤡",
  },
  {
    id: "yawn",
    name: "Yawn",
    teaseText: "Too Slow... 🥱",
    codepoint: "1f971",
    category: "taunt",
    fallbackEmoji: "🥱",
  },
  {
    id: "shh",
    name: "Quiet",
    teaseText: "Zip It! 🤫",
    codepoint: "1f92b",
    category: "taunt",
    fallbackEmoji: "🤫",
  },
  {
    id: "wink_tongue",
    name: "Gotcha",
    teaseText: "Gotcha! 😜",
    codepoint: "1f61c",
    category: "taunt",
    fallbackEmoji: "😜",
  },
  {
    id: "monocle",
    name: "Inspect",
    teaseText: "Reading Your Code 🧐",
    codepoint: "1f9d0",
    category: "taunt",
    fallbackEmoji: "🧐",
  },
  {
    id: "devil",
    name: "Mischief",
    teaseText: "Outplayed! 😈",
    codepoint: "1f608",
    category: "taunt",
    fallbackEmoji: "😈",
  },

  // --- Hype & Flex ---
  {
    id: "fire",
    name: "Fire",
    teaseText: "Let Him Cook! 🔥",
    codepoint: "1f525",
    category: "hype",
    fallbackEmoji: "🔥",
  },
  {
    id: "flex",
    name: "Flex",
    teaseText: "Built Different! 💪",
    codepoint: "1f4aa",
    category: "hype",
    fallbackEmoji: "💪",
  },
  {
    id: "sunglasses",
    name: "Cool",
    teaseText: "Calculated. 😎",
    codepoint: "1f60e",
    category: "hype",
    fallbackEmoji: "😎",
  },
  {
    id: "hundred",
    name: "100",
    teaseText: "Flawless! 💯",
    codepoint: "1f4af",
    category: "hype",
    fallbackEmoji: "💯",
  },
  {
    id: "rage",
    name: "Tryhard",
    teaseText: "Tryhard Mode! 😤",
    codepoint: "1f624",
    category: "hype",
    fallbackEmoji: "😤",
  },
  {
    id: "cold",
    name: "Ice Cold",
    teaseText: "Ice In Veins! 🥶",
    codepoint: "1f976",
    category: "hype",
    fallbackEmoji: "🥶",
  },
  {
    id: "robot",
    name: "AI Speed",
    teaseText: "Beep Boop O(1)! 🤖",
    codepoint: "1f916",
    category: "hype",
    fallbackEmoji: "🤖",
  },

  // --- Reactions ---
  {
    id: "skull",
    name: "RIP",
    teaseText: "RIP / Dead 💀",
    codepoint: "1f480",
    category: "reaction",
    fallbackEmoji: "💀",
  },
  {
    id: "cry",
    name: "Sob",
    teaseText: "Cry About It 😭",
    codepoint: "1f62d",
    category: "reaction",
    fallbackEmoji: "😭",
  },
  {
    id: "mindblown",
    name: "Mind Blown",
    teaseText: "Mind Blown! 🤯",
    codepoint: "1f92f",
    category: "reaction",
    fallbackEmoji: "🤯",
  },
  {
    id: "melting",
    name: "Melting",
    teaseText: "Code Melted... 🫠",
    codepoint: "1fae0",
    category: "reaction",
    fallbackEmoji: "🫠",
  },
  {
    id: "poop",
    name: "Spaghetti",
    teaseText: "Spaghetti Code! 💩",
    codepoint: "1f4a9",
    category: "reaction",
    fallbackEmoji: "💩",
  },
  {
    id: "popcorn",
    name: "Popcorn",
    teaseText: "Here For The Drama 🍿",
    codepoint: "1f37f",
    category: "reaction",
    fallbackEmoji: "🍿",
  },
  {
    id: "salute",
    name: "Salute",
    teaseText: "Respect / GG 🫡",
    codepoint: "1fae1",
    category: "reaction",
    fallbackEmoji: "🫡",
  },
  {
    id: "thinking",
    name: "Thinking",
    teaseText: "Is It O(N^2)? 🤔",
    codepoint: "1f914",
    category: "reaction",
    fallbackEmoji: "🤔",
  },
  {
    id: "eyes",
    name: "Watching",
    teaseText: "I See What You Did 👀",
    codepoint: "1f440",
    category: "reaction",
    fallbackEmoji: "👀",
  },
];

export const getEmoteUrl = (codepoint, format = "webp") => {
  return `https://fonts.gstatic.com/s/e/notoemoji/latest/${codepoint}/512.${format}`;
};

export const QUICK_TAUNT_EMOTES = [
  BATTLE_EMOTES[0], // Smirk 😏
  BATTLE_EMOTES[1], // LMAO 🤣
  BATTLE_EMOTES[2], // Clown 🤡
  BATTLE_EMOTES[8], // Fire 🔥
  BATTLE_EMOTES[15], // Skull 💀
];

// Synthesize pleasant pop/bubble sound for emote arrival
export const playEmoteChime = (type = "pop") => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const now = ctx.currentTime;
    if (type === "taunt") {
      // Bouncy taunt chirp
      osc.type = "triangle";
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.16);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else {
      // Pleasant bubbly pop
      osc.type = "sine";
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(960, now + 0.07);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.18);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
  } catch {
    // Audio contexts can be blocked or muted
  }
};
