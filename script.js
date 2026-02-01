// --- INITIALIZATION ---
let brainChart;
let stream;
let userProfile = JSON.parse(localStorage.getItem('steadyProfile')) || {
    activation: 50, sensory: 50, logic: 50, time: 50
};

window.onload = () => { if (localStorage.getItem('steadyUser')) navTo('dashboard'); }

function navTo(screen) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`view-${screen}`).classList.remove('hidden');
    if (screen === 'onboarding') initCharts();
}

// --- THE CAMERA LOGIC ---
async function openCamera() {
    document.getElementById('camera-modal').classList.remove('hidden');
    const video = document.getElementById('webcam');
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = stream;
    } catch (err) {
        alert("Camera access denied.");
        closeCamera();
    }
}

function closeCamera() {
    if (stream) stream.getTracks().forEach(track => track.stop());
    document.getElementById('camera-modal').classList.add('hidden');
}

function captureSnapshot() {
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('capture-canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    // Simulate OCR/AI Analysis
    document.getElementById('decoderInput').value = "[Image Captured: Scanning for directive logic...]";
    closeCamera();
    decode(); // Trigger the decode logic immediately
}

// --- PDF GENERATION (THE PASSPORT) ---
async function downloadPassport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Convert Chart Canvas to Image
    const chartCanvas = document.getElementById('brainChart');
    const chartImg = chartCanvas.toDataURL("image/png");

    // Styling the PDF
    doc.setFillColor(245, 242, 231); // Parchment background
    doc.rect(0, 0, 210, 297, 'F');
    
    doc.setTextColor(27, 38, 33);
    doc.setFont("times", "italic");
    doc.setFontSize(28);
    doc.text("Cognitive Passport", 105, 40, { align: "center" });

    doc.setDrawColor(197, 160, 89);
    doc.line(40, 45, 170, 45);

    // Add Chart
    doc.addImage(chartImg, 'PNG', 55, 60, 100, 100);

    // Generate Dynamic Description based on "Spikes"
    doc.setFontSize(12);
    doc.setFont("times", "normal");
    
    let description = "Official Neural Analysis Profile:\n\n";
    if (userProfile.sensory > 70) description += "- High Sensory Permeability: Requires low-stimulus environments to avoid cognitive saturation.\n";
    if (userProfile.activation < 40) description += "- Activation Inertia: Significant threshold between intention and task initiation. Granular scaffolding recommended.\n";
    if (userProfile.logic > 60) description += "- Explicit Logic Preference: Thrives in objective, rule-based systems; social ambiguity acts as a cognitive friction.\n";
    if (userProfile.time > 50) description += "- Non-Linear Temporal Perception: Views time as an energy volume rather than a chronological sequence.\n";

    const splitText = doc.splitTextToSize(description, 150);
    doc.text(splitText, 30, 180);

    doc.setFontSize(10);
    doc.text("Steady OS // MIT Behavioral Engineering Prototype", 105, 270, { align: "center" });

    doc.save("Cognitive_Passport.pdf");
}

// --- DASHBOARD FUNCTIONS ---
function decode() {
    const output = document.getElementById('decoderOutput');
    output.classList.remove('hidden');
    output.innerText = "Extracting objective directives...";
    setTimeout(() => {
        output.innerHTML = `
            <p class="uppercase text-[9px] tracking-widest font-bold mb-4">Essence Extracted:</p>
            <ul class="space-y-2">
                <li>• Strip social expectations.</li>
                <li>• Focus exclusively on the technical deliverable.</li>
                <li>• Complete by tonight's sunset.</li>
            </ul>`;
    }, 1200);
}

// --- SHARED UI LOGIC (Spider Web) ---
function initCharts() {
    const ctx = document.getElementById('brainChart').getContext('2d');
    if (brainChart) brainChart.destroy();

    const root = document.getElementById('slider-root');
    if (root && !root.innerHTML) {
        Object.keys(userProfile).forEach(t => {
            root.innerHTML += `
                <div class="space-y-4">
                    <label class="flex justify-between text-[10px] uppercase tracking-widest opacity-40">
                        ${t} <span class="text-[#C5A059] font-bold">${userProfile[t]}%</span>
                    </label>
                    <input type="range" value="${userProfile[t]}" oninput="updateTrait('${t}', this.value)">
                </div>`;
        });
    }

    brainChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Activation', 'Sensory', 'Logic', 'Time'],
            datasets: [{
                data: Object.values(userProfile),
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
}

function updateTrait(trait, val) {
    userProfile[trait] = parseInt(val);
    initCharts();
}

function handleLogin() {
    localStorage.setItem('steadyUser', document.getElementById('userEmail').value);
    navTo('onboarding');
}

function saveAndGo() {
    localStorage.setItem('steadyProfile', JSON.stringify(userProfile));
    navTo('dashboard');
}

function logout() { localStorage.clear(); location.reload(); }
