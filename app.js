document.addEventListener('DOMContentLoaded', function () {

    const i18n = {
        en: { title: "AI OptiBotX", selectPair: "Select currency pair:", uploadPhoto: "Upload photo for analysis:", takePhoto: "Take Photo", analyze: "Analyze", analyzing: "Analyzing...", result: "No result yet"},
        ru: { title: "AI OptiBotX", selectPair: "Выберите валютную пару:", uploadPhoto: "Загрузите фото для анализа:", takePhoto: "Сфотографировать", analyze: "Анализировать", analyzing: "Идёт анализ...", result: "Результат отсутствует" }
    };

    let lang = localStorage.getItem('lang') || 'en';

    const els = {
        title: document.getElementById('title'),
        pairLabel: document.getElementById('pair-label'),
        photoLabel: document.getElementById('photo-label'),
        cameraText: document.getElementById('camera-text'),
        cameraBtn: document.getElementById('camera-btn'),
        photoInput: document.getElementById('photo'),
        preview: document.getElementById('preview'),
        previewImg: document.getElementById('preview-img'),
        removePhoto: document.getElementById('remove-photo'),
        analyzeBtn: document.getElementById('analyze'),
        loading: document.getElementById('loading'),
        loadingText: document.getElementById('loading-text'),
        result: document.getElementById('result'),
        langToggle: document.getElementById('lang-toggle'),
        pairSelect: document.getElementById('pair'),
        calcInput: document.getElementById('calc-input'),
        calcBtn: document.getElementById('calc-divide'),
        calcResult: document.getElementById('calc-result'),
    };

    function applyLang() {
        const t = i18n[lang];
        els.title.textContent = t.title;
        els.pairLabel.textContent = t.selectPair;
        els.photoLabel.textContent = t.uploadPhoto;
        els.cameraText.textContent = t.takePhoto;
        els.analyzeBtn.textContent = t.analyze;
        els.loadingText.textContent = t.analyzing;
        if (!els.result.dataset.custom) els.result.textContent = t.result;
        els.langToggle.textContent = lang.toUpperCase();
        localStorage.setItem('lang', lang);
        populatePairs();
    }

    function populatePairs() {
        const analysisOption = (lang === 'ru') ? "Анализ по фото" : "Photo analysis";

        const normalPairs = [
            "EUR/USD","GBP/USD","USD/JPY","USD/CHF","USD/CAD","AUD/USD","NZD/USD",
            "EUR/JPY","GBP/JPY","AUD/JPY","NZD/JPY","CAD/JPY","CHF/JPY",
            "EUR/CHF","GBP/CHF","AUD/CHF","NZD/CHF",
            "EUR/AUD","GBP/AUD","AUD/CAD",
            "EUR/CAD","GBP/CAD",
            "USD/SGD","USD/HKD","USD/ZAR"
        ];

        const otcPairs = [
            "EUR/USD OTC","GBP/USD OTC","USD/JPY OTC","AUD/USD OTC",
            "USD/CAD OTC","USD/CHF OTC","NZD/USD OTC",
            "GBP/JPY OTC","EUR/JPY OTC","EUR/GBP OTC",
            "AUD/JPY OTC","CHF/JPY OTC",
            "EUR/AUD OTC","GBP/AUD OTC","NZD/JPY OTC",
            "EUR/CHF OTC","GBP/CHF OTC","CAD/JPY OTC"
        ];

        let html = `<option value="${analysisOption}">${analysisOption}</option>`;
        normalPairs.forEach(p => html += `<option value="${p}">${p}</option>`);
        otcPairs.forEach(p => html += `<option value="${p}">${p}</option>`);

        els.pairSelect.innerHTML = html;
    }

    function showPreview(file) {
        const url = URL.createObjectURL(file);
        els.previewImg.src = url;
        els.preview.classList.remove('hidden');
        els.preview.setAttribute('aria-hidden','false');
        els.previewImg.onload = () => URL.revokeObjectURL(url);
    }

    els.cameraBtn.addEventListener('click', () => els.photoInput.click());
    els.photoInput.addEventListener('change', e => {
        const file = e.target.files?.[0];
        if (file) showPreview(file);
    });

    els.removePhoto.addEventListener('click', e => {
        e.stopPropagation();
        els.photoInput.value = '';
        els.previewImg.src = '';
        els.preview.classList.add('hidden');
        els.preview.setAttribute('aria-hidden','true');
    });

    els.analyzeBtn.addEventListener('click', async () => {
        els.loading.classList.remove('hidden');
        els.result.textContent = '';
        els.result.dataset.custom = '';
        els.analyzeBtn.disabled = true;

        await new Promise(r=>setTimeout(r,1100));

        const pair = els.pairSelect.value;
        const score = (Math.random()*2-1).toFixed(2);
        const num = parseFloat(score);
        const isBuy = num > 0;
        els.result.style.color = isBuy ? '#4ade80' : '#f87171';
        els.result.textContent = `${pair}: ${isBuy ? 'BUY ↑' : 'SELL ↓'} (${score})`;
        els.result.dataset.custom = '1';

        els.loading.classList.add('hidden');
        els.analyzeBtn.disabled = false;
    });

    els.langToggle.addEventListener('click', () => {
        lang = lang === 'en' ? 'ru' : 'en';
        applyLang();
    });

    const timeButtons = document.querySelectorAll('.time-btn');
    let selectedTime = localStorage.getItem('timeframe') || '1m';

    function updateActiveTime() {
        timeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.time === selectedTime);
        });
    }

    timeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedTime = btn.dataset.time;
            localStorage.setItem('timeframe', selectedTime);
            updateActiveTime();
        });
    });

    updateActiveTime();

    els.calcBtn.addEventListener('click', () => {
        const value = parseFloat(els.calcInput.value);
        if (isNaN(value)) {
            els.calcResult.textContent = 'Введите число';
            els.calcResult.style.color = '#f87171';
            return;
        }
        const res = value / 11;
        els.calcResult.textContent = "= " + res.toFixed(4);
        els.calcResult.style.color = '#4ade80';
    });

    populatePairs();
    applyLang();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js');
    }
});
