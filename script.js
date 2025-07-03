// 任务管理类
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = {
            status: 'all',
            priority: 'all'
        };
        this.currentSort = 'created';
        this.currentView = 'grid';
        this.editingTaskId = null;
        this.deletingTaskId = null;
        
        this.initializeEventListeners();
        this.renderTasks();
        this.updateStats();
    }

    // 从本地存储加载任务
    loadTasks() {
        const stored = localStorage.getItem('todoTasks');
        return stored ? JSON.parse(stored) : [];
    }

    // 保存任务到本地存储
    saveTasks() {
        localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
    }

    // 生成唯一ID
    generateId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 初始化事件监听器
    initializeEventListeners() {
        // 添加任务表单
        document.getElementById('add-task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // 编辑任务表单
        document.getElementById('edit-task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEditTask();
        });

        // 筛选和排序
        document.getElementById('filter-status').addEventListener('change', (e) => {
            this.currentFilter.status = e.target.value;
            this.renderTasks();
        });

        document.getElementById('filter-priority').addEventListener('change', (e) => {
            this.currentFilter.priority = e.target.value;
            this.renderTasks();
        });

        document.getElementById('sort-by').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.renderTasks();
        });

        // 清除已完成任务
        document.getElementById('clear-completed').addEventListener('click', () => {
            this.clearCompletedTasks();
        });

        // 视图切换
        document.getElementById('grid-view').addEventListener('click', () => {
            this.setView('grid');
        });

        document.getElementById('list-view').addEventListener('click', () => {
            this.setView('list');
        });

        // 模态框控制
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeEditModal();
        });

        document.getElementById('cancel-edit').addEventListener('click', () => {
            this.closeEditModal();
        });

        document.getElementById('close-delete-modal').addEventListener('click', () => {
            this.closeDeleteModal();
        });

        document.getElementById('cancel-delete').addEventListener('click', () => {
            this.closeDeleteModal();
        });

        document.getElementById('confirm-delete').addEventListener('click', () => {
            this.confirmDelete();
        });

        // 点击模态框背景关闭
        document.getElementById('edit-modal').addEventListener('click', (e) => {
            if (e.target.id === 'edit-modal') {
                this.closeEditModal();
            }
        });

        document.getElementById('delete-modal').addEventListener('click', (e) => {
            if (e.target.id === 'delete-modal') {
                this.closeDeleteModal();
            }
        });
    }

    // 添加新任务
    addTask() {
        const form = document.getElementById('add-task-form');
        const formData = new FormData(form);
        
        const task = {
            id: this.generateId(),
            title: formData.get('title').trim(),
            description: formData.get('description').trim(),
            dueDate: formData.get('dueDate') || null,
            priority: parseInt(formData.get('priority')),
            completed: false,
            createdAt: new Date().toISOString()
        };

        if (!task.title) {
            alert('请输入任务标题');
            return;
        }

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        
        // 重置表单
        form.reset();
        document.getElementById('task-priority').value = '1';
        
        // 显示成功消息
        this.showNotification('任务添加成功！', 'success');
    }

    // 切换任务完成状态
    toggleTaskComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            
            const message = task.completed ? '任务已完成！' : '任务已标记为待办';
            this.showNotification(message, 'success');
        }
    }

    // 编辑任务
    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.editingTaskId = taskId;
        
        // 填充编辑表单
        document.getElementById('edit-task-id').value = task.id;
        document.getElementById('edit-task-title').value = task.title;
        document.getElementById('edit-task-description').value = task.description;
        document.getElementById('edit-task-priority').value = task.priority;
        
        if (task.dueDate) {
            // 转换为本地时间格式
            const date = new Date(task.dueDate);
            const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
            document.getElementById('edit-task-due-date').value = localDate.toISOString().slice(0, 16);
        } else {
            document.getElementById('edit-task-due-date').value = '';
        }
        
        this.showEditModal();
    }

    // 保存编辑的任务
    saveEditTask() {
        const form = document.getElementById('edit-task-form');
        const formData = new FormData(form);
        const taskId = formData.get('id') || this.editingTaskId;
        
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const title = formData.get('title').trim();
        if (!title) {
            alert('请输入任务标题');
            return;
        }

        task.title = title;
        task.description = formData.get('description').trim();
        task.dueDate = formData.get('dueDate') || null;
        task.priority = parseInt(formData.get('priority'));

        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.closeEditModal();
        
        this.showNotification('任务更新成功！', 'success');
    }

    // 删除任务
    deleteTask(taskId) {
        this.deletingTaskId = taskId;
        this.showDeleteModal();
    }

    // 确认删除任务
    confirmDelete() {
        if (!this.deletingTaskId) return;

        this.tasks = this.tasks.filter(t => t.id !== this.deletingTaskId);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.closeDeleteModal();
        
        this.showNotification('任务已删除', 'success');
    }

    // 清除所有已完成任务
    clearCompletedTasks() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        if (completedCount === 0) {
            this.showNotification('没有已完成的任务需要清除', 'info');
            return;
        }

        if (confirm(`确定要删除 ${completedCount} 个已完成的任务吗？`)) {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            
            this.showNotification(`已清除 ${completedCount} 个已完成任务`, 'success');
        }
    }

    // 筛选任务
    filterTasks(tasks) {
        return tasks.filter(task => {
            // 状态筛选
            if (this.currentFilter.status === 'pending' && task.completed) return false;
            if (this.currentFilter.status === 'completed' && !task.completed) return false;
            
            // 优先级筛选
            if (this.currentFilter.priority !== 'all' && 
                task.priority !== parseInt(this.currentFilter.priority)) return false;
            
            return true;
        });
    }

    // 排序任务
    sortTasks(tasks) {
        return [...tasks].sort((a, b) => {
            switch (this.currentSort) {
                case 'priority':
                    if (a.priority !== b.priority) {
                        return b.priority - a.priority; // 高优先级在前
                    }
                    return new Date(b.createdAt) - new Date(a.createdAt);
                
                case 'dueDate':
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                
                case 'title':
                    return a.title.localeCompare(b.title);
                
                case 'created':
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });
    }

    // 渲染任务列表
    renderTasks() {
        const container = document.getElementById('tasks-container');
        const emptyState = document.getElementById('empty-state');
        
        let filteredTasks = this.filterTasks(this.tasks);
        filteredTasks = this.sortTasks(filteredTasks);
        
        // 清除现有内容
        container.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            container.appendChild(emptyState);
            return;
        }
        
        filteredTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            container.appendChild(taskElement);
        });
    }

    // 创建任务元素
    createTaskElement(task) {
        const taskCard = document.createElement('div');
        taskCard.className = `task-card priority-${task.priority}`;
        if (task.completed) {
            taskCard.classList.add('completed');
        }

        const priorityLabels = ['低', '中', '高', '紧急'];
        const priorityLabel = priorityLabels[task.priority] || '中';
        
        // 格式化日期
        let dueDateHtml = '';
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const now = new Date();
            const diffTime = dueDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let dueDateClass = 'due-date';
            if (diffDays < 0) {
                dueDateClass += ' overdue';
            } else if (diffDays <= 1) {
                dueDateClass += ' due-soon';
            }
            
            dueDateHtml = `
                <div class="task-meta-item">
                    <i class="fas fa-calendar-alt"></i>
                    <span class="${dueDateClass}">
                        ${dueDate.toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </span>
                </div>
            `;
        }

        taskCard.innerHTML = `
            <div class="task-header">
                <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
                <div class="task-actions">
                    <button class="task-action-btn complete-btn" 
                            onclick="taskManager.toggleTaskComplete('${task.id}')"
                            title="${task.completed ? '标记为待办' : '标记为完成'}">
                        <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                    </button>
                    <button class="task-action-btn edit-btn" 
                            onclick="taskManager.editTask('${task.id}')"
                            title="编辑任务">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-action-btn delete-btn" 
                            onclick="taskManager.deleteTask('${task.id}')"
                            title="删除任务">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="task-body">
                ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                <div class="task-meta">
                    <div class="task-meta-item">
                        <i class="fas fa-flag"></i>
                        <span class="priority-badge priority-${task.priority}">${priorityLabel}</span>
                    </div>
                    ${dueDateHtml}
                    <div class="task-meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${new Date(task.createdAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                </div>
            </div>
        `;

        return taskCard;
    }

    // 更新统计信息
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        document.getElementById('total-tasks').textContent = total;
        document.getElementById('pending-tasks').textContent = pending;
        document.getElementById('completed-tasks').textContent = completed;
        document.getElementById('completion-rate').textContent = `${completionRate}%`;
    }

    // 设置视图模式
    setView(view) {
        this.currentView = view;
        const container = document.getElementById('tasks-container');
        const gridBtn = document.getElementById('grid-view');
        const listBtn = document.getElementById('list-view');

        if (view === 'grid') {
            container.className = 'tasks-container grid-view';
            gridBtn.classList.add('active');
            listBtn.classList.remove('active');
        } else {
            container.className = 'tasks-container list-view';
            listBtn.classList.add('active');
            gridBtn.classList.remove('active');
        }
    }

    // 显示编辑模态框
    showEditModal() {
        document.getElementById('edit-modal').classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // 关闭编辑模态框
    closeEditModal() {
        document.getElementById('edit-modal').classList.remove('show');
        document.body.style.overflow = '';
        this.editingTaskId = null;
    }

    // 显示删除确认模态框
    showDeleteModal() {
        document.getElementById('delete-modal').classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // 关闭删除确认模态框
    closeDeleteModal() {
        document.getElementById('delete-modal').classList.remove('show');
        document.body.style.overflow = '';
        this.deletingTaskId = null;
    }

    // 显示通知消息
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // 添加样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease-in-out;
            max-width: 300px;
            word-wrap: break-word;
        `;

        document.body.appendChild(notification);

        // 显示动画
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // 自动隐藏
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // 获取通知图标
    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    }

    // 获取通知颜色
    getNotificationColor(type) {
        switch (type) {
            case 'success': return '#10b981';
            case 'error': return '#ef4444';
            case 'warning': return '#f59e0b';
            default: return '#3b82f6';
        }
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化应用
let taskManager;

document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
    
    // 添加键盘快捷键
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter 快速添加任务
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const addForm = document.getElementById('add-task-form');
            if (document.activeElement && addForm.contains(document.activeElement)) {
                e.preventDefault();
                addForm.dispatchEvent(new Event('submit'));
            }
        }
        
        // ESC 关闭模态框
        if (e.key === 'Escape') {
            const editModal = document.getElementById('edit-modal');
            const deleteModal = document.getElementById('delete-modal');
            
            if (editModal.classList.contains('show')) {
                taskManager.closeEditModal();
            } else if (deleteModal.classList.contains('show')) {
                taskManager.closeDeleteModal();
            }
        }
    });
    
    // 添加提示信息
    const titleInput = document.getElementById('task-title');
    if (titleInput) {
        titleInput.addEventListener('focus', () => {
            if (!document.querySelector('.keyboard-hint')) {
                const hint = document.createElement('div');
                hint.className = 'keyboard-hint';
                hint.style.cssText = `
                    position: absolute;
                    top: 100%;
                    left: 0;
                    background: #374151;
                    color: white;
                    padding: 8px 12px;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    margin-top: 5px;
                    z-index: 100;
                `;
                hint.textContent = '提示：Ctrl+Enter 快速添加任务';
                titleInput.parentNode.style.position = 'relative';
                titleInput.parentNode.appendChild(hint);
                
                setTimeout(() => {
                    if (hint.parentNode) {
                        hint.parentNode.removeChild(hint);
                    }
                }, 3000);
            }
        });
    }
});

