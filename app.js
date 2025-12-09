
document.addEventListener('DOMContentLoaded', ()=>{

const pairSelect = document.getElementById('pair');
const chartFrame = document.getElementById('chart-frame');

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

const otcPairs = normalPairs.map(p => p + " OTC");

function fillPairs(){
    let html = "";
    normalPairs.forEach(p=> html += `<option value="${p}">${p}</option>`);
    otcPairs.forEach(p=> html += `<option value="${p}">${p}</option>`);
    pairSelect.innerHTML = html;
}
fillPairs();

function updateChart(){
    let pair = pairSelect.value;
    if(pair.includes("OTC")) pair = pair.replace(" OTC","");
    let symbol = pair.replace("/","");
    chartFrame.src = `https://s.tradingview.com/widgetembed/?symbol=FX:${symbol}&interval=1&hideideas=1&theme=dark`;
}
pairSelect.addEventListener("change", updateChart);
updateChart();

});
