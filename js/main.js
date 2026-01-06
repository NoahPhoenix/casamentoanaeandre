// --- 1. CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: "https://casamente-ana-e-andre-default-rtdb.firebaseio.com",
    projectId: "casamente-ana-e-andre",
    storageBucket: "casamente-ana-e-andre.firebasestorage.app",
    messagingSenderId: "867047379076",
    appId: "1:867047379076:web:13e2b353f28b507c3a32d1"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const convidadosRef = database.ref('wedding/convidados');

// --- 2. TIMER ---
function atualizarTimer() {
    const dataEvento = new Date(2026, 6, 11, 16, 0, 0).getTime();
    setInterval(function() {
        const agora = new Date().getTime();
        const distancia = dataEvento - agora;
        if (distancia < 0) return;

        const d = Math.floor(distancia / (1000 * 60 * 60 * 24));
        const h = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distancia % (1000 * 60)) / 1000);

        document.getElementById("days").innerText = d.toString().padStart(2, '0');
        document.getElementById("hours").innerText = h.toString().padStart(2, '0');
        document.getElementById("mins").innerText = m.toString().padStart(2, '0');
        document.getElementById("secs").innerText = s.toString().padStart(2, '0');
    }, 1000);
}

// --- 3. CONFIRMAÇÃO ---
const urlParams = new URLSearchParams(window.location.search);
const convidadoId = urlParams.get('id');

function gerenciarConfirmacao() {
    convidadosRef.on('value', (snapshot) => {
        let total = 0;
        snapshot.forEach((child) => { if (child.val().status === 'confirmado') total++; });
        document.getElementById('guestCount').innerText = total;

        if (!convidadoId) {
            document.getElementById('confirmBtn').style.display = 'none';
            document.getElementById('confirmedMsg').style.display = 'block';
            document.getElementById('confirmedMsg').querySelector('p').innerText = "Confirmados:";
        }
    });

    if (convidadoId) {
        const userRef = database.ref(`wedding/convidados/${convidadoId}`);
        userRef.on('value', (snapshot) => {
            const dados = snapshot.val();
            if (dados && dados.status === 'confirmado') {
                document.getElementById('confirmBtn').style.display = 'none';
                document.getElementById('confirmedMsg').style.display = 'block';
            }
        });

        document.getElementById('confirmBtn').onclick = () => {
            userRef.update({ status: 'confirmado' }).then(() => {
                confetti({ particleCount: 150, spread: 80, origin: { y: 0.7 } });
            });
        };
    }
}

// --- 4. INTERAÇÃO ---
atualizarTimer();
gerenciarConfirmacao();

document.getElementById('mainContainer').addEventListener('click', function() {
    if (!this.classList.contains('open')) {
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, zIndex: 1000 });
        this.classList.add('open');
    }
});

document.getElementById('debugResetBtn').onclick = (e) => {
    e.stopPropagation();
    if(convidadoId) database.ref(`wedding/convidados/${convidadoId}`).update({status: 'nao_enviado'});
    location.reload();
};