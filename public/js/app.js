let maxArraySize = 250;
let interval = 86400;

function getQueryParams() {
    return "?interval=" + interval + "&maxArraySize=" + maxArraySize;
}

function getPrices() {
    return fetch('/api/prices/' + getQueryParams(), {
        method: 'get'
    }).then((res) => res.json()).then((data) => {
        console.log(data);
        return data
    })
}

function getBalances() {
    return fetch('/api/balances/' + getQueryParams(), {
        method: 'get'
    }).then((res) => res.json()).then((data) => {
        return data
    })
}

function applyChanges() {
    clearCharts();
    loadCharts();
}

function onTimeIntervalChange() {
    interval = document.getElementById("time-interval").value;
    document.getElementById("time-interval-custom").value = interval;
}

function onCustomTimeIntervalChange() {
    interval = document.getElementById("time-interval-custom").value;
}

function onMaxArraySizeChange() {
    maxArraySize = document.getElementById("maxArraySize").value;
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
        type: 'label',
        data: {
            labels: dates,
            datasets: [{
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                data: prices[coin].usdt,
                yAxisID: "usdt"
            }, {
                backgroundColor: 'rgb(99, 255, 132)',
                borderColor: 'rgb(99, 255, 132)',
                data: prices[coin].btc,
                yAxisID: "btc"
            }]
        },
        options: {
            responsive: true,
            hoverMode: 'index',
            stacked: false,
            legend: {
                display: false
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: false
                    },
                    type: "linear",
                    display: true,
                    position: "left",
                    id: "usdt"
                }, {
                    ticks: {
                        beginAtZero: false
                    },
                    type: "linear",
                    display: true,
                    position: "right",
                    id: "btc",
                    gridLines: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
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
    chartsDiv.append(canvas);
}

function initializeBalances(balancesData, balances, prices) {
    let initialBalances = balancesData[balancesData.length - 1].balances;
    for (let coin of Object.keys(initialBalances)) {
        balances[coin] = {};
        balances[coin].balances = [];
        balances[coin].hasBalance = false;
        prices[coin] = {'usdt': [], 'btc': []};
    }
    prices["USDTTOTAL"] = {'usdt': [], 'btc': []};
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

function loadCharts() {
    let dates = [];
    let balances = {};
    let prices = {};
    Promise.all([getBalances(), getPrices()]).then((data) => {
        let balancesData = data[0];
        let pricesData = data[1];
        initializeBalances(balancesData, balances, prices);
        extractBalances(balancesData, balances);
        removeEmptyCoins(balances);

        // Calculate USDT value of balances according to prices
        let i = 0;
        let totalPrice = {'btc': 0.0, 'usdt': 0.0};
        for (let p of pricesData) {
            for (let coin of Object.keys(balances)) {
                let usdtprice = 0;
                let btcprice = 0;
                if (coin === "BTC") {
                    let pair = "BTCUSDT";
                    usdtprice = balances[coin].balances[i] * parseFloat(p.prices.data[pair]);
                    btcprice = balances[coin].balances[i];
                } else {
                    let pair = coin + "BTC";
                    usdtprice = balances[coin].balances[i] * parseFloat(p.prices.data[pair]) * parseFloat(p.prices.data["BTCUSDT"]);
                    btcprice = balances[coin].balances[i] * parseFloat(p.prices.data[pair]);
                }
                prices[coin].btc.push(btcprice);
                prices[coin].usdt.push(usdtprice);
                totalPrice['usdt'] += usdtprice;
                totalPrice['btc'] += btcprice;
            }
            prices["USDTTOTAL"].btc.push(totalPrice['btc']);
            prices["USDTTOTAL"].usdt.push(totalPrice['usdt']);
            dates.push(p.prices.date);
            totalPrice = {'btc': 0.0, 'usdt': 0.0};
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
loadCharts();