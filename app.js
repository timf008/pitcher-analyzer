// -----------------------------------------------------
// Batter Analyzer - app.js
// Backend-only, no CSV preload
// -----------------------------------------------------

// -------------------------------
// Display League Averages XP + Overall Score
// -------------------------------

const season = 2026;
loadBatterOfDay(season);

// -------------------------------
// Safe helpers
// -------------------------------
function safeFixed(value, digits = 3) {
    return (value != null && !isNaN(value))
        ? Number(value).toFixed(digits)
        : "--";
}

function safeScore(value) {
    return (value != null && !isNaN(value))
        ? Number(value)
        : 0;
}

// -------------------------------
// Convert Numbers to Ordinal Strings
// -------------------------------
function toOrdinal(n) {
    const s = ["th", "st", "nd", "rd"],
          v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// -------------------------------
// Convert Name to Title Case (Player Tab)
// -------------------------------
function toTitleCase(str) {
    return str
        .split(" ")
        .map(word =>
            word.split("-")
                .map(part => {
                    // Detect initials even if input is "cj", "Cj", or "cJ"
                    if (/^[A-Za-z]{2}$/.test(part)) {
                        return part.toUpperCase(); // Force CJ, JT, JR, etc.
                    }

                    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
                })
                .join("-")
        )
        .join(" ");
}




// =====================================================
// Utility: Normalize name to match R script (First Last)
// =====================================================
function normalizeNameFrontend(x) {
    return x
        .normalize("NFKD")               // decompose accents
        .replace(/[\u0300-\u036f]/g, "") // remove accent marks ONLY
        .replace(/[,*#†+]/g, "")         // remove junk symbols
        .replace(/\./g, "")              // remove periods
        .replace(/\s+/g, " ")
        .trim();
}

// -------------------------------
// Utility: Fetch batter data
// -------------------------------
async function loadBatter(name, season, silent = false) {
    const clean = normalizeNameFrontend(name);

    const url = `https://batter-analyzer-backend.onrender.com/api/batters?name=${encodeURIComponent(clean)}&season=${season}`;
    const res = await fetch(url);

    if (!res.ok) {
        console.error("Batter fetch failed", await res.text());
        return null;
    }

    const data = await res.json();

    // ⭐ Normalize backend output: ALWAYS return an array
    const arr = Array.isArray(data) ? data : [data];

    // ⭐ Only update tab if NOT silent
if (!silent && arr && arr.length > 0) {
    const rawName = arr[0].Name || clean;
    const playerName = toTitleCase(rawName);
    const team = arr[0].Team || "";

    document.getElementById("playerTab").textContent =
        `${playerName}${team ? " — " + team : ""} (${season})`;
}

return arr;


}


// -------------------------------
// Battery fill updater
// -------------------------------
function updateBattery(id, score) {
    const el = document.getElementById(id);
    if (!el) return;

    const fill = (score / 10) * 100;

    let color;
    if (score < 3) color = "#d50000";
    else if (score < 5.5) color = "#ff9800";
    else if (score < 7.5) color = "#ffb400";
    else color = "#00c853";

    el.style.setProperty("--fill", `${fill}%`);
    el.style.setProperty("--color", color);
}

function updateOverall(score) {
    document.getElementById("overallScore").textContent = safeFixed(score, 1);
    updateBattery("battery-overall", safeScore(score));
}


// -------------------------------
// Universal metric updater
// -------------------------------
function updateMetric(rawId, batteryId, scoreId, rawValue, scoreValue) {
    document.getElementById(rawId).textContent = rawValue;
    document.getElementById(scoreId).textContent = safeFixed(scoreValue, 1);
    updateBattery(batteryId, safeScore(scoreValue));
}

// -------------------------------
// Individual metric wrappers (Batting 5‑metric model)
// -------------------------------
function updateBA(raw, score)      { updateMetric("raw-ba",    "battery-ba",    "score-ba",    stripZero(raw), score); }
function updateOBP(raw, score)     { updateMetric("raw-obp",   "battery-obp",   "score-obp",   stripZero(raw), score); }
function updateSLG(raw, score)     { updateMetric("raw-slg",   "battery-slg",   "score-slg",   stripZero(raw), score); }
function updateKpct(raw, score)    { updateMetric("raw-kpct",  "battery-kpct",  "score-kpct",  raw, score); }
function updateBBpct(raw, score)   { updateMetric("raw-bbpct", "battery-bbpct", "score-bbpct", raw, score); }


// -------------------------------
// Overall score + tier
// -------------------------------
function updateOverall(score) {
    document.getElementById("overallScore").textContent = safeFixed(score, 1);
    updateBattery("battery-overall", safeScore(score));
}

function updateXP(xp) {
    document.getElementById("xpScore").textContent = safeFixed(xp, 0);
}




// -------------------------------
// Tier → CSS class mapping
// -------------------------------
function getTierClass(tier) {
    switch (tier) {
        case "Elite": return "tier-great";
        case "Impact": return "tier-good";
        case "Solid": return "tier-fair";
        case "Developing": return "tier-average";
        case "Limited": return "tier-belowavg";
        default: return "";
    }
}

// -------------------------------
// Tier assignment (batting version)
// -------------------------------
function updateTier(score) {
    let tier = "—";

    if (score >= 8.5) tier = "Elite";
    else if (score >= 7.0) tier = "Impact";
    else if (score >= 5.5) tier = "Solid";
    else if (score >= 4.0) tier = "Developing";
    else tier = "Limited";

    document.getElementById("overallTier").innerHTML =
        `<span class="tier-badge ${getTierClass(tier)}">${tier}</span>`;
}


// -------------------------------
// Scouting note generator (Batting 5‑metric model)
// -------------------------------
function updateScoutingNote(p) {
    const strengths = [];
    const concerns = [];

    // BA
    if (p.BA >= 0.300) strengths.push("premium contact ability");
    else if (p.BA >= 0.270) strengths.push("above‑average hit tool");
    else if (p.BA < 0.240) concerns.push("inconsistent contact quality");

    // OBP
    if (p.OBP >= 0.380) strengths.push("elite on‑base skill");
    else if (p.OBP >= 0.340) strengths.push("strong plate discipline");
    else if (p.OBP < 0.300) concerns.push("limited on‑base production");

    // SLG
    if (p.SLG >= 0.550) strengths.push("impact power production");
    else if (p.SLG >= 0.450) strengths.push("workable gap power");
    else if (p.SLG < 0.380) concerns.push("below‑average impact on contact");

    // K%
    if (p.Kpct <= 18) strengths.push("advanced bat‑to‑ball skill");
    else if (p.Kpct <= 24) strengths.push("manageable swing‑and‑miss profile");
    else if (p.Kpct > 30) concerns.push("high swing‑and‑miss rate that may limit consistency");

    // BB%
    if (p.BBpct >= 12) strengths.push("plus walk generation");
    else if (p.BBpct >= 8) strengths.push("solid underlying discipline");
    else if (p.BBpct < 5) concerns.push("limited walk production");

    let note = "";

    // NEW: dead‑zone fallback
    if (!strengths.length && !concerns.length) {
        note = "Neutral underlying profile with no standout strengths or red flags.";
    } else if (strengths.length && !concerns.length) {
        note = "Profile built on " +
            strengths.join(", ").replace(/, ([^,]*)$/, " and $1") + ".";
    } else if (!strengths.length && concerns.length) {
        note = "Concerns include " +
            concerns.join(", ").replace(/, ([^,]*)$/, " and $1") + ".";
    } else {
        note = "Shows " +
            strengths.join(", ").replace(/, ([^,]*)$/, " and $1") +
            " but " +
            concerns.join(", ").replace(/, ([^,]*)$/, " and $1") +
            ".";
    }

    document.getElementById("scoutingNote").innerHTML = note;
}


// -------------------------------
// XP Score Function
// -------------------------------
function computeBatterXP(p) {
    if (!p) return null;

    return (
        (p.BA * 1000) +
        (p.OBP * 1000) +
        (p.SLG * 1000) +
        (p.BBpct * 2) -
        (p.Kpct * 1.5)
    );
}


// -------------------------------
// Weighted Overall Score (Batting 5‑metric model)
// -------------------------------
function computeWeightedOverall({
    baScore,
    obpScore,
    slgScore,
    kpctScore,
    bbpctScore
}) {
    return (
        baScore   * 0.25 +   // contact
        obpScore  * 0.25 +   // discipline / on-base
        slgScore  * 0.25 +   // power
        kpctScore * 0.15 +   // bat-to-ball
        bbpctScore* 0.10     // walk skill
    );
}

function clamp(x, min, max) {
    return Math.max(min, Math.min(max, x));
}


// ------------------------------
// Scoring functions (Batting 5‑metric model)
// ------------------------------

// BA: .300 = elite, .240 = fringe
function scoreBA(ba) {
    const score = 10 * (ba - 0.240) / (0.300 - 0.240);
    return clamp(score, 0, 10);
}

// OBP: .380 = elite, .300 = fringe
function scoreOBP(obp) {
    const score = 10 * (obp - 0.300) / (0.380 - 0.300);
    return clamp(score, 0, 10);
}

// SLG: .550 = elite, .380 = fringe
function scoreSLG(slg) {
    const score = 10 * (slg - 0.380) / (0.550 - 0.380);
    return clamp(score, 0, 10);
}

// K%: lower is better (reverse scale)
function scoreKpct(kpct) {
    const score = 10 * (30 - kpct) / (30 - 15);
    return clamp(score, 0, 10);
}

// BB%: higher is better
function scoreBBpct(bbpct) {
    const score = 10 * (bbpct - 5) / (12 - 5);
    return clamp(score, 0, 10);
}

// -------------------------------
// Utility helpers
// -------------------------------
function clamp(x, min, max) {
    return Math.max(min, Math.min(max, x));
}

function stripZero(x) {
    return String(x).replace(/^0+/, "");
}

// -------------------------------
// Main: Load player + update UI (backend-only)
// -------------------------------
async function handleLoad() {

    try {
        const name = document.getElementById("playerName").value.trim();
        const season = parseInt(document.getElementById("seasonSelect").value);

        if (!name) {
            alert("Enter a player name.");
            return;
        }

        const data = await loadBatter(name, season);

        if (!data || data.error || (Array.isArray(data) && data.length === 0)) {
            alert("Batter not found.");
            return;
        }

        const p = Array.isArray(data) ? data[0] : data;

        const baScore    = scoreBA(p.BA);
        const obpScore   = scoreOBP(p.OBP);
        const slgScore   = scoreSLG(p.SLG);
        const kpctScore  = scoreKpct(p.Kpct);
        const bbpctScore = scoreBBpct(p.BBpct);

        updateBA(safeFixed(p.BA, 3), baScore);
        updateOBP(safeFixed(p.OBP, 3), obpScore);
        updateSLG(safeFixed(p.SLG, 3), slgScore);
        updateKpct(safeFixed(p.Kpct, 1), kpctScore);
        updateBBpct(safeFixed(p.BBpct, 1), bbpctScore);

        const overall = computeWeightedOverall({
            baScore,
            obpScore,
            slgScore,
            kpctScore,
            bbpctScore
        });

        updateOverall(overall);
updateTier(overall);
updateScoutingNote(p);
updateXP(p.XP);
updateIdentityBadge();

updateWhatToWatch({

    BA: { raw: p.BA, score: baScore },
    OBP: { raw: p.OBP, score: obpScore },
    SLG: { raw: p.SLG, score: slgScore },
    Kpct: { raw: p.Kpct, score: kpctScore },
    BBpct: { raw: p.BBpct, score: bbpctScore }

});

// -------------------------------
// What to Watch
// -------------------------------
function updateWhatToWatch(metrics) {

    const watchGrid = document.getElementById("watchGrid");

    if (!watchGrid) return;

    // --------------------------------
    // Metric definitions
    // --------------------------------
    const items = [

        {
            key: "BA",
            title: "Hit Tool",
            raw: metrics.BA.raw,
            score: metrics.BA.score,

            goodText:
                "Strong batting average reflects a reliable hit tool.",

            neutralText:
                "Batting average production is solid but not a defining strength.",

            badText:
                "Limited batting average production may reduce offensive consistency."
        },

        {
            key: "OBP",
            title: "On-Base Ability",
            raw: metrics.OBP.raw,
            score: metrics.OBP.score,

            goodText:
                "Strong on-base production creates consistent offensive opportunities.",

            neutralText:
                "On-base production is solid but not a defining strength.",

            badText:
                "Limited on-base production may reduce scoring opportunities."
        },

        {
            key: "SLG",
            title: "Power",
            raw: metrics.SLG.raw,
            score: metrics.SLG.score,

            goodText:
                "Impact power is a major offensive strength.",

            neutralText:
                "Power production is solid but not a defining strength.",

            badText:
                "Limited power may cap extra-base and home run production."
        },

        {
            key: "Kpct",
            title: "Contact Skills",
            raw: metrics.Kpct.raw,
            score: metrics.Kpct.score,

            goodText:
                "Low strikeout rate supports consistent contact and batting average.",

            neutralText:
                "Strikeout rate is manageable but remains worth monitoring.",

            badText:
                "Elevated strikeout rate creates volatility in the offensive profile."
        },

        {
            key: "BBpct",
            title: "Plate Discipline",
            raw: metrics.BBpct.raw,
            score: metrics.BBpct.score,

            goodText:
                "Strong walk rate supports OBP and plate control.",

            neutralText:
                "Walk rate is adequate but not a major source of offensive value.",

            badText:
                "Low walk rate may limit on-base production and plate control."
        }

    ];


    // --------------------------------
    // Classify each metric
    // --------------------------------
    items.forEach(item => {

        if (item.score >= 8) {

            item.type = "good";
            item.icon = "↑";
            item.text = item.goodText;

            // 0 → 1 strength scale
            item.importance = (item.score - 8) / 2;

        }
        else if (item.score >= 5) {

            item.type = "neutral";
            item.icon = "−";
            item.text = item.neutralText;

            // Neutral metrics are less important
            item.importance = 0;

        }
        else {

            item.type = "bad";
            item.icon = "↓";
            item.text = item.badText;

            // 0 → 1 weakness scale
            item.importance = (5 - item.score) / 5;

        }

    });


    // --------------------------------
    // Find the three most meaningful
    // --------------------------------
    items.sort((a, b) => b.importance - a.importance);

    const selected = items.slice(0, 3);


    // --------------------------------
    // Build cards
    // --------------------------------
    watchGrid.innerHTML = selected.map(item => {

        let rawDisplay;

        if (
    item.key === "BA" ||
    item.key === "OBP" ||
    item.key === "SLG"
) {
    rawDisplay = Number(item.raw).toFixed(3).replace(/^0/, "");
}
else {
    rawDisplay = Number(item.raw).toFixed(1) + "%";
}

        const statLabel = {
            BA: "BA",
            OBP: "OBP",
            SLG: "SLG",
            Kpct: "K%",
            BBpct: "BB%"
        }[item.key];


        return `
            <div class="watch-card watch-${item.type}">

                <div class="watch-icon">
                    ${item.icon}
                </div>

                <div class="watch-content">

                    <div class="watch-title">
                        ${item.title}
                    </div>

                    <div class="watch-text">
                        ${item.text}
                    </div>

                    <div class="watch-stat">
                        ${statLabel}: ${rawDisplay}
                        (${item.score.toFixed(1)}/10)
                    </div>

                </div>

            </div>
        `;

    }).join("");
}

// -------------------------------
// Fantasy Identity
// -------------------------------
const identity = classifyPlayer(p.XP, overall);

// -------------------------------
// Fantasy State
// -------------------------------
const div = calculateDivergence(p.XP, overall);
const state = divergenceState(div.divergencePct);

updateStateBadge(state);

// -------------------------------
// Fantasy Value
// -------------------------------
const fantasyValue = getFantasyValue(
    p.OverallDivergence,
    p.OverallDivergenceSD
);

updateValueBadge(
    p.OverallDivergence,
    p.OverallDivergenceSD
);

// -------------------------------
// Fantasy Summary
// -------------------------------
updateFantasySummary(
    identity,
    state,
    fantasyValue
);

        document.getElementById("overallPercentile").textContent =
            p.Overall_pct !== undefined
                ? toOrdinal(Math.round(p.Overall_pct))
                : "--";

    } catch (err) {
        console.error("Error loading player:", err);
    }
}


// -------------------------------
// Load Batter of the Day
// -------------------------------
function loadBatterOfDay(season) {
    fetch(`https://batter-analyzer-backend.onrender.com/api/batter-of-day?season=${season}`)
        .then(res => res.json())
        .then(player => {

            console.log("Batter of the Day JSON:", player);

            // Basic fields
            document.getElementById("bod-name").textContent = player.Player;
            document.getElementById("bod-team").textContent = player.Team;

            document.getElementById("bod-overall").textContent =
                Number(player.overall).toFixed(1);

            document.getElementById("bod-xp").textContent =
                Math.round(player.XP);

            // Batter summary line (AVG, HR, RBI, Games)
            const formattedBA = Number(player.BA).toFixed(3).replace(/^0/, "");
const summaryText = `batting ${formattedBA} with ${player.HR} HR and ${player.RBI} RBI across ${player.G} games.`;



            document.getElementById("bod-summary").textContent = summaryText;
        })
        .catch(err => {
            console.error("Error loading Batter of the Day:", err);
        });
}

// -------------------------------
// Trend Handler (Season Comparison)
// -------------------------------
async function handleTrend() {

    try {
        const rawName = document.getElementById("playerName").value.trim();
        if (!rawName) {
            alert("Enter a player name first.");
            return;
        }

        const season = Number(document.getElementById("seasonSelect").value);
        const lastSeason = season - 1;

        // Fetch both seasons using batting API
        const currArr = await fetch(
            `https://batter-analyzer-backend.onrender.com/api/batters?name=${encodeURIComponent(rawName)}&season=${season}`
        ).then(r => r.json());

        const prevArr = await fetch(
            `https://batter-analyzer-backend.onrender.com/api/batters?name=${encodeURIComponent(rawName)}&season=${lastSeason}`
        ).then(r => r.json());

        const curr = Array.isArray(currArr) ? currArr[0] : currArr;
        const prev = Array.isArray(prevArr) ? prevArr[0] : prevArr;

        if (!curr || curr.error || !prev || prev.error) {
            alert("Not enough data for season comparison.");
            return;
        }

        // Must have batting metrics
        if (curr.BA == null || prev.BA == null) {
            alert("Not enough data for season comparison.");
            return;
        }

        // ⭐ Compute XP for both seasons
        curr.XP = computeBatterXP(curr);
        prev.XP = computeBatterXP(prev);

        // ⭐ Compute Overall Score for both seasons
        curr.OverallScore = computeWeightedOverall({
            baScore: scoreBA(curr.BA),
            obpScore: scoreOBP(curr.OBP),
            slgScore: scoreSLG(curr.SLG),
            kpctScore: scoreKpct(curr.Kpct),
            bbpctScore: scoreBBpct(curr.BBpct)
        });

        prev.OverallScore = computeWeightedOverall({
            baScore: scoreBA(prev.BA),
            obpScore: scoreOBP(prev.OBP),
            slgScore: scoreSLG(prev.SLG),
            kpctScore: scoreKpct(prev.Kpct),
            bbpctScore: scoreBBpct(prev.BBpct)
        });

        const html = buildSeasonComparison(curr, prev, season, lastSeason);

        document.getElementById("trendTitle").textContent =
            `Season Comparison (${season} vs ${lastSeason})`;

        document.getElementById("trendBody").innerHTML = html;
        document.getElementById("trendModal").style.display = "flex";

    } catch (err) {
        console.error("Trend error:", err);
    }
}


// -------------------------------
// Trend Table (Season Comparison)
// -------------------------------
function buildSeasonComparison(curr, prev, season, lastSeason) {

    const stats = [
        { key: "BA",    label: "BA",    higherIsBetter: true  },
        { key: "OBP",   label: "OBP",   higherIsBetter: true  },
        { key: "SLG",   label: "SLG",   higherIsBetter: true  },
        { key: "Kpct",  label: "K%",    higherIsBetter: false },
        { key: "BBpct", label: "BB%",   higherIsBetter: true  },

        // ⭐ NEW STATS
        { key: "XP",            label: "XP",            higherIsBetter: true },
        { key: "OverallScore",  label: "Overall Score", higherIsBetter: true }
    ];

    let rows = stats.map(s => {
        const a = Number(curr[s.key]);
        const b = Number(prev[s.key]);

        const arrow =
            a === b ? "➖" :
            s.higherIsBetter
                ? (a > b ? "▲" : "▼")
                : (a < b ? "▲" : "▼");

        const arrowClass =
            arrow === "▲" ? "trend-up" :
            arrow === "▼" ? "trend-down" :
            "trend-flat";

        // ⭐ Correct formatting rules
        let dispA, dispB;

        if (s.key === "Kpct" || s.key === "BBpct") {
            dispA = isNaN(a) ? "--" : a.toFixed(1);
            dispB = isNaN(b) ? "--" : b.toFixed(1);
        }
        else if (s.key === "XP") {
            dispA = isNaN(a) ? "--" : Math.round(a);
            dispB = isNaN(b) ? "--" : Math.round(b);
        }
        else if (s.key === "OverallScore") {
            dispA = isNaN(a) ? "--" : a.toFixed(1);
            dispB = isNaN(b) ? "--" : b.toFixed(1);
        }
        else {
            dispA = isNaN(a) ? "--" : stripZero(a.toFixed(3));
            dispB = isNaN(b) ? "--" : stripZero(b.toFixed(3));
        }

        return `
        <tr>
            <td>${s.label}</td>
            <td>${dispA}</td>
            <td>${dispB}</td>
            <td class="${arrowClass}">${arrow}</td>
        </tr>
        `;
    }).join("");

    return `
        <table class="trend-table">
            <thead>
                <tr>
                    <th>Stat</th>
                    <th>${season}</th>
                    <th>${lastSeason}</th>
                    <th>Trend</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}

// -------------------------------
// Compare Button (Batting Version)
// -------------------------------
async function showCompareModal() {
    console.log("COMPARE BUTTON CLICKED");

    function formatName(name) {
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    try {
        const p1_raw = document.getElementById("playerName").value.trim();
        const s1 = document.getElementById("seasonSelect").value;

        const p2_raw = document.getElementById("playerName2").value.trim();
        const s2 = document.getElementById("seasonSelect2").value;

        if (!p1_raw || !p2_raw) {
            alert("Enter both batter names.");
            return;
        }

        const data1Arr = await loadBatter(p1_raw, s1, true);
        const data2Arr = await loadBatter(p2_raw, s2, true);

        const data1 = Array.isArray(data1Arr) ? data1Arr[0] : data1Arr;
        const data2 = Array.isArray(data2Arr) ? data2Arr[0] : data2Arr;

        if (!data1 || data1.error || !data2 || data2.error) {
            alert("One or both batters not found.");
            return;
        }

        if (data1.BA == null || data2.BA == null) {
            alert("Not enough data for comparison.");
            return;
        }

        const p1_display = formatName(data1.Name || p1_raw);
        const p2_display = formatName(data2.Name || p2_raw);

        document.getElementById("compareName1").textContent = `${p1_display} (${s1})`;
        document.getElementById("compareName2").textContent = `${p2_display} (${s2})`;

        // ⭐ Batting scores
        const s1_BA    = scoreBA(data1.BA);
        const s1_OBP   = scoreOBP(data1.OBP);
        const s1_SLG   = scoreSLG(data1.SLG);
        const s1_Kpct  = scoreKpct(data1.Kpct);
        const s1_BBpct = scoreBBpct(data1.BBpct);

        const s2_BA    = scoreBA(data2.BA);
        const s2_OBP   = scoreOBP(data2.OBP);
        const s2_SLG   = scoreSLG(data2.SLG);
        const s2_Kpct  = scoreKpct(data2.Kpct);
        const s2_BBpct = scoreBBpct(data2.BBpct);

        const overall1 = computeWeightedOverall({
            baScore: s1_BA,
            obpScore: s1_OBP,
            slgScore: s1_SLG,
            kpctScore: s1_Kpct,
            bbpctScore: s1_BBpct
        });

        const overall2 = computeWeightedOverall({
            baScore: s2_BA,
            obpScore: s2_OBP,
            slgScore: s2_SLG,
            kpctScore: s2_Kpct,
            bbpctScore: s2_BBpct
        });

        // Compute XP
        const xp1 = computeBatterXP(data1);
        const xp2 = computeBatterXP(data2);

        const stats = [
            ["BA",   data1.BA,    data2.BA,    stripZero(data1.BA.toFixed(3)),    stripZero(data2.BA.toFixed(3))],
            ["OBP",  data1.OBP,   data2.OBP,   stripZero(data1.OBP.toFixed(3)),   stripZero(data2.OBP.toFixed(3))],
            ["SLG",  data1.SLG,   data2.SLG,   stripZero(data1.SLG.toFixed(3)),   stripZero(data2.SLG.toFixed(3))],
            ["K%",   data1.Kpct,  data2.Kpct,  data1.Kpct.toFixed(1),             data2.Kpct.toFixed(1)],
            ["BB%",  data1.BBpct, data2.BBpct, data1.BBpct.toFixed(1),            data2.BBpct.toFixed(1)],

            // ⭐ XP added here
            ["XP", xp1, xp2, Math.round(xp1), Math.round(xp2)],

            ["Overall Score", overall1, overall2, overall1.toFixed(1), overall2.toFixed(1)]
        ];

        const tbody = document.getElementById("compareBody");
        tbody.innerHTML = "";

        stats.forEach(([label, raw1, raw2, disp1, disp2]) => {

    const row = document.createElement("tr");

    let class1 = "tie";
    let class2 = "tie";

    let player1Wins = false;
    let player2Wins = false;

    if (raw1 != null && raw2 != null) {

        // Lower is better for K%
        if (label === "K%") {

            if (raw1 < raw2) {
                class1 = "win";
                class2 = "lose";
                player1Wins = true;
            }
            else if (raw2 < raw1) {
                class1 = "lose";
                class2 = "win";
                player2Wins = true;
            }

        }

        // Higher is better for everything else
        else {

            if (raw1 > raw2) {
                class1 = "win";
                class2 = "lose";
                player1Wins = true;
            }
            else if (raw2 > raw1) {
                class1 = "lose";
                class2 = "win";
                player2Wins = true;
            }

        }
    }


    // ----------------------------------
    // Difference
    // Player 1 minus Player 2
    // ----------------------------------

    const difference = raw1 - raw2;

    let differenceDisplay = "--";

    if (label === "BA" || label === "OBP" || label === "SLG") {

        differenceDisplay =
            `${difference >= 0 ? "+" : ""}${difference.toFixed(3)}`;

    }

    else if (label === "K%" || label === "BB%") {

        differenceDisplay =
            `${difference >= 0 ? "+" : ""}${difference.toFixed(1)}`;

    }

    else if (label === "XP") {

        differenceDisplay =
            `${difference >= 0 ? "+" : ""}${Math.round(difference)}`;

    }

    else if (label === "Overall Score") {

        differenceDisplay =
            `${difference >= 0 ? "+" : ""}${difference.toFixed(1)}`;

    }


    // Difference color represents whether Player 1's
    // difference is favorable — NOT merely positive.

    let differenceClass = "tie";

    if (player1Wins) {
        differenceClass = "positive";
    }
    else if (player2Wins) {
        differenceClass = "negative";
    }


    row.innerHTML = `
        <td>${label}</td>

        <td class="${class1}">
            ${disp1}
        </td>

        <td class="${class2}">
            ${disp2}
        </td>

        <td>
            <span class="compare-difference ${differenceClass}">
                ${differenceDisplay}
            </span>
        </td>
    `;

    tbody.appendChild(row);
});

        document.getElementById("compareModal").style.display = "flex";

    } catch (err) {
        console.error("Compare error:", err);
    }
}





// -------------------------------
// Leaders Button
// -------------------------------
async function loadLeaders() {

    try {
        const season = document.getElementById("seasonSelect").value;

        const data = await fetch(
            `https://batter-analyzer-backend.onrender.com/api/leaders?season=${season}`
        ).then(r => r.json());

        if (!Array.isArray(data)) {
            alert("No leaderboard data available.");
            return;
        }

        buildLeadersTable(data);

    } catch (err) {
        console.error("Leaders error:", err);
        alert("Error loading leaderboard.");
    }
}


// -------------------------------
// Leaders Table Name Normalization
// -------------------------------
function normalizeName(raw) {
    if (!raw) return raw;

    // Convert raw UTF-8 byte sequences like <c3><ad> into real characters
    let cleaned = raw.replace(/<c3><ad>/g, "í")
                     .replace(/<c3><a1>/g, "á")
                     .replace(/<c3><b1>/g, "ñ")
                     .replace(/<c3><a9>/g, "é")
                     .replace(/<c3><b3>/g, "ó")
                     .replace(/<c3><ba>/g, "ú");

    // Strip accents
    cleaned = cleaned.normalize("NFD").replace(/\p{Diacritic}/gu, "");

    return cleaned;
}

// -------------------------------
// Leaders Table (BATTERS, MATCHED TO PITCHERS)
// -------------------------------

function buildLeadersTable(arr) {
    const tbody = document.getElementById("leadersBody");
    tbody.innerHTML = "";

    const filtered = arr;

    // Sort by OVERALL score (backend computed)
    const sorted = [...filtered].sort((a, b) => b.overall - a.overall);

    // Top 50
    const top50 = sorted.slice(0, 50);

    // Build table
    top50.forEach((p, index) => {
        const originalPlayer = p.Player;

        const displayPlayer = normalizeName(p.Player);
        p.Name = normalizeName(p.Name);

        const rank = index + 1;

        const identity = p.identity || "Neutral";
        const identityClass = identity.toLowerCase();

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${rank}</td>
            <td>
                <button
                    type="button"
                    class="leader-player-link"
                >
                    ${displayPlayer}
                </button>
            </td>
            <td>${p.Team}</td>
            <td>${Math.round(p.XP)}</td>
            <td>${p.overall.toFixed(2)}</td>
            <td>
                <span class="leader-identity ${identityClass}">
                    ${identity}
                </span>
            </td>
        `;

        // Click player name → load into Batter Analyzer
        const playerButton = row.querySelector(".leader-player-link");

        playerButton.addEventListener("click", async () => {
            document.getElementById("playerName").value = displayPlayer;

            document.getElementById("leadersModal").style.display = "none";

            await handleLoad();
        });

        tbody.appendChild(row);
    });

    document.getElementById("leadersModal").style.display = "flex";
}

// -------------------------------
// Light Up Fantasy Badge
// -------------------------------

// XP-only backbone
function xpTier(xp) {
    if (xp >= 1200) return "breakout";
    if (xp >= 1100) return "overperformer";
    if (xp >= 1000) return "sleeper";
    if (xp >= 900)  return "consistent";
    return "neutral";
}

// Skill modifier (bumps tier up/down)
function applySkillModifier(tier, skill) {
    const order = ["neutral", "consistent", "sleeper", "overperformer", "breakout"];
    let index = order.indexOf(tier);

    if (skill >= 8.0) index++;     // bump up
    if (skill <= 6.0) index--;     // bump down

    // clamp to valid range
    index = Math.max(0, Math.min(order.length - 1, index));

    return order[index];
}

// Final badge classifier
function classifyPlayer(xp, skill) {
    const base = xpTier(xp);
    return applySkillModifier(base, skill);
}

// -------------------------------
// Calculate Divergence (Fantasy State)
// -------------------------------
function calculateDivergence(xp, overall) {
    const expectedXP = 813.86 + (47.78 * overall);
    const divergence = (xp - expectedXP) / expectedXP;

    return {
        expectedXP,
        divergence,
        divergencePct: divergence * 100
    };
}

// -------------------------------
// Divergence → Fantasy State
// -------------------------------
function divergenceState(divergencePct) {
    if (divergencePct > 5) return "strong";
    if (divergencePct >= -2.5) return "stable";
    if (divergencePct >= -5) return "vulnerable";
    return "high-risk";
}

// -------------------------------
// Divergence → Fantasy Value
// -------------------------------
function getFantasyValue(overallDivergence, divergenceSD) {
    if (
        overallDivergence == null ||
        divergenceSD == null ||
        divergenceSD === 0
    ) {
        return "expected";
    }

    const z = overallDivergence / divergenceSD;

    if (z >= 1.0) return "extreme";
    if (z >= 0.5) return "elevated";
    if (z <= -1.0) return "suppressed";
    if (z <= -0.5) return "below";

    return "expected";
}


// -------------------------------
// Update Fantasy State Badge
// -------------------------------
function updateStateBadge(state) {
    const container = document.getElementById("player-state-key");

    if (!container) return;

    container.querySelectorAll(".state-badge").forEach(badge => {
        badge.classList.remove("active");
    });

    const badge = container.querySelector(`.state-badge.${state}`);

    if (badge) {
        badge.classList.add("active");
    }
}


// -------------------------------
// Update Fantasy Value Badge
// -------------------------------
function updateValueBadge(overallDivergence, divergenceSD) {
    const container = document.getElementById("player-value-key");
    if (!container) return;

    container.querySelectorAll(".value-badge").forEach(badge => {
        badge.classList.remove("active");
    });

    const valueClass = getFantasyValue(overallDivergence, divergenceSD);

    const badge = container.querySelector(`.value-badge.${valueClass}`);

    if (badge) {
        badge.classList.add("active");
    }
}


// -------------------------------
// Clear Fantasy State Badges
// -------------------------------
function clearStateBadges() {
    const container = document.getElementById("player-state-key");

    if (!container) return;

    container.querySelectorAll(".state-badge").forEach(badge => {
        badge.classList.remove("active");
    });
}


// -------------------------------
// Clear Fantasy Value Badges
// -------------------------------
function clearValueBadges() {
    const container = document.getElementById("player-value-key");

    if (!container) return;

    container.querySelectorAll(".value-badge").forEach(badge => {
        badge.classList.remove("active");
    });
}


// -------------------------------
// DOM Badge Update
// -------------------------------
function updateIdentityBadge() {
    const xp = parseFloat(document.getElementById("xpScore").textContent);
    const skill = parseFloat(document.getElementById("overallScore").textContent);

    const identity = classifyPlayer(xp, skill);

    clearIdentityBadges();

    const badge = document.querySelector(`.identity-badge.${identity}`);
    if (badge) badge.classList.add("active");
}

function clearIdentityBadges() {
    document.querySelectorAll(".identity-badge").forEach(badge => {
        badge.classList.remove("active");
    });
}

// -------------------------------
// Fantasy Summary
// -------------------------------
function updateFantasySummary(identity, state, value) {

    const identityTitle = document.getElementById("summaryIdentity");
    const identityText  = document.getElementById("summaryIdentityText");

    const stateTitle = document.getElementById("summaryState");
    const stateText  = document.getElementById("summaryStateText");

    const valueTitle = document.getElementById("summaryValue");
    const valueText  = document.getElementById("summaryValueText");

    // -------------------------------
    // Fantasy Identity
    // -------------------------------
    const identityDescriptions = {
        breakout:
            "This player's production and underlying profile both indicate high-level performance.",

        overperformer:
            "This player's production is running ahead of the strength of their underlying profile.",

        sleeper:
            "This player's underlying profile is stronger than their current production tier suggests.",

        consistent:
            "This player's production and underlying profile are generally aligned.",

        neutral:
            "This player currently does not show a strong Fantasy Identity signal."
    };

    const identityLabels = {
        breakout: "Breakout Star",
        overperformer: "Overperformer",
        sleeper: "Sleeper Candidate",
        consistent: "Consistent Performer",
        neutral: "Neutral"
    };

    // -------------------------------
    // Fantasy State
    // -------------------------------
    const stateDescriptions = {
        strong:
            "Current production is outperforming the expected level implied by the player's underlying profile.",

        stable:
            "Current production is generally aligned with the player's underlying profile.",

        vulnerable:
            "Current production may be difficult to sustain relative to the player's underlying profile.",

        "high-risk":
            "Current production is showing significant instability relative to the player's underlying profile."
    };

    const stateLabels = {
        strong: "Strong",
        stable: "Stable",
        vulnerable: "Vulnerable",
        "high-risk": "High Risk"
    };

    // -------------------------------
    // Fantasy Value
    // -------------------------------
    const valueDescriptions = {
        extreme:
            "This player's overall performance is running far above the expected range.",

        elevated:
            "This player's overall performance is running above the expected range.",

        expected:
            "This player's overall performance is within the expected range.",

        below:
            "This player's overall performance is running below the expected range.",

        suppressed:
            "This player's overall performance is running well below the expected range."
    };

    const valueLabels = {
        extreme: "Extreme",
        elevated: "Elevated",
        expected: "Expected",
        below: "Below Expected",
        suppressed: "Suppressed"
    };

    // -------------------------------
    // Update DOM
    // -------------------------------
    identityTitle.textContent =
        `Fantasy Identity: ${identityLabels[identity] || "--"}`;

    identityText.textContent =
        identityDescriptions[identity] || "";

    stateTitle.textContent =
        `Fantasy State: ${stateLabels[state] || "--"}`;

    stateText.textContent =
        stateDescriptions[state] || "";

    valueTitle.textContent =
        `Fantasy Value: ${valueLabels[value] || "--"}`;

    valueText.textContent =
        valueDescriptions[value] || "";
}





// -------------------------------
// Batter Tier Assignment
// -------------------------------
function getBatterTier(score) {
    if (score >= 8.5) return "Elite";
    if (score >= 7.0) return "Impact";
    if (score >= 5.5) return "Solid";
    if (score >= 4.0) return "Developing";
    return "Limited";
}


// -------------------------------
// Swap Button
// -------------------------------
document.getElementById("swapBtn").onclick = function () {
    const name1 = document.getElementById("playerName");
    const season1 = document.getElementById("seasonSelect");

    const name2 = document.getElementById("playerName2");
    const season2 = document.getElementById("seasonSelect2");

    const tempName = name1.value;
    const tempSeason = season1.value;

    name1.value = name2.value;
    season1.value = season2.value;

    name2.value = tempName;
    season2.value = tempSeason;

    // Trigger the correct load button
    document.getElementById("loadBtn").click();
};


// -------------------------------
// Reset UI
// -------------------------------
function handleReset() {
    console.log("RESET FIRED");

    const watchGrid = document.getElementById("watchGrid");
    if (watchGrid) {
        watchGrid.innerHTML = "";
    }
    document.querySelectorAll(".metric-raw").forEach(el => el.textContent = "--");
    document.querySelectorAll(".metric-score").forEach(el => el.textContent = "--");

    document.querySelectorAll(".battery").forEach(el => {
    el.style.setProperty("--fill", "0%");
    el.style.setProperty("--color", "#d50000");
});


    document.getElementById("overallScore").textContent = "--";
    document.getElementById("overallTier").innerHTML = "--";
    document.getElementById("scoutingNote").innerHTML = "--";
    document.getElementById("overallPercentile").textContent = "--";
    document.getElementById("xpScore").innerHTML = "--";
    document.getElementById("playerTab").textContent = "Player:--";
    clearIdentityBadges();
    clearStateBadges();
    clearValueBadges();
    // Clear Fantasy Summary
document.getElementById("summaryIdentity").textContent = "Fantasy Identity: --";
document.getElementById("summaryIdentityText").textContent =
    "Load a player to view their Fantasy Identity analysis.";

document.getElementById("summaryState").textContent = "Fantasy State: --";
document.getElementById("summaryStateText").textContent =
    "Load a player to view their Fantasy State analysis.";

document.getElementById("summaryValue").textContent = "Fantasy Value: --";
document.getElementById("summaryValueText").textContent =
    "Load a player to view their Fantasy Value analysis.";
}

// -------------------------------
// Latest Update Timestamp Defined
// -------------------------------
const currentSeason = document.getElementById("seasonSelect").value;

// -------------------------------
// Latest Update Timestamp (Improved)
// -------------------------------
async function loadLastUpdated(season) {
    const url = `https://batter-analyzer-backend.onrender.com/api/last-updated/batters/${season}`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Network error");

        const data = await res.json();
        const raw = data?.lastUpdated;

        const el = document.getElementById('lastUpdated');

        // Handle missing or invalid date
        if (!raw) {
            el.textContent = "Last updated: unavailable";
            return;
        }

        const date = new Date(raw);
        if (isNaN(date.getTime())) {
            el.textContent = "Last updated: invalid date";
            return;
        }

        const formatted = new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        }).format(date);

        el.textContent = `Last updated on ${formatted}`;

    } catch (err) {
        document.getElementById('lastUpdated').textContent =
            "Last updated: error loading timestamp";
    }
}


// -------------------------------
// Wire up UI buttons
// -------------------------------
document.addEventListener("DOMContentLoaded", () => {

    // Main buttons
    document.getElementById("loadBtn").addEventListener("click", handleLoad);
    document.getElementById("resetBtn").addEventListener("click", handleReset);
    document.getElementById("compareBtn").addEventListener("click", showCompareModal);
    document.getElementById("leadersBtn").addEventListener("click", loadLeaders);
    document.getElementById("trendBtn").addEventListener("click", handleTrend);


    // Timestamp
    loadLastUpdated(currentSeason);

    // Close modals
    document.getElementById("trendClose").onclick = () =>
        document.getElementById("trendModal").style.display = "none";

    document.getElementById("leadersClose").onclick = () =>
        document.getElementById("leadersModal").style.display = "none";

    document.getElementById("compareClose").onclick = () =>
        document.getElementById("compareModal").style.display = "none";

    // Click outside to close Leaders
    window.addEventListener("click", (e) => {
        const modal = document.getElementById("leadersModal");
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
});




