const API_KEY = "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"; // Replace with your key

let brainChart, stream, spoons = 10;
let userProfile = JSON.parse(localStorage.getItem('steadyProfile')) || {
    "YOUR Activation Threshold": 50,
    "YOUR Sensory Sensitivity": 50,
    "YOUR Information Density": 50,
    "YOUR Temporal Bend": 50,
    "YOUR Execution Load": 50
};

window.onload = () => { if (localStorage.getItem('steadyUser')) navTo('dashboard'); }

function navTo(screen) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`view-${screen}`).classList.remove('hidden');
    if (screen === 'onboarding') initCharts();
    if (screen === 'dashboard') { initCharts(); applyAdaptiveUI(); }
}

function handleLogin() {
    localStorage.setItem('steadyUser', 'google-user-mock');
    navTo('onboarding');
}

// --- AI GATEWAY ---
async function askAI(prompt) {
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}` },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "system", content: "You are a cognitive assistant for neurodivergent scholars. Tone: Dark Academia, helpful, objective." }, { role: "user", content: prompt }]
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (e) { return "Error connecting to Neural Ledger."; }
}

// --- ONBOARDING & CHARTS ---
function initCharts() {
    const config = (data) => ({
        type: 'radar',
        data: {
            labels: Object.keys(userProfile),
            datasets: [{ data, backgroundColor: 'rgba(197, 160, 89, 0.1)', borderColor: '#C5A059', borderWidth: 1, pointRadius: 2 }]
        },
        options: {
            scales: { r: { min: 0, max: 100, ticks: { display: false }, grid: { color: 'rgba(197, 160, 89, 0.1)' } } },
            plugins: { legend: { display: false } }
        }
    });

    const root = document.getElementById('slider-root');
    if (root && !root.innerHTML) {
        Object.keys(userProfile).forEach(t => {
            root.innerHTML += `
                <div class="space-y-4">
                    <label class="flex justify-between text-[10px] uppercase tracking-widest opacity-40">
                        ${t} <span class="text-[#C5A059] font-bold" id="val-${t}">${userProfile[t]}%</span>
                    </label>
                    <input type="range" value="${userProfile[t]}" oninput="updateTrait('${t}', this.value)">
                </div>`;
        });
    }

    const bCtx = document.getElementById('brainChart')?.getContext('2d');
    if (bCtx) brainChart = new Chart(bCtx, config(Object.values(userProfile)));
}

async function updateTrait(trait, val) {
    userProfile[trait] = parseInt(val);
    document.getElementById(`val-${trait}`).innerText = val + "%";
    brainChart.data.datasets[0].data = Object.values(userProfile);
    brainChart.update();
    applyAdaptiveUI();
    
    // AI Personality Description (Debounced)
    clearTimeout(window.profileTimer);
    window.profileTimer = setTimeout(async () => {
        const desc = await askAI(`Briefly describe this brain profile in a scholarly, supportive way: ${JSON.stringify(userProfile)}`);
        document.getElementById('profile-desc').innerText = desc;
    }, 1500);
}

function applyAdaptiveUI() {
    if (userProfile["YOUR Sensory Sensitivity"] > 70) document.body.classList.add('mode-calm');
    else document.body.classList.remove('mode-calm');
}

// --- LEDGER (SMART TASKS) ---
async function addTask() {
    const input = document.getElementById('taskInput');
    const time = document.getElementById('timeInput');
    if (!input.value || !time.value) return;

    const taskDiv = document.createElement('div');
    taskDiv.className = "p-8 border-l border-[#C5A059]/20 bg-[#161616]/30 animate-fade";
    taskDiv.innerHTML = `<h4 class="serif text-3xl italic opacity-50">Analyzing objective...</h4>`;
    document.getElementById('taskList').prepend(taskDiv);

    const analysis = await askAI(`Break this task: "${input.value}" into 3 micro-steps for someone with these traits: ${JSON.stringify(userProfile)}. Formatting: Bullet points only.`);

    taskDiv.innerHTML = `
        <div class="flex justify-between items-start">
            <div>
                <h4 class="serif text-3xl italic">${input.value}</h4>
                <p class="text-[10px] uppercase text-[#C5A059] mt-2 tracking-widest">Time Budget: ${time.value} mins</p>
            </div>
            <button onclick="this.closest('div').parentElement.remove(); gainSpoon();" class="text-[9px] uppercase tracking-widest text-[#C5A059] border border-[#C5A059]/30 px-4 py-2">Fulfill</button>
        </div>
        <div class="mt-6 opacity-60 text-sm italic leading-relaxed">${analysis.replace(/\n/g, '<br>')}</div>
    `;

    // OBSERVABILITY: Warning if time exceeded
    setTimeout(async () => {
        if (taskDiv.parentNode) {
            taskDiv.classList.add('warning-pulse');
            const nudge = await askAI("Write a 1-sentence supportive nudge for a user who missed their time deadline on a task. Muted scholarly tone.");
            taskDiv.innerHTML += `<p class="mt-4 text-[10px] text-red-400 uppercase tracking-widest animate-pulse">${nudge}</p>`;
        }
    }, time.value * 60000);

    spoons -= 2; updateSpoons();
    input.value = ""; time.value = "";
}

function updateSpoons() {
    document.getElementById('spoon-bar').style.width = (spoons * 10) + "%";
    document.getElementById('spoon-count').innerText = spoons;
}

function gainSpoon() { if(spoons < 10) spoons += 1; updateSpoons(); }

// --- LEXICON & CAMERA ---
async function openCamera() {
    document.getElementById('camera-modal').classList.remove('hidden');
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    document.getElementById('webcam').srcObject = stream;
}

function closeCamera() {
    stream.getTracks().forEach(t => t.stop());
    document.getElementById('camera-modal').classList.add('hidden');
}

function captureSnapshot() {
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('capture-canvas');
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    document.getElementById('decoderInput').value = "[Image Captured: Contextualizing...]";
    closeCamera();
    decode();
}

async function decode() {
    const input = document.getElementById('decoderInput').value;
    const out = document.getElementById('decoderOutput');
    out.classList.remove('hidden'); out.innerText = "Consulting the Lexicon...";
    const result = await askAI(`The user provided this chaotic context: "${input}". Based on their profile ${JSON.stringify(userProfile)}, translate this into a clear action or professional script.`);
    out.innerHTML = `<span class="text-[9px] uppercase tracking-widest font-bold block mb-4">The Synthesis:</span>${result.replace(/\n/g, '<br>')}`;
}

async function downloadPassport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const chartImg = document.getElementById('brainChart').toDataURL("image/png");
    doc.setFillColor(245, 242, 231); doc.rect(0, 0, 210, 297, 'F');
    doc.addImage(chartImg, 'PNG', 55, 40, 100, 100);
    doc.text(doc.splitTextToSize(document.getElementById('profile-desc').innerText, 150), 30, 160);
    doc.save("Cognitive_Passport.pdf");
}

function saveAndGo() { localStorage.setItem('steadyProfile', JSON.stringify(userProfile)); navTo('dashboard'); }
function logout() { localStorage.clear(); location.reload(); }
