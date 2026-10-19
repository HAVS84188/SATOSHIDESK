# SATOSHIDESK
```markdown
# 🚀 SATOSHIDESK

**SATOSHIDESK** is a high-performance, institutional-grade Bitcoin trading terminal, autonomous algorithmic bot sandbox, SHA-256 blockchain settlement engine, and AI quantitative analyst. Built entirely from scratch using **100% Pure Vanilla ES6+ JavaScript, HTML5 Canvas, and CSS** with **zero external framework dependencies or build tools**.

[![GitHub Pages Status](https://img.shields.io/badge/demo-online-brightgreen?style=flat-square)](https://HAVS84188.github.io/SATOSHIDESK/)
[![Vanilla JS](https://img.shields.io/badge/stack-vanilla%20es6%20js-yellow?style=flat-square)](https://github.com/HAVS84188/SATOSHIDESK)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## 🌟 Live Demo & Navigation
* **Live Trading Terminal & Blockchain:** [Access SATOSHIDESK Live on GitHub Pages](https://HAVS84188.github.io/SATOSHIDESK/)
* **Documentation & Beginner's Guide:** Check out the built-in [Beginner's Guide Page](guide.html) directly inside the app for an interactive walkthrough of financial indicators and blockchain cryptography.

---

## 🛠️ Key Features

### 1. High-Frequency Live Trading & Custom HTML5 Canvas Engine
* **Real-Time Market Feeds:** Connects directly to the live Binance WebSocket stream (`wss://stream.binance.com:9443/ws/btcusdt@trade`) with an automatic fall-back Monte-Carlo tick simulator to ensure uninterrupted uptime.
* **Custom 60FPS Candlestick Chart:** Built from scratch using the HTML5 2D Canvas API to render OHLCV candlesticks, dynamic price scaling, and real-time technical indicators.
* **Technical Overlays:** Real-time calculation of **Simple Moving Averages (SMA-7 in Cyan, SMA-25 in Gold)** and **14-Period Relative Strength Index (RSI)**.

### 2. Paper Trading Execution Desk & Autonomous Algo Bot
* **$100,000 Virtual Portfolio:** Practice trading Bitcoin risk-free with live USDT/BTC balance tracking and automatic net equity calculation.
* **Order Types:** Instant **Market Orders** and automated **Limit Orders** that monitor price streams in real-time to fill the exact millisecond a target price is triggered.
* **Autonomous RSI Scalper Bot:** Toggle an automated trading script that reacts to market momentum, buying when RSI drops below 32 (oversold) and selling when RSI rises above 68 (overbought).

### 3. Whale Radar & Web Audio API Alerts
* **Institutional Tape:** Live high-frequency trade stream displaying order size and timestamps.
* **Acoustic Sonar Pings:** Uses the browser's native **Web Audio API** to synthesize a custom audio sonar ping and highlight orders in gold whenever a "Whale" trade exceeding $50,000 hits the tape (or when testing via the *Simulate Whale Spike* button).

### 4. Cryptographic SHA-256 Blockchain Settlement Engine
* **Unconfirmed Mempool:** Every trade executed in the terminal automatically populates a pending transaction mempool.
* **Proof-of-Work (PoW) Mining:** Users can bundle mempool transactions into a block and run a cryptographic hashing loop using the browser's native Web Crypto API (`crypto.subtle.digest`) to find a valid nonce producing a hash starting with `000`.
* **Tamper Detection:** Interactive security feature allowing users to mutate historical block data to see the cryptographic chain break in real-time.

### 5. DeepSeek Cloud AI Quant & Algorithmic Fallback
* **Cloud API Integration:** Supports optional integration with DeepSeek LLM endpoints (`deepseek-chat` / `deepseek-reasoner`) with keys stored securely in browser `localStorage`.
* **Deterministic Fallback Engine:** Features a built-in mathematical rule engine that provides instant quantitative market analysis even when offline or without an API key.

---

## 🏗️ Project Architecture & File Structure

```text
SATOSHIDESK/
├── index.html      # Main Trading Terminal, Blockchain Ledger & AI Quant panel
├── guide.html      # Comprehensive Beginner's Guide & Architecture documentation
├── style.css       # Responsive dark-mode institutional stylesheet (CSS Grid / Flexbox)
└── script.js       # Core ES6 engine (Pub/Sub state, WebSocket, Canvas chart, SHA-256)

```

* **Zero Build Steps:** No Webpack, Vite, Node modules, or npm installations required. Runs instantly in any modern browser.
* **Memory-Optimized:** Utilizes circular array slicing for candle history to ensure optimal performance on resource-constrained devices.

---

## 🚀 Getting Started Locally

To run SATOSHIDESK locally on your machine:

1. **Clone the repository:**
```bash
git clone [https://github.com/HAVS84188/SATOSHIDESK.git](https://github.com/HAVS84188/SATOSHIDESK.git)

```


2. **Navigate into the folder:**
```bash
cd SATOSHIDESK

```


3. **Open the project:**
Double-click `index.html` or open it with your favorite code editor (like VS Code with the Live Server extension).

---

## 👨‍💻 Author

**Site developed by Atharva Veer Singh**

---

## 📜 License

This project is open-source and available under the [MIT License](https://www.google.com/search?q=LICENSE).

```

```
