const canvas = wx.createCanvas();
let ctx = canvas.getContext('2d');

function getWindowMetrics() {
  try {
    if (wx.getWindowInfo) {
      const windowInfo = wx.getWindowInfo();
      return {
        pixelRatio: windowInfo.pixelRatio || 1,
        windowWidth: windowInfo.windowWidth,
        windowHeight: windowInfo.windowHeight
      };
    }
  } catch (error) {}
  try {
    return wx.getSystemInfoSync();
  } catch (error) {
    return { pixelRatio: 1, windowWidth: 375, windowHeight: 667 };
  }
}

const initialMetrics = getWindowMetrics();
const DPR = initialMetrics.pixelRatio || 1;
let stageWidth = initialMetrics.windowWidth;
let stageHeight = initialMetrics.windowHeight;
canvas.width = stageWidth * DPR;
canvas.height = stageHeight * DPR;
ctx.scale(DPR, DPR);

const COLORS = {
  bg: '#fff4f8',
  card: '#ffffff',
  text: '#4b2735',
  muted: '#a06a7d',
  primary: '#ff6fa3',
  primaryDark: '#d94278',
  grid: '#ffe1ec',
  gridStroke: '#f6a9c4',
  danger: '#e24a4a'
};

const ITEMS = [
  { type: 'lipstick', name: '口红', colors: ['#ff7aa2', '#f05287', '#c93369'] },
  { type: 'perfume', name: '香水', colors: ['#8fd3ff', '#56ade8', '#2a82bf'] },
  { type: 'cream', name: '面霜', colors: ['#f6c66f', '#e49b38', '#b96d22'] },
  { type: 'powder', name: '粉饼', colors: ['#c99cff', '#a86dea', '#7f45c2'] }
];

const GRID_SIZE = 4;
const CELL_GAP = 8;
const MAX_LEVEL = 3;
const SOURCE_COUNT = 3;
const GAME_TITLE = '收纳上头了';
const GAME_SUBTITLE = '一格都不能乱！';

const LEVELS = [
  { title: '第 1 关 新手整理', targetOrders: 2, moveLimit: 18, reward: 220, levelBias: 0.08 },
  { title: '第 2 关 口红专柜', targetOrders: 3, moveLimit: 22, reward: 360, levelBias: 0.12 },
  { title: '第 3 关 香氛派对', targetOrders: 4, moveLimit: 26, reward: 520, levelBias: 0.16 },
  { title: '第 4 关 大师收纳', targetOrders: 5, moveLimit: 30, reward: 700, levelBias: 0.2 },
  { title: '第 5 关 限步整理', targetOrders: 5, moveLimit: 24, reward: 760, levelBias: 0.18 },
  { title: '第 6 关 粉饼专区', targetOrders: 4, moveLimit: 26, reward: 820, levelBias: 0.18, preferredType: 'powder' },
  { title: '第 7 关 杂物清理', targetOrders: 4, moveLimit: 28, reward: 900, levelBias: 0.18, blockedCells: 2 },
  { title: '第 8 关 香水专区', targetOrders: 5, moveLimit: 28, reward: 980, levelBias: 0.2, preferredType: 'perfume' },
  { title: '第 9 关 完美动线', targetOrders: 5, moveLimit: 26, reward: 1060, levelBias: 0.2, blockedCells: 2 },
  { title: '第 10 关 十单挑战', targetOrders: 6, moveLimit: 32, reward: 1180, levelBias: 0.22, comboOrder: 2 },
  { title: '第 11 关 口红专区', targetOrders: 5, moveLimit: 27, reward: 1260, levelBias: 0.22, preferredType: 'lipstick', blockedCells: 2 },
  { title: '第 12 关 面霜专区', targetOrders: 5, moveLimit: 27, reward: 1340, levelBias: 0.22, preferredType: 'cream', blockedCells: 2, goalType: 'sameRow', goalCount: 1 },
  { title: '第 13 关 桌面有点乱', targetOrders: 5, moveLimit: 30, reward: 1420, levelBias: 0.24, blockedCells: 3 },
  { title: '第 14 关 精准下单', targetOrders: 6, moveLimit: 31, reward: 1520, levelBias: 0.24, preferredType: 'powder' },
  { title: '第 15 关 大扫除', targetOrders: 6, moveLimit: 32, reward: 1640, levelBias: 0.24, blockedCells: 3, goalType: 'clearBlocked', goalCount: 3 },
  { title: '第 16 关 极限香氛', targetOrders: 6, moveLimit: 29, reward: 1760, levelBias: 0.26, preferredType: 'perfume', blockedCells: 3 },
  { title: '第 17 关 断舍离', targetOrders: 6, moveLimit: 30, reward: 1880, levelBias: 0.26, blockedCells: 4 },
  { title: '第 18 关 高级专柜', targetOrders: 7, moveLimit: 34, reward: 2020, levelBias: 0.28, preferredType: 'lipstick', blockedCells: 3, goalType: 'makeLevel3', goalCount: 2 },
  { title: '第 19 关 一格不乱', targetOrders: 7, moveLimit: 32, reward: 2180, levelBias: 0.28, blockedCells: 4 },
  { title: '第 20 关 收纳封神', targetOrders: 8, moveLimit: 36, reward: 2400, levelBias: 0.3, blockedCells: 4, comboOrder: 3, goalType: 'makeLevel3', goalCount: 3 }
];

const AD_CONFIG = {
  rewardedVideoAdUnitId: '',
  interstitialAdUnitId: ''
};

const state = {
  screen: 'start',
  mode: 'endless',
  levelIndex: 0,
  levelConfig: null,
  ordersCompleted: 0,
  level3Made: 0,
  sameRowMade: 0,
  clearedBlocked: 0,
  refreshCount: 0,
  randomSeed: 0,
  randomSeedEnabled: false,
  score: 0,
  best: 0,
  steps: 0,
  gameOver: false,
  grid: [],
  blockedCells: [],
  source: [],
  target: null,
  dragging: null,
  hoverCellIndex: -1,
  mergeHintIndexes: [],
  history: [],
  reviveUsed: false,
  mergePulse: [],
  particles: [],
  floatingTexts: [],
  combo: 0,
  comboStartedAt: 0,
  finalScore: 0,
  finalSteps: 0,
  finalBeatPercent: 0,
  finalStars: 0,
  finalWin: false,
  finalNextLevel: false,
  finalReason: '',
  shareImageUrl: 'assets/share-card.png',
  soundEnabled: true,
  musicEnabled: true,
  vibrationEnabled: true,
  guideStep: 0,
  guideCompleted: false,
  toast: ''
};

const layout = {};
const sounds = {};
const ads = {};

function createSound(name, src) {
  try {
    const audio = wx.createInnerAudioContext();
    audio.src = src;
    audio.volume = name === 'bgm' ? 0.18 : 0.45;
    audio.loop = name === 'bgm';
    sounds[name] = audio;
  } catch (error) {}
}

function setupSounds() {
  createSound('place', 'assets/sounds/place.wav');
  createSound('merge', 'assets/sounds/merge.wav');
  createSound('order', 'assets/sounds/order.wav');
  createSound('button', 'assets/sounds/button.wav');
  createSound('fail', 'assets/sounds/fail.wav');
  createSound('bgm', 'assets/sounds/bgm.wav');
}

function setupShareMenu() {
  try {
    wx.showShareMenu({ withShareTicket: true });
    wx.onShareAppMessage(() => makeShareMessage());
  } catch (error) {}
}

function setupAds() {
  try {
    if (AD_CONFIG.rewardedVideoAdUnitId && wx.createRewardedVideoAd) {
      ads.rewarded = wx.createRewardedVideoAd({ adUnitId: AD_CONFIG.rewardedVideoAdUnitId });
    }
    if (AD_CONFIG.interstitialAdUnitId && wx.createInterstitialAd) {
      ads.interstitial = wx.createInterstitialAd({ adUnitId: AD_CONFIG.interstitialAdUnitId });
    }
  } catch (error) {}
}

function showRewardedAd(reason, onReward) {
  if (!ads.rewarded) {
    state.toast = `广告占位：${reason}`;
    if (onReward) onReward();
    return;
  }
  try {
    if (ads.rewarded.offClose) ads.rewarded.offClose();
    ads.rewarded.onClose((result) => {
      if (!result || result.isEnded) {
        if (onReward) onReward();
      } else {
        state.toast = '看完广告才能获得奖励';
      }
    });
  } catch (error) {}
  ads.rewarded.show().catch(() => ads.rewarded.load().then(() => ads.rewarded.show()).catch(() => {
    if (onReward) onReward();
  }));
}

function showInterstitialAd() {
  if (!ads.interstitial) return;
  try {
    ads.interstitial.show().catch(() => {});
  } catch (error) {}
}

function makeShareMessage() {
  const score = Math.max(state.score, state.finalScore, state.best);
  const modeName = state.mode === 'daily' ? '每日挑战' : state.mode === 'level' ? '关卡模式' : '无尽模式';
  return {
    title: score > 0 ? `我在${modeName}收纳到 ${score} 分，击败 ${beatPercent(score)}% 玩家` : `${GAME_TITLE}，${GAME_SUBTITLE}`,
    imageUrl: state.shareImageUrl || 'assets/share-card.png'
  };
}

function beatPercent(score) {
  if (score <= 0) return 1;
  const percent = Math.floor(38 + Math.min(60, Math.sqrt(score) * 2.4));
  return Math.max(1, Math.min(99, percent));
}

function randomValue() {
  if (!state.randomSeedEnabled) return Math.random();
  state.randomSeed = (state.randomSeed * 1664525 + 1013904223) >>> 0;
  return state.randomSeed / 4294967296;
}

function todaySeed() {
  const now = new Date();
  const key = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  return Number(key) || 20260611;
}

function playSound(name) {
  if (!state.soundEnabled) return;
  const audio = sounds[name];
  if (!audio) return;
  try {
    audio.stop();
    audio.seek(0);
    audio.play();
  } catch (error) {}
}

function updateMusic() {
  const bgm = sounds.bgm;
  if (!bgm) return;
  try {
    if (state.musicEnabled) bgm.play();
    else bgm.stop();
  } catch (error) {}
}

function vibrate(type = 'short') {
  if (!state.vibrationEnabled) return;
  try {
    if (type === 'long' && wx.vibrateLong) wx.vibrateLong();
    else if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
  } catch (error) {}
}

function loadBest() {
  try {
    state.best = wx.getStorageSync('storage_game_best') || 0;
    state.levelIndex = clampLevelIndex(wx.getStorageSync('storage_game_level') || 0);
    const savedSound = wx.getStorageSync('storage_game_sound');
    const savedMusic = wx.getStorageSync('storage_game_music');
    const savedVibration = wx.getStorageSync('storage_game_vibration');
    state.soundEnabled = savedSound === '' ? true : savedSound !== false;
    state.musicEnabled = savedMusic === '' ? true : savedMusic !== false;
    state.vibrationEnabled = savedVibration === '' ? true : savedVibration !== false;
    state.guideCompleted = wx.getStorageSync('storage_game_guide_done') === true;
  } catch (error) {
    state.best = 0;
  }
}

function saveSettings() {
  try {
    wx.setStorageSync('storage_game_sound', state.soundEnabled);
    wx.setStorageSync('storage_game_music', state.musicEnabled);
    wx.setStorageSync('storage_game_vibration', state.vibrationEnabled);
    wx.setStorageSync('storage_game_guide_done', state.guideCompleted);
  } catch (error) {}
}

function saveBest() {
  if (state.score > state.best) {
    state.best = state.score;
    try {
      wx.setStorageSync('storage_game_best', state.best);
    } catch (error) {}
  }
}

function saveLevelProgress() {
  try {
    wx.setStorageSync('storage_game_level', state.levelIndex);
  } catch (error) {}
}

function resetGame(mode = state.mode, levelIndex = state.levelIndex) {
  state.screen = 'playing';
  state.mode = mode;
  state.levelIndex = clampLevelIndex(levelIndex);
  state.levelConfig = mode === 'level' ? { ...LEVELS[state.levelIndex] } : mode === 'daily' ? makeDailyConfig() : null;
  state.ordersCompleted = 0;
  state.level3Made = 0;
  state.sameRowMade = 0;
  state.clearedBlocked = 0;
  state.refreshCount = 0;
  state.randomSeedEnabled = mode === 'daily';
  state.randomSeed = mode === 'daily' ? todaySeed() : 0;
  state.score = 0;
  state.steps = 0;
  state.gameOver = false;
  state.grid = Array.from({ length: GRID_SIZE * GRID_SIZE }, () => null);
  state.blockedCells = makeBlockedCells(state.levelConfig ? state.levelConfig.blockedCells || 0 : 0);
  state.source = makeSource();
  state.target = makeTarget();
  state.dragging = null;
  state.hoverCellIndex = -1;
  state.mergeHintIndexes = [];
  state.history = [];
  state.reviveUsed = false;
  state.mergePulse = [];
  state.particles = [];
  state.floatingTexts = [];
  state.combo = 0;
  state.comboStartedAt = 0;
  state.finalWin = false;
  state.finalNextLevel = false;
  state.finalBeatPercent = 0;
  state.finalStars = 0;
  state.finalReason = '';
  state.guideStep = state.guideCompleted ? 0 : 1;
  state.toast = mode === 'endless' ? '无尽模式：三件同类自动升级' : `${state.levelConfig.title}：完成 ${state.levelConfig.targetOrders} 单`;
}

function clampLevelIndex(levelIndex) {
  const index = Number(levelIndex) || 0;
  return Math.max(0, Math.min(LEVELS.length - 1, index));
}

function preparePreviewGame() {
  state.grid = Array.from({ length: GRID_SIZE * GRID_SIZE }, () => null);
  state.blockedCells = [];
  state.source = makeSource();
  state.target = makeTarget();
  state.dragging = null;
  state.hoverCellIndex = -1;
  state.mergeHintIndexes = [];
  state.history = [];
  state.mergePulse = [];
  state.particles = [];
  state.floatingTexts = [];
  state.combo = 0;
  state.comboStartedAt = 0;
  state.guideStep = 0;
  state.gameOver = false;
}

function makeDailyConfig() {
  const seed = todaySeed();
  return {
    title: `每日挑战 ${String(seed).slice(4)}`,
    targetOrders: 4 + (seed % 3),
    moveLimit: 24 + (seed % 5),
    reward: 600,
    levelBias: 0.16,
    blockedCells: seed % 2 === 0 ? 2 : 1,
    preferredType: ITEMS[seed % ITEMS.length].type
  };
}

function makeBlockedCells(count) {
  const cells = [];
  const protectedCells = new Set([0, 1, GRID_SIZE, GRID_SIZE + 1]);
  let attempts = 0;
  while (cells.length < count && attempts < 80) {
    attempts += 1;
    const index = Math.floor(randomValue() * GRID_SIZE * GRID_SIZE);
    if (protectedCells.has(index) || cells.includes(index)) continue;
    cells.push(index);
  }
  return cells;
}

function cloneItem(item) {
  return item ? { ...item } : null;
}

function snapshotState() {
  state.history.push({
    score: state.score,
    steps: state.steps,
    grid: state.grid.map(cloneItem),
    blockedCells: [...state.blockedCells],
    source: state.source.map(cloneItem),
    target: { ...state.target },
    reviveUsed: state.reviveUsed,
    ordersCompleted: state.ordersCompleted,
    level3Made: state.level3Made,
    sameRowMade: state.sameRowMade,
    clearedBlocked: state.clearedBlocked,
    refreshCount: state.refreshCount,
    randomSeed: state.randomSeed
  });
  if (state.history.length > 12) state.history.shift();
}

function restoreSnapshot(snapshot) {
  state.score = snapshot.score;
  state.steps = snapshot.steps;
  state.grid = snapshot.grid.map(cloneItem);
  state.blockedCells = [...(snapshot.blockedCells || [])];
  state.source = snapshot.source.map(cloneItem);
  state.target = { ...snapshot.target };
  state.reviveUsed = snapshot.reviveUsed;
  state.ordersCompleted = snapshot.ordersCompleted;
  state.level3Made = snapshot.level3Made || 0;
  state.sameRowMade = snapshot.sameRowMade || 0;
  state.clearedBlocked = snapshot.clearedBlocked || 0;
  state.refreshCount = snapshot.refreshCount || 0;
  state.randomSeed = snapshot.randomSeed;
  state.hoverCellIndex = -1;
  state.mergeHintIndexes = [];
  state.gameOver = false;
  state.dragging = null;
}

function makeItem(type = randomItemType(), level = 1) {
  return { id: `${Date.now()}-${Math.random()}`, type, level };
}

function randomItemType() {
  return ITEMS[Math.floor(randomValue() * ITEMS.length)].type;
}

function randomLevel() {
  const roll = randomValue();
  const bias = state.levelConfig ? state.levelConfig.levelBias : 0.12;
  if (roll > 1 - bias) return 2;
  return 1;
}

function makeSource() {
  return Array.from({ length: SOURCE_COUNT }, () => makeItem(randomItemType(), randomLevel()));
}

function makeTarget() {
  const count = state.levelConfig && state.levelConfig.comboOrder ? state.levelConfig.comboOrder : state.ordersCompleted >= 3 && randomValue() > 0.76 ? 2 : 1;
  const items = [];
  for (let index = 0; index < count; index += 1) {
    const type = smartTargetType(items.map((item) => item.type));
    const earlyOrders = state.ordersCompleted < 2;
    const level = earlyOrders ? 2 : randomValue() > 0.72 ? 3 : 2;
    items.push({ type, level, done: false });
  }
  return { title: count > 1 ? '组合妆包' : '顾客订单', items };
}

function smartTargetType(excludedTypes = []) {
  const candidates = ITEMS.map((item) => ({ type: item.type, weight: 1 }));
  state.grid.forEach((gridItem) => {
    if (!gridItem) return;
    const candidate = candidates.find((entry) => entry.type === gridItem.type);
    if (candidate) candidate.weight += gridItem.level === 1 ? 1.2 : 2.2;
  });
  state.source.forEach((sourceItem) => {
    if (!sourceItem) return;
    const candidate = candidates.find((entry) => entry.type === sourceItem.type);
    if (candidate) candidate.weight += 0.8;
  });
  if (state.levelConfig && state.levelConfig.preferredType) {
    const preferred = candidates.find((entry) => entry.type === state.levelConfig.preferredType);
    if (preferred) preferred.weight += 4;
  }
  excludedTypes.forEach((type) => {
    const candidate = candidates.find((entry) => entry.type === type);
    if (candidate) candidate.weight *= 0.2;
  });
  const total = candidates.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = randomValue() * total;
  for (const candidate of candidates) {
    cursor -= candidate.weight;
    if (cursor <= 0) return candidate.type;
  }
  return candidates[0].type;
}

function primaryTargetItem() {
  if (!state.target || !state.target.items) return state.target;
  return state.target.items.find((item) => !item.done) || state.target.items[0];
}

function itemMeta(type) {
  return ITEMS.find((item) => item.type === type) || ITEMS[0];
}

function updateLayout() {
  const metrics = getWindowMetrics();
  stageWidth = metrics.windowWidth;
  stageHeight = metrics.windowHeight;
  layout.safeTop = 24;
  layout.padding = 18;
  layout.headerY = layout.safeTop + 10;
  layout.orderY = layout.headerY + 58;
  layout.gridTop = layout.orderY + 82;
  layout.gridLeft = layout.padding;
  layout.gridWidth = stageWidth - layout.padding * 2;
  layout.cellSize = (layout.gridWidth - CELL_GAP * (GRID_SIZE - 1)) / GRID_SIZE;
  layout.sourceTop = layout.gridTop + layout.gridWidth + 34;
  layout.sourceSize = Math.min(76, (stageWidth - layout.padding * 2 - 18 * 2) / 3);
  layout.sourceGap = (stageWidth - layout.padding * 2 - layout.sourceSize * SOURCE_COUNT) / (SOURCE_COUNT - 1);
  const buttonGap = 10;
  const buttonTop = stageHeight - 74;
  const smallButtonWidth = (stageWidth - layout.padding * 2 - buttonGap * 2) / 3;
  layout.primaryButton = {
    x: layout.padding,
    y: stageHeight - 150,
    w: stageWidth - layout.padding * 2,
    h: 52
  };
  layout.secondaryButton = {
    x: layout.padding,
    y: stageHeight - 86,
    w: stageWidth - layout.padding * 2,
    h: 48
  };
  layout.modeButtons = [
    { action: 'endless', label: '无尽模式', subtitle: '冲最高分', x: layout.padding, y: stageHeight - 238, w: stageWidth - layout.padding * 2, h: 48, color: COLORS.primary },
    { action: 'level', label: currentLevelTitle(), subtitle: '限步通关', x: layout.padding, y: stageHeight - 178, w: stageWidth - layout.padding * 2, h: 48, color: '#c084fc' },
    { action: 'daily', label: '每日挑战', subtitle: '全员同题', x: layout.padding, y: stageHeight - 118, w: stageWidth - layout.padding * 2, h: 48, color: '#fb7185' }
  ];
  layout.settingsButton = {
    x: stageWidth - layout.padding - 70,
    y: layout.safeTop + 56,
    w: 70,
    h: 30
  };
  layout.settingsItems = [
    { action: 'toggleSound', label: '音效', x: layout.padding + 20, y: stageHeight / 2 - 82, w: stageWidth - layout.padding * 2 - 40, h: 40 },
    { action: 'toggleMusic', label: '背景音乐', x: layout.padding + 20, y: stageHeight / 2 - 34, w: stageWidth - layout.padding * 2 - 40, h: 40 },
    { action: 'toggleVibration', label: '震动', x: layout.padding + 20, y: stageHeight / 2 + 14, w: stageWidth - layout.padding * 2 - 40, h: 40 },
    { action: 'resetGuide', label: '重看新手引导', x: layout.padding + 20, y: stageHeight / 2 + 62, w: stageWidth - layout.padding * 2 - 40, h: 40 },
    { action: 'closeSettings', label: '返回', x: layout.padding + 20, y: stageHeight / 2 + 122, w: stageWidth - layout.padding * 2 - 40, h: 46 }
  ];
  layout.buttons = [
    { action: 'undo', label: '撤回', x: layout.padding, y: buttonTop, w: smallButtonWidth, h: 48, color: '#c084fc' },
    { action: 'refresh', label: '刷新', x: layout.padding + (smallButtonWidth + buttonGap), y: buttonTop, w: smallButtonWidth, h: 48, color: COLORS.primary },
    { action: 'revive', label: '复活', x: layout.padding + (smallButtonWidth + buttonGap) * 2, y: buttonTop, w: smallButtonWidth, h: 48, color: '#fb7185' }
  ];
}

function currentLevelTitle() {
  return LEVELS[state.levelIndex] ? LEVELS[state.levelIndex].title : LEVELS[0].title;
}

function drawRoundRect(x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawShadowCard(x, y, w, h, r, fill = '#fff', stroke = null, shadow = 'rgba(210,80,130,.16)') {
  ctx.save();
  ctx.shadowColor = shadow;
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 8;
  drawRoundRect(x, y, w, h, r, fill, stroke);
  ctx.restore();
}

function makeVerticalGradient(y, h, top, bottom) {
  const gradient = ctx.createLinearGradient(0, y, 0, y + h);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  return gradient;
}

function drawText(text, x, y, size, color = COLORS.text, align = 'left', weight = 'normal') {
  ctx.font = `${weight} ${size}px sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function drawSparkle(x, y, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let index = 0; index < 8; index += 1) {
    const radius = index % 2 === 0 ? size : size * 0.35;
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / 8;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHeart(x, y, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.55);
  ctx.bezierCurveTo(x - size * 1.2, y - size * 0.2, x - size * 0.7, y - size, x, y - size * 0.35);
  ctx.bezierCurveTo(x + size * 0.7, y - size, x + size * 1.2, y - size * 0.2, x, y + size * 0.55);
  ctx.fill();
  ctx.restore();
}

function drawGloss(x, y, w, h, r) {
  ctx.save();
  ctx.globalAlpha = 0.28;
  drawRoundRect(x + 5, y + 5, w - 10, h * 0.36, Math.min(r, h * 0.18), '#fff', null);
  ctx.restore();
}

function drawItem(item, x, y, size, alpha = 1) {
  const meta = itemMeta(item.type);
  const color = meta.colors[Math.min(item.level - 1, meta.colors.length - 1)];
  ctx.save();
  ctx.globalAlpha = alpha;
  drawShadowCard(x, y, size, size, 18, '#fff', 'rgba(255,255,255,.9)', 'rgba(150,60,100,.2)');
  drawRoundRect(x + 5, y + 5, size - 10, size - 10, 16, makeVerticalGradient(y + 5, size - 10, color, meta.colors[0]), null);
  drawGloss(x + 5, y + 5, size - 10, size - 10, 16);
  drawSparkle(x + size - 14, y + 15, Math.max(4, size * 0.07), 'rgba(255,255,255,.88)');
  drawCosmeticIcon(item.type, x, y, size);
  drawText(`Lv.${item.level}`, x + size / 2, y + size - 13, 12, '#fff', 'center', 'bold');
  ctx.restore();
}

function drawCosmeticIcon(type, x, y, size) {
  const cx = x + size / 2;
  const cy = y + size / 2 - 6;
  const unit = size / 72;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (type === 'lipstick') drawLipstickIcon(cx, cy, unit);
  if (type === 'perfume') drawPerfumeIcon(cx, cy, unit);
  if (type === 'cream') drawCreamIcon(cx, cy, unit);
  if (type === 'powder') drawPowderIcon(cx, cy, unit);
  ctx.restore();
}

function drawLipstickIcon(cx, cy, unit) {
  drawRoundRect(cx - 13 * unit, cy - 2 * unit, 26 * unit, 30 * unit, 5 * unit, '#ffffff', null);
  drawRoundRect(cx - 10 * unit, cy + 7 * unit, 20 * unit, 20 * unit, 4 * unit, '#4b2735', null);
  ctx.fillStyle = '#ffedf4';
  ctx.beginPath();
  ctx.moveTo(cx - 8 * unit, cy - 3 * unit);
  ctx.lineTo(cx + 3 * unit, cy - 22 * unit);
  ctx.quadraticCurveTo(cx + 13 * unit, cy - 15 * unit, cx + 8 * unit, cy - 3 * unit);
  ctx.closePath();
  ctx.fill();
  drawRoundRect(cx - 12 * unit, cy + 1 * unit, 24 * unit, 7 * unit, 3 * unit, '#ffd0df', null);
  ctx.strokeStyle = 'rgba(255,255,255,.68)';
  ctx.lineWidth = 2 * unit;
  ctx.beginPath();
  ctx.moveTo(cx + 2 * unit, cy - 17 * unit);
  ctx.lineTo(cx + 7 * unit, cy - 7 * unit);
  ctx.stroke();
}

function drawPerfumeIcon(cx, cy, unit) {
  drawRoundRect(cx - 15 * unit, cy - 10 * unit, 30 * unit, 34 * unit, 8 * unit, '#ffffff', null);
  drawRoundRect(cx - 7 * unit, cy - 20 * unit, 14 * unit, 9 * unit, 3 * unit, '#4b2735', null);
  drawRoundRect(cx - 12 * unit, cy - 1 * unit, 24 * unit, 15 * unit, 6 * unit, '#dff4ff', null);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3 * unit;
  ctx.beginPath();
  ctx.arc(cx, cy + 6 * unit, 7 * unit, 0, Math.PI * 2);
  ctx.stroke();
  drawSparkle(cx + 9 * unit, cy - 2 * unit, 4 * unit, 'rgba(255,255,255,.9)');
}

function drawCreamIcon(cx, cy, unit) {
  drawRoundRect(cx - 18 * unit, cy - 6 * unit, 36 * unit, 29 * unit, 9 * unit, '#ffffff', null);
  drawRoundRect(cx - 14 * unit, cy - 16 * unit, 28 * unit, 11 * unit, 5 * unit, '#ffe4ad', null);
  ctx.fillStyle = '#fff5d8';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 5 * unit, 10 * unit, 7 * unit, 0, 0, Math.PI * 2);
  ctx.fill();
  drawText('C', cx, cy + 5 * unit, 14 * unit, '#c47a20', 'center', 'bold');
  drawSparkle(cx + 13 * unit, cy - 10 * unit, 3.5 * unit, 'rgba(255,255,255,.9)');
}

function drawPowderIcon(cx, cy, unit) {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy + 4 * unit, 19 * unit, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f5e8ff';
  ctx.beginPath();
  ctx.arc(cx, cy + 4 * unit, 13 * unit, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4 * unit;
  ctx.beginPath();
  ctx.moveTo(cx - 13 * unit, cy - 10 * unit);
  ctx.quadraticCurveTo(cx, cy - 22 * unit, cx + 13 * unit, cy - 10 * unit);
  ctx.stroke();
  drawHeart(cx + 10 * unit, cy + 5 * unit, 4 * unit, '#ffffff');
}

function render() {
  ctx.clearRect(0, 0, stageWidth, stageHeight);
  drawCreamBackground();

  if (state.screen === 'start') {
    drawStartScreen();
    requestAnimationFrame(render);
    return;
  }

  if (state.screen === 'settings') {
    drawSettingsScreen();
    requestAnimationFrame(render);
    return;
  }

  drawText(GAME_TITLE, layout.padding, layout.headerY, 28, COLORS.text, 'left', 'bold');
  drawText(`最高 ${state.best}`, stageWidth - layout.padding, layout.headerY, 14, COLORS.muted, 'right');
  drawText(`得分 ${state.score}`, layout.padding, layout.headerY + 34, 16, COLORS.primaryDark, 'left', 'bold');
  drawText(progressLabel(), stageWidth - layout.padding, layout.headerY + 34, 16, COLORS.muted, 'right');

  drawOrder();
  drawGrid();
  drawSource();
  drawEffects();
  drawFloatingTexts();
  drawAdPlaceholder();

  if (state.toast && !state.gameOver) {
    drawText(state.toast, stageWidth / 2, layout.sourceTop + layout.sourceSize + 30, 14, COLORS.muted, 'center');
  }

  if (state.screen === 'result') drawResultScreen();

  if (state.screen === 'playing') drawButtons();

  if (state.screen === 'playing' && state.guideStep > 0) drawGuideOverlay();

  if (state.screen === 'playing' && state.dragging) {
    drawItem(state.dragging.item, state.dragging.x - layout.sourceSize / 2, state.dragging.y - layout.sourceSize / 2, layout.sourceSize, 0.9);
  }

  requestAnimationFrame(render);
}

function drawCreamBackground() {
  ctx.fillStyle = makeVerticalGradient(0, stageHeight, '#fff7fb', '#ffe4ef');
  ctx.fillRect(0, 0, stageWidth, stageHeight);
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(stageWidth - 36, 82, 82, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd1e2';
  ctx.beginPath();
  ctx.arc(34, 156, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.8;
  drawSparkle(68, 88, 9, '#fff');
  drawSparkle(stageWidth - 74, 174, 7, '#fff');
  drawHeart(stageWidth - 42, 250, 8, '#ffc0d5');
  ctx.restore();
}

function progressLabel() {
  if (!state.levelConfig) return `步数 ${state.steps}`;
  return `${goalProgressLabel()} · ${state.steps}/${state.levelConfig.moveLimit} 步`;
}

function goalProgressLabel() {
  if (!state.levelConfig) return `${state.ordersCompleted} 单`;
  if (state.levelConfig.goalType === 'clearBlocked') return `清理 ${state.clearedBlocked || 0}/${state.levelConfig.goalCount}`;
  if (state.levelConfig.goalType === 'makeLevel3') return `Lv.3 ${state.level3Made}/${state.levelConfig.goalCount}`;
  if (state.levelConfig.goalType === 'sameRow') return `整行 ${state.sameRowMade}/${state.levelConfig.goalCount}`;
  return `${state.ordersCompleted}/${state.levelConfig.targetOrders} 单`;
}

function drawStartScreen() {
  drawVanityBackdrop();
  drawText(GAME_TITLE, stageWidth / 2, layout.safeTop + 70, 34, COLORS.text, 'center', 'bold');
  drawText(GAME_SUBTITLE, stageWidth / 2, layout.safeTop + 112, 17, COLORS.primaryDark, 'center', 'bold');
  drawShadowCard(layout.settingsButton.x, layout.settingsButton.y, layout.settingsButton.w, layout.settingsButton.h, 15, '#ffffff', '#ffc2d6', 'rgba(210,80,130,.12)');
  drawText('设置', layout.settingsButton.x + layout.settingsButton.w / 2, layout.settingsButton.y + 15, 14, COLORS.primaryDark, 'center', 'bold');

  const showcaseY = stageHeight / 2 - 84;
  drawShadowCard(layout.padding, showcaseY - 32, stageWidth - layout.padding * 2, 150, 28, 'rgba(255,255,255,.84)', '#ffc2d6');
  drawGloss(layout.padding, showcaseY - 32, stageWidth - layout.padding * 2, 150, 28);
  ITEMS.forEach((item, index) => {
    const size = 58;
    const gap = 16;
    const totalWidth = ITEMS.length * size + (ITEMS.length - 1) * gap;
    const x = stageWidth / 2 - totalWidth / 2 + index * (size + gap);
    drawItem({ type: item.type, level: index % 3 + 1 }, x, showcaseY + 10 + Math.sin(Date.now() / 420 + index) * 5, size);
  });
  drawText('选择玩法开始整理', stageWidth / 2, showcaseY + 104, 20, COLORS.primaryDark, 'center', 'bold');

  layout.modeButtons.forEach((button) => {
    drawShadowCard(button.x, button.y, button.w, button.h, 24, button.color, null, 'rgba(160,60,105,.2)');
    drawGloss(button.x, button.y, button.w, button.h, 24);
    drawText(button.label, button.x + 18, button.y + 24, 17, '#fff', 'left', 'bold');
    drawText(button.subtitle, button.x + button.w - 18, button.y + 24, 14, '#fff', 'right', 'bold');
  });
  drawText('右上角或结算页可分享战绩', stageWidth / 2, stageHeight - 34, 13, COLORS.muted, 'center');
}

function drawSettingsScreen() {
  drawVanityBackdrop();
  drawText('设置', stageWidth / 2, layout.safeTop + 78, 32, COLORS.text, 'center', 'bold');
  drawText('首轮测试可随时关闭音效和震动', stageWidth / 2, layout.safeTop + 116, 15, COLORS.muted, 'center');
  drawShadowCard(layout.padding, stageHeight / 2 - 116, stageWidth - layout.padding * 2, 310, 28, 'rgba(255,255,255,.9)', '#ffc2d6');
  layout.settingsItems.forEach((item) => {
    const isClose = item.action === 'closeSettings';
    drawShadowCard(item.x, item.y, item.w, item.h, 22, isClose ? COLORS.primary : '#fff', isClose ? null : '#ffc2d6', 'rgba(210,80,130,.1)');
    if (isClose) drawGloss(item.x, item.y, item.w, item.h, 22);
    const value = settingsValueLabel(item.action);
    drawText(item.label, item.x + 18, item.y + item.h / 2, 16, isClose ? '#fff' : COLORS.text, 'left', 'bold');
    if (value) drawText(value, item.x + item.w - 18, item.y + item.h / 2, 15, isClose ? '#fff' : COLORS.primaryDark, 'right', 'bold');
  });
}

function settingsValueLabel(action) {
  if (action === 'toggleSound') return state.soundEnabled ? '开' : '关';
  if (action === 'toggleMusic') return state.musicEnabled ? '开' : '关';
  if (action === 'toggleVibration') return state.vibrationEnabled ? '开' : '关';
  return '';
}

function drawGuideOverlay() {
  const guide = guideInfo();
  if (!guide) return;
  ctx.save();
  ctx.fillStyle = 'rgba(75,39,53,.58)';
  ctx.fillRect(0, 0, stageWidth, stageHeight);
  drawShadowCard(layout.padding, stageHeight / 2 - 120, stageWidth - layout.padding * 2, 210, 26, '#fff', null);
  drawText(`新手引导 ${state.guideStep}/3`, stageWidth / 2, stageHeight / 2 - 76, 18, COLORS.primaryDark, 'center', 'bold');
  drawText(guide.title, stageWidth / 2, stageHeight / 2 - 32, 25, COLORS.text, 'center', 'bold');
  drawText(guide.body, stageWidth / 2, stageHeight / 2 + 8, 15, COLORS.muted, 'center');
  drawShadowCard(layout.padding + 28, stageHeight / 2 + 46, stageWidth - layout.padding * 2 - 56, 44, 22, COLORS.primary, null, 'rgba(160,60,105,.24)');
  drawGloss(layout.padding + 28, stageHeight / 2 + 46, stageWidth - layout.padding * 2 - 56, 44, 22);
  drawText(state.guideStep >= 3 ? '开始挑战' : '下一步', stageWidth / 2, stageHeight / 2 + 68, 16, '#fff', 'center', 'bold');
  ctx.restore();
}

function guideInfo() {
  const guides = {
    1: { title: '拖拽物品', body: '从下方化妆包拖到上方空格' },
    2: { title: '三件合成', body: '同类同等级满 3 个会自动升级' },
    3: { title: '完成订单', body: '做出顾客想要的物品即可得分' }
  };
  return guides[state.guideStep];
}

function drawVanityBackdrop() {
  drawCreamBackground();
  ctx.save();
  drawShadowCard(stageWidth / 2 - 88, 118, 176, 116, 58, '#fff', '#ffc8dc', 'rgba(210,80,130,.18)');
  ctx.strokeStyle = '#ffd0df';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(stageWidth / 2, 176, 44, 0, Math.PI * 2);
  ctx.stroke();
  drawRoundRect(stageWidth / 2 - 44, 228, 88, 14, 7, '#ffc8dc', null);
  drawShadowCard(layout.padding, stageHeight - 232, stageWidth - layout.padding * 2, 48, 20, '#ffd5e3', null, 'rgba(180,70,110,.14)');
  drawSparkle(layout.padding + 30, stageHeight - 216, 7, '#fff');
  drawHeart(stageWidth - layout.padding - 38, stageHeight - 216, 8, '#fff');
  ctx.restore();
}

function drawResultScreen() {
  ctx.save();
  ctx.fillStyle = 'rgba(75,39,53,.72)';
  ctx.fillRect(0, 0, stageWidth, stageHeight);
  drawShadowCard(layout.padding, stageHeight / 2 - 174, stageWidth - layout.padding * 2, 282, 28, '#fff', null);
  drawText(state.finalWin ? '挑战成功' : '整理结束', stageWidth / 2, stageHeight / 2 - 128, 30, state.finalWin ? COLORS.primaryDark : COLORS.danger, 'center', 'bold');
  drawText(starLabel(state.finalStars), stageWidth / 2, stageHeight / 2 - 100, 22, '#f5a623', 'center', 'bold');
  drawText(`${state.finalScore} 分`, stageWidth / 2, stageHeight / 2 - 74, 40, COLORS.text, 'center', 'bold');
  drawText(`击败 ${state.finalBeatPercent}% 收纳玩家`, stageWidth / 2, stageHeight / 2 - 34, 18, COLORS.primaryDark, 'center', 'bold');
  drawText(`${state.finalReason || '本局完成'} · 步数 ${state.finalSteps} · 最高 ${state.best}`, stageWidth / 2, stageHeight / 2 - 8, 13, COLORS.muted, 'center');
  drawText(resultComment(), stageWidth / 2, stageHeight / 2 + 20, 15, COLORS.text, 'center', 'bold');
  drawShadowCard(layout.primaryButton.x, stageHeight / 2 + 44, layout.primaryButton.w, 50, 25, COLORS.primary, null, 'rgba(160,60,105,.24)');
  drawGloss(layout.primaryButton.x, stageHeight / 2 + 44, layout.primaryButton.w, 50, 25);
  drawText(primaryResultLabel(), stageWidth / 2, stageHeight / 2 + 69, 17, '#fff', 'center', 'bold');
  drawShadowCard(layout.secondaryButton.x, stageHeight / 2 + 106, layout.secondaryButton.w, 48, 24, '#fff', '#ffc2d6', 'rgba(210,80,130,.12)');
  drawText('分享战绩', stageWidth / 2, stageHeight / 2 + 130, 16, COLORS.primaryDark, 'center', 'bold');
  ctx.restore();
}

function starLabel(stars) {
  return `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`;
}

function resultComment() {
  if (state.finalWin && state.mode === 'level') return state.finalNextLevel ? '下一关已经解锁' : '全部关卡已完成，继续冲分！';
  if (state.mode === 'daily') return state.finalWin ? '今日同题挑战完成，分享给朋友比同一局' : '今日挑战还差一点，重开还是同一题';
  if (state.finalBeatPercent >= 95) return '这化妆台，强迫症看了都想截图';
  if (state.finalBeatPercent >= 85) return '一格都不乱，收纳感直接拉满';
  if (state.finalBeatPercent >= 70) return '有点上头，再来一局能封神';
  if (state.finalScore >= 900) return '收纳大师，化妆台闪闪发光！';
  if (state.finalScore >= 500) return '很会整理，顾客都被治愈了';
  if (state.finalScore >= 200) return '不错，再合几次就能爆分';
  return '差一点点，换个摆放顺序试试';
}

function primaryResultLabel() {
  if (state.finalWin && state.mode === 'level') return state.finalNextLevel ? '下一关' : '再玩本关';
  if (state.finalWin && state.mode === 'daily') return '再试今日挑战';
  return state.reviveUsed ? '再来一局' : '看广告复活';
}

function drawOrder() {
  drawShadowCard(layout.padding, layout.orderY, stageWidth - layout.padding * 2, 62, 20, COLORS.card, null);
  drawGloss(layout.padding, layout.orderY, stageWidth - layout.padding * 2, 62, 20);
  drawText(state.target.title || '顾客想要', layout.padding + 18, layout.orderY + 20, 15, COLORS.muted, 'left', 'bold');
  const items = state.target.items || [state.target];
  const label = items.map((item) => `${item.done ? '✓' : ''}${itemMeta(item.type).name}${item.level}`).join(' + ');
  drawText(label, layout.padding + 18, layout.orderY + 43, Math.max(14, items.length > 2 ? 15 : 18), COLORS.text, 'left', 'bold');
  items.slice(0, 3).forEach((item, index) => {
    drawItem(item, stageWidth - layout.padding - 52 - index * 44, layout.orderY + 10, 42, item.done ? 0.35 : 1);
  });
  drawText('+100', stageWidth - layout.padding - 18, layout.orderY + 32, 20, COLORS.primaryDark, 'right', 'bold');
}

function drawGrid() {
  for (let index = 0; index < state.grid.length; index += 1) {
    const pos = cellPosition(index);
    const isBlocked = state.blockedCells.includes(index);
    const isHover = state.hoverCellIndex === index;
    const isMergeHint = state.mergeHintIndexes.includes(index);
    const fill = isBlocked ? '#f7c8d8' : isMergeHint ? '#ffd0e0' : isHover ? '#fff0f6' : COLORS.grid;
    const stroke = isBlocked ? '#d997aa' : isMergeHint ? '#ff5f9a' : isHover ? '#ff8fba' : COLORS.gridStroke;
    drawShadowCard(pos.x, pos.y, layout.cellSize, layout.cellSize, 16, fill, stroke, isMergeHint ? 'rgba(255,70,130,.24)' : 'rgba(210,80,130,.08)');
    drawGloss(pos.x, pos.y, layout.cellSize, layout.cellSize, 16);
    if (isBlocked) {
      drawText('杂物', pos.x + layout.cellSize / 2, pos.y + layout.cellSize / 2 - 8, 14, '#9f6074', 'center', 'bold');
      drawText('待清理', pos.x + layout.cellSize / 2, pos.y + layout.cellSize / 2 + 12, 11, '#9f6074', 'center');
      continue;
    }
    if (isMergeHint) drawSparkle(pos.x + layout.cellSize - 16, pos.y + 16, 7, '#fff');
    const item = state.grid[index];
    if (item) {
      const activeTarget = primaryTargetItem();
      const isTargetType = activeTarget && item.type === activeTarget.type;
      const pulse = state.mergePulse.find((entry) => entry.index === index);
      const scale = pulse ? 1 + Math.max(0, 1 - (Date.now() - pulse.startedAt) / 360) * 0.18 : 1;
      const itemSize = (layout.cellSize - 10) * scale;
      drawItem(item, pos.x + layout.cellSize / 2 - itemSize / 2, pos.y + layout.cellSize / 2 - itemSize / 2, itemSize);
      if (isTargetType) {
        drawRoundRect(pos.x + 4, pos.y + 4, layout.cellSize - 8, layout.cellSize - 8, 14, null, 'rgba(255,47,125,.75)');
        if (item.level === activeTarget.level - 1) drawText('差一点', pos.x + layout.cellSize / 2, pos.y + 14, 11, '#ff2f7d', 'center', 'bold');
      }
    } else if (isHover && state.dragging) {
      const ghostSize = layout.cellSize - 18;
      drawItem(state.dragging.item, pos.x + layout.cellSize / 2 - ghostSize / 2, pos.y + layout.cellSize / 2 - ghostSize / 2, ghostSize, 0.45);
    }
  }
  state.mergePulse = state.mergePulse.filter((entry) => Date.now() - entry.startedAt < 360);
}

function updateDragHints(x, y) {
  state.hoverCellIndex = -1;
  state.mergeHintIndexes = [];
  if (!state.dragging) return;
  const cellIndex = cellIndexAt(x, y);
  if (cellIndex < 0 || state.grid[cellIndex] || state.blockedCells.includes(cellIndex)) return;
  state.hoverCellIndex = cellIndex;
  state.mergeHintIndexes = mergeIndexesForPlacement(state.dragging.item, cellIndex);
  if (state.mergeHintIndexes.length >= 3) state.toast = '放这里会合成！';
}

function mergeIndexesForPlacement(item, cellIndex) {
  const indexes = [cellIndex];
  state.grid.forEach((gridItem, index) => {
    if (gridItem && gridItem.type === item.type && gridItem.level === item.level) indexes.push(index);
  });
  return indexes.length >= 3 ? indexes.slice(0, 3) : [];
}

function drawSource() {
  drawText('化妆包', layout.padding, layout.sourceTop - 20, 16, COLORS.text, 'left', 'bold');
  for (let index = 0; index < state.source.length; index += 1) {
    const pos = sourcePosition(index);
    drawShadowCard(pos.x, pos.y, layout.sourceSize, layout.sourceSize, 18, COLORS.card, '#ffc2d6', 'rgba(210,80,130,.14)');
    const item = state.source[index];
    if (item && (!state.dragging || state.dragging.sourceIndex !== index)) {
      drawItem(item, pos.x, pos.y, layout.sourceSize);
    }
  }
}

function drawButtons() {
  layout.buttons.forEach((button) => {
    let label = button.label;
    let color = button.color;
    if (state.gameOver && button.action === 'refresh') label = '再来';
    if (state.gameOver && button.action !== 'refresh') color = '#d6b8c4';
    if (button.action === 'undo' && state.history.length === 0) color = '#d6b8c4';
    if (button.action === 'revive' && state.reviveUsed) color = '#d6b8c4';
    if (button.action === 'revive' && !state.gameOver) label = '救急';
    drawShadowCard(button.x, button.y, button.w, button.h, 22, color, null, 'rgba(160,60,105,.22)');
    drawGloss(button.x, button.y, button.w, button.h, 22);
    drawText(label, button.x + button.w / 2, button.y + 24, 16, '#fff', 'center', 'bold');
  });
}

function drawAdPlaceholder() {
  if (state.screen !== 'playing') return;
  const text = AD_CONFIG.rewardedVideoAdUnitId ? '激励视频已配置' : '广告占位：撤回 / 复活后续接激励视频，刷新扣 20 分';
  drawRoundRect(layout.padding, layout.buttons[0].y - 34, stageWidth - layout.padding * 2, 24, 12, 'rgba(255,255,255,.72)', null);
  drawText(text, stageWidth / 2, layout.buttons[0].y - 22, 12, COLORS.muted, 'center');
}

function drawGameOver() {
  ctx.save();
  ctx.fillStyle = 'rgba(67,48,43,.72)';
  ctx.fillRect(0, 0, stageWidth, stageHeight);
  drawRoundRect(layout.padding, stageHeight / 2 - 112, stageWidth - layout.padding * 2, 190, 24, '#fff', null);
  drawText('化妆台放满了', stageWidth / 2, stageHeight / 2 - 66, 28, COLORS.danger, 'center', 'bold');
  drawText(`本局得分 ${state.score}`, stageWidth / 2, stageHeight / 2 - 20, 20, COLORS.text, 'center', 'bold');
  drawText(state.reviveUsed ? '点击再来重新开始' : '点击复活清理低级物品', stageWidth / 2, stageHeight / 2 + 22, 15, COLORS.muted, 'center');
  ctx.restore();
}

function drawEffects() {
  const now = Date.now();
  state.particles = state.particles.filter((particle) => now - particle.startedAt < particle.life);
  state.particles.forEach((particle) => {
    const age = now - particle.startedAt;
    const progress = age / particle.life;
    const x = particle.x + particle.vx * progress;
    const y = particle.y + particle.vy * progress + 24 * progress * progress;
    ctx.save();
    ctx.globalAlpha = 1 - progress;
    const size = particle.size * (1 - progress * 0.25);
    if (particle.shape === 'heart') drawHeart(x, y, size, particle.color);
    else if (particle.shape === 'sparkle') drawSparkle(x, y, size, particle.color);
    else {
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

function drawFloatingTexts() {
  const now = Date.now();
  state.floatingTexts = state.floatingTexts.filter((text) => now - text.startedAt < text.life);
  state.floatingTexts.forEach((text) => {
    const progress = (now - text.startedAt) / text.life;
    ctx.save();
    ctx.globalAlpha = 1 - progress;
    drawText(text.label, text.x, text.y - progress * 42, text.size + Math.sin(progress * Math.PI) * 8, text.color, 'center', 'bold');
    ctx.restore();
  });
}

function addFloatingText(label, x, y, color = COLORS.primaryDark, size = 22) {
  state.floatingTexts.push({ label, x, y, color, size, life: 760, startedAt: Date.now() });
}

function addBurst(x, y, color) {
  for (let index = 0; index < 18; index += 1) {
    const angle = (Math.PI * 2 * index) / 18;
    const speed = 36 + Math.random() * 44;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 3,
      color: index % 3 === 0 ? '#ffffff' : color,
      shape: index % 5 === 0 ? 'heart' : index % 2 === 0 ? 'sparkle' : 'dot',
      life: 520 + Math.random() * 180,
      startedAt: Date.now()
    });
  }
}

function cellPosition(index) {
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;
  return {
    x: layout.gridLeft + col * (layout.cellSize + CELL_GAP),
    y: layout.gridTop + row * (layout.cellSize + CELL_GAP)
  };
}

function sourcePosition(index) {
  return {
    x: layout.padding + index * (layout.sourceSize + layout.sourceGap),
    y: layout.sourceTop
  };
}

function sourceIndexAt(x, y) {
  return state.source.findIndex((item, index) => {
    if (!item) return false;
    const pos = sourcePosition(index);
    return x >= pos.x && x <= pos.x + layout.sourceSize && y >= pos.y && y <= pos.y + layout.sourceSize;
  });
}

function cellIndexAt(x, y) {
  const tolerance = Math.min(16, CELL_GAP + 8);
  for (let index = 0; index < state.grid.length; index += 1) {
    if (state.blockedCells.includes(index)) continue;
    const pos = cellPosition(index);
    if (x >= pos.x - tolerance && x <= pos.x + layout.cellSize + tolerance && y >= pos.y - tolerance && y <= pos.y + layout.cellSize + tolerance) return index;
  }
  return -1;
}

function touchPoint(event) {
  const touch = event.changedTouches[0] || event.touches[0];
  if (!touch) return null;
  return { x: touch.clientX, y: touch.clientY };
}

function onTouchStart(event) {
  const point = touchPoint(event);
  if (!point) return;
  if (state.screen === 'start') {
    handleStartTouch(point.x, point.y);
    return;
  }
  if (state.screen === 'settings') {
    handleSettingsTouch(point.x, point.y);
    return;
  }
  if (state.screen === 'result') {
    handleResultTouch(point.x, point.y);
    return;
  }
  if (state.guideStep > 0) {
    advanceGuide();
    return;
  }
  const action = buttonActionAt(point.x, point.y);
  if (action) {
    handleAction(action);
    return;
  }
  if (state.gameOver) return;
  const sourceIndex = sourceIndexAt(point.x, point.y);
  if (sourceIndex >= 0) {
    state.dragging = { sourceIndex, item: state.source[sourceIndex], x: point.x, y: point.y };
    updateDragHints(point.x, point.y);
  }
}

function handleStartTouch(x, y) {
  if (isRectHit(layout.settingsButton, x, y)) {
    playSound('button');
    state.screen = 'settings';
    return;
  }
  const button = layout.modeButtons.find((entry) => isRectHit(entry, x, y));
  if (!button) return;
  playSound('button');
  if (button.action === 'endless') resetGame('endless', state.levelIndex);
  if (button.action === 'level') resetGame('level', state.levelIndex);
  if (button.action === 'daily') resetGame('daily', state.levelIndex);
}

function handleSettingsTouch(x, y) {
  const item = layout.settingsItems.find((entry) => isRectHit(entry, x, y));
  if (!item) return;
  playSound('button');
  if (item.action === 'toggleSound') state.soundEnabled = !state.soundEnabled;
  if (item.action === 'toggleMusic') {
    state.musicEnabled = !state.musicEnabled;
    updateMusic();
  }
  if (item.action === 'toggleVibration') state.vibrationEnabled = !state.vibrationEnabled;
  if (item.action === 'resetGuide') {
    state.guideCompleted = false;
    state.guideStep = 0;
    state.toast = '下次开局会显示新手引导';
  }
  if (item.action === 'closeSettings') state.screen = 'start';
  saveSettings();
}

function advanceGuide() {
  playSound('button');
  if (state.guideStep >= 3) {
    state.guideStep = 0;
    state.guideCompleted = true;
    saveSettings();
    return;
  }
  state.guideStep += 1;
}

function handleResultTouch(x, y) {
  const replayButton = { ...layout.primaryButton, y: stageHeight / 2 + 44, h: 50 };
  const shareButton = { ...layout.secondaryButton, y: stageHeight / 2 + 106, h: 48 };
  if (isRectHit(replayButton, x, y)) {
    playSound('button');
    if (state.finalWin && state.mode === 'level') {
      resetGame('level', Math.min(state.levelIndex, LEVELS.length - 1));
      return;
    }
    if (state.finalWin && state.mode === 'daily') {
      resetGame('daily', state.levelIndex);
      return;
    }
    if (!state.reviveUsed) {
      showRewardedAd('复活继续', reviveGame);
      return;
    }
    resetGame(state.mode, state.levelIndex);
    return;
  }
  if (isRectHit(shareButton, x, y)) shareGame();
}

function onTouchMove(event) {
  if (!state.dragging) return;
  const point = touchPoint(event);
  if (!point) return;
  state.dragging.x = point.x;
  state.dragging.y = point.y;
  updateDragHints(point.x, point.y);
}

function onTouchEnd(event) {
  if (!state.dragging) return;
  const point = touchPoint(event);
  if (!point) {
    state.dragging = null;
    return;
  }
  const cellIndex = cellIndexAt(point.x, point.y);
  if (cellIndex >= 0 && !state.grid[cellIndex]) {
    placeItem(cellIndex, state.dragging);
  }
  state.dragging = null;
  state.hoverCellIndex = -1;
  state.mergeHintIndexes = [];
}

function placeItem(cellIndex, dragging) {
  snapshotState();
  state.grid[cellIndex] = dragging.item;
  state.source[dragging.sourceIndex] = null;
  state.steps += 1;
  state.toast = '摆放成功';
  playSound('place');
  applyStorageBonus(cellIndex, dragging.item);
  resolveMerges(cellIndex);
  checkOrder();
  refillSourceIfNeeded();
  warnIfAlmostFull();
  checkGameState();
}

function warnIfAlmostFull() {
  const emptyCount = state.grid.filter((cell, index) => !cell && !state.blockedCells.includes(index)).length;
  if (emptyCount <= 2 && !state.gameOver) {
    state.toast = '快满了，优先找能合成的位置！';
    addFloatingText('快满预警', stageWidth / 2, layout.gridTop + 20, '#ff2f7d', 22);
  }
}

function applyStorageBonus(cellIndex, item) {
  const adjacentCount = adjacentIndexes(cellIndex).filter((index) => {
    const gridItem = state.grid[index];
    return gridItem && gridItem.type === item.type;
  }).length;
  if (adjacentCount > 0) {
    const bonus = adjacentCount * 5;
    state.score += bonus;
    const pos = cellPosition(cellIndex);
    addFloatingText(`整齐 +${bonus}`, pos.x + layout.cellSize / 2, pos.y + layout.cellSize / 2, '#d94278', 18);
  }

  const rowStart = Math.floor(cellIndex / GRID_SIZE) * GRID_SIZE;
  const rowItems = state.grid.slice(rowStart, rowStart + GRID_SIZE);
  if (rowItems.every((gridItem) => gridItem && gridItem.type === item.type)) {
    state.score += 30;
    state.sameRowMade += 1;
    const pos = cellPosition(rowStart + 1);
    addFloatingText('一排同类 +30', pos.x + layout.cellSize, pos.y + layout.cellSize / 2, '#ff2f7d', 22);
  }
}

function adjacentIndexes(cellIndex) {
  const row = Math.floor(cellIndex / GRID_SIZE);
  const col = cellIndex % GRID_SIZE;
  const indexes = [];
  if (row > 0) indexes.push(cellIndex - GRID_SIZE);
  if (row < GRID_SIZE - 1) indexes.push(cellIndex + GRID_SIZE);
  if (col > 0) indexes.push(cellIndex - 1);
  if (col < GRID_SIZE - 1) indexes.push(cellIndex + 1);
  return indexes;
}

function resolveMerges(preferredIndex = -1) {
  let changed = true;
  while (changed) {
    changed = false;
    const groups = new Map();
    state.grid.forEach((item, index) => {
      if (!item || item.level >= MAX_LEVEL) return;
      const key = `${item.type}-${item.level}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(index);
    });
    groups.forEach((indexes) => {
      if (changed || indexes.length < 3) return;
      const keepIndex = indexes.includes(preferredIndex) ? preferredIndex : indexes[0];
      const removeIndexes = indexes.filter((index) => index !== keepIndex).slice(0, 2);
      const keepItem = state.grid[keepIndex];
      state.grid[keepIndex] = makeItem(keepItem.type, keepItem.level + 1);
      removeIndexes.forEach((index) => {
        state.grid[index] = null;
      });
      if (keepItem.level + 1 >= 3) state.level3Made += 1;
      state.score += 30 * keepItem.level;
      state.toast = '合成成功！';
      state.mergePulse.push({ index: keepIndex, startedAt: Date.now() });
      const pos = cellPosition(keepIndex);
      const color = itemMeta(keepItem.type).colors[Math.min(keepItem.level, 2)];
      addBurst(pos.x + layout.cellSize / 2, pos.y + layout.cellSize / 2, color);
      addComboText(pos.x + layout.cellSize / 2, pos.y + layout.cellSize / 2);
      playSound('merge');
      vibrate('short');
      preferredIndex = keepIndex;
      changed = true;
    });
  }
}

function checkOrder() {
  const items = state.target.items || [state.target];
  let delivered = false;
  items.forEach((targetItem) => {
    if (targetItem.done) return;
    const index = state.grid.findIndex((item) => item && item.type === targetItem.type && item.level >= targetItem.level);
    if (index < 0) return;
    const pos = cellPosition(index);
    addBurst(pos.x + layout.cellSize / 2, pos.y + layout.cellSize / 2, COLORS.primary);
    addFloatingText(orderSlogan(), pos.x + layout.cellSize / 2, pos.y + layout.cellSize / 2, COLORS.primaryDark, 24);
    state.grid[index] = null;
    targetItem.done = true;
    state.score += 100 * targetItem.level;
    delivered = true;
  });

  if (!delivered) return;
  if (items.every((item) => item.done)) {
    if (items.length > 1) state.score += 120 * items.length;
    state.ordersCompleted += 1;
    state.target = makeTarget();
    state.toast = items.length > 1 ? '组合妆包完成！' : '订单完成！';
    playSound('order');
    vibrate('long');
    saveBest();
  } else {
    state.toast = '订单材料已收纳，继续补齐！';
  }
}

function addComboText(x, y) {
  const now = Date.now();
  state.combo = now - state.comboStartedAt < 1600 ? state.combo + 1 : 1;
  state.comboStartedAt = now;
  const label = state.combo >= 2 ? `Combo x${state.combo}｜强迫症狂喜` : '合成爽了！';
  addFloatingText(label, x, y, state.combo >= 3 ? '#ff2f7d' : COLORS.primaryDark, state.combo >= 3 ? 26 : 22);
}

function orderSlogan() {
  const slogans = ['一格都不乱！', '这波太治愈了', '收纳感拉满', '顾客直接种草'];
  return slogans[state.ordersCompleted % slogans.length];
}

function completeChallenge() {
  state.score += state.levelConfig.reward;
  state.finalWin = true;
  state.finalNextLevel = state.mode === 'level' && state.levelIndex < LEVELS.length - 1;
  finishGame(`完成 ${state.levelConfig.targetOrders} 个订单`);
  if (state.mode === 'level' && state.levelIndex < LEVELS.length - 1) {
    state.levelIndex += 1;
    saveLevelProgress();
  }
}

function refillSourceIfNeeded() {
  if (state.source.every((item) => !item)) state.source = makeSource();
}

function refreshSource() {
  if (state.gameOver) return;
  if (state.score < 20) {
    state.toast = '分数不足，至少 20 分才能刷新';
    playSound('fail');
    return;
  }
  snapshotState();
  state.score -= 20;
  state.refreshCount += 1;
  state.source = makeSource();
  state.toast = '已刷新，扣 20 分';
  playSound('button');
}

function refreshSourceByAd() {
  if (state.gameOver) return;
  snapshotState();
  state.refreshCount += 1;
  state.source = makeSource();
  state.toast = '广告奖励：免费刷新一次';
  playSound('button');
}

function undoMove() {
  const snapshot = state.history.pop();
  if (!snapshot) {
    state.toast = '没有可撤回的步骤';
    return;
  }
  restoreSnapshot(snapshot);
  state.toast = '已撤回上一步';
  playSound('button');
}

function reviveGame() {
  if (state.reviveUsed) {
    state.toast = '本局已用过复活';
    return;
  }
  if (state.blockedCells.length > 0) {
    const cleared = state.blockedCells.splice(0, Math.min(2, state.blockedCells.length));
    state.clearedBlocked += cleared.length;
    cleared.forEach((index) => {
      const pos = cellPosition(index);
      addBurst(pos.x + layout.cellSize / 2, pos.y + layout.cellSize / 2, '#fb7185');
    });
    state.reviveUsed = true;
    state.gameOver = false;
    state.screen = 'playing';
    state.toast = '复活成功，已清理杂物格';
    playSound('order');
    vibrate('long');
    return;
  }
  const occupiedIndexes = state.grid
    .map((item, index) => ({ item, index }))
    .filter((entry) => entry.item)
    .sort((left, right) => left.item.level - right.item.level)
    .slice(0, 4);
  if (occupiedIndexes.length === 0) return;
  occupiedIndexes.forEach((entry) => {
    state.grid[entry.index] = null;
  });
  state.reviveUsed = true;
  state.gameOver = false;
  state.screen = 'playing';
  if (state.levelConfig && state.steps >= state.levelConfig.moveLimit) {
    state.levelConfig.moveLimit += 5;
    state.toast = '复活成功，额外获得 5 步';
  } else {
    state.toast = '复活成功，已清理低级物品';
  }
  addBurst(stageWidth / 2, layout.gridTop + layout.gridWidth / 2, '#fb7185');
  playSound('order');
  vibrate('long');
}

function handleAction(action) {
  if (action === 'undo') {
    if (state.history.length === 0) {
      state.toast = '没有可撤回的步骤';
      playSound('fail');
      return;
    }
    showRewardedAd('撤回一步', undoMove);
    return;
  }
  if (action === 'refresh') {
    refreshSource();
    return;
  }
  if (action === 'revive') showRewardedAd('复活继续', reviveGame);
}

function checkGameState() {
  if (state.levelConfig && isLevelGoalComplete()) {
    completeChallenge();
    return;
  }
  if (state.levelConfig && state.steps >= state.levelConfig.moveLimit) {
    finishGame('步数用完了');
    return;
  }
  if (state.grid.some((cell, index) => !cell && !state.blockedCells.includes(index))) return;
  finishGame('化妆台放满了');
}

function isLevelGoalComplete() {
  if (!state.levelConfig) return false;
  if (state.levelConfig.goalType === 'clearBlocked') return (state.clearedBlocked || 0) >= state.levelConfig.goalCount;
  if (state.levelConfig.goalType === 'makeLevel3') return state.level3Made >= state.levelConfig.goalCount;
  if (state.levelConfig.goalType === 'sameRow') return state.sameRowMade >= state.levelConfig.goalCount;
  return state.ordersCompleted >= state.levelConfig.targetOrders;
}

function finishGame(reason) {
  state.gameOver = true;
  state.screen = 'result';
  state.finalScore = state.score;
  state.finalSteps = state.steps;
  state.finalBeatPercent = beatPercent(state.score);
  state.finalStars = calculateStars();
  state.finalReason = reason;
  state.toast = '';
  updateShareImage();
  playSound(state.finalWin ? 'order' : 'fail');
  if (state.finalWin) vibrate('long');
  saveBest();
  showInterstitialAd();
}

function calculateStars() {
  if (!state.finalWin) return 1;
  let stars = 3;
  if (state.reviveUsed) stars -= 1;
  if (state.refreshCount > 1) stars -= 1;
  if (state.levelConfig && state.steps > state.levelConfig.moveLimit * 0.86) stars -= 1;
  return Math.max(1, stars);
}

function updateShareImage() {
  try {
    const shareCanvas = wx.createCanvas();
    shareCanvas.width = 500;
    shareCanvas.height = 400;
    const shareCtx = shareCanvas.getContext('2d');
    drawShareCard(shareCtx, 500, 400);
    if (shareCanvas.toTempFilePath) {
      shareCanvas.toTempFilePath({
        success: (result) => {
          state.shareImageUrl = result.tempFilePath;
        },
        fail: () => {
          state.shareImageUrl = 'assets/share-card.png';
        }
      });
    }
  } catch (error) {
    state.shareImageUrl = 'assets/share-card.png';
  }
}

function drawShareCard(targetCtx, width, height) {
  const oldCtx = ctx;
  const oldStageWidth = stageWidth;
  const oldStageHeight = stageHeight;
  ctx = targetCtx;
  stageWidth = width;
  stageHeight = height;
  drawCreamBackground();
  drawShadowCard(36, 44, width - 72, height - 88, 28, '#fff', '#ffc2d6');
  drawText(GAME_TITLE, width / 2, 94, 34, COLORS.text, 'center', 'bold');
  drawText(GAME_SUBTITLE, width / 2, 130, 18, COLORS.primaryDark, 'center', 'bold');
  drawText(`${state.finalScore} 分`, width / 2, 194, 48, COLORS.primaryDark, 'center', 'bold');
  drawText(`${starLabel(state.finalStars)} · 击败 ${state.finalBeatPercent}% 收纳玩家`, width / 2, 242, 22, COLORS.text, 'center', 'bold');
  drawText(`完成 ${state.ordersCompleted} 单 · ${state.finalSteps} 步`, width / 2, 280, 18, COLORS.muted, 'center');
  drawText(state.mode === 'daily' ? '每日同题，来比同一局' : '一格都不能乱，来挑战我', width / 2, 324, 20, COLORS.primaryDark, 'center', 'bold');
  ctx = oldCtx;
  stageWidth = oldStageWidth;
  stageHeight = oldStageHeight;
}

function shareGame() {
  playSound('button');
  try {
    wx.shareAppMessage(makeShareMessage());
  } catch (error) {
    state.toast = '点击右上角也可以分享';
  }
}

function isRectHit(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function buttonActionAt(x, y) {
  const button = layout.buttons.find((entry) => isRectHit(entry, x, y));
  return button ? button.action : null;
}

wx.onTouchStart(onTouchStart);
wx.onTouchMove(onTouchMove);
wx.onTouchEnd(onTouchEnd);
wx.onShow(() => {
  updateLayout();
  updateMusic();
});

if (wx.onHide) {
  wx.onHide(() => {
    try {
      if (sounds.bgm) sounds.bgm.pause ? sounds.bgm.pause() : sounds.bgm.stop();
    } catch (error) {}
  });
}

loadBest();
setupSounds();
setupShareMenu();
setupAds();
updateLayout();
preparePreviewGame();
state.screen = 'start';
state.mode = 'endless';
updateMusic();
render();
