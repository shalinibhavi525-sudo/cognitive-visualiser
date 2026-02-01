let brainChart, miniChart;
let spoons = 10;
let userProfile = JSON.parse(localStorage.getItem('steadyProfile')) || {
    activation: 50, sensory: 50, logic: 50, time: 50
};

// --- AUTH SYSTEM ---
function handleLogin() {
    const email = document.getElementById('userEmail').value;
    if (email) {
        localStorage.setItem('steadyUser', email);
        navTo('onboarding');
    }
}

function logout() {
    localStorage.clear();
    location.reload();
}

function navTo(screen) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`view-${screen}`).classList.remove('hidden');
    if (screen === 'onboarding' || screen === 'dashboard') initCharts();
    if (screen === 'dashboard') applyAdaptiveUI();
}

// Check session on load
window.onload = () => {
    if (localStorage.getItem('steadyUser')) navTo('dashboard');
}

// --- ADAPTIVE ENGINE ---
function initCharts() {
    const config = (data) => ({
        type: 'radar',
        data: {
            labels: ['Activation', 'Sensory', 'Logic', 'Time'],
            datasets: [{
                data: data,
                backgroundColor: 'rgba(197, 160, 89, 0.1)',
                borderColor: '#C5A059',
                borderWidth: 1,
                pointRadius: 2
            }]
        },
        options: {
            scales: { r: { min: 0, max: 100, ticks: { display: false }, grid: { color: 'rgba(197, 160, 89, 0.1)' }, angleLines: { color: 'rgba(197, 160, 89, 0.1)' } } },
            plugins: { legend: { display: false } }
        }
    });

    const root = document.getElementById('slider-root');
    if (root && !root.innerHTML) {
        Object.keys(userProfile).forEach(t => {
            root.innerHTML += `
                <div class="space-y-4">
                    <label class="flex justify-between text-[10px] uppercase tracking-widest opacity-50">
                        ${t} <span class="text-[#C5A059] font-bold">${userProfile[t]}%</span>
                    </label>
                    <input type="range" value="${userProfile[t]}" oninput="updateTrait('${t}', this.value)">
                </div>`;
        });
    }

    const bCtx = document.getElementById('brainChart')?.getContext('2d');
    if (bCtx) brainChart = new Chart(bCtx, config(Object.values(userProfile)));

    const mCtx = document.getElementById('miniChart')?.getContext('2d');
    if (mCtx) miniChart = new Chart(mCtx, config(Object.values(userProfile)));
}

function updateTrait(trait, val) {
    userProfile[trait] = parseInt(val);
    initCharts();
    applyAdaptiveUI();
}

function saveAndGo() {
    localStorage.setItem('steadyProfile', JSON.stringify(userProfile));
    navTo('dashboard');
}

function applyAdaptiveUI() {
    // Sensory Check: Toggle Calm Mode
    if (userProfile.sensory > 70) document.body.classList.add('mode-calm');
    else document.body.classList.remove('mode-calm');

    const status = document.getElementById('system-status');
    if (userProfile.activation < 40) status.innerText = "Assisted Mode Active";
}

// --- THE LEDGER (TASK EXPLODER) ---
function addTask() {
    const input = document.getElementById('taskInput');
    const list = document.getElementById('taskList');
    if (!input.value || spoons < 2) return;

    spoons -= 2;
    updateSpoons();

    const taskDiv = document.createElement('div');
    taskDiv.className = "p-8 border border-[#C5A059]/10 bg-[#161616] relative group";
    
    let subtasks = "";
    if (userProfile.activation < 50) {
        subtasks = `
            <div class="mt-6 pt-6 border-t border-[#C5A059]/10 space-y-4 opacity-60">
                <p class="text-[9px] uppercase tracking-widest text-[#C5A059]">Micro-Directives</p>
                <div class="flex items-center gap-3 text-xs"><input type="checkbox"> Settle in environment</div>
                <div class="flex items-center gap-3 text-xs"><input type="checkbox"> Engage for three minutes</div>
            </div>`;
    }

    taskDiv.innerHTML = `
        <div class="flex justify-between items-start">
            <h4 class="serif text-2xl italic">${input.value}</h4>
            <button onclick="this.parentElement.parentElement.remove(); gainSpoon();" class="text-[9px] uppercase tracking-widest text-[#C5A059] border border-[#C5A059]/30 px-4 py-2 hover:bg-[#C5A059] hover:text-[#121212] transition">Fulfill</button>
        </div>
        ${subtasks}
    `;
    list.prepend(taskDiv);
    input.value = "";
}

function updateSpoons() {
    document.getElementById('spoon-bar').style.width = (spoons * 10) + "%";
    document.getElementById('spoon-count').innerText = spoons;
}

function gainSpoon() { if(spoons < 10) spoons += 1; updateSpoons(); }

// --- DECODER ---
function decode() {
    const input = document.getElementById('decoderInput').value;
    const output = document.getElementById('decoderOutput');
    if (!input) return;

    output.classList.remove('hidden');
    output.innerHTML = "Processing logic...";

    setTimeout(() => {
        const points = input.split(/[.!?]/).filter(s => s.length > 10);
        output.innerHTML = `
            <p class="mb-2 uppercase text-[9px] tracking-widest font-bold">Objectives:</p>
            <ul class="list-disc ml-4 space-y-2">
                ${points.map(p => `<li>${p.trim()}</li>`).join('')}
            </ul>`;
    }, 800);
}
