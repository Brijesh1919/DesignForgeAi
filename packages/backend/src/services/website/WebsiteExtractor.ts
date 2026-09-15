/**
 * DesignForge AI — Website URL → Figma: In-Page Extractor
 *
 * Provides the extraction script injected into rendered pages via page.evaluate().
 * The returned string is self-contained JavaScript that runs in the browser context.
 */

const EXTRACTION_SCRIPT: string = `(function extractDesignTree() {
  let nodeIdCounter = 0;
  function nextId() { return 'wn_' + (++nodeIdCounter); }

  function rgbaToHex(s) {
    if (!s) return '#00000000';
    const t = s.trim();
    if (t === 'transparent') return '#00000000';
    if (t.startsWith('#')) {
      if (t.length === 4) return ('#' + t[1] + t[1] + t[2] + t[2] + t[3] + t[3]).toUpperCase();
      return t.toUpperCase();
    }
    try {
      const c = document.createElement('canvas'); c.width = 1; c.height = 1;
      const cx = c.getContext('2d');
      if (cx) {
        cx.fillStyle = s; cx.fillRect(0, 0, 1, 1);
        const d = cx.getImageData(0, 0, 1, 1).data;
        const r = d[0].toString(16).padStart(2, '0'), g = d[1].toString(16).padStart(2, '0'), b = d[2].toString(16).padStart(2, '0');
        const a = d[3] < 255 ? d[3].toString(16).padStart(2, '0') : '';
        return ('#' + r + g + b + a).toUpperCase();
      }
    } catch(e) {}
    const m = t.match(/^rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
    if (!m) return '#00000000';
    const r = parseInt(m[1]).toString(16).padStart(2, '0'), g = parseInt(m[2]).toString(16).padStart(2, '0'), b = parseInt(m[3]).toString(16).padStart(2, '0');
    let a = '';
    if (m[4] !== undefined) {
      const al = parseFloat(m[4]);
      if (al < 1) a = Math.round(al * 255).toString(16).padStart(2, '0');
    }
    return ('#' + r + g + b + a).toUpperCase();
  }

  function px(v) { if (!v) return 0; const n = parseFloat(v); return isNaN(n) ? 0 : Math.round(n); }

  function parseFW(fw) {
    if (!fw) return 'Regular';
    const lo = fw.toLowerCase().trim();
    if (lo === 'bold') return 'Bold';
    if (lo === 'normal') return 'Regular';
    if (lo === 'lighter') return 'Light';
    if (lo === 'bolder') return 'ExtraBold';
    const n = parseInt(fw, 10);
    if (isNaN(n)) return 'Regular';
    if (n <= 300) return 'Light';
    if (n === 400) return 'Regular';
    if (n === 500) return 'Medium';
    if (n === 600) return 'SemiBold';
    if (n === 700) return 'Bold';
    if (n >= 800) return 'ExtraBold';
    return 'Regular';
  }

  function parseLH(lh, fs) {
    if (!lh || lh === 'normal') return Math.round(fs * 1.2);
    if (lh.endsWith('px')) return Math.round(parseFloat(lh)) || Math.round(fs * 1.2);
    if (lh.endsWith('%')) return Math.round((parseFloat(lh) / 100) * fs);
    if (lh.endsWith('em') || lh.endsWith('rem')) return Math.round(parseFloat(lh) * fs);
    const n = parseFloat(lh);
    if (!isNaN(n)) return n > 0 && n < 5 ? Math.round(n * fs) : Math.round(n);
    return Math.round(fs * 1.2);
  }

  function parseBoxShadow(bs) {
    const effects = [];
    if (!bs || bs === 'none') return effects;
    const shadows = bs.split(/,(?![^(]*\\))/);
    for (const shadow of shadows) {
      const tr = shadow.trim(); if (!tr) continue;
      const cm = tr.match(/(rgba?\\(.*?\\)|#[0-9a-fA-F]{3,8}|\\b[a-zA-Z]+\\b)/); if (!cm) continue;
      const cs = cm[0], rest = tr.replace(cs, '').trim();
      const nums = (rest.match(/(-?\\d+(?:\\.\\d+)?px|-?\\d+(?:\\.\\d+)?\\b)/g) || []);
      const ox = nums[0] ? px(nums[0]) : 0, oy = nums[1] ? px(nums[1]) : 0, blur = nums[2] ? px(nums[2]) : 0, spread = nums[3] ? px(nums[3]) : 0;
      const col = rgbaToHex(cs);
      effects.push({
        type: tr.includes('inset') ? 'INNER_SHADOW' : 'DROP_SHADOW',
        color: col.substring(0, 7),
        offsetX: ox, offsetY: oy, blur, spread,
        opacity: col.length > 7 ? parseInt(col.substring(7, 9), 16) / 255 : 0.25,
        visible: true
      });
    }
    return effects;
  }

  const SKIP = new Set(['script', 'style', 'noscript', 'meta', 'link', 'head', 'template', 'iframe']);
  const STRUCT = new Set(['table', 'thead', 'tbody', 'tr', 'td', 'th', 'button', 'input', 'select', 'textarea', 'form', 'a', 'label', 'nav', 'header', 'footer', 'main', 'section', 'article', 'aside', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'figure', 'figcaption', 'details', 'summary', 'div']);

  function isVisible(el, style) {
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (style.display === 'contents') return true;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      if (el.children.length > 0) return true;
      const hasText = el.textContent && el.textContent.trim().length > 0;
      const hasSvg = el.querySelector('svg') !== null || el.tagName.toLowerCase() === 'svg';
      const hasImg = el.tagName.toLowerCase() === 'img' || el.querySelector('img') !== null;
      const hasForm = ['input', 'button', 'select', 'textarea'].includes(el.tagName.toLowerCase());
      return !!(hasText || hasSvg || hasImg || hasForm);
    }
    // Filter out invisible 1px/0px stubs (like cookie banner stubs, tracking anchors)
    if (rect.width <= 1 && rect.height <= 1 && el.children.length === 0) {
      const hasText = el.textContent && el.textContent.trim().length > 0;
      const hasImg = el.tagName.toLowerCase() === 'img' || el.tagName.toLowerCase() === 'svg';
      if (!hasText && !hasImg) return false;
    }
    return true;
  }

  function extractPseudo(el, pseudo) {
    try {
      const s = window.getComputedStyle(el, pseudo);
      if (!s || s.display === 'none' || s.visibility === 'hidden') return null;
      if (!s.content || s.content === 'none' || s.content === 'normal') return null;
      let raw = s.content.replace(/^['"](.*)['"]$/, '$1').trim();
      if (raw === 'none' || raw === 'normal') raw = '';
      const pw = px(s.width), ph = px(s.height), bgc = rgbaToHex(s.backgroundColor);
      const hasBg = bgc !== '#00000000' && !bgc.endsWith('00');
      const hasBgImg = s.backgroundImage && s.backgroundImage !== 'none';
      if (!raw && pw === 0 && ph === 0 && !hasBg && !hasBgImg) return null;
      const fills = [];
      if (hasBg) fills.push({ type: 'SOLID', color: bgc.substring(0, 7), opacity: bgc.length > 7 ? parseInt(bgc.substring(7, 9), 16) / 255 : 1.0 });
      const fs = px(s.fontSize) || 14;
      return {
        id: nextId(), type: raw ? 'TEXT' : 'FRAME', tagName: pseudo.replace('::', ''), name: pseudo.replace('::', '') + '-decoration',
        bounds: { x: px(s.left) || 0, y: px(s.top) || 0, width: Math.max(1, pw || 20), height: Math.max(1, ph || 20) },
        layout: { display: s.display, direction: 'NONE', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-start', flexWrap: 'nowrap', gap: 0, rowGap: 0, columnGap: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0, flexGrow: 0, flexShrink: 1, alignSelf: 'auto' },
        style: { fills, strokes: [], effects: [], cornerRadius: px(s.borderRadius) || 0, opacity: parseFloat(s.opacity) || 1.0, clipsContent: s.overflow === 'hidden', visible: true, position: s.position || 'absolute', zIndex: 0, overflow: s.overflow || 'visible' },
        text: raw ? { content: raw, fontFamily: (s.fontFamily.split(',')[0] || 'Inter').replace(/['"]/g, '').trim(), fontWeight: parseFW(s.fontWeight), fontSize: fs, lineHeight: parseLH(s.lineHeight, fs), letterSpacing: px(s.letterSpacing) || 0, textAlign: 'LEFT', textCase: 'ORIGINAL', textDecoration: 'NONE', color: rgbaToHex(s.color).substring(0, 7), opacity: 1.0, width: Math.max(1, pw || 20), height: Math.max(1, ph || 20) } : undefined,
        isPseudo: true, pseudoType: pseudo === '::before' ? 'before' : 'after', children: []
      };
    } catch(e) { return null; }
  }

  function traverseElement(el, parentRect, depth) {
    if (depth > 60) return null;
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    if (SKIP.has(tag)) return null;
    const style = window.getComputedStyle(el);
    if (!isVisible(el, style)) return null;
    const rect = el.getBoundingClientRect();
    const x = Math.round(rect.left - (parentRect ? parentRect.left : 0));
    const y = Math.round(rect.top - (parentRect ? parentRect.top : 0));
    const width = Math.max(1, Math.round(rect.width)), height = Math.max(1, Math.round(rect.height));

    let type = 'FRAME', svgContent = undefined, imageRef = undefined;
    if (tag === 'img') {
      type = 'IMAGE';
      let isrc = el.currentSrc || el.src || el.getAttribute('data-src') || el.getAttribute('src') || '';
      if (isrc) { try { isrc = new URL(isrc, window.location.href).href; } catch(e) {} }
      imageRef = isrc || undefined;
      if (isrc && (isrc.toLowerCase().includes('.svg') || isrc.startsWith('data:image/svg+xml'))) {
        type = 'VECTOR';
        if (isrc.startsWith('data:image/svg+xml;utf8,') || isrc.startsWith('data:image/svg+xml,')) {
          try { svgContent = decodeURIComponent(isrc.split(',')[1]); } catch(e) {}
        } else if (isrc.startsWith('data:image/svg+xml;base64,')) {
          try { svgContent = atob(isrc.split(',')[1]); } catch(e) {}
        }
      }
    } else if (tag === 'svg') {
      type = 'VECTOR';
      try {
        const c = rgbaToHex(style.color).substring(0, 7);
        let raw = el.outerHTML;
        if (c && c !== '#00000000') raw = raw.replace(/currentColor/g, c);
        svgContent = raw;
      } catch(e) { svgContent = el.outerHTML; }
    }

    const bgCol = rgbaToHex(style.backgroundColor);
    const bgTransp = bgCol === '#00000000' || bgCol.endsWith('00') || style.backgroundColor === 'transparent';
    const bT = parseInt(style.borderTopWidth) || 0, bR = parseInt(style.borderRightWidth) || 0;
    const bB = parseInt(style.borderBottomWidth) || 0, bL = parseInt(style.borderLeftWidth) || 0;
    const hasBorders = bT > 0 || bR > 0 || bB > 0 || bL > 0;

    if (type === 'FRAME' && !STRUCT.has(tag) && el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE && bgTransp && !hasBorders && (!style.boxShadow || style.boxShadow === 'none') && px(style.paddingTop) === 0 && px(style.paddingRight) === 0 && px(style.paddingBottom) === 0 && px(style.paddingLeft) === 0) {
      type = 'TEXT';
    }

    const fills = [];
    if (!bgTransp) fills.push({ type: 'SOLID', color: bgCol.substring(0, 7), opacity: bgCol.length > 7 ? parseInt(bgCol.substring(7, 9), 16) / 255 : 1.0 });
    if (style.backgroundImage && style.backgroundImage !== 'none') {
      const um = style.backgroundImage.match(/url\\(["']?([^"'\\)]+)["']?\\)/);
      if (um && um[1]) { if (el.children.length === 0) type = 'IMAGE'; imageRef = um[1]; }
      else if (style.backgroundImage.includes('gradient')) {
        const gm = style.backgroundImage.match(/(rgba?\\(.*?\\)|#[0-9a-fA-F]{3,8})/g);
        if (gm && gm.length >= 2) {
          const stops = gm.map((c, i) => {
            const h = rgbaToHex(c);
            return { position: i / (gm.length - 1), color: h.substring(0, 7), opacity: h.length > 7 ? parseInt(h.substring(7, 9), 16) / 255 : 1.0 };
          });
          fills.push({ type: style.backgroundImage.includes('radial') ? 'GRADIENT_RADIAL' : 'GRADIENT_LINEAR', gradientStops: stops });
        }
      }
    }

    const strokes = [];
    if (hasBorders) {
      let bc = style.borderColor;
      if (!bc || bc.includes(' ')) bc = style.borderTopColor || style.borderBottomColor || style.borderLeftColor || style.borderRightColor || '#000000';
      const sc = rgbaToHex(bc);
      strokes.push({
        color: sc.substring(0, 7), opacity: sc.length > 7 ? parseInt(sc.substring(7, 9), 16) / 255 : 1.0,
        weight: Math.max(bT, bR, bB, bL),
        weights: { top: style.borderTopStyle !== 'none' ? bT : 0, right: style.borderRightStyle !== 'none' ? bR : 0, bottom: style.borderBottomStyle !== 'none' ? bB : 0, left: style.borderLeftStyle !== 'none' ? bL : 0 },
        position: 'INSIDE'
      });
    }

    const effects = parseBoxShadow(style.boxShadow);
    const fv = style.filter || '';
    if (fv && fv !== 'none') { const bm = fv.match(/blur\\((\\d+(?:\\.\\d+)?)(px)?\\)/); if (bm) effects.push({ type: 'LAYER_BLUR', radius: Math.round(parseFloat(bm[1])), visible: true }); }
    const bdv = style.backdropFilter || '';
    if (bdv && bdv !== 'none') { const bm = bdv.match(/blur\\((\\d+(?:\\.\\d+)?)(px)?\\)/); if (bm) effects.push({ type: 'BACKGROUND_BLUR', radius: Math.round(parseFloat(bm[1])), visible: true }); }

    let cornerRadius;
    const brStr = style.borderRadius;
    if (brStr && brStr.includes(' ')) {
      const radii = brStr.split(/\\s+/).map(r => px(r));
      cornerRadius = { topLeft: radii[0] || 0, topRight: radii[1] || radii[0] || 0, bottomRight: radii[2] || radii[0] || 0, bottomLeft: radii[3] || radii[1] || radii[0] || 0 };
    } else {
      cornerRadius = px(brStr);
    }

    const disp = style.display, isFlex = disp === 'flex' || disp === 'inline-flex', isGrid = disp === 'grid' || disp === 'inline-grid';
    let dir = 'NONE';
    if (isFlex) {
      dir = (style.flexDirection || '').includes('column') ? 'VERTICAL' : 'HORIZONTAL';
    } else if (isGrid) {
      dir = 'HORIZONTAL';
    } else if (tag === 'body' || tag === 'html' || tag === 'main' || tag === 'section' || tag === 'article' || tag === 'header' || tag === 'footer' || disp === 'block' || disp === 'list-item') {
      // In CSS block formatting context, block elements stack their children vertically
      dir = 'VERTICAL';
    } else if (el.children.length >= 2) {
      const fc = [];
      for (let i = 0; i < el.children.length; i++) {
        const cs = window.getComputedStyle(el.children[i]);
        const cr = el.children[i].getBoundingClientRect();
        if (cs.position !== 'absolute' && cs.position !== 'fixed' && cr.width > 5 && cr.height > 5) {
          fc.push(el.children[i]);
        }
      }
      if (fc.length >= 2) {
        const r1 = fc[0].getBoundingClientRect(), r2 = fc[1].getBoundingClientRect();
        dir = Math.abs(r2.top - r1.top) >= Math.abs(r2.left - r1.left) ? 'VERTICAL' : 'HORIZONTAL';
      } else {
        dir = 'VERTICAL';
      }
    }

    const layout = {
      display: disp, direction: dir, flexDirection: style.flexDirection || 'row',
      justifyContent: style.justifyContent || 'flex-start', alignItems: style.alignItems || 'stretch',
      flexWrap: style.flexWrap || 'nowrap', gap: px(style.gap) || 0, rowGap: px(style.rowGap) || 0,
      columnGap: px(style.columnGap) || 0, paddingTop: px(style.paddingTop), paddingRight: px(style.paddingRight),
      paddingBottom: px(style.paddingBottom), paddingLeft: px(style.paddingLeft),
      marginTop: px(style.marginTop), marginRight: px(style.marginRight),
      marginBottom: px(style.marginBottom), marginLeft: px(style.marginLeft),
      flexGrow: parseFloat(style.flexGrow) || 0, flexShrink: parseFloat(style.flexShrink) || 1,
      alignSelf: style.alignSelf || 'auto', gridTemplateColumns: style.gridTemplateColumns || undefined
    };

    const nodeStyle = {
      fills, strokes, effects, cornerRadius, opacity: parseFloat(style.opacity) || 1.0,
      clipsContent: style.overflow === 'hidden', visible: true, position: style.position || 'static',
      zIndex: style.zIndex === 'auto' ? 0 : parseInt(style.zIndex, 10) || 0,
      overflow: style.overflow || 'visible', objectFit: style.objectFit || undefined,
      transform: style.transform && style.transform !== 'none' ? style.transform : undefined
    };

    let textData = undefined;
    if (type === 'TEXT') {
      const tc = el.textContent ? el.textContent.trim() : '', fs = px(style.fontSize) || 14;
      textData = {
        content: tc, fontFamily: (style.fontFamily.split(',')[0] || 'Inter').replace(/['"]/g, '').trim(),
        fontWeight: parseFW(style.fontWeight), fontSize: fs, lineHeight: parseLH(style.lineHeight, fs),
        letterSpacing: px(style.letterSpacing) || 0, textAlign: (style.textAlign || 'left').toUpperCase(),
        textCase: style.textTransform === 'uppercase' ? 'UPPER' : 'ORIGINAL',
        textDecoration: style.textDecorationLine === 'underline' ? 'UNDERLINE' : 'NONE',
        color: rgbaToHex(style.color).substring(0, 7), opacity: 1.0, width, height
      };
    }

    let name = tag.toUpperCase();
    const eid = el.id ? '#' + el.id : '';
    const ecl = el.className && typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\\s+/)[0] : '';
    name = (tag + eid + ecl) || name;

    const node = { id: nextId(), type, tagName: tag, name, bounds: { x, y, width, height }, layout, style: nodeStyle, text: textData, imageRef, svgContent, children: [] };

    const bp = extractPseudo(el, '::before'); if (bp) node.children.push(bp);

    if (type !== 'TEXT' && type !== 'IMAGE' && type !== 'VECTOR') {
      for (const child of Array.from(el.childNodes)) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const cn = traverseElement(child, rect, depth + 1);
          if (cn) {
            // Drop zero/1px invisible stubs from child list
            const isStub = (cn.bounds.width <= 1 || cn.bounds.height <= 1) &&
              (!cn.style.fills || cn.style.fills.length === 0) &&
              (!cn.style.strokes || cn.style.strokes.length === 0) &&
              !cn.imageRef && !cn.svgContent &&
              (!cn.text || !cn.text.content || !cn.text.content.trim()) &&
              cn.children.length === 0;
            if (!isStub) {
              node.children.push(cn);
            }
          }
        } else if (child.nodeType === Node.TEXT_NODE) {
          const tc = child.textContent ? child.textContent.trim() : '';
          if (tc) {
            try {
              const range = document.createRange(); range.selectNode(child);
              const tr = range.getBoundingClientRect();
              const tx = Math.round(tr.left - rect.left), ty = Math.round(tr.top - rect.top), tw = Math.max(1, Math.round(tr.width)), th = Math.max(1, Math.round(tr.height));
              const fs = px(style.fontSize) || 14;
              node.children.push({
                id: nextId(), type: 'TEXT', tagName: '#text', name: tc.substring(0, 20) || 'text',
                bounds: { x: tx, y: ty, width: tw, height: th },
                layout: { display: 'inline', direction: 'NONE', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-start', flexWrap: 'nowrap', gap: 0, rowGap: 0, columnGap: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0, flexGrow: 0, flexShrink: 1, alignSelf: 'auto' },
                style: { fills: [], strokes: [], effects: [], cornerRadius: 0, opacity: parseFloat(style.opacity) || 1.0, clipsContent: false, visible: true, position: 'static', zIndex: 0, overflow: 'visible' },
                text: { content: tc, fontFamily: (style.fontFamily.split(',')[0] || 'Inter').replace(/['"]/g, '').trim(), fontWeight: parseFW(style.fontWeight), fontSize: fs, lineHeight: parseLH(style.lineHeight, fs), letterSpacing: px(style.letterSpacing) || 0, textAlign: (style.textAlign || 'left').toUpperCase(), textCase: style.textTransform === 'uppercase' ? 'UPPER' : 'ORIGINAL', textDecoration: style.textDecorationLine === 'underline' ? 'UNDERLINE' : 'NONE', color: rgbaToHex(style.color).substring(0, 7), opacity: 1.0, width: tw, height: th },
                imageRef: undefined, svgContent: undefined, children: []
              });
            } catch(e) {}
          }
        }
      }
    }

    const ap = extractPseudo(el, '::after'); if (ap) node.children.push(ap);
    return node;
  }

  function collectAssets(root) {
    const assets = [];
    function walk(el) {
      const tag = el.tagName ? el.tagName.toLowerCase() : '';
      if (tag === 'img') {
        const src = el.currentSrc || el.src || el.getAttribute('src') || '';
        if (src) {
          const rect = el.getBoundingClientRect();
          assets.push({ id: 'img_' + assets.length, src, width: el.naturalWidth || Math.round(rect.width), height: el.naturalHeight || Math.round(rect.height), bounds: { x: Math.round(rect.left), y: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) } });
        }
      }
      for (const child of Array.from(el.children)) walk(child);
    }
    walk(root); return assets;
  }

  function collectFonts() {
    const seen = new Set(), fonts = [], all = document.querySelectorAll('*');
    for (const el of Array.from(all)) {
      const s = window.getComputedStyle(el), family = (s.fontFamily.split(',')[0] || '').replace(/['"]/g, '').trim(), weight = parseFW(s.fontWeight), style = s.fontStyle || 'normal', key = family + '|' + weight + '|' + style;
      if (family && !seen.has(key)) { seen.add(key); fonts.push({ family, weight, style }); }
    }
    return fonts;
  }

  try {
    const body = document.body || document.documentElement;
    const bodyRect = body.getBoundingClientRect();
    const pageWidth = Math.max(document.documentElement.scrollWidth, document.body ? document.body.scrollWidth : 0, bodyRect.width, window.innerWidth);
    const pageHeight = Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0, bodyRect.height);
    
    // Traverse starting at body (or documentElement if body missing) to eliminate redundant HTML wrapper
    const rootEl = document.body || document.documentElement;
    const rootNode = traverseElement(rootEl, { left: 0, top: 0 }, 0);
    
    if (rootNode) {
      rootNode.bounds = { x: 0, y: 0, width: pageWidth, height: pageHeight };
      rootNode.layout.direction = 'VERTICAL';
    }

    const assets = collectAssets(rootEl);
    const fonts = collectFonts();
    return { url: window.location.href, title: document.title || '', viewport: { width: window.innerWidth, height: window.innerHeight }, pageWidth, pageHeight, rootNode, assets, fonts, extractedAt: Date.now() };
  } catch(err) { return { error: String(err) }; }
})();`;

export function getWebsiteExtractionScript(): string {
  return EXTRACTION_SCRIPT;
}
