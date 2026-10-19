// ============================================================================
// 1. REACTIVE PUB/SUB STATE STORE (Memory-Capped for 4GB RAM Laptops)
// ============================================================================
const store = {
  price: 85000,
  open24h: 84200,
  candles: [],
  usdt: 100000,
  btc: 0,
  openOrders: [],
  trades: [],
  mempool: [],
  botEnabled: false,
  lastBotAction: 0,
  listeners: [],

  subscribe(fn) {
    this.listeners.push(fn);
  },

  notify(event = 'TICK') {
    for (const fn of this.listeners) fn(this, event);
  },

  getRSI(period = 14) {
    if (this.candles.length < period + 1) return 50;
    let gains = 0;
    let losses = 0;
    const slice = this.candles.slice(-(period + 1));
    for (let i = 1; i < slice.length; i++) {
      const diff = slice[i].close - slice[i - 1].close;
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }
    if (losses === 0) return 100;
    const rs = (gains / period) / (losses / period);
    return +(100 - 100 / (1 + rs)).toFixed(1);
  },

  getSMA(period = 7, index = this.candles.length - 1) {
    if (index < period - 1) return null;
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += this.candles[index - i].close;
    }
    return +(sum / period).toFixed(2);
  }
};

// ============================================================================
// 2. WEB AUDIO API SONAR SYNTHESIZER (For Whale Trade Alerts)
// ============================================================================
function playWhalePing() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {}
}

// ============================================================================
// 3. LIVE BINANCE WEBSOCKET + AUTOMATIC FALLBACK SIMULATOR
// ============================================================================
let fallbackTimer = null;

async function initMarketStream(onTradeTick) {
  const statusEl = document.getElementById('ws-status');

  // Seed 60 initial 1-minute candles
  try {
    const res = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=60');
    if (!res.ok) throw new Error('REST blocked');
    const data = await res.json();
    store.candles = data.map(k => ({
      time: k[0],
      open: +k[1],
      high: +k[2],
      low: +k[3],
      close: +k[4],
      volume: +k[5]
    }));
    store.price = store.candles[store.candles.length - 1].close;
    store.open24h = store.candles[0].open;
  } catch (err) {
    seedSyntheticCandles();
  }

  // Connect to Binance Live WebSocket
  try {
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');

    ws.onopen = () => {
      statusEl.textContent = 'LIVE (BINANCE WS)';
      statusEl.className = 'val price-up';
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      processTick(parseFloat(msg.p), parseFloat(msg.q), onTradeTick);
    };

    ws.onerror = () => startFallbackStream(statusEl, onTradeTick);
    ws.onclose = () => startFallbackStream(statusEl, onTradeTick);
  } catch (err) {
    startFallbackStream(statusEl, onTradeTick);
  }
}

function seedSyntheticCandles() {
  let p = 85200;
  const now = Date.now();
  store.candles = [];
  for (let i = 60; i >= 1; i--) {
    const open = p;
    const change = (Math.random() - 0.495) * 140;
    const close = +(open + change).toFixed(2);
    const high = +(Math.max(open, close) + Math.random() * 60).toFixed(2);
    const low = +(Math.min(open, close) - Math.random() * 60).toFixed(2);
    store.candles.push({ time: now - i * 60000, open, high, low, close, volume: +(Math.random() * 12).toFixed(2) });
    p = close;
  }
  store.price = p;
  store.open24h = store.candles[0].open;
}

function startFallbackStream(statusEl, onTradeTick) {
  if (fallbackTimer) return;
  statusEl.textContent = 'SIMULATED LIVE STREAM';
  statusEl.className = 'val price-up';
  fallbackTimer = setInterval(() => {
    const delta = (Math.random() - 0.495) * 35;
    const nextPrice = +(store.price + delta).toFixed(2);
    const qty = +(Math.random() * 0.85 + 0.01).toFixed(4);
    processTick(nextPrice, qty, onTradeTick);
  }, 450);
}

function processTick(price, qty, onTradeTick) {
  store.price = price;
  const now = Date.now();
  const last = store.candles[store.candles.length - 1];

  if (!last || now - last.time > 15000) {
    store.candles.push({ time: now, open: price, high: price, low: price, close: price, volume: qty });
    if (store.candles.length > 80) store.candles.shift();
  } else {
    last.close = price;
    if (price > last.high) last.high = price;
    if (price < last.low) last.low = price;
    last.volume = +(last.volume + qty).toFixed(4);
  }

  if (onTradeTick) onTradeTick(price, qty);
  store.notify('TICK');
}

// ============================================================================
// 4. CUSTOM HTML5 2D CANVAS CANDLESTICK & SMA CHART ENGINE
// ============================================================================
function initChartCanvas() {
  const canvas = document.getElementById('btc-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const smaCheckbox = document.getElementById('toggle-sma');

  function resize() {
    canvas.width = canvas.parentElement.clientWidth || 600;
    canvas.height = canvas.parentElement.clientHeight || 340;
    draw();
  }
  window.addEventListener('resize', resize);
  setTimeout(resize, 50);

  function draw() {
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const candles = store.candles;
    if (!candles.length) return;

    const padRight = 68;
    const padBottom = 24;
    const chartW = W - padRight;
    const chartH = H - padBottom;

    let minP = Infinity;
    let maxP = -Infinity;
    for (const c of candles) {
      if (c.low < minP) minP = c.low;
      if (c.high > maxP) maxP = c.high;
    }
    const range = Math.max(maxP - minP, 50);
    minP -= range * 0.08;
    maxP += range * 0.08;

    const priceToY = (p) => chartH - ((p - minP) / (maxP - minP)) * chartH;

    // Grid Lines & Y-Axis Labels
    ctx.strokeStyle = '#1b2230';
    ctx.fillStyle = '#8492a6';
    ctx.font = '11px monospace';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = (chartH / 5) * i;
      const pVal = maxP - ((maxP - minP) / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartW, y);
      ctx.stroke();
      ctx.fillText('$' + pVal.toFixed(0), chartW + 6, y + 4);
    }

    // Candlesticks
    const step = chartW / candles.length;
    const candleW = Math.max(step * 0.62, 3);

    candles.forEach((c, idx) => {
      const x = idx * step + step / 2;
      const isBull = c.close >= c.open;
      ctx.strokeStyle = isBull ? '#00e676' : '#ff3b69';
      ctx.fillStyle = isBull ? '#00e676' : '#ff3b69';

      ctx.beginPath();
      ctx.moveTo(x, priceToY(c.high));
      ctx.lineTo(x, priceToY(c.low));
      ctx.stroke();

      const yOpen = priceToY(c.open);
      const yClose = priceToY(c.close);
      const top = Math.min(yOpen, yClose);
      const bodyH = Math.max(Math.abs(yClose - yOpen), 2);
      ctx.fillRect(x - candleW / 2, top, candleW, bodyH);
    });

    // SMA-7 & SMA-25 Overlays
    if (smaCheckbox && smaCheckbox.checked) {
      drawSMA(7, '#38bdf8', step, priceToY);
      drawSMA(25, '#f59e0b', step, priceToY);
    }

    // Live Price Tracker Line
    const curY = priceToY(store.price);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(0, curY);
    ctx.lineTo(chartW, curY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawSMA(period, color, step, priceToY) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < store.candles.length; i++) {
      const val = store.getSMA(period, i);
      if (val === null) continue;
      const x = i * step + step / 2;
      const y = priceToY(val);
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  store.subscribe(() => requestAnimationFrame(draw));
}

// ============================================================================
// 5. PAPER TRADING ENGINE & AUTONOMOUS RSI BOT
// ============================================================================
function executeTrade(side, amountBtc, reason = 'MANUAL') {
  const price = store.price;
  const costUsdt = amountBtc * price;

  if (side === 'BUY') {
    if (store.usdt < costUsdt) return alert('Insufficient Paper USDT balance!');
    store.usdt -= costUsdt;
    store.btc = +(store.btc + amountBtc).toFixed(4);
  } else {
    if (store.btc < amountBtc) return alert('Insufficient Paper BTC holdings!');
    store.btc = +(store.btc - amountBtc).toFixed(4);
    store.usdt += costUsdt;
  }

  const tx = {
    id: 'TX-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
    side,
    amount: amountBtc,
    price: price.toFixed(2),
    reason,
    time: new Date().toLocaleTimeString()
  };

  store.trades.unshift(tx);
  store.mempool.push(tx);
  store.notify('TRADE');
}

function checkOpenOrdersAndBot() {
  // Match Open Limit Orders
  store.openOrders = store.openOrders.filter(order => {
    const hitBuy = order.side === 'BUY' && store.price <= order.targetPrice;
    const hitSell = order.side === 'SELL' && store.price >= order.targetPrice;
    if (hitBuy || hitSell) {
      executeTrade(order.side, order.amount, 'LIMIT-FILL');
      return false;
    }
    return true;
  });

  // Autonomous RSI Scalper Bot
  if (store.botEnabled) {
    const rsi = store.getRSI();
    const now = Date.now();
    if (now - store.lastBotAction > 6000) {
      if (rsi < 32 && store.usdt >= store.price * 0.1) {
        store.lastBotAction = now;
        executeTrade('BUY', 0.1, 'BOT (RSI ' + rsi + ')');
      } else if (rsi > 68 && store.btc >= 0.1) {
        store.lastBotAction = now;
        executeTrade('SELL', 0.1, 'BOT (RSI ' + rsi + ')');
      }
    }
  }
}

// ============================================================================
// 6. CRYPTOGRAPHIC SHA-256 BLOCKCHAIN LEDGER & PROOF-OF-WORK MINER
// ============================================================================
async function computeSHA256(str) {
  if (window.crypto && window.crypto.subtle) {
    try {
      const buf = new TextEncoder().encode(str);
      const digest = await crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {}
  }
  // Portable deterministic 256-bit hex hash fallback when running on local file:// protocol
  let h1 = 0xdeadbeef ^ str.length, h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex = (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
  return hex.repeat(4);
}

class Block {
  constructor(index, timestamp, transactions, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = '';
  }

  async calculateHash() {
    const payload = this.index + this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce;
    return await computeSHA256(payload);
  }
}

const blockchain = {
  chain: [],

  async initGenesis() {
    const genesis = new Block(0, new Date().toLocaleTimeString(), [{ id: 'GENESIS', side: 'MINT', amount: 50, price: '0.00' }], '0000000000000000');
    genesis.hash = await genesis.calculateHash();
    this.chain = [genesis];
    await this.render();
  },

  async minePendingMempool(statusEl) {
    if (store.mempool.length === 0) {
      statusEl.textContent = '⚠️ Mempool is empty! Execute a Buy or Sell trade in Tab 1 first.';
      return;
    }

    const txs = JSON.parse(JSON.stringify(store.mempool));
    store.mempool = [];
    const prevBlock = this.chain[this.chain.length - 1];
    const newBlock = new Block(this.chain.length, new Date().toLocaleTimeString(), txs, prevBlock.hash);

    statusEl.textContent = '⛏️ Mining SHA-256 Proof-of-Work (Searching for hash starting with "000")...';
    const startTime = performance.now();

    while (true) {
      newBlock.hash = await newBlock.calculateHash();
      if (newBlock.hash.startsWith('000')) break;
      newBlock.nonce++;
      if (newBlock.nonce % 250 === 0) {
        statusEl.textContent = `⛏️ Hashing Nonce #${newBlock.nonce}... (${newBlock.hash.slice(0, 16)}...)`;
        await new Promise(r => setTimeout(r, 0));
      }
    }

    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    statusEl.textContent = `✅ Block #${newBlock.index} Mined in ${elapsed}s! Nonce: ${newBlock.nonce} | Hash: ${newBlock.hash.slice(0, 20)}...`;
    this.chain.push(newBlock);
    store.notify('BLOCK_MINED');
    await this.render();
  },

  async verifyChain() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const prev = this.chain[i - 1];
      const recalculated = await current.calculateHash();
      if (current.hash !== recalculated || current.previousHash !== prev.hash) {
        return false;
      }
    }
    return true;
  },

  async render() {
    const container = document.getElementById('blockchain-container');
    const badge = document.getElementById('chain-validity');
    if (!container) return;

    const isValid = await this.verifyChain();
    badge.textContent = isValid ? '✓ CHAIN CRYPTOGRAPHICALLY VALID' : '✗ TAMPER DETECTED — CHAIN BROKEN';
    badge.className = isValid ? 'badge badge-valid' : 'badge badge-invalid';

    container.innerHTML = '';
    for (const blk of this.chain) {
      const recalculated = await blk.calculateHash();
      const isBlockTampered = blk.hash !== recalculated;

      const card = document.createElement('div');
      card.className = 'block-card ' + (isBlockTampered ? 'tampered' : '');
      card.innerHTML = `
        <div><strong>BLOCK #${blk.index}</strong> (${blk.timestamp}) — Nonce: <code>${blk.nonce}</code></div>
        <div>Prev Hash: <code>${blk.previousHash.slice(0, 32)}...</code></div>
        <div>Curr Hash: <code>${blk.hash.slice(0, 32)}...</code></div>
        <div style="margin-top:6px; color:#38bdf8;">Transactions (${blk.transactions.length}): ${JSON.stringify(blk.transactions)}</div>
        ${blk.index > 0 ? `<button class="btn-sm" style="margin-top:6px;" data-tamper="${blk.index}">⚠️ Tamper With Block #${blk.index} Data</button>` : ''}
      `;
      container.appendChild(card);
    }

    container.querySelectorAll('[data-tamper]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const idx = +e.target.getAttribute('data-tamper');
        this.chain[idx].transactions[0].amount = 9999.99;
        await this.render();
      });
    });
  }
};

// ============================================================================
// 7. DEEPSEEK CLOUD API + BUILT-IN DETERMINISTIC QUANT ENGINE
// ============================================================================
async function generateQuantReport(apiKey, model, outputEl) {
  const price = store.price.toFixed(2);
  const rsi = store.getRSI();
  const sma7 = store.getSMA(7) || store.price;
  const sma25 = store.getSMA(25) || store.price;
  const trend = sma7 >= sma25 ? 'BULLISH (SMA-7 Above SMA-25)' : 'BEARISH (SMA-7 Below SMA-25)';
  const equity = (store.usdt + store.btc * store.price).toFixed(2);

  if (!apiKey || apiKey.trim() === '') {
    outputEl.textContent =
`================================================================
SATOSHIDESK ALGORITHMIC QUANT ENGINE (DETERMINISTIC MODE)
================================================================
• Timestamp         : ${new Date().toLocaleTimeString()}
• Live BTC/USDT     : $${price}
• RSI (14-Period)   : ${rsi} (${rsi < 35 ? 'OVERSOLD ZONE' : rsi > 65 ? 'OVERBOUGHT ZONE' : 'NEUTRAL REGIME'})
• Moving Averages   : SMA(7) = $${sma7} | SMA(25) = $${sma25}
• Market Structure  : ${trend}
• Portfolio Equity  : $${equity} (${store.btc} BTC / $${store.usdt.toFixed(2)} USDT)

QUANTITATIVE EXECUTION SIGNAL:
${rsi < 38 && sma7 >= sma25
  ? '🟢 STRONG ACCUMULATION BIAS: Momentum is recovering from oversold conditions with bullish short-term SMA alignment.'
  : rsi > 65
  ? '🔴 TAKING PROFIT / MEAN REVERSION RISK: RSI shows overheated buying pressure. Consider scaling out or setting limit asks.'
  : '🟡 RANGE-BOUND / VOLATILITY COMPRESSION: Wait for a confirmed SMA-7 / SMA-25 crossover or whale volume expansion.'}
================================================================
(Tip: Paste a DeepSeek API key on the left to stream live LLM reasoning!)`;
    return;
  }

  outputEl.textContent = `⏳ Querying DeepSeek Cloud (${model}) with live market telemetry...`;
  const prompt = `You are an institutional Bitcoin quantitative analyst. Analyze this live telemetry in 5 concise bullet points with a clear trade setup:
BTC Price: $${price}, RSI(14): ${rsi}, SMA(7): $${sma7}, SMA(25): $${sma25}, Trend: ${trend}, User Portfolio: $${equity} (${store.btc} BTC).`;

  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey.trim()
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4
      })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    outputEl.textContent = data.choices[0].message.content;
  } catch (err) {
    generateQuantReport('', model, outputEl);
  }
}

// ============================================================================
// 8. APPLICATION BOOTSTRAP & EVENT WIRING
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('btc-chart')) return; // Skip if on guide.html

  initChartCanvas();
  blockchain.initGenesis();

  const tapeEl = document.getElementById('whale-tape');

  initMarketStream((price, qty) => {
    checkOpenOrdersAndBot();

    const usdValue = price * qty;
    const isWhale = usdValue >= 50000;
    if (isWhale) playWhalePing();

    const li = document.createElement('li');
    if (isWhale) li.className = 'whale-item';
    li.innerHTML = `<span>${isWhale ? '🐋 WHALE ' : ''}${qty.toFixed(3)} BTC</span><span>$${price.toLocaleString()}</span>`;
    tapeEl.prepend(li);
    if (tapeEl.children.length > 25) tapeEl.lastChild.remove();
  });

  // Tab Switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });

  // Order Type Selector
  const orderTypeEl = document.getElementById('order-type');
  const limitRowEl = document.getElementById('limit-price-row');
  orderTypeEl.addEventListener('change', () => {
    limitRowEl.style.display = orderTypeEl.value === 'LIMIT' ? 'flex' : 'none';
  });

  // Buy & Sell Buttons
  const handleOrder = (side) => {
    const amount = parseFloat(document.getElementById('order-amount').value);
    if (!amount || amount <= 0) return;

    if (orderTypeEl.value === 'MARKET') {
      executeTrade(side, amount, 'MARKET');
    } else {
      const targetPrice = parseFloat(document.getElementById('order-limit-price').value);
      if (!targetPrice) return alert('Enter a valid Limit Trigger Price!');
      store.openOrders.push({ side, amount, targetPrice });
      store.notify('ORDER_ADDED');
    }
  };

  document.getElementById('btn-buy').addEventListener('click', () => handleOrder('BUY'));
  document.getElementById('btn-sell').addEventListener('click', () => handleOrder('SELL'));

  // Simulate $250K Whale Spike
  document.getElementById('btn-sim-whale').addEventListener('click', () => {
    const spikePrice = +(store.price + (Math.random() > 0.5 ? 260 : -260)).toFixed(2);
    processTick(spikePrice, 3.25, (p, q) => {
      playWhalePing();
      const li = document.createElement('li');
      li.className = 'whale-item';
      li.innerHTML = `<span>🐋 WHALE ${q} BTC</span><span>$${p.toLocaleString()}</span>`;
      tapeEl.prepend(li);
    });
  });

  // Autonomous Bot Checkbox
  document.getElementById('toggle-bot').addEventListener('change', (e) => {
    store.botEnabled = e.target.checked;
  });

  // Blockchain PoW Miner Button
  document.getElementById('btn-mine-block').addEventListener('click', () => {
    blockchain.minePendingMempool(document.getElementById('mining-status'));
  });

  // DeepSeek Cloud Quant Button
  const keyInput = document.getElementById('deepseek-key');
  keyInput.value = localStorage.getItem('satoshi_ds_key') || '';
  keyInput.addEventListener('change', () => localStorage.setItem('satoshi_ds_key', keyInput.value));

  document.getElementById('btn-run-quant').addEventListener('click', () => {
    const model = document.getElementById('deepseek-model').value;
    generateQuantReport(keyInput.value, model, document.getElementById('quant-report'));
  });

  // Reactive UI Subscriber
  let prevPrice = store.price;
  store.subscribe(() => {
    const priceEl = document.getElementById('live-price');
    priceEl.textContent = '$' + store.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    priceEl.className = 'val ' + (store.price >= prevPrice ? 'price-up' : 'price-down');
    prevPrice = store.price;

    const pct = (((store.price - store.open24h) / store.open24h) * 100).toFixed(2);
    const changeEl = document.getElementById('price-change');
    changeEl.textContent = (pct >= 0 ? '+' : '') + pct + '%';
    changeEl.className = 'val ' + (pct >= 0 ? 'price-up' : 'price-down');

    document.getElementById('live-rsi').textContent = store.getRSI();
    const equity = store.usdt + store.btc * store.price;
    document.getElementById('total-equity').textContent = '$' + equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    document.getElementById('bal-usdt').textContent = '$' + store.usdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('bal-btc').textContent = store.btc.toFixed(4) + ' BTC';
    document.getElementById('mempool-count').textContent = store.mempool.length;

    document.getElementById('open-orders-list').innerHTML = store.openOrders
      .map(o => `<li><span>${o.side} ${o.amount} BTC</span><span>@ $${o.targetPrice}</span></li>`)
      .join('');

    document.getElementById('trade-history').innerHTML = store.trades.slice(0, 15)
      .map(t => `<li><span class="${t.side === 'BUY' ? 'price-up' : 'price-down'}">${t.side} ${t.amount} BTC</span><span>$${t.price} (${t.reason})</span></li>`)
      .join('');

    document.getElementById('mempool-list').innerHTML = store.mempool
      .map(tx => `<li><span>${tx.id}: ${tx.side} ${tx.amount} BTC</span><span>@ $${tx.price}</span></li>`)
      .join('');
  });
});