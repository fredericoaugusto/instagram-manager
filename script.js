// Função para limpar os dados salvos e recarregar a página
function clearDataAndReload() {
    if (confirm("Isso apagará os dados carregados e o progresso salvo. Você precisará carregar os arquivos .json novamente. Deseja continuar?")) {
        localStorage.removeItem('instagram-following-data');
        localStorage.removeItem('instagram-followers-data');
        localStorage.removeItem('instagram-following-state');
        localStorage.removeItem('instagram-followers-state');
        window.location.reload();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const followingData = localStorage.getItem('instagram-following-data');
    const followersData = localStorage.getItem('instagram-followers-data');
    
    // Verifica se os dados já existem no localStorage ao carregar a página
    if (followingData && followersData) {
        // Se os dados existem, esconde os inputs de arquivo e mostra a ferramenta
        document.querySelector('.controls').style.display = 'none';
        document.querySelector('.main-content').style.display = 'block';
        
        console.log("Dados carregados a partir da memória do navegador.");
        processData(JSON.parse(followingData).relationships_following, 'following');
        processData(JSON.parse(followersData), 'followers');
    } else {
        // Se não existem, mostra os inputs para o primeiro carregamento
        document.querySelector('.controls').style.display = 'block';
        document.querySelector('.main-content').style.display = 'none';
    }

    // Lógica para alternar entre as abas
    window.showTab = (tabName) => {
        document.querySelectorAll('.kanban-container, .tab-button').forEach(el => el.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');
        document.querySelector(`.tab-button[onclick="showTab('${tabName}')"]`).classList.add('active');
    };

    // Função que lê os arquivos selecionados pelo usuário
    const loadFile = (event, type) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const fileContent = e.target.result;
            // Salva o conteúdo completo do arquivo no localStorage
            localStorage.setItem(`instagram-${type}-data`, fileContent);
            
            // Verifica se ambos os arquivos foram carregados para recarregar a página e aplicar a nova visualização
            if (localStorage.getItem('instagram-following-data') && localStorage.getItem('instagram-followers-data')) {
                window.location.reload(); 
            }
        };
        reader.readAsText(file);
    };

    document.getElementById('following-file').addEventListener('change', (e) => loadFile(e, 'following'));
    document.getElementById('followers-file').addEventListener('change', (e) => loadFile(e, 'followers'));

    // Processa os dados (lidos dos arquivos ou do localStorage) e cria os cards na tela
    const processData = (data, type) => {
        if (!data) return;
        document.getElementById(`${type}-count`).textContent = data.length;
        
        const storageKey = `instagram-${type}-state`;
        let savedState = {};
        try {
            savedState = JSON.parse(localStorage.getItem(storageKey)) || {};
        } catch (e) {
            console.error("Erro ao ler o estado salvo:", e);
            savedState = {};
        }

        document.querySelectorAll(`#${type} .cards`).forEach(col => col.innerHTML = '');

        data.forEach(item => {
            const username = item.string_list_data[0].value;
            const url = item.string_list_data[0].href;
            
            const card = document.createElement('div');
            card.className = 'card';
            card.id = `${type}-${username}`;
            card.innerHTML = `<a href="${url}" target="_blank">${username}</a>`;

            const columnId = savedState[username] || `${type}-later`;
            const column = document.getElementById(columnId);
            if (column) {
                 column.querySelector('.cards').appendChild(card);
            } else {
                // Fallback para a primeira coluna caso algo dê errado
                document.getElementById(`${type}-later`).querySelector('.cards').appendChild(card);
            }
        });
    };
    
    // Função para salvar o estado de organização dos cards no localStorage
    const saveState = () => {
        const types = ['following', 'followers'];
        types.forEach(type => {
            const state = {};
            document.querySelectorAll(`#${type} .card`).forEach(card => {
                const username = card.id.replace(`${type}-`, '');
                const columnId = card.parentElement.dataset.column;
                state[username] = columnId;
            });
            localStorage.setItem(`instagram-${type}-state`, JSON.stringify(state));
        });
        console.log("Progresso salvo!");
    };

    // Inicializa a funcionalidade de arrastar e soltar (drag and drop)
    document.querySelectorAll('.cards').forEach(cardsContainer => {
        new Sortable(cardsContainer, {
            group: cardsContainer.closest('.kanban-container').id,
            animation: 150,
            onEnd: saveState // Chama a função saveState sempre que um card é movido
        });
    });
});