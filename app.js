// -----------------------------------------------------
// Pitcher Analyzer - app.js
// Backend-only, no CSV preload
// -----------------------------------------------------

// -------------------------------
// Display League Averages XP + Overall Score
// -------------------------------

// =====================================================
// ALL ACCESS - TEST MODE
// =====================================================

// true  = simulate Free Trial
// false = simulate All Access

const TEST_FREE_MODE = false;

function hasAllAccess() {
    return !TEST_FREE_MODE;
}

function requireAllAccess(featureName) {
    if (hasAllAccess()) {
        return true;
    }

    alert(
        `${featureName} is available with TimBaseball All Access.`
    );

    return false;
}

function updateAccessUI() {

    const allAccess = hasAllAccess();


// ------------------------------
// Premium Buttons
// ------------------------------

const premiumButtons = [
    document.getElementById("trendBtn"),
    document.getElementById("compareBtn"),
    document.getElementById("leadersBtn")
];

premiumButtons.forEach(button => {

    if (!button) return;

    if (allAccess) {
        button.classList.remove("premium-locked");
    } else {
        button.classList.add("premium-locked");
    }
});


    // -------------------------------
    // Overall Percentile
    // -------------------------------

    const percentileEl =
        document.getElementById("overallPercentile");

    if (percentileEl && !allAccess) {

        percentileEl.innerHTML = `
            <div class="percentile-premium-wrap">
                <span class="percentile-premium-lock">🔒</span>
                <span class="percentile-premium-label">
                    ALL ACCESS
                </span>
            </div>
        `;
    }


    // -------------------------------
    // What to Watch
    // -------------------------------

    const watchGrid =
        document.getElementById("watchGrid");

    if (watchGrid && !allAccess) {

        watchGrid.innerHTML = `
            <div class="watch-premium-lock">

                <div class="watch-premium-icon">
                    🔒
                </div>

                <div class="watch-premium-badge">
                    ALL ACCESS
                </div>

                <div class="watch-premium-text">
                    Unlock What to Watch Analysis
                </div>

            </div>
        `;
    }


    // -------------------------------
    // Fantasy Edge
    // -------------------------------

    const fantasyPremiumLock =
        document.getElementById("fantasyPremiumLock");

    const fantasyPremiumContent =
        document.getElementById("fantasyPremiumContent");

    if (fantasyPremiumLock && fantasyPremiumContent) {

        if (allAccess) {

            fantasyPremiumLock.hidden = true;
            fantasyPremiumContent.hidden = false;

        } else {

            fantasyPremiumLock.hidden = false;
            fantasyPremiumContent.hidden = true;
        }
    }
}

const season = 2026;
loadPlayerOfDay(season);

// -------------------------------
// Safe helpers
// -------------------------------
function safeFixed(value, digits = 1) {
    return (value != null && !isNaN(value))
        ? Number(value).toFixed(digits)
        : "--";
}

function safeScore(value) {
    return (value != null && !isNaN(value))
        ? Number(value)
        : 0;
}

function clearLeaderState() {
    document.getElementById("overallScore").textContent = "--";
    document.getElementById("overallTier").innerHTML = "";
    document.getElementById("scoutingNote").innerHTML = "";
}

window.addEventListener("DOMContentLoaded", clearLeaderState);

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
    x = x.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    x = x.replace(/[,*#†+]/g, "");
    x = x.replace(/\./g, "");
    x = x.replace(/\s+/g, " ").trim();

    if (x.includes(",")) {
        const [last, first] = x.split(",").map(s => s.trim());
        x = `${first} ${last}`;
    }

    return x.toUpperCase();
}

// --------------------------------------
// MLB Team Color Map
// --------------------------------------

const teamColors = {
    ARI: ["#A71930", "#000000"],
    ATH: ["#003831", "#EFB21E"],
    ATL: ["#CE1141", "#13274F"],
    BAL: ["#DF4601", "#000000"],
    BOS: ["#BD3039", "#0C2340"],

    CHC: ["#0E3386", "#CC3433"],
    CWS: ["#000000", "#C4CED4"],
    CIN: ["#C6011F", "#000000"],
    CLE: ["#E31937", "#0C2340"],
    COL: ["#33006F", "#C4CED4"],

    DET: ["#0C2340", "#FFFFFF"],
    HOU: ["#002D62", "#EB6E1F"],
    KCR:  ["#004687", "#BD9B60"],
    LAA: ["#BA0021", "#003263"],
    LAD: ["#FFFFFF", "#005A9C"],

    MIA: ["#00A3E0", "#000000"],
    MIL: ["#12284B", "#FFC52F"],
    MIN: ["#002B5C", "#D31145"],
    NYM: ["#002D72", "#FF5910"],
    NYY: ["#0C2340", "#FFFFFF"],

    PHI: ["#E81828", "#002D72"],
    PIT: ["#000000", "#FDB827"],
    SDP:  ["#4A2C1B", "#FFC425"],
    SFG:  ["#FD5A1E", "#000000"],
    SEA: ["#0C2C56", "#005C5C"],

    STL: ["#FFFFFF", "#C41E3A"],
    TBR:  ["#092C5C", "#8FBCE6"],
    TEX: ["#003278", "#C0111F"],
    TOR: ["#134A8E", "#6BAED6"],
    WSN: ["#AB0003", "#14225A"]
};


// --------------------------------------
// Update Team Color Panel
// --------------------------------------

function updateTeamColorPanel(team) {

    const panel = document.getElementById("teamColorPanel");

    if (!panel) return;

    const primary =
        panel.querySelector(".team-color-primary");

    const secondary =
        panel.querySelector(".team-color-secondary");

    if (!primary || !secondary) return;

    const teamCode =
        String(team || "")
            .trim()
            .toUpperCase();

    const colors = teamColors[teamCode];

    // Neutral fallback
    if (!colors) {
        primary.style.backgroundColor = "#d9dee5";
        secondary.style.backgroundColor = "#eef1f4";
        return;
    }

    primary.style.backgroundColor = colors[0];
    secondary.style.backgroundColor = colors[1];
}


// --------------------------------------
// Reset Team Color Panel
// --------------------------------------

function resetTeamColorPanel() {

    const panel = document.getElementById("teamColorPanel");

    if (!panel) return;

    const primary =
        panel.querySelector(".team-color-primary");

    const secondary =
        panel.querySelector(".team-color-secondary");

    if (primary) {
        primary.style.backgroundColor = "#d9dee5";
    }

    if (secondary) {
        secondary.style.backgroundColor = "#eef1f4";
    }
}

// -------------------------------
// Team Display Helpers
// -------------------------------
function formatTeamDisplay(team) {
    const code = String(team || "").trim().toUpperCase();

    // Standard single-team code
    if (teamColors[code]) {
        return code;
    }

    // Multi-team Stathead code
    const teams = Object.keys(teamColors);
    const matches = [];

    let remaining = code;

    while (remaining.length > 0) {
        const match = teams.find(team =>
            remaining.startsWith(team)
        );

        if (!match) {
            return code;
        }

        matches.push(match);
        remaining = remaining.slice(match.length);
    }

    return matches.join("/");
}

function getTeamColorCode(team) {
    const display = formatTeamDisplay(team);

    if (!display.includes("/")) {
        return display;
    }

    const teams = display.split("/");

    // Last team = most recent/current team
    return teams[teams.length - 1];
}

// -------------------------------
// Similar Profiles
// -------------------------------
function updateSimilarProfiles(profiles) {

    const container =
        document.getElementById("similarProfiles");

    if (!container) return;

    if (!Array.isArray(profiles) || profiles.length === 0) {
        resetSimilarProfiles();
        return;
    }

    const topThree = profiles.slice(0, 3);

    container.innerHTML = topThree.map(profile => {

        const rawTeam =
    String(profile.Team || "")
        .trim()
        .toUpperCase();

const displayTeam =
    formatTeamDisplay(rawTeam);

const colorTeam =
    getTeamColorCode(rawTeam);

const colors =
    teamColors[colorTeam] || ["#d9dee5", "#eef1f4"];

        const overall =
            Number(profile.Overall);

        const xp =
            Number(profile.XP);

        return `
            <div class="similar-profile-card">

                <div class="similar-profile-name-row">

                    <span class="similar-profile-colors">
                        <span style="background:${colors[0]}"></span>
                        <span style="background:${colors[1]}"></span>
                    </span>

                    <div>
                        <div class="similar-profile-name">
                            ${profile.Player}
                        </div>

                        <div class="similar-profile-team">
                            ${displayTeam}
                        </div>
                    </div>

                </div>

                <div class="similar-profile-stats">

                    <div class="similar-profile-stat">
                        OVERALL
                        <strong>${overall.toFixed(1)}</strong>
                    </div>

                    <div class="similar-profile-stat">
                        XP
                        <strong>${Math.round(xp)}</strong>
                    </div>

                </div>

            </div>
        `;

    }).join("");
}

function resetSimilarProfiles() {

    const container =
        document.getElementById("similarProfiles");

    if (!container) return;

    container.innerHTML = `
        <div class="similar-profile-card placeholder"></div>
        <div class="similar-profile-card placeholder"></div>
        <div class="similar-profile-card placeholder"></div>
    `;
}


// -------------------------------
// Utility: Fetch pitcher data
// -------------------------------
async function loadPitcher(name, season, silent = false) {
    const clean = normalizeNameFrontend(name);

    const url = `https://pitcher-analyzer-backend.onrender.com/api/pitchers?name=${encodeURIComponent(clean)}&season=${season}`;
    const res = await fetch(url);

    if (!res.ok) {
        console.error("Pitcher fetch failed", await res.text());
        return null;
    }

    const data = await res.json();
    const arr = Array.isArray(data) ? data : [data];


// Similar Profiles
if (!silent && arr.length > 0) {
    updateSimilarProfiles(arr[0].SimilarProfiles);
}


    // ⭐ Only update tab if NOT silent
    if (!silent && arr.length > 0) {
        const rawName = arr[0].Name || clean;
        const playerName = toTitleCase(rawName);
const team = arr[0].Team || "";
const displayTeam = formatTeamDisplay(team);
const colorTeam = getTeamColorCode(team);

document.getElementById("playerTab").textContent =
    `${playerName}${displayTeam ? " | " + displayTeam : ""} (${season})`;

updateTeamColorPanel(colorTeam);
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
    if (score < 3) {
        color = "#d50000";
    } else if (score < 5.5) {
        color = "#ff9800";
    } else if (score < 7.5) {
        color = "#ffb400";
    } else {
        color = "#00c853";
    }

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
// Individual metric wrappers (5‑metric model)
// -------------------------------
function updateERA(raw, score)     { updateMetric("raw-era",  "battery-era",  "score-era",  raw, score); }
function updateWHIP(raw, score)    { updateMetric("raw-whip", "battery-whip", "score-whip", raw, score); }
function updateKpct(raw, score)    { updateMetric("raw-kpct", "battery-kpct", "score-kpct", raw, score); }
function updateBBpct(raw, score)   { updateMetric("raw-bbpct","battery-bbpct","score-bbpct",raw, score); }
function updateKBB(raw, score)     { updateMetric("raw-kbb",  "battery-kbb",  "score-kbb",  raw, score); }



// -------------------------------
// Overall score + XP + tier
// -------------------------------
function updateOverall(score) {

    const numericScore = safeScore(score);

    document.getElementById("overallScore").textContent =
        safeFixed(score, 1);

    updateBattery(
        "battery-overall",
        numericScore
    );

    // Overall gauge: 0–10 → 0–100%
    const overallPercent = Math.max(
        0,
        Math.min(
            100,
            (numericScore / 10) * 100
        )
    );

    // Keep a tiny visible fill at the bottom of the scale
    const overallVisualFill =
        Math.max(3, overallPercent);

    const overallMeter =
        document.getElementById("overallMeter");

    if (overallMeter) {
        overallMeter.style.width =
            `${overallVisualFill}%`;
    }
}


function updateXP(xp) {

    document.getElementById("xpScore").textContent =
        safeFixed(xp, 0);

    const numericXP = Number(xp);

    // Pitcher XP display gauge:
    // 900  = 0%
    // 950  = 25%
    // 1000 = 50%
    // 1050 = 75%
    // 1100 = 100%

    const xpMin = 900;
    const xpMax = 1100;

    const xpPercent = Math.max(
        0,
        Math.min(
            100,
            ((numericXP - xpMin) / (xpMax - xpMin)) * 100
        )
    );

    // Keep a tiny visible fill at the bottom of the scale
    const xpVisualFill =
        Math.max(3, xpPercent);

    const xpMeter =
        document.getElementById("xpMeter");

    if (xpMeter) {
        xpMeter.style.width =
            `${xpVisualFill}%`;
    }
}


function getTierClass(tier) {
    switch (tier) {
        case "Ace": return "tier-great";
        case "Top Starter": return "tier-good";
        case "Mid Rotation": return "tier-fair";
        case "Back End": return "tier-average";
        case "Depth": return "tier-belowavg";
        default: return "";
    }
}

function updateTier(score) {
    let tier = "—";

    if (score >= 8.5) tier = "Ace";
    else if (score >= 7.0) tier = "Top Starter";
    else if (score >= 5.5) tier = "Mid Rotation";
    else if (score >= 4.0) tier = "Back End";
    else tier = "Depth";

    document.getElementById("overallTier").innerHTML =
        `<span class="tier-badge ${getTierClass(tier)}">${tier}</span>`;
}

// -------------------------------
// Pitcher Archetype
// -------------------------------
function updatePitcherArchetype(p) {

    const archetypeEl =
        document.getElementById("pitcherArchetype");

    const matchEl =
        document.getElementById("pitcherArchetypeMatch");

    if (!archetypeEl || !matchEl) return;

    archetypeEl.textContent =
        p?.Archetype || "--";

    matchEl.textContent =
        p?.ArchetypeMatch || "--";
}

// -------------------------------
// Scouting note generator (5‑metric model)
// -------------------------------
function updateScoutingNote(p) {
    const strengths = [];
    const concerns = [];

    // K%
    if (p.Kpct > 28) strengths.push("impact swing‑and‑miss");
    else if (p.Kpct > 24) strengths.push("above‑average bat‑missing ability");
    else if (p.Kpct < 20) concerns.push("below‑average bat‑missing ability");

    // WHIP
    if (p.WHIP < 1.10) strengths.push("premium traffic control");
    else if (p.WHIP < 1.20) strengths.push("manageable baserunner profile");
    else if (p.WHIP > 1.30) concerns.push("inconsistent command leading to traffic");

    // K/BB
    if (p.KBB > 4) strengths.push("efficient strike‑throwing");
    else if (p.KBB > 3) strengths.push("workable command");
    else if (p.KBB < 2) concerns.push("erratic strike‑throwing");

    // BB%
    if (p.BBpct < 5) strengths.push("plus walk suppression");
    else if (p.BBpct < 7) strengths.push("solid underlying command");
    else if (p.BBpct > 9) concerns.push("elevated walk rate that may limit consistency");
    else if (p.BBpct > 11) concerns.push("high‑risk command profile with frequent free passes");

    let note = "";

    // NEW: neutral fallback
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

    // W–L context stays
    if (p.W !== undefined && p.L !== undefined) {
        const wl = `${p.W}-${p.L}`;
        note += `\nW–L this season: ${wl}.`;
    }

    document.getElementById("scoutingNote").innerHTML = note;
}

// -------------------------------
// Pitcher XP Score Function
// Strikeout / Command Performance
// -------------------------------
function computePitcherXP(p) {
    if (!p) return null;

    const xp =
        (p.Kpct * 4) +
        (p.KBB * 2) -
        (p.BBpct * 10);

    return xp + 1000;
}



// -------------------------------
// Weighted Overall Score (5‑metric model)
// -------------------------------
function computeWeightedOverall({
    eraScore,
    whipScore,
    kpctScore,
    bbpctScore,
    kbbScore
}) {
    return (
        eraScore  * 0.25 +
        whipScore * 0.25 +
        kpctScore * 0.1875 +
        bbpctScore* 0.125 +
        kbbScore  * 0.1875
    );
}

function clamp(x, min, max) {
    return Math.max(min, Math.min(max, x));
}

// ------------------------------
// Scoring functions (5‑metric model)
// ------------------------------
function scoreERA(era) {
    const score = 10 * (5.00 - era) / (5.00 - 2.00);
    return clamp(score, 0, 10);
}

function scoreWHIP(whip) {
    const score = 10 * (1.40 - whip) / (1.40 - 0.90);
    return clamp(score, 0, 10);
}

function scoreKpct(kpct) {
    const score = 10 * (kpct - 15) / (35 - 15);
    return clamp(score, 0, 10);
}

function scoreBBpct(bbpct) {
    const score = 10 * (10 - bbpct) / (10 - 3);
    return clamp(score, 0, 10);
}

function scoreKBB(kbb) {
    const score = 10 * (kbb - 1.5) / (6.0 - 1.5);
    return clamp(score, 0, 10);
}

// ⭐ Removed (no longer part of the model):
// function scoreIP(ip) { ... }
// function scoreHR9(hr9) { ... }
// function scoreFIP(fip) { ... }

// ------------------------------
// Player Autocomplete
// ------------------------------

const autocompleteCache = {};

function setupPlayerAutocomplete({
    inputId,
    dropdownId,
    seasonId
}) {

    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    const seasonSelect = document.getElementById(seasonId);

    if (!input || !dropdown || !seasonSelect) return;


    // ------------------------------
    // Load Player List
    // ------------------------------
    async function getPlayers() {

        const season = seasonSelect.value;

        // Use cached season list
        if (autocompleteCache[season]) {
            return autocompleteCache[season];
        }

        try {

            const response = await fetch(
                `https://pitcher-analyzer-backend.onrender.com/api/players?season=${season}`
            );

            if (!response.ok) {
                throw new Error("Unable to load player list.");
            }

            const players = await response.json();

            autocompleteCache[season] = players;

            return players;

        } catch (error) {

            console.error("Autocomplete player load failed:", error);

            return [];
        }
    }


    // ------------------------------
    // Render Dropdown
    // ------------------------------
    async function renderAutocomplete() {

        const players = await getPlayers();

        const search = input.value
            .trim()
            .toLowerCase();

        const matches = players.filter(player => {

            const name = (player.Player || "").toLowerCase();
            const team = (player.Team || "").toLowerCase();

            return (
                !search ||
                name.includes(search) ||
                team.includes(search)
            );
        });

        dropdown.innerHTML = "";

        matches.forEach(player => {

            const row = document.createElement("div");

            row.className = "player-autocomplete-row";

            row.innerHTML = `
                <span class="autocomplete-player-name">
                    ${player.Player}
                </span>

                <span class="autocomplete-player-team">
                    ${player.Team || ""}
                </span>
            `;

            row.addEventListener("click", () => {

                input.value = player.Player;

                dropdown.hidden = true;
            });

            dropdown.appendChild(row);
        });

        dropdown.hidden = matches.length === 0;
    }


    // ------------------------------
    // Open on Focus
    // ------------------------------
    input.addEventListener("focus", () => {

        renderAutocomplete();
    });


    // ------------------------------
    // Filter While Typing
    // ------------------------------
    input.addEventListener("input", () => {

        renderAutocomplete();
    });


    // ------------------------------
    // Season Changed
    // ------------------------------
    seasonSelect.addEventListener("change", () => {

        dropdown.hidden = true;

        // No need to destroy cache.
        // New season automatically uses its own list.
    });


    // ------------------------------
    // Close When Clicking Elsewhere
    // ------------------------------
    document.addEventListener("click", event => {

        if (!event.target.closest(".autocomplete-wrap")) {
            dropdown.hidden = true;
        }
    });
}


// ------------------------------
// Player 1
// ------------------------------
setupPlayerAutocomplete({
    inputId: "playerName",
    dropdownId: "playerAutocomplete",
    seasonId: "seasonSelect"
});


// ------------------------------
// Player 2
// ------------------------------
setupPlayerAutocomplete({
    inputId: "playerName2",
    dropdownId: "playerAutocomplete2",
    seasonId: "seasonSelect2"
});

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

        const data = await loadPitcher(name, season);

        // ⭐ Correct error handling
        if (!data || data.error || (Array.isArray(data) && data.length === 0)) {
            alert("Pitcher not found.");
            return;
        }


        // ⭐ Always normalize to object
        const p = Array.isArray(data) ? data[0] : data;

        console.log("FULL pitcher object from backend:", p);
        console.log("XP field:", p?.XP);
        console.log("MLB ID:", p?.mlbId);

        // -------------------------------
        // Player Headshot + Similar Profiles
        // -------------------------------
        updatePitcherHeadshot(p.mlbId);
        updateSimilarProfiles(p.SimilarProfiles);


        // ⭐ Only 5 metrics now
const eraScore   = scoreERA(p.ERA);
const whipScore  = scoreWHIP(p.WHIP);
const kpctScore  = scoreKpct(p.Kpct);
const bbpctScore = scoreBBpct(p.BBpct);
const kbbScore   = scoreKBB(p.KBB);

updateERA(safeFixed(p.ERA, 2), eraScore);
updateWHIP(safeFixed(p.WHIP, 2), whipScore);
updateKpct(safeFixed(p.Kpct, 1), kpctScore);
updateBBpct(safeFixed(p.BBpct, 1), bbpctScore);
updateKBB(safeFixed(p.KBB, 2), kbbScore);


// -------------------------------
// Season Production
// -------------------------------
document.getElementById("productionIP").textContent = p.IP ?? "--";
document.getElementById("productionH").textContent = p.H ?? "--";
document.getElementById("productionR").textContent = p.R ?? "--";
document.getElementById("productionER").textContent = p.ER ?? "--";
document.getElementById("productionBB").textContent = p.BB ?? "--";
document.getElementById("productionK").textContent = p.SO ?? "--";
document.getElementById("productionHR").textContent = p.HR ?? "--";
document.getElementById("productionFIP").textContent = p.FIP ?? "--";


const overall = computeWeightedOverall({
    eraScore,
    whipScore,
    kpctScore,
    bbpctScore,
    kbbScore
});

        updateOverall(overall);
updateTier(overall);
updateScoutingNote(p);
updatePitcherArchetype(p);
updateXP(p.XP);
updateIdentityBadge();

updateWhatToWatch({
    ERA: { raw: p.ERA, score: eraScore },
    WHIP: { raw: p.WHIP, score: whipScore },
    Kpct: { raw: p.Kpct, score: kpctScore },
    BBpct: { raw: p.BBpct, score: bbpctScore },
    KBB: { raw: p.KBB, score: kbbScore }
});

// -------------------------------
// What to Watch
// -------------------------------
function updateWhatToWatch(metrics) {

    const watchGrid = document.getElementById("watchGrid");

    if (!watchGrid) return;

// -------------------------------
// All Access Gate
// -------------------------------

if (!hasAllAccess()) {

    watchGrid.innerHTML = `
        <div class="watch-premium-lock">
            <div class="watch-premium-icon">🔒</div>
            <div class="watch-premium-badge">ALL ACCESS</div>
            <div class="watch-premium-text">
                Unlock What to Watch Analysis
            </div>
        </div>
    `;

    return;
}

    const items = [

        {
            key: "ERA",
            title: "Run Prevention",
            raw: metrics.ERA.raw,
            score: metrics.ERA.score,

            goodText:
                "Strong run prevention is a major strength.",

            neutralText:
                "Run prevention is solid but not a defining strength.",

            badText:
                "Elevated run production allowed may limit overall effectiveness."
        },

        {
            key: "WHIP",
            title: "Traffic Control",
            raw: metrics.WHIP.raw,
            score: metrics.WHIP.score,

            goodText:
                "Strong WHIP reflects excellent control of baserunners.",

            neutralText:
                "Baserunner traffic is manageable but worth monitoring.",

            badText:
                "Elevated baserunner traffic creates additional pressure and scoring risk."
        },

        {
            key: "Kpct",
            title: "Strikeout Ability",
            raw: metrics.Kpct.raw,
            score: metrics.Kpct.score,

            goodText:
                "Strong strikeout production creates consistent swing-and-miss value.",

            neutralText:
                "Strikeout production is solid but not a defining strength.",

            badText:
                "Limited strikeout production reduces the ability to generate outs independently."
        },

        {
            key: "BBpct",
            title: "Command",
            raw: metrics.BBpct.raw,
            score: metrics.BBpct.score,

            goodText:
                "Low walk rate reflects strong command and limits free baserunners.",

            neutralText:
                "Walk rate is manageable but remains worth monitoring.",

            badText:
                "Elevated walk rate may create unnecessary baserunners and innings stress."
        },

        {
            key: "KBB",
            title: "Strikeout-to-Walk Control",
            raw: metrics.KBB.raw,
            score: metrics.KBB.score,

            goodText:
                "Strong strikeout-to-walk balance reflects efficient pitcher control.",

            neutralText:
                "Strikeout-to-walk balance is solid but not a defining strength.",

            badText:
                "Weak strikeout-to-walk balance may reduce overall pitching efficiency."
        }

    ];


// --------------------------------
// Classify each metric
// --------------------------------
items.forEach(item => {

    if (item.score >= 7) {

        item.type = "good";
        item.icon = "↑";
        item.text = item.goodText;

        item.importance = (item.score - 7) / 3;

    }
    else if (item.score >= 4) {

        item.type = "neutral";
        item.icon = "−";
        item.text = item.neutralText;

        item.importance = 0;

    }
    else {

        item.type = "bad";
        item.icon = "↓";
        item.text = item.badText;

        item.importance = (4 - item.score) / 4;

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

    if (item.key === "ERA") {
        rawDisplay = Number(item.raw).toFixed(2);
    }
    else if (item.key === "WHIP") {
        rawDisplay = Number(item.raw).toFixed(2);
    }
    else if (item.key === "KBB") {
        rawDisplay = Number(item.raw).toFixed(2);
    }
    else {
        rawDisplay = Number(item.raw).toFixed(1) + "%";
    }

    const statLabel = {
        ERA: "ERA",
        WHIP: "WHIP",
        Kpct: "K%",
        BBpct: "BB%",
        KBB: "K/BB"
    }[item.key];

    const statusLabel = {
        good: "STRENGTH",
        neutral: "MONITOR",
        bad: "CONCERN"
    }[item.type];

    return `
        <div class="watch-card watch-${item.type}">

            <div class="watch-card-top">

                <div class="watch-icon">
                    ${item.icon}
                </div>

                <div class="watch-status">
                    ${statusLabel}
                </div>

            </div>

            <div class="watch-content">

                <div class="watch-title">
                    ${item.title}
                </div>

                <div class="watch-text">
                    ${item.text}
                </div>

            </div>

            <div class="watch-evidence">

                <div class="watch-stat">
                    <span class="watch-stat-label">
                        ${statLabel}
                    </span>

                    <strong class="watch-stat-value">
                        ${rawDisplay}
                    </strong>
                </div>

                <div class="watch-divider"></div>

                <div class="watch-stat">
                    <span class="watch-stat-label">
                        SCORE
                    </span>

                    <strong class="watch-score">
                        ${item.score.toFixed(1)}
                        <small>/ 10</small>
                    </strong>
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
const div = calculatePitcherDivergence(p.XP, overall);
const state = pitcherDivergenceState(div.divergencePct);

updateFantasyStateMarker(state);

updateStateBadge(state);

// -------------------------------
// Fantasy Value
// -------------------------------
const fantasyValue = getFantasyValue(
    p.OverallDivergence,
    p.OverallDivergenceSD
);

const fantasyValueZ =
    p.OverallDivergenceSD && p.OverallDivergenceSD !== 0
        ? p.OverallDivergence / p.OverallDivergenceSD
        : 0;

updateValueBadge(fantasyValue);

updateFantasyValueMarker(fantasyValue);

// -------------------------------
// Fantasy Summary
// -------------------------------
updateFantasySummary(
    identity,
    state,
    fantasyValue
);

// -------------------------------
// Overall Percentile
// -------------------------------

const percentileEl =
    document.getElementById("overallPercentile");

if (!hasAllAccess()) {

    percentileEl.innerHTML = `
        <div class="percentile-premium-wrap">
            <span class="percentile-premium-lock">🔒</span>
            <span class="percentile-premium-label">ALL ACCESS</span>
        </div>
    `;

} else {

    percentileEl.textContent =
        p.Overall_pct !== undefined
            ? toOrdinal(Math.round(p.Overall_pct))
            : "--";
}

    } catch (err) {
        console.error("Error loading player:", err);
    }
}


// -------------------------------
// Load Player of the Day - Ticker
// -------------------------------
function loadPlayerOfDay(season) {
    fetch(`https://pitcher-analyzer-backend.onrender.com/api/player-of-day?season=${season}`)
        .then(res => res.json())
        .then(player => {

            console.log("Player of the Day JSON:", player);

            document.getElementById("pod-name").textContent = player.Player;
            document.getElementById("pod-team").textContent = player.Team;

            document.getElementById("pod-overall").textContent =
                Number(player.overall).toFixed(1);

            document.getElementById("pod-xp").textContent =
                Math.round(player.XP);

            // NEW: W/L + Games
            const recordText = `is ${player.W}-${player.L} across ${player.G} games.`;
            document.getElementById("pod-record").textContent = recordText;
        })
        .catch(err => {
            console.error("Error loading Player of the Day:", err);
        });
}

// -------------------------------
// Trend Handler (Season Comparison)
// -------------------------------
async function handleTrend() {

    try {

        const rawName =
            document.getElementById("playerName")
                .value
                .trim();

        if (!rawName) {
            alert("Enter a player name first.");
            return;
        }


        const season =
            Number(
                document.getElementById("seasonSelect").value
            );

        const lastSeason =
            season - 1;


        // ---------------------------------
        // Fetch both seasons
        // ---------------------------------

        const currArr = await fetch(
            `https://pitcher-analyzer-backend.onrender.com/api/pitchers?name=${encodeURIComponent(rawName)}&season=${season}`
        ).then(r => r.json());


        const prevArr = await fetch(
            `https://pitcher-analyzer-backend.onrender.com/api/pitchers?name=${encodeURIComponent(rawName)}&season=${lastSeason}`
        ).then(r => r.json());


        const curr =
            Array.isArray(currArr)
                ? currArr[0]
                : currArr;

        const prev =
            Array.isArray(prevArr)
                ? prevArr[0]
                : prevArr;


        // ---------------------------------
        // Validate Data
        // ---------------------------------

        if (
            !curr ||
            curr.error ||
            !prev ||
            prev.error
        ) {
            alert("Not enough data for season comparison.");
            return;
        }


        if (
            curr.ERA == null ||
            prev.ERA == null
        ) {
            alert("Not enough data for season comparison.");
            return;
        }


        // ---------------------------------
        // Helpers
        // ---------------------------------

        function setText(id, value) {

            const el =
                document.getElementById(id);

            if (!el) return;

            el.textContent =
                value ?? "--";
        }


        function setTrendMeter(
            scoreId,
            meterId,
            value
        ) {

            const scoreEl =
                document.getElementById(scoreId);

            const meterEl =
                document.getElementById(meterId);

            const score =
                Number(value);


            if (!Number.isFinite(score)) {

                if (scoreEl) {
                    scoreEl.textContent = "--";
                }

                if (meterEl) {
                    meterEl.style.width = "0%";
                }

                return;
            }


            if (scoreEl) {
                scoreEl.textContent =
                    score.toFixed(1);
            }


            if (meterEl) {

                const clamped =
                    Math.max(
                        0,
                        Math.min(10, score)
                    );

                meterEl.style.width =
                    `${clamped * 10}%`;
            }
        }


        function formatOverall(value) {

            const n = Number(value);

            return Number.isFinite(n)
                ? n.toFixed(1)
                : "--";
        }


        function formatXP(value) {

            const n = Number(value);

            return Number.isFinite(n)
                ? Math.round(n)
                : "--";
        }


        // ---------------------------------
        // Player Identity
        // ---------------------------------

        setText(
            "trendPlayerName",
            curr.Player || curr.Name || rawName
        );

        setText(
            "trendPlayerTeam",
            curr.Team || curr.Tm || "--"
        );


        // ---------------------------------
        // Season Headers
        // ---------------------------------

        setText(
            "trendSeason1",
            lastSeason
        );

        setText(
            "trendSeason2",
            season
        );


        // ---------------------------------
        // Summary Metrics
        //
        // Prior season = 1
        // Current season = 2
        // ---------------------------------

        setText(
            "trendOverall1",
            formatOverall(prev.Overall)
        );

        setText(
            "trendOverall2",
            formatOverall(curr.Overall)
        );


        setText(
            "trendXP1",
            formatXP(prev.XP)
        );

        setText(
            "trendXP2",
            formatXP(curr.XP)
        );


        setText(
            "trendTier1",
            getPitcherTier(
                Number(prev.Overall)
            )
        );

        setText(
            "trendTier2",
            getPitcherTier(
                Number(curr.Overall)
            )
        );


        // ---------------------------------
        // Raw Profile Stats
        // ---------------------------------

        // ERA
        setText(
            "trendERARaw1",
            Number(prev.ERA).toFixed(2)
        );

        setText(
            "trendERARaw2",
            Number(curr.ERA).toFixed(2)
        );


        // WHIP
        setText(
            "trendWHIPRaw1",
            Number(prev.WHIP).toFixed(2)
        );

        setText(
            "trendWHIPRaw2",
            Number(curr.WHIP).toFixed(2)
        );


        // K%
        setText(
            "trendKRaw1",
            `${Number(prev.Kpct).toFixed(1)}%`
        );

        setText(
            "trendKRaw2",
            `${Number(curr.Kpct).toFixed(1)}%`
        );


        // BB%
        setText(
            "trendBBRaw1",
            `${Number(prev.BBpct).toFixed(1)}%`
        );

        setText(
            "trendBBRaw2",
            `${Number(curr.BBpct).toFixed(1)}%`
        );


        // K/BB
        setText(
            "trendKBBRaw1",
            Number(prev.KBB).toFixed(1)
        );

        setText(
            "trendKBBRaw2",
            Number(curr.KBB).toFixed(1)
        );


        // ---------------------------------
        // Archetype
        // ---------------------------------

        setText(
            "trendArchetype1",
            prev.Archetype || "--"
        );

        setText(
            "trendArchetype2",
            curr.Archetype || "--"
        );


        setText(
            "trendMatch1",
            prev.ArchetypeMatch || "--"
        );

        setText(
            "trendMatch2",
            curr.ArchetypeMatch || "--"
        );


        // ---------------------------------
        // Profile Shape
        // ---------------------------------

        setTrendMeter(
            "trendERAScore1",
            "trendERAMeter1",
            prev.ERA_score
        );

        setTrendMeter(
            "trendERAScore2",
            "trendERAMeter2",
            curr.ERA_score
        );


        setTrendMeter(
            "trendWHIPScore1",
            "trendWHIPMeter1",
            prev.WHIP_score
        );

        setTrendMeter(
            "trendWHIPScore2",
            "trendWHIPMeter2",
            curr.WHIP_score
        );


        setTrendMeter(
            "trendKScore1",
            "trendKMeter1",
            prev.Kpct_score
        );

        setTrendMeter(
            "trendKScore2",
            "trendKMeter2",
            curr.Kpct_score
        );


        setTrendMeter(
            "trendBBScore1",
            "trendBBMeter1",
            prev.BBpct_score
        );

        setTrendMeter(
            "trendBBScore2",
            "trendBBMeter2",
            curr.BBpct_score
        );


        setTrendMeter(
            "trendKBBScore1",
            "trendKBBMeter1",
            prev.KBB_score
        );

        setTrendMeter(
            "trendKBBScore2",
            "trendKBBMeter2",
            curr.KBB_score
        );


        // ---------------------------------
        // Trend Analysis
        // ---------------------------------

        const trendAnalysis =
            generatePitcherTrendAnalysis(
                curr,
                prev
            );

        setText(
            "trendAnalysisText",
            trendAnalysis
        );


        // ---------------------------------
        // Modal Title
        // ---------------------------------

        document.getElementById(
            "trendTitle"
        ).textContent =
            `Pitcher Trend (${lastSeason} → ${season})`;


        // ---------------------------------
        // Open Modal
        // ---------------------------------

        document.getElementById(
            "trendModal"
        ).style.display = "flex";


    }
    catch (err) {

        console.error(
            "Trend error:",
            err
        );
    }
}

// -------------------------------
// Pitcher Trend Analysis
// Raw Direction + Normalized Magnitude
// -------------------------------
function generatePitcherTrendAnalysis(curr, prev) {

    // ---------------------------------
    // 1. Raw metric direction
    //
    // IMPORTANT:
    // Raw stats determine whether a
    // skill actually improved/declined.
    // ---------------------------------
    const rawDirections = {

        // Lower ERA is better
        ERA:
            Number(curr.ERA) < Number(prev.ERA) ? 1 :
            Number(curr.ERA) > Number(prev.ERA) ? -1 : 0,

        // Lower WHIP is better
        WHIP:
            Number(curr.WHIP) < Number(prev.WHIP) ? 1 :
            Number(curr.WHIP) > Number(prev.WHIP) ? -1 : 0,

        // Higher K% is better
        Kpct:
            Number(curr.Kpct) > Number(prev.Kpct) ? 1 :
            Number(curr.Kpct) < Number(prev.Kpct) ? -1 : 0,

        // Lower BB% is better
        BBpct:
            Number(curr.BBpct) < Number(prev.BBpct) ? 1 :
            Number(curr.BBpct) > Number(prev.BBpct) ? -1 : 0,

        // Higher K/BB is better
        KBB:
            Number(curr.KBB) > Number(prev.KBB) ? 1 :
            Number(curr.KBB) < Number(prev.KBB) ? -1 : 0
    };


    // ---------------------------------
    // 2. TiM profile-score movement
    //
    // Use the normalized coordinates
    // already calculated by the backend.
    // ---------------------------------
    const scoreChanges = {

        ERA:
            Number(curr.ERA_score) -
            Number(prev.ERA_score),

        WHIP:
            Number(curr.WHIP_score) -
            Number(prev.WHIP_score),

        Kpct:
            Number(curr.Kpct_score) -
            Number(prev.Kpct_score),

        BBpct:
            Number(curr.BBpct_score) -
            Number(prev.BBpct_score),

        KBB:
            Number(curr.KBB_score) -
            Number(prev.KBB_score)
    };


    // ---------------------------------
    // 3. Overall magnitude
    //
    // Mean absolute movement across
    // five normalized metric scores.
    // ---------------------------------
    const magnitude =
        Object.values(scoreChanges)
            .reduce(
                (sum, value) =>
                    sum + Math.abs(value),
                0
            ) / 5;


    // ---------------------------------
    // 4. Net Overall direction
    // ---------------------------------
    const overallDiff =
        Number(curr.Overall) -
        Number(prev.Overall);

    let direction;

    if (overallDiff > 0.05) {
        direction = "improvement";
    }
    else if (overallDiff < -0.05) {
        direction = "decline";
    }
    else {
        direction = "stable";
    }


    // ---------------------------------
    // 5. Magnitude helper
    //
    // Initial calibration thresholds
    // ---------------------------------
    function movementLevel(change) {

        const amount =
            Math.abs(change);

        if (amount < 0.75) {
            return "limited";
        }
        else if (amount < 1.50) {
            return "moderate";
        }
        else {
            return "significant";
        }
    }


    const magnitudeLabel =
        movementLevel(magnitude);


    // ---------------------------------
    // 6. Skill Direction / Breadth
    //
    // Uses RAW metric direction.
    // This prevents score clamps from
    // hiding real statistical movement.
    // ---------------------------------
    const skillDirections =
        Object.values(rawDirections);

    const skillImproved =
        skillDirections
            .filter(value => value > 0)
            .length;

    const skillDeclined =
        skillDirections
            .filter(value => value < 0)
            .length;

    const skillFlat =
        skillDirections
            .filter(value => value === 0)
            .length;


    // At least two underlying skills
    // moved in each direction.
    const mixedProfile =
        skillImproved >= 2 &&
        skillDeclined >= 2;


    // ---------------------------------
    // 7. Breadth
    // ---------------------------------
    let breadthLabel;

    if (
        skillImproved >= 4 ||
        skillDeclined >= 4
    ) {
        breadthLabel = "broad";
    }
    else if (
        skillImproved >= 3 ||
        skillDeclined >= 3
    ) {
        breadthLabel = "general";
    }
    else {
        breadthLabel = "mixed";
    }


    // ---------------------------------
    // 8. Headline
    //
    // Breadth = raw metric direction
    // Magnitude = normalized movement
    // Net result = Overall Score
    // ---------------------------------
    let classification;


    // Mixed underlying skill profile
    // takes priority.
    if (mixedProfile) {

        if (magnitudeLabel === "significant") {
            classification =
                "Mixed year-over-year performance with significant underlying movement.";
        }
        else if (magnitudeLabel === "moderate") {
            classification =
                "Mixed year-over-year performance with moderate underlying movement.";
        }
        else {
            classification =
                "Mixed year-over-year performance with limited overall movement.";
        }
    }


    // Stable net profile
    else if (direction === "stable") {

        if (magnitudeLabel === "significant") {
            classification =
                "Year-over-year performance was relatively stable despite significant underlying movement.";
        }
        else if (magnitudeLabel === "moderate") {
            classification =
                "Year-over-year performance was relatively stable with moderate underlying movement.";
        }
        else {
            classification =
                "Year-over-year performance was relatively stable.";
        }
    }


    // Improvement
    else if (direction === "improvement") {

        if (magnitudeLabel === "significant") {
            classification =
                `${capitalize(breadthLabel)} and significant year-over-year improvement.`;
        }
        else if (magnitudeLabel === "moderate") {
            classification =
                `${capitalize(breadthLabel)} but moderate year-over-year improvement.`;
        }
        else {
            classification =
                `${capitalize(breadthLabel)} but limited year-over-year improvement.`;
        }
    }


    // Decline
    else {

        if (magnitudeLabel === "significant") {
            classification =
                `${capitalize(breadthLabel)} and significant year-over-year decline.`;
        }
        else if (magnitudeLabel === "moderate") {
            classification =
                `${capitalize(breadthLabel)} but moderate year-over-year decline.`;
        }
        else {
            classification =
                `${capitalize(breadthLabel)} but limited year-over-year decline.`;
        }
    }


    const sentences =
        [classification];


    // ---------------------------------
    // Archetype Movement
    // ---------------------------------

    const currArchetype =
        curr.Archetype || null;

    const prevArchetype =
        prev.Archetype || null;

    const currMatch =
        curr.ArchetypeMatch || null;

    const prevMatch =
        prev.ArchetypeMatch || null;


    if (
        currArchetype &&
        prevArchetype &&
        currArchetype !== prevArchetype
    ) {

        sentences.push(
            `The underlying profile shifted from ${prevArchetype} to ${currArchetype}.`
        );
    }

    else if (
        currArchetype &&
        prevArchetype &&
        currArchetype === prevArchetype &&
        currMatch &&
        prevMatch &&
        currMatch !== prevMatch
    ) {

        sentences.push(
            `The profile remained closest to ${currArchetype}, with its archetype match moving from ${prevMatch.toLowerCase()} to ${currMatch.toLowerCase()}.`
        );
    }

    else if (
        currArchetype &&
        prevArchetype &&
        currArchetype === prevArchetype
    ) {

        sentences.push(
            `The profile remained closest to the ${currArchetype} archetype across both seasons.`
        );
    }


    // ---------------------------------
    // 9. Run Prevention
    // ERA + WHIP
    //
    // Raw direction
    // Normalized magnitude
    // ---------------------------------
    const eraDirection =
        rawDirections.ERA;

    const whipDirection =
        rawDirections.WHIP;

    const runPreventionMagnitude =
        (
            Math.abs(scoreChanges.ERA) +
            Math.abs(scoreChanges.WHIP)
        ) / 2;

    const runPreventionLevel =
        movementLevel(
            runPreventionMagnitude
        );


    if (
        eraDirection > 0 &&
        whipDirection > 0
    ) {

        if (runPreventionLevel === "significant") {
            sentences.push(
                "Run prevention improved substantially, with major gains in ERA and WHIP."
            );
        }
        else if (runPreventionLevel === "moderate") {
            sentences.push(
                "Run prevention improved moderately, with gains in ERA and WHIP."
            );
        }
        else {
            sentences.push(
                "Run prevention improved slightly, with modest gains in ERA and WHIP."
            );
        }
    }

    else if (
        eraDirection < 0 &&
        whipDirection < 0
    ) {

        if (runPreventionLevel === "significant") {
            sentences.push(
                "Run prevention declined substantially, with major deterioration in ERA and WHIP."
            );
        }
        else if (runPreventionLevel === "moderate") {
            sentences.push(
                "Run prevention declined moderately, with increases in ERA and WHIP."
            );
        }
        else {
            sentences.push(
                "Run prevention declined slightly, with modest increases in ERA and WHIP."
            );
        }
    }

    else if (
        eraDirection > 0 &&
        whipDirection < 0
    ) {

        sentences.push(
            "Run prevention was mixed, with ERA improving while WHIP declined."
        );
    }

    else if (
        eraDirection < 0 &&
        whipDirection > 0
    ) {

        sentences.push(
            "Run prevention was mixed, with WHIP improving while ERA declined."
        );
    }

    // One raw metric moved while the
    // other remained unchanged.
    else if (eraDirection > 0) {

        sentences.push(
            "Run prevention improved, driven by a lower ERA while WHIP remained stable."
        );
    }

    else if (eraDirection < 0) {

        sentences.push(
            "Run prevention declined, driven by a higher ERA while WHIP remained stable."
        );
    }

    else if (whipDirection > 0) {

        sentences.push(
            "Run prevention improved, driven by a lower WHIP while ERA remained stable."
        );
    }

    else if (whipDirection < 0) {

        sentences.push(
            "Run prevention declined, driven by a higher WHIP while ERA remained stable."
        );
    }


    // ---------------------------------
    // 10. Strikeout Profile
    // K%
    //
    // Raw direction
    // Normalized magnitude
    // ---------------------------------
    const kDirection =
        rawDirections.Kpct;

    const strikeoutLevel =
        movementLevel(
            scoreChanges.Kpct
        );


    if (kDirection > 0) {

        if (strikeoutLevel === "significant") {
            sentences.push(
                "The strikeout profile improved substantially."
            );
        }
        else if (strikeoutLevel === "moderate") {
            sentences.push(
                "The strikeout profile improved moderately."
            );
        }
        else {
            sentences.push(
                "The strikeout profile improved slightly."
            );
        }
    }

    else if (kDirection < 0) {

        if (strikeoutLevel === "significant") {
            sentences.push(
                "The strikeout profile declined substantially."
            );
        }
        else if (strikeoutLevel === "moderate") {
            sentences.push(
                "The strikeout profile declined moderately."
            );
        }
        else {
            sentences.push(
                "The strikeout profile declined slightly."
            );
        }
    }


    // ---------------------------------
    // 11. Command
    // BB% + K/BB
    //
    // Raw direction determines what
    // happened.
    //
    // Normalized score movement
    // determines how large it was.
    // ---------------------------------
    const bbDirection =
        rawDirections.BBpct;

    const kbbDirection =
        rawDirections.KBB;

    const commandMagnitude =
        (
            Math.abs(scoreChanges.BBpct) +
            Math.abs(scoreChanges.KBB)
        ) / 2;

    const commandLevel =
        movementLevel(
            commandMagnitude
        );


    // Both improved
    if (
        bbDirection > 0 &&
        kbbDirection > 0
    ) {

        if (commandLevel === "significant") {
            sentences.push(
                "Command improved substantially, with major gains in walk prevention and K/BB."
            );
        }
        else if (commandLevel === "moderate") {
            sentences.push(
                "Command improved moderately, with a lower BB% and higher K/BB."
            );
        }
        else {
            sentences.push(
                "Command improved slightly, with modest gains in BB% and K/BB."
            );
        }
    }


    // Both declined
    else if (
        bbDirection < 0 &&
        kbbDirection < 0
    ) {

        if (commandLevel === "significant") {
            sentences.push(
                "Command declined substantially, with meaningful deterioration in both walk prevention and K/BB."
            );
        }
        else if (commandLevel === "moderate") {
            sentences.push(
                "Command declined moderately, with a higher BB% and lower K/BB."
            );
        }
        else {
            sentences.push(
                "Command declined slightly, with a higher BB% and lower K/BB."
            );
        }
    }


    // BB% improved, K/BB declined
    else if (
        bbDirection > 0 &&
        kbbDirection < 0
    ) {

        sentences.push(
            "The command profile was mixed, with improved walk prevention offset by a lower K/BB."
        );
    }


    // BB% declined, K/BB improved
    else if (
        bbDirection < 0 &&
        kbbDirection > 0
    ) {

        sentences.push(
            "The command profile was mixed, with a stronger K/BB offset by weaker walk prevention."
        );
    }


    // BB% changed, K/BB raw value flat
    else if (
        bbDirection > 0 &&
        kbbDirection === 0
    ) {

        sentences.push(
            "Command improved, driven by a lower BB% while K/BB remained stable."
        );
    }

    else if (
        bbDirection < 0 &&
        kbbDirection === 0
    ) {

        sentences.push(
            "Command declined, driven by a higher BB% while K/BB remained stable."
        );
    }


    // K/BB changed, BB% raw value flat
    else if (
        kbbDirection > 0 &&
        bbDirection === 0
    ) {

        sentences.push(
            "Command improved, driven by a higher K/BB while BB% remained stable."
        );
    }

    else if (
        kbbDirection < 0 &&
        bbDirection === 0
    ) {

        sentences.push(
            "Command declined, driven by a lower K/BB while BB% remained stable."
        );
    }


    // ---------------------------------
    // 12. XP + Overall
    // ---------------------------------
    const xpDiff =
        Math.round(curr.XP) -
        Math.round(prev.XP);


    if (
        xpDiff > 0 &&
        overallDiff > 0
    ) {

        sentences.push(
            `XP increased by ${Math.abs(xpDiff)}, while Overall Score improved by ${Math.abs(overallDiff).toFixed(1)} points.`
        );
    }

    else if (
        xpDiff < 0 &&
        overallDiff < 0
    ) {

        sentences.push(
            `XP declined by ${Math.abs(xpDiff)}, while Overall Score decreased by ${Math.abs(overallDiff).toFixed(1)} points.`
        );
    }

    else if (
        xpDiff > 0 &&
        overallDiff < 0
    ) {

        sentences.push(
            `XP increased by ${Math.abs(xpDiff)}, while Overall Score declined by ${Math.abs(overallDiff).toFixed(1)} points.`
        );
    }

    else if (
        xpDiff < 0 &&
        overallDiff > 0
    ) {

        sentences.push(
            `XP declined by ${Math.abs(xpDiff)}, while Overall Score improved by ${Math.abs(overallDiff).toFixed(1)} points.`
        );
    }

    else if (
        xpDiff === 0 &&
        overallDiff > 0
    ) {

        sentences.push(
            `XP remained unchanged, while Overall Score improved by ${Math.abs(overallDiff).toFixed(1)} points.`
        );
    }

    else if (
        xpDiff === 0 &&
        overallDiff < 0
    ) {

        sentences.push(
            `XP remained unchanged, while Overall Score declined by ${Math.abs(overallDiff).toFixed(1)} points.`
        );
    }

    else if (
        xpDiff > 0 &&
        Math.abs(overallDiff) <= 0.05
    ) {

        sentences.push(
            `XP increased by ${Math.abs(xpDiff)}, while Overall Score remained essentially unchanged.`
        );
    }

    else if (
        xpDiff < 0 &&
        Math.abs(overallDiff) <= 0.05
    ) {

        sentences.push(
            `XP declined by ${Math.abs(xpDiff)}, while Overall Score remained essentially unchanged.`
        );
    }


    return sentences.join(" ");
}

// -------------------------------
// Capitalize helper
// -------------------------------
function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}


// -------------------------------
// Pitcher Comparison Summary
// -------------------------------
function generatePitcherComparisonSummary(
    p1,
    p2,
    data1,
    data2,
    xp1,
    xp2,
    overall1,
    overall2
) {

    const sentences = [];

    // ---------------------------
    // Pitcher Archetype
    // ---------------------------

    const archetype1 =
        data1.Archetype || "--";

    const archetype2 =
        data2.Archetype || "--";

    if (
        archetype1 !== "--" &&
        archetype2 !== "--"
    ) {

        if (archetype1 === archetype2) {

            sentences.push(
                `${p1} and ${p2} both profile as ${archetype1} pitchers.`
            );

        }
        else {

            sentences.push(
                `${p1} profiles as ${archetype1}, while ${p2} profiles as ${archetype2}.`
            );
        }
    }


    // ---------------------------
    // Run Prevention
    // ERA + WHIP
    // ---------------------------

    const p1RunPrevention =
        Number(data1.ERA) < Number(data2.ERA) &&
        Number(data1.WHIP) < Number(data2.WHIP);

    const p2RunPrevention =
        Number(data2.ERA) < Number(data1.ERA) &&
        Number(data2.WHIP) < Number(data1.WHIP);


    if (p1RunPrevention) {

        sentences.push(
            `${p1} holds the advantage in run prevention with a lower ERA and WHIP.`
        );

    }
    else if (p2RunPrevention) {

        sentences.push(
            `${p2} holds the advantage in run prevention with a lower ERA and WHIP.`
        );

    }
    else {

        const p1BetterERA =
            Number(data1.ERA) < Number(data2.ERA);

        const p2BetterERA =
            Number(data2.ERA) < Number(data1.ERA);

        const p1BetterWHIP =
            Number(data1.WHIP) < Number(data2.WHIP);

        const p2BetterWHIP =
            Number(data2.WHIP) < Number(data1.WHIP);


        if (
            p1BetterERA &&
            p2BetterWHIP
        ) {

            sentences.push(
                `Run prevention is split, with ${p1} holding the lower ERA and ${p2} the lower WHIP.`
            );

        }
        else if (
            p2BetterERA &&
            p1BetterWHIP
        ) {

            sentences.push(
                `Run prevention is split, with ${p2} holding the lower ERA and ${p1} the lower WHIP.`
            );
        }
    }


    // ---------------------------
    // Command
    // BB% + K/BB
    // ---------------------------

    const p1Command =
        Number(data1.BBpct) < Number(data2.BBpct) &&
        Number(data1.KBB) > Number(data2.KBB);

    const p2Command =
        Number(data2.BBpct) < Number(data1.BBpct) &&
        Number(data2.KBB) > Number(data1.KBB);


    if (p1Command) {

        sentences.push(
            `${p1} owns the stronger command profile with a lower BB% and higher K/BB ratio.`
        );

    }
    else if (p2Command) {

        sentences.push(
            `${p2} owns the stronger command profile with a lower BB% and higher K/BB ratio.`
        );

    }
    else {

        const p1BetterBB =
            Number(data1.BBpct) < Number(data2.BBpct);

        const p2BetterBB =
            Number(data2.BBpct) < Number(data1.BBpct);

        const p1BetterKBB =
            Number(data1.KBB) > Number(data2.KBB);

        const p2BetterKBB =
            Number(data2.KBB) > Number(data1.KBB);


        if (
            p1BetterBB &&
            p2BetterKBB
        ) {

            sentences.push(
                `The command profile is split, with ${p1} holding the lower BB% and ${p2} the higher K/BB ratio.`
            );

        }
        else if (
            p2BetterBB &&
            p1BetterKBB
        ) {

            sentences.push(
                `The command profile is split, with ${p2} holding the lower BB% and ${p1} the higher K/BB ratio.`
            );
        }
    }


    // ---------------------------
    // Strikeout Profile
    // K%
    // ---------------------------

    if (
        Number(data1.Kpct) >
        Number(data2.Kpct)
    ) {

        sentences.push(
            `${p1} provides the stronger strikeout profile with the higher K%.`
        );

    }
    else if (
        Number(data2.Kpct) >
        Number(data1.Kpct)
    ) {

        sentences.push(
            `${p2} provides the stronger strikeout profile with the higher K%.`
        );
    }


    // ---------------------------
    // XP + Overall Score
    // ---------------------------

    const p1XP =
        xp1 > xp2;

    const p2XP =
        xp2 > xp1;

    const p1Overall =
        overall1 > overall2;

    const p2Overall =
        overall2 > overall1;


    if (
        p1XP &&
        p1Overall
    ) {

        sentences.push(
            `${p1} finishes ahead in both XP and Overall Score.`
        );

    }
    else if (
        p2XP &&
        p2Overall
    ) {

        sentences.push(
            `${p2} finishes ahead in both XP and Overall Score.`
        );

    }
    else {

        if (p1XP) {

            sentences.push(
                `${p1} holds the advantage in XP.`
            );

        }
        else if (p2XP) {

            sentences.push(
                `${p2} holds the advantage in XP.`
            );
        }


        if (p1Overall) {

            sentences.push(
                `${p1} holds the advantage in Overall Score.`
            );

        }
        else if (p2Overall) {

            sentences.push(
                `${p2} holds the advantage in Overall Score.`
            );
        }
    }


    return sentences.join(" ");
}

// -------------------------------
// Compare Button
// -------------------------------
async function showCompareModal() {

    console.log("COMPARE BUTTON CLICKED");

    try {

        const p1_raw =
            document.getElementById("playerName").value.trim();

        const s1 =
            document.getElementById("seasonSelect").value;

        const p2_raw =
            document.getElementById("playerName2").value.trim();

        const s2 =
            document.getElementById("seasonSelect2").value;


        // -------------------------------
        // Validate
        // -------------------------------

        if (!p1_raw || !p2_raw) {
            alert("Enter both pitcher names.");
            return;
        }


        // -------------------------------
        // Load Pitchers
        // -------------------------------

        const data1Arr =
            await loadPitcher(p1_raw, s1, true);

        const data2Arr =
            await loadPitcher(p2_raw, s2, true);

        const data1 =
            Array.isArray(data1Arr)
                ? data1Arr[0]
                : data1Arr;

        const data2 =
            Array.isArray(data2Arr)
                ? data2Arr[0]
                : data2Arr;


        if (
            !data1 ||
            data1.error ||
            !data2 ||
            data2.error
        ) {
            alert("One or both pitchers not found.");
            return;
        }


        if (
            data1.ERA == null ||
            data2.ERA == null
        ) {
            alert("Not enough data for comparison.");
            return;
        }


        // -------------------------------
        // Player Names
        // -------------------------------

        const p1_display =
            toTitleCase(data1.Name || p1_raw);

        const p2_display =
            toTitleCase(data2.Name || p2_raw);

        document.getElementById("compareName1").textContent =
            `${p1_display} (${s1})`;

        document.getElementById("compareName2").textContent =
            `${p2_display} (${s2})`;

// ----------------------------------
// Team
// ----------------------------------

document.getElementById("compareTeam1").textContent =
    data1.Team || "--";

document.getElementById("compareTeam2").textContent =
    data2.Team || "--";


        // -------------------------------
        // Backend TiM Scores
        // -------------------------------

        const profile1 = {
            ERA: Number(data1.ERA_score),
            WHIP: Number(data1.WHIP_score),
            K: Number(data1.Kpct_score),
            BB: Number(data1.BBpct_score),
            KBB: Number(data1.KBB_score)
        };

        const profile2 = {
            ERA: Number(data2.ERA_score),
            WHIP: Number(data2.WHIP_score),
            K: Number(data2.Kpct_score),
            BB: Number(data2.BBpct_score),
            KBB: Number(data2.KBB_score)
        };


        // -------------------------------
        // Overall / XP
        // -------------------------------

        const overall1 =
            Number(data1.Overall);

        const overall2 =
            Number(data2.Overall);

        const xp1 =
            Number(data1.XP);

        const xp2 =
            Number(data2.XP);


        // -------------------------------
        // Tier Helper
        // -------------------------------

        function getTier(score) {

            if (score >= 8.5) return "Ace";
            if (score >= 7.0) return "Top Starter";
            if (score >= 5.5) return "Mid Rotation";
            if (score >= 4.0) return "Back End";

            return "Depth";
        }


        // -------------------------------
        // Player Summary
        // -------------------------------

        document.getElementById("compareOverall1").textContent =
            safeFixed(overall1, 1);

        document.getElementById("compareOverall2").textContent =
            safeFixed(overall2, 1);

        document.getElementById("compareXP1").textContent =
            safeFixed(xp1, 0);

        document.getElementById("compareXP2").textContent =
            safeFixed(xp2, 0);

        document.getElementById("compareTier1").textContent =
            getTier(overall1);

        document.getElementById("compareTier2").textContent =
            getTier(overall2);


        // -------------------------------
        // Pitcher Archetype
        // -------------------------------

        document.getElementById("compareArchetype1").textContent =
            data1.Archetype || "--";

        document.getElementById("compareArchetype2").textContent =
            data2.Archetype || "--";

        document.getElementById("compareMatch1").textContent =
            data1.ArchetypeMatch || "--";

        document.getElementById("compareMatch2").textContent =
            data2.ArchetypeMatch || "--";


        // -------------------------------
        // Profile Helper
        // -------------------------------

        function updateCompareProfile(
            scoreId,
            rawId,
            meterId,
            score,
            rawDisplay
        ) {

            const scoreEl =
                document.getElementById(scoreId);

            const rawEl =
                document.getElementById(rawId);

            const meterEl =
                document.getElementById(meterId);


            if (scoreEl) {
                scoreEl.textContent =
                    safeFixed(score, 1);
            }

            if (rawEl) {
                rawEl.textContent =
                    rawDisplay;
            }

            if (meterEl) {

                const percent =
                    Math.max(
                        0,
                        Math.min(
                            100,
                            (Number(score) / 10) * 100
                        )
                    );

                meterEl.style.width =
                    `${percent}%`;
            }
        }


        // -------------------------------
        // ERA
        // -------------------------------

        updateCompareProfile(
            "compareERAScore1",
            "compareERARaw1",
            "compareERAMeter1",
            profile1.ERA,
            safeFixed(data1.ERA, 2)
        );

        updateCompareProfile(
            "compareERAScore2",
            "compareERARaw2",
            "compareERAMeter2",
            profile2.ERA,
            safeFixed(data2.ERA, 2)
        );


        // -------------------------------
        // WHIP
        // -------------------------------

        updateCompareProfile(
            "compareWHIPScore1",
            "compareWHIPRaw1",
            "compareWHIPMeter1",
            profile1.WHIP,
            safeFixed(data1.WHIP, 2)
        );

        updateCompareProfile(
            "compareWHIPScore2",
            "compareWHIPRaw2",
            "compareWHIPMeter2",
            profile2.WHIP,
            safeFixed(data2.WHIP, 2)
        );


        // -------------------------------
        // K%
        // -------------------------------

        updateCompareProfile(
            "compareKScore1",
            "compareKRaw1",
            "compareKMeter1",
            profile1.K,
            `${safeFixed(data1.Kpct, 1)}%`
        );

        updateCompareProfile(
            "compareKScore2",
            "compareKRaw2",
            "compareKMeter2",
            profile2.K,
            `${safeFixed(data2.Kpct, 1)}%`
        );


        // -------------------------------
        // BB%
        // -------------------------------

        updateCompareProfile(
            "compareBBScore1",
            "compareBBRaw1",
            "compareBBMeter1",
            profile1.BB,
            `${safeFixed(data1.BBpct, 1)}%`
        );

        updateCompareProfile(
            "compareBBScore2",
            "compareBBRaw2",
            "compareBBMeter2",
            profile2.BB,
            `${safeFixed(data2.BBpct, 1)}%`
        );


        // -------------------------------
        // K/BB
        // -------------------------------

        updateCompareProfile(
            "compareKBBScore1",
            "compareKBBRaw1",
            "compareKBBMeter1",
            profile1.KBB,
            safeFixed(data1.KBB, 2)
        );

        updateCompareProfile(
            "compareKBBScore2",
            "compareKBBRaw2",
            "compareKBBMeter2",
            profile2.KBB,
            safeFixed(data2.KBB, 2)
        );


        // -------------------------------
        // Comparison Summary
        // -------------------------------

        const comparisonSummary =
            generatePitcherComparisonSummary(
                p1_display,
                p2_display,
                data1,
                data2,
                xp1,
                xp2,
                overall1,
                overall2
            );

        document.getElementById(
            "comparisonSummaryText"
        ).textContent =
            comparisonSummary;


        // -------------------------------
        // Open Modal
        // -------------------------------

        document.getElementById(
            "compareModal"
        ).style.display = "flex";


    } catch (err) {

        console.error(
            "Compare error:",
            err
        );
    }
}


// -------------------------------
// Pitching Leaders Function
// -------------------------------
function handleLeaders() {
    leadersRequested = true;   // user explicitly requested leaders
    loadLeaders();
}

// -------------------------------
// Leaders Loader
// -------------------------------
async function loadLeaders() {

    try {
        const season = document.getElementById("seasonSelect").value;

        const data = await fetch(
            `https://pitcher-analyzer-backend.onrender.com/api/pitching/leaders?season=${season}`
        ).then(r => r.json());

        if (!Array.isArray(data)) {
            alert("No leaderboard data available.");
            return;
        }

        buildLeadersTable(data);

    } catch (err) {
        console.error("Pitching Leaders error:", err);
        alert("Error loading leaderboard.");
    }
}


// -------------------------------
// Leaders Table Name Normalization
// -------------------------------
function normalizeName(raw) {
    if (!raw) return raw;

    let cleaned = raw.replace(/<c3><ad>/g, "í")
                     .replace(/<c3><a1>/g, "á")
                     .replace(/<c3><b1>/g, "ñ")
                     .replace(/<c3><a9>/g, "é")
                     .replace(/<c3><b3>/g, "ó")
                     .replace(/<c3><ba>/g, "ú");

    cleaned = cleaned.normalize("NFD").replace(/\p{Diacritic}/gu, "");

    return cleaned;
}

// -------------------------------
// Leaders Table Builder
// -------------------------------
function buildLeadersTable(arr) {
    const tbody = document.getElementById("leadersBody");
    tbody.innerHTML = "";

    const filtered = arr;

    // Sort by OVERALL score
    const sorted = [...filtered].sort((a, b) => b.overall - a.overall);

    // Top 50 pitchers
    const top50 = sorted.slice(0, 50);

    // Build table rows (#1–50)
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

        // Click player name → load into Pitcher Analyzer
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
// Light Up Fantasy Badge (Pitchers)
// -------------------------------

// XP tier backbone tuned to new pitcher XP model
function xpTierPitcher(xp) {
    if (xp >= 1060) return "breakout";
    if (xp >= 1025) return "overperformer";
    if (xp >= 1000) return "sleeper";
    if (xp >= 975)  return "consistent";
    return "neutral";
}

// Skill modifier tuned for pitcher volatility
function applyPitcherSkillModifier(tier, skill) {
    const order = ["neutral", "consistent", "sleeper", "overperformer", "breakout"];
    let index = order.indexOf(tier);

    if (skill >= 7.0) index++;     // bump up
    if (skill <= 5.5) index--;     // bump down

    index = Math.max(0, Math.min(order.length - 1, index));
    return order[index];
}

// Final pitcher classifier
function classifyPlayer(xp, skill) {
    const base = xpTierPitcher(xp);
    return applyPitcherSkillModifier(base, skill);
}

// -------------------------------
// Calculate Divergence (Pitchers)
// -------------------------------
function calculatePitcherDivergence(xp, overall) {
    const expectedXP = 961.96 + (13.33 * overall);
    const divergence = (xp - expectedXP) / expectedXP;

    return {
        expectedXP,
        divergence,
        divergencePct: divergence * 100
    };
}

// -------------------------------
// Divergence → Fantasy State (Pitchers)
// -------------------------------
function pitcherDivergenceState(divergencePct) {
    if (divergencePct >= 2.28) return "strong";
    if (divergencePct >= -2.28) return "stable";
    if (divergencePct >= -4.56) return "vulnerable";
    return "high-risk";
}

function updateFantasyStateMarker(state) {

    const marker = document.getElementById("stateMarker");
    if (!marker) return;

    const positions = {
        "strong": 12.5,
        "stable": 37.5,
        "vulnerable": 62.5,
        "high-risk": 87.5
    };

    const position = positions[state];

    if (position == null) {
        marker.style.top = "37.5%";
        return;
    }

    marker.style.top = `${position}%`;
    marker.style.opacity = "1";
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

    if (z <= -1.5) return "extreme";
    if (z <= -0.5) return "elevated";
    if (z >= 1.5) return "suppressed";
    if (z >= 0.5) return "below";

    return "expected";
}

function updateFantasyValueMarker(value) {

    const marker = document.getElementById("valueMarker");
    if (!marker) return;

    const positions = {
        "extreme": 10,
        "elevated": 30,
        "expected": 50,
        "below": 70,
        "suppressed": 90
    };

    const position = positions[value];

    if (position == null) {
        marker.style.top = "50%";
        return;
    }

    marker.style.top = `${position}%`;
    marker.style.opacity = "1";
}

// -------------------------------
// Update Fantasy Value Badge
// -------------------------------
function updateValueBadge(value) {
    const container = document.getElementById("player-value-key");

    if (!container) return;

    container.querySelectorAll(".value-badge").forEach(badge => {
        badge.classList.remove("active");
    });

    const badge = container.querySelector(`.value-badge.${value}`);

    if (badge) {
        badge.classList.add("active");
    }
}

// -------------------------------
// Update State Badge
// -------------------------------
function updateStateBadge(state) {
    clearStateBadges();

    const badge = document.querySelector(`.state-badge.${state}`);
    if (badge) badge.classList.add("active");
}

// -------------------------------
// Clear State Badges
// -------------------------------
function clearStateBadges() {
    document.querySelectorAll(".state-badge").forEach(badge => {
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

    if (
        !identityTitle || !identityText ||
        !stateTitle || !stateText ||
        !valueTitle || !valueText
    ) return;

    // -------------------------------
    // Fantasy Identity
    // -------------------------------
    const identityLabels = {
        breakout: "Breakout Star",
        overperformer: "Overperformer",
        sleeper: "Sleeper Candidate",
        consistent: "Consistent Performer",
        neutral: "Neutral"
    };

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

    // -------------------------------
    // Fantasy State
    // -------------------------------
    const stateLabels = {
        strong: "Strong",
        stable: "Stable",
        vulnerable: "Vulnerable",
        "high-risk": "High Risk"
    };

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

    // -------------------------------
    // Fantasy Value
    // -------------------------------
    const valueLabels = {
        extreme: "Extreme",
        elevated: "Elevated",
        expected: "Expected",
        below: "Below Expected",
        suppressed: "Suppressed"
    };

    const valueDescriptions = {
        extreme:
            "This player's Fantasy Value signal is far above the expected range.",

        elevated:
            "This player's Fantasy Value signal is above the expected range.",

        expected:
            "This player's Fantasy Value signal is within the expected range.",

        below:
            "This player's Fantasy Value signal is below the expected range.",

        suppressed:
            "This player's Fantasy Value signal is well below the expected range."
    };

// -------------------------------
// Update DOM
// -------------------------------

identityTitle.textContent =
    identityLabels[identity] || "--";

identityText.textContent =
    identityDescriptions[identity] || "";

stateTitle.textContent =
    stateLabels[state] || "--";

stateText.textContent =
    stateDescriptions[state] || "";

valueTitle.textContent =
    valueLabels[value] || "--";

valueText.textContent =
    valueDescriptions[value] || "";

}


// -------------------------------
// Pitcher Tier Assignment
// -------------------------------
function getPitcherTier(score) {
    if (score >= 8.5) return "Ace";
    if (score >= 7.0) return "Top Starter";
    if (score >= 5.5) return "Mid Rotation";
    if (score >= 4.0) return "Back End";
    return "Depth";
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

    // FIXED: Trigger the correct load button
    document.getElementById("loadBtn").click();
};

// -------------------------------
// What to Watch - Placeholder State
// -------------------------------
function renderWatchPlaceholders() {

    const container = document.getElementById("watchGrid");

    if (!container) return;

    const placeholderCard = `
        <div class="watch-card watch-placeholder">

            <div class="watch-card-header">

                <div class="watch-placeholder-icon"></div>

                <div style="flex: 1;">
                    <span class="watch-placeholder-line title"></span>
                    <span class="watch-placeholder-line short"></span>
                </div>

            </div>

            <div class="watch-placeholder-body">
                <span class="watch-placeholder-line long"></span>
                <span class="watch-placeholder-line long"></span>
                <span class="watch-placeholder-line medium"></span>
            </div>

        </div>
    `;

    container.innerHTML =
        placeholderCard +
        placeholderCard +
        placeholderCard;
}


// -------------------------------
// Reset UI
// -------------------------------
function handleReset() {

     // Reset Fantasy Value Marker
const valueMarker = document.getElementById("valueMarker");

if (valueMarker) {
    valueMarker.style.top = "50%";
    valueMarker.style.opacity = "1";
}

// Reset Fantasy State marker
const stateMarker = document.getElementById("stateMarker");

if (stateMarker) {
    stateMarker.style.top = "37.5%";
    stateMarker.style.opacity = "1";
}

     // Reset Overall / XP gauges
const overallMeter =
    document.getElementById("overallMeter");

const xpMeter =
    document.getElementById("xpMeter");

if (overallMeter) {
    overallMeter.style.width = "3%";
}

if (xpMeter) {
    xpMeter.style.width = "3%";
}

    // Clear Season Production
    [
        "productionIP",
        "productionH",
        "productionR",
        "productionER",
        "productionBB",
        "productionK",
        "productionHR",
        "productionFIP",
    ].forEach(id => {
        document.getElementById(id).textContent = "--";
    });


    // Clear What to Watch
    const watchGrid = document.getElementById("watchGrid");

    if (watchGrid) {
        watchGrid.innerHTML = "";
    }


    // Clear leader-related UI FIRST
    clearLeaderState();


    // Clear raw metric values
    document.querySelectorAll(".metric-raw")
        .forEach(el => el.textContent = "--");


    // Clear score values
    document.querySelectorAll(".metric-score")
        .forEach(el => el.textContent = "--");


    // Clear all batteries (true empty state)
    document.querySelectorAll(".battery").forEach(el => {
        el.style.setProperty("--fill", "1%");
        void el.offsetWidth;
        el.style.setProperty("--fill", "0%");
        el.style.setProperty("--color", "#d50000");
    });


    // Clear Player Analytics
    document.getElementById("overallScore").textContent = "--";
    document.getElementById("overallTier").innerHTML = "--";
    document.getElementById("scoutingNote").innerHTML = "--";
    document.getElementById("overallPercentile").textContent = "--";
    document.getElementById("xpScore").innerHTML = "--";
    document.getElementById("playerTab").textContent = "Player:--";
    document.getElementById("pitcherArchetype").textContent = "--";
    document.getElementById("pitcherArchetypeMatch").textContent = "--";


    // Clear Fantasy Edge badges
    clearIdentityBadges();
    clearStateBadges();
    clearValueBadges();
    renderWatchPlaceholders();
    resetTeamColorPanel();
    resetSimilarProfiles();


    // Clear Fantasy Summary
    document.getElementById("summaryIdentity").textContent = "--";
    document.getElementById("summaryIdentityText").textContent =
        "Load a player to view their Fantasy Identity analysis.";

    document.getElementById("summaryState").textContent = "--";
    document.getElementById("summaryStateText").textContent =
        "Load a player to view their Fantasy State analysis.";

    document.getElementById("summaryValue").textContent = "--";
    document.getElementById("summaryValueText").textContent =
        "Load a player to view their Fantasy Value analysis.";

// -------------------------------
// Restore Access UI
// -------------------------------

updateAccessUI();

}




// -------------------------------
// Latest Update Timestamp Defined
// -------------------------------

const currentSeason = document.getElementById("seasonSelect").value;


// -------------------------------
// Latest Update Timestamp (Improved)
// -------------------------------
async function loadLastUpdated(season) {
    const url = `https://pitcher-analyzer-backend.onrender.com/api/last-updated/pitchers/${season}`;

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

    renderWatchPlaceholders(); 

    document.getElementById("loadBtn").addEventListener("click", handleLoad);
    document.getElementById("resetBtn").addEventListener("click", handleReset);
    document.getElementById("compareBtn")
    .addEventListener("click", () => {

        if (!requireAllAccess("Player Comparison")) {
            return;
        }

        showCompareModal();
    });


    loadLastUpdated(currentSeason);

    // Trend button
document.getElementById("trendBtn")
    .addEventListener("click", () => {

        if (!requireAllAccess("Trend Analysis")) {
            return;
        }

        handleTrend();
    });


// Leaders button
document.getElementById("leadersBtn")
    .addEventListener("click", () => {

        if (!requireAllAccess("Leaders")) {
            return;
        }

        loadLeaders();
    });

updateAccessUI();

    // Close modals
    document.getElementById("trendClose").onclick = () =>
        document.getElementById("trendModal").style.display = "none";

    document.getElementById("compareClose").onclick = () =>
        document.getElementById("compareModal").style.display = "none";

    // Close Leaders modal
    document.getElementById("leadersClose").onclick = () =>
        document.getElementById("leadersModal").style.display = "none";
});
