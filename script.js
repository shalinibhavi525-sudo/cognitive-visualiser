/**
 * STEADY OS - FINAL MASTER SCRIPT
 * Behavioral Engineering Prototype
 */

// --- 1. CONFIGURATION & STATE ---
const GEMINI_API_KEY = "PASTE_YOUR_GEMINI_API_KEY_HERE"; // <--- PASTE KEY HERE

let onboardingChart = null;
let dashboardChart = null;
let stream = null;
let spoons = 10;

// Default traits (Cognitive Profile)
let userProfile = JSON.parse(localStorage.getItem('steadyProfile')) || {
    "YOUR Activation Threshold": 50,
    "YOUR Sensory Sensitivity": 50,
    "YOUR Information Density": 50,
    "YOUR Temporal Bend": 50,
    "YOUR Execution Load": 50
};

// --- 2. INITIALIZATION & NAVIGATION ---
window.onload = () => {
    console.log("Steady OS: Systems Online.");
    // Persistence: If user is already logged in
    if (localStorage.getItem('steadyUser')) {
        navTo('dashboard');
    }
};

function navTo(screenId) {
    // Hide all views
    const views = ['view-login', 'view-onboarding', 'view-dashboard'];
    views.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    // Show target view
    const target = document.getElementById(`view-${screenId}`);
    if (target) target.classList.remove('hidden');

    // Run UI Updates after a tiny delay so the DOM is ready
    setTimeout(() => {
        initCharts();
        applyAdaptiveUI();
        updateSpoons();
    }, 100);
}

function handleLogin() {
    localStorage.setItem('steadyUser', 'active_session');
    navTo('onboarding');
}

function logout() {
    localStorage.clear();
    location.reload();
}

function saveAndGo() {
    localStorage.setItem('steadyProfile', JSON.stringify(userProfile));
    navTo('dashboard');
}

// --- 3. THE BRAIN (GEMINI AI INTEGRATION) ---
async function askAI(prompt) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.includes("PASTE")) {
        return "System Error: API Key missing from the ledger.";
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Context: You are a scholar's neuro-assistant. Tone: Dark Academia, supportive, sophisticated. 
                        User Profile: ${JSON.stringify(userProfile)}. 
                        Request: ${prompt}`
                    }]
                }]
            })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (e) {
        console.error("AI Fetch Error:", e);
        return "Communication with the Lexicon interrupted. Verify your key.";
    }
}

// --- 4. SENSORY LOGIC & CHARTS ---
function initCharts() {
    const config = (data) => ({
        type: 'radar',
        data: {
            labels: Object.keys(userProfile),
            datasets: [{ 
                data, 
                backgroundColor: 'rgba(197, 160, 89, 0.1)', 
                borderColor: '#C5A059', 
                borderWidth: 1, 
                pointRadius: 2 
            }]
        },
        options: {
            scales: { r: { min: 0, max: 100, ticks: { display: false }, grid: { color: 'rgba(197, 160, 89, 0.1)' } } },
            plugins: { legend: { display: false } }
        }
    });

    // Inject Sliders to containers
    const containers = [document.getElementById('onboarding-sliders'), document.getElementById('dashboard-sliders')];
    containers.forEach(container => {
        if (container && container.innerHTML === "") {
            Object.keys(userProfile).forEach(t => {
                container.innerHTML += `
                    <div class="space-y-2">
                        <label class="flex justify-between text-[9px] uppercase tracking-widest opacity-40">
                            ${t} <span id="val-${t}">${userProfile[t]}%</span>
                        </label>
                        <input type="range" value="${userProfile[t]}" oninput="updateTrait('${t}', this.value)">
                    </div>`;
            });
        }
    });

    // Handle Charts
    const oCtx = document.getElementById('onboardingChart');
    if (oCtx) {
        if (onboardingChart) onboardingChart.destroy();
        onboardingChart = new Chart(oCtx.getContext('2d'), config(Object.values(userProfile)));
    }

    const dCtx = document.getElementById('dashboardChart');
    if (dCtx) {
        if (dashboardChart) dashboardChart.destroy();
        dashboardChart = new Chart(dCtx.getContext('2d'), config(Object.values(userProfile)));
    }
}

function updateTrait(trait, val) {
    userProfile[trait] = parseInt(val);
    
    // Sync UI Labels
    document.querySelectorAll(`[id="val-${trait}"]`).forEach(l => l.innerText = val + "%");
    
    // Sync Charts
    if (onboardingChart) {
        onboardingChart.data.datasets[0].data = Object.values(userProfile);
        onboardingChart.update();
    }
    if (dashboardChart) {
        dashboardChart.data.datasets[0].data = Object.values(userProfile);
        dashboardChart.update();
    }
    
    applyAdaptiveUI();
    localStorage.setItem('steadyProfile', JSON.stringify(userProfile));

    // Update AI Description on onboarding
    const descBox = document.getElementById('onboarding-desc');
    if (descBox) {
        clearTimeout(window.aiTimer);
        window.aiTimer = setTimeout(async () => {
            descBox.innerText = "Recalibrating Neural Profile...";
            const res = await askAI("Briefly describe my cognitive profile based on these stats.");
            descBox.innerText = res;
        }, 2000);
    }
}

function applyAdaptiveUI() {
    const sensory = userProfile["YOUR Sensory Sensitivity"];
    if (sensory > 70) {
        document.body.classList.add('mode-calm');
    } else {
        document.body.classList.remove('mode-calm');
    }
}

// --- 5. THE LEDGER (SMART TASK SYSTEM) ---
async function addTask() {
    const input = document.getElementById('taskInput');
    const time = document.getElementById('timeInput');
    const unit = document.getElementById('timeUnit').value;
    const list = document.getElementById('taskList');

    if (!input.value || !time.value) return;

    const taskDiv = document.createElement('div');
    taskDiv.className = "p-10 border-l border-[#C5A059]/10 bg-[#161616]/40 relative group animate-fade";
    taskDiv.innerHTML = `<p class="serif italic opacity-30 text-2xl">Analyzing objective structure...</p>`;
    list.prepend(taskDiv);

    // AI Step Generation
    const steps = await askAI(`Break down: "${input.value}" into 3 actionable steps. Time: ${time.value} ${unit}.`);
    
    taskDiv.innerHTML = `
        <div class="flex justify-between items-start">
            <div class="space-y-2">
                <h4 class="serif text-4xl italic tracking-tight">${input.value}</h4>
                <p class="text-[9px] uppercase tracking-[0.4em] text-[#C5A059] opacity-60">${time.value} ${unit} Budgeted</p>
            </div>
            <div class="flex gap-4">
                <button onclick="chunkTask(this, '${input.value}', ${time.value}, '${unit}')" class="text-[9px] border border-[#C5A059]/20 px-4 py-2 hover:bg-[#C5A059]/10 transition uppercase">Chunk</button>
                <button onclick="this.closest('.relative').remove(); gainSpoon();" class="text-[9px] bg-[#C5A059] text-black px-6 py-2 uppercase font-bold">Fulfill</button>
            </div>
        </div>
        <div class="mt-8 opacity-60 text-base italic leading-relaxed border-t border-white/5 pt-6">${steps.replace(/\n/g, '<br>')}</div>
        <div class="chunk-area mt-4 space-y-4"></div>
    `;

    // Time-based Observability (Warning)
    let ms = time.value * 60000;
    if (unit === 'hours') ms *= 60;
    if (unit === 'days') ms *= 1440;

    setTimeout(async () => {
        if (taskDiv.parentNode) {
            taskDiv.classList.add('warning-pulse');
            const nudge = await askAI("User exceeded time. Provide a 1-sentence supportive nudge.");
            taskDiv.innerHTML += `<p class="mt-6 text-[10px] text-red-400 uppercase tracking-widest animate-pulse italic">${nudge}</p>`;
        }
    }, ms);

    spoons -= 2; updateSpoons();
    input.value = ""; time.value = "";
}

async function chunkTask(btn, title, time, unit) {
    const area = btn.closest('.relative').querySelector('.chunk-area');
    area.innerHTML = `<p class="text-[9px] uppercase animate-pulse opacity-40">Dividing time segments...</p>`;
    const res = await askAI(`Procrastination Protocol: Sub-divide "${title}" into specific timed chunks totaling ${time} ${unit}. Format: "00:00 - Step Name".`);
    area.innerHTML = `<div class="bg-[#C5A059]/5 p-4 border border-[#C5A059]/10 italic text-sm opacity-80">${res.replace(/\n/g, '<br>')}</div>`;
}

// --- 6. THE LEXICON & CAMERA ---
async function openCamera() {
    document.getElementById('camera-modal').classList.remove('hidden');
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        document.getElementById('webcam').srcObject = stream;
    } catch (e) {
        alert("Camera Access Denied.");
        closeCamera();
    }
}

function closeCamera() {
    if (stream) stream.getTracks().forEach(t => t.stop());
    document.getElementById('camera-modal').classList.add('hidden');
}

async function captureSnapshot() {
    document.getElementById('decoderInput').value = "[Snapshot Captured: Decoding Intent...]";
    closeCamera();
    decode();
}

async function decode() {
    const out = document.getElementById('decoderOutput');
    out.classList.remove('hidden');
    out.innerText = "Consulting the Lexicon...";
    const res = await askAI(`Translate the user's chaos into an objective action or professional script: "${document.getElementById('decoderInput').value}"`);
    out.innerHTML = `<span class="text-[10px] uppercase font-bold block mb-4 text-[#C5A059]">The Synthesis:</span>${res.replace(/\n/g, '<br>')}`;
}

// --- 7. UTILITIES ---
function updateSpoons() {
    const bar = document.getElementById('spoon-bar');
    if (bar) bar.style.width = (spoons * 10) + "%";
    const count = document.getElementById('spoon-count');
    if (count) count.innerText = spoons;
}

function gainSpoon() {
    spoons = Math.min(10, spoons + 1);
    updateSpoons();
}

function downloadPassport() {
    // Basic implementation of PDF Export using jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Cognitive Passport", 20, 20);
    doc.text(`Profile Analysis: ${document.getElementById('onboarding-desc').innerText}`, 20, 40, { maxWidth: 160 });
    doc.save("Brain_Passport.pdf");
}
