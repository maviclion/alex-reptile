// ===========================
//  알렉스 랩타일 — app.js
//  Cloudinary 직접 URL 방식
// ===========================

const KAKAO_URL = 'https://open.kakao.com/o/sA5iVCEg';

function thumbUrl(gecko) {
  return gecko.photos[0];
}

function detailUrl(gecko, idx) {
  return gecko.photos[idx - 1];
}

function stripThumbUrl(gecko, idx) {
  return gecko.photos[idx - 1];
}

async function loadGeckos() {
  try {
    const res = await fetch('geckos.json?v=' + Date.now());
    return await res.json();
  } catch (e) {
    console.error('geckos.json 로드 실패:', e);
    return [];
  }
}

function genderLabel(g) {
  if (g === 'male')   return { text: '♂', cls: 'badge-male',    label: '수컷' };
  if (g === 'female') return { text: '♀', cls: 'badge-female',  label: '암컷' };
  return                     { text: '?', cls: 'badge-unknown', label: '미구분' };
}

function formatPrice(p) {
  if (!p || p === 0 || p === null) return null;
  return Number(p).toLocaleString('ko-KR') + '원';
}

function createCard(gecko, index) {
  const g          = genderLabel(gecko.gender);
  const sold       = gecko.sold;
  const thumb      = thumbUrl(gecko);
  const priceText  = formatPrice(gecko.price);
  const photoCount = gecko.photos ? gecko.photos.length : 1;

  const card = document.createElement('div');
  card.className = 'gecko-card' + (sold ? ' is-sold' : '');
  card.style.animationDelay = `${index * 0.06}s`;

  card.innerHTML = `
    <div class="card-img-wrap">
      <img src="${thumb}" alt="${gecko.name}" loading="lazy" />
      <div class="card-sold-overlay">
        <span class="sold-stamp">분양완료</span>
      </div>
      <span class="card-gender-badge ${g.cls}">${g.text}</span>
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

let _currentGecko = null;
let _currentIdx   = 0;
let _currentTotal = 0;

function openModal(gecko) {
  _currentGecko = gecko;
  _currentIdx   = 1;
  _currentTotal = gecko.photos ? gecko.photos.length : 1;

  const g = genderLabel(gecko.gender);

  document.getElementById('modalName').textContent  = gecko.name;
  document.getElementById('modalBadge').textContent = gecko.morph || '';
  document.getElementById('modalDesc').textContent  = gecko.desc || '';

  const priceEl   = document.getElementById('modalPrice');
  const priceText = formatPrice(gecko.price);
  if (priceText) {
    priceEl.textContent = priceText;
    priceEl.className   = 'modal-price';
  } else {
    priceEl.textContent = '💬 오픈채팅으로 문의해 주세요';
    priceEl.className   = 'modal-price modal-price-inquiry';
  }

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

  renderGallery(1);

  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function renderGallery(idx) {
  const gecko = _currentGecko;
  const total = _currentTotal;
  _currentIdx = idx;

  document.getElementById('modalImg').src = detailUrl(gecko, idx);

  document.getElementById('galleryPrev').disabled = (idx <= 1);
  document.getElementById('galleryNext').disabled = (idx >= total);

  const showNav = total > 1;
  document.getElementById('galleryPrev').style.display  = showNav ? 'flex' : 'none';
  document.getElementById('galleryNext').style.display  = showNav ? 'flex' : 'none';
  document.getElementById('modalThumbs').style.display  = showNav ? 'flex' : 'none';

  if (showNav) {
    const thumbsEl = document.getElementById('modalThumbs');
    thumbsEl.innerHTML = '';
    for (let i = 1; i <= total; i++) {
      const img     = document.createElement('img');
      img.src       = stripThumbUrl(gecko, i);
      img.alt       = `${gecko.name} 사진 ${i}`;
      img.className = 'modal-thumb' + (i === idx ? ' active' : '');
      img.onclick   = () => renderGallery(i);
      thumbsEl.appendChild(img);
    }
  }
}

function galleryPrev() {
  if (_currentIdx > 1) renderGallery(_currentIdx - 1);
}

function galleryNext() {
  if (_currentIdx < _currentTotal) renderGallery(_currentIdx + 1);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
  _currentGecko = null;
}

async function main() {
  const isSoldPage = typeof SOLD_PAGE !== 'undefined' && SOLD_PAGE;
  const grid       = document.getElementById('geckoGrid');
  const emptyState = document.getElementById('emptyState');
  if (!grid) return;

  const all  = await loadGeckos();
  const list = isSoldPage
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

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      render(currentFilter);
    });
  });

  document.getElementById('modalClose')
    ?.addEventListener('click', closeModal);
  document.getElementById('modalOverlay')
    ?.addEventListener('click', e => {
      if (e.target === e.currentTarget) closeModal();
    });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape')     closeModal();
    if (e.key === 'ArrowLeft')  galleryPrev();
    if (e.key === 'ArrowRight') galleryNext();
  });
  document.getElementById('galleryPrev')
    ?.addEventListener('click', galleryPrev);
  document.getElementById('galleryNext')
    ?.addEventListener('click', galleryNext);
}

main();
