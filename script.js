function toHex(n) {
  return n.toString(16).padStart(2, '0').toUpperCase();
}

function rgbToHex(r, g, b) {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255),
  };
}

function hslToHex(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}


const rangeR = document.getElementById('rangeR');
const rangeG = document.getElementById('rangeG');
const rangeB = document.getElementById('rangeB');
const valR = document.getElementById('valR');
const valG = document.getElementById('valG');
const valB = document.getElementById('valB');
const rgbPreview = document.getElementById('rgbPreview');
const rgbHexLabel = document.getElementById('rgbHexLabel');
const rgbCode = document.getElementById('rgbCode');
const hexCode = document.getElementById('hexCode');

function updateRGB() {
  const r = +rangeR.value;
  const g = +rangeG.value;
  const b = +rangeB.value;

  valR.textContent = r;
  valG.textContent = g;
  valB.textContent = b;

  const hex = rgbToHex(r, g, b);
  rgbPreview.style.background = `rgb(${r}, ${g}, ${b})`;
  rgbHexLabel.textContent = hex;
  rgbCode.textContent = `rgb(${r}, ${g}, ${b})`;
  hexCode.textContent = hex;
}

rangeR.addEventListener('input', updateRGB);
rangeG.addEventListener('input', updateRGB);
rangeB.addEventListener('input', updateRGB);
updateRGB();


const canvas = document.getElementById('colorWheel');
const ctx = canvas.getContext('2d');
const hueSlider = document.getElementById('hueSlider');
const hueLabel = document.getElementById('hueLabel');
const wheelMarker = document.getElementById('wheelMarker');
const harmonyPalette = document.getElementById('harmonyPalette');
const harmonyDesc = document.getElementById('harmonyDesc');

function drawColorWheel() {
  const size = canvas.width;
  const radius = size / 2;
  const imageData = ctx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - radius;
      const dy = y - radius;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const i = (y * size + x) * 4;

      if (dist <= radius) {

        let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        if (angle < 0) angle += 360;

        const sat = Math.min(100, (dist / radius) * 100);
        const { r, g, b } = hslToRgb(angle, sat, 50);

        imageData.data[i] = r;
        imageData.data[i + 1] = g;
        imageData.data[i + 2] = b;
        imageData.data[i + 3] = 255;
      } else {
        imageData.data[i + 3] = 0; 
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}
drawColorWheel();

function updateMarker(hue) {
  const size = canvas.width;
  const radius = size / 2 - 12;
  const rad = ((hue - 90) * Math.PI) / 180;
  const x = radius * Math.cos(rad);
  const y = radius * Math.sin(rad);

  wheelMarker.style.transform =
    `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  wheelMarker.style.background = hslToHex(hue, 90, 55);
}

function updateHarmony(hue, type) {
  let hues = [];
  let desc = '';

  if (type === 'complementar') {
    hues = [hue, (hue + 180) % 360];
    desc = 'Cores complementares: ângulos opostos (180°). Contraste máximo.';
  } else if (type === 'analogas') {
    hues = [(hue + 330) % 360, hue, (hue + 30) % 360];
    desc = 'Cores análogas: vizinhas no círculo (±30°). Harmonia suave.';
  } else if (type === 'triade') {
    hues = [hue, (hue + 120) % 360, (hue + 240) % 360];
    desc = 'Tríade: três cores equidistantes (120°). Equilíbrio e vivacidade.';
  }

  harmonyDesc.textContent = desc;
  harmonyPalette.innerHTML = '';

  hues.forEach(h => {
    const hex = hslToHex(h, 75, 55);
    const swatch = document.createElement('div');
    swatch.className = 'harmony-swatch';
    swatch.style.background = hex;
    swatch.textContent = hex;
    swatch.title = `Clique para copiar ${hex}`;
    swatch.addEventListener('click', () => {
      navigator.clipboard.writeText(hex);
      swatch.textContent = '✓ copiado';
      setTimeout(() => (swatch.textContent = hex), 900);
    });
    harmonyPalette.appendChild(swatch);
  });
}

hueSlider.addEventListener('input', () => {
  const hue = +hueSlider.value;
  hueLabel.textContent = `${hue}°`;
  updateMarker(hue);
  const active = document.querySelector('.harmony-buttons button.active');
  if (active) updateHarmony(hue, active.dataset.harmony);
});

document.querySelectorAll('.harmony-buttons button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.harmony-buttons button')
      .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateHarmony(+hueSlider.value, btn.dataset.harmony);
  });
});

updateMarker(+hueSlider.value);
document.querySelector('[data-harmony="complementar"]').click();

const textColor = document.getElementById('textColor');
const bgColor = document.getElementById('bgColor');
const contrastPreview = document.getElementById('contrastPreview');
const ratioValue = document.getElementById('ratioValue');
const contrastBadge = document.getElementById('contrastBadge');

function luminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1, hex2) {
  const l1 = luminance(hexToRgb(hex1));
  const l2 = luminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function updateContrast() {
  const fg = textColor.value;
  const bg = bgColor.value;

  contrastPreview.style.background = bg;
  contrastPreview.style.color = fg;

  const ratio = contrastRatio(fg, bg);
  ratioValue.textContent = `${ratio.toFixed(2)}:1`;

  contrastBadge.className = 'badge';
  if (ratio >= 7) {
    contrastBadge.textContent = 'AAA ✓';
    contrastBadge.classList.add('pass');
  } else if (ratio >= 4.5) {
    contrastBadge.textContent = 'AA ✓';
    contrastBadge.classList.add('pass');
  } else if (ratio >= 3) {
    contrastBadge.textContent = 'AA (texto grande)';
  } else {
    contrastBadge.textContent = 'Falha ✗';
    contrastBadge.classList.add('fail');
  }
}

textColor.addEventListener('input', updateContrast);
bgColor.addEventListener('input', updateContrast);
updateContrast();

const paletteStart = document.getElementById('paletteStart');
const paletteEnd = document.getElementById('paletteEnd');
const paletteStrip = document.getElementById('paletteStrip');
const generatePaletteBtn = document.getElementById('generatePalette');

function generatePalette() {
  const start = hexToRgb(paletteStart.value);
  const end = hexToRgb(paletteEnd.value);
  const steps = 6;

  paletteStrip.innerHTML = '';

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);

    const r = Math.round(start.r + (end.r - start.r) * t);
    const g = Math.round(start.g + (end.g - start.g) * t);
    const b = Math.round(start.b + (end.b - start.b) * t);

    const hex = rgbToHex(r, g, b);
    const swatch = document.createElement('div');
    swatch.className = 'palette-swatch';
    swatch.style.background = hex;
    swatch.textContent = hex;
    swatch.title = `Clique para copiar ${hex}`;
    swatch.addEventListener('click', () => {
      navigator.clipboard.writeText(hex);
      swatch.textContent = '✓';
      setTimeout(() => (swatch.textContent = hex), 900);
    });
    paletteStrip.appendChild(swatch);
  }
}

generatePaletteBtn.addEventListener('click', generatePalette);
paletteStart.addEventListener('input', generatePalette);
paletteEnd.addEventListener('input', generatePalette);
generatePalette();

function analisarImagem(img) {
  return new Promise((resolve, reject) => {
    try {
      const MAX_W = 800;
      const escala = Math.min(1, MAX_W / img.naturalWidth);
      const w = Math.round(img.naturalWidth * escala);
      const h = Math.round(img.naturalHeight * escala);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      const { data } = ctx.getImageData(0, 0, w, h);
      const total = w * h;

      const tons = new Float32Array(total);
      let soma = 0;

      for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const tom = 0.299 * r + 0.587 * g + 0.114 * b;
        tons[p] = tom;
        soma += tom;
      }

      const media = soma / total;

      let somaDif = 0;
      const histograma = new Array(256).fill(0);

      for (let p = 0; p < total; p++) {
        const t = tons[p];
        somaDif += (t - media) ** 2;
        histograma[Math.min(255, Math.floor(t))]++;
      }

      const variancia = somaDif / total;
      const desvioPadrao = Math.sqrt(variancia);

      resolve({ media, variancia, desvioPadrao, histograma, total });
    } catch (err) {
      reject(err);
    }
  });
}

const uploads = [
  {
    box: document.getElementById('uploadBox1'),
    input: document.getElementById('fileInput1'),
    preview: document.getElementById('preview1'),
    resultado: null,
    nomeArquivo: null,
  },
  {
    box: document.getElementById('uploadBox2'),
    input: document.getElementById('fileInput2'),
    preview: document.getElementById('preview2'),
    resultado: null,
    nomeArquivo: null,
  },
];

const statsResults = document.getElementById('statsResults');

function registrarUpload(slotIndex) {
  const slot = uploads[slotIndex];

  slot.box.addEventListener('click', () => slot.input.click());

  slot.input.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) processarArquivo(slotIndex, file);
  });

  slot.box.addEventListener('dragover', (e) => {
    e.preventDefault();
    slot.box.classList.add('dragover');
  });
  slot.box.addEventListener('dragleave', () => {
    slot.box.classList.remove('dragover');
  });
  slot.box.addEventListener('drop', (e) => {
    e.preventDefault();
    slot.box.classList.remove('dragover');
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processarArquivo(slotIndex, file);
    }
  });
}

async function processarArquivo(slotIndex, file) {
  const slot = uploads[slotIndex];

  if (!file.type.startsWith('image/')) {
    alert('Por favor, envie um arquivo de imagem.');
    return;
  }
  if (file.size > 15 * 1024 * 1024) {
    alert('Imagem muito grande (máx. 15MB).');
    return;
  }

  slot.nomeArquivo = file.name;
  renderizarLoading();

  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    slot.preview.src = dataUrl;
    slot.box.classList.add('has-image');

    slot.resultado = await analisarImagem(img);

    renderizarResultados();
  } catch (err) {
    console.error(err);
    alert('Não foi possível processar a imagem.');
  }
}

function renderizarLoading() {
  statsResults.innerHTML = `
    <p class="stats-empty">Processando imagem...<span class="stat-loading"></span></p>
  `;
}

function renderizarResultados() {
  const comResultado = uploads.filter((u) => u.resultado);

  if (comResultado.length === 0) {
    statsResults.innerHTML = `
      <p class="stats-empty">Envie ao menos uma imagem para começar a análise.</p>
    `;
    return;
  }

  let vencedoraIndex = -1;
  if (uploads[0].resultado && uploads[1].resultado) {
    vencedoraIndex =
      uploads[0].resultado.variancia >= uploads[1].resultado.variancia
        ? 0
        : 1;
  }

  statsResults.innerHTML = '';

  uploads.forEach((slot, idx) => {
    if (!slot.resultado) return;

    const r = slot.resultado;
    const card = document.createElement('div');
    card.className = 'stat-card' + (idx === vencedoraIndex ? ' winner' : '');

    // Histograma normalizado para 64 barras (visual compacto)
    const buckets = 64;
    const hist = new Array(buckets).fill(0);
    r.histograma.forEach((v, i) => {
      hist[Math.floor((i / 256) * buckets)] += v;
    });
    const maxHist = Math.max(...hist);
    const barras = hist
      .map((v) => `<div style="height:${(v / maxHist) * 100}%"></div>`)
      .join('');

    card.innerHTML = `
      <h3>${slot.nomeArquivo || `Imagem ${idx + 1}`}</h3>
      <div class="stat-row">
        <span>Resolução analisada</span>
        <span>${r.total.toLocaleString('pt-BR')} px</span>
      </div>
      <div class="stat-row">
        <span>Média (μ)</span>
        <span>${r.media.toFixed(2)}</span>
      </div>
      <div class="stat-row">
        <span>Variância (σ²)</span>
        <span>${r.variancia.toFixed(2)}</span>
      </div>
      <div class="stat-row">
        <span>Desvio padrão (σ)</span>
        <span>${r.desvioPadrao.toFixed(2)}</span>
      </div>
      <div class="stat-histogram" title="Distribuição dos tons de cinza (0–255)">
        ${barras}
      </div>
    `;

    statsResults.appendChild(card);
  });

  if (vencedoraIndex !== -1) {
    const vencedora = uploads[vencedoraIndex];
    const perdedora = uploads[1 - vencedoraIndex];

    const razao = (vencedora.resultado.variancia /
      Math.max(perdedora.resultado.variancia, 0.0001)).toFixed(2);

    const verdict = document.createElement('div');
    verdict.className = 'stats-verdict';
    verdict.innerHTML = `
      A imagem <strong>${vencedora.nomeArquivo}</strong> possui maior variação
      de tons (${vencedora.resultado.variancia.toFixed(2)} contra
      ${perdedora.resultado.variancia.toFixed(2)}). A variância é
      <strong>${razao}×</strong> maior — ou seja, mais contraste interno.
    `;
    statsResults.appendChild(verdict);
  }
}

registrarUpload(0);
registrarUpload(1);