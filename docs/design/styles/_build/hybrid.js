window.KA_STYLE = {
  name: 'hybrid', sw: 2, clusterR: 36, peek: 184,
  // Apple's markers: a small circle with the kashrut letter; the selected place becomes a larger pin with its name
  marker(p, st, sel, h) {
    if (sel) {
      const hollow = p.hc === 'products', fill = hollow ? 'var(--surface)' : `var(--k-${p.hc})`, ink = hollow ? 'var(--k-products)' : 'var(--k-on)';
      return { ax: 24, ay: 60, html: `<span class="mk-hs"><svg width="48" height="60" viewBox="0 0 48 60" aria-hidden="true"><path d="M24 58c0 0-19-17.5-19-33a19 19 0 0 1 38 0c0 15.5-19 33-19 33z" fill="${fill}" stroke="var(--pin-ring)" stroke-width="2.5"/>${hollow ? '<path d="M24 54c0 0-16-15.5-16-29a16 16 0 0 1 32 0c0 13.5-16 29-16 29z" fill="none" stroke="var(--k-products)" stroke-width="2"/>' : ''}<text x="24" y="31" text-anchor="middle" font-size="19" font-weight="700" fill="${ink}" font-family="var(--font)">${h.HL[p.hc]}</text></svg><span class="lb">${h.esc(p.n)}</span></span>` };
    }
    const on = /[ys]/.test(st.s);
    return { ax: 16, ay: 16, html: `<span class="mk-h${on ? '' : ' dim'}">${h.badge(p.hc)}${on ? `<span class="sd ${st.s}"></span>` : ''}</span>` };
  },
  cluster(n) { const s = n < 10 ? 34 : n < 100 ? 40 : 46; return { ax: s / 2, ay: s / 2, html: `<span class="cl-h num" style="--s:${s}px">${n}</span>` }; },
};
