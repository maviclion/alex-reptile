// ===========================
//  알렉스 랩타일 — app.js
//  Cloudinary 폴더 + 번호 방식으로 사진 자동 로딩
// ===========================

// ── 설정 ──────────────────────────────────────────────────────────────────
// Cloudinary 계정명 (cloud_name). API Key 불필요, 계정명만 사용.
const CLOUDINARY_CLOUD = 'dzmd8kwjb';

// Cloudinary 내 개체 사진의 최상위 폴더 경로
const GECKO_FOLDER = 'geckos';

// 카카오 오픈채팅 URL
const KAKAO_URL = 'https://open.kakao.com/o/sA5iVCEg';


// ── Cloudinary URL 생성 헬퍼 ──────────────────────────────────────────────

/**
 * 개체 폴더 안의 n번째 사진 URL을 반환합니다.
 * 파일명 규칙: 01.jpg, 02.jpg, 03.jpg ...
 *
 * @param {string} folder  - 개체 폴더명 (예: "moca")
 * @param {number} num     - 사진 번호 (1부터 시작)
 * @param {string} transform - Cloudinary 변환 파라미터 (선택)
 * @returns {string} 완성된 Cloudinary URL
 */
function cloudinaryUrl(folder, num, transform = '') {
  // 번호를 2자리로 맞춤 (1 → "01", 10 → "10")
  // Cloudinary Public ID에는 확장자를 붙이지 않음 (Cloudinary가 자동 처리)
  const filename = String(num).padStart(2, '0');
  const path = `${GECKO_FOLDER}/${folder}/${filename}`;

  if (transform) {
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/${transform}/${path}`;
  }
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/${path}`;
}

/**
 * 카드용 썸네일 URL (작게 리사이즈 → 빠른 로딩)
 * Cloudinary가 서버에서 자동으로 리사이즈해서 전송합니다.
 */
function thumbUrl(folder) {
  return cloudinaryUrl(folder, 1, 'w_500,h_500,c_fill,q_auto,f_auto');
}

/**
 * 모달용 상세 이미지 URL (고화질)
 */
function detailUrl(folder, num) {
  return cloudinaryUrl(folder, num, 'w_900,q_auto,f_auto');
}

/**
 * 모달 썸네일 스트립용 URL (작은 정사각형)
 */
function stripThumbUrl(folder, num) {
  return cloudinaryUrl(folder, num, 'w_120,h_120,c_fill,q_auto');
}


// ── 데이터 로딩 ───────────────────────────────────────────────────────────

/**
 * geckos.json을 불러옵니다.
 * 캐시 방지를 위해 타임스탬프 쿼리를 붙입니다.
 */
async function loadGeckos() {
  try {
    const res = await fetch('geckos.json?v=' + Date.now());
    return await res.json();
  } catch (e) {
    console.error('geckos.json 로드 실패:', e);
    return [];
  }
}


// ── 표시 헬퍼 ─────────────────────────────────────────────────────────────

/**
 * 성별 코드를 표시용 텍스트/클래스로 변환합니다.
 * male → 수컷, female → 암컷, 그 외 → 미구분
 */
function genderLabel(g) {
  if (g === 'male')   return { text: '♂', cls: 'badge-male',    label: '수컷' };
  if (g === 'female') return { text: '♀', cls: 'badge-female',  label: '암컷' };
  return                     { text: '?', cls: 'badge-unknown', label: '미구분' };
}

/**
 * 가격을 한국어 형식으로 포맷합니다.
 * null이거나 0이면 null 반환 → 호출부에서 "오픈채팅 문의" 처리
 */
function formatPrice(p) {
  if (!p || p === 0 || p === null) return null;
  return Number(p).toLocaleString('ko-KR') + '원';
}


// ── 카드 렌더링 ───────────────────────────────────────────────────────────

/**
 * 개체 1마리의 카드 DOM 요소를 생성해서 반환합니다.
 *
 * @param {object} gecko  - geckos.json의 개체 데이터
 * @param {number} index  - 애니메이션 딜레이용 인덱스
 * @returns {HTMLElement} 카드 div 요소
 */
function createCard(gecko, index) {
  const g          = genderLabel(gecko.gender);
  const sold       = gecko.sold;
  const thumb      = thumbUrl(gecko.folder);        // 첫 번째 사진을 썸네일로
  const priceText  = formatPrice(gecko.price);
  const photoCount = gecko.photoCount || 1;         // 사진 장수 (없으면 1로 간주)

  const card = document.createElement('div');
  card.className = 'gecko-card' + (sold ? ' is-sold' : '');
  card.style.animationDelay = `${index * 0.06}s`;

  card.innerHTML = `
    <div class="card-img-wrap">
      <!-- 썸네일: Cloudinary가 서버에서 리사이즈해서 전송 (빠른 로딩) -->
      <img src="${thumb}" alt="${gecko.name}" loading="lazy" />

      <!-- 분양완료 오버레이 -->
      <div class="card-sold-overlay">
        <span class="sold-stamp">분양완료</span>
      </div>

      <!-- 성별 배지 -->
      <span class="card-gender-badge ${g.cls}">${g.text}</span>

      <!-- 사진 장수 배지: 2장 이상일 때만 표시 -->
      ${photoCount > 1 ? `<span class="card-photo-count">📷 ${photoCount}</span>` : ''}
    </div>
    <div class="card-body">
      <div class="card-morph">${gecko.morph || ''}</div>
      <div class="card-name">${gecko.name}</div>
      <div class="card-meta">
        ${gecko.age    ? `<span class="card-tag">🗓 ${gecko.age}</span>`    : ''}
        ${gecko.weight ? `<span class="card-tag">⚖ ${gecko.weight}</span>` : ''}
        <span class="card-tag">${g.label}</span>
      </div>
      <!-- 가격: null이면 오픈채팅 문의 표시 -->
      ${priceText
        ? `<div class="card-price ${sold ? 'sold-price' : ''}">${priceText}</div>`
        : `<div class="card-price-inquiry">💬 오픈채팅 문의</div>`}
    </div>
  `;

  // 분양 완료된 개체는 클릭 불가
  if (!sold) {
    card.addEventListener('click', () => openModal(gecko));
  }
  return card;
}


// ── 모달 갤러리 ───────────────────────────────────────────────────────────

// 현재 열려 있는 모달의 상태를 전역으로 관리
let _currentGecko  = null;  // 현재 개체 데이터
let _currentIdx    = 0;     // 현재 보고 있는 사진 번호 (1-based)
let _currentTotal  = 0;     // 총 사진 장수

/**
 * 모달을 열고 개체 정보를 채웁니다.
 */
function openModal(gecko) {
  _currentGecko = gecko;
  _currentIdx   = 1;                        // 첫 번째 사진부터 시작
  _currentTotal = gecko.photoCount || 1;    // 총 사진 장수

  const g = genderLabel(gecko.gender);

  // 개체 이름
  document.getElementById('modalName').textContent  = gecko.name;
  // 모프 배지 (사진 위에 표시)
  document.getElementById('modalBadge').textContent = gecko.morph || '';
  // 설명
  document.getElementById('modalDesc').textContent  = gecko.desc || '';

  // 가격: null이면 오픈채팅 문의 스타일로 표시
  const priceEl   = document.getElementById('modalPrice');
  const priceText = formatPrice(gecko.price);
  if (priceText) {
    priceEl.textContent = priceText;
    priceEl.className   = 'modal-price';
  } else {
    priceEl.textContent = '💬 오픈채팅으로 문의해 주세요';
    priceEl.className   = 'modal-price modal-price-inquiry';
  }

  // 태그 목록 (성별, 나이, 체중, 해칭일, 모프)
  const tags = document.getElementById('modalTags');
  tags.innerHTML = '';
  [
    { label: g.label,          highlight: true },
    gecko.age    ? { label: `🗓 ${gecko.age}` }    : null,
    gecko.weight ? { label: `⚖ ${gecko.weight}` } : null,
    gecko.hatch  ? { label: `🥚 ${gecko.hatch}` }  : null,
    gecko.morph  ? { label: gecko.morph, highlight: true } : null,
  ].filter(Boolean).forEach(t => {
    const span       = document.createElement('span');
    span.className   = 'modal-tag' + (t.highlight ? ' highlight' : '');
    span.textContent = t.label;
    tags.appendChild(span);
  });

  // 갤러리 초기화 (첫 번째 사진으로)
  renderGallery(1);

  // 모달 열기
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

/**
 * 갤러리 메인 이미지와 썸네일 스트립을 갱신합니다.
 *
 * @param {number} idx - 표시할 사진 번호 (1-based: 1, 2, 3 ...)
 */
function renderGallery(idx) {
  const gecko   = _currentGecko;
  const total   = _currentTotal;
  _currentIdx   = idx;

  // 메인 이미지 교체 (고화질 URL)
  document.getElementById('modalImg').src = detailUrl(gecko.folder, idx);

  // 이전/다음 화살표 버튼 활성화 여부
  document.getElementById('galleryPrev').disabled = (idx <= 1);
  document.getElementById('galleryNext').disabled = (idx >= total);

  // 사진이 1장이면 화살표/썸네일 숨김
  const showNav = total > 1;
  document.getElementById('galleryPrev').style.display  = showNav ? 'flex' : 'none';
  document.getElementById('galleryNext').style.display  = showNav ? 'flex' : 'none';
  document.getElementById('modalThumbs').style.display  = showNav ? 'flex' : 'none';

  // 썸네일 스트립 렌더링 (사진이 2장 이상일 때만)
  if (showNav) {
    const thumbsEl = document.getElementById('modalThumbs');
    thumbsEl.innerHTML = '';

    // 1번부터 total번까지 썸네일 생성
    for (let i = 1; i <= total; i++) {
      const img       = document.createElement('img');
      img.src         = stripThumbUrl(gecko.folder, i);
      img.alt         = `${gecko.name} 사진 ${i}`;
      img.className   = 'modal-thumb' + (i === idx ? ' active' : '');
      img.onclick     = () => renderGallery(i);   // 클릭하면 해당 사진으로 이동
      thumbsEl.appendChild(img);
    }
  }
}

// 이전 사진으로 이동
function galleryPrev() {
  if (_currentIdx > 1) renderGallery(_currentIdx - 1);
}

// 다음 사진으로 이동
function galleryNext() {
  if (_currentIdx < _currentTotal) renderGallery(_currentIdx + 1);
}

/**
 * 모달을 닫습니다.
 */
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
  _currentGecko = null;
}


// ── 메인 렌더링 ───────────────────────────────────────────────────────────

/**
 * 페이지 진입 시 실행되는 메인 함수.
 * 분양중/분양완료 페이지를 구분해서 렌더링합니다.
 */
async function main() {
  // sold.html에서는 <script>const SOLD_PAGE = true;</script> 가 선언되어 있음
  const isSoldPage = typeof SOLD_PAGE !== 'undefined' && SOLD_PAGE;
  const grid       = document.getElementById('geckoGrid');
  const emptyState = document.getElementById('emptyState');
  if (!grid) return;

  // 전체 데이터 로드 후 페이지 목적에 맞게 필터링
  const all  = await loadGeckos();
  const list = isSoldPage
    ? all.filter(g => g.sold)       // 분양완료 페이지: sold=true 인 것만
    : all.filter(g => !g.sold);     // 분양중 페이지:   sold=false 인 것만

  let currentFilter = 'all';

  /**
   * 필터 조건에 맞는 카드만 그리드에 렌더링합니다.
   * @param {string} filter - 'all' | 'male' | 'female' | 'unknown'
   */
  function render(filter) {
    grid.innerHTML = '';

    const filtered = filter === 'all'
      ? list
      : list.filter(g => g.gender === filter);

    if (filtered.length === 0) {
      // 개체가 없을 때 빈 상태 메시지 표시
      emptyState && (emptyState.style.display = 'block');
    } else {
      emptyState && (emptyState.style.display = 'none');
      filtered.forEach((gecko, i) => grid.appendChild(createCard(gecko, i)));
    }
  }

  render('all');  // 초기 렌더: 전체 표시

  // ── 필터 버튼 이벤트 ──
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      render(currentFilter);
    });
  });

  // ── 모달 닫기 이벤트 ──
  document.getElementById('modalClose')
    ?.addEventListener('click', closeModal);

  // 모달 바깥 영역 클릭 시 닫기
  document.getElementById('modalOverlay')
    ?.addEventListener('click', e => {
      if (e.target === e.currentTarget) closeModal();
    });

  // 키보드 단축키
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape')     closeModal();    // ESC: 모달 닫기
    if (e.key === 'ArrowLeft')  galleryPrev();   // ←: 이전 사진
    if (e.key === 'ArrowRight') galleryNext();   // →: 다음 사진
  });

  // 갤러리 화살표 버튼
  document.getElementById('galleryPrev')
    ?.addEventListener('click', galleryPrev);
  document.getElementById('galleryNext')
    ?.addEventListener('click', galleryNext);
}

// DOM 준비 완료 후 실행
main();
