/* FF dashboard helpers: trades rendering, search debounce, a11y count, state persistence */

(function() {
  // --- debounce ---
  function debounce(fn, wait){ let t; return function(...a){ clearTimeout(t); t=setTimeout(()=>fn.apply(this,a), wait); }; }

  // --- tiny templating escapes ---
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));

  // --- buildTable with empty fallback ---
  function buildTable(id, rows) {
    if (!rows || !rows.length) {
      return `<table class="table" id="${esc(id)}"><tbody><tr><td class="no-data">No matches</td></tr></tbody></table>`;
    }
    // Expect rows already HTML or render cells here; leaving as-is if provided upstream
    return `<table class="table" id="${esc(id)}"><tbody>${rows.join('')}</tbody></table>`;
  }

  // --- render Trades section (always show headings; "No matches" if empty) ---
  function renderTradesSection({weekSlug, baseDash, tradesBuyRows, tradesSellRows}) {
    let html = `<section id="trades-section"><h3>Trades</h3>`;
    html += `<h4>Buy Lows</h4>${buildTable('trades_buy', tradesBuyRows || [])}`;
    html += `<h4>Sell Highs</h4>${buildTable('trades_sell', tradesSellRows || [])}`;
    if (baseDash && weekSlug) {
      html += `<p class="section-link"><a href="${esc(`${baseDash}/trades_w${weekSlug}.html`)}">Full trades report</a></p>`;
    }
    html += `</section>`;
    return html;
  }

  // --- Results count (aria-live) ---
  function attachResultsCount(counterSel, tableSel) {
    const live = document.querySelector(counterSel);
    if (!live) return;
    live.setAttribute('role','status');
    live.setAttribute('aria-live','polite');
    const update = () => {
      const table = document.querySelector(tableSel);
      if (!table) return;
      const rows = table.querySelectorAll('tbody tr');
      // Ignore the header rows if present; here we just count body rows
      const n = rows.length;
      live.textContent = `${n} result${n===1?'':'s'}`;
    };
    update();
    const obs = new MutationObserver(update);
    const table = document.querySelector(tableSel);
    if (table) obs.observe(table, {childList:true, subtree:true});
  }

  // --- Search (debounced) + filter persistence ---
  function persist(key, value){ try{ localStorage.setItem(key, JSON.stringify(value)); }catch(e){} }
  function restore(key, fallback){ try{ const v=localStorage.getItem(key); return v?JSON.parse(v):fallback;}catch(e){return fallback;} }

  function hookSearch(inputSel, onChange, key="ff:search") {
    const el = document.querySelector(inputSel);
    if (!el) return;
    el.value = restore(key, "");
    const run = debounce((v)=>{ persist(key, v); onChange(v); }, 200);
    el.addEventListener('input', (e)=> run(e.target.value || ""));
    // fire once on load
    onChange(el.value || "");
  }

  function hookToggles(containerSel, onChange, key="ff:filters") {
    const c = document.querySelector(containerSel);
    if (!c) return;
    const saved = restore(key, {});
    // Apply saved states to checkboxes/toggles with [data-key]
    c.querySelectorAll('[data-key]').forEach(el=>{
      const k = el.getAttribute('data-key');
      if (k in saved) {
        if ('checked' in el) el.checked = !!saved[k];
        el.setAttribute('aria-pressed', saved[k] ? 'true' : 'false');
        el.classList.toggle('active', !!saved[k]);
      }
    });
    c.addEventListener('change', (e)=>{
      const t = e.target;
      if (t && t.matches('[data-key]')) {
        const k = t.getAttribute('data-key');
        const v = ('checked' in t) ? !!t.checked : t.getAttribute('aria-pressed')==='true';
        saved[k]=v; persist(key, saved);
        onChange(saved);
      }
    });
    // Also click handlers for button-style toggles
    c.addEventListener('click', (e)=>{
      const t = e.target.closest('[data-key][role=button]');
      if (!t) return;
      const k = t.getAttribute('data-key');
      const v = t.getAttribute('aria-pressed') !== 'true';
      t.setAttribute('aria-pressed', v ? 'true' : 'false');
      t.classList.toggle('active', v);
      saved[k]=v; persist(key, saved);
      onChange(saved);
    });
    // initial
    onChange(saved);
  }

  // Expose minimal API to window so existing code can call it without refactoring
  window.FFDash = Object.assign(window.FFDash || {}, {
    renderTradesSection,
    attachResultsCount,
    hookSearch,
    hookToggles,
    buildTable, // in case you want to reuse elsewhere
  });
})();

// --- CSV export from a table (#id) ---
function exportTableToCSV(tableSelector, filename="export.csv") {
  const tbl = document.querySelector(tableSelector);
  if (!tbl) return;
  const rows = Array.from(tbl.querySelectorAll('tr'));
  const csv = rows.map(tr => {
    const cells = Array.from(tr.querySelectorAll('th,td')).map(td => {
      let t = (td.innerText || '').replace(/\r?\n|\r/g,' ').replace(/"/g,'""');
      return `"${t}"`;
    });
    return cells.join(',');
  }).join('\n');
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// --- Deep-link state (sync search/filters to URL ?q=...&f=...) ---
function syncStateToURL(state) {
  const u = new URL(window.location.href);
  if (state.q != null) u.searchParams.set('q', state.q);
  if (state.filters) u.searchParams.set('f', encodeURIComponent(JSON.stringify(state.filters)));
  history.replaceState(null, '', u.toString());
}
function readStateFromURL() {
  const u = new URL(window.location.href);
  const q = u.searchParams.get('q') || "";
  let filters = {};
  const f = u.searchParams.get('f');
  if (f) { try { filters = JSON.parse(decodeURIComponent(f)); } catch(e) {} }
  return { q, filters };
}

window.FFDash = Object.assign(window.FFDash || {}, {
  exportTableToCSV,
  syncStateToURL,
  readStateFromURL
});
