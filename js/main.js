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

    // Função para garantir que os botões obedeçam ao ID, sem bugar o layout
    function validarBotoesPresente() {
        const urlParams = new URLSearchParams(window.location.search);
        const idAtual = urlParams.get('id');

        const giftCards = document.querySelectorAll('.gift-card');

        giftCards.forEach(card => {
            const btn = card.querySelector('.btn-gift');
            const giftName = btn ? btn.getAttribute('data-gift') : "Presente";

            if (idAtual) {
                // COM ID: Ativa o card e mostra o botão
                card.style.cursor = 'pointer';
                if (btn) btn.style.display = 'block';

                card.onclick = (e) => {
                    e.stopPropagation();
                    openGiftModal(giftName);
                };
            } else {
                // SEM ID: Card visível, mas sem clique e botão escondido
                card.style.cursor = 'default';
                card.onclick = null; // Remove o evento de clique
                if (btn) btn.style.display = 'none';
            }
        });
    }
    // Chame a função IMEDIATAMENTE e também após o carregamento do DOM
    validarBotoesPresente();
    document.addEventListener('DOMContentLoaded', validarBotoesPresente);
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

    // Ajuste no clique do envelope para não bugar o texto "Clique para abrir"
    if (mainContainer) {
        mainContainer.addEventListener('click', function (e) {
            // Se clicou no botão de presente, não faz nada com o envelope
            if (e.target.classList.contains('btn-gift')) return;

            if (!this.classList.contains('open')) {
                try {
                    confetti({
                        particleCount: 150,
                        spread: 100,
                        origin: { y: 0.6 },
                        zIndex: 2000
                    });
                } catch (err) {
                    console.error("Erro no confete:", err);
                }
                this.classList.add('open');

                // Garante que o texto da dica suma apenas DEPOIS de abrir
                const hint = this.querySelector('.hint');
                if (hint) hint.style.opacity = '0';
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
        if (btnPrev) btnPrev.disabled = (page === 0);
        if (btnNext) btnNext.disabled = (page === totalPages - 1);
    }

    // Configura os botões
    if (btnPrev && btnNext) {
        btnPrev.onclick = () => { if (currentPage > 0) { currentPage--; showPage(currentPage); } };
        btnNext.onclick = () => { if (currentPage < totalPages - 1) { currentPage++; showPage(currentPage); } };

        // FORÇA A EXECUÇÃO INICIAL
        showPage(0);
    }

    // Defina estas funções fora de qualquer listener para serem globais
    let selectedGift = "";

    function openGiftModal(giftName) {
    selectedGift = giftName;
    const modal = document.getElementById('gift-modal');
    const qrImage = document.getElementById('qr-code-img');
    const valueDisplay = document.getElementById('pix-value-display');

    if (modal) {
        // 1. Achar o valor do presente no botão clicado
        const btn = document.querySelector(`[data-gift="${giftName}"]`);
        const preco = btn ? btn.getAttribute('data-price') : "0.00";
        
        // 2. Exibir o valor no modal
        if (valueDisplay) valueDisplay.innerText = `R$ ${preco}`;

        // 3. Gerar a URL do QR Code (Substitua os dados abaixo pelos seus)
        const chavePix = "SUA_CHAVE_PIX_AQUI"; 
        const nomeBeneficiario = "Ana e Andre";
        const cidade = "SAO PAULO";
        const valorLimpo = preco.replace(/[^\d,]/g, '').replace(',', '.');

        // Usando uma API pública para gerar o QR Code estático formatado para PIX
        // Nota: Para um PIX real com valor, o ideal é usar o Payload completo. 
        // Se quiser simplificar, gere um QR Code da sua chave e exiba o valor abaixo.
        const pixPayload = `00020101021126580014br.gov.bcb.pix0114${chavePix}5204000053039865404${valorLimpo}5802BR5912${nomeBeneficiario}6009${cidade}62070503***6304`;
        
        qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixPayload)}`;

        modal.style.display = 'flex';
    }
}

    function closeGiftModal() {
        const modal = document.getElementById('gift-modal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('gift-comment').value = '';
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        let allComments = [];
        let currentCommentPage = 1;
        const commentsPerPage = 4;
        const commentsRef = database.ref('wedding/comments');


        const giftModal = document.getElementById('gift-modal');
        const commentInput = document.getElementById('gift-comment');
        const confirmBtn = document.getElementById('confirm-gift-btn');
        const closeBtn = document.getElementById('close-gift-modal');

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
        // AJUSTE 1: Salvar na mesma pasta que a lista de comentários lê
        const commentsRef = database.ref('wedding/comments');

        // AJUSTE 2: Pegar o nome que está aparecendo na tela para o convidado
        const nomeNaTela = document.getElementById('guestNameDisplay') ? document.getElementById('guestNameDisplay').innerText : "Convidado";

        const btnClicado = document.querySelector(`[data-gift="${gift}"]`);
        const valorPresente = btnClicado ? btnClicado.getAttribute('data-price') : "Valor não informado";

        const novoComentario = {
            name: nomeNaTela,        
            text: message,           
            giftItem: gift,          
            valor: valorPresente,
            date: new Date().toLocaleString('pt-BR'),
            timestamp: Date.now()    
        };

        console.log("Salvando objeto:", novoComentario); // Para você conferir no F12

        await commentsRef.push(novoComentario);

        alert("Mensagem salva com sucesso!");
        closeModal();

    } catch (error) {
        console.error("Erro ao salvar no Firebase:", error);
        alert("Erro ao salvar mensagem.");
    }
}

// Procure por esta função no seu main.js e substitua:
function renderComments() {
    const container = document.getElementById('commentsList');
    const indicator = document.getElementById('commentPageIndicator');
    if (!container) return; // Segurança caso o elemento não exista

    container.innerHTML = '';

    const startIndex = (currentCommentPage - 1) * commentsPerPage;
    const endIndex = startIndex + commentsPerPage;
    const paginatedComments = allComments.slice(startIndex, endIndex);

    if (paginatedComments.length === 0) {
        container.innerHTML = '<p class="no-comments">Ainda não há recados. Seja o primeiro!</p>';
    } else {
        paginatedComments.forEach(msg => {
            const div = document.createElement('div');
            div.className = 'comment-card';
            
            // Ajustado para os campos exatos que salvamos no passo anterior:
            // msg.name, msg.giftItem e msg.text
            div.innerHTML = `
                <div class="comment-header" style="margin-bottom: 8px;">
                    <strong style="color: var(--primary); display: block;">${msg.name || "Convidado"}</strong>
                    <small style="color: #888; font-size: 0.8em;">
                        Presenteou com: <strong>${msg.giftItem || 'Presente'}</strong>
                    </small>
                </div>
                <p style="font-style: italic; color: #444; margin: 0;">"${msg.text || ''}"</p>
                <small style="display: block; text-align: right; font-size: 0.7em; color: #aaa; margin-top: 5px;">
                    ${msg.date || ''}
                </small>
            `;
            container.appendChild(div);
        });
    }

    if (indicator) indicator.innerText = `Página ${currentCommentPage}`;

    // Atualiza estado dos botões de navegação
    const btnPrev = document.getElementById('prevComments');
    const btnNext = document.getElementById('nextComments');
    if (btnPrev) btnPrev.disabled = (currentCommentPage === 1);
    if (btnNext) btnNext.disabled = (endIndex >= allComments.length);
}

commentsRef.on('value', (snapshot) => {
        const data = snapshot.val();
        allComments = [];
        if (data) {
            // Converte objeto em array e ordena pelo mais recente
            allComments = Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
        }
        renderComments(); // Chama a função para desenhar na tela
    });

        document.getElementById('prevComments').onclick = () => {
        if (currentCommentPage > 1) {
            currentCommentPage--;
            renderComments();
        }
    };

    document.getElementById('nextComments').onclick = () => {
        if ((currentCommentPage * commentsPerPage) < allComments.length) {
            currentCommentPage++;
            renderComments();
        }
    };
    });


}