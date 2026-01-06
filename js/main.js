import confetti from 'canvas-confetti';
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

    // Dentro da verificação do mainContainer no main.js

const navInfo = document.getElementById('navInfo');
const infoModal = document.getElementById('infoModal');
const closeModal = document.getElementById('closeModal');

// Abrir Modal
if (navInfo) {
    navInfo.onclick = (e) => {
        e.preventDefault();
        infoModal.style.display = 'flex';
    };
}

// Fechar Modal
if (closeModal) {
    closeModal.onclick = () => {
        infoModal.style.display = 'none';
    };
}

// Fechar ao clicar fora da caixa branca
window.onclick = (event) => {
    if (event.target == infoModal) {
        infoModal.style.display = 'none';
    }
};

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
        snap.forEach(c => { if (c.val().status === 'confirmado') total++; });
        if (guestCountEl) guestCountEl.innerText = total;
    });


    // Elementos novos
    const locationInfo = document.getElementById('locationInfo');
    const guestWelcome = document.getElementById('guestWelcome');
    const guestNameDisplay = document.getElementById('guestNameDisplay');

    // LÓGICA DE EXIBIÇÃO ATUALIZADA:
    if (!convidadoId) {
        // 1. URL SEM ID: Esconde tudo (botão, local e boas-vindas)
        if (confirmBtn) confirmBtn.style.display = 'none';
        if (confirmedMsg) confirmedMsg.style.display = 'block';
        if (locationInfo) locationInfo.style.display = 'none';
        if (guestWelcome) guestWelcome.style.display = 'none';
    } else {
        // 2. URL COM ID: Verifica status individual
        const userRef = convidadosRef.child(convidadoId);
        const navInfo = document.getElementById('navInfo');
        const sepInfo = document.getElementById('sepInfo');

        userRef.on('value', snap => {
            const dados = snap.val();

            if (dados) {
                // --- INSERÇÃO DO NOME (Ajuste aqui) ---
                if (guestNameDisplay && dados.nome) {
                    guestNameDisplay.innerText = dados.nome; // Puxa o nome do Firebase
                    if (guestWelcome) guestWelcome.style.display = 'block'; // Mostra a saudação
                }

                if (dados.status !== 'confirmado') {
                    // Ainda não confirmou
                    if (confirmBtn) confirmBtn.style.display = 'block';
                    if (locationInfo) locationInfo.style.display = 'none';
                    if (navInfo) navInfo.style.display = 'none';
                    if (sepInfo) sepInfo.style.display = 'none';
                } else {
                    // JÁ CONFIRMOU: Mostra o local e o link no header
                    if (confirmBtn) confirmBtn.style.display = 'none';
                    if (confirmedMsg) confirmedMsg.style.display = 'block';
                    if (locationInfo) locationInfo.style.display = 'block';

                    // Exibe o botão "Informações" no header
                    if (navInfo) navInfo.style.display = 'inline';
                    if (sepInfo) sepInfo.style.display = 'inline';
                }
            }
        });

        if(confirmBtn) {
    confirmBtn.onclick = () => {
        userRef.update({ status: 'confirmado' }).then(() => {
            // 1. Solta os confetes
            confetti({ 
                particleCount: 150, 
                spread: 80, 
                origin: { y: 0.7 },
                zIndex: 3000 // Garante que fique acima de tudo
            });

            // 2. ABRE O POPUP DE INFORMAÇÕES AUTOMATICAMENTE
            if (infoModal) {
                setTimeout(() => {
                    infoModal.style.display = 'flex';
                }, 500); // Um pequeno atraso de 0.5s para o convidado ver o confete primeiro
            }
        });
    };
}
    }

    if (mainContainer) 
    {
        mainContainer.addEventListener('click', function (e) {
            // Log para depuração - verifique se aparece no F12 do navegador
            console.log("Envelope clicado!");

            if (!this.classList.contains('open')) {
                // Disparar o confete usando a biblioteca importada no topo
                try {
                    confetti({
                        particleCount: 150,
                        spread: 100,
                        origin: { y: 0.6 },
                        zIndex: 2000 // Valor alto para garantir visibilidade sobre a carta
                    });
                    console.log("Confete disparado com sucesso!");
                } catch (err) {
                    console.error("Erro ao disparar confete:", err);
                }

                this.classList.add('open');
            }
        });

        
    }

    
}