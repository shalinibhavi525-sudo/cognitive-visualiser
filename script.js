let onboardingChart, dashboardChart, stream, spoons = 10;
let userProfile = JSON.parse(localStorage.getItem('steadyProfile')) || {
    "YOUR Activation Threshold": 50,
    "YOUR Sensory Sensitivity": 50,
    "YOUR Information Density": 50,
    "YOUR Temporal Bend": 50,
    "YOUR Execution Load": 50
};

// --- CORE APP ---
window.onload = () => { if (localStorage.getItem('steadyUser')) navTo('dashboard'); }

function navTo(screen) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`view-${screen}`).classList.remove('hidden');
    initCharts();
    applyAdaptiveUI();
}

// --- GEMINI SMART BRAIN ---
async function askAI(prompt) {
    const key = document.getElementById('apiKeyInput').value || "AIzaSyCRlRoGDjfxp2wK0MT3eDHfS7SV0ZBO2JM";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: `System: You are a scholar's neuro-assistant. Tone: Dark Academia, supportive. User Data: ${JSON.stringify(userProfile)}. Task: ${prompt}` }] }] })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (e) { return "The Archives are unreachable. Ensure API Key is valid."; }
}

// --- DYNAMIC ADAPTATION ---
function initCharts() {
    const config = (data) => ({
        type: 'radar',
        data: {
            labels: Object.keys(userProfile),
            datasets: [{ data, backgroundColor: 'rgba(197, 160, 89, 0.05)', borderColor: '#C5A059', borderWidth: 1, pointRadius: 2 }]
        },
        options: {
            scales: { r: { min: 0, max: 100, ticks: { display: false }, grid: { color: 'rgba(197, 160, 89, 0.1)' } } },
            plugins: { legend: { display: false } }
        }
    });

    const containers = [document.getElementById('onboarding-sliders'), document.getElementById('dashboard-sliders')];
    containers.forEach(container => {
        if (container && container.innerHTML === "") {
            Object.keys(userProfile).forEach(t => {
                container.innerHTML += `
                    <div class="space-y-2">
                        <label class="flex justify-between text-[9px] uppercase tracking-widest opacity-40">${t} <span class="text-[#C5A059] font-bold" id="val-${t}">${userProfile[t]}%</span></label>
                        <input type="range" value="${userProfile[t]}" oninput="updateTrait('${t}', this.value)">
                    </div>`;
            });
        }
    });

    const oCtx = document.getElementById('onboardingChart')?.getContext('2d');
    if (oCtx) { if(onboardingChart) onboardingChart.destroy(); onboardingChart = new Chart(oCtx, config(Object.values(userProfile))); }

    const dCtx = document.getElementById('dashboardChart')?.getContext('2d');
    if (dCtx) { if(dashboardChart) dashboardChart.destroy(); dashboardChart = new Chart(dCtx, config(Object.values(userProfile))); }
}

async function updateTrait(trait, val) {
    userProfile[trait] = parseInt(val);
    document.querySelectorAll(`[id="val-${trait}"]`).forEach(l => l.innerText = val + "%");
    if(onboardingChart) { onboardingChart.data.datasets[0].data = Object.values(userProfile); onboardingChart.update(); }
    if(dashboardChart) { dashboardChart.data.datasets[0].data = Object.values(userProfile); dashboardChart.update(); }
    applyAdaptiveUI();
    localStorage.setItem('steadyProfile', JSON.stringify(userProfile));

    clearTimeout(window.aiDescTimer);
    window.aiDescTimer = setTimeout(async () => {
        const desc = await askAI("Write a 2-sentence scholarly neural profile for these spikes.");
        const target = document.getElementById('onboarding-desc');
        if(target) target.innerText = desc;
    }, 2000);
}

function applyAdaptiveUI() {
    if (userProfile["YOUR Sensory Sensitivity"] > 70) document.body.classList.add('mode-calm');
    else document.body.classList.remove('mode-calm');
}

// --- THE SMART LEDGER (TASK CHUNKING) ---
async function addTask() {
    const input = document.getElementById('taskInput'), time = document.getElementById('timeInput'), unit = document.getElementById('timeUnit').value, list = document.getElementById('taskList');
    if (!input.value || !time.value) return;

    const taskDiv = document.createElement('div');
    taskDiv.className = "p-10 border-l border-[#C5A059]/10 bg-[#161616]/40 animate-fade relative group";
    taskDiv.innerHTML = `<p class="serif italic opacity-30 text-2xl">The Lexicon is analyzing objective architecture...</p>`;
    list.prepend(taskDiv);

    const steps = await askAI(`Deconstruct "${input.value}" into 3 actionable steps. Time budget: ${time.value} ${unit}.`);
    
    taskDiv.innerHTML = `
        <div class="flex justify-between items-start">
            <div class="space-y-2">
                <h4 class="serif text-4xl italic tracking-tight">${input.value}</h4>
                <p class="text-[9px] uppercase tracking-[0.4em] text-[#C5A059] opacity-60">${time.value} ${unit} Allocated</p>
            </div>
            <div class="flex gap-4">
                <button onclick="deconstructFurther(this, '${input.value}', ${time.value}, '${unit}')" class="text-[9px] border border-[#C5A059]/20 px-4 py-2 hover:bg-[#C5A059]/10 transition uppercase tracking-widest">Chunk Task</button>
                <button onclick="this.closest('.relative').remove(); gainSpoon();" class="text-[9px] bg-[#C5A059] text-black px-6 py-2 uppercase tracking-widest font-bold">Fulfill</button>
            </div>
        </div>
        <div class="mt-8 opacity-60 text-base italic leading-relaxed border-t border-white/5 pt-6">${steps.replace(/\n/g, '<br>')}</div>
        <div id="chunk-area" class="mt-6 space-y-4"></div>
    `;

    // OBSERVABILITY WARNING
    let ms = time.value * 60000;
    if (unit === 'hours') ms *= 60; if (unit === 'days') ms *= 1440;
    setTimeout(async () => {
        if (taskDiv.parentNode) {
            taskDiv.classList.add('warning-pulse');
            const nudge = await askAI("User missed their time budget. Give a 1-sentence supportive nudge.");
            taskDiv.innerHTML += `<p class="mt-6 text-[10px] text-red-400 uppercase tracking-[0.3em] animate-pulse italic">${nudge}</p>`;
        }
    }, ms);

    spoons -= 2; updateSpoons();
    input.value = ""; time.value = "";
}

// THE NEW AI CHUNKING FEATURE
async function deconstructFurther(btn, ti
