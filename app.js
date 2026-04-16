// ===========================
//  알렉스 랩타일 — app.js
// ===========================

// 개체 데이터를 geckos.json에서 불러옵니다
async function loadGeckos() {
  try {
    const res = await fetch('geckos.json');
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('geckos.json 로드 실패:', e);
    return [];
  }
}

// 성별 표시
function genderLabel(g) {
  if (g === 'male')    return { text: '♂', cls: 'badge-male',    label: '수컷' };
  if (g === 'female')  return { text: '♀', cls: 'badge-female',  label: '암컷' };
  return { text: '?', cls: 'badge-unknown', label: '미구분' };
}

// 가격 포맷
function formatPrice(p) {
  if (!p || p === 0) return '가격 문의';
  return Number(p).toLocaleString('ko-KR') + '원';
}

// 카드 HTML 생성
function createCard(gecko, index) {
  const g = genderLabel(gecko.gender);
  const sold = gecko.sold;
  const price = formatPrice(gecko.price);

  const card = document.createElement('div');
  card.className = 'gecko-card' + (sold ? ' is-sold' : '');
  card.style.animationDelay = `${index * 0.06}s`;

  card.innerHTML = `
    <div class="card-img-wrap">
      <img src="${gecko.photo}" alt="${gecko.name}" loading="lazy" />
      <div class="card-sold-overlay">
        <span class="sold-stamp">분양완료</span>
      </div>
      <span class="card-gender-badge ${g.cls}">${g.text}</span>
    </div>
    <div class="card-body">
      <div class="card-morph">${gecko.morph || ''}</div>
      <div class="card-name">${gecko.name}</div>
      <div class="card-meta">
        ${gecko.age ? `<span class="card-tag">🗓 ${gecko.age}</span>` : ''}
        ${gecko.weight ? `<span class="card-tag">⚖ ${gecko.weight}</span>` : ''}
        <span class="card-tag">${g.label}</span>
      </div>
      <div class="card-price ${sold ? 'sold-price' : ''}">${price}</div>
    </div>
  `;

  if (!sold) {
    card.addEventListener('click', () => openModal(gecko));
  }
  return card;
}

// 모달 열기
function openModal(gecko) {
  const g = genderLabel(gecko.gender);
  document.getElementById('modalImg').src = gecko.photo;
  document.getElementById('modalImg').alt = gecko.name;
  document.getElementById('modalName').textContent = gecko.name;
  document.getElementById('modalBadge').textContent = gecko.morph || '';
  document.getElementById('modalDesc').textContent = gecko.desc || '';
  document.getElementById('modalPrice').textContent = formatPrice(gecko.price);

  const tags = document.getElementById('modalTags');
  tags.innerHTML = '';
  const tagData = [
    { label: g.label, highlight: true },
    gecko.age   ? { label: `🗓 ${gecko.age}` }   : null,
    gecko.weight ? { label: `⚖ ${gecko.weight}` } : null,
    gecko.hatch  ? { label: `🥚 ${gecko.hatch}` }  : null,
    gecko.morph  ? { label: gecko.morph, highlight: true } : null,
  ].filter(Boolean);

  tagData.forEach(t => {
    const span = document.createElement('span');
    span.className = 'modal-tag' + (t.highlight ? ' highlight' : '');
    span.textContent = t.label;
    tags.appendChild(span);
  });

  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

// 모달 닫기
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// 메인 렌더
async function main() {
  const isSoldPage = typeof SOLD_PAGE !== 'undefined' && SOLD_PAGE;
  const grid = document.getElementById('geckoGrid');
  const emptyState = document.getElementById('emptyState');
  if (!grid) return;

  const all = await loadGeckos();
  // 분양중 페이지: sold=false 항목 / 분양완료 페이지: sold=true 항목
  let list = isSoldPage
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
      filtered.forEach((gecko, i) => {
        grid.appendChild(createCard(gecko, i));
      });
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

  // 모달 닫기 이벤트
  document.getElementById('modalClose')?.addEventListener('click', closeModal);
  document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

main();
