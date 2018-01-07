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

function loadCharts(interval) {
    let dates = [];
    let balances = {};
    let prices = {};
    getBalances(interval).then((balancesData) => {
        // initialize balances
        let initialBalances = balancesData[0].balances;
        for (let coin of Object.keys(initialBalances)) {
            balances[coin] = {};
            balances[coin].balances = [];
            balances[coin].hasBalance = false;
            prices[coin] = [];
        }
        // extract balances
        for (let b of balancesData) {
            for (let coin of Object.keys(b.balances)) {
                let balance = parseFloat(b.balances[coin].free) + parseFloat(b.balances[coin].locked);
                if (balance > 0.0) balances[coin].hasBalance = true;
                balances[coin].balances.push(balance);
            }
        }
        // remove empty coins
        for (let coin of Object.keys(balances)) {
            if (!balances[coin].hasBalance) {
                delete balances[coin];
            }
        }
        return getPrices(interval);
    }).then((pricesData) => {
        // Calculate USDT value of balances according to prices
        let i = 0;
        for (let p of pricesData) {
            for (let coin of Object.keys(balances)) {
                if (coin === "BTC") {
                    let pair = "BTCUSDT";
                    let price = balances[coin].balances[i] * parseFloat(p.prices.data[pair]);
                    prices[coin].push(price)
                } else {
                    let pair = coin + "BTC";
                    let price = balances[coin].balances[i] * parseFloat(p.prices.data[pair]) * parseFloat(p.prices.data["BTCUSDT"]);
                    prices[coin].push(price)
                }
            }
            dates.push(p.prices.date);
            i++;
        }

        // For every coin, draw a graph
        let chartsDiv = document.getElementById("charts");
        for (let coin of Object.keys(balances)) {
            // create coin header
            let h = document.createElement("h3");
            h.innerText = coin;
            chartsDiv.append(h);

            // create a canvas and add to page
            let canvas = document.createElement("canvas");
            canvas.id = "canvas-" + coin;
            chartsDiv.append(canvas);

            let ctx = canvas.getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [{
                        label: coin + " Value",
                        backgroundColor: 'rgb(255, 99, 132)',
                        borderColor: 'rgb(255, 99, 132)',
                        data: prices[coin],
                    }]
                },
                options: {
                    yAxes: {
                      beginAtZero: true
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
        }
    }).catch((err) => {
        document.getElementById("errors").innerText = "Something went wrong, see console for error message.";
        console.log(err);
    });
}

function clearCharts() {
    let chartsDiv = document.getElementById("charts");
    while (chartsDiv.firstChild) {
        chartsDiv.removeChild(chartsDiv.firstChild);
    }
}

loadCharts(86400);