document.addEventListener('DOMContentLoaded', function () {
    const pairSelect = document.getElementById('pair');
    const chartFrame = document.getElementById('chart-frame');
    const analyzeBtn = document.getElementById('analyze');
    const resultEl = document.getElementById('result');
    const loadingEl = document.getElementById('loading');
    const timeButtons = document.querySelectorAll('.time-btn');
    let selectedTime = localStorage.getItem('timeframe') || '1m';

    // helper to populate pairs (normal list + otc)
    const normalPairs = [
        "EUR/USD","GBP/USD","USD/JPY","USD/CHF","USD/CAD","AUD/USD","NZD/USD",
        "EUR/JPY","GBP/JPY","AUD/JPY","NZD/JPY","CAD/JPY","CHF/JPY",
        "EUR/GBP","EUR/CHF","EUR/AUD","EUR/CAD",
        "GBP/CHF","GBP/AUD","GBP/CAD",
        "AUD/CAD","AUD/CHF",
        "NZD/CHF","NZD/CAD",
        "USD/SEK","USD/NOK","USD/DKK","USD/TRY","USD/ZAR","USD/MXN",
        "EUR/TRY","EUR/SEK","EUR/NOK",
        "USD/SGD","USD/HKD","EUR/HKD","GBP/HKD",
        "USD/PLN","EUR/PLN"
    ];
    const otcPairs = normalPairs.map(p => p + ' OTC');

    function fillPairs(){
        let html = '<option value="">Select pair</option>';
        normalPairs.forEach(p => html += `<option value="${p}">${p}</option>`);
        otcPairs.forEach(p => html += `<option value="${p}">${p}</option>`);
        if(pairSelect) pairSelect.innerHTML = html;
    }
    fillPairs();

    // update TradingView chart
    function updateChart() {
        if(!pairSelect || !chartFrame) return;
        let pair = pairSelect.value || 'EUR/USD';
        if(pair.includes('OTC')) pair = pair.replace(' OTC','');
        const symbol = 'FX:' + pair.replace('/','');
        // set a basic TradingView embed URL (the widget accepts many params)
        chartFrame.src = `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(symbol)}&interval=1&hideideas=1&theme=dark`;
    }
    if(pairSelect) pairSelect.addEventListener('change', updateChart);
    updateChart();

    // time buttons handling
    function updateActiveTime() {
        timeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.time === selectedTime));
    }
    timeButtons.forEach(btn => {
        btn.addEventListener('click', ()=>{
            selectedTime = btn.dataset.time;
            localStorage.setItem('timeframe', selectedTime);
            updateActiveTime();
            // Note: TradingView widget uses minute intervals; for demo we change iframe interval param
            if(chartFrame && pairSelect){
                let pair = pairSelect.value || 'EUR/USD';
                if(pair.includes('OTC')) pair = pair.replace(' OTC','');
                const sym = 'FX:' + pair.replace('/','');
                // map custom labels to TradingView interval strings
                let map = {'5s':'1','10s':'1','15s':'1','30s':'1','1m':'1','2m':'2','4m':'4','5m':'5','10m':'10','20m':'20','1h':'60'};
                const iv = map[selectedTime] || '1';
                chartFrame.src = `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(sym)}&interval=${iv}&hideideas=1&theme=dark`;
            }
        });
    });
    updateActiveTime();

    // Simple signal generation using exchangerate.host timeseries (daily)
    // Compute SMA short (3) and long (7) over available points (days)
    async function fetchRatesTimeseries(baseCcy, quoteCcy, days){
        // build dates YYYY-MM-DD
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - (days + 5));
        const fmt = d => d.toISOString().slice(0,10);
        const url = `https://api.exchangerate.host/timeseries?start_date=${fmt(start)}&end_date=${fmt(end)}&base=${baseCcy}&symbols=${quoteCcy}`;
        try {
            const r = await fetch(url);
            const data = await r.json();
            if(!data || !data.rates) return null;
            const dates = Object.keys(data.rates).sort();
            const arr = dates.map(d => data.rates[d][quoteCcy]).filter(v => v !== undefined && v !== null);
            return arr;
        } catch(e){
            console.error('fetch rates error', e);
            return null;
        }
    }

    function sma(arr, n){
        if(!arr || arr.length < n) return null;
        const res = [];
        for(let i = n-1; i < arr.length; i++){
            const slice = arr.slice(i-n+1, i+1);
            const sum = slice.reduce((s,x)=>s+parseFloat(x),0);
            res.push(sum / n);
        }
        return res;
    }

    function showResult(signal, details){
        if(!resultEl) return;
        const color = signal === 'BUY' ? '#4ade80' : (signal === 'SELL' ? '#f87171' : '#cbd5e1');
        resultEl.innerHTML = `<div class="signal-box" style="padding:12px;border-radius:12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.03);">
            <div style="font-weight:700;font-size:18px;color:${color}">${signal}</div>
            <div style="margin-top:6px;color:#cbd5e1">${details}</div>
            <div style="margin-top:8px;color:#94a3b8;font-size:12px">Demo signals — not financial advice</div>
        </div>`;
    }

    analyzeBtn.addEventListener('click', async ()=>{
        if(!pairSelect) return;
        let pair = pairSelect.value || 'EUR/USD';
        if(pair.includes('OTC')) pair = pair.replace(' OTC','');
        const [baseCcy, quoteCcy] = pair.split('/');
        if(!baseCcy || !quoteCcy) return alert('Invalid pair');

        if(loadingEl) loadingEl.classList.remove('hidden');
        resultEl.innerHTML = '';

        // fetch recent daily rates (use 20 days)
        const rates = await fetchRatesTimeseries(baseCcy, quoteCcy, 20);
        if(!rates || rates.length < 8){
            if(loadingEl) loadingEl.classList.add('hidden');
            showResult('N/A', 'Not enough historical data to compute signals.');
            return;
        }

        // compute SMAs
        const sma3 = sma(rates,3);
        const sma7 = sma(rates,7);
        if(!sma3 || !sma7){
            if(loadingEl) loadingEl.classList.add('hidden');
            showResult('N/A','Not enough data for SMAs.');
            return;
        }
        // align last values (they may be different lengths)
        const lastSMA3 = sma3[sma3.length-1];
        const lastSMA7 = sma7[sma7.length-1];

        let signal = 'HOLD';
        if(lastSMA3 > lastSMA7) signal = 'BUY';
        if(lastSMA3 < lastSMA7) signal = 'SELL';
        const diff = ((lastSMA3 - lastSMA7)/lastSMA7 * 100).toFixed(3);

        if(loadingEl) loadingEl.classList.add('hidden');
        showResult(signal, `SMA3=${lastSMA3.toFixed(5)} • SMA7=${lastSMA7.toFixed(5)} • spread ${diff}%`);
    });

    // initialize selected pair & chart update on load
    if(pairSelect && pairSelect.options.length>0){
        pairSelect.selectedIndex = 1;
        updateChart();
    }
});