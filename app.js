/**
 * Ariana Grande Greatest Hits - Application Logic
 */

// Application State
const state = {
  currentEra: 'all',
  currentMood: 'all',
  searchQuery: '',
  activeTab: 'all', // 'all' | 'favorites' | 'hall-of-fame'
  favorites: JSON.parse(localStorage.getItem('ariana_favs') || '[]'),
  currentPlayingVideo: null
};

// DOM Elements
const songsGrid = document.getElementById('songs-grid');
const searchInput = document.getElementById('search-input');
const eraFiltersContainer = document.getElementById('era-filters');
const moodFiltersContainer = document.getElementById('mood-filters');
const songCountEl = document.getElementById('song-count');
const favoritesBadge = document.getElementById('fav-count-badge');
const hallOfFameGrid = document.getElementById('hall-of-fame-grid');
const randomFactEl = document.getElementById('fun-fact-text');

// Modals
const videoModal = document.getElementById('video-modal');
const videoFrame = document.getElementById('video-frame');
const videoTitle = document.getElementById('video-modal-title');
const videoSubtitle = document.getElementById('video-modal-subtitle');
const videoCloseBtn = document.getElementById('video-modal-close');

const quizModal = document.getElementById('quiz-modal');
const quizCloseBtn = document.getElementById('quiz-modal-close');
const quizContainer = document.getElementById('quiz-content');

const randomModal = document.getElementById('random-modal');
const randomCloseBtn = document.getElementById('random-modal-close');
const randomResultContainer = document.getElementById('random-result-box');

// Toast Notification
function showToast(message, icon = '💖') {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  const toastIcon = document.getElementById('toast-icon');
  
  toastMsg.textContent = message;
  toastIcon.textContent = icon;
  
  toast.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

// Save Favorites
function toggleFavorite(songId, event) {
  if (event) event.stopPropagation();
  const index = state.favorites.indexOf(songId);
  const song = ARIANA_SONGS.find(s => s.id === songId);
  
  if (index === -1) {
    state.favorites.push(songId);
    showToast(`เพิ่ม "${song.title}" เข้าในเพลงโปรดแล้ว!`, '⭐');
  } else {
    state.favorites.splice(index, 1);
    showToast(`นำ "${song.title}" ออกจากเพลงโปรดแล้ว`, '💔');
  }
  
  localStorage.setItem('ariana_favs', JSON.stringify(state.favorites));
  updateFavoritesBadge();
  renderSongs();
  renderHallOfFame();
}

function updateFavoritesBadge() {
  if (favoritesBadge) {
    favoritesBadge.textContent = state.favorites.length;
    favoritesBadge.style.display = state.favorites.length > 0 ? 'inline-flex' : 'none';
  }
}

// Open Video Modal
function openVideoModal(songId) {
  const song = ARIANA_SONGS.find(s => s.id === songId);
  if (!song) return;

  state.currentPlayingVideo = song;
  videoTitle.textContent = `${song.title} ${song.feat ? song.feat : ''}`;
  videoSubtitle.textContent = `อัลบั้ม ${song.album} (${song.year}) • สถิติ: ${song.billboardPeak}`;
  videoFrame.src = `https://www.youtube-nocookie.com/embed/${song.youtubeId}?autoplay=1&rel=0`;

  videoModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
  videoModal.classList.remove('open');
  videoFrame.src = '';
  state.currentPlayingVideo = null;
  document.body.style.overflow = '';
}

// Copy Lyric to Clipboard
function copyLyric(songId, event) {
  if (event) event.stopPropagation();
  const song = ARIANA_SONGS.find(s => s.id === songId);
  if (!song) return;

  const textToCopy = `${song.iconicLyricEn}\n${song.iconicLyricTh}\n— Ariana Grande (${song.title})`;
  navigator.clipboard.writeText(textToCopy).then(() => {
    showToast(`คัดลอกท่อนจำของ "${song.title}" แล้ว! ✨`, '📋');
  }).catch(() => {
    showToast(`คัดลอกสำเร็จ: ${song.title}`, '📋');
  });
}

// Render Era Filters
function renderEraFilters() {
  eraFiltersContainer.innerHTML = ERAS.map(era => `
    <button 
      class="filter-btn px-4 py-2 rounded-full text-xs md:text-sm font-medium border border-white/10 glass-panel flex items-center gap-1.5 whitespace-nowrap ${state.currentEra === era.id ? 'active' : 'text-gray-300 hover:text-white hover:bg-white/5'}"
      data-era="${era.id}"
      onclick="setEraFilter('${era.id}')"
    >
      <span>${era.icon}</span>
      <span>${era.name}</span>
      <span class="text-[11px] opacity-60">(${era.year})</span>
    </button>
  `).join('');
}

function setEraFilter(eraId) {
  state.currentEra = eraId;
  renderEraFilters();
  renderSongs();
}

// Render Mood Filters
function renderMoodFilters() {
  moodFiltersContainer.innerHTML = MOODS.map(mood => `
    <button 
      class="filter-btn px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-medium border border-white/10 glass-panel flex items-center gap-1.5 whitespace-nowrap ${state.currentMood === mood.id ? 'active' : 'text-gray-300 hover:text-white hover:bg-white/5'}"
      data-mood="${mood.id}"
      onclick="setMoodFilter('${mood.id}')"
    >
      <span>${mood.icon}</span>
      <span>${mood.label}</span>
    </button>
  `).join('');
}

function setMoodFilter(moodId) {
  state.currentMood = moodId;
  renderMoodFilters();
  renderSongs();
}

// Filter and Filter Logic
function getFilteredSongs() {
  return ARIANA_SONGS.filter(song => {
    // Era filter
    if (state.currentEra !== 'all' && song.era !== state.currentEra) {
      return false;
    }
    
    // Mood filter
    if (state.currentMood !== 'all' && song.mood !== state.currentMood) {
      return false;
    }
    
    // Tab filter (favorites)
    if (state.activeTab === 'favorites' && !state.favorites.includes(song.id)) {
      return false;
    }
    
    // Search query filter
    if (state.searchQuery.trim() !== '') {
      const q = state.searchQuery.toLowerCase().trim();
      const matchTitle = song.title.toLowerCase().includes(q);
      const matchFeat = song.feat.toLowerCase().includes(q);
      const matchAlbum = song.album.toLowerCase().includes(q);
      const matchLyrics = song.iconicLyricEn.toLowerCase().includes(q) || song.iconicLyricTh.toLowerCase().includes(q);
      const matchTags = song.moodTags.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchFeat && !matchAlbum && !matchLyrics && !matchTags) {
        return false;
      }
    }
    
    return true;
  });
}

// Render Hall of Fame (Top 5 Hits Spotlight)
function renderHallOfFame() {
  const topHits = ARIANA_SONGS.filter(s => s.isHallOfFame).sort((a, b) => a.hallOfFameRank - b.hallOfFameRank);
  
  hallOfFameGrid.innerHTML = topHits.map((song, idx) => {
    const isFav = state.favorites.includes(song.id);
    return `
      <div class="glass-card rounded-2xl p-5 relative overflow-hidden group flex flex-col justify-between border-t-2" style="border-top-color: ${song.color}">
        <!-- Top Rank Ribbon -->
        <div class="flex items-center justify-between mb-3">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold badge-hall-of-fame text-pink-300">
            <span>🏆 TOP #${idx + 1}</span>
            <span>•</span>
            <span>${song.album}</span>
          </span>
          <button 
            onclick="toggleFavorite('${song.id}', event)"
            title="บันทึกเพลงโปรด"
            class="p-2 rounded-full hover:bg-white/10 transition text-gray-400 ${isFav ? 'heart-active' : ''}"
          >
            <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
        </div>

        <!-- Song Info -->
        <div class="mb-4">
          <h3 class="text-xl md:text-2xl font-bold font-display text-white group-hover:text-pink-300 transition-colors flex items-center gap-2">
            ${song.title}
            ${song.feat ? `<span class="text-xs font-normal text-pink-400">(${song.feat})</span>` : ''}
          </h3>
          <p class="text-xs text-pink-300/80 mt-1 font-medium">⚡ ${song.billboardPeak} • 🎧 ${song.streams}</p>
        </div>

        <!-- Lyric Quote -->
        <div class="p-3.5 rounded-xl bg-black/40 border border-white/5 mb-4 text-xs italic text-gray-300 relative">
          <span class="text-pink-400 text-lg leading-none select-none">“</span>
          <span>${song.iconicLyricTh}</span>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2 pt-2 border-t border-white/5">
          <button 
            onclick="openVideoModal('${song.id}')"
            class="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-pink-500/20 active:scale-95 transition"
          >
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            ดู Music Video
          </button>
          <button 
            onclick="copyLyric('${song.id}', event)"
            title="คัดลอกท่อนจำ"
            class="p-2.5 rounded-xl glass-panel text-gray-300 hover:text-white hover:bg-white/10 active:scale-95 transition"
          >
            📋
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Render Song Cards Grid
function renderSongs() {
  const songs = getFilteredSongs();
  songCountEl.textContent = `${songs.length} เพลง`;

  if (songs.length === 0) {
    songsGrid.innerHTML = `
      <div class="col-span-full py-16 text-center">
        <div class="text-5xl mb-4">☁️</div>
        <h3 class="text-xl font-bold text-gray-200">ไม่พบเพลงที่ตรงกับการค้นหา</h3>
        <p class="text-sm text-gray-400 mt-2">ลองค้นหาด้วยคำอื่น หรือกดรีเซ็ตตัวกรองเพื่อดูเพลงทั้งหมดของ Ariana</p>
        <button 
          onclick="resetFilters()"
          class="mt-5 px-6 py-2.5 rounded-full bg-pink-600 hover:bg-pink-500 text-white font-medium text-xs transition"
        >
          รีเซ็ตตัวกรองทั้งหมด
        </button>
      </div>
    `;
    return;
  }

  songsGrid.innerHTML = songs.map((song) => {
    const isFav = state.favorites.includes(song.id);
    return `
      <div class="glass-card rounded-2xl p-5 flex flex-col justify-between group relative overflow-hidden transition-all duration-300">
        <!-- Accent Glow line -->
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r" style="background-image: linear-gradient(to right, ${song.color}, transparent);"></div>

        <!-- Header: Badge & Favorite button -->
        <div class="flex items-center justify-between mb-3">
          <span class="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/5 border border-white/10 text-pink-300">
            ${song.badge}
          </span>
          <button 
            onclick="toggleFavorite('${song.id}', event)"
            title="เพิ่ม/ลบ เพลงโปรด"
            class="p-1.5 rounded-full hover:bg-white/10 text-gray-400 transition ${isFav ? 'heart-active' : ''}"
          >
            <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
        </div>

        <!-- Song Title & Era -->
        <div class="mb-3">
          <div class="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
            ${song.album} (${song.year})
          </div>
          <h4 class="text-xl font-bold font-display text-white group-hover:text-pink-300 transition-colors">
            ${song.title}
          </h4>
          ${song.feat ? `<p class="text-xs text-pink-400/90 font-medium">${song.feat}</p>` : ''}
        </div>

        <!-- Stats Chips -->
        <div class="flex flex-wrap gap-1.5 mb-3 text-[11px]">
          <span class="px-2 py-0.5 rounded-md bg-purple-950/60 text-purple-300 border border-purple-800/40 font-medium">
            🏆 ${song.billboardPeak}
          </span>
          <span class="px-2 py-0.5 rounded-md bg-pink-950/60 text-pink-300 border border-pink-800/40 font-medium">
            🎧 ${song.streams}
          </span>
        </div>

        <!-- Iconic Lyric Preview -->
        <div class="p-3 rounded-xl bg-black/40 border border-white/5 mb-3">
          <p class="text-[11px] text-pink-200/90 font-mono italic line-clamp-2">
            ${song.iconicLyricEn}
          </p>
          <p class="text-[11px] text-gray-400 mt-1 line-clamp-2">
            ${song.iconicLyricTh}
          </p>
        </div>

        <!-- Story / Trivia preview -->
        <p class="text-xs text-gray-400 line-clamp-3 mb-4 leading-relaxed">
          ${song.story}
        </p>

        <!-- Tags -->
        <div class="flex flex-wrap gap-1 mb-4">
          ${song.moodTags.map(tag => `
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/5">#${tag}</span>
          `).join('')}
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2 pt-2 border-t border-white/5">
          <button 
            onclick="openVideoModal('${song.id}')"
            class="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-pink-600 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            ดู MV เพลงนี้
          </button>
          <button 
            onclick="copyLyric('${song.id}', event)"
            title="คัดลอกท่อนจำไปแชร์"
            class="p-2 rounded-xl glass-panel text-gray-300 hover:text-white hover:bg-white/10 active:scale-95 transition"
          >
            📋
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function resetFilters() {
  state.currentEra = 'all';
  state.currentMood = 'all';
  state.searchQuery = '';
  state.activeTab = 'all';
  searchInput.value = '';
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector('.tab-btn[data-tab="all"]')?.classList.add('active');
  renderEraFilters();
  renderMoodFilters();
  renderSongs();
  showToast('รีเซ็ตตัวกรองเรียบร้อยแล้ว', '✨');
}

// Interactive Quiz System: "Which Ariana Hit Are You?"
const QUIZ_QUESTIONS = [
  {
    question: "1. วันนี้ระดับพลังงานและอารมณ์ของคุณเป็นแบบไหน?",
    options: [
      { text: "🔥 มั่นใจเต็มร้อย ตัวแม่จะแคร์เพื่อ รวย สวย เริ่ด!", mood: "banger", songId: "7-rings" },
      { text: "💔 ใจหน่วง ๆ กำลังเยียวยาจากความรัก อยากเต้นทั้งน้ำตา", mood: "heartbreak", songId: "we-cant-be-friends" },
      { text: "✨ ได้เวลา Move On รักตัวเอง คนต่อไปที่จะรักคือตัวฉันเอง", mood: "uplifting", songId: "thank-u-next" },
      { text: "🌙 สบาย ๆ ดึกแล้ว ชิลล์ ๆ อยากฟังดนตรี R&B ละมุนหู", mood: "chill-rnb", songId: "positions" }
    ]
  },
  {
    question: "2. ถ้าให้เลือกบรรยากาศที่อยากอยู่ตอนนี้?",
    options: [
      { text: "🛍️ ช้อปปิ้ง Tiffany & Co. กับแก๊งเพื่อนสนิท พร้อมรูดการ์ดรัว ๆ", mood: "banger", songId: "7-rings" },
      { text: "🌧️ เต้นท่ามกลางสายฝน ปลดปล่อยทุกความเศร้าให้ไหลไป", mood: "uplifting", songId: "rain-on-me" },
      { text: "🕯️ อยู่ในห้องนอนแสงสลัว จุดเทียนหอมกับคนพิเศษ", mood: "chill-rnb", songId: "pov" },
      { text: "🎬 นั่งดูหนังเก่า ย้อนคิดถึงความทรงจำที่ไม่อาจลืม", mood: "heartbreak", songId: "we-cant-be-friends" }
    ]
  },
  {
    question: "3. ประโยคประจำใจที่ตรงกับคุณที่สุดในเวลานี้?",
    options: [
      { text: '"I see it, I like it, I want it, I got it"', mood: "banger", songId: "7-rings" },
      { text: '"One taught me love, one taught me patience... now I\'m so amazing"', mood: "uplifting", songId: "thank-u-next" },
      { text: '"Ain\'t got no tears left to cry, so I\'m pickin\' it up"', mood: "uplifting", songId: "no-tears-left-to-cry" },
      { text: '"We can\'t be friends, but I\'d like to just pretend"', mood: "heartbreak", songId: "we-cant-be-friends" }
    ]
  }
];

let quizAnswers = [];
let currentQuizIndex = 0;

function openQuizModal() {
  quizAnswers = [];
  currentQuizIndex = 0;
  quizModal.classList.add('open');
  document.body.style.overflow = 'hidden';
  renderQuizStep();
}

function closeQuizModal() {
  quizModal.classList.remove('open');
  document.body.style.overflow = '';
}

function renderQuizStep() {
  if (currentQuizIndex < QUIZ_QUESTIONS.length) {
    const q = QUIZ_QUESTIONS[currentQuizIndex];
    quizContainer.innerHTML = `
      <div class="mb-4">
        <div class="flex items-center justify-between text-xs text-pink-400 font-bold mb-2">
          <span>คำถามที่ ${currentQuizIndex + 1} จาก ${QUIZ_QUESTIONS.length}</span>
          <span>${Math.round(((currentQuizIndex) / QUIZ_QUESTIONS.length) * 100)}%</span>
        </div>
        <div class="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div class="bg-gradient-to-r from-pink-500 to-purple-500 h-1.5 transition-all duration-300" style="width: ${((currentQuizIndex + 1) / QUIZ_QUESTIONS.length) * 100}%"></div>
        </div>
      </div>

      <h3 class="text-lg md:text-xl font-bold text-white mb-6 font-display">${q.question}</h3>

      <div class="space-y-3">
        ${q.options.map((opt, i) => `
          <button 
            onclick="handleQuizAnswer(${i})"
            class="w-full text-left p-4 rounded-xl glass-panel hover:bg-pink-600/20 hover:border-pink-500/50 text-gray-200 hover:text-white transition group flex items-center justify-between"
          >
            <span class="text-sm font-medium">${opt.text}</span>
            <span class="text-pink-400 opacity-0 group-hover:opacity-100 transition">➜</span>
          </button>
        `).join('')}
      </div>
    `;
  } else {
    // Show Result
    const recommendedSongId = quizAnswers[quizAnswers.length - 1] || '7-rings';
    const song = ARIANA_SONGS.find(s => s.id === recommendedSongId) || ARIANA_SONGS[0];

    quizContainer.innerHTML = `
      <div class="text-center py-4">
        <div class="text-4xl mb-2">👑✨</div>
        <span class="text-xs font-bold uppercase tracking-widest text-pink-400">ผลการทดสอบมู้ดของคุณ</span>
        <h3 class="text-2xl md:text-3xl font-extrabold text-white mt-1 mb-2 font-display">
          เพลงคู่ใจของคุณตอนนี้คือ:
        </h3>
        <div class="p-6 rounded-2xl bg-gradient-to-b from-pink-950/40 to-black/60 border border-pink-500/30 my-4 text-center">
          <h4 class="text-2xl font-black text-pink-300">${song.title}</h4>
          ${song.feat ? `<p class="text-xs text-pink-400 font-medium">${song.feat}</p>` : ''}
          <p class="text-xs text-gray-400 mt-1">อัลบั้ม ${song.album} • ${song.badge}</p>

          <p class="text-sm italic text-pink-200 mt-4 p-3 bg-white/5 rounded-xl border border-white/5">
            ${song.iconicLyricTh}
          </p>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <button 
            onclick="closeQuizModal(); openVideoModal('${song.id}')"
            class="px-6 py-3 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-pink-500/30 transition flex items-center justify-center gap-2"
          >
            <span>🎬</span> ฟังและดู MV เพลงนี้ทันที!
          </button>
          <button 
            onclick="openQuizModal()"
            class="px-5 py-3 rounded-full glass-panel hover:bg-white/10 text-gray-300 font-medium text-sm transition"
          >
            🔄 ทำแบบทดสอบอีกครั้ง
          </button>
        </div>
      </div>
    `;
  }
}

function handleQuizAnswer(optionIndex) {
  const chosenSong = QUIZ_QUESTIONS[currentQuizIndex].options[optionIndex].songId;
  quizAnswers.push(chosenSong);
  currentQuizIndex++;
  renderQuizStep();
}

// Random Song Generator
function openRandomSongModal() {
  randomModal.classList.add('open');
  document.body.style.overflow = 'hidden';

  randomResultContainer.innerHTML = `
    <div class="py-8 text-center">
      <div class="vinyl-disc mx-auto spin-slow mb-6"></div>
      <p class="text-sm text-pink-300 font-medium animate-pulse">กำลังสุ่มเลือกเพลงฮิตระดับตำนานของ Ariana Grande ให้คุณ...</p>
    </div>
  `;

  setTimeout(() => {
    const randomIndex = Math.floor(Math.random() * ARIANA_SONGS.length);
    const song = ARIANA_SONGS[randomIndex];

    randomResultContainer.innerHTML = `
      <div class="text-center py-2">
        <span class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40 mb-3">
          🎉 เพลงสุ่มที่คุณได้ในวันนี้
        </span>
        <h3 class="text-3xl font-black text-white font-display">${song.title}</h3>
        ${song.feat ? `<p class="text-sm text-pink-400 font-semibold">${song.feat}</p>` : ''}
        <p class="text-xs text-gray-400 mt-1">${song.album} (${song.year}) • ${song.billboardPeak}</p>

        <div class="p-4 rounded-xl bg-black/50 border border-white/10 my-5 text-left text-xs space-y-2">
          <p class="text-pink-300 font-mono italic">“${song.iconicLyricEn}”</p>
          <p class="text-gray-300">“${song.iconicLyricTh}”</p>
          <p class="text-gray-400 pt-2 border-t border-white/5">${song.story}</p>
        </div>

        <div class="flex flex-col sm:flex-row gap-2.5 justify-center">
          <button 
            onclick="closeRandomModal(); openVideoModal('${song.id}')"
            class="px-5 py-2.5 rounded-full bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
          >
            <span>🎬</span> ดู MV เพลงนี้
          </button>
          <button 
            onclick="openRandomSongModal()"
            class="px-5 py-2.5 rounded-full glass-panel hover:bg-white/10 text-gray-300 font-medium text-xs transition"
          >
            🎲 สุ่มใหม่อีกรอบ
          </button>
        </div>
      </div>
    `;
  }, 900);
}

function closeRandomModal() {
  randomModal.classList.remove('open');
  document.body.style.overflow = '';
}

// Random Fun Fact Ticker
function setupFunFacts() {
  let factIndex = 0;
  function updateFact() {
    if (randomFactEl) {
      randomFactEl.style.opacity = '0';
      setTimeout(() => {
        randomFactEl.textContent = FUN_FACTS[factIndex];
        randomFactEl.style.opacity = '1';
        factIndex = (factIndex + 1) % FUN_FACTS.length;
      }, 400);
    }
  }
  updateFact();
  setInterval(updateFact, 7000);
}

// Setup Event Listeners
function setupEvents() {
  // Search input
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderSongs();
  });

  // Tab buttons (All Songs vs Favorites)
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeTab = btn.getAttribute('data-tab');
      renderSongs();
    });
  });

  // Modal Closers
  videoCloseBtn.addEventListener('click', closeVideoModal);
  videoModal.addEventListener('click', (e) => {
    if (e.target === videoModal) closeVideoModal();
  });

  quizCloseBtn.addEventListener('click', closeQuizModal);
  quizModal.addEventListener('click', (e) => {
    if (e.target === quizModal) closeQuizModal();
  });

  randomCloseBtn.addEventListener('click', closeRandomModal);
  randomModal.addEventListener('click', (e) => {
    if (e.target === randomModal) closeRandomModal();
  });

  // ESC key to close any open modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeVideoModal();
      closeQuizModal();
      closeRandomModal();
    }
  });
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  renderEraFilters();
  renderMoodFilters();
  renderHallOfFame();
  renderSongs();
  updateFavoritesBadge();
  setupEvents();
  setupFunFacts();
});
