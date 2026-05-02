    /* ========================
    TO-DO LIST — app.js
    ======================== */

    // ── Palette para nuevas categorías ─────────────────
    const PALETTE = [
        '#c8f04e', '#7b61ff', '#ff6b9d', '#47d4ff',
        '#ffb547', '#ff5e5e', '#4fffb0', '#e879f9',
        '#60a5fa', '#f97316'
    ];
    
    // ── State ───────────────────────────────────────────
    let tasks      = load('todo-tasks') || [];
    let categories = load('todo-categories') || [
        { id: 'personal',  name: 'Personal',  color: '#47d4ff' },
        { id: 'trabajo',   name: 'Trabajo',   color: '#7b61ff' },
        { id: 'urgente',   name: 'Urgente',   color: '#ff5e5e' },
    ];
    
    let currentFilter    = 'all';
    let currentCatFilter = '';       // '' = todas las categorías
    let selectedCatId    = '';       // categoría elegida en el modal
    let selectedColor    = PALETTE[0];
    let editingTaskId    = null;     // para futura edición (base lista)
    
    // ── DOM refs ────────────────────────────────────────
    const modalOverlay  = document.getElementById('modalOverlay');
    const modal         = document.getElementById('modal');
    const openModalBtn  = document.getElementById('openModalBtn');
    const modalClose    = document.getElementById('modalClose');
    const cancelTaskBtn = document.getElementById('cancelTaskBtn');
    const saveTaskBtn   = document.getElementById('saveTaskBtn');
    
    const mTaskTitle    = document.getElementById('mTaskTitle');
    const mTaskDesc     = document.getElementById('mTaskDesc');
    const mTaskDate     = document.getElementById('mTaskDate');
    const descCount     = document.getElementById('descCount');
    
    const catSelect      = document.getElementById('catSelect');
    const catSelectLabel = document.getElementById('catSelectLabel');
    const catSelectDot   = document.getElementById('catSelectDot');
    const catDropdown    = document.getElementById('catDropdown');
    const newCatForm     = document.getElementById('newCatForm');
    const newCatName     = document.getElementById('newCatName');
    const colorDots      = document.getElementById('colorDots');
    const cancelCatBtn   = document.getElementById('cancelCatBtn');
    const saveCatBtn     = document.getElementById('saveCatBtn');
    
    const taskList      = document.getElementById('taskList');
    const emptyState    = document.getElementById('emptyState');
    const footer        = document.getElementById('footer');
    const taskCounter   = document.getElementById('taskCounter');
    const pendingCount  = document.getElementById('pendingCount');
    const clearDone     = document.getElementById('clearDone');
    const filterBtns    = document.querySelectorAll('.filter-btn');
    const catFilterBar  = document.getElementById('catFilterBar');
    
    // ── Init ────────────────────────────────────────────
    buildColorDots();
    renderCatDropdown();
    renderCatFilterBar();
    render();
    bindEvents();
    
    // ══════════════════════════════════════════════════════
    //  EVENTS
    // ══════════════════════════════════════════════════════
    function bindEvents() {
        // Open / close modal
        openModalBtn.addEventListener('click', openModal);
        modalClose.addEventListener('click', closeModal);
        cancelTaskBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
        });
        document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('open')) closeModal();
        });
    
        // Save task
        saveTaskBtn.addEventListener('click', handleSaveTask);
        mTaskTitle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSaveTask();
        });
    
        // Char counter textarea
        mTaskDesc.addEventListener('input', () => {
        descCount.textContent = `${mTaskDesc.value.length} / 300`;
        });
    
        // Category select toggle
        catSelect.addEventListener('click', toggleCatDropdown);
        catSelect.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') toggleCatDropdown();
        });
        document.addEventListener('click', (e) => {
        if (!catSelect.contains(e.target) && !catDropdown.contains(e.target)) {
            closeCatDropdown();
        }
        });
    
        // New category flow
        document.getElementById('catNewBtn')?.addEventListener('click', showNewCatForm);
        cancelCatBtn.addEventListener('click', hideNewCatForm);
        saveCatBtn.addEventListener('click', handleSaveCategory);
        newCatName.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSaveCategory();
        });
    
        // Status filters
        filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            render();
        });
        });
    
        // Clear done
        clearDone.addEventListener('click', handleClearDone);
    }
    
    // ══════════════════════════════════════════════════════
    //  MODAL
    // ══════════════════════════════════════════════════════
    function openModal() {
        resetModalForm();
        modalOverlay.classList.add('open');
        setTimeout(() => mTaskTitle.focus(), 80);
    }
    
    function closeModal() {
        modalOverlay.classList.remove('open');
        hideNewCatForm();
        closeCatDropdown();
    }
    
    function resetModalForm() {
        mTaskTitle.value = '';
        mTaskDesc.value  = '';
        mTaskDate.value  = '';
        descCount.textContent = '0 / 300';
        selectCategory('');
        hideNewCatForm();
    }
    
    // ══════════════════════════════════════════════════════
    //  TASK CRUD
    // ══════════════════════════════════════════════════════
    function handleSaveTask() {
        const title = mTaskTitle.value.trim();
        if (!title) { shake(mTaskTitle); return; }
    
        const task = {
        id: Date.now(),
        title,
        desc:      mTaskDesc.value.trim(),
        date:      mTaskDate.value,
        categoryId: selectedCatId,
        done: false,
        createdAt: new Date().toISOString(),
        };
    
        tasks.unshift(task);
        save('todo-tasks', tasks);
        closeModal();
        render();
    }
    
    function toggleTask(id) {
        const t = tasks.find(t => t.id === id);
        if (t) { t.done = !t.done; save('todo-tasks', tasks); render(); }
    }
    
    function deleteTask(id, el) {
        el.classList.add('removing');
        el.addEventListener('animationend', () => {
        tasks = tasks.filter(t => t.id !== id);
        save('todo-tasks', tasks);
        render();
        }, { once: true });
    }
    
    function handleClearDone() {
        const items = taskList.querySelectorAll('.task-item.done');
        if (!items.length) return;
        let n = 0;
        items.forEach(el => {
        el.classList.add('removing');
        el.addEventListener('animationend', () => {
            if (++n === items.length) {
            tasks = tasks.filter(t => !t.done);
            save('todo-tasks', tasks);
            render();
            }
        }, { once: true });
        });
    }
    
    // ══════════════════════════════════════════════════════
    //  CATEGORY CRUD
    // ══════════════════════════════════════════════════════
    function handleSaveCategory() {
        const name = newCatName.value.trim();
        if (!name) { shake(newCatName); return; }
    
        const cat = {
        id:    Date.now().toString(),
        name,
        color: selectedColor,
        };
        categories.push(cat);
        save('todo-categories', categories);
    
        renderCatDropdown();
        renderCatFilterBar();
        selectCategory(cat.id);
        hideNewCatForm();
        closeCatDropdown();
    }
    
    function deleteCategory(id) {
        categories = categories.filter(c => c.id !== id);
        save('todo-categories', categories);
        // Remove from tasks
        tasks.forEach(t => { if (t.categoryId === id) t.categoryId = ''; });
        save('todo-tasks', tasks);
        if (currentCatFilter === id) currentCatFilter = '';
        renderCatDropdown();
        renderCatFilterBar();
        if (selectedCatId === id) selectCategory('');
        render();
    }
    
    // ══════════════════════════════════════════════════════
    //  CATEGORY SELECT UI
    // ══════════════════════════════════════════════════════
    function toggleCatDropdown() {
        const isOpen = catDropdown.classList.contains('open');
        isOpen ? closeCatDropdown() : openCatDropdown();
    }
    
    function openCatDropdown() {
        catDropdown.classList.add('open');
        catSelect.classList.add('open');
    }
    
    function closeCatDropdown() {
        catDropdown.classList.remove('open');
        catSelect.classList.remove('open');
    }
    
    function selectCategory(id) {
        selectedCatId = id;
        const cat = categories.find(c => c.id === id);
        const color = cat ? cat.color : '#555';
        const name  = cat ? cat.name  : 'Sin categoría';
    
        catSelectDot.style.background = color;
        document.getElementById('catSelectText').textContent = name;
    
        // Update selected state in dropdown
        catDropdown.querySelectorAll('.cat-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.id === id);
        });
        closeCatDropdown();
    }
    
    function renderCatDropdown() {
        catDropdown.innerHTML = '';
    
        // "Sin categoría" option
        const none = createCatOption('', 'Sin categoría', '#555');
        none.addEventListener('click', () => selectCategory(''));
        catDropdown.appendChild(none);
    
        // User categories
        categories.forEach(cat => {
        const opt = createCatOption(cat.id, cat.name, cat.color);
        opt.addEventListener('click', () => selectCategory(cat.id));
    
        // Delete btn per category
        const del = document.createElement('button');
        del.className = 'cat-option-del';
        del.innerHTML = '✕';
        del.title = 'Eliminar categoría';
        del.style.cssText = `
            background:none;border:none;color:#555;cursor:pointer;
            font-size:11px;margin-left:auto;padding:2px 4px;border-radius:4px;
            transition:color 0.15s;
        `;
        del.addEventListener('mouseover', () => del.style.color = '#ff5e5e');
        del.addEventListener('mouseout',  () => del.style.color = '#555');
        del.addEventListener('click', (e) => { e.stopPropagation(); deleteCategory(cat.id); });
        opt.appendChild(del);
    
        catDropdown.appendChild(opt);
        });
    
        const divider = document.createElement('div');
        divider.className = 'cat-divider';
        catDropdown.appendChild(divider);
    
        const newBtn = document.createElement('button');
        newBtn.className = 'cat-new-btn';
        newBtn.id = 'catNewBtn';
        newBtn.textContent = '+ Nueva categoría';
        newBtn.addEventListener('click', showNewCatForm);
        catDropdown.appendChild(newBtn);
    
        // Re-apply selected state
        catDropdown.querySelectorAll('.cat-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.id === selectedCatId);
        });
    }
    
    function createCatOption(id, name, color) {
        const div = document.createElement('div');
        div.className = 'cat-option';
        div.dataset.id = id;
        const dot = document.createElement('span');
        dot.className = 'cat-dot';
        dot.style.background = color;
        div.appendChild(dot);
        div.appendChild(document.createTextNode(name));
        return div;
    }
    
    // ── New cat form ────────────────────────────────────
    function showNewCatForm() {
        closeCatDropdown();
        newCatForm.classList.add('visible');
        newCatName.value = '';
        selectedColor = PALETTE[0];
        colorDots.querySelectorAll('.color-dot-btn').forEach((btn, i) => {
        btn.classList.toggle('selected', i === 0);
        });
        newCatName.focus();
    }
    
    function hideNewCatForm() {
        newCatForm.classList.remove('visible');
    }
    
    function buildColorDots() {
        colorDots.innerHTML = '';
        PALETTE.forEach((color, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'color-dot-btn' + (i === 0 ? ' selected' : '');
        btn.style.background = color;
        btn.dataset.color = color;
        btn.addEventListener('click', () => {
            selectedColor = color;
            colorDots.querySelectorAll('.color-dot-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
        colorDots.appendChild(btn);
        });
    }
    
    // ══════════════════════════════════════════════════════
    //  CATEGORY FILTER BAR (main view)
    // ══════════════════════════════════════════════════════
    function renderCatFilterBar() {
        catFilterBar.innerHTML = '';
        if (categories.length === 0) return;
    
        // "Todas" chip
        const allChip = document.createElement('button');
        allChip.className = 'cat-filter-chip' + (currentCatFilter === '' ? ' active' : '');
        allChip.style.background = currentCatFilter === '' ? '#333' : '';
        allChip.innerHTML = `<span class="chip-dot" style="background:#888"></span> Todas`;
        allChip.addEventListener('click', () => { currentCatFilter = ''; renderCatFilterBar(); render(); });
        catFilterBar.appendChild(allChip);
    
        categories.forEach(cat => {
        const chip = document.createElement('button');
        chip.className = 'cat-filter-chip' + (currentCatFilter === cat.id ? ' active' : '');
        if (currentCatFilter === cat.id) chip.style.background = cat.color + '33';
        chip.style.borderColor = currentCatFilter === cat.id ? cat.color : '';
        chip.style.color = currentCatFilter === cat.id ? cat.color : '';
        chip.innerHTML = `<span class="chip-dot" style="background:${cat.color}"></span>${cat.name}`;
        chip.addEventListener('click', () => {
            currentCatFilter = cat.id;
            renderCatFilterBar();
            render();
        });
        catFilterBar.appendChild(chip);
        });
    }
    
    // ══════════════════════════════════════════════════════
    //  RENDER
    // ══════════════════════════════════════════════════════
    function render() {
        const filtered = getFiltered();
        taskList.innerHTML = '';
        filtered.forEach(task => taskList.appendChild(createTaskEl(task)));
    
        const isEmpty = filtered.length === 0;
        emptyState.classList.toggle('visible', isEmpty);
    
        const hasTasks = tasks.length > 0;
        footer.classList.toggle('visible', hasTasks);
    
        const pending = tasks.filter(t => !t.done).length;
        taskCounter.textContent  = `${tasks.length} ${tasks.length === 1 ? 'tarea' : 'tareas'}`;
        pendingCount.textContent = `${pending} ${pending === 1 ? 'pendiente' : 'pendientes'}`;
    }
    
    function getFiltered() {
        let list = [...tasks];
        if (currentCatFilter) list = list.filter(t => t.categoryId === currentCatFilter);
        if (currentFilter === 'pending') list = list.filter(t => !t.done);
        if (currentFilter === 'done')    list = list.filter(t => t.done);
        return list;
    }
    
    // ══════════════════════════════════════════════════════
    //  CREATE TASK ELEMENT
    // ══════════════════════════════════════════════════════
    function createTaskEl(task) {
        const li = document.createElement('li');
        li.className = `task-item${task.done ? ' done' : ''}`;
        li.dataset.id = task.id;
    
        // ── main row
        const main = document.createElement('div');
        main.className = 'task-main';
    
        // Checkbox
        const check = document.createElement('button');
        check.className = 'task-check';
        check.setAttribute('aria-label', task.done ? 'Marcar pendiente' : 'Marcar completada');
        check.addEventListener('click', () => toggleTask(task.id));
    
        // Body
        const body = document.createElement('div');
        body.className = 'task-body';
    
        // Title row
        const titleRow = document.createElement('div');
        titleRow.className = 'task-title-row';
    
        const titleSpan = document.createElement('span');
        titleSpan.className = 'task-title-text';
        titleSpan.textContent = task.title;
        titleRow.appendChild(titleSpan);
    
        // Category pill
        if (task.categoryId) {
        const cat = categories.find(c => c.id === task.categoryId);
        if (cat) {
            const pill = document.createElement('span');
            pill.className = 'task-cat-pill';
            pill.textContent = cat.name;
            pill.style.background = cat.color + '22';
            pill.style.color = cat.color;
            pill.style.border = `1px solid ${cat.color}44`;
            titleRow.appendChild(pill);
        }
        }
    
        body.appendChild(titleRow);
    
        // Meta: desc + date
        const meta = document.createElement('div');
        meta.className = 'task-meta';
    
        if (task.desc) {
        const d = document.createElement('span');
        d.className = 'task-desc';
        d.textContent = task.desc;
        meta.appendChild(d);
        }
    
        if (task.date) {
        const dateEl = document.createElement('span');
        dateEl.className = 'task-date';
        const daysLeft = getDaysLeft(task.date);
        const formatted = formatDate(task.date);
    
        if (!task.done && daysLeft < 0) {
            dateEl.classList.add('overdue');
            dateEl.innerHTML = `◷ ${formatted} <span style="font-style:italic">(vencida)</span>`;
        } else if (!task.done && daysLeft <= 2) {
            dateEl.classList.add('soon');
            dateEl.innerHTML = `◷ ${formatted} <span style="font-style:italic">${daysLeft === 0 ? '(hoy)' : daysLeft === 1 ? '(mañana)' : `(${daysLeft} días)`}</span>`;
        } else {
            dateEl.innerHTML = `◷ ${formatted}`;
        }
        meta.appendChild(dateEl);
        }
    
        if (meta.children.length) body.appendChild(meta);
    
        // Delete btn
        const del = document.createElement('button');
        del.className = 'delete-btn';
        del.setAttribute('aria-label', 'Eliminar');
        del.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
        del.addEventListener('click', () => deleteTask(task.id, li));
    
        main.appendChild(check);
        main.appendChild(body);
        main.appendChild(del);
        li.appendChild(main);
    
        return li;
    }
    
    // ══════════════════════════════════════════════════════
    //  UTILS
    // ══════════════════════════════════════════════════════
    function formatDate(dateStr) {
        const [y, m, d] = dateStr.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    
    function getDaysLeft(dateStr) {
        const [y, m, d] = dateStr.split('-').map(Number);
        const target = new Date(y, m - 1, d);
        const today  = new Date();
        today.setHours(0,0,0,0);
        return Math.round((target - today) / (1000 * 60 * 60 * 24));
    }
    
    function shake(el) {
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = 'shake 0.4s ease';
        setTimeout(() => el.style.animation = '', 400);
        if (!document.getElementById('shakeStyle')) {
        const s = document.createElement('style');
        s.id = 'shakeStyle';
        s.textContent = `@keyframes shake {
            0%,100%{transform:translateX(0)}
            20%{transform:translateX(-6px)}
            40%{transform:translateX(6px)}
            60%{transform:translateX(-4px)}
            80%{transform:translateX(4px)}
        }`;
        document.head.appendChild(s);
        }
    }
    
    function save(key, data) {
        try { localStorage.setItem(key, JSON.stringify(data)); } catch(_) {}
    }
    function load(key) {
        try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : null; } catch(_) { return null; }
    }