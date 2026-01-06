import { inicializarDashboard } from './dashboard.js';

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

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const convidadosRef = database.ref('wedding/convidados');

// --- 2. DISTRIBUIÇÃO DE PÁGINAS ---

// Se encontrar a tabela (Página Dashboard)
if (document.getElementById('listaConvidados')) {
    inicializarDashboard(convidadosRef);
}

// Se encontrar o container do convite (Página Index)
const mainContainer = document.getElementById('mainContainer');
if (mainContainer) {
    const urlParams = new URLSearchParams(window.location.search);
    const convidadoId = urlParams.get('id');
    const confirmBtn = document.getElementById('confirmBtn');
    const confirmedMsg = document.getElementById('confirmedMsg');
    const guestCountEl = document.getElementById('guestCount');

    // Timer (Fixos no Convite)
    const dataEvento = new Date(2026, 6, 11, 16, 0, 0).getTime();
    setInterval(() => {
        const agora = new Date().getTime();
        const dist = dataEvento - agora;
        if (dist < 0 || !document.getElementById("days")) return;
        document.getElementById("days").innerText = Math.floor(dist / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');
        document.getElementById("hours").innerText = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
        document.getElementById("mins").innerText = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
        document.getElementById("secs").innerText = Math.floor((dist % (1000 * 60)) / 1000).toString().padStart(2, '0');
    }, 1000);

    // Monitorar contagem global de confirmados
    convidadosRef.on('value', snap => {
        let total = 0;
        snap.forEach(c => { if(c.val().status === 'confirmado') total++; });
        if(guestCountEl) guestCountEl.innerText = total;
    });

    // LÓGICA DE EXIBIÇÃO:
    if (!convidadoId) {
        // 1. URL SEM ID: Esconde botão, mostra só contagem
        if(confirmBtn) confirmBtn.style.display = 'none';
        if(confirmedMsg) confirmedMsg.style.display = 'block';
    } else {
        // 2. URL COM ID: Verifica status individual
        const userRef = convidadosRef.child(convidadoId);
        userRef.on('value', snap => {
            const dados = snap.val();
            if (dados && dados.status !== 'confirmado') {
                // Existe e ainda não confirmou -> Mostra Botão
                if(confirmBtn) confirmBtn.style.display = 'block';
                if(confirmedMsg) confirmedMsg.style.display = 'none';
            } else {
                // Não existe ou já confirmou -> Esconde Botão, Mostra Contagem
                if(confirmBtn) confirmBtn.style.display = 'none';
                if(confirmedMsg) confirmedMsg.style.display = 'block';
            }
        });

        if(confirmBtn) {
            confirmBtn.onclick = () => {
                userRef.update({ status: 'confirmado' }).then(() => {
                    confetti({ particleCount: 150, spread: 80, origin: { y: 0.7 } });
                });
            };
        }
    }

    // Clique no Envelope
    mainContainer.addEventListener('click', function() {
        if (!this.classList.contains('open')) {
            confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, zIndex: 1000 });
            this.classList.add('open');
        }
    });
}