// ====== CONFIGURAÇÃO DO FIREBASE ======
const firebaseConfig = {
    apiKey: "AIzaSyDnFK90EvXNMTxgAyN3MwzEM3fAc-kPtKI",
    authDomain: "taskmasterrenan.firebaseapp.com",
    databaseURL: "https://taskmasterrenan-default-rtdb.firebaseio.com",
    projectId: "taskmasterrenan",
    storageBucket: "taskmasterrenan.appspot.com",
    messagingSenderId: "853892676669",
    appId: "G-X7EKX8Z6VH"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const tasksRef = db.ref('taskmaster');

// ====== GERENCIAMENTO DE DADOS ======
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

// ====== FUNÇÕES UTILITÁRIAS ======
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ====== PERSISTÊNCIA DE DADOS ======
function loadData() {
    tasksRef.once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                taskData = snapshot.val();
            } else {
                // Dados de exemplo
                taskData.tasks = [
                    {
                        id: generateId(),
                        title: 'Criar apresentação para reunião',
                        dueDate: '2025-03-18',
                        group: 'work',
                        completed: true,
                        tags: ['trabalho', 'urgente'],
                        description: 'Preparar slides para a apresentação trimestral'
                    },
                    {
                        id: generateId(),
                        title: 'Comprar mantimentos',
                        dueDate: '2025-03-20',
                        group: 'shopping',
                        completed: false,
                        tags: ['pessoal'],
                        description: 'Leite, ovos, pão, frutas'
                    }
                ];
                saveData();
            }
            renderGroups();
            renderTasks();
        })
        .catch((error) => {
            console.error("Erro ao carregar dados:", error);
            const savedData = localStorage.getItem('taskMasterData');
            if (savedData) taskData = JSON.parse(savedData);
            renderGroups();
            renderTasks();
        });
}

function saveData() {
    tasksRef.set(taskData)
        .then(() => {
            localStorage.setItem('taskMasterData', JSON.stringify(taskData));
        })
        .catch((error) => {
            console.error("Erro ao salvar dados:", error);
            localStorage.setItem('taskMasterData', JSON.stringify(taskData));
        });
}

// ====== RENDERIZAÇÃO DA INTERFACE ======
function renderGroups() {
    const groupList = document.getElementById('groupList');
    const taskGroupSelect = document.getElementById('taskGroup');
    
    groupList.innerHTML = '';
    taskGroupSelect.innerHTML = '';
    
    taskData.groups.forEach(group => {
        // Contar tarefas
        const count = group.id === 'all' 
            ? taskData.tasks.length 
            : taskData.tasks.filter(task => task.group === group.id).length;
        
        // Adicionar à sidebar
        const li = document.createElement('li');
        li.dataset.groupId = group.id;
        li.innerHTML = `${group.name} <span class="count">${count}</span>`;
        if (group.id === taskData.currentFilter) li.classList.add('active');
        
        li.addEventListener('click', () => {
            taskData.currentFilter = group.id;
            document.querySelectorAll('.group-list li').forEach(i => i.classList.remove('active'));
            li.classList.add('active');
            document.querySelector('.main-header h2').textContent = group.name;
            renderTasks();
            saveData();
        });
        
        groupList.appendChild(li);
        
        // Adicionar ao select
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        taskGroupSelect.appendChild(option);
    });
}

function renderTasks() {
    const taskList = document.getElementById('taskList');
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    
    // Filtrar tarefas
    let filteredTasks = taskData.currentFilter === 'all' 
        ? taskData.tasks 
        : taskData.tasks.filter(task => task.group === taskData.currentFilter);
    
    if (searchInput) {
        filteredTasks = filteredTasks.filter(task => 
            task.title.toLowerCase().includes(searchInput) || 
            (task.description && task.description.toLowerCase().includes(searchInput))
        );
    }
    
    // Mostrar mensagem se vazio
    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state-message">
                <p>Nenhuma tarefa encontrada.</p>
                <p>Clique em "+ Nova Tarefa" para adicionar.</p>
            </div>
        `;
        return;
    }
    
    // Ordenar tarefas
    filteredTasks.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
    });
    
    // Renderizar tarefas
    taskList.innerHTML = '';
    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.dataset.taskId = task.id;
        
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : '';
        const tagsHtml = task.tags.map(tag => {
            let tagClass = 'tag';
            if (tag === 'trabalho') tagClass += ' work';
            if (tag === 'pessoal') tagClass += ' personal';
            if (tag === 'urgente') tagClass += ' urgent';
            if (tag === 'para depois') tagClass += ' later';
            return `<span class="${tagClass}">${tag}</span>`;
        }).join('');
        
        li.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'checked' : ''}"></div>
            <div class="task-content">
                <div class="task-title">${task.title}</div>
                <div class="task-details">
                    <div class="task-date">📅 ${dueDate}</div>
                </div>
                <div class="task-tags">${tagsHtml}</div>
            </div>
            <div class="task-actions">
                <button class="btn btn-sm edit-task">Editar</button>
                <button class="btn btn-sm delete-task" style="background-color: var(--danger);">Excluir</button>
            </div>
        `;
        
        // Event listeners
        li.querySelector('.task-checkbox').addEventListener('click', () => {
            task.completed = !task.completed;
            saveData();
            renderTasks();
        });
        
        li.querySelector('.edit-task').addEventListener('click', () => openEditTaskModal(task));
        li.querySelector('.delete-task').addEventListener('click', () => {
            if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
                taskData.tasks = taskData.tasks.filter(t => t.id !== task.id);
                saveData();
                renderTasks();
                renderGroups();
            }
        });
        
        taskList.appendChild(li);
    });
}

// ====== MANIPULAÇÃO DE FORMULÁRIOS ======
function openAddTaskModal() {
    document.getElementById('taskForm').reset();
    document.getElementById('taskId').value = '';
    document.querySelectorAll('.tag-option').forEach(tag => tag.classList.remove('selected'));
    document.querySelector('#taskModal .modal-header h2').textContent = 'Adicionar Nova Tarefa';
    document.getElementById('taskModal').classList.add('open');
}

function openEditTaskModal(task) {
    document.getElementById('taskId').value = task.id;
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDueDate').value = task.dueDate || '';
    document.getElementById('taskGroup').value = task.group || 'all';
    document.getElementById('taskDescription').value = task.description || '';
    
    document.querySelectorAll('.tag-option').forEach(tag => {
        tag.classList.toggle('selected', task.tags.includes(tag.dataset.tag));
    });
    
    document.querySelector('#taskModal .modal-header h2').textContent = 'Editar Tarefa';
    document.getElementById('taskModal').classList.add('open');
}

function saveTask(event) {
    event.preventDefault();
    
    const taskId = document.getElementById('taskId').value;
    const title = document.getElementById('taskTitle').value;
    const dueDate = document.getElementById('taskDueDate').value;
    const group = document.getElementById('taskGroup').value;
    const description = document.getElementById('taskDescription').value;
    
    const selectedTags = [];
    document.querySelectorAll('.tag-option.selected').forEach(tag => {
        selectedTags.push(tag.dataset.tag);
    });
    
    if (taskId) {
        // Atualizar tarefa
        const task = taskData.tasks.find(t => t.id === taskId);
        if (task) {
            task.title = title;
            task.dueDate = dueDate;
            task.group = group;
            task.description = description;
            task.tags = selectedTags;
        }
    } else {
        // Nova tarefa
        taskData.tasks.push({
            id: generateId(),
            title,
            dueDate,
            group,
            description,
            tags: selectedTags,
            completed: false
        });
    }
    
    saveData();
    renderTasks();
    renderGroups();
    document.getElementById('taskModal').classList.remove('open');
}

function saveGroup(event) {
    event.preventDefault();
    
    const groupName = document.getElementById('groupName').value;
    if (!groupName) return;
    
    const groupId = groupName.toLowerCase().replace(/\s+/g, '-');
    if (!taskData.groups.some(g => g.id === groupId)) {
        taskData.groups.push({ id: groupId, name: groupName });
        saveData();
        renderGroups();
    }
    
    document.getElementById('groupModal').classList.remove('open');
    document.getElementById('groupForm').reset();
}

// ====== EXPORTAÇÃO DE DADOS ======
function exportData() {
    const dataStr = JSON.stringify(taskData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', 'taskmaster-backup.json');
    link.click();
    
    // Backup no Firebase
    tasksRef.set(taskData)
        .then(() => console.log("Backup salvo no Firebase"))
        .catch(error => console.error("Erro ao salvar backup:", error));
}

// ====== CONFIGURAÇÃO DE EVENTOS ======
function setupEventListeners() {
    // Modal de tarefas
    document.getElementById('addTaskBtn').addEventListener('click', openAddTaskModal);
    document.getElementById('cancelTaskBtn').addEventListener('click', () => {
        document.getElementById('taskModal').classList.remove('open');
    });
    document.querySelector('#taskModal .close-modal').addEventListener('click', () => {
        document.getElementById('taskModal').classList.remove('open');
    });
    
    // Modal de grupos
    document.getElementById('addGroupBtn').addEventListener('click', () => {
        document.getElementById('groupModal').classList.add('open');
    });
    document.getElementById('cancelGroupBtn').addEventListener('click', () => {
        document.getElementById('groupModal').classList.remove('open');
    });
    document.querySelector('#groupModal .close-modal').addEventListener('click', () => {
        document.getElementById('groupModal').classList.remove('open');
    });
    
    // Tags
    document.querySelectorAll('.tag-option').forEach(tag => {
        tag.addEventListener('click', () => tag.classList.toggle('selected'));
    });
    
    // Formulários
    document.getElementById('taskForm').addEventListener('submit', saveTask);
    document.getElementById('groupForm').addEventListener('submit', saveGroup);
    
    // Pesquisa
    document.getElementById('searchInput').addEventListener('input', renderTasks);
    
    // Menu mobile
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    window.addEventListener('resize', () => {
        menuToggle.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
        if (window.innerWidth > 768) sidebar.classList.remove('open');
    });
    
    menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
    
    // Botão de exportação
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn';
    exportBtn.style.cssText = 'margin-top: 1rem; width: 100%;';
    exportBtn.textContent = 'Exportar Dados';
    exportBtn.addEventListener('click', exportData);
    document.querySelector('.sidebar').appendChild(exportBtn);
}

// ====== INICIALIZAÇÃO ======
function initApp() {
    loadData();
    setupEventListeners();
    
    // Escuta em tempo real
    tasksRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            const newData = snapshot.val();
            if (JSON.stringify(newData) !== JSON.stringify(taskData)) {
                taskData = newData;
                renderGroups();
                renderTasks();
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', initApp);
