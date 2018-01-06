function getPrices() {
	return fetch('/api/prices', {
		method: 'get'
	}).then((res) => res.json()).then((data)=>{
		console.log(data)
		return data
	}).catch(function(err) {
		console.log(err);
	});
}

function getBalances() {
	return fetch('/api/balances', {
		method: 'get'
	}).then((res) => res.json()).then((data)=>{
		return data
	}).catch(function(err) {
		console.log(err);
	});
}

let totals = [];
let dates = [];
let balances = {};
let prices = {};
getBalances().then((balancesData) => {
	// initialize balances
	let initialBalances = balancesData[0].balances;
	for(let coin of Object.keys(initialBalances)){
		balances[coin] = {};
		balances[coin].balances = [];
		balances[coin].hasBalance = false;
		prices[coin] = [];
	}
	// extract balances
	for(let b of balancesData){
		for(let coin of Object.keys(b.balances)){
			let balance = parseFloat(b.balances[coin].free) + parseFloat(b.balances[coin].locked);
			if(balance > 0.0) balances[coin].hasBalance = true;
			balances[coin].balances.push(balance);
		}
	}
	// remove empty coins
	for(let coin of Object.keys(balances)){
		if(!balances[coin].hasBalance){
			delete balances[coin];
		}
	}
	return getPrices();
}).then((pricesData) => {
	let i = 0;
	for(let p of pricesData){
		for(let coin of Object.keys(balances)){
			let pair = coin + "BTC";
			if(coin === "BTC"){
				pair = "BTCUSDT";
			}
			let price = balances[coin].balances[i] * parseFloat(p.prices.data[pair]);
			prices[coin].push(price)
		}
		dates.push(p.prices.date);
		i++;
	}

	for(let coin of Object.keys(balances)){
		let h = document.createElement("h3");
		h.innerHTML = coin;
		document.body.appendChild(h);
		let canvas = document.createElement("canvas");
		canvas.id = "canvas-" + coin;
		document.body.appendChild(canvas);
		let ctx = canvas.getContext('2d');
		let chart = new Chart(ctx, {
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
			options: {}
		});
	}

});
