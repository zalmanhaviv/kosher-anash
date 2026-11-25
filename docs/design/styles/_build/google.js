window.KA_STYLE = {
  name: 'google', sw: 2, clusterR: 30, peek: 168, fabAbove: true, fab: 56, cardClose: true,
  // status coloured by its first word, the rest in grey – same text as everywhere else
  status(st, tx) {
    const m = st.t.match(/^(פתוח|נסגר|סגור עכשיו|סגור|נפתח)(.*)$/);
    if (!m || st.s === 'u' || st.s === 'x') return `<span class="stt st-${st.s}">${tx(st.t)}</span>`;
    return `<span class="stt st-${st.s}"><span class="w">${tx(m[1])}</span>${tx(m[2])}</span>`;
  },
  marker(p, st, sel, h) {
    const k = sel ? 1.5 : 1, w = 26 * k, ht = 36 * k, hollow = p.hc === 'products';
    const fill = hollow ? 'var(--surface)' : `var(--k-${p.hc})`, ink = hollow ? 'var(--k-products)' : 'var(--k-on)';
    const svg = `<svg class="pin-g${/[ysu]/.test(st.s) || sel ? '' : ' dim'}" width="${w}" height="${ht}" viewBox="0 0 26 36" aria-hidden="true"><path d="M13 35C13 35 2 21.5 2 13a11 11 0 0 1 22 0c0 8.5-11 22-11 22z" fill="${fill}" stroke="${hollow ? 'var(--k-products)' : 'var(--pin-ring)'}" stroke-width="${hollow ? 2 : 1.5}"/><text x="13" y="17.5" text-anchor="middle" font-size="12.5" font-weight="700" fill="${ink}" font-family="var(--font)">${h.HL[p.hc]}</text></svg>`;
    return { ax: w / 2, ay: ht, html: svg };
  },
  cluster(n) { const s = n < 10 ? 28 : n < 100 ? 34 : 40; return { ax: s / 2, ay: s / 2, html: `<span class="cl-g num" style="--s:${s}px">${n}</span>` }; },
};
