function getPrices(interval) {
    return fetch('/api/prices/?interval=' + interval, {
        method: 'get'
    }).then((res) => res.json()).then((data) => {
        console.log(data);
        return data
    })
}

function getBalances(interval) {
    return fetch('/api/balances/?interval=' + interval, {
        method: 'get'
    }).then((res) => res.json()).then((data) => {
        return data
    })
}

function onTimeIntervalChange() {
    let selectedInterval = document.getElementById("time-interval").value;
    clearCharts();
    loadCharts(selectedInterval);
}


function clearCharts() {
    let chartsDiv = document.getElementById("charts");
    while (chartsDiv.firstChild) {
        chartsDiv.removeChild(chartsDiv.firstChild);
    }
}

function createCanvasAndAddToPage(coin, dates, prices) {
    let chartsDiv = document.getElementById("charts");
    // create coin header
    let h = document.createElement("h3");
    h.innerText = coin;
    chartsDiv.append(h);

    let canvas = document.createElement("canvas");
    canvas.id = "canvas-" + coin;


    let ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                data: prices[coin],
            }]
        },
        options: {
            legend: {
                display: false
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: false
                    }
                }]
            },
            animation: {
                duration: 0, // general animation time
            },
            hover: {
                animationDuration: 0, // duration of animations when hovering an item
            },
            responsiveAnimationDuration: 0, // animation duration after a resize
        }
    });
    chartsDiv.append(h);
}

function initializeBalances(balancesData, balances, prices) {
    let initialBalances = balancesData[0].balances;
    for (let coin of Object.keys(initialBalances)) {
        balances[coin] = {};
        balances[coin].balances = [];
        balances[coin].hasBalance = false;
        prices[coin] = [];
    }
    prices["USDTTOTAL"] = [];
}

function extractBalances(balancesData, balances) {
    for (let b of balancesData) {
        for (let coin of Object.keys(b.balances)) {
            let balance = parseFloat(b.balances[coin].free) + parseFloat(b.balances[coin].locked);
            if (balance > 0.0) balances[coin].hasBalance = true;
            balances[coin].balances.push(balance);
        }
    }
}

function removeEmptyCoins(balances) {
    for (let coin of Object.keys(balances)) {
        if (!balances[coin].hasBalance) {
            delete balances[coin];
        }
    }
}

function loadCharts(interval) {
    let dates = [];
    let balances = {};
    let prices = {};
    getBalances(interval).then((balancesData) => {
        initializeBalances(balancesData, balances, prices);
        extractBalances(balancesData, balances);
        removeEmptyCoins(balances);
        return getPrices(interval);
    }).then((pricesData) => {
        // Calculate USDT value of balances according to prices
        let i = 0;
        let totalPrice = 0.0;
        for (let p of pricesData) {
            for (let coin of Object.keys(balances)) {
                let price = 0;
                if (coin === "BTC") {
                    let pair = "BTCUSDT";
                    price = balances[coin].balances[i] * parseFloat(p.prices.data[pair]);
                } else {
                    let pair = coin + "BTC";
                    price = balances[coin].balances[i] * parseFloat(p.prices.data[pair]) * parseFloat(p.prices.data["BTCUSDT"]);
                }
                prices[coin].push(price);
                totalPrice += price;
            }
            prices["USDTTOTAL"].push(totalPrice);
            dates.push(p.prices.date);
            i++;
        }

        // draw totalUSDT graph first
        createCanvasAndAddToPage("USDTTOTAL", dates, prices);

        // For every coin, draw a graph
        for (let coin of Object.keys(balances).sort()) {
            createCanvasAndAddToPage(coin, dates, prices);
        }
    }).catch((err) => {
        document.getElementById("errors").innerText = "Something went wrong, see console for error message.";
        console.log(err);
    });
}


Chart.defaults.global.elements.point.radius = 1;
Chart.defaults.global.elements.line.fill = false;
Chart.defaults.global.elements.line.stepped = true;
loadCharts(86400);