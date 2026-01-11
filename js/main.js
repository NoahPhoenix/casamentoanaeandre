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

    document.addEventListener("DOMContentLoaded", function() {
    // 1. Verificação: Altere 'idDoConvidado' para a variável que você usa para validar o acesso
    // Exemplo: const guestId = localStorage.getItem('guestId'); ou sua variável 'dados.id'
    const guestId = (typeof dados !== 'undefined' && dados.id) ? dados.id : null;

    // 2. Seleciona todos os botões de presente
    const giftButtons = document.querySelectorAll('.btn-gift');

    if (!guestId) {
        // Se NÃO houver ID, esconde todos os botões
        giftButtons.forEach(button => {
            button.style.display = 'none'; 
        });
        
        // Opcional: Avisar ao usuário por que os botões sumiram
        console.log("Acesso como visitante: Botões de presente ocultos.");
    } else {
        // Se houver ID, garante que eles apareçam
        giftButtons.forEach(button => {
            button.style.display = 'block';
        });
    }
});

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

        if (confirmBtn) {
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

    if (mainContainer) {
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

    // --- Lógica de Paginação Atualizada ---
const gifts = document.querySelectorAll('.gift-card');
const btnPrev = document.getElementById('prevGift');
const btnNext = document.getElementById('nextGift');
const dotsContainer = document.getElementById('paginationDots');

let currentPage = 0;
const giftsPerPage = 8; // Garanta que aqui esteja 8
const totalPages = Math.ceil(gifts.length / giftsPerPage);

// 1. Limpa e recria as bolinhas para garantir que o número esteja certo (16 cards = 2 bolinhas)
if (dotsContainer) {
    dotsContainer.innerHTML = ''; // Limpa antes de criar
    for (let i = 0; i < totalPages; i++) {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        // Adiciona clique na bolinha também (opcional, mas moderno)
        dot.onclick = () => { currentPage = i; showPage(i); }; 
        dotsContainer.appendChild(dot);
    }
}

function showPage(page) {
    const start = page * giftsPerPage;
    const end = start + giftsPerPage;

    gifts.forEach((gift, index) => {
        // A mágica acontece aqui: esconde quem está fora do intervalo
        if (index >= start && index < end) {
            gift.style.display = 'block';
        } else {
            gift.style.display = 'none';
        }
    });

    // Atualiza visual das bolinhas
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === page);
    });

    // Bloqueia os botões nas extremidades
    if(btnPrev) btnPrev.disabled = (page === 0);
    if(btnNext) btnNext.disabled = (page === totalPages - 1);
}

// Configura os botões
if (btnPrev && btnNext) {
    btnPrev.onclick = () => { if (currentPage > 0) { currentPage--; showPage(currentPage); } };
    btnNext.onclick = () => { if (currentPage < totalPages - 1) { currentPage++; showPage(currentPage); } };
    
    // FORÇA A EXECUÇÃO INICIAL
    showPage(0);
}

let currentGiftName = "";

// Abre o modal ao clicar no botão de presentear
function openGiftModal(giftName) {
    currentGiftName = giftName;
    const modal = document.getElementById('gift-modal');
    modal.style.display = 'flex';
    
    // Opcional: Atualizar o título do modal com o nome do presente
    console.log("Abrindo modal para: " + giftName);
}

function closeGiftModal() {
    document.getElementById('gift-modal').style.display = 'none';
    document.getElementById('gift-comment').value = ''; // Limpa o texto
}

document.addEventListener('DOMContentLoaded', () => {
    const giftModal = document.getElementById('gift-modal');
    const commentInput = document.getElementById('gift-comment');
    const confirmBtn = document.getElementById('confirm-gift-btn');
    const closeBtn = document.getElementById('close-gift-modal');
    
    let selectedGift = "";

    // 1. Captura cliques nos botões de presente (usando delegação de evento)
    document.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('btn-gift')) {
            selectedGift = e.target.getAttribute('data-gift') || "Presente Geral";
            openModal();
        }
    });

    // 2. Listener para o botão de confirmar
    confirmBtn.addEventListener('click', async () => {
        const comment = commentInput.value.trim();

        if (!comment) {
            alert("Por favor, deixe uma mensagem para o casal!");
            return;
        }

        await saveGiftComment(selectedGift, comment);
    });

    // 3. Listener para fechar o modal
    closeBtn.addEventListener('click', closeModal);

    // Funções de suporte
    function openModal() {
        giftModal.style.display = 'flex';
    }

    function closeModal() {
        giftModal.style.display = 'none';
        commentInput.value = '';
    }

  async function saveGiftComment(gift, message) {
    try {
        // 1. Pegamos a referência para uma nova tabela chamada 'presentes_recebidos'
        const presentesRef = database.ref('wedding/presentes_recebidos');
        
        // 2. Capturamos os dados do convidado que já estão no seu script
        // Se convidadoId não existir, salvamos como "Convidado Anônimo"
        const nomeDoador = (typeof dados !== 'undefined' && dados.nome) ? dados.nome : "Convidado via Link";
        
        // 3. Pegamos o valor do atributo 'data-price' do botão (se você adicionou ao HTML)
        // Ou você pode passar o valor fixo se preferir
        const btnClicado = document.querySelector(`[data-gift="${gift}"]`);
        const valorPresente = btnClicado ? btnClicado.getAttribute('data-price') : "Valor não informado";

        const novoPresente = {
            quem_comprou: nomeDoador,
            convidado_id: convidadoId || 'id_nao_encontrado',
            o_que_comprou: gift,
            valor: valorPresente,
            mensagem: message,
            data: new Date().toLocaleString('pt-BR')
        };

        // 4. Salva no Firebase
        await presentesRef.push(novoPresente);

        alert("Mensagem salva com sucesso! Agora você será redirecionado para o PIX.");
        closeModal();
        
        // Opcional: Abrir o link do PIX após salvar
        // window.open('SUA_URL_DO_PIX_AQUI', '_blank');

    } catch (error) {
        console.error("Erro ao salvar no Firebase:", error);
        alert("Erro ao salvar mensagem. Por favor, tente novamente.");
    }
}
});


}