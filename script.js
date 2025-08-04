document.addEventListener('DOMContentLoaded', () => {

    // ===================================================================
    // --- 1. DEFINIÇÃO DE TODAS AS FUNÇÕES AUXILIARES ---
    // ===================================================================

    window.clearDataAndReload = function() {
        if (confirm("Isso apagará os dados carregados e o progresso salvo de TODAS as abas. Você precisará carregar os arquivos .json novamente. Deseja continuar?")) {
            localStorage.clear();
            window.location.reload();
        }
    }

    window.showTab = function(tabName) {
        document.querySelectorAll('.kanban-container, .tab-button').forEach(el => el.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');
        document.querySelector(`.tab-button[onclick="showTab('${tabName}')"]`).classList.add('active');
    };

    const loadFile = (event, type) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const fileContent = e.target.result;
            localStorage.setItem(`instagram-${type}-data`, fileContent);
            if (localStorage.getItem('instagram-following-data') && localStorage.getItem('instagram-followers-data')) {
                window.location.reload(); 
            }
        };
        reader.readAsText(file);
    };

    // FUNÇÃO REFEITA E SIMPLIFICADA PARA EVITAR O ERRO
    const processData = (userList, type) => {
        if (!userList) {
            console.error(`Lista de usuários para o tipo "${type}" é inválida.`);
            return;
        }
        
        const countSpan = document.getElementById(`${type}-count`);
        if(countSpan) {
            countSpan.textContent = userList.length;
        }
        
        const storageKey = `instagram-${type}-state`;
        let savedState = JSON.parse(localStorage.getItem(storageKey)) || {};

        document.querySelectorAll(`#${type} .cards`).forEach(col => col.innerHTML = '');

        let index = 0;
        userList.forEach(item => {
            if (item.string_list_data && item.string_list_data[0]) {
                const username = item.string_list_data[0].value;
                const url = item.string_list_data[0].href;
                
                const card = document.createElement('div');
                card.className = 'card';
                card.id = `${type}-${username}`;
                card.dataset.username = username.toLowerCase();
                card.dataset.originalIndex = index++;
                card.innerHTML = `<a href="${url}" target="_blank">${username}</a>`;

                // Lógica de posicionamento foi trazida para DENTRO desta função
                const defaultColumn = document.querySelector(`#${type} .kanban-column`);
                const defaultColumnId = defaultColumn ? defaultColumn.id : '';
                const columnId = savedState[username] || defaultColumnId;
                const column = document.getElementById(columnId);

                if (column) {
                     column.querySelector('.cards').appendChild(card);
                } else if (defaultColumn) {
                    defaultColumn.querySelector('.cards').appendChild(card);
                }
            }
        });
    };

    const performComparison = (followers, following) => {
        const followersUsernames = new Set(followers.map(u => u.string_list_data[0].value));
        const followingUsernames = new Set(following.map(u => u.string_list_data[0].value));

        const notFollowingMeBack = following.filter(u => !followersUsernames.has(u.string_list_data[0].value));
        const iDontFollowBack = followers.filter(u => !followingUsernames.has(u.string_list_data[0].value));

        processData(notFollowingMeBack, 'not-following-me-back');
        processData(iDontFollowBack, 'i-dont-follow-back');
    };

    const updateAllCounts = () => {
        document.querySelectorAll('.kanban-column').forEach(column => {
            const count = column.querySelectorAll('.card').length;
            column.querySelector('.column-count').textContent = `(${count})`;
        });
        
        const initialFollowing = JSON.parse(localStorage.getItem('initial-following-count') || '0');
        const initialFollowers = JSON.parse(localStorage.getItem('initial-followers-count') || '0');

        const unfollowCount1 = document.querySelectorAll('#following-unfollow .card').length;
        const unfollowCount2 = document.querySelectorAll('#not-following-me-back-unfollow .card').length;
        const removeCount = document.querySelectorAll('#followers-remove .card').length;

        document.getElementById('live-following-count').textContent = initialFollowing - unfollowCount1 - unfollowCount2;
        document.getElementById('live-followers-count').textContent = initialFollowers - removeCount;
    };
    
    const saveState = () => {
        const types = ['following', 'followers', 'not-following-me-back', 'i-dont-follow-back'];
        types.forEach(type => {
            const state = {};
            document.querySelectorAll(`#${type} .card`).forEach(card => {
                const username = card.id.replace(`${type}-`, '');
                const columnId = card.parentElement.dataset.column;
                state[username] = columnId;
            });
            localStorage.setItem(`instagram-${type}-state`, JSON.stringify(state));
        });
        updateAllCounts();
        console.log("Progresso salvo e contadores atualizados!");
    };
    
    const initializeSortable = () => {
        const allCardContainers = document.querySelectorAll('.cards');
        allCardContainers.forEach(container => {
            new Sortable(container, {
                group: container.closest('.kanban-container').id,
                animation: 200,
                multiDrag: true,
                selectedClass: 'selected-card',
                fallbackOnBody: true,
                invertSwap: true,
                onEnd: saveState
            });
        });
        console.log("Drag-and-drop com Multi-seleção inicializado.");
    };

    const extractUserList = (fullData) => {
        if (Array.isArray(fullData)) return fullData;
        const key = Object.keys(fullData).find(k => Array.isArray(fullData[k]));
        return key ? fullData[key] : [];
    };

    const filterCards = (event) => {
        const searchTerm = event.target.value.toLowerCase();
        const activeTab = document.querySelector('.kanban-container.active');
        if (!activeTab) return;

        activeTab.querySelectorAll('.card').forEach(card => {
            const username = card.dataset.username;
            if (username.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    };

    const sortCards = (event) => {
        const sortType = event.target.dataset.sort;
        const activeTab = document.querySelector('.kanban-container.active');
        if (!activeTab) return;

        activeTab.querySelectorAll('.cards').forEach(container => {
            const cards = Array.from(container.querySelectorAll('.card'));
            
            cards.sort((a, b) => {
                if (sortType === 'az') {
                    return a.dataset.username.localeCompare(b.dataset.username);
                } else if (sortType === 'za') {
                    return b.dataset.username.localeCompare(a.dataset.username);
                } else if (sortType === 'default') {
                    return parseInt(a.dataset.originalIndex) - parseInt(b.dataset.originalIndex);
                }
                return 0;
            });

            cards.forEach(card => container.appendChild(card));
        });
    };

    // ===================================================================
    // --- 2. LÓGICA PRINCIPAL DE EXECUÇÃO ---
    // ===================================================================

    document.getElementById('following-file').addEventListener('change', (e) => loadFile(e, 'following'));
    document.getElementById('followers-file').addEventListener('change', (e) => loadFile(e, 'followers'));

    const followingDataJSON = localStorage.getItem('instagram-following-data');
    const followersDataJSON = localStorage.getItem('instagram-followers-data');
    
    if (followingDataJSON && followersDataJSON) {
        document.querySelector('.controls').style.display = 'none';
        document.querySelector('.main-content').style.display = 'block';
        
        try {
            const followingList = extractUserList(JSON.parse(followingDataJSON));
            const followersList = extractUserList(JSON.parse(followersDataJSON));

            if (!localStorage.getItem('initial-following-count')) {
                localStorage.setItem('initial-following-count', followingList.length);
            }
            if (!localStorage.getItem('initial-followers-count')) {
                localStorage.setItem('initial-followers-count', followersList.length);
            }
            
            // Agora o processData faz tudo: cria e posiciona os cards
            processData(followingList, 'following');
            processData(followersList, 'followers');
            performComparison(followersList, followingList);

            // Conectar eventos para busca e ordenação
            document.querySelectorAll('.search-input').forEach(input => input.addEventListener('keyup', filterCards));
            document.querySelectorAll('.sort-btn').forEach(btn => btn.addEventListener('click', sortCards));

            initializeSortable();
            updateAllCounts();
            showTab('following');

        } catch (error) {
            console.error("Ocorreu um erro ao processar os dados.", error);
            alert("Ocorreu um erro ao processar seus dados. Limpe os dados e carregue os arquivos novamente para resolver.");
        }

    } else {
        document.querySelector('.controls').style.display = 'block';
        document.querySelector('.main-content').style.display = 'none';
    }
});