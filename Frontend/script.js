var json = [];
var beequipstats = {}
var beequipbuttons = {}
var beequipTitles = {}
var potential = null
var WaxArray = []

function BeequipNameFormated(BeequipStat) { return `${(BeequipStat["StatCategory"] == "Hive Bonus") ? "[Hive Bonus] " : ((BeequipStat["StatCategory"] == "Ability") ? "[Ability] " : "")}${(BeequipStat["StatType"] == "Multiplier") ? "x" : "+"}${BeequipStat["StatName"]}${(((BeequipStat["StatType"] == "Percentage")) ? "%" : "")}` }

function BeequipValueBiasChance(x, n, bias, pot) { return (2 / (n + 1)) * (1 / (bias + 1)) * (1 + (bias - 1) * (pot * (1 - 2 * x / n) + x / n)) }

function getSum(total, num) { return total + Number(num) }

function initbeequipoverview(beequip, potential) {
    window.history.replaceState({}, "", window.location.pathname) ?? null;

    const InfoDiv = document.querySelector('.BeequipOverview');
    InfoDiv.querySelector('h2').innerHTML = beequip;
    InfoDiv.querySelector('img').src = `/Beequips/${beequip}.png`;
    InfoDiv.querySelector('p').innerHTML = `Potential: ${((n = potential * 5), "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n)))}`;

    const beequipFrom = document.getElementById("beequip")
    beequipFrom.querySelector(`option[value="${beequip}"]`).selected = true

    const PotFrom = document.getElementById("potential")
    PotFrom.value = potential
}

function initupgradetotal(json, potential) {
    beequipbuttons["Pie Percentage"] = [{ values: [], labels: [], type: 'pie' }]
    beequipbuttons["Pie Value Percentage"] = [{ values: [], labels: [], type: 'pie' }];
    beequipTitles["Pie Percentage"] = { title: { text: 'Bee Stat Upgrade Percentages' }, autosize: true }
    beequipTitles["Pie Value Percentage"] = { title: { text: 'Indiviual Bee Upgrade Value Percentages' }, autosize: true }

    var TotalUpgradeWeight = 0
    var TotalNonUpgradeWeight = 0
    var TotalUpgradeLimit = 0
    var TotalNonUpgradeLimit = 0

    for (let i = 0; i < json.length; i++) {
        const Weighting = json[i]["Upgrade Weight"] ?? [0]

        if (Weighting == 0) { continue }

        const WeightingMin = Weighting[0]
        const WeightingMax = Weighting[Weighting.length - 1]
        const WeightingScale = json[i]["Upgrade Scale"] ?? 1

        const ActualWeighting = (WeightingMax - WeightingMin) * (potential) ** (WeightingScale) + WeightingMin

        TotalNonUpgradeWeight += (json[i]["Caustic Upgrade"]) ? 0 : ActualWeighting
        TotalUpgradeWeight += ActualWeighting
        TotalUpgradeLimit += json[i]["Max Upgrade"]
        TotalNonUpgradeLimit += (json[i]["Caustic Upgrade"]) ? 0 : json[i]["Max Upgrade"]
        beequipbuttons["Pie Percentage"][0]["values"].push(ActualWeighting)
        beequipbuttons["Pie Percentage"][0]["labels"].push(BeequipNameFormated(json[i]))
    }

    return [TotalUpgradeWeight, TotalNonUpgradeWeight, TotalUpgradeLimit, TotalNonUpgradeLimit]
}

function rollbasestat(BeequipStat) {
    const BaseChance = BeequipStat["Base Stat Chance"] ?? [0]
    const BaseChanceMin = BaseChance[0]
    const BaseChanceMax = BaseChance[BaseChance.length - 1]
    const BaseScale = BeequipStat["Base Stat Scale"] ?? 1

    const ActualChance = (BaseChanceMax - BaseChanceMin) * (potential) ** (BaseScale) + BaseChanceMin
    const Roll = Math.random() * 100

    const BaseValue = BeequipStat["Base Value"] ?? ["-"]

    InsertLog(`${BeequipNameFormated(BeequipStat)} ${(Roll > ActualChance) ? "Fail" : "Granted"} (${Math.round(Roll * 1000) / 1000}% vs ${ActualChance}%)`, ((Roll > ActualChance) ? "negativestat" : "postivestat"))

    return (Roll > ActualChance) ? null : ((BeequipStat["StatCategory"] != "Ability") ? `${BaseValue[Math.floor(Math.random() * BaseValue.length)]}` : BeequipStat["StatName"])
}

function initbasetable(BeequipStat) {
    const BaseRowInfo = document.createElement("tr")

    const BaseChance = BeequipStat["Base Stat Chance"] ?? [0]
    const BaseChanceMin = BaseChance[0]
    const BaseChanceMax = BaseChance[BaseChance.length - 1]
    const BaseScale = BeequipStat["Base Stat Scale"] ?? 1

    const BaseValue = BeequipStat["Base Value"] ?? ["-"]
    const BaseValueMin = BaseValue[0]
    const BaseValueMax = BaseValue[BaseValue.length - 1]

    const ActualChance = (BaseChanceMax - BaseChanceMin) * (potential) ** (BaseScale) + BaseChanceMin

    const t = [BeequipNameFormated(BeequipStat), BaseValueMin, BaseValueMax, ActualChance + "%"]

    beequipbuttons[`Base Pot Chance ${BeequipNameFormated(BeequipStat)}`] = [{ x: [], y: [], type: 'scatter' }]
    beequipTitles[`Base Pot Chance ${BeequipNameFormated(BeequipStat)}`] = {
        title: { text: `Base Pot Chance ${BeequipNameFormated(BeequipStat)}` },
        xaxis: { title: { text: 'Potential' } },
        yaxis: { title: { text: 'Chance %' } },
        autosize: true,
    }

    for (let x = 0; x < 11; x++) {
        beequipbuttons[`Base Pot Chance ${BeequipNameFormated(BeequipStat)}`][0]["x"].push(x)
        beequipbuttons[`Base Pot Chance ${BeequipNameFormated(BeequipStat)}`][0]["y"].push((BaseChanceMax - BaseChanceMin) * (x / 10) ** (BaseScale) + BaseChanceMin)
    }

    beequipTitles[`Base Pot Chance ${BeequipNameFormated(BeequipStat)}`] = {
        title: { text: `${BeequipNameFormated(BeequipStat)} Potential Base Chance` },
        xaxis: { title: { text: 'Potential' } },
        yaxis: { title: { text: 'Chance %' } },
        autosize: true,
    }

    for (let i = 0; i < t.length; i++) {
        const DataInfo = document.createElement("td")
        DataInfo.innerHTML = (i == t.length - 1 && BaseChanceMin != BaseChanceMax) ? `<button class="graphbutton" id="Base Pot Chance ${BeequipNameFormated(BeequipStat)}">${Math.round(ActualChance * 1000) / 1000}%</button>` : t[i]
        BaseRowInfo.appendChild(DataInfo);
    }

    document.getElementById("BaseTable").appendChild(BaseRowInfo);
}

function newupgradecell(parent, content) {
    const td = document.createElement("td")
    td.innerHTML = content
    parent.appendChild(td);
}

function newheadingcell(parent, content) {
    const th = document.createElement("th")
    th.innerHTML = content
    parent.appendChild(th);
}

function newsubcell(parent, arraycontent) {
    const Cell = document.createElement("td")
    Cell.classList.add('cellsplit');
    parent.appendChild(Cell);

    for (let i = 0; i < arraycontent.length; i++) {
        const Subcell = document.createElement("div")
        Subcell.classList.add('subcell');
        Subcell.innerHTML = arraycontent[i]
        Cell.appendChild(Subcell)
    }
}

function initupgradetable(BeequipStat, TotalUpgradeWeight, noncausticstats, causticstats) {
    const BaseRowInfo = document.createElement("tr")

    newupgradecell(BaseRowInfo, BeequipNameFormated(BeequipStat))

    const Weighting = BeequipStat["Upgrade Weight"] ?? [0]
    const WeightingMin = Weighting[0]
    const WeightingMax = Weighting[Weighting.length - 1]
    const WeightingScale = BeequipStat["Upgrade Scale"] ?? 1

    const ActualWeighting = (WeightingMax - WeightingMin) * (potential) ** (WeightingScale) + WeightingMin

    if (WeightingMax == WeightingMin) { newupgradecell(BaseRowInfo, ActualWeighting + "%") } else {
        newupgradecell(BaseRowInfo, `<button class="graphbutton" id="Pot Weight ${BeequipNameFormated(BeequipStat)}">${Math.round(ActualWeighting * 1000) / 1000}%</button>`)
        beequipbuttons[`Pot Weight ${BeequipNameFormated(BeequipStat)}`] = [{ x: [], y: [], type: 'scatter' }]
        beequipTitles[`Pot Weight ${BeequipNameFormated(BeequipStat)}`] = { title: { text: `${BeequipNameFormated(BeequipStat)} Potential Weight` }, xaxis: { title: { text: 'Potential' } }, yaxis: { title: { text: 'Chance %' } }, autosize: true }
        for (let x = 0; x < 11; x++) { beequipbuttons[`Pot Weight ${BeequipNameFormated(BeequipStat)}`][0]["x"].push(x / 10); beequipbuttons[`Pot Weight ${BeequipNameFormated(BeequipStat)}`][0]["y"].push((WeightingMax - WeightingMin) * (x / 10) ** (WeightingScale) + WeightingMin) }
    }

    if ((BeequipStat["Upgrade Value"] ?? []).length <= 1) { newupgradecell(BaseRowInfo, BeequipStat["Upgrade Value"] ? BeequipStat["Upgrade Value"][0] : "-") } else {
        var ValueArray = []
        for (let i = 0; i < BeequipStat["Upgrade Value"].length; i++) { ValueArray.push(BeequipStat["Upgrade Value"][i]) }
        newsubcell(BaseRowInfo, ValueArray)
    }

    newupgradecell(BaseRowInfo, BeequipStat["Bias"] ? `<button class="graphbutton" id="Bias ${BeequipNameFormated(BeequipStat)}">${BeequipStat["Bias"]}</button>` : "-")

    if ((BeequipStat["Upgrade Value"] ?? []).length <= 1) { newupgradecell(BaseRowInfo, "100%") } else {
        var ValueArray = []

        beequipbuttons[`Bias ${BeequipNameFormated(BeequipStat)}`] = []
        beequipTitles[`Bias ${BeequipNameFormated(BeequipStat)}`] = {
            title: { text: `${BeequipNameFormated(BeequipStat)} Potential Base Chance` },
            xaxis: { title: { text: 'Potential' } },
            yaxis: { title: { text: 'Chance %' } },
            autosize: true,
        }

        for (let i = 0; i < BeequipStat["Upgrade Value"].length; i++) {
            ValueArray.push(Math.round(BeequipValueBiasChance(BeequipStat["Upgrade Value"].length - 1 - i, BeequipStat["Upgrade Value"].length - 1, BeequipStat["Bias"] ?? 1, potential) * 100) + "%")
            beequipbuttons[`Bias ${BeequipNameFormated(BeequipStat)}`].push({ x: [], y: [], type: 'scatter', name: BeequipStat["Upgrade Value"][i] })
            for (let x = 0; x < 11; x++) {
                beequipbuttons[`Bias ${BeequipNameFormated(BeequipStat)}`][i]["x"].push(x / 10)
                beequipbuttons[`Bias ${BeequipNameFormated(BeequipStat)}`][i]["y"].push(BeequipValueBiasChance(BeequipStat["Upgrade Value"].length - 1 - i, BeequipStat["Upgrade Value"].length - 1, BeequipStat["Bias"] ?? 1, x / 10))
            }
        }
        newsubcell(BaseRowInfo, ValueArray)
    }

    if ((BeequipStat["Upgrade Value"] ?? []).length <= 1) {
        newupgradecell(BaseRowInfo, Math.round(ActualWeighting / TotalUpgradeWeight * 100000) / 1000 + "%")
        beequipbuttons["Pie Value Percentage"][0]["values"].push(ActualWeighting / TotalUpgradeWeight * 100)
        beequipbuttons["Pie Value Percentage"][0]["labels"].push(BeequipNameFormated(BeequipStat))
    } else {
        var ValueArray = []
        for (let i = 0; i < BeequipStat["Upgrade Value"].length; i++) {
            ValueArray.push(`<button class="graphbutton" id="Expected Value ${BeequipNameFormated(BeequipStat)} Value ${i + 1}">${Math.round(ActualWeighting / TotalUpgradeWeight * BeequipValueBiasChance(BeequipStat["Upgrade Value"].length - 1 - i, BeequipStat["Upgrade Value"].length - 1, BeequipStat["Bias"] ?? 1, potential) * 100000) / 1000}%</button>`)

            var PMD = []
            var CDF = []
            var input = []
            let n = BeequipStat["Max Upgrade"]
            let p = BeequipValueBiasChance(BeequipStat["Upgrade Value"].length - 1 - i, BeequipStat["Upgrade Value"].length - 1, BeequipStat["Bias"] ?? 1, potential)

            beequipbuttons["Pie Value Percentage"][0]["values"].push(ActualWeighting / TotalUpgradeWeight * p * 100)
            beequipbuttons["Pie Value Percentage"][0]["labels"].push(BeequipNameFormated(BeequipStat) + " " + (BeequipStat["Upgrade Value"][i] ?? ""))

            for (let x = 0; x <= n; x++) {
                let y = (factorial(n) / (factorial(x) * factorial(n - x))) * ((p) ** x) * ((1 - p) ** (n - x)) * 100
                PMD.push(y)
                CDF.push(PMD.reduce(getSum, 0))
                input.push(x)
            }
            beequipbuttons[`Expected Value ${BeequipNameFormated(BeequipStat)} Value ${i + 1}`] = [
                { x: input, y: PMD, fill: 'tonexty', type: 'scatter', mode: 'none', name: 'PMD' },
                { x: input, y: CDF, fill: 'tonexty', type: 'scatter', mode: 'none', name: 'CDF' }
            ]
            beequipTitles[`Expected Value ${BeequipNameFormated(BeequipStat)} Value ${i + 1}`] = {
                title: { text: `Likelyhood of ${BeequipNameFormated(BeequipStat)} ${BeequipStat["Upgrade Value"][i]} in ${n} rolls` },
                xaxis: { title: { text: '# of Successful Upgrades' } },
                yaxis: { title: { text: 'Chance %' }, type: 'log' },
                barmode: "stack",
                autosize: true,
            }
        }

        newsubcell(BaseRowInfo, ValueArray)
    }

    newupgradecell(BaseRowInfo, ((BeequipStat["Max Upgrade"] ?? 0) > 1) ? `<button class="graphbutton" id="Expected Value ${BeequipNameFormated(BeequipStat)}">${Math.round(ActualWeighting / TotalUpgradeWeight * 100000) / 1000}%</button>` : Math.round(ActualWeighting / TotalUpgradeWeight * 100000) / 1000 + "%")

    if ((BeequipStat["Max Upgrade"] ?? 0) > 1) {
        var PMD = []
        var CDF = []
        var input = []
        let n = BeequipStat["Max Upgrade"]
        for (let x = 0; x <= n; x++) {
            let p = ActualWeighting / TotalUpgradeWeight
            let y = (factorial(20) / (factorial(x) * factorial(20 - x))) * ((p) ** x) * ((1 - p) ** (20 - x)) * 100
            PMD.push(y)
            CDF.push(PMD.reduce(getSum, 0))
            input.push(x)
        }
        beequipbuttons[`Expected Value ${BeequipNameFormated(BeequipStat)}`] = [
            { x: input, y: PMD, fill: 'tonexty', type: 'scatter', mode: 'none', name: 'PMD' },
            { x: input, y: CDF, fill: 'tonexty', type: 'scatter', mode: 'none', name: 'CDF' }
        ]
        beequipTitles[`Expected Value ${BeequipNameFormated(BeequipStat)}`] = {
            title: { text: `Likelyhood of ${BeequipNameFormated(BeequipStat)} in ${20} rolls` },
            xaxis: { title: { text: '# of Successful Upgrades' } },
            yaxis: { title: { text: 'Chance %' }, type: 'log' },
            barmode: "stack",
            autosize: true,
        }
    }

    newupgradecell(BaseRowInfo, BeequipStat["Max Upgrade"])

    BeequipStat["Caustic Upgrade"] ? causticstats.push(BaseRowInfo) : noncausticstats.push(BaseRowInfo);
}

function updatecurrentstat(p, CurrentBeequipStat, CurrentValue) {
    if (CurrentValue == null) { p.innerHTML = ""; return }

    if (CurrentValue < 0) { p.classList.add('negativestat') } else if (CurrentBeequipStat["StatCategory"] == "Hive Bonus") { p.classList.add('hivebonus') } else { p.classList.add('postivestat') }
    p.innerHTML = `
    ${(CurrentBeequipStat["StatCategory"] == "Hive Bonus") ? "[Hive Bonus] " : ""}
    ${(CurrentBeequipStat["StatType"] != "Multiplier") ? (((CurrentValue < 0) ? "" : "+") + ((CurrentBeequipStat["StatCategory"] == "Ability") ? "Ability: " : "") + CurrentValue + (((CurrentBeequipStat["StatType"] == "Percentage")) ? "%" : "")) : "x" + (100 + Number(CurrentValue)) / 100}
    ${(CurrentBeequipStat["StatCategory"] != "Ability") ? " " + CurrentBeequipStat["StatName"] : ""}
    ${(beequipstats[BeequipNameFormated(CurrentBeequipStat)]["Upgrades"].length > 0 && CurrentBeequipStat["StatCategory"] != "Ability") ? ` ( ${(beequipstats[BeequipNameFormated(CurrentBeequipStat)]["Value"] ?? "-".replace("null", "-"))} + ${CurrentValue - beequipstats[BeequipNameFormated(CurrentBeequipStat)]["Value"]} )` : ((CurrentBeequipStat["StatCategory"] == "Ability" && beequipstats[BeequipNameFormated(CurrentBeequipStat)]["Upgrades"].length > 0) ? "(From Wax)" : "")}
    `
}

function getbeestatarryfromname(formatedbeestat) { for (let i = 0; i < json.length; i++) { if (BeequipNameFormated(json[i]) == formatedbeestat) { return json[i] } } }

async function initbeequip() {
    const params = new URLSearchParams(window.location.search);

    const beequip = params.get("beequip") ?? null;
    potential = params.get("potential") ? ((Math.abs(params.get("potential")) >= 0) ? Math.abs(params.get("potential")) : 1) : Math.random();

    try { const res = await fetch(`/beequips/${beequip}.json`); json = await res.json() } catch (err) { console.log("Couldn't load Data, Try another valid beequip."); console.error(err); return }

    initbeequipoverview(beequip, potential)

    const StatDiv = document.getElementById("BeequipStats")
    var ArryTotal = initupgradetotal(json, potential)

    var noncausticstats = []
    var causticstats = []

    for (let i = 0; i < json.length; i++) {
        const BeequipStat = json[i]
        const BaseStat = rollbasestat(BeequipStat)

        beequipstats[BeequipNameFormated(BeequipStat)] = {
            "StatName": BeequipStat["StatName"],
            "StatCategory": BeequipStat["StatCategory"],
            "StatType": BeequipStat["StatType"],
            "OriginalValue": BaseStat,
            "Value": BaseStat,
            "Upgrades": [],
            "Limit": BeequipStat["Max Upgrade"] ?? null,
        }

        const p = document.createElement("p")
        p.id = (BeequipNameFormated(BeequipStat)).replaceAll(" ", "_")
        StatDiv.appendChild(p);

        if (BeequipStat["Base Stat Chance"]) { initbasetable(BeequipStat) };

        if (BeequipStat["Upgrade Weight"]) { initupgradetable(BeequipStat, ArryTotal[0], noncausticstats, causticstats) }

        if (BaseStat) { updatecurrentstat(p, BeequipStat, BaseStat) }
    }

    const UpgradeTable = document.getElementById("UpgradeTable")
    const Total = document.createElement("tr")
    const GrandTotal = document.createElement("tr")

    var Arry = ["Non Caustic Total", Math.round(ArryTotal[1] * 1000) / 1000 + "%", "-", "-", "-", "-", "-", ArryTotal[3]]

    for (let i = 0; i < noncausticstats.length; i++) { UpgradeTable.appendChild(noncausticstats[i]) }
    for (let i = 0; i < Arry.length; i++) { newheadingcell(Total, Arry[i]) }
    UpgradeTable.appendChild(Total);

    for (let i = 0; i < causticstats.length; i++) { UpgradeTable.appendChild(causticstats[i]) }

    Arry = ["Total", Math.round(ArryTotal[0] * 1000) / 1000 + "%", "-", "-", "-", `<button class="graphbutton" id="Pie Value Percentage">100%</button>`, `<button class="graphbutton" id="Pie Percentage">100%</button>`, ArryTotal[2]]
    for (let i = 0; i < Arry.length; i++) { newheadingcell(GrandTotal, Arry[i]) }
    UpgradeTable.appendChild(GrandTotal);

    Plotly.newPlot("graph", beequipbuttons["Pie Percentage"], beequipTitles["Pie Percentage"], { responsive: true, displaylogo: false });

    document.querySelectorAll('.graphbutton').forEach(button => {
        button.addEventListener('click', () => {
            InsertLog(`Plotting ${button.id}`, "postivestat")
            Plotly.newPlot("graph", beequipbuttons[button.id], beequipTitles[button.id], { responsive: true, displaylogo: false });
        });
    });
}

function InsertLog(str, ClassName) {
    const box = document.getElementById('Logs')

    const p = document.createElement("p")
    p.innerHTML = str
    p.classList.add(ClassName)
    box.appendChild(p);
    setTimeout(() => p.remove(), 5000);
}

function factorial(x) {
    return [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800, 479001600, 6227020800, 87178291200, 1307674368000, 20922789888000, 355687428096000, 6402373705728000, 121645100408832000, 2432902008176640000][x]
}

function GetWeightedDraw(Dictionary) {
    var total = 0

    for (var key in Dictionary) {
        total += Dictionary[key]
    }

    var Roll = Math.random() * total

    for (var key in Dictionary) {
        Roll -= Dictionary[key]
        if (Roll >= 0) { continue }
        return key
    }
}

function initwaxbutton() {
    const WaxProability = { "Soft-Wax": 100, "Hard-Wax": 60, "Swirled-Wax": 100, "Caustic-Wax": 25, "Debug-Wax": 100, "Turpentine": 100 }
    var isbroken = false

    document.querySelectorAll('.waxbutton').forEach(button => {
        var clicks = 0;
        const Counter = document.querySelector(`#${button.id}.Counter`)

        button.addEventListener('click', () => {
            if (isbroken) { InsertLog(`Beequip is broken.`, "negativestat"); return }
            if (WaxArray.length >= 5 && button.id != "Turpentine") { InsertLog(`Beequip Has 5 Waxes.`, "negativestat"); return }

            clicks += 1;
            Counter.innerHTML = clicks;

            if (button.id == "Turpentine") { WaxArray = TurpentineStats(); return }

            const Roll = Math.floor(Math.random() * 100)
            WaxArray.push(button.id)
            InsertLog(`${(button.id).replace("-", " ")} ${(Roll > WaxProability[button.id]) ? "Fail" : "Granted"} (${Roll}% vs ${WaxProability[button.id] + "%"})`, ((Roll > WaxProability[button.id]) ? "negativestat" : "postivestat"))

            document.getElementById("wax" + WaxArray.length).innerHTML = `<div class="waxicon"><img src="/Waxes/${(button.id).replace("-", "_")}.png" alt="${(button.id).replace("-", " ")} ${(Roll > WaxProability[button.id]) ? "Fail" : "Success"}"><img src="/Indicators/${(Roll > WaxProability[button.id]) ? "Cross" : "Checkmark"}.png" class="overlay-img"></div>`
            if (Roll > WaxProability[button.id]) { isbroken = (button.id == "Caustic-Wax"); return }

            rollupgrades(button.id)

            if (button.id != "Swirled-Wax") { return }

            for (let i = 0; i < json.length; i++) {
                const BeequipStat = json[i]
                const BaseStat = rollbasestat(BeequipStat)

                beequipstats[BeequipNameFormated(BeequipStat)].Value = BaseStat
                beequipstats[BeequipNameFormated(BeequipStat)].Upgrades = []
                updatecurrentstat(document.getElementById((BeequipNameFormated(BeequipStat)).replaceAll(" ", "_")), BeequipStat, BaseStat)
            }

            for (let i = 0; i < WaxArray.length; i++) { rollupgrades(WaxArray[i]) }
        });
    });
}

function rollupgrades(Wax) {
    const WaxSuccess = { "Soft-Wax": 1, "Hard-Wax": 2, "Swirled-Wax": 0, "Caustic-Wax": 4, "Debug-Wax": 4, "Turpentine": 0 }

    for (let x = 0; x < WaxSuccess[Wax]; x++) {
        var chances = {}

        for (let i = 0; i < json.length; i++) {
            const Weighting = json[i]["Upgrade Weight"] ?? [0]

            if (Weighting == 0) { continue }
            if (beequipstats[BeequipNameFormated(json[i])].Upgrades.length >= json[i]["Max Upgrade"]) { continue }
            if ((Wax != "Caustic-Wax" && Wax != "Debug-Wax") && json[i]["Caustic Upgrade"]) { continue }

            const WeightingMin = Weighting[0]
            const WeightingMax = Weighting[Weighting.length - 1]
            const WeightingScale = json[i]["Upgrade Scale"] ?? 1

            const ActualWeighting = (WeightingMax - WeightingMin) * (potential) ** (WeightingScale) + WeightingMin

            chances[BeequipNameFormated(json[i])] = ActualWeighting
        }

        const BeeStatUpgrade = GetWeightedDraw(chances)

        if (BeeStatUpgrade == null) { InsertLog(`Theres no Elgibiable Upgrades left`, "negativestat"); return }

        var statarry = getbeestatarryfromname(BeeStatUpgrade)

        var Values = []

        if (statarry["StatCategory"] == "Ability") {statarry["Upgrade Value"] = [statarry["StatName"]]}

        for (let i = 0; i < statarry["Upgrade Value"].length; i++) { Values.push(BeequipValueBiasChance(statarry["Upgrade Value"].length - 1 - i, statarry["Upgrade Value"].length - 1, statarry["Bias"] ?? 1, potential)) };

        const BeeStatValue = GetWeightedDraw(Values)

        InsertLog(`Rolled ${BeeStatUpgrade} ${(statarry["StatCategory"] != "Ability") ? statarry["Upgrade Value"][BeeStatValue] : ""}`, "hivebonus")
        beequipstats[BeeStatUpgrade].Upgrades.push((statarry["StatCategory"] != "Ability") ? `${statarry["Upgrade Value"][BeeStatValue]}` : statarry["StatName"])

        const Stat = (statarry["StatCategory"] != "Ability") ? beequipstats[BeeStatUpgrade]["Upgrades"].reduce(getSum, Number(beequipstats[BeeStatUpgrade]["Value"])) : statarry["StatName"]

        updatecurrentstat(document.getElementById(BeeStatUpgrade.replaceAll(" ", "_")), statarry, Stat)
    }
}

function TurpentineStats() {
    Object.values(beequipstats).forEach(value => {
        value.Upgrades = []
        value.Value = value.OriginalValue
        updatecurrentstat(document.getElementById(BeequipNameFormated(value).replaceAll(" ", "_")), value, value.OriginalValue)
    });
    InsertLog(`Turpentined Beequip`, "hivebonus")
    for (let i = 1; i <= 5; i++) { document.getElementById("wax" + i).innerHTML = "" }
    return []
}

document.addEventListener("DOMContentLoaded", () => {
    initbeequip()
    initwaxbutton()
    console.log(beequipstats)
})

