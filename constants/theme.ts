export const Colors = {
  // Palette principale — Football : vert, noir, blanc
  green:        '#00E676',                    // vert néon primaire (pelouse éclairée)
  greenDark:    '#00A854',                    // vert foncé (gazon naturel)
  greenLight:   '#B9F6CA',                    // vert clair (menthe)
  greenDim:     'rgba(0,230,118,0.12)',
  greenBorder:  'rgba(0,230,118,0.22)',
  cyan:         '#4FFFEF',                    // cyan néon (City Stade)
  cyanDim:      'rgba(79,255,239,0.10)',
  cyanBorder:   'rgba(79,255,239,0.22)',
  white:        '#FFFFFF',
  whiteDim:     'rgba(255,255,255,0.08)',
  // Alias pour compatibilité → tout ramené aux verts/blancs
  red:          '#00A854',                    // urgent → vert foncé
  redDim:       'rgba(0,168,84,0.15)',
  yellow:       '#B9F6CA',                    // étoiles/ranks → vert clair
  yellowDim:    'rgba(185,246,202,0.15)',
  blue:         '#E8F5E8',                    // type eleven → blanc cassé
  blueDim:      'rgba(232,245,232,0.1)',
  // Fonds
  bg:           '#080D08',
  bg2:          '#0F160F',
  bg3:          '#172017',
  card:         '#131913',
  text:         '#E8F5E8',
  textMuted:    '#5A7A5A',
  textDim:      '#3A5A3A',
  border:       'rgba(0,230,118,0.15)',
  borderSubtle: 'rgba(255,255,255,0.05)',
} as const;

export const Spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, '3xl': 32,
} as const;

export const Radius = {
  sm: 8, md: 12, lg: 16, xl: 20, full: 9999,
} as const;

export const Typography = {
  xs: 11, sm: 13, md: 15, lg: 17, xl: 20, '2xl': 24,
} as const;

export const MATCH_TYPES = {
  five: {
    label: 'Five', emoji: '⚡', iconName: 'flash',
    color: '#00E676', dimColor: 'rgba(0,230,118,0.12)',
    borderColor: 'rgba(0,230,118,0.22)', maxPlayers: 10,
  },
  city: {
    label: 'City Stade', emoji: '🏟️', iconName: 'business',
    color: '#4FFFEF', dimColor: 'rgba(79,255,239,0.10)',
    borderColor: 'rgba(79,255,239,0.22)', maxPlayers: 8,
  },
  eleven: {
    label: 'Foot à 11', emoji: '⚽', iconName: 'football',
    color: '#FFFFFF', dimColor: 'rgba(255,255,255,0.07)',
    borderColor: 'rgba(255,255,255,0.15)', maxPlayers: 22,
  },
} as const;

export type MatchType = keyof typeof MATCH_TYPES;

export const LEVELS = ['Tous niveaux', 'Débutant', 'Intermédiaire', 'Confirmé'] as const;
export type Level = typeof LEVELS[number];