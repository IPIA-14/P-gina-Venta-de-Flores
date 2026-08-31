/* ═══════════════════════════════════════════════
   catalog.js — Filtros, Ordenamiento y Render
   ═══════════════════════════════════════════════ */

// Productos fallback (si el backend no responde)
const DEFAULT_PRODUCTS = [
  {id:1,name:'Rosa eterna individual',qty:'1',presentation:'individual',price:35000,icon:'🌹',desc:'Rosa eterna en presentación individual, perfecta para regalar'},
  {id:2,name:'Rosa eterna en cúpula',qty:'1',presentation:'cupula',price:60000,icon:'🌹',desc:'Rosa eterna protegida bajo una elegante cúpula de cristal'},
  {id:3,name:'Rosa eterna en ramo',qty:'1',presentation:'ramo',price:45000,icon:'🌹',desc:'Rosa eterna decorada en ramo con lazo de cinta'},
  {id:4,name:'Rosa eterna en caja mini',qty:'1',presentation:'caja',price:50000,icon:'🌹',desc:'Caja mini elegante, ideal para sorpresas pequeñas'},
  {id:5,name:'Rosa eterna con luces',qty:'1',presentation:'cupula',price:70000,icon:'✨',desc:'Cúpula con iluminación LED que realza la belleza de la rosa'},
  {id:6,name:'Rosa eterna arcoíris',qty:'1',presentation:'cupula',price:75000,icon:'🌈',desc:'Rosa eterna multicolor única'},
  {id:7,name:'3 Rosas en caja negra',qty:'3',presentation:'caja',price:90000,icon:'🌹',desc:'Caja negra elegante con 3 rosas eternas'},
  {id:8,name:'3 Rosas en caja blanca',qty:'3',presentation:'caja',price:95000,icon:'🌹',desc:'Caja blanca romántica con 3 rosas eternas'},
  {id:9,name:'3 Rosas en cúpula',qty:'3',presentation:'cupula',price:110000,icon:'🌹',desc:'Cúpula grande con 3 rosas eternas'},
  {id:10,name:'3 Rosas en caja corazón',qty:'3',presentation:'caja',price:100000,icon:'❤️',desc:'Caja con forma de corazón, perfecta para San Valentín'},
  {id:11,name:'3 Rosas premium',qty:'3',presentation:'caja',price:120000,icon:'💎',desc:'Presentación premium con acabados de lujo'},
  {id:12,name:'3 Rosas elegantes',qty:'3',presentation:'caja',price:115000,icon:'🌹',desc:'Caja elegante personalizada'},
  {id:13,name:'6 Rosas en caja premium',qty:'6',presentation:'caja',price:170000,icon:'🌹',desc:'Caja premium con 6 rosas eternas seleccionadas'},
  {id:14,name:'6 Rosas en cúpula',qty:'6',presentation:'cupula',price:190000,icon:'✨',desc:'Gran cúpula con 6 rosas eternas iluminadas'},
  {id:15,name:'12 Rosas eternas clásica',qty:'12',presentation:'caja',price:280000,icon:'🌹',desc:'Caja clásica con 12 rosas eternas'},
  {id:16,name:'12 Rosas eternas premium',qty:'12',presentation:'caja',price:350000,icon:'💎',desc:'Presentación premium con 12 rosas eternas'},
  {id:17,name:'24 Rosas eternas',qty:'24',presentation:'caja',price:550000,icon:'🌹',desc:'Gran caja de 24 rosas eternas'},
  {id:18,name:'36 Rosas eternas',qty:'36',presentation:'caja',price:780000,icon:'🌹',desc:'Caja especial de 36 rosas eternas'},
  {id:19,name:'50+ Rosas eternas',qty:'50+',presentation:'caja',price:1000000,icon:'🌹',desc:'Pedido personalizado de 50 o más rosas eternas'}
];

let allProducts = [];
let currentFilter = 'all';
let currentPresentation = null;
let currentCategory = null;
let currentColor = null;

/* ── Inicializar catálogo ──────────────────────── */
async function initCatalog() {
  showLoadingSkeleton();
  const data = await fetchProducts();
  allProducts = data || DEFAULT_PRODUCTS;
  renderProducts();
}

/* ── Skeleton de carga ─────────────────────────── */
function showLoadingSkeleton() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  grid.innerHTML = Array(6).fill(0).map(() => `
    <div class="card">
      <div class="card-visual skeleton" style="height:200px"></div>
      <div class="card-body">
        <div class="skeleton" style="height:20px;width:60%;margin-bottom:8px"></div>
        <div class="skeleton" style="height:16px;margin-bottom:6px"></div>
        <div class="skeleton" style="height:16px;width:80%;margin-bottom:12px"></div>
        <div class="skeleton" style="height:24px;width:40%;margin-bottom:14px"></div>
        <div class="skeleton" style="height:42px"></div>
      </div>
    </div>
  `).join('');
}

/* ── Render principal ──────────────────────────── */
function renderProducts() {
  let list = allProducts.filter(p =>
    (currentFilter === 'all' || p.qty === currentFilter) &&
    (!currentPresentation || p.presentation === currentPresentation) &&
    (!currentCategory || p.category === currentCategory)
    // currentColor no filtra porque todos los productos se pueden personalizar en cualquier color
  );

  const sortEl = document.getElementById('sortSelect');
  const sort = sortEl ? sortEl.value : 'popular';
  if (sort === 'low')  list.sort((a, b) => a.price - b.price);
  if (sort === 'high') list.sort((a, b) => b.price - a.price);
  if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'es'));

  const resultEl = document.getElementById('resultText');
  if (resultEl) {
    resultEl.innerHTML = `<span>${list.length}</span> producto${list.length === 1 ? '' : 's'}`;
  }

  const grid = document.getElementById('productGrid');
  if (!grid) return;

  if (!list.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--muted)">
        <div style="font-size:48px;margin-bottom:16px">🌹</div>
        <div style="font-size:16px;font-weight:500">No encontramos productos con ese filtro</div>
        <button class="btn btn-outline btn-sm" style="margin-top:16px" onclick="filterProducts('all',null)">Ver todos</button>
      </div>`;
    return;
  }

  grid.innerHTML = list.map((p, i) => `
    <div class="card" style="animation-delay:${i * 0.07}s">
      <div class="card-visual">
        <span class="card-badge">${p.qty} ${p.qty === '1' ? 'rosa' : 'rosas'}</span>
        ${p.icon}
      </div>
      <div class="card-body">
        <div class="card-name">${p.name}</div>
        <div class="card-desc">${p.desc}</div>
        <div class="card-price">${money(p.price)}</div>
        <button class="card-add" onclick="openProduct(${p.id})">
          🛒 Tomar Pedido
        </button>
      </div>
    </div>
  `).join('');
}

/* ── Filtros ───────────────────────────────────── */
function filterProducts(qty, btn) {
  currentFilter = qty;
  currentPresentation = null;
  currentCategory = null;

  // Actualizar tabs activos
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');

  // Limpiar otros botones de categoría/presentación
  document.querySelectorAll('.filter-btn[data-cat], .filter-btn[data-pres]').forEach(b => b.classList.remove('active'));

  // Actualizar botones sidebar
  document.querySelectorAll('.filter-btn[data-qty]').forEach(b => {
    b.classList.toggle('active', b.dataset.qty === qty);
  });

  renderProducts();
}

function filterPresentation(pres, btn) {
  currentPresentation = currentPresentation === pres ? null : pres;
  currentFilter = 'all';
  currentCategory = null;

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const allTab = document.querySelector('.tab[data-qty="all"]');
  if (allTab && !currentPresentation) allTab.classList.add('active');

  document.querySelectorAll('.filter-btn[data-cat], .filter-btn[data-qty]').forEach(b => b.classList.remove('active'));

  document.querySelectorAll('.filter-btn[data-pres]').forEach(b => {
    b.classList.toggle('active', b.dataset.pres === currentPresentation);
  });

  renderProducts();
}

function filterCategory(cat, btn) {
  currentCategory = currentCategory === cat ? null : cat;
  currentFilter = 'all';
  currentPresentation = null;

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const allTab = document.querySelector('.tab[data-qty="all"]');
  if (allTab && !currentCategory) allTab.classList.add('active');

  // Limpiar otros filtros en la barra lateral
  document.querySelectorAll('.filter-btn[data-pres], .filter-btn[data-qty]').forEach(b => b.classList.remove('active'));

  // Actualizar botones de categoría
  document.querySelectorAll('.filter-btn[data-cat]').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === currentCategory);
  });

  renderProducts();
}

function filterColor(color, btn) {
  currentColor = currentColor === color ? null : color;
  
  // Actualizar UI de color dots
  document.querySelectorAll('.color-dot').forEach(d => {
    d.style.transform = 'scale(1)';
    d.style.boxShadow = 'none';
  });
  
  if (currentColor && btn) {
    btn.style.transform = 'scale(1.2)';
    btn.style.boxShadow = '0 0 0 2px var(--bg), 0 0 0 4px var(--pink)';
  }
  
  // No llamamos renderProducts porque todos los productos están disponibles en todos los colores
}

function sortProducts() { renderProducts(); }
