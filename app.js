// ===========================
//  알렉스 랩타일 — app.js
// ===========================

// 개체 데이터를 geckos.json에서 불러옵니다
async function loadGeckos() {
  try {
    const res = await fetch('geckos.json?v=' + Date.now());
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('geckos.json 로드 실패:', e);
    return [];
  }
}

// 성별 표시
function genderLabel(g) {
  if (g === 'male')   return { text: '♂', cls: 'badge-male',    label: '수컷' };
  if (g === 'female') return { text: '♀', cls: 'badge-female',  label: '암컷' };
  return { text: '?', cls: 'badge-unknown', label: '미구분' };
}

// 가격 포맷
function formatPrice(p) {
  if (!p || p === 0 || p === null) return null;
  return Number(p).toLocaleString('ko-KR') + '원';
}

// Cloudinary 썸네일 URL (카드용 작은 이미지)
function thumbUrl(url) {
  if (!url) return null;
  // Cloudinary URL이면 자동 리사이즈 파라미터 삽입
  if (url.includes('res.cloudinary.com')) {
    return url.replace('/upload/', '/upload/w_500,h_500,c_fill,q_auto,f_auto/');
  }
  return url;
}

// Cloudinary 상세 URL (모달용 큰 이미지)
function detailUrl(url) {
  if (!url) return null;
  if (url.includes('res.cloudinary.com')) {
    return url.replace('/upload/', '/upload/w_900,q_auto,f_auto/');
  }
  return url;
}

// photos 배열에서 첫 번째 사진 가져오기 (하위 호환: photo 단수도 지원)
function getPhotos(gecko) {
  if (gecko.photos && gecko.photos.length > 0) return gecko.photos;
  if (gecko.photo) return [gecko.photo];
  return [];
}

// 카드 HTML 생성
function createCard(gecko, index) {
  const g = genderLabel(gecko.gender);
  const sold = gecko.sold;
  const photos = getPhotos(gecko);
  const thumb = photos.length > 0 ? thumbUrl(photos[0]) : null;
  const priceText = formatPrice(gecko.price);
  const multiPhoto = photos.length > 1;

  const card = document.createElement('div');
  card.className = 'gecko-card' + (sold ? ' is-sold' : '');
  card.style.animationDelay = `${index * 0.06}s`;

  card.innerHTML = `
    <div class="card-img-wrap">
      ${thumb
        ? `<img src="${thumb}" alt="${gecko.name}" loading="lazy" />`
        : `<div class="card-img-placeholder">🦎</div>`}
      <div class="card-sold-overlay">
        <span class="sold-stamp">분양완료</span>
      </div>
      <span class="card-gender-badge ${g.cls}">${g.text}</span>
      ${multiPhoto ? `<span class="card-photo-count">📷 ${photos.length}</span>` : ''}
    </div>
    <div class="card-body">
      <div class="card-morph">${gecko.morph || ''}</div>
      <div class="card-name">${gecko.name}</div>
      <div class="card-meta">
        ${gecko.age    ? `<span class="card-tag">🗓 ${gecko.age}</span>` : ''}
        ${gecko.weight ? `<span class="card-tag">⚖ ${gecko.weight}</span>` : ''}
        <span class="card-tag">${g.label}</span>
      </div>
      ${priceText
        ? `<div class="card-price ${sold ? 'sold-price' : ''}">${priceText}</div>`
        : `<div class="card-price-inquiry">💬 오픈채팅 문의</div>`}
    </div>
  `;

  if (!sold) {
    card.addEventListener('click', () => openModal(gecko));
  }
  return card;
}

// ── 모달 갤러리 상태 ──
let _currentPhotos = [];
let _currentIdx = 0;

function openModal(gecko) {
  const g = genderLabel(gecko.gender);
  const photos = getPhotos(gecko);
  _currentPhotos = photos;
  _currentIdx = 0;

  // 기본 정보
  document.getElementById('modalName').textContent = gecko.name;
  document.getElementById('modalBadge').textContent = gecko.morph || '';
  document.getElementById('modalDesc').textContent = gecko.desc || '';

  // 가격
  const priceEl = document.getElementById('modalPrice');
  const priceText = formatPrice(gecko.price);
  if (priceText) {
    priceEl.textContent = priceText;
    priceEl.className = 'modal-price';
  } else {
    priceEl.textContent = '💬 오픈채팅으로 문의해 주세요';
    priceEl.className = 'modal-price modal-price-inquiry';
  }

  // 태그
  const tags = document.getElementById('modalTags');
  tags.innerHTML = '';
  [
    { label: g.label, highlight: true },
    gecko.age    ? { label: `🗓 ${gecko.age}` }    : null,
    gecko.weight ? { label: `⚖ ${gecko.weight}` } : null,
    gecko.hatch  ? { label: `🥚 ${gecko.hatch}` }  : null,
    gecko.morph  ? { label: gecko.morph, highlight: true } : null,
  ].filter(Boolean).forEach(t => {
    const span = document.createElement('span');
    span.className = 'modal-tag' + (t.highlight ? ' highlight' : '');
    span.textContent = t.label;
    tags.appendChild(span);
  });

  // 갤러리 구성
  renderModalGallery(photos, 0);

  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function renderModalGallery(photos, idx) {
  const mainImg   = document.getElementById('modalImg');
  const thumbWrap = document.getElementById('modalThumbs');
  const prevBtn   = document.getElementById('galleryPrev');
  const nextBtn   = document.getElementById('galleryNext');

  if (photos.length === 0) {
    mainImg.src = '';
    mainImg.alt = '';
    thumbWrap.innerHTML = '';
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    return;
  }

  // 메인 이미지
  mainImg.src = detailUrl(photos[idx]);
  mainImg.alt = '';

  // 네비게이션 버튼
  if (photos.length > 1) {
    prevBtn.style.display = 'flex';
    nextBtn.style.display = 'flex';
    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx === photos.length - 1;
  } else {
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
  }

  // 썸네일 스트립
  if (photos.length > 1) {
    thumbWrap.style.display = 'flex';
    thumbWrap.innerHTML = photos.map((url, i) => {
      const t = url.includes('res.cloudinary.com')
        ? url.replace('/upload/', '/upload/w_120,h_120,c_fill,q_auto/')
        : url;
      return `<img class="modal-thumb${i === idx ? ' active' : ''}"
                   src="${t}" alt=""
                   onclick="galleryGoto(${i})" />`;
    }).join('');
  } else {
    thumbWrap.style.display = 'none';
    thumbWrap.innerHTML = '';
  }
}

function galleryGoto(idx) {
  if (idx < 0 || idx >= _currentPhotos.length) return;
  _currentIdx = idx;
  renderModalGallery(_currentPhotos, _currentIdx);
}

function galleryPrev() { galleryGoto(_currentIdx - 1); }
function galleryNext() { galleryGoto(_currentIdx + 1); }

// 모달 닫기
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ── 메인 렌더 ──
async function main() {
  const isSoldPage = typeof SOLD_PAGE !== 'undefined' && SOLD_PAGE;
  const grid       = document.getElementById('geckoGrid');
  const emptyState = document.getElementById('emptyState');
  if (!grid) return;

  const all  = await loadGeckos();
  let list   = isSoldPage
    ? all.filter(g => g.sold)
    : all.filter(g => !g.sold);

  let currentFilter = 'all';

  function render(filter) {
    grid.innerHTML = '';
    const filtered = filter === 'all'
      ? list
      : list.filter(g => g.gender === filter);

    if (filtered.length === 0) {
      emptyState && (emptyState.style.display = 'block');
    } else {
      emptyState && (emptyState.style.display = 'none');
      filtered.forEach((gecko, i) => grid.appendChild(createCard(gecko, i)));
    }
  }

  render('all');

  // 필터 버튼
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      render(currentFilter);
    });
  });

  // 모달 이벤트
  document.getElementById('modalClose')?.addEventListener('click', closeModal);
  document.getElementById('modalOverlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape')     closeModal();
    if (e.key === 'ArrowLeft')  galleryPrev();
    if (e.key === 'ArrowRight') galleryNext();
  });

  // 갤러리 화살표 버튼
  document.getElementById('galleryPrev')?.addEventListener('click', galleryPrev);
  document.getElementById('galleryNext')?.addEventListener('click', galleryNext);
}

main();
