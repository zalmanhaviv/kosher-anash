window.KA_STYLE = {
  name: 'wolt', sw: 2, clusterR: 40, peek: 190,
  marker(p, st, sel, h) {
    const on = /[ys]/.test(st.s);
    if (sel) return { ax: 26, ay: 26, html: `<span class="mk-w big">${h.badge(p.hc)}<span class="lb">${h.esc(p.n)}</span></span>` };
    return { ax: 18, ay: 18, html: `<span class="mk-w${on ? '' : ' dim'}">${h.badge(p.hc)}${on ? `<span class="sd ${st.s}"></span>` : ''}</span>` };
  },
  cluster(n) { const s = n < 10 ? 38 : n < 100 ? 44 : 50; return { ax: s / 2, ay: s / 2, html: `<span class="cl-w num" style="--s:${s}px">${n}</span>` }; },
};
