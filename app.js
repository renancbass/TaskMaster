// ====== GERENCIAMENTO DE DADOS ======
// Modelo de dados
let taskData = {
    tasks: [],
    groups: [
        { id: 'all', name: 'Todas as Tarefas' },
        { id: 'work', name: 'Trabalho' },
        { id: 'personal', name: 'Pessoal' },
        { id: 'shopping', name: 'Compras' }
    ],
    currentFilter: 'all'
};

// Função para gerar ID único
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ====== PERSISTÊNCIA DE DADOS ======
// Carregar dados do Firebase
function loadData() {
    tasksRef.once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                taskData = snapshot.val();
            } else {
                // Dados de exemplo para primeira execução
                taskData = {
                    tasks: [
                        {
                            id: generateId(),
                            title: 'Criar apresentação para reunião',
                            dueDate: '2025-03-18',
                            group: 'work',
                            completed: false,
                            priority: 'high',
                            tags: ['trabalho', 'urgente'],
                            description: 'Preparar slides para a apresentação trimestral'
                        },
                        {
                            id: generateId(),
                            title: 'Comprar mantimentos',
                            dueDate: '2025-03-20',
                            group: 'shopping',
                            completed: false,
                            priority: 'medium',
                            tags: ['pessoal'],
                            description: 'Leite, ovos, pão, frutas'
                        },
                        {
                            id: generateId(),
                            title: 'Finalizar relatório de vendas',
                            dueDate: '2025-03-25',
                            group: 'work',
                            completed: false,
                            priority: 'high',
                            tags: ['trabalho'],
                            description: 'Compilar dados do último trimestre'
                        },
                        {
                            id: generateId(),
                            title: 'Pesquisar opções para viagem',
                            dueDate: '2025-04-01',
                            group: 'personal',
                            completed: false,
                            priority: 'low',
                            tags: ['pessoal', 'para depois'],
                            description: 'Verificar pacotes para férias de julho'
                        }
                    ],
                    groups: [
                        { id: 'all', name: 'Todas as Tarefas' },
                        { id: 'work', name: 'Trabalho' },
                        { id: 'personal', name: 'Pessoal' },
                        { id: 'shopping', name: 'Compras' }
                    ],
                    currentFilter: 'all'
                };
                saveData();
            }
            renderGroups();
            renderTasks();
        })
        .catch((error) => {
            console.error("Erro ao carregar dados:", error);
            // Fallback para localStorage em caso de erro
            const savedData = localStorage.getItem('taskMasterData');
            if (savedData) {
                taskData = JSON.parse(savedData);
            }
            renderGroups();
            renderTasks();
        });
}

// Salvar dados no Firebase
function saveData() {
    tasksRef.set(taskData)
        .then(() => {
            // Backup local em caso de falha na conexão
            localStorage.setItem('taskMasterData', JSON.stringify(taskData));
        })
        .catch((error) => {
            console.error("Erro ao salvar dados:", error);
            // Salvar localmente se falhar o Firebase
            localStorage.setItem('taskMasterData', JSON.stringify(taskData));
        });
}

// ====== RENDERIZAÇÃO DA INTERFACE ======
// Renderizar lista de grupos
function renderGroups() {
    const groupList = document.getElementById('groupList');
    const taskGroupSelect = document.getElementById('taskGroup');
    
    // Limpar listas
    groupList.innerHTML = '';
    taskGroupSelect.innerHTML = '';
    
    // Adicionar grupos à sidebar e ao select do formulário
    taskData.groups.forEach(group => {
        // Contar tarefas por grupo
        let count = 0;
        if (group.id === 'all') {
            count = taskData.tasks.length;
        } else {
            count = taskData.tasks.filter(task => task.group === group.id).length;
        }
        
        // Adicionar à sidebar
        const li = document.createElement('li');
        li.dataset.groupId = group.id;
        li.innerHTML = `${group.name} <span class="count">${count}</span>`;
        
        if (group.id === taskData.currentFilter) {
            li.classList.add('active');
        }
        
        li.addEventListener('click', () => {
            taskData.currentFilter = group.id;
            document.querySelectorAll('.group-list li').forEach(i => i.classList.remove('active'));
            li.classList.add('active');
            document.querySelector('.main-header h2').textContent = group.name;
            renderTasks();
            saveData();
        });
        
        groupList.appendChild(li);
        
        // Adicionar ao select do formulário
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        taskGroupSelect.appendChild(option);
    });
}

// Renderizar lista de tarefas
function renderTasks() {
    const taskList = document.getElementById('taskList');
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    
    // Limpar lista
    taskList.innerHTML = '';
    
    // Filtrar tarefas
    let filteredTasks = taskData.tasks;
    
    if (taskData.currentFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.group === taskData.currentFilter);
    }
    
    if (searchInput) {
        filteredTasks = filteredTasks.filter(task => 
            task.title.toLowerCase().includes(searchInput) || 
            (task.description && task.description.toLowerCase().includes(searchInput))
        );
    }
    
    // Mostrar mensagem se não houver tarefas
    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state-message">
                <p>Nenhuma tarefa encontrada.</p>
                <p>Clique em "+ Nova Tarefa" para adicionar.</p>
            </div>
        `;
        return;
    }
    
    // Ordenar tarefas: primeiro por prioridade, depois não concluídas, depois por data
    filteredTasks.sort((a, b) => {
        // Primeiro por status (não concluídas primeiro)
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        
        // Depois por prioridade (alta > média > baixa)
        const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
        const priorityA = priorityOrder[a.priority || 'medium'];
        const priorityB = priorityOrder[b.priority || 'medium'];
        
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }
        
        // Por último, por data
        return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31');
    });
    
    // Adicionar tarefas à lista
    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.dataset.taskId = task.id;
        
        // Formatar data
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : '';
        
        // Preparar tags HTML
        const tagsHtml = task.tags && task.tags.length > 0 ? task.tags.map(tag => {
            let tagClass = 'tag';
            if (tag === 'trabalho') tagClass += ' work';
            if (tag === 'pessoal') tagClass += ' personal';
            if (tag === 'urgente') tagClass += ' urgent';
            if (tag === 'para depois') tagClass += ' later';
            return `<span class="${tagClass}">${tag}</span>`;
        }).join('') : '';
        
        // Preparar indicador de prioridade
        const priorityClass = task.priority ? `priority-${task.priority}` : 'priority-medium';
        const priorityDot = `<span class="task-priority ${priorityClass}"></span>`;
        
        li.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'checked' : ''}"></div>
            <div class="task-content">
                <div class="task-title">${priorityDot} ${task.title}</div>
                <div class="task-details">
                    <div class="task-date">📅 ${dueDate}</div>
                </div>
                <div class="task-tags">
                    ${tagsHtml}
                </div>
            </div>
            <div class="task-actions">
                <button class="btn btn-sm edit-task">Editar</button>
                <button class="btn btn-sm delete-task" style="background-color: var(--danger);">Excluir</button>
            </div>
        `;
        
        taskList.appendChild(li);
        
        // Adicionar event listeners
        const checkbox = li.querySelector('.task-checkbox');
        checkbox.addEventListener('click', () => {
            task.completed = !task.completed;
            checkbox.classList.toggle('checked');
            saveData();
            renderTasks();
        });
        
        const editBtn = li.querySelector('.edit-task');
        editBtn.addEventListener('click', () => {
            openEditTaskModal(task);
        });
        
        const deleteBtn = li.querySelector('.delete-task');
        deleteBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
                taskData.tasks = taskData.tasks.filter(t => t.id !== task.id);
                saveData();
                renderTasks();
                renderGroups(); // Atualizar contadores
            }
        });
    });
}

// ====== MANIPULAÇÃO DE FORMULÁRIOS ======
// Abrir modal para adicionar tarefa
function openAddTaskModal() {
    const taskModal = document.getElementById('taskModal');
    const taskForm = document.getElementById('taskForm');
    const taskId = document.getElementById('taskId');
    
    // Resetar formulário
    taskForm.reset();
    taskId.value = '';
    
    // Definir prioridade padrão como alta
    document.querySelector('input[name="priority"][value="high"]').checked = true;
    
    // Resetar seleção de tags
    document.querySelectorAll('.tag-option').forEach(tag => {
        tag.classList.remove('selected');
    });
    
    // Atualizar título do modal
    document.querySelector('#taskModal .modal-header h2').textContent = 'Adicionar Nova Tarefa';
    
    // Mostrar modal
    taskModal.classList.add('open');
}

// Abrir modal para editar tarefa
function openEditTaskModal(task) {
    const taskModal = document.getElementById('taskModal');
    const taskId = document.getElementById('taskId');
    const taskTitle = document.getElementById('taskTitle');
    const taskDueDate = document.getElementById('taskDueDate');
    const taskGroup = document.getElementById('taskGroup');
    const taskDescription = document.getElementById('taskDescription');
    
    // Preencher formulário
    taskId.value = task.id;
    taskTitle.value = task.title;
    taskDueDate.value = task.dueDate || '';
    taskGroup.value = task.group || 'all';
    taskDescription.value = task.description || '';
    
    // Selecionar prioridade
    const priorityValue = task.priority || 'medium';
    document.querySelector(`input[name="priority"][value="${priorityValue}"]`).checked = true;
    
    // Selecionar tags
    document.querySelectorAll('.tag-option').forEach(tagElement => {
        const tag = tagElement.dataset.tag;
        if (task.tags && task.tags.includes(tag)) {
            tagElement.classList.add('selected');
        } else {
            tagElement.classList.remove('selected');
        }
    });
    
    // Atualizar título do modal
    document.querySelector('#taskModal .modal-header h2').textContent = 'Editar Tarefa';
    
    // Mostrar modal
    taskModal.classList.add('open');
}

// Adicionar ou atualizar tarefa
function saveTask(event) {
    event.preventDefault();
    
    // Obter valores do formulário
    const taskId = document.getElementById('taskId').value;
    const title = document.getElementById('taskTitle').value;
    const dueDate = document.getElementById('taskDueDate').value;
    const group = document.getElementById('taskGroup').value;
    const description = document.getElementById('taskDescription').value;
    
    // Obter prioridade selecionada
    const priorityRadio = document.querySelector('input[name="priority"]:checked');
    const priority = priorityRadio ? priorityRadio.value : 'medium';
    
    // Obter tags selecionadas
    const selectedTags = [];
    document.querySelectorAll('.tag-option.selected').forEach(tag => {
        selectedTags.push(tag.dataset.tag);
    });
    
    if (taskId) {
        // Atualizar tarefa existente
        const task = taskData.tasks.find(t => t.id === taskId);
        if (task) {
            task.title = title;
            task.dueDate = dueDate;
            task.group = group;
            task.description = description;
            task.priority = priority;
            task.tags = selectedTags;
        }
    } else {
        // Adicionar nova tarefa
        const newTask = {
            id: generateId(),
            title,
            dueDate,
            group,
            description,
            priority,
            tags: selectedTags,
            completed: false
        };
        taskData.tasks.push(newTask);
    }
    
    // Salvar e atualizar interface
    saveData();
    renderTasks();
    renderGroups(); // Atualizar contadores
    
    // Fechar modal
    document.getElementById('taskModal').classList.remove('open');
}

// Adicionar novo grupo
function saveGroup(event) {
    event.preventDefault();
    
    const groupName = document.getElementById('groupName').value;
    
    if (groupName) {
        // Criar ID para o grupo (baseado no nome)
        const groupId = groupName.toLowerCase().replace(/\s+/g, '-');
        
        // Verificar se o grupo já existe
        if (!taskData.groups.some(g => g.id === groupId)) {
            taskData.groups.push({
                id: groupId,
                name: groupName
            });
            
            // Salvar e atualizar interface
            saveData();
            renderGroups();
        }
        
        // Fechar modal
        document.getElementById('groupModal').classList.remove('open');
        document.getElementById('groupForm').reset();
    }
}

// ====== EXPORTAÇÃO E BACKUP DE DADOS ======
// Função para exportar dados
function exportData() {
    const dataStr = JSON.stringify(taskData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'taskmaster-backup.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    // Opcionalmente, salvar no Firebase também
    tasksRef.set(taskData)
        .then(() => console.log("Backup salvo no Firebase"))
        .catch(error => console.error("Erro ao salvar backup:", error));
}

// ====== CONFIGURAÇÃO DE EVENTOS ======
// Configurar eventos dos modais e elementos UI
function setupEventListeners() {
    // Modal de tarefas
    const taskModal = document.getElementById('taskModal');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const cancelTaskBtn = document.getElementById('cancelTaskBtn');
    const closeTaskModal = taskModal.querySelector('.close-modal');
    
    addTaskBtn.addEventListener('click', openAddTaskModal);
    
    cancelTaskBtn.addEventListener('click', () => {
        taskModal.classList.remove('open');
    });
    
    closeTaskModal.addEventListener('click', () => {
        taskModal.classList.remove('open');
    });
    
    // Modal de grupos
    const groupModal = document.getElementById('groupModal');
    const addGroupBtn = document.getElementById('addGroupBtn');
    const cancelGroupBtn = document.getElementById('cancelGroupBtn');
    const closeGroupModal = groupModal.querySelector('.close-modal');
    
    addGroupBtn.addEventListener('click', () => {
        groupModal.classList.add('open');
    });
    
    cancelGroupBtn.addEventListener('click', () => {
        groupModal.classList.remove('open');
    });
    
    closeGroupModal.addEventListener('click', () => {
        groupModal.classList.remove('open');
    });
    
    // Seleção de tags no formulário
    document.querySelectorAll('.tag-option').forEach(tag => {
        tag.addEventListener('click', () => {
            tag.classList.toggle('selected');
        });
    });
    
    // Submissão de formulários
    document.getElementById('taskForm').addEventListener('submit', saveTask);
    document.getElementById('groupForm').addEventListener('submit', saveGroup);
    
    // Pesquisa de tarefas
    document.getElementById('searchInput').addEventListener('input', function() {
        renderTasks();
    });
    
    // Menu mobile
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    // Mostrar menu toggle apenas em tela mobile
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            menuToggle.style.display = 'flex';
        } else {
            menuToggle.style.display = 'none';
            sidebar.classList.remove('open');
        }
    });
    
    // Inicializar estado do toggle de menu
    if (window.innerWidth <= 768) {
        menuToggle.style.display = 'flex';
    }
    
    // Toggle do menu lateral
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
    
    // Fechar menu ao clicar fora em mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            !menuToggle.contains(e.target) && 
            sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });
    
    // Fechar modais ao clicar fora
    window.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            taskModal.classList.remove('open');
        }
        if (e.target === groupModal) {
            groupModal.classList.remove('open');
        }
    });
    
    // Adicionar botão de exportação na interface
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn';
    exportBtn.style.marginTop = '1rem';
    exportBtn.style.width = '100%';
    exportBtn.innerHTML = 'Exportar Dados';
    exportBtn.addEventListener('click', exportData);
    
    document.querySelector('.sidebar').appendChild(exportBtn);
}

// ====== ESCUTA EM TEMPO REAL ======
// Configurar escuta para atualizações em tempo real
function setupRealtimeListener() {
    tasksRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            const newData = snapshot.val();
            // Verificar se os dados são diferentes antes de atualizar
            if (JSON.stringify(newData) !== JSON.stringify(taskData)) {
                taskData = newData;
                renderGroups();
                renderTasks();
            }
        }
    });
}

// ====== INICIALIZAÇÃO DO APLICATIVO ======
// Inicializar aplicativo
function initApp() {
    // Carregar dados
    loadData();
    
    // Configurar escuta em tempo real
    setupRealtimeListener();
    
    // Configurar eventos
    setupEventListeners();
    
    // Renderizar interface inicial
    renderGroups();
    renderTasks();
}

// Iniciar aplicativo quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', initApp);
