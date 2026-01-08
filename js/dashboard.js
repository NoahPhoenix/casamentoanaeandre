export function inicializarDashboard(convidadosRef) {
    const userSalvo = import.meta.env.VITE_DASH_USER;
    const passSalvo = import.meta.env.VITE_DASH_PASS;
    const modal = document.getElementById('loginModal');

    // Função interna para validar
    window.verificarAcesso = () => {
        const u = document.getElementById('loginUser').value;
        const p = document.getElementById('loginPass').value;

        if (u === userSalvo && p === passSalvo) {
            sessionStorage.setItem('dash_auth', 'true');
            modal.style.display = 'none'; // Libera o dashboard
        } else {
            alert("Credenciais incorretas!");
        }
    };

    const inputs = [document.getElementById('loginUser'), document.getElementById('loginPass')];
    inputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                window.verificarAcesso();
            }
        });
    });

    window.limparTodosConvidados = () => {
        // Primeira confirmação
        if (confirm("⚠️ ATENÇÃO: Você está prestes a apagar TODOS os convidados da base de dados. Esta ação não pode ser desfeita. Deseja continuar?")) {

            // Segunda confirmação de segurança
            if (confirm("Tem certeza absoluta? Todos os registros de confirmação e links enviados serão perdidos.")) {
                convidadosRef.remove()
                    .then(() => {
                        alert("Base de dados limpa com sucesso!");
                        editandoId = null; // Garante que sai de qualquer modo de edição
                    })
                    .catch((error) => {
                        alert("Erro ao apagar dados: " + error.message);
                    });
            }
        }
    };

    const listaConvidadosTabela = document.getElementById('listaConvidados');
    let dadosLocais = {};
    let editandoId = null;

    // --- FUNÇÕES GLOBAIS ---

    window.adicionarConvidado = () => {
        if (editandoId) return alert("Finalize a edição atual primeiro.");
        const n = document.getElementById('nome').value;
        const e = document.getElementById('email').value;
        const w = document.getElementById('whatsapp').value;
        if (!n) return alert("Digite o nome!");
        convidadosRef.push({ nome: n, email: e, whatsapp: w, status: 'nao_enviado' });
        document.getElementById('nome').value = '';
        document.getElementById('email').value = '';
        document.getElementById('whatsapp').value = '';
    };

    window.ativarEdicao = (id) => {
        editandoId = id;
        renderizarTabela();
    };

    window.cancelarEdicao = () => {
        editandoId = null;
        renderizarTabela();
    };

    window.salvarEdicao = (id) => {
        const novoNome = document.getElementById('edit-nome-field').value;
        const novoEmail = document.getElementById('edit-email-field').value;
        const novoWhats = document.getElementById('edit-whats-field').value;

        if (!novoNome) return alert("O nome é obrigatório!");

        // 1. Primeiro resetamos o estado de edição para "fechar" a linha
        editandoId = null;

        // 2. Depois enviamos ao Firebase
        convidadosRef.child(id).update({
            nome: novoNome,
            email: novoEmail,
            whatsapp: novoWhats
        }).then(() => {
            console.log("Edição salva com sucesso.");
        }).catch((error) => {
            alert("Erro ao salvar: " + error.message);
        });

        // Forçamos uma renderização imediata para fechar o campo
        renderizarTabela();
    };

    window.excluirConvidado = (id) => {
        if (confirm("Deseja realmente excluir este convidado?")) {
            if (editandoId === id) editandoId = null;
            convidadosRef.child(id).remove();
        }
    };

    window.toggleStatus = (id, checked) => {
        if (editandoId) return;
        convidadosRef.child(id).update({ status: checked ? 'enviado' : 'nao_enviado' });
    };

    window.copiarLink = (id) => {
        // Link não é bloqueado por edição global para facilitar uso rápido
        const link = `${window.location.origin}?id=${id}`;
        navigator.clipboard.writeText(link).then(() => alert("Link copiado!"));
    };

    window.enviar = (id, tipo) => {
        const c = dadosLocais[id];
        const link = `${window.location.origin}?id=${id}`;
        const msg = `Olá ${c.nome}! Preparamos um convite especial para você. Veja aqui: ${link}`;
        if (tipo === 'whats') window.open(`https://api.whatsapp.com/send?phone=55${c.whatsapp}&text=${encodeURIComponent(msg)}`);
        else window.location.href = `mailto:${c.email}?subject=Nosso Convite&body=${encodeURIComponent(msg)}`;

        if (c.status === 'nao_enviado') convidadosRef.child(id).update({ status: 'enviado' });
    };

    const renderizarTabela = () => {
        if (!listaConvidadosTabela) return;
        listaConvidadosTabela.innerHTML = '';

        let t = 0, p = 0, e = 0, c_count = 0;
        const anyActiveEdit = editandoId !== null;

        // Bloqueia inputs de cadastro superior se estiver editando
        const inputCadastros = document.querySelectorAll('.input-group input, .btn-add');
        inputCadastros.forEach(el => el.disabled = anyActiveEdit);

        Object.keys(dadosLocais).forEach(id => {
            const c = dadosLocais[id]; t++;
            const isConfirmed = c.status === 'confirmado';
            const isBeingEdited = editandoId === id;

            if (isConfirmed) { c_count++; e++; }
            else if (c.status === 'enviado') e++;
            else p++;

            const st = {
                'confirmado': { label: 'Confirmado', class: 'st-confirmado', icon: '✅' },
                'enviado': { label: 'Enviado', class: 'st-enviado', icon: '🔵' },
                'nao_enviado': { label: 'Pendente', class: 'st-nao_enviado', icon: '⚪' }
            }[c.status] || { label: 'Pendente', class: 'st-nao_enviado', icon: '⚪' };

            const tr = document.createElement('tr');

            if (isBeingEdited) {
                tr.innerHTML = `
                    <td>-</td>
                    <td><input type="text" id="edit-nome-field" value="${c.nome}"></td>
                    <td><input type="text" id="edit-email-field" value="${c.email || ''}"></td>
                    <td><input type="text" id="edit-whats-field" value="${c.whatsapp || ''}"></td>
                    <td>-</td>
                    <td class="manage-cell">
                        <button class="btn-action btn-save" onclick="salvarEdicao('${id}')">💾</button>
                        <button class="btn-action btn-cancel" onclick="cancelarEdicao()">❌</button>
                    </td>`;
            } else {
                // REGRAS DE BLOQUEIO:
                // Enviar (Email/Whats) e Switch: Bloqueiam se CONFIRMADO ou se houver EDIÇÃO ATIVA em qualquer linha.
                // Copiar Link: Bloqueia apenas se houver EDIÇÃO ATIVA em qualquer linha (mas liberado para Confirmados).
                // Gerenciar (Editar/Excluir): Bloqueia se houver EDIÇÃO ATIVA em qualquer linha.

                const disableEnvio = isConfirmed || anyActiveEdit;
                const disableGeral = anyActiveEdit;

                tr.innerHTML = `
                    <td data-label="Status"><div class="status-pill ${st.class}">${st.icon} ${st.label}</div></td>
                    <td data-label="Nome"><strong>${c.nome}</strong></td>
                    <td data-label="E-mail">${c.email || '-'}</td>
                    <td data-label="WhatsApp">${c.whatsapp || '-'}</td>
                    <td data-label="Envio">
                        <div class="actions-cell">
                            <button class="btn-action btn-email" onclick="enviar('${id}','email')" ${disableEnvio ? 'disabled' : ''}>📧</button>
                            <button class="btn-action btn-whats" onclick="enviar('${id}','whats')" ${disableEnvio ? 'disabled' : ''}>📱</button>
                            <button class="btn-action btn-copy" onclick="copiarLink('${id}')" ${disableGeral ? 'disabled' : ''}>🔗</button>
                            <input type="checkbox" ${c.status !== 'nao_enviado' ? 'checked' : ''} onchange="toggleStatus('${id}', this.checked)" ${disableEnvio ? 'disabled' : ''}>
                        </div>
                    </td>
                    <td data-label="Gerenciar">
                        <div class="manage-cell">
                            <button class="btn-action btn-edit" onclick="ativarEdicao('${id}')" ${disableGeral ? 'disabled' : ''}>✏️</button>
                            <button class="btn-action btn-delete" onclick="excluirConvidado('${id}')" ${disableGeral ? 'disabled' : ''}>🗑️</button>
                        </div>
                    </td>`;
            }
            listaConvidadosTabela.appendChild(tr);
        });

        // Atualiza Stats
        if (document.getElementById('statTotal')) document.getElementById('statTotal').innerText = t;
        if (document.getElementById('statPendente')) document.getElementById('statPendente').innerText = p;
        if (document.getElementById('statEnviado')) document.getElementById('statEnviado').innerText = e;
        if (document.getElementById('statConfirmado')) document.getElementById('statConfirmado').innerText = c_count;
    };

    convidadosRef.on('value', snap => {
        dadosLocais = snap.val() || {};
        renderizarTabela();
    });

   // --- FUNÇÃO PARA EXPORTAR PLANILHA ---
window.gerarPlanilha = () => {
    if (!dadosLocais || Object.keys(dadosLocais).length === 0) {
        return alert("Não há dados para exportar.");
    }

    // Cabeçalho do arquivo CSV (com \ufeff para o Excel entender os acentos)
    let csv = '\ufeffNome,E-mail,WhatsApp,Status\n';

    // Percorre os dados locais e monta as linhas
    Object.values(dadosLocais).forEach(c => {
        const nome = c.nome || '-';
        const email = c.email || '-';
        const whats = c.whatsapp || '-';
        const status = c.status === 'confirmado' ? 'Confirmado' : (c.status === 'enviado' ? 'Enviado' : 'Pendente');
        
        csv += `"${nome}","${email}","${whats}","${status}"\n`;
    });

    // Cria o link invisível para download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `lista_convidados_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`;
    link.click();
};

// Vincula o clique do botão ID btnExportar à função acima
const btnExportar = document.getElementById('btnExportar');
if (btnExportar) {
    btnExportar.onclick = () => window.gerarPlanilha();
}

}