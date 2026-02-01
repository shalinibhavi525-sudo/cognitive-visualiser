let brainChart, miniChart, stream, spoons = 10;
let userProfile = JSON.parse(localStorage.getItem('steadyProfile')) || {
    "YOUR Activation Threshold": 50,
    "YOUR Sensory Sensitivity": 50,
    "YOUR Information Density": 50,
    "YOUR Temporal Bend": 50,
    "YOUR Execution Load": 50
};

// --- CORE APP LOGIC ---
window.onload = () => {
    if (localStorage.getItem('steadyUser')) {
        navTo('dashboard');
    }
}

function navTo(screen) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`view-${screen}`).classList.remove('hidden');
    
    // Always initialize charts and sliders when moving to a new screen
    initCharts();
    applyAdaptiveUI();
}

// --- ACTUAL SMART AI GATEWAY ---
async function askAI(prompt) {
    const customKey = document.getElementById('apiKeyInput').value;
    const API_KEY = customKey || "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"; // Uses the input box first

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json", 
                "Authorization": `Bearer ${API_KEY}` 
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are a cognitive assistant for neurodivergent scholars. Tone: Scholarly, Dark Academia, helpful." },
                    { role: "user", content: prompt }
                ]
            })
        });
        const data = await response.json();
        if (data.error) return "Check API Key: " + data.error.message;
        return data.choices[0].message.content;
    } catch (e) {
        return "Connection Error. Check your internet or API limits.";
    }
}

// --- THE CHART & LIVE SLIDERS ---
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

    // Inject Sliders into the Onboarding OR Dashboard
    const containers = [document.getElementById('slider-root'), document.getElementById('dashboard-sliders')];
    
    containers.forEach(container => {
        if (container && container.innerHTML === "") {
            Object.keys(userProfile).forEach(t => {
                container.innerHTML += `
                    <div class="space-y-2">
                        <label class="flex justify-between text-[9px] uppercase tracking-widest opacity-40">
                            ${t} <span class="text-[#C5A059] font-bold" id="val-${t}">${userProfile[t]}%</span>
                        </label>
                        <input type="range" value="${userProfile[t]}" 
                            oninput="updateTrait('${t}', this.value)" 
                            class="w-full accent-indigo-500 cursor-pointer">
                    </div>`;
            });
        }
    });

    // Draw Chart on Dashboard
    const mCtx = document.getElementById('miniChart')?.getContext('2d');
    if (mCtx) {
        if (miniChart) miniChart.destroy();
        miniChart = new Chart(mCtx, config(Object.values(userProfile)));
    }
}

function updateTrait(trait, val) {
    userProfile[trait] = parseInt(val);
    
    // Update all labels across the app
    const labels = document.querySelectorAll(`[id="val-${trait}"]`);
    labels.forEach(l => l.innerText = val + "%");
    
    // Sync chart
    if (miniChart) {
        miniChart.data.datasets[0].data = Object.values(userProfile);
        miniChart.update();
    }
    
    localStorage.setItem('steadyProfile', JSON.stringify(userProfile));
    applyAdaptiveUI();
}

function applyAdaptiveUI() {
    const sensory = userProfile["YOUR Sensory Sensitivity"];
    if (sensory > 70) {
        document.body.classList.add('mode-calm');
    } else {
        document.body.classList.remove('mode-calm');
    }
}

// --- LEDGER (TASKS) ---
async function addTask() {
    const input = document.getElementById('taskInput');
    const time = document.getElementById('timeInput');
    const unit = document.getElementById('timeUnit').value;
    const list = document.getElementById('taskList');

    if (!input.value || !time.value) return;

    const taskDiv = document.createElement('div');
    taskDiv.className = "p-8 border-l border-[#C5A059]/20 bg-[#161616]/30 animate-fade";
    taskDiv.innerHTML = `<p class="serif italic opacity-30">Consulting archives for micro-directives...</p>`;
    list.prepend(taskDiv);

    const prompt = `Break down: "${input.value}" for someone with these traits: ${JSON.stringify(userProfile)}. Time allowed: ${time.value} ${unit}. Respond with 3 bullet points.`;
    const response = await askAI(prompt);

    taskDiv.innerHTML = `
        <div class="flex justify-between items-start">
            <div>
                <h4 class="serif text-3xl italic">${input.value}</h4>
                <p class="text-[9px] uppercase tracking-[0.3em] text-[#C5A059] mt-2">${time.value} ${unit} Budgeted</p>
            </div>
            <button onclick="this.closest('div').parentElement.remove(); gainSpoon();" class="text-[9px] border border-[#C5A059]/30 px-4 py-2 hover:bg-[#C5A059] hover:text-black">FULFILL</button>
        </div>
        <div class="mt-6 opacity-60 text-sm italic leading-relaxed">${response.replace(/\n/g, '<br>')}</div>
    `;

    // INERTIA WARNING
    let ms = time.value * 60000;
    if (unit === 'hours') ms = time.value * 3600000;
    if (unit === 'days') ms = time.value * 86400000;

    setTimeout(async () => {
        if (taskDiv.parentNode) {
            taskDiv.classList.add('warning-pulse');
            const nudge = await askAI("Write a 1-sentence supportive nudge for missing a task deadline.");
            taskDiv.innerHTML += `<p class="mt-4 text-[9px] text-red-400 uppercase tracking-widest animate-pulse">${nudge}</p>`;
        }
    }, ms);
}

// --- CAMERA & LEXICON ---
async function openCamera() {
    document.getElementById('camera-modal').classList.remove('hidden');
    const video = document.getElementById('webcam');
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = stream;
    } catch (e) {
        alert("Camera error.");
        closeCamera();
    }
}

function closeCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    document.getElementById('camera-modal').classList.add('hidden');
}

async function decode() {
    const input = document.getElementById('decoderInput').value;
    const output = document.getElementById('decoderOutput');
    output.classList.remove('hidden');
    output.innerHTML = "Deciphering intention...";

    const res = await askAI(`Translate this chaotic input into a scholarly action or professional script: "${input}". Account for this brain profile: ${JSON.stringify(userProfile)}`);
    output.innerHTML = `<span class="text-[9px] uppercase tracking-widest font-bold block mb-4">The Essence:</span>${res.replace(/\n/g, '<br>')}`;
}

// --- HELPERS ---
function gainSpoon() { spoons = Math.min(10, spoons + 1); updateSpoons(); }
function updateSpoons() {
    document.getElementById('spoon-bar').style.width = (spoons * 10) + "%";
    document.getElementById('spoon-count').innerText = spoons;
}
function handleLogin() { localStorage.setItem('steadyUser', 'active'); navTo('onboarding'); }
function logout() { localStorage.clear(); location.reload(); }
function saveAndGo() { navTo('dashboard'); }
