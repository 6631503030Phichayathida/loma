// ตัวแปรสำหรับจัดการ To-Do List
let todos = [];
let currentFilter = 'all';
let editingId = null;

// อีเลเมนต์ต่างๆ
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const filterBtns = document.querySelectorAll('.filter-btn');
const totalTasks = document.getElementById('totalTasks');
const completedTasks = document.getElementById('completedTasks');
const pendingTasks = document.getElementById('pendingTasks');
const clearCompleted = document.getElementById('clearCompleted');
const clearAll = document.getElementById('clearAll');

// เมื่อโหลดหน้าเว็บ
document.addEventListener('DOMContentLoaded', function() {
    loadTodos();
    updateDisplay();
    updateStats();
    
    // Event Listeners
    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTodo();
        }
    });
    
    // ฟิลเตอร์งาน
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            currentFilter = this.dataset.filter;
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            updateDisplay();
        });
    });
    
    // ลบงานที่เสร็จแล้ว
    clearCompleted.addEventListener('click', function() {
        if (confirm('คุณต้องการลบงานที่เสร็จแล้วทั้งหมดใช่หรือไม่?')) {
            todos = todos.filter(todo => !todo.completed);
            saveTodos();
            updateDisplay();
            updateStats();
        }
    });
    
    // ลบงานทั้งหมด
    clearAll.addEventListener('click', function() {
        if (confirm('คุณต้องการลบงานทั้งหมดใช่หรือไม่?')) {
            todos = [];
            saveTodos();
            updateDisplay();
            updateStats();
        }
    });
});

// ฟังก์ชันเพิ่มงานใหม่
function addTodo() {
    const text = todoInput.value.trim();
    if (text === '') {
        alert('กรุณากรอกรายละเอียดงาน');
        return;
    }
    
    if (text.length > 100) {
        alert('รายละเอียดงานต้องไม่เกิน 100 ตัวอักษร');
        return;
    }
    
    const todo = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    todos.unshift(todo); // เพิ่มที่ด้านบน
    todoInput.value = '';
    saveTodos();
    updateDisplay();
    updateStats();
    
    // แสดงข้อความสำเร็จ
    showNotification('เพิ่มงานใหม่แล้ว!', 'success');
}

// ฟังก์ชันแสดงรายการงาน
function updateDisplay() {
    todoList.innerHTML = '';
    
    // กรองงานตามฟิลเตอร์
    let filteredTodos = todos;
    if (currentFilter === 'completed') {
        filteredTodos = todos.filter(todo => todo.completed);
    } else if (currentFilter === 'pending') {
        filteredTodos = todos.filter(todo => !todo.completed);
    }
    
    // แสดง empty state ถ้าไม่มีงาน
    if (filteredTodos.length === 0) {
        emptyState.classList.add('show');
        todoList.style.display = 'none';
    } else {
        emptyState.classList.remove('show');
        todoList.style.display = 'block';
        
        // สร้างรายการงาน
        filteredTodos.forEach(todo => {
            const li = createTodoElement(todo);
            todoList.appendChild(li);
        });
    }
}

// ฟังก์ชันสร้าง element สำหรับงานแต่ละอัน
function createTodoElement(todo) {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    li.dataset.id = todo.id;
    
    li.innerHTML = `
        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
        <span class="todo-text">${escapeHtml(todo.text)}</span>
        <div class="todo-actions">
            <button class="edit-btn" title="แก้ไข">
                <i class="fas fa-edit"></i>
            </button>
            <button class="delete-btn" title="ลบ">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // Event listeners สำหรับ checkbox
    const checkbox = li.querySelector('.todo-checkbox');
    checkbox.addEventListener('change', function() {
        toggleTodo(todo.id);
    });
    
    // Event listeners สำหรับปุ่มแก้ไข
    const editBtn = li.querySelector('.edit-btn');
    editBtn.addEventListener('click', function() {
        editTodo(todo.id);
    });
    
    // Event listeners สำหรับปุ่มลบ
    const deleteBtn = li.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', function() {
        deleteTodo(todo.id);
    });
    
    return li;
}

// ฟังก์ชันเปลี่ยนสถานะงาน (เสร็จ/ไม่เสร็จ)
function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        updateDisplay();
        updateStats();
        
        const message = todo.completed ? 'ทำงานเสร็จแล้ว!' : 'เปลี่ยนเป็นยังไม่เสร็จ';
        showNotification(message, 'success');
    }
}

// ฟังก์ชันแก้ไขงาน
function editTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    const todoItem = document.querySelector(`[data-id="${id}"]`);
    const textSpan = todoItem.querySelector('.todo-text');
    const actions = todoItem.querySelector('.todo-actions');
    
    // ป้องกันการแก้ไขหลายรายการพร้อมกัน
    if (editingId && editingId !== id) {
        cancelEdit();
    }
    
    editingId = id;
    
    // สร้าง input field
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';
    input.value = todo.text;
    input.maxLength = 100;
    
    // แทนที่ text span ด้วย input
    textSpan.style.display = 'none';
    textSpan.parentNode.insertBefore(input, textSpan);
    
    // ซ่อนปุ่มต่างๆ
    actions.style.display = 'none';
    
    // เลือกข้อความทั้งหมดใน input
    input.focus();
    input.select();
    
    // Event listeners สำหรับการแก้ไข
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveEdit(id, input.value.trim());
        } else if (e.key === 'Escape') {
            cancelEdit();
        }
    });
    
    input.addEventListener('blur', function() {
        saveEdit(id, input.value.trim());
    });
}

// ฟังก์ชันบันทึกการแก้ไข
function saveEdit(id, newText) {
    if (editingId !== id) return;
    
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    if (newText === '') {
        alert('รายละเอียดงานไม่สามารถเป็นค่าว่างได้');
        return;
    }
    
    if (newText.length > 100) {
        alert('รายละเอียดงานต้องไม่เกิน 100 ตัวอักษร');
        return;
    }
    
    todo.text = newText;
    editingId = null;
    saveTodos();
    updateDisplay();
    showNotification('แก้ไขงานแล้ว!', 'success');
}

// ฟังก์ชันยกเลิกการแก้ไข
function cancelEdit() {
    editingId = null;
    updateDisplay();
}

// ฟังก์ชันลบงาน
function deleteTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    if (confirm(`คุณต้องการลบงาน "${todo.text}" ใช่หรือไม่?`)) {
        const todoItem = document.querySelector(`[data-id="${id}"]`);
        todoItem.classList.add('removing');
        
        setTimeout(() => {
            todos = todos.filter(t => t.id !== id);
            saveTodos();
            updateDisplay();
            updateStats();
            showNotification('ลบงานแล้ว!', 'success');
        }, 300);
    }
}

// ฟังก์ชันอัพเดทสถิติ
function updateStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;
    
    totalTasks.textContent = `งานทั้งหมด: ${total}`;
    completedTasks.textContent = `เสร็จแล้ว: ${completed}`;
    pendingTasks.textContent = `ยังไม่เสร็จ: ${pending}`;
}

// ฟังก์ชันบันทึกข้อมูลใน Local Storage
function saveTodos() {
    try {
        localStorage.setItem('todos', JSON.stringify(todos));
    } catch (e) {
        console.error('ไม่สามารถบันทึกข้อมูลได้:', e);
        alert('ไม่สามารถบันทึกข้อมูลได้ โปรดตรวจสอบพื้นที่จัดเก็บของเบราว์เซอร์');
    }
}

// ฟังก์ชันโหลดข้อมูลจาก Local Storage
function loadTodos() {
    try {
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
            todos = JSON.parse(savedTodos);
            // ตรวจสอบข้อมูลและทำความสะอาด
            todos = todos.filter(todo => 
                todo && 
                typeof todo.id === 'number' && 
                typeof todo.text === 'string' && 
                typeof todo.completed === 'boolean'
            );
        }
    } catch (e) {
        console.error('ไม่สามารถโหลดข้อมูลได้:', e);
        todos = [];
        alert('ไม่สามารถโหลดข้อมูลได้ จะเริ่มต้นใหม่');
    }
}

// ฟังก์ชันแสดงการแจ้งเตือน
function showNotification(message, type = 'info') {
    // สร้าง notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // สไตล์ notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '10px',
        color: 'white',
        fontWeight: '600',
        zIndex: '1000',
        boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        maxWidth: '300px',
        wordWrap: 'break-word'
    });
    
    // สีตามประเภท
    const colors = {
        success: '#48bb78',
        error: '#f56565',
        info: '#667eea'
    };
    notification.style.background = colors[type] || colors.info;
    
    // เพิ่มเข้าไปในหน้า
    document.body.appendChild(notification);
    
    // แสดง notification
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // ซ่อน notification หลัง 3 วินาที
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ฟังก์ชันป้องกัน XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ฟังก์ชันสำหรับ keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + A = เพิ่มงานใหม่
    if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.shiftKey) {
        e.preventDefault();
        todoInput.focus();
    }
    
    // Escape = ยกเลิกการแก้ไข
    if (e.key === 'Escape' && editingId) {
        cancelEdit();
    }
});

// เพิ่มฟังก์ชันสำหรับ drag and drop (ถ้าต้องการในอนาคต)
function enableDragAndDrop() {
    // สามารถเพิ่มฟีเจอร์ลากจัดเรียงลำดับได้ในอนาคต
    console.log('Drag and drop feature can be implemented here');
}

// ฟังก์ชันสำหรับการ export/import ข้อมูล
function exportTodos() {
    const dataStr = JSON.stringify(todos, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `todos_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('ส่งออกข้อมูลแล้ว!', 'success');
}

function importTodos(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedTodos = JSON.parse(e.target.result);
            if (Array.isArray(importedTodos)) {
                todos = importedTodos.filter(todo => 
                    todo && 
                    typeof todo.id === 'number' && 
                    typeof todo.text === 'string' && 
                    typeof todo.completed === 'boolean'
                );
                saveTodos();
                updateDisplay();
                updateStats();
                showNotification('นำเข้าข้อมูลแล้ว!', 'success');
            } else {
                throw new Error('รูปแบบไฟล์ไม่ถูกต้อง');
            }
        } catch (error) {
            console.error('Error importing todos:', error);
            showNotification('ไม่สามารถนำเข้าข้อมูลได้ กรุณาตรวจสอบไฟล์', 'error');
        }
    };
    reader.readAsText(file);
}