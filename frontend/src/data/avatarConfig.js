// frontend/src/data/avatarConfig.js

export const AVATAR_TIERS = {
  1: {
    id: 'tier_1',
    tier: 1,
    name: 'Recruit Protocol',
    subtitle: 'Category 1 · Basic Cyber Operatives',
    cost: 200,
    badge: 'Recruit',
    tone: 'cyan',
    accentColor: '#00e5ff',
  },
  2: {
    id: 'tier_2',
    tier: 2,
    name: 'Vanguard Syndicate',
    subtitle: 'Category 2 · Tactical Arena Warriors',
    cost: 500,
    badge: 'Vanguard',
    tone: 'purple',
    accentColor: '#a855f7',
  },
  3: {
    id: 'tier_3',
    tier: 3,
    name: 'Apex Mythic',
    subtitle: 'Category 3 · Advanced & Ascended Entities',
    cost: 1000,
    badge: 'Apex Mythic',
    tone: 'gold',
    accentColor: '#f59e0b',
  },
};

export const FRAME_TIERS = {
  1: {
    id: 'tier_1',
    tier: 1,
    name: 'Neon Edge',
    subtitle: 'Category 1 · Basic Neon Halos',
    cost: 500,
    badge: 'Basic',
    tone: 'cyan',
    accentColor: '#00e5ff',
  },
  2: {
    id: 'tier_2',
    tier: 2,
    name: 'Quantum Surge',
    subtitle: 'Category 2 · Overclocked Plasma Halos',
    cost: 1000,
    badge: 'Intermediate',
    tone: 'purple',
    accentColor: '#a855f7',
  },
  3: {
    id: 'tier_3',
    tier: 3,
    name: 'Cosmic Singularity',
    subtitle: 'Category 3 · God-Tier Mythic Frames',
    cost: 2000,
    badge: 'Legendary',
    tone: 'gold',
    accentColor: '#f59e0b',
  },
};

export const AVATARS = [
  // ================= CATEGORY 1: 10 BASIC AVATARS (200 PTS) =================
  { id: 'avatar_1', name: 'Cyber Shades', category: 'Recruit Protocol', categoryTier: 1, cost: 200, url: '/avatars/avatar_1.png' },
  { id: 'avatar_2', name: 'Violet Neko', category: 'Recruit Protocol', categoryTier: 1, cost: 200, url: '/avatars/avatar_2.png' },
  { id: 'avatar_3', name: 'Flame Shinobi', category: 'Recruit Protocol', categoryTier: 1, cost: 200, url: '/avatars/avatar_3.png' },
  { id: 'avatar_4', name: 'Battlefield Commando', category: 'Recruit Protocol', categoryTier: 1, cost: 200, url: '/avatars/avatar_4.png' },
  { id: 'avatar_5', name: 'Neon Visor', category: 'Recruit Protocol', categoryTier: 1, cost: 200, url: '/avatars/avatar_5.png' },
  { id: 'avatar_6', name: 'Night Skyline', category: 'Recruit Protocol', categoryTier: 1, cost: 200, url: '/avatars/avatar_6.png' },
  { id: 'avatar_7', name: 'Crimson Striker', category: 'Recruit Protocol', categoryTier: 1, cost: 200, url: '/avatars/avatar_7.png' },
  { id: 'avatar_8', name: 'Toxic Hacker', category: 'Recruit Protocol', categoryTier: 1, cost: 200, url: '/avatars/avatar_8.png' },
  { id: 'avatar_9', name: 'Blue Pixelist', category: 'Recruit Protocol', categoryTier: 1, cost: 200, url: '/avatars/avatar_9.png' },
  { id: 'avatar_10', name: 'Purple Streamer', category: 'Recruit Protocol', categoryTier: 1, cost: 200, url: '/avatars/avatar_10.png' },

  // ================= CATEGORY 2: 10 INTERMEDIATE AVATARS (500 PTS) =================
  { id: 'avatar_11', name: 'Cobalt Scout', category: 'Vanguard Syndicate', categoryTier: 2, cost: 500, url: '/avatars/avatar_11.png' },
  { id: 'avatar_12', name: 'Frost Mask Infiltrator', category: 'Vanguard Syndicate', categoryTier: 2, cost: 500, url: '/avatars/avatar_12.png' },
  { id: 'avatar_13', name: 'Kitty Headset', category: 'Vanguard Syndicate', categoryTier: 2, cost: 500, url: '/avatars/avatar_13.png' },
  { id: 'avatar_14', name: 'Sunset Palms', category: 'Vanguard Syndicate', categoryTier: 2, cost: 500, url: '/avatars/avatar_14.png' },
  { id: 'avatar_15', name: 'Midnight Operative', category: 'Vanguard Syndicate', categoryTier: 2, cost: 500, url: '/avatars/avatar_15.png' },
  { id: 'avatar_16', name: 'Beanie Coder', category: 'Vanguard Syndicate', categoryTier: 2, cost: 500, url: '/avatars/avatar_16.png' },
  { id: 'avatar_17', name: 'Crown Prince', category: 'Vanguard Syndicate', categoryTier: 2, cost: 500, url: '/avatars/avatar_17.png' },
  { id: 'avatar_18', name: 'Astro Voyager', category: 'Vanguard Syndicate', categoryTier: 2, cost: 500, url: '/avatars/avatar_18.png' },
  { id: 'avatar_19', name: 'Forest Ranger', category: 'Vanguard Syndicate', categoryTier: 2, cost: 500, url: '/avatars/avatar_19.png' },
  { id: 'avatar_20', name: 'Solar Shades', category: 'Vanguard Syndicate', categoryTier: 2, cost: 500, url: '/avatars/avatar_20.png' },

  // ================= CATEGORY 3: 15 ADVANCED & PREMIUM AVATARS (1000 PTS) =================
  { id: 'avatar_21', name: 'Cyber Aegis', category: 'Apex Mythic', categoryTier: 3, cost: 1000, url: '/avatars/avatar_21.png' },
  { id: 'avatar_22', name: 'Frost Breeze', category: 'Apex Mythic', categoryTier: 3, cost: 1000, url: '/avatars/avatar_22.png' },
  { id: 'avatar_23', name: 'Dark Thunder', category: 'Apex Mythic', categoryTier: 3, cost: 1000, url: '/avatars/avatar_23.png' },
  { id: 'avatar_24', name: 'Pixel Hero', category: 'Apex Mythic', categoryTier: 3, cost: 1000, url: '/avatars/avatar_24.png' },
  { id: 'avatar_25', name: 'Shadow Witch', category: 'Apex Mythic', categoryTier: 3, cost: 1000, url: '/avatars/avatar_25.png' },
  { id: 'avatar_26', name: 'Blaze Rebel', category: 'Apex Mythic', categoryTier: 3, cost: 1000, url: '/avatars/avatar_26.png' },
  { id: 'avatar_27', name: 'DJ Beat', category: 'Apex Mythic', categoryTier: 3, cost: 1000, url: '/avatars/avatar_27.png' },
  { id: 'avatar_28', name: '8-Bit Royalty', category: 'Apex Mythic', categoryTier: 3, cost: 1000, url: '/avatars/avatar_28.png' },
  { id: 'avatar_29', name: 'Silver Storm', category: 'Apex Mythic', categoryTier: 3, cost: 1000, url: '/avatars/avatar_29.png' },
  { id: 'avatar_30', name: 'Green Crosshair', category: 'Apex Mythic', categoryTier: 3, cost: 1000, url: '/avatars/avatar_30.png' },
  { id: 'avatar_31', name: 'Red Beats Gamer', category: 'Apex Mythic', categoryTier: 3, cost: 1000, url: '/avatars/avatar_31.png' },
  { id: 'avatar_32', name: 'Syntax Wizard', category: 'Apex Mythic', categoryTier: 3, cost: 1000, url: '/avatars/avatar_32.png' },
  { id: 'avatar_33', name: 'Wolf Spirit', category: 'Apex Mythic', categoryTier: 3, cost: 1000, url: '/avatars/avatar_33.png' },
  { id: 'avatar_34', name: 'Ruby Beret', category: 'Apex Mythic', categoryTier: 3, cost: 1000, url: '/avatars/avatar_34.png' },
  { id: 'avatar_35', name: 'Cyber City Sentinel', category: 'Apex Mythic', categoryTier: 3, cost: 1000, url: '/avatars/avatar_35.png' },
  
  // Bonus Mythic Variants
  { id: 'avatar_36', name: 'Cosmic Sorceress', category: 'Apex Mythic', categoryTier: 3, cost: 1000, url: '/avatars/avatar_36.png' },
  { id: 'avatar_37', name: 'Blue Frequency', category: 'Apex Mythic', categoryTier: 3, cost: 1000, url: '/avatars/avatar_37.png' },
  { id: 'avatar_38', name: 'Alpine Hiker', category: 'Apex Mythic', categoryTier: 3, cost: 1000, url: '/avatars/avatar_38.png' },
  { id: 'avatar_39', name: 'Synth Girl', category: 'Apex Mythic', categoryTier: 3, cost: 1000, url: '/avatars/avatar_39.png' },
  { id: 'avatar_40', name: 'White Fang Warrior', category: 'Apex Mythic', categoryTier: 3, cost: 1000, url: '/avatars/avatar_40.png' },
];

export const FRAMES = [
  // ================= CATEGORY 1: 5 BASIC FRAMES (500 PTS) =================
  { id: 'frame_1', name: 'Cyber Arcade', category: 'Neon Edge', categoryTier: 1, cost: 500, glowColor: '#00e5ff', url: '/frames/frame_1.png' },
  { id: 'frame_2', name: 'Royal Amethyst', category: 'Neon Edge', categoryTier: 1, cost: 500, glowColor: '#a855f7', url: '/frames/frame_2.png' },
  { id: 'frame_3', name: 'Inferno Dragon', category: 'Neon Edge', categoryTier: 1, cost: 500, glowColor: '#ff5722', url: '/frames/frame_3.png' },
  { id: 'frame_4', name: 'Matrix Target', category: 'Neon Edge', categoryTier: 1, cost: 500, glowColor: '#10b981', url: '/frames/frame_4.png' },
  { id: 'frame_5', name: 'Frost Wolf', category: 'Neon Edge', categoryTier: 1, cost: 500, glowColor: '#38bdf8', url: '/frames/frame_5.png' },

  // ================= CATEGORY 2: 5 INTERMEDIATE FRAMES (1000 PTS) =================
  { id: 'frame_6', name: 'Crimson Arcade', category: 'Quantum Surge', categoryTier: 2, cost: 1000, glowColor: '#ef4444', url: '/frames/frame_6.png' },
  { id: 'frame_7', name: 'Cosmic Void', category: 'Quantum Surge', categoryTier: 2, cost: 1000, glowColor: '#c084fc', url: '/frames/frame_7.png' },
  { id: 'frame_8', name: 'Emperor Wings', category: 'Quantum Surge', categoryTier: 2, cost: 1000, glowColor: '#facc15', url: '/frames/frame_8.png' },
  { id: 'frame_9', name: 'Cyber Glitch', category: 'Quantum Surge', categoryTier: 2, cost: 1000, glowColor: '#818cf8', url: '/frames/frame_9.png' },
  { id: 'frame_10', name: 'Retro Sunset', category: 'Quantum Surge', categoryTier: 2, cost: 1000, glowColor: '#f43f5e', url: '/frames/frame_10.png' },

  // ================= CATEGORY 3: 10 LEGENDARY / PREMIUM FRAMES (2000 PTS) =================
  { id: 'frame_11', name: 'Mecha V-Spec', category: 'Cosmic Singularity', categoryTier: 3, cost: 2000, glowColor: '#f97316', url: '/frames/frame_11.png' },
  { id: 'frame_12', name: 'Ocean Tsunami', category: 'Cosmic Singularity', categoryTier: 3, cost: 2000, glowColor: '#06b6d4', url: '/frames/frame_12.png' },
  { id: 'frame_13', name: 'Demon Eye', category: 'Cosmic Singularity', categoryTier: 3, cost: 2000, glowColor: '#dc2626', url: '/frames/frame_13.png' },
  { id: 'frame_14', name: 'Neon Neko Heart', category: 'Cosmic Singularity', categoryTier: 3, cost: 2000, glowColor: '#d946ef', url: '/frames/frame_14.png' },
  { id: 'frame_15', name: 'Verdant Laurel', category: 'Cosmic Singularity', categoryTier: 3, cost: 2000, glowColor: '#22c55e', url: '/frames/frame_15.png' },
  { id: 'frame_16', name: 'Lightning Tempest', category: 'Cosmic Singularity', categoryTier: 3, cost: 2000, glowColor: '#a855f7', url: '/frames/frame_16.png' },
  { id: 'frame_17', name: 'Samurai Katana', category: 'Cosmic Singularity', categoryTier: 3, cost: 2000, glowColor: '#e11d48', url: '/frames/frame_17.png' },
  { id: 'frame_18', name: 'Galactic Headset', category: 'Cosmic Singularity', categoryTier: 3, cost: 2000, glowColor: '#0284c7', url: '/frames/frame_18.png' },
  { id: 'frame_19', name: 'Solar Apex', category: 'Cosmic Singularity', categoryTier: 3, cost: 2000, glowColor: '#ea580c', url: '/frames/frame_19.png' },
  { id: 'frame_20', name: 'Valkyrie Diamond', category: 'Cosmic Singularity', categoryTier: 3, cost: 2000, glowColor: '#60a5fa', url: '/frames/frame_20.png' },
];

export function getFrameById(frameId) {
  if (!frameId || frameId === 'none') return null;
  return FRAMES.find((f) => f.id === frameId || f.url === frameId) || null;
}

export function getAvatarById(avatarId) {
  if (!avatarId) return null;
  return AVATARS.find((a) => a.id === avatarId || a.url === avatarId) || null;
}
