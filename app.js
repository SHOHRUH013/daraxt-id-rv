const TREE_DATA = window.TREE_DATA || [];

const newData = TREE_DATA.map(item => ({
  ...item,
  id: typeof item.id === 'string'
    ? item.id.replace(/^T/, '')
    : item.id
}));

console.log(newData);

const speciesColorMap = {
  "Оқ қайин": "#f7b2c4",
  "Qrim qarag'ayi": "#7cc576",
  "Qoraqarag'ay": "#2d6a4f",
  "Qarag'ay": "#3f8f63",
  "Еman": "#b08968",
  "Kashtan": "#c08457",
  "Chinor": "#f59e0b",
  "Ғарб чинори": "#f97316",
  "Чинор баргли заранг": "#facc15",
  "Шумтол": "#84cc16",
  "Yong'oq": "#8b5e3c",
  "Olcha": "#fb7185",
  "Gilos(Черешня)": "#ef4444",
  "Майда мевали гилос": "#f43f5e"
};

const iconForType = (name) => {
  const n = name.toLowerCase();
  if (n.includes("qarag")) return "🌲";
  if (n.includes("eman")) return "🌳";
  if (n.includes("chinor")) return "🍁";
  if (n.includes("qayin")) return "🌸";
  if (n.includes("gilos") || n.includes("olcha")) return "🍒";
  if (n.includes("kashtan")) return "🌰";
  if (n.includes("yong")) return "🌳";
  return "🌿";
};

const colorForType = (name, idx) => {
  if (speciesColorMap[name]) return speciesColorMap[name];
  const hue = (idx * 37) % 360;
  return `hsl(${hue} 70% 62%)`;
};

const state = {
  filtered: [...TREE_DATA],
  currentIndex: 0,
  lastCopied: null
};

const els = {
  search: document.getElementById("searchInput"),
  type: document.getElementById("typeFilter"),
  status: document.getElementById("statusFilter"),
  sort: document.getElementById("sortFilter"),
  apply: document.getElementById("applyBtn"),
  reset: document.getElementById("resetBtn"),
  legend: document.getElementById("legendGrid"),
  totalCount: document.getElementById("totalCount"),
  filteredCount: document.getElementById("filteredCount"),
  healthyCount: document.getElementById("healthyCount"),
  sickCount: document.getElementById("sickCount"),
  feature: document.getElementById("featureArea"),
  list: document.getElementById("resultList"),
  resultCount: document.getElementById("resultCount"),
  lastCopyWrap: document.getElementById("lastCopyWrap"),
  lastCopiedId: document.getElementById("lastCopiedId"),
};

const uniqueSpecies = [...new Set(TREE_DATA.map(x => x.treeType))].sort((a,b)=>a.localeCompare(b));

function renderLegend(){
  els.legend.innerHTML = uniqueSpecies.map((name, idx)=>`
    <div class="legend-item">
      <span class="legend-color" style="background:${colorForType(name, idx)}"></span>
      <span>${iconForType(name)} ${name}</span>
    </div>
  `).join("");
  els.type.innerHTML = `<option value="">Barcha daraxtlar</option>` + uniqueSpecies.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("");
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

function applyFilters(){
  const q = els.search.value.trim().toLowerCase();
  const type = els.type.value;
  const status = els.status.value;
  const sort = els.sort.value;

  let items = TREE_DATA.filter(item => {
    const hay = `${item.id} ${item.treeType} ${item.status}`.toLowerCase();
    const qMatch = !q || hay.includes(q);
    const tMatch = !type || item.treeType === type;
    const sMatch = !status || item.status === status;
    return qMatch && tMatch && sMatch;
  });

  items.sort((a,b)=>{
    switch(sort){
      case "id-asc": return a.id.localeCompare(b.id);
      case "id-desc": return b.id.localeCompare(a.id);
      case "type-asc": return a.treeType.localeCompare(b.treeType) || a.id.localeCompare(b.id);
      case "height-desc": return b.height - a.height || a.id.localeCompare(b.id);
      case "circ-desc": return b.circumference - a.circumference || a.id.localeCompare(b.id);
      default: return a.id.localeCompare(b.id);
    }
  });

  state.filtered = items;
  state.currentIndex = 0;
  renderSummary();
  renderFeature();
  renderList();
}

function renderSummary(){
  els.totalCount.textContent = TREE_DATA.length;
  els.filteredCount.textContent = state.filtered.length;
  els.healthyCount.textContent = state.filtered.filter(x => x.status === "Sog'lom").length;
  els.sickCount.textContent = state.filtered.filter(x => x.status === "Kasallangan").length;
  els.resultCount.textContent = `${state.filtered.length} ta natija`;
}

function renderFeature(){
  const item = state.filtered[state.currentIndex];
  if(!item){
    els.feature.innerHTML = `<div class="empty">Hech qanday mos ma’lumot topilmadi. Qidiruvni o‘zgartirib ko‘ring.</div>`;
    return;
  }
  const color = colorForType(item.treeType, uniqueSpecies.indexOf(item.treeType));
  const statusColor = item.status === "Sog'lom" ? "rgba(34,197,94,.28)" : "rgba(239,68,68,.28)";
  const statusDot = item.status === "Sog'lom" ? "🟢" : "🔴";
  const icon = iconForType(item.treeType);

  els.feature.innerHTML = `
    <div class="feature-card" style="background:
      linear-gradient(180deg, color-mix(in srgb, ${color} 28%, rgba(255,255,255,.04)),
      rgba(255,255,255,.05)); border-color: color-mix(in srgb, ${color} 40%, rgba(255,255,255,.15));">
      <div class="focus-top">
        <div>
          <div class="small">Joriy tanlangan daraxt</div>
          <h2 class="tree-name">${escapeHtml(item.treeType)}</h2>
        </div>
        <div class="tree-icon" title="Daraxt belgisi">${icon}</div>
      </div>

      <div class="status-badge" style="background:${statusColor}">
        <span>${statusDot}</span>
        <span>${escapeHtml(item.status)}</span>
      </div>

      <div class="id-box" id="clickToCopyBox" title="ID ustiga bossangiz nusxa olinadi">
        <div class="id-title">Daraxt raqami</div>
        <div class="tree-id">${escapeHtml(item.id)}</div>
      </div>

      <div class="nav-row">
        <button class="btn btn-secondary" id="prevBtn">Orqaga</button>
        <button class="btn btn-primary" id="copyBtn">Copy</button>
        <button class="btn btn-secondary" id="nextBtn">Keyingi</button>
      </div>

      <div class="props">
        <div class="prop">
          <div class="label">Holati</div>
          <div class="value">${escapeHtml(item.status)}</div>
        </div>
        <div class="prop">
          <div class="label">Balandligi</div>
          <div class="value">${escapeHtml(item.height)} m</div>
        </div>
        <div class="prop">
          <div class="label">Aylana uzunligi</div>
          <div class="value">${escapeHtml(item.circumference)} sm</div>
        </div>
      </div>

      <div class="note">
        Kichik ma’lumot: <strong>${escapeHtml(item.treeType)}</strong> daraxtining holati
        <strong>${escapeHtml(item.status)}</strong>, balandligi <strong>${escapeHtml(item.height)} m</strong>,
        aylana uzunligi esa <strong>${escapeHtml(item.circumference)} sm</strong>.
      </div>
    </div>
  `;

  document.getElementById("prevBtn").onclick = () => move(-1);
  document.getElementById("nextBtn").onclick = () => move(1);
  document.getElementById("copyBtn").onclick = () => copyId(item.id);
  document.getElementById("clickToCopyBox").onclick = () => copyId(item.id);
}

function renderList(){
  if(!state.filtered.length){
    els.list.innerHTML = "";
    return;
  }
  els.list.innerHTML = state.filtered.map((item, idx)=>{
    const color = colorForType(item.treeType, uniqueSpecies.indexOf(item.treeType));
    return `
      <div class="result-item ${idx === state.currentIndex ? "active" : ""}" data-index="${idx}"
           style="border-color: color-mix(in srgb, ${color} 30%, rgba(255,255,255,.08));
                  background: linear-gradient(180deg, color-mix(in srgb, ${color} 14%, #0b1324), #0b1324);">
        <div class="result-name">${iconForType(item.treeType)} ${escapeHtml(item.treeType)}</div>
        <div class="result-id">${escapeHtml(item.id)}</div>
        <div class="result-meta">${escapeHtml(item.status)} · ${item.height} m · ${item.circumference} sm</div>
      </div>
    `;
  }).join("");

  els.list.querySelectorAll(".result-item").forEach(el => {
    el.onclick = () => {
      state.currentIndex = Number(el.dataset.index);
      renderFeature();
      renderList();
      document.getElementById("featureArea").scrollIntoView({behavior:"smooth", block:"start"});
    };
  });
}

function move(step){
  if(!state.filtered.length) return;
  state.currentIndex = (state.currentIndex + step + state.filtered.length) % state.filtered.length;
  renderFeature();
  renderList();
}

async function copyId(id){
  try{
    await navigator.clipboard.writeText(id);
  }catch(err){
    const ta = document.createElement("textarea");
    ta.value = id;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
  state.lastCopied = id;
  els.lastCopiedId.textContent = id;
  els.lastCopyWrap.hidden = false;
}

function resetFilters(){
  els.search.value = "";
  els.type.value = "";
  els.status.value = "";
  els.sort.value = "id-asc";
  applyFilters();
}

els.apply.addEventListener("click", applyFilters);
els.reset.addEventListener("click", resetFilters);
els.search.addEventListener("input", applyFilters);
els.type.addEventListener("change", applyFilters);
els.status.addEventListener("change", applyFilters);
els.sort.addEventListener("change", applyFilters);

renderLegend();
applyFilters();


const themeToggle = document.getElementById("themeToggle");
const THEME_KEY = "tree-platform-theme";

function setTheme(mode){
  const isLight = mode === "light";
  document.body.classList.toggle("light-mode", isLight);
  if(themeToggle){
    themeToggle.textContent = isLight ? "☀️ Light" : "🌙 Dark";
    themeToggle.setAttribute("aria-pressed", String(isLight));
  }
  try{ localStorage.setItem(THEME_KEY, mode); }catch(e){}
}

function initTheme(){
  let saved = null;
  try{ saved = localStorage.getItem(THEME_KEY); }catch(e){}
  if(saved !== "light" && saved !== "dark"){
    saved = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  setTheme(saved);
}

if(themeToggle){
  themeToggle.addEventListener("click", ()=>{
    const next = document.body.classList.contains("light-mode") ? "dark" : "light";
    setTheme(next);
  });
}

initTheme();
