window.KA_STYLE = {
  name: 'apple', sw: 1.75, clusterR: 36, peek: 182,
  marker(p, st, sel, h) {
    if (sel) {
      const fill = p.hc === 'products' ? 'var(--surface)' : `var(--k-${p.hc})`, ink = p.hc === 'products' ? 'var(--k-products)' : 'var(--k-on)';
      return { ax: 24, ay: 60, html: `<span class="mk-sel"><svg width="48" height="60" viewBox="0 0 48 60" aria-hidden="true"><path d="M24 58c0 0-19-17.5-19-33a19 19 0 0 1 38 0c0 15.5-19 33-19 33z" fill="${fill}" stroke="var(--pin-ring)" stroke-width="2.5"${p.hc === 'products' ? '' : ''}/>${p.hc === 'products' ? '<path d="M24 54c0 0-16-15.5-16-29a16 16 0 0 1 32 0c0 13.5-16 29-16 29z" fill="none" stroke="var(--k-products)" stroke-width="2"/>' : ''}<text x="24" y="31" text-anchor="middle" font-size="19" font-weight="800" fill="${ink}" font-family="var(--font)">${h.HL[p.hc]}</text></svg><span class="lb">${h.esc(p.n)}</span></span>` };
    }
    return { ax: 15, ay: 15, html: `<span class="mk-a${/[ys]/.test(st.s) ? '' : ' dim'}">${h.badge(p.hc)}${/[ys]/.test(st.s) ? `<span class="sd ${st.s}"></span>` : ''}</span>` };
  },
  cluster(n) { const s = n < 10 ? 32 : n < 100 ? 38 : 44; return { ax: s / 2, ay: s / 2, html: `<span class="cl-a num" style="--s:${s}px">${n}</span>` }; },
};
