document.addEventListener('DOMContentLoaded', () => {
    // Inicializa a lógica de abas
    window.showTab = (tabName) => {
        document.querySelectorAll('.kanban-container, .tab-button').forEach(el => el.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');
        document.querySelector(`.tab-button[onclick="showTab('${tabName}')"]`).classList.add('active');
    };

    // Carrega dados dos arquivos JSON
    const loadFile = (event, type) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = JSON.parse(e.target.result);
            const list = (type === 'following') ? data.relationships_following : data;
            processData(list, type);
        };
        reader.readAsText(file);
    };

    document.getElementById('following-file').addEventListener('change', (e) => loadFile(e, 'following'));
    document.getElementById('followers-file').addEventListener('change', (e) => loadFile(e, 'followers'));

    // Processa os dados e cria os cards
    const processData = (data, type) => {
        document.getElementById(`${type}-count`).textContent = data.length;

        const storageKey = `instagram-${type}-state`;
        let savedState = {};
        try {
            savedState = JSON.parse(localStorage.getItem(storageKey)) || {};
        } catch (e) {
            console.error("Erro ao ler o localStorage:", e);
            savedState = {};
        }

        // Limpa colunas antes de popular
        document.querySelectorAll(`#${type} .cards`).forEach(col => col.innerHTML = '');

        data.forEach(item => {
            const username = item.string_list_data[0].value;
            const url = item.string_list_data[0].href;

            const card = document.createElement('div');
            card.className = 'card';
            card.id = `${type}-${username}`;
            card.innerHTML = `<a href="${url}" target="_blank">${username}</a>`;

            // Coloca o card na coluna salva ou na padrão "Ver Mais Tarde"
            const columnId = savedState[username] || `${type}-later`;
            const column = document.getElementById(columnId);
            if(column) {
                 column.querySelector('.cards').appendChild(card);
            } else {
                document.getElementById(`${type}-later`).querySelector('.cards').appendChild(card);
            }
        });
    };

    // Função para salvar o estado no navegador
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
         console.log("Estado salvo!");
    };

    // Inicializa o SortableJS (drag and drop) e o salvamento
    document.querySelectorAll('.cards').forEach(cardsContainer => {
        new Sortable(cardsContainer, {
            group: cardsContainer.closest('.kanban-container').id,
            animation: 150,
            onEnd: saveState // Salva o estado sempre que um card é movido
        });
    });

    // Carrega o estado salvo ao iniciar (se os arquivos já tiverem sido carregados antes)
    // Isso é mais complexo, a abordagem atual recria os cards a cada carregamento de arquivo
    // e os posiciona corretamente, o que é mais simples e eficaz para este caso de uso.
});