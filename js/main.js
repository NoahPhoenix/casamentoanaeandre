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

// Inicialização (Compat v9)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();
const convidadosRef = database.ref('wedding/convidados');

// --- 2. LÓGICA DO CONVITE (Apenas se existir o container do envelope) ---
const mainContainer = document.getElementById('mainContainer');
if (mainContainer) {
    // Timer
    const atualizarTimer = () => {
        const dataEvento = new Date(2026, 6, 11, 16, 0, 0).getTime();
        setInterval(() => {
            const agora = new Date().getTime();
            const distancia = dataEvento - agora;
            if (distancia < 0) return;
            document.getElementById("days").innerText = Math.floor(distancia / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');
            document.getElementById("hours").innerText = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
            document.getElementById("mins").innerText = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
            document.getElementById("secs").innerText = Math.floor((distancia % (1000 * 60)) / 1000).toString().padStart(2, '0');
        }, 1000);
    };

    // Confirmação
    const urlParams = new URLSearchParams(window.location.search);
    const convidadoId = urlParams.get('id');

    const gerenciarConfirmacao = () => {
        convidadosRef.on('value', (snapshot) => {
            let total = 0;
            snapshot.forEach((child) => { if (child.val().status === 'confirmado') total++; });
            document.getElementById('guestCount').innerText = total;
        });

        if (convidadoId) {
            const userRef = database.ref(`wedding/convidados/${convidadoId}`);
            userRef.on('value', (snapshot) => {
                if (snapshot.val()?.status === 'confirmado') {
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
    };

    mainContainer.addEventListener('click', function() {
        if (!this.classList.contains('open')) {
            confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, zIndex: 1000 });
            this.classList.add('open');
        }
    });

    atualizarTimer();
    gerenciarConfirmacao();
}

// --- 3. LÓGICA DO DASHBOARD (Apenas se existir a tabela de convidados) ---
const listaConvidadosTabela = document.getElementById('listaConvidados');
if (listaConvidadosTabela) {
    let dadosLocais = {};
    let editandoId = null;

    // Tornar funções globais para funcionarem com os onclicks que restaram (ou migrar para addEventListener)
    window.adicionarConvidado = () => {
        const n = document.getElementById('nome').value;
        const e = document.getElementById('email').value;
        const w = document.getElementById('whatsapp').value;
        if (!n) return alert("Digite o nome!");
        convidadosRef.push({ nome: n, email: e, whatsapp: w, status: 'nao_enviado' });
        document.getElementById('nome').value = ''; document.getElementById('email').value = ''; document.getElementById('whatsapp').value = '';
    };

    window.salvarEdicao = (id) => {
        const novoNome = document.getElementById('edit-nome-field').value;
        convidadosRef.child(id).update({
            nome: novoNome,
            email: document.getElementById('edit-email-field').value,
            whatsapp: document.getElementById('edit-whats-field').value
        }).then(() => { editandoId = null; });
    };

    window.ativarEdicao = (id) => { editandoId = id; renderizarTabela(); };
    window.cancelarEdicao = () => { editandoId = null; renderizarTabela(); };
    window.toggleStatus = (id, checked) => convidadosRef.child(id).update({status: checked ? 'enviado' : 'nao_enviado'});
    window.excluirConvidado = (id) => { if(confirm("Excluir convidado?")) convidadosRef.child(id).remove(); };
    window.copiarLink = (id) => {
        const link = `https://casamentoanaeandre-otn1.vercel.app/convite.html?id=${id}`;
        navigator.clipboard.writeText(link).then(() => alert("Link copiado!"));
    };

    window.enviar = (id, tipo) => {
        const c = dadosLocais[id];
        const link = `https://casamentoanaeandre-otn1.vercel.app/convite.html?id=${id}`;
        const msg = `Olá ${c.nome}! Preparamos um convite para você: ${link}`;
        if(tipo==='whats') window.open(`https://api.whatsapp.com/send?phone=55${c.whatsapp}&text=${encodeURIComponent(msg)}`);
        else window.location.href = `mailto:${c.email}?subject=Nosso Convite&body=${encodeURIComponent(msg)}`;
        convidadosRef.child(id).update({status: 'enviado'});
    };

    const renderizarTabela = () => {
        listaConvidadosTabela.innerHTML = '';
        let t=0, p=0, e=0, c_count=0;
        
        Object.keys(dadosLocais).forEach(id => {
            const c = dadosLocais[id]; t++;
            if(c.status === 'confirmado') { c_count++; e++; }
            else if(c.status === 'enviado') e++;
            else p++;

            const tr = document.createElement('tr');
            if(editandoId === id) {
                tr.innerHTML = `<td colspan="5">Modo Edição Ativado</td><td><button onclick="salvarEdicao('${id}')">Salvar</button></td>`;
            } else {
                tr.innerHTML = `<td data-label="Nome">${c.nome}</td>
                    <td data-label="Ações">
                        <button onclick="copiarLink('${id}')">🔗</button>
                        <button onclick="enviar('${id}', 'whats')">📱</button>
                        <button onclick="excluirConvidado('${id}')">🗑️</button>
                    </td>`;
            }
            listaConvidadosTabela.appendChild(tr);
        });
        // Atualiza os contadores se os IDs existirem
        if(document.getElementById('statTotal')) document.getElementById('statTotal').innerText = t;
    };

    convidadosRef.on('value', snap => { dadosLocais = snap.val() || {}; renderizarTabela(); });

    // Botão de Exportar
    const btnExportar = document.getElementById('btnExportar');
    if (btnExportar) {
        btnExportar.addEventListener('click', () => {
            const cabecalho = [["NOME", "STATUS", "LINK"]];
            const dados = Object.keys(dadosLocais).map(id => [dadosLocais[id].nome, dadosLocais[id].status, `https://.../convite.html?id=${id}`]);
            const ws = XLSX.utils.aoa_to_sheet(cabecalho.concat(dados));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Convidados");
            XLSX.writeFile(wb, `Lista_Convidados.xlsx`);
        });
    }
}