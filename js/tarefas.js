const taskInput = document.getElementById('nova-tarefa');
const addTaskBtn = document.querySelector('.btn-add-tarefa');
const taskList = document.getElementById('lista-tarefas');
const emptyText = document.getElementById('tarefas-empty-text');
const completedCounter = document.getElementById('tarefas-concluidas');
const tabs = document.querySelectorAll('.tarefas-tab');

const STORAGE_KEY = 'study-room-tasks';
const defaultView = 'active';
let currentView = defaultView;
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function updateCompletedCounter() {
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    completedCounter.textContent = completedTasks;
}

function setEmptyMessage() {
    const messages = {
        active: 'Nenhuma tarefa ativa. Adicione uma para começar 📋',
        completed: 'Nenhuma tarefa concluída ainda ✅',
        trash: 'Lixeira vazia 🗑️'
    };
    emptyText.textContent = messages[currentView];
}

function getViewTasks() {
    return tasks.filter(task => task.status === currentView);
}

function createTaskElement(task, index) {
    const li = document.createElement('li');
    li.className = task.status === 'completed' ? 'completed' : '';
    li.dataset.index = index;

    const textWrapper = document.createElement('div');
    textWrapper.className = 'task-text';

    const textSpan = document.createElement('span');
    textSpan.textContent = task.text;
    textSpan.title = 'Clique para editar';
    textWrapper.appendChild(textSpan);

    if (currentView !== 'trash') {
        const dateLabel = document.createElement('small');
        dateLabel.style.display = 'block';
        dateLabel.style.color = 'var(--text-muted)';
        dateLabel.style.marginTop = '4px';
        if (task.status === 'completed') {
            dateLabel.textContent = `Concluída em ${formatDate(task.completedAt)}`;
        }
        if (task.status === 'active') {
            dateLabel.textContent = `Criada em ${formatDate(task.createdAt)}`;
        }
        textWrapper.appendChild(dateLabel);
    }

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    function createButton(label, className, handler) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `task-btn ${className}`;
        btn.textContent = label;
        btn.addEventListener('click', handler);
        return btn;
    }

    if (currentView === 'active') {
        const completeBtn = createButton('✔', 'complete', () => completeTask(index));
        const editBtn = createButton('✏️', 'edit', () => beginEditTask(index, textSpan));
        const deleteBtn = createButton('🗑', 'delete', () => trashTask(index));
        actions.append(completeBtn, editBtn, deleteBtn);
    }

    if (currentView === 'completed') {
        const restoreBtn = createButton('↩', 'restore', () => restoreTask(index));
        const trashBtn = createButton('🗑', 'delete', () => trashTask(index));
        actions.append(restoreBtn, trashBtn);
    }

    if (currentView === 'trash') {
        const restoreBtn = createButton('↩', 'restore', () => restoreTask(index));
        const deleteBtn = createButton('✖', 'delete', () => deleteTask(index));
        actions.append(restoreBtn, deleteBtn);
    }

    li.append(textWrapper, actions);
    return li;
}

function renderTasks() {
    const filteredTasks = getViewTasks();
    taskList.innerHTML = '';

    if (filteredTasks.length === 0) {
        setEmptyMessage();
        return;
    }

    filteredTasks.forEach(task => {
        const taskIndex = tasks.findIndex(item => item.id === task.id);
        taskList.appendChild(createTaskElement(task, taskIndex));
    });
}

function setView(view) {
    currentView = view;
    tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.view === view));
    renderTasks();
}

function addTask(text) {
    const trimmedText = text.trim();
    if (!trimmedText) return;
    tasks.unshift({
        id: Date.now(),
        text: trimmedText,
        status: 'active',
        createdAt: Date.now(),
        completedAt: null,
        deletedAt: null
    });
    saveTasks();
    taskInput.value = '';
    updateCompletedCounter();
    setView('active');
}

function completeTask(index) {
    const task = tasks[index];
    if (!task || task.status !== 'active') return;
    task.status = 'completed';
    task.completedAt = Date.now();
    saveTasks();
    updateCompletedCounter();
    renderTasks();
    if (window.historyManager) {
        window.historyManager.record('task');
    }
}

function trashTask(index) {
    const task = tasks[index];
    if (!task || task.status === 'trash') return;
    task.status = 'trash';
    task.deletedAt = Date.now();
    saveTasks();
    updateCompletedCounter();
    renderTasks();
}

function restoreTask(index) {
    const task = tasks[index];
    if (!task) return;
    task.status = 'active';
    task.deletedAt = null;
    saveTasks();
    updateCompletedCounter();
    setView('active');
}

function deleteTask(index) {
    tasks.splice(index, 1);
    saveTasks();
    updateCompletedCounter();
    renderTasks();
}

function beginEditTask(index, textSpan) {
    const task = tasks[index];
    if (!task) return;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = task.text;
    input.className = 'task-edit-input';
    textSpan.replaceWith(input);
    input.focus();
    input.selectionStart = input.value.length;

    function finishEdit() {
        const newText = input.value.trim();
        if (newText) {
            task.text = newText;
            task.updatedAt = Date.now();
            saveTasks();
        }
        renderTasks();
    }

    input.addEventListener('blur', finishEdit);
    input.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            finishEdit();
        }
    });
}

function handleTaskSelection(event) {
    const taskItem = event.target.closest('li');
    if (!taskItem) return;
    const index = parseInt(taskItem.dataset.index, 10);
    if (!Number.isInteger(index)) return;

    const isTextClick = event.target.classList.contains('task-text') || event.target.parentElement?.classList?.contains('task-text');
    if (isTextClick && currentView === 'active') {
        const textSpan = taskItem.querySelector('.task-text span');
        beginEditTask(index, textSpan);
    }
}

function initTarefas() {
    addTaskBtn.addEventListener('click', () => addTask(taskInput.value));
    taskInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            addTask(taskInput.value);
        }
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', () => setView(tab.dataset.view));
    });

    taskList.addEventListener('click', handleTaskSelection);
    updateCompletedCounter();
    setView(currentView);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTarefas);
} else {
    initTarefas();
}
