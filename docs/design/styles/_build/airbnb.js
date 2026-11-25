window.KA_STYLE = {
  name: 'airbnb', sw: 1.75, clusterR: 78, clusterRY: .5, peek: 196,
  // pill markers show the status ("עד 14:00"). Width is estimated so the anchor sits at the pill centre.
  marker(p, st, sel, h) {
    const t = h.shortSt(st), w = 30 + (t ? t.length * 7.2 + 6 : 0) + (sel ? 6 : 0);
    const cls = 'pill' + (sel ? ' sel' : '') + (t ? '' : ' only') + (st.s === 'n' ? ' closed' : '');
    return { ax: w / 2, ay: 14, html: `<span class="${cls}">${h.badge(p.hc)}${t ? `<span>${h.esc(t)}</span>` : ''}</span>` };
  },
  cluster(n) { const w = 26 + String(n).length * 8.5; return { ax: w / 2, ay: 15, html: `<span class="clp num">${n}</span>` }; },
};
