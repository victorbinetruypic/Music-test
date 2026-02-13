// Genre-to-audio-feature estimation map
// Each genre maps to estimated ranges for key audio features.
// Ranges represent typical [min, max] for that genre.

export interface GenreFeatureEstimate {
  energy: [number, number]
  tempo: [number, number]
  valence: [number, number]
  danceability: [number, number]
  loudness: [number, number]
}

export const DEFAULT_GENRE_ESTIMATE: GenreFeatureEstimate = {
  energy: [0.4, 0.6],
  tempo: [110, 130],
  valence: [0.4, 0.6],
  danceability: [0.4, 0.6],
  loudness: [-10, -6],
}

// ~300 Spotify micro-genres mapped to feature ranges
export const GENRE_FEATURE_MAP: Record<string, GenreFeatureEstimate> = {
  // ── Electronic / Dance ──
  'edm': { energy: [0.7, 0.95], tempo: [126, 132], valence: [0.5, 0.8], danceability: [0.6, 0.85], loudness: [-7, -3] },
  'house': { energy: [0.65, 0.85], tempo: [120, 130], valence: [0.5, 0.75], danceability: [0.65, 0.85], loudness: [-8, -4] },
  'deep house': { energy: [0.5, 0.7], tempo: [118, 126], valence: [0.4, 0.65], danceability: [0.6, 0.8], loudness: [-10, -6] },
  'tech house': { energy: [0.6, 0.8], tempo: [122, 130], valence: [0.4, 0.6], danceability: [0.65, 0.85], loudness: [-8, -4] },
  'progressive house': { energy: [0.55, 0.8], tempo: [124, 132], valence: [0.4, 0.7], danceability: [0.55, 0.75], loudness: [-9, -5] },
  'tropical house': { energy: [0.5, 0.7], tempo: [100, 120], valence: [0.6, 0.85], danceability: [0.6, 0.8], loudness: [-9, -5] },
  'electro house': { energy: [0.75, 0.95], tempo: [126, 132], valence: [0.5, 0.75], danceability: [0.6, 0.8], loudness: [-6, -3] },
  'future house': { energy: [0.65, 0.85], tempo: [124, 130], valence: [0.5, 0.75], danceability: [0.65, 0.85], loudness: [-7, -4] },
  'acid house': { energy: [0.6, 0.8], tempo: [120, 130], valence: [0.3, 0.55], danceability: [0.6, 0.8], loudness: [-8, -4] },
  'techno': { energy: [0.7, 0.9], tempo: [128, 140], valence: [0.2, 0.45], danceability: [0.6, 0.8], loudness: [-7, -3] },
  'minimal techno': { energy: [0.5, 0.7], tempo: [125, 135], valence: [0.2, 0.4], danceability: [0.6, 0.8], loudness: [-10, -6] },
  'detroit techno': { energy: [0.6, 0.85], tempo: [128, 140], valence: [0.25, 0.5], danceability: [0.6, 0.8], loudness: [-8, -4] },
  'industrial techno': { energy: [0.8, 0.95], tempo: [130, 145], valence: [0.1, 0.3], danceability: [0.5, 0.7], loudness: [-6, -2] },
  'trance': { energy: [0.7, 0.9], tempo: [130, 145], valence: [0.4, 0.7], danceability: [0.5, 0.7], loudness: [-7, -3] },
  'progressive trance': { energy: [0.65, 0.85], tempo: [130, 140], valence: [0.4, 0.65], danceability: [0.5, 0.7], loudness: [-8, -4] },
  'psytrance': { energy: [0.8, 0.95], tempo: [140, 150], valence: [0.3, 0.55], danceability: [0.5, 0.7], loudness: [-6, -3] },
  'uplifting trance': { energy: [0.75, 0.9], tempo: [136, 142], valence: [0.6, 0.85], danceability: [0.5, 0.7], loudness: [-7, -3] },
  'drum and bass': { energy: [0.8, 0.95], tempo: [170, 180], valence: [0.3, 0.6], danceability: [0.5, 0.7], loudness: [-6, -3] },
  'liquid drum and bass': { energy: [0.5, 0.7], tempo: [170, 178], valence: [0.4, 0.7], danceability: [0.5, 0.7], loudness: [-9, -5] },
  'jungle': { energy: [0.75, 0.9], tempo: [160, 175], valence: [0.3, 0.55], danceability: [0.5, 0.7], loudness: [-7, -3] },
  'dubstep': { energy: [0.75, 0.95], tempo: [138, 142], valence: [0.2, 0.45], danceability: [0.5, 0.7], loudness: [-6, -2] },
  'brostep': { energy: [0.85, 0.95], tempo: [140, 150], valence: [0.2, 0.4], danceability: [0.5, 0.65], loudness: [-5, -2] },
  'riddim': { energy: [0.8, 0.95], tempo: [140, 150], valence: [0.15, 0.35], danceability: [0.5, 0.7], loudness: [-5, -2] },
  'future bass': { energy: [0.6, 0.8], tempo: [130, 170], valence: [0.5, 0.8], danceability: [0.5, 0.7], loudness: [-8, -4] },
  'trap edm': { energy: [0.7, 0.9], tempo: [130, 160], valence: [0.3, 0.55], danceability: [0.55, 0.75], loudness: [-6, -3] },
  'hardstyle': { energy: [0.9, 1.0], tempo: [150, 160], valence: [0.3, 0.6], danceability: [0.5, 0.7], loudness: [-4, -1] },
  'hardcore': { energy: [0.9, 1.0], tempo: [160, 200], valence: [0.2, 0.5], danceability: [0.4, 0.6], loudness: [-4, -1] },
  'gabber': { energy: [0.9, 1.0], tempo: [160, 200], valence: [0.15, 0.35], danceability: [0.4, 0.6], loudness: [-3, -1] },
  'electronica': { energy: [0.4, 0.7], tempo: [100, 140], valence: [0.3, 0.6], danceability: [0.4, 0.65], loudness: [-12, -6] },
  'idm': { energy: [0.3, 0.6], tempo: [90, 160], valence: [0.2, 0.5], danceability: [0.3, 0.55], loudness: [-14, -7] },
  'glitch': { energy: [0.4, 0.7], tempo: [100, 150], valence: [0.2, 0.45], danceability: [0.3, 0.55], loudness: [-12, -6] },
  'breakbeat': { energy: [0.65, 0.85], tempo: [130, 145], valence: [0.3, 0.55], danceability: [0.55, 0.75], loudness: [-8, -4] },
  'uk garage': { energy: [0.6, 0.8], tempo: [130, 140], valence: [0.4, 0.65], danceability: [0.65, 0.85], loudness: [-8, -4] },
  'garage': { energy: [0.6, 0.8], tempo: [130, 140], valence: [0.4, 0.65], danceability: [0.65, 0.85], loudness: [-8, -4] },
  'bass music': { energy: [0.7, 0.9], tempo: [130, 160], valence: [0.25, 0.5], danceability: [0.55, 0.75], loudness: [-6, -3] },
  'eurodance': { energy: [0.7, 0.9], tempo: [130, 145], valence: [0.6, 0.85], danceability: [0.65, 0.85], loudness: [-7, -3] },
  'synthwave': { energy: [0.5, 0.75], tempo: [100, 130], valence: [0.35, 0.65], danceability: [0.5, 0.7], loudness: [-10, -5] },
  'retrowave': { energy: [0.5, 0.75], tempo: [100, 130], valence: [0.4, 0.7], danceability: [0.5, 0.7], loudness: [-10, -5] },
  'vaporwave': { energy: [0.2, 0.4], tempo: [80, 120], valence: [0.3, 0.6], danceability: [0.4, 0.6], loudness: [-14, -8] },
  'synthpop': { energy: [0.5, 0.75], tempo: [110, 135], valence: [0.45, 0.75], danceability: [0.55, 0.75], loudness: [-9, -5] },
  'electropop': { energy: [0.55, 0.8], tempo: [110, 135], valence: [0.5, 0.8], danceability: [0.6, 0.8], loudness: [-8, -4] },
  'dance pop': { energy: [0.65, 0.85], tempo: [115, 135], valence: [0.55, 0.85], danceability: [0.65, 0.85], loudness: [-7, -3] },
  'big room': { energy: [0.8, 0.95], tempo: [126, 132], valence: [0.5, 0.75], danceability: [0.55, 0.75], loudness: [-5, -2] },
  'complextro': { energy: [0.75, 0.9], tempo: [126, 132], valence: [0.4, 0.65], danceability: [0.55, 0.75], loudness: [-6, -3] },
  'moombahton': { energy: [0.65, 0.85], tempo: [108, 112], valence: [0.5, 0.75], danceability: [0.7, 0.9], loudness: [-7, -3] },
  'dancehall': { energy: [0.65, 0.85], tempo: [95, 110], valence: [0.55, 0.8], danceability: [0.7, 0.9], loudness: [-7, -3] },

  // ── Ambient / Chill ──
  'ambient': { energy: [0.05, 0.25], tempo: [60, 100], valence: [0.15, 0.4], danceability: [0.1, 0.3], loudness: [-25, -12] },
  'dark ambient': { energy: [0.05, 0.2], tempo: [60, 90], valence: [0.05, 0.2], danceability: [0.05, 0.2], loudness: [-30, -15] },
  'drone': { energy: [0.05, 0.2], tempo: [60, 80], valence: [0.1, 0.25], danceability: [0.05, 0.15], loudness: [-25, -12] },
  'new age': { energy: [0.1, 0.3], tempo: [70, 110], valence: [0.3, 0.6], danceability: [0.15, 0.35], loudness: [-20, -10] },
  'chillout': { energy: [0.2, 0.45], tempo: [80, 115], valence: [0.35, 0.65], danceability: [0.35, 0.55], loudness: [-14, -8] },
  'downtempo': { energy: [0.2, 0.45], tempo: [80, 110], valence: [0.3, 0.55], danceability: [0.35, 0.55], loudness: [-14, -8] },
  'trip hop': { energy: [0.3, 0.5], tempo: [80, 110], valence: [0.2, 0.45], danceability: [0.4, 0.6], loudness: [-12, -7] },
  'lofi hip hop': { energy: [0.2, 0.4], tempo: [75, 95], valence: [0.3, 0.55], danceability: [0.45, 0.65], loudness: [-14, -9] },
  'lo-fi beats': { energy: [0.2, 0.4], tempo: [75, 95], valence: [0.3, 0.55], danceability: [0.45, 0.65], loudness: [-14, -9] },
  'chillhop': { energy: [0.25, 0.45], tempo: [80, 100], valence: [0.35, 0.6], danceability: [0.5, 0.7], loudness: [-13, -8] },
  'chillwave': { energy: [0.25, 0.45], tempo: [90, 120], valence: [0.35, 0.6], danceability: [0.4, 0.6], loudness: [-14, -8] },
  'dream pop': { energy: [0.25, 0.5], tempo: [90, 125], valence: [0.3, 0.6], danceability: [0.35, 0.55], loudness: [-12, -7] },
  'shoegaze': { energy: [0.4, 0.65], tempo: [90, 130], valence: [0.2, 0.45], danceability: [0.3, 0.5], loudness: [-10, -5] },
  'ethereal': { energy: [0.2, 0.4], tempo: [80, 120], valence: [0.25, 0.5], danceability: [0.25, 0.45], loudness: [-16, -9] },

  // ── Rock ──
  'rock': { energy: [0.6, 0.85], tempo: [110, 140], valence: [0.35, 0.65], danceability: [0.35, 0.55], loudness: [-8, -4] },
  'classic rock': { energy: [0.55, 0.8], tempo: [105, 140], valence: [0.4, 0.7], danceability: [0.35, 0.55], loudness: [-9, -5] },
  'hard rock': { energy: [0.7, 0.9], tempo: [115, 145], valence: [0.35, 0.6], danceability: [0.3, 0.5], loudness: [-7, -3] },
  'soft rock': { energy: [0.35, 0.55], tempo: [90, 125], valence: [0.45, 0.7], danceability: [0.4, 0.6], loudness: [-12, -7] },
  'arena rock': { energy: [0.7, 0.9], tempo: [110, 140], valence: [0.5, 0.75], danceability: [0.35, 0.55], loudness: [-7, -3] },
  'album rock': { energy: [0.55, 0.8], tempo: [100, 140], valence: [0.35, 0.65], danceability: [0.3, 0.5], loudness: [-9, -5] },
  'alternative rock': { energy: [0.55, 0.8], tempo: [105, 140], valence: [0.3, 0.6], danceability: [0.35, 0.55], loudness: [-9, -5] },
  'indie rock': { energy: [0.45, 0.7], tempo: [105, 140], valence: [0.35, 0.65], danceability: [0.35, 0.55], loudness: [-10, -6] },
  'art rock': { energy: [0.4, 0.7], tempo: [90, 140], valence: [0.25, 0.55], danceability: [0.3, 0.5], loudness: [-12, -6] },
  'progressive rock': { energy: [0.45, 0.75], tempo: [90, 140], valence: [0.3, 0.55], danceability: [0.25, 0.45], loudness: [-10, -5] },
  'psychedelic rock': { energy: [0.45, 0.75], tempo: [95, 135], valence: [0.35, 0.6], danceability: [0.3, 0.55], loudness: [-10, -5] },
  'garage rock': { energy: [0.65, 0.85], tempo: [120, 150], valence: [0.35, 0.6], danceability: [0.4, 0.6], loudness: [-7, -3] },
  'post-rock': { energy: [0.35, 0.7], tempo: [90, 140], valence: [0.15, 0.4], danceability: [0.2, 0.4], loudness: [-14, -6] },
  'post-punk': { energy: [0.5, 0.75], tempo: [110, 145], valence: [0.2, 0.45], danceability: [0.4, 0.6], loudness: [-10, -5] },
  'punk rock': { energy: [0.8, 0.95], tempo: [150, 190], valence: [0.4, 0.65], danceability: [0.35, 0.55], loudness: [-6, -2] },
  'punk': { energy: [0.8, 0.95], tempo: [150, 190], valence: [0.4, 0.65], danceability: [0.35, 0.55], loudness: [-6, -2] },
  'pop punk': { energy: [0.7, 0.9], tempo: [140, 180], valence: [0.5, 0.75], danceability: [0.4, 0.6], loudness: [-6, -3] },
  'skate punk': { energy: [0.8, 0.95], tempo: [160, 200], valence: [0.45, 0.7], danceability: [0.35, 0.55], loudness: [-5, -2] },
  'emo': { energy: [0.55, 0.8], tempo: [120, 160], valence: [0.2, 0.45], danceability: [0.35, 0.55], loudness: [-8, -4] },
  'screamo': { energy: [0.8, 0.95], tempo: [140, 180], valence: [0.1, 0.3], danceability: [0.25, 0.45], loudness: [-5, -2] },
  'grunge': { energy: [0.6, 0.85], tempo: [110, 145], valence: [0.2, 0.4], danceability: [0.3, 0.5], loudness: [-8, -4] },
  'stoner rock': { energy: [0.55, 0.8], tempo: [90, 130], valence: [0.25, 0.5], danceability: [0.3, 0.5], loudness: [-8, -4] },
  'blues rock': { energy: [0.5, 0.75], tempo: [100, 135], valence: [0.35, 0.6], danceability: [0.35, 0.55], loudness: [-9, -5] },
  'southern rock': { energy: [0.6, 0.8], tempo: [105, 140], valence: [0.45, 0.7], danceability: [0.4, 0.6], loudness: [-8, -4] },
  'surf rock': { energy: [0.55, 0.75], tempo: [130, 165], valence: [0.5, 0.75], danceability: [0.45, 0.65], loudness: [-9, -5] },
  'math rock': { energy: [0.5, 0.75], tempo: [120, 160], valence: [0.3, 0.55], danceability: [0.25, 0.45], loudness: [-10, -5] },
  'noise rock': { energy: [0.7, 0.9], tempo: [100, 150], valence: [0.1, 0.3], danceability: [0.2, 0.4], loudness: [-6, -2] },
  'new wave': { energy: [0.5, 0.75], tempo: [110, 140], valence: [0.4, 0.7], danceability: [0.5, 0.7], loudness: [-10, -5] },
  'britpop': { energy: [0.55, 0.75], tempo: [110, 140], valence: [0.45, 0.7], danceability: [0.45, 0.65], loudness: [-9, -5] },
  'madchester': { energy: [0.55, 0.75], tempo: [110, 130], valence: [0.4, 0.65], danceability: [0.5, 0.7], loudness: [-9, -5] },

  // ── Metal ──
  'metal': { energy: [0.8, 0.95], tempo: [120, 160], valence: [0.15, 0.4], danceability: [0.25, 0.45], loudness: [-5, -2] },
  'heavy metal': { energy: [0.75, 0.9], tempo: [120, 155], valence: [0.2, 0.45], danceability: [0.25, 0.45], loudness: [-6, -3] },
  'thrash metal': { energy: [0.85, 0.95], tempo: [150, 200], valence: [0.15, 0.35], danceability: [0.25, 0.4], loudness: [-5, -2] },
  'death metal': { energy: [0.85, 0.95], tempo: [140, 200], valence: [0.05, 0.2], danceability: [0.2, 0.35], loudness: [-4, -1] },
  'black metal': { energy: [0.8, 0.95], tempo: [140, 200], valence: [0.05, 0.15], danceability: [0.15, 0.3], loudness: [-5, -2] },
  'doom metal': { energy: [0.5, 0.75], tempo: [60, 90], valence: [0.05, 0.2], danceability: [0.15, 0.3], loudness: [-8, -3] },
  'sludge metal': { energy: [0.65, 0.85], tempo: [70, 110], valence: [0.05, 0.2], danceability: [0.15, 0.3], loudness: [-6, -2] },
  'power metal': { energy: [0.8, 0.95], tempo: [140, 180], valence: [0.4, 0.7], danceability: [0.3, 0.5], loudness: [-5, -2] },
  'symphonic metal': { energy: [0.7, 0.9], tempo: [120, 160], valence: [0.3, 0.6], danceability: [0.25, 0.45], loudness: [-6, -3] },
  'progressive metal': { energy: [0.65, 0.85], tempo: [110, 160], valence: [0.2, 0.45], danceability: [0.2, 0.4], loudness: [-7, -3] },
  'metalcore': { energy: [0.85, 0.95], tempo: [130, 170], valence: [0.15, 0.35], danceability: [0.25, 0.45], loudness: [-5, -2] },
  'deathcore': { energy: [0.85, 0.95], tempo: [130, 170], valence: [0.05, 0.2], danceability: [0.2, 0.35], loudness: [-4, -1] },
  'nu metal': { energy: [0.7, 0.9], tempo: [110, 145], valence: [0.2, 0.4], danceability: [0.35, 0.55], loudness: [-6, -3] },
  'groove metal': { energy: [0.75, 0.9], tempo: [110, 140], valence: [0.2, 0.4], danceability: [0.3, 0.5], loudness: [-6, -3] },
  'folk metal': { energy: [0.65, 0.85], tempo: [120, 160], valence: [0.35, 0.65], danceability: [0.3, 0.5], loudness: [-7, -3] },
  'melodic death metal': { energy: [0.8, 0.9], tempo: [140, 180], valence: [0.15, 0.35], danceability: [0.2, 0.4], loudness: [-5, -2] },
  'djent': { energy: [0.7, 0.9], tempo: [110, 150], valence: [0.15, 0.35], danceability: [0.25, 0.45], loudness: [-6, -3] },
  'post-metal': { energy: [0.5, 0.8], tempo: [80, 130], valence: [0.1, 0.3], danceability: [0.15, 0.35], loudness: [-10, -4] },

  // ── Hip-Hop / Rap ──
  'hip hop': { energy: [0.55, 0.8], tempo: [80, 115], valence: [0.35, 0.65], danceability: [0.6, 0.85], loudness: [-8, -4] },
  'rap': { energy: [0.55, 0.8], tempo: [80, 115], valence: [0.35, 0.65], danceability: [0.6, 0.85], loudness: [-8, -4] },
  'trap': { energy: [0.55, 0.8], tempo: [130, 170], valence: [0.25, 0.5], danceability: [0.6, 0.8], loudness: [-7, -3] },
  'southern hip hop': { energy: [0.55, 0.8], tempo: [80, 120], valence: [0.35, 0.6], danceability: [0.6, 0.8], loudness: [-7, -4] },
  'gangsta rap': { energy: [0.6, 0.8], tempo: [85, 110], valence: [0.2, 0.45], danceability: [0.6, 0.8], loudness: [-7, -3] },
  'conscious hip hop': { energy: [0.4, 0.65], tempo: [80, 110], valence: [0.3, 0.55], danceability: [0.5, 0.7], loudness: [-10, -5] },
  'underground hip hop': { energy: [0.45, 0.7], tempo: [80, 110], valence: [0.25, 0.5], danceability: [0.55, 0.75], loudness: [-10, -5] },
  'boom bap': { energy: [0.5, 0.7], tempo: [85, 100], valence: [0.3, 0.55], danceability: [0.6, 0.8], loudness: [-9, -5] },
  'east coast hip hop': { energy: [0.5, 0.75], tempo: [85, 105], valence: [0.3, 0.55], danceability: [0.55, 0.75], loudness: [-9, -5] },
  'west coast hip hop': { energy: [0.5, 0.75], tempo: [90, 110], valence: [0.4, 0.65], danceability: [0.6, 0.8], loudness: [-8, -4] },
  'atlanta hip hop': { energy: [0.6, 0.8], tempo: [130, 165], valence: [0.35, 0.6], danceability: [0.65, 0.85], loudness: [-7, -3] },
  'chicago rap': { energy: [0.55, 0.75], tempo: [130, 160], valence: [0.2, 0.45], danceability: [0.55, 0.75], loudness: [-7, -3] },
  'drill': { energy: [0.6, 0.8], tempo: [138, 145], valence: [0.15, 0.35], danceability: [0.55, 0.75], loudness: [-7, -3] },
  'uk drill': { energy: [0.6, 0.8], tempo: [140, 145], valence: [0.15, 0.35], danceability: [0.55, 0.75], loudness: [-7, -3] },
  'grime': { energy: [0.65, 0.85], tempo: [140, 142], valence: [0.2, 0.45], danceability: [0.55, 0.75], loudness: [-7, -3] },
  'crunk': { energy: [0.75, 0.9], tempo: [80, 100], valence: [0.4, 0.65], danceability: [0.7, 0.85], loudness: [-6, -3] },
  'cloud rap': { energy: [0.3, 0.55], tempo: [60, 90], valence: [0.2, 0.45], danceability: [0.45, 0.65], loudness: [-12, -7] },
  'emo rap': { energy: [0.4, 0.65], tempo: [80, 120], valence: [0.15, 0.35], danceability: [0.5, 0.7], loudness: [-9, -5] },
  'melodic rap': { energy: [0.5, 0.7], tempo: [80, 140], valence: [0.3, 0.55], danceability: [0.55, 0.75], loudness: [-8, -4] },
  'phonk': { energy: [0.6, 0.8], tempo: [130, 165], valence: [0.2, 0.4], danceability: [0.55, 0.75], loudness: [-7, -3] },
  'plugg': { energy: [0.45, 0.65], tempo: [130, 160], valence: [0.25, 0.5], danceability: [0.55, 0.75], loudness: [-9, -5] },

  // ── Pop ──
  'pop': { energy: [0.5, 0.75], tempo: [100, 130], valence: [0.5, 0.8], danceability: [0.55, 0.8], loudness: [-8, -4] },
  'indie pop': { energy: [0.4, 0.65], tempo: [100, 130], valence: [0.45, 0.75], danceability: [0.45, 0.7], loudness: [-10, -6] },
  'art pop': { energy: [0.4, 0.7], tempo: [95, 135], valence: [0.35, 0.65], danceability: [0.45, 0.7], loudness: [-10, -5] },
  'chamber pop': { energy: [0.3, 0.55], tempo: [85, 125], valence: [0.35, 0.6], danceability: [0.35, 0.55], loudness: [-12, -7] },
  'baroque pop': { energy: [0.35, 0.6], tempo: [90, 125], valence: [0.4, 0.65], danceability: [0.35, 0.55], loudness: [-12, -7] },
  'power pop': { energy: [0.6, 0.8], tempo: [120, 150], valence: [0.55, 0.8], danceability: [0.45, 0.65], loudness: [-8, -4] },
  'teen pop': { energy: [0.6, 0.8], tempo: [105, 130], valence: [0.6, 0.85], danceability: [0.6, 0.8], loudness: [-7, -4] },
  'k-pop': { energy: [0.65, 0.85], tempo: [110, 140], valence: [0.5, 0.8], danceability: [0.65, 0.85], loudness: [-7, -3] },
  'j-pop': { energy: [0.55, 0.75], tempo: [110, 140], valence: [0.5, 0.8], danceability: [0.55, 0.75], loudness: [-8, -4] },
  'c-pop': { energy: [0.45, 0.7], tempo: [100, 130], valence: [0.4, 0.7], danceability: [0.5, 0.7], loudness: [-9, -5] },
  'europop': { energy: [0.65, 0.85], tempo: [115, 135], valence: [0.6, 0.85], danceability: [0.6, 0.8], loudness: [-7, -4] },
  'latin pop': { energy: [0.55, 0.8], tempo: [95, 130], valence: [0.55, 0.8], danceability: [0.6, 0.8], loudness: [-8, -4] },
  'bedroom pop': { energy: [0.25, 0.45], tempo: [85, 120], valence: [0.4, 0.65], danceability: [0.45, 0.65], loudness: [-14, -8] },
  'hyperpop': { energy: [0.7, 0.9], tempo: [120, 170], valence: [0.4, 0.7], danceability: [0.5, 0.7], loudness: [-6, -2] },
  'bubblegum pop': { energy: [0.6, 0.8], tempo: [110, 130], valence: [0.7, 0.9], danceability: [0.6, 0.8], loudness: [-7, -4] },

  // ── R&B / Soul ──
  'r&b': { energy: [0.4, 0.65], tempo: [80, 115], valence: [0.35, 0.65], danceability: [0.55, 0.8], loudness: [-10, -5] },
  'rnb': { energy: [0.4, 0.65], tempo: [80, 115], valence: [0.35, 0.65], danceability: [0.55, 0.8], loudness: [-10, -5] },
  'contemporary r&b': { energy: [0.4, 0.65], tempo: [80, 115], valence: [0.35, 0.65], danceability: [0.55, 0.8], loudness: [-10, -5] },
  'neo soul': { energy: [0.35, 0.55], tempo: [80, 110], valence: [0.4, 0.65], danceability: [0.5, 0.7], loudness: [-12, -7] },
  'soul': { energy: [0.4, 0.65], tempo: [85, 120], valence: [0.45, 0.75], danceability: [0.5, 0.7], loudness: [-10, -5] },
  'motown': { energy: [0.5, 0.7], tempo: [100, 130], valence: [0.6, 0.85], danceability: [0.55, 0.75], loudness: [-10, -5] },
  'funk': { energy: [0.6, 0.8], tempo: [95, 125], valence: [0.55, 0.8], danceability: [0.7, 0.9], loudness: [-9, -4] },
  'g-funk': { energy: [0.5, 0.7], tempo: [90, 110], valence: [0.4, 0.65], danceability: [0.65, 0.8], loudness: [-9, -5] },
  'disco': { energy: [0.65, 0.85], tempo: [115, 130], valence: [0.6, 0.85], danceability: [0.7, 0.9], loudness: [-8, -4] },
  'nu disco': { energy: [0.6, 0.8], tempo: [115, 128], valence: [0.55, 0.8], danceability: [0.65, 0.85], loudness: [-8, -4] },
  'gospel': { energy: [0.5, 0.75], tempo: [90, 130], valence: [0.6, 0.85], danceability: [0.45, 0.65], loudness: [-10, -5] },
  'quiet storm': { energy: [0.2, 0.4], tempo: [70, 100], valence: [0.35, 0.6], danceability: [0.45, 0.65], loudness: [-14, -9] },
  'alternative r&b': { energy: [0.35, 0.6], tempo: [75, 115], valence: [0.25, 0.55], danceability: [0.5, 0.7], loudness: [-12, -6] },
  'urban contemporary': { energy: [0.45, 0.7], tempo: [85, 115], valence: [0.4, 0.65], danceability: [0.6, 0.8], loudness: [-9, -5] },

  // ── Jazz ──
  'jazz': { energy: [0.3, 0.55], tempo: [90, 160], valence: [0.35, 0.65], danceability: [0.35, 0.6], loudness: [-16, -8] },
  'smooth jazz': { energy: [0.2, 0.4], tempo: [80, 120], valence: [0.45, 0.7], danceability: [0.4, 0.6], loudness: [-16, -10] },
  'jazz fusion': { energy: [0.45, 0.7], tempo: [100, 160], valence: [0.35, 0.6], danceability: [0.35, 0.55], loudness: [-12, -6] },
  'bebop': { energy: [0.45, 0.7], tempo: [140, 240], valence: [0.4, 0.65], danceability: [0.3, 0.5], loudness: [-14, -8] },
  'cool jazz': { energy: [0.2, 0.4], tempo: [100, 140], valence: [0.35, 0.6], danceability: [0.3, 0.5], loudness: [-18, -10] },
  'free jazz': { energy: [0.4, 0.7], tempo: [80, 200], valence: [0.2, 0.45], danceability: [0.2, 0.4], loudness: [-14, -6] },
  'avant-garde jazz': { energy: [0.35, 0.65], tempo: [80, 180], valence: [0.15, 0.4], danceability: [0.15, 0.35], loudness: [-16, -8] },
  'acid jazz': { energy: [0.45, 0.65], tempo: [95, 125], valence: [0.4, 0.65], danceability: [0.55, 0.75], loudness: [-12, -7] },
  'latin jazz': { energy: [0.5, 0.7], tempo: [100, 150], valence: [0.5, 0.75], danceability: [0.5, 0.7], loudness: [-12, -7] },
  'big band': { energy: [0.55, 0.8], tempo: [120, 180], valence: [0.5, 0.8], danceability: [0.45, 0.65], loudness: [-10, -5] },
  'swing': { energy: [0.55, 0.75], tempo: [120, 180], valence: [0.55, 0.8], danceability: [0.55, 0.75], loudness: [-10, -6] },
  'bossa nova': { energy: [0.2, 0.4], tempo: [110, 140], valence: [0.45, 0.7], danceability: [0.5, 0.7], loudness: [-16, -10] },
  'nu jazz': { energy: [0.35, 0.55], tempo: [90, 130], valence: [0.35, 0.6], danceability: [0.45, 0.65], loudness: [-14, -8] },

  // ── Classical / Orchestral ──
  'classical': { energy: [0.1, 0.5], tempo: [60, 140], valence: [0.2, 0.55], danceability: [0.1, 0.35], loudness: [-25, -10] },
  'orchestral': { energy: [0.2, 0.6], tempo: [70, 140], valence: [0.2, 0.55], danceability: [0.1, 0.3], loudness: [-20, -8] },
  'chamber music': { energy: [0.1, 0.35], tempo: [70, 130], valence: [0.25, 0.5], danceability: [0.1, 0.3], loudness: [-25, -12] },
  'romantic': { energy: [0.15, 0.5], tempo: [60, 130], valence: [0.25, 0.6], danceability: [0.1, 0.3], loudness: [-22, -10] },
  'baroque': { energy: [0.2, 0.45], tempo: [80, 140], valence: [0.35, 0.6], danceability: [0.2, 0.4], loudness: [-22, -12] },
  'minimalism': { energy: [0.1, 0.35], tempo: [70, 130], valence: [0.25, 0.5], danceability: [0.15, 0.35], loudness: [-22, -12] },
  'contemporary classical': { energy: [0.15, 0.5], tempo: [60, 140], valence: [0.15, 0.45], danceability: [0.1, 0.3], loudness: [-22, -10] },
  'film score': { energy: [0.2, 0.65], tempo: [70, 140], valence: [0.2, 0.55], danceability: [0.1, 0.3], loudness: [-18, -8] },
  'soundtrack': { energy: [0.2, 0.6], tempo: [70, 140], valence: [0.25, 0.55], danceability: [0.1, 0.35], loudness: [-18, -8] },
  'video game music': { energy: [0.3, 0.7], tempo: [80, 150], valence: [0.3, 0.65], danceability: [0.2, 0.45], loudness: [-15, -6] },
  'anime': { energy: [0.5, 0.8], tempo: [120, 160], valence: [0.45, 0.75], danceability: [0.45, 0.65], loudness: [-9, -4] },
  'neoclassical': { energy: [0.15, 0.45], tempo: [70, 130], valence: [0.2, 0.5], danceability: [0.1, 0.3], loudness: [-22, -10] },
  'opera': { energy: [0.25, 0.6], tempo: [60, 130], valence: [0.2, 0.55], danceability: [0.1, 0.25], loudness: [-18, -8] },

  // ── Country ──
  'country': { energy: [0.45, 0.7], tempo: [95, 135], valence: [0.5, 0.75], danceability: [0.5, 0.7], loudness: [-9, -5] },
  'country rock': { energy: [0.55, 0.75], tempo: [100, 140], valence: [0.5, 0.75], danceability: [0.45, 0.65], loudness: [-8, -4] },
  'country pop': { energy: [0.5, 0.7], tempo: [100, 130], valence: [0.55, 0.8], danceability: [0.55, 0.75], loudness: [-8, -4] },
  'bro-country': { energy: [0.6, 0.8], tempo: [105, 135], valence: [0.55, 0.8], danceability: [0.55, 0.75], loudness: [-7, -4] },
  'outlaw country': { energy: [0.45, 0.65], tempo: [95, 130], valence: [0.35, 0.6], danceability: [0.4, 0.6], loudness: [-10, -5] },
  'alt-country': { energy: [0.4, 0.65], tempo: [95, 135], valence: [0.35, 0.6], danceability: [0.4, 0.6], loudness: [-10, -6] },
  'americana': { energy: [0.35, 0.6], tempo: [90, 130], valence: [0.35, 0.6], danceability: [0.35, 0.55], loudness: [-12, -6] },
  'bluegrass': { energy: [0.5, 0.75], tempo: [120, 170], valence: [0.5, 0.75], danceability: [0.4, 0.6], loudness: [-10, -5] },
  'honky tonk': { energy: [0.55, 0.75], tempo: [110, 145], valence: [0.45, 0.7], danceability: [0.5, 0.7], loudness: [-9, -5] },
  'nashville sound': { energy: [0.4, 0.6], tempo: [95, 125], valence: [0.45, 0.7], danceability: [0.45, 0.65], loudness: [-10, -6] },
  'red dirt': { energy: [0.5, 0.7], tempo: [100, 135], valence: [0.4, 0.65], danceability: [0.45, 0.65], loudness: [-9, -5] },

  // ── Folk / Acoustic ──
  'folk': { energy: [0.25, 0.5], tempo: [85, 130], valence: [0.35, 0.65], danceability: [0.3, 0.5], loudness: [-15, -8] },
  'indie folk': { energy: [0.25, 0.5], tempo: [90, 130], valence: [0.35, 0.65], danceability: [0.3, 0.5], loudness: [-15, -8] },
  'contemporary folk': { energy: [0.25, 0.5], tempo: [85, 125], valence: [0.35, 0.6], danceability: [0.3, 0.5], loudness: [-14, -8] },
  'folk rock': { energy: [0.4, 0.65], tempo: [95, 135], valence: [0.4, 0.65], danceability: [0.35, 0.55], loudness: [-11, -6] },
  'freak folk': { energy: [0.25, 0.5], tempo: [80, 125], valence: [0.3, 0.55], danceability: [0.25, 0.45], loudness: [-15, -8] },
  'singer-songwriter': { energy: [0.2, 0.45], tempo: [80, 125], valence: [0.3, 0.6], danceability: [0.3, 0.5], loudness: [-16, -9] },
  'acoustic': { energy: [0.15, 0.4], tempo: [80, 125], valence: [0.35, 0.65], danceability: [0.3, 0.5], loudness: [-18, -10] },
  'fingerstyle': { energy: [0.15, 0.35], tempo: [80, 130], valence: [0.35, 0.6], danceability: [0.25, 0.45], loudness: [-18, -10] },
  'celtic': { energy: [0.35, 0.6], tempo: [100, 150], valence: [0.45, 0.7], danceability: [0.4, 0.6], loudness: [-14, -8] },
  'world': { energy: [0.35, 0.65], tempo: [90, 140], valence: [0.4, 0.7], danceability: [0.4, 0.65], loudness: [-14, -7] },

  // ── Latin ──
  'latin': { energy: [0.55, 0.8], tempo: [95, 130], valence: [0.55, 0.8], danceability: [0.65, 0.85], loudness: [-8, -4] },
  'reggaeton': { energy: [0.65, 0.85], tempo: [88, 98], valence: [0.55, 0.8], danceability: [0.75, 0.9], loudness: [-6, -3] },
  'salsa': { energy: [0.65, 0.85], tempo: [150, 200], valence: [0.6, 0.85], danceability: [0.65, 0.85], loudness: [-9, -5] },
  'bachata': { energy: [0.45, 0.65], tempo: [125, 140], valence: [0.45, 0.7], danceability: [0.65, 0.85], loudness: [-10, -6] },
  'cumbia': { energy: [0.55, 0.75], tempo: [90, 110], valence: [0.6, 0.8], danceability: [0.7, 0.85], loudness: [-9, -5] },
  'merengue': { energy: [0.7, 0.85], tempo: [130, 160], valence: [0.65, 0.85], danceability: [0.7, 0.9], loudness: [-8, -4] },
  'samba': { energy: [0.6, 0.8], tempo: [95, 115], valence: [0.6, 0.8], danceability: [0.65, 0.85], loudness: [-10, -5] },
  'tango': { energy: [0.35, 0.6], tempo: [115, 135], valence: [0.25, 0.5], danceability: [0.55, 0.75], loudness: [-14, -8] },
  'latin trap': { energy: [0.6, 0.8], tempo: [130, 165], valence: [0.3, 0.55], danceability: [0.65, 0.85], loudness: [-7, -3] },
  'urbano latino': { energy: [0.6, 0.8], tempo: [90, 130], valence: [0.5, 0.75], danceability: [0.7, 0.9], loudness: [-7, -3] },
  'corrido': { energy: [0.45, 0.65], tempo: [100, 130], valence: [0.4, 0.6], danceability: [0.5, 0.7], loudness: [-10, -6] },
  'corridos tumbados': { energy: [0.5, 0.7], tempo: [90, 120], valence: [0.35, 0.6], danceability: [0.55, 0.75], loudness: [-9, -5] },
  'regional mexican': { energy: [0.5, 0.7], tempo: [100, 140], valence: [0.45, 0.7], danceability: [0.5, 0.7], loudness: [-9, -5] },
  'banda': { energy: [0.6, 0.8], tempo: [110, 140], valence: [0.5, 0.75], danceability: [0.55, 0.75], loudness: [-8, -4] },
  'norteño': { energy: [0.55, 0.75], tempo: [110, 140], valence: [0.45, 0.7], danceability: [0.55, 0.75], loudness: [-9, -5] },
  'mariachi': { energy: [0.5, 0.75], tempo: [100, 140], valence: [0.45, 0.75], danceability: [0.45, 0.65], loudness: [-10, -5] },
  'mpb': { energy: [0.35, 0.6], tempo: [90, 130], valence: [0.45, 0.7], danceability: [0.5, 0.7], loudness: [-12, -7] },
  'forró': { energy: [0.6, 0.8], tempo: [110, 140], valence: [0.6, 0.8], danceability: [0.65, 0.85], loudness: [-9, -5] },
  'sertanejo': { energy: [0.5, 0.7], tempo: [100, 130], valence: [0.5, 0.75], danceability: [0.55, 0.75], loudness: [-9, -5] },
  'funk carioca': { energy: [0.7, 0.9], tempo: [130, 150], valence: [0.5, 0.75], danceability: [0.7, 0.9], loudness: [-6, -3] },

  // ── Reggae / Ska ──
  'reggae': { energy: [0.4, 0.6], tempo: [75, 100], valence: [0.5, 0.75], danceability: [0.6, 0.8], loudness: [-10, -6] },
  'dub': { energy: [0.3, 0.5], tempo: [70, 95], valence: [0.35, 0.55], danceability: [0.5, 0.7], loudness: [-12, -7] },
  'ska': { energy: [0.65, 0.85], tempo: [130, 165], valence: [0.6, 0.8], danceability: [0.6, 0.8], loudness: [-8, -4] },
  'ska punk': { energy: [0.75, 0.9], tempo: [150, 190], valence: [0.55, 0.75], danceability: [0.55, 0.75], loudness: [-6, -3] },
  'roots reggae': { energy: [0.35, 0.55], tempo: [70, 95], valence: [0.45, 0.7], danceability: [0.55, 0.75], loudness: [-11, -6] },

  // ── Blues ──
  'blues': { energy: [0.35, 0.6], tempo: [80, 130], valence: [0.3, 0.55], danceability: [0.4, 0.6], loudness: [-12, -6] },
  'electric blues': { energy: [0.45, 0.7], tempo: [90, 140], valence: [0.3, 0.55], danceability: [0.4, 0.6], loudness: [-10, -5] },
  'delta blues': { energy: [0.25, 0.45], tempo: [80, 120], valence: [0.2, 0.45], danceability: [0.35, 0.55], loudness: [-16, -9] },
  'chicago blues': { energy: [0.45, 0.65], tempo: [90, 130], valence: [0.3, 0.55], danceability: [0.4, 0.6], loudness: [-10, -5] },

  // ── Indie / Alternative ──
  'indie': { energy: [0.4, 0.65], tempo: [100, 135], valence: [0.35, 0.65], danceability: [0.4, 0.6], loudness: [-11, -6] },
  'alternative': { energy: [0.45, 0.7], tempo: [100, 140], valence: [0.3, 0.6], danceability: [0.35, 0.55], loudness: [-10, -5] },
  'lo-fi': { energy: [0.2, 0.4], tempo: [75, 100], valence: [0.3, 0.55], danceability: [0.4, 0.6], loudness: [-16, -10] },
  'lo-fi indie': { energy: [0.2, 0.4], tempo: [85, 120], valence: [0.3, 0.55], danceability: [0.35, 0.55], loudness: [-16, -10] },
  'twee pop': { energy: [0.3, 0.5], tempo: [100, 130], valence: [0.5, 0.75], danceability: [0.4, 0.6], loudness: [-14, -8] },
  'jangle pop': { energy: [0.4, 0.6], tempo: [110, 140], valence: [0.45, 0.7], danceability: [0.4, 0.6], loudness: [-12, -7] },
  'noise pop': { energy: [0.5, 0.75], tempo: [105, 140], valence: [0.35, 0.6], danceability: [0.35, 0.55], loudness: [-9, -5] },
  'slowcore': { energy: [0.15, 0.35], tempo: [60, 100], valence: [0.1, 0.3], danceability: [0.15, 0.35], loudness: [-18, -10] },
  'sadcore': { energy: [0.15, 0.35], tempo: [60, 100], valence: [0.05, 0.2], danceability: [0.15, 0.35], loudness: [-18, -10] },
  'darkwave': { energy: [0.4, 0.65], tempo: [110, 140], valence: [0.1, 0.3], danceability: [0.4, 0.6], loudness: [-10, -5] },
  'gothic rock': { energy: [0.45, 0.7], tempo: [110, 140], valence: [0.1, 0.3], danceability: [0.4, 0.6], loudness: [-10, -5] },
  'industrial': { energy: [0.65, 0.9], tempo: [110, 145], valence: [0.1, 0.3], danceability: [0.4, 0.6], loudness: [-7, -3] },
  'ebm': { energy: [0.6, 0.8], tempo: [120, 140], valence: [0.15, 0.35], danceability: [0.5, 0.7], loudness: [-8, -4] },
  'witch house': { energy: [0.3, 0.55], tempo: [100, 130], valence: [0.05, 0.2], danceability: [0.35, 0.55], loudness: [-12, -6] },

  // ── Afro / African ──
  'afrobeats': { energy: [0.6, 0.8], tempo: [100, 120], valence: [0.6, 0.8], danceability: [0.7, 0.9], loudness: [-8, -4] },
  'afropop': { energy: [0.55, 0.75], tempo: [95, 120], valence: [0.6, 0.8], danceability: [0.65, 0.85], loudness: [-9, -5] },
  'afroswing': { energy: [0.55, 0.75], tempo: [95, 115], valence: [0.55, 0.75], danceability: [0.65, 0.85], loudness: [-8, -4] },
  'amapiano': { energy: [0.5, 0.7], tempo: [110, 118], valence: [0.5, 0.7], danceability: [0.7, 0.9], loudness: [-9, -5] },
  'highlife': { energy: [0.5, 0.7], tempo: [100, 130], valence: [0.6, 0.8], danceability: [0.6, 0.8], loudness: [-10, -6] },
  'afrobeat': { energy: [0.6, 0.8], tempo: [110, 135], valence: [0.55, 0.75], danceability: [0.6, 0.8], loudness: [-9, -5] },
  'soukous': { energy: [0.6, 0.8], tempo: [130, 160], valence: [0.6, 0.8], danceability: [0.65, 0.85], loudness: [-9, -5] },
  'kwaito': { energy: [0.5, 0.7], tempo: [95, 115], valence: [0.5, 0.7], danceability: [0.65, 0.85], loudness: [-9, -5] },

  // ── Middle Eastern / Indian ──
  'arabic': { energy: [0.4, 0.65], tempo: [90, 130], valence: [0.35, 0.6], danceability: [0.45, 0.65], loudness: [-12, -6] },
  'bollywood': { energy: [0.5, 0.75], tempo: [100, 140], valence: [0.5, 0.75], danceability: [0.55, 0.75], loudness: [-9, -5] },
  'indian classical': { energy: [0.15, 0.45], tempo: [60, 140], valence: [0.3, 0.55], danceability: [0.15, 0.35], loudness: [-20, -10] },
  'turkish': { energy: [0.4, 0.65], tempo: [90, 130], valence: [0.3, 0.55], danceability: [0.4, 0.6], loudness: [-12, -6] },
  'persian': { energy: [0.35, 0.6], tempo: [90, 130], valence: [0.3, 0.55], danceability: [0.35, 0.55], loudness: [-13, -7] },

  // ── Miscellaneous ──
  'spoken word': { energy: [0.1, 0.25], tempo: [70, 100], valence: [0.3, 0.5], danceability: [0.15, 0.3], loudness: [-20, -12] },
  'comedy': { energy: [0.2, 0.4], tempo: [80, 120], valence: [0.6, 0.85], danceability: [0.2, 0.4], loudness: [-16, -8] },
  'asmr': { energy: [0.02, 0.1], tempo: [60, 80], valence: [0.3, 0.5], danceability: [0.05, 0.15], loudness: [-35, -20] },
  'meditation': { energy: [0.02, 0.1], tempo: [60, 80], valence: [0.3, 0.5], danceability: [0.05, 0.15], loudness: [-30, -18] },
  'sleep': { energy: [0.02, 0.08], tempo: [55, 75], valence: [0.25, 0.45], danceability: [0.05, 0.1], loudness: [-35, -22] },
  'study': { energy: [0.1, 0.3], tempo: [70, 110], valence: [0.35, 0.55], danceability: [0.2, 0.4], loudness: [-20, -12] },
  'focus': { energy: [0.1, 0.3], tempo: [70, 110], valence: [0.3, 0.5], danceability: [0.15, 0.35], loudness: [-20, -12] },
  'worship': { energy: [0.3, 0.6], tempo: [75, 120], valence: [0.5, 0.8], danceability: [0.3, 0.5], loudness: [-14, -7] },
  'ccm': { energy: [0.4, 0.65], tempo: [90, 130], valence: [0.55, 0.8], danceability: [0.4, 0.6], loudness: [-10, -5] },
  'christmas': { energy: [0.35, 0.6], tempo: [90, 130], valence: [0.6, 0.85], danceability: [0.4, 0.6], loudness: [-12, -6] },
  'children': { energy: [0.4, 0.65], tempo: [100, 130], valence: [0.7, 0.9], danceability: [0.5, 0.7], loudness: [-12, -6] },
  'musical theater': { energy: [0.4, 0.7], tempo: [90, 140], valence: [0.45, 0.75], danceability: [0.35, 0.55], loudness: [-12, -6] },
  'cabaret': { energy: [0.35, 0.6], tempo: [90, 130], valence: [0.4, 0.65], danceability: [0.35, 0.55], loudness: [-14, -7] },
  'easy listening': { energy: [0.15, 0.35], tempo: [80, 120], valence: [0.5, 0.75], danceability: [0.35, 0.55], loudness: [-16, -10] },
  'lounge': { energy: [0.2, 0.4], tempo: [90, 125], valence: [0.45, 0.7], danceability: [0.4, 0.6], loudness: [-16, -9] },
  'exotica': { energy: [0.2, 0.4], tempo: [90, 125], valence: [0.45, 0.7], danceability: [0.35, 0.55], loudness: [-16, -10] },
}

/**
 * Look up a genre in the map with fuzzy matching.
 * Tries exact match first, then substring match for partial hits.
 */
export function getGenreEstimate(genre: string): GenreFeatureEstimate {
  const normalized = genre.toLowerCase().trim()

  // Exact match
  if (GENRE_FEATURE_MAP[normalized]) {
    return GENRE_FEATURE_MAP[normalized]
  }

  // Substring match: collect all matching keys, return the longest (most specific)
  let bestMatch: { key: string; estimate: GenreFeatureEstimate } | null = null

  for (const [key, estimate] of Object.entries(GENRE_FEATURE_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      if (!bestMatch || key.length > bestMatch.key.length) {
        bestMatch = { key, estimate }
      }
    }
  }

  if (bestMatch) {
    return bestMatch.estimate
  }

  return DEFAULT_GENRE_ESTIMATE
}
