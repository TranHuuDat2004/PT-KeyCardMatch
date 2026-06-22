const rowsInput = document.getElementById('rows');
const colsInput = document.getElementById('cols');
const resetBtn = document.getElementById('reset-btn');
const themeToggle = document.getElementById('theme-toggle');
const gridContainer = document.getElementById('grid');
const cardsList = document.getElementById('cards-list');
const versionSelect = document.getElementById('version-select');

// Configuration
const versions = {
    weather: {
        path: 'img/weather/',
        banner: 'img/banner/banner-weather.jpg',
        bannerTitle: 'Sự kiện: Đài Khí Tượng',
        cardBack: 'img/weather/card-back.png',
        images: [
            'coin.png',
            'hint.png',
            'magnifying-glass.png',
            'cloudy.png',
            'night.png',
            'rainy.png',
            'snow.png',
            'sun.png',
            'thunderous.png'
        ]
    },
    boat: {
        path: 'img/boat/',
        banner: 'img/banner/banner-boat.jpg',
        bannerTitle: 'Sự kiện: Đua Thuyền',
        cardBack: 'img/weather/card-back.png', // Fallback to weather card-back
        images: [
            'anchor.jpg',
            'boat.jpg',
            'cup.jpg',
            'diamond.jpg',
            'music.jpg',
            'steering-wheel.jpg',
            'hint.jpg',
            'magic-wand.jpg',
            'magnifying-glass.jpg',
        ]
    }
};

let currentVersion = 'weather';
let isDarkMode = false;

// Revert variables for modal cancel action
let prevRows = 3;
let prevCols = 8;
let prevVersion = 'weather';
let pendingAction = null;

let isLoadingState = false;

// Save current board configuration and cell states to localStorage
function saveState() {
    if (isLoadingState) return;
    const state = {
        currentVersion: currentVersion,
        rows: parseInt(rowsInput.value) || 3,
        cols: parseInt(colsInput.value) || 8,
        isDarkMode: isDarkMode,
        cells: {}
    };
    document.querySelectorAll('.interactive-cell').forEach(cell => {
        const id = cell.dataset.id;
        const img = cell.querySelector('img');
        const isCrossed = cell.classList.contains('crossed');
        if (img) {
            state.cells[id] = { type: 'image', src: img.getAttribute('src') };
        } else if (isCrossed) {
            state.cells[id] = { type: 'crossed' };
        }
    });
    localStorage.setItem('PT-KeyCardMatch-state', JSON.stringify(state));
}

// Load previous state from localStorage
function loadState() {
    const saved = localStorage.getItem('PT-KeyCardMatch-state');
    if (!saved) return false;
    try {
        isLoadingState = true;
        const state = JSON.parse(saved);
        
        if (state.currentVersion) {
            currentVersion = state.currentVersion;
            versionSelect.value = currentVersion;
            prevVersion = currentVersion;
        }
        
        if (state.rows) {
            rowsInput.value = state.rows;
            prevRows = state.rows;
        }
        if (state.cols) {
            colsInput.value = state.cols;
            prevCols = state.cols;
        }
        
        if (state.isDarkMode !== undefined) {
            isDarkMode = state.isDarkMode;
            document.body.classList.toggle('dark-mode', isDarkMode);
            themeToggle.querySelector('.icon').textContent = isDarkMode ? '☀️' : '🌙';
            themeToggle.childNodes[2].textContent = isDarkMode ? ' Light' : ' Dark';
        }
        
        applyVersionConfig();
        renderGrid();
        renderCards();
        
        if (state.cells) {
            document.querySelectorAll('.interactive-cell').forEach(cell => {
                const id = cell.dataset.id;
                const cellData = state.cells[id];
                if (cellData) {
                    if (cellData.type === 'image' && cellData.src) {
                        placeImage(cell, cellData.src);
                    } else if (cellData.type === 'crossed') {
                        cell.classList.add('crossed');
                    }
                }
            });
        }
        
        isLoadingState = false;
        return true;
    } catch (err) {
        console.error("Failed to load saved state:", err);
        isLoadingState = false;
        return false;
    }
}

// Initialize
function init() {
    const loaded = loadState();
    if (!loaded) {
        applyVersionConfig();
        renderGrid();
        renderCards();
    }
    setupEventListeners();
    initConfirmModal();
}

// Apply banner image, title text and card-back from versions config
function applyVersionConfig() {
    const config = versions[currentVersion];

    // Set card back CSS variable
    document.documentElement.style.setProperty('--card-back-url', `url('${config.cardBack}')`);

    // Set banner image and banner title
    const bannerImg = document.getElementById('banner-img');
    const bannerTitle = document.getElementById('banner-title');
    if (bannerImg) bannerImg.src = config.banner;
    if (bannerTitle) bannerTitle.textContent = config.bannerTitle;
}

// Check if any card has been placed on the grid
function hasPlacedCards() {
    return document.querySelector('.interactive-cell img') !== null;
}

// Show warning modal if there are placed cards, otherwise run immediately
function showConfirmModal(action) {
    if (hasPlacedCards()) {
        pendingAction = action;
        document.getElementById('confirm-modal').classList.add('active');
    } else {
        action();
    }
}

// Modal actions initialisation
function initConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');

    confirmBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        if (pendingAction) {
            pendingAction();
            pendingAction = null;
        }
    });

    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        pendingAction = null;

        // Revert UI fields back to their previous confirmed state
        rowsInput.value = prevRows;
        colsInput.value = prevCols;
        versionSelect.value = prevVersion;
    });
}

// Generate Grid with column headers at top and row headers on the right
function renderGrid() {
    const rows = parseInt(rowsInput.value) || 1;
    const cols = parseInt(colsInput.value) || 1;

    gridContainer.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size, 100px)) var(--header-size, 50px)`;
    gridContainer.style.gridTemplateRows = `var(--header-size, 50px) repeat(${rows}, var(--cell-size, 100px))`;

    gridContainer.innerHTML = '';

    // Column Headers (A, B, C...)
    for (let c = 0; c < cols; c++) {
        const label = String.fromCharCode(65 + c); // A = 65
        createCell(label, 'header-cell');
    }

    // Top-Right Corner (Empty)
    createCell('', 'header-cell');

    // Grid Rows
    for (let r = 1; r <= rows; r++) {
        // Cells (Interactive Droppable)
        for (let c = 0; c < cols; c++) {
            const colLabel = String.fromCharCode(65 + c);
            const cellId = `${colLabel}${r}`;
            createInteractiveCell(cellId);
        }

        // Row Header (1, 2, 3...) - placed on the right
        createCell(r, 'header-cell');
    }
    saveState();
}

function createCell(content, className = '') {
    const div = document.createElement('div');
    div.className = `cell ${className}`;
    div.textContent = content;
    gridContainer.appendChild(div);
}

function createInteractiveCell(id) {
    const div = document.createElement('div');
    div.className = 'cell interactive-cell';
    div.dataset.id = id;

    // Background Label
    const span = document.createElement('span');
    span.className = 'cell-label';
    span.textContent = id;
    div.appendChild(span);

    // Drop Events
    div.addEventListener('dragover', (e) => {
        e.preventDefault(); // Allow drop
        div.classList.add('drag-over');
    });

    div.addEventListener('dragleave', () => {
        div.classList.remove('drag-over');
    });

    div.addEventListener('drop', (e) => {
        div.classList.remove('drag-over');
        handleDrop(e, div);
    });

    // Click Event
    div.addEventListener('click', () => handleClick(div));

    gridContainer.appendChild(div);
}

let selectedImageSrc = null;

// Generate Cards Horizontal List
function renderCards() {
    cardsList.innerHTML = '';
    const config = versions[currentVersion];
    config.images.forEach(imageName => {
        const img = document.createElement('img');
        img.src = `${config.path}${imageName}`;
        img.className = 'card-item';
        img.draggable = true;

        // Desktop Drag n Drop
        img.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', img.src);
            selectedImageSrc = null; // Clear click selection
            clearCardHighlights();
            if (e.dataTransfer.setDragImage) {
                e.dataTransfer.setDragImage(img, 30, 30);
            }
        });

        // Mobile Touch Drag n Drop Support
        setupTouchDrag(img);

        // Click to Select (Mobile alternative)
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            if (selectedImageSrc === img.src) {
                // Toggle selection off
                selectedImageSrc = null;
                clearCardHighlights();
            } else {
                selectedImageSrc = img.src;
                clearCardHighlights();
                img.classList.add('selected-card');
            }
        });

        cardsList.appendChild(img);
    });
}

// Touch Drag and Drop handlers for Mobile
function setupTouchDrag(img) {
    let touchClone = null;
    let dragSrc = img.src;

    img.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) return;

        // Prevent page scrolling while dragging
        e.preventDefault();

        selectedImageSrc = img.src;
        clearCardHighlights();
        img.classList.add('selected-card');

        // Create a temporary clone for drag visualization
        touchClone = img.cloneNode(true);
        touchClone.classList.add('touch-drag-clone');
        document.body.appendChild(touchClone);

        const touch = e.touches[0];
        updateClonePosition(touchClone, touch);
    }, { passive: false });

    img.addEventListener('touchmove', (e) => {
        if (!touchClone) return;
        e.preventDefault();

        const touch = e.touches[0];
        updateClonePosition(touchClone, touch);

        // Highlight the interactive cell under the touch coordinate
        const cell = getCellFromPoint(touch.clientX, touch.clientY, touchClone);
        document.querySelectorAll('.interactive-cell').forEach(c => c.classList.remove('drag-over'));
        if (cell) {
            cell.classList.add('drag-over');
        }
    }, { passive: false });

    img.addEventListener('touchend', (e) => {
        if (!touchClone) return;
        e.preventDefault();

        const cell = getCellFromPoint(touch.clientX, touch.clientY, touchClone);

        touchClone.remove();
        touchClone = null;

        document.querySelectorAll('.interactive-cell').forEach(c => c.classList.remove('drag-over'));

        if (cell) {
            placeImage(cell, dragSrc);
            selectedImageSrc = null;
            clearCardHighlights();
        }
    }, { passive: false });
}

function updateClonePosition(clone, touch) {
    const isMobile = window.innerWidth <= 768;
    const size = isMobile ? 36 : 60;
    clone.style.position = 'fixed';
    clone.style.left = `${touch.clientX - size / 2}px`;
    clone.style.top = `${touch.clientY - size / 2}px`;
    clone.style.width = `${size}px`;
    clone.style.height = `${size}px`;
    clone.style.pointerEvents = 'none';
    clone.style.zIndex = '9999';
    clone.style.opacity = '0.9';
}

function getCellFromPoint(x, y, clone = null) {
    let cloneHidden = false;
    if (clone) {
        clone.style.display = 'none';
        cloneHidden = true;
    }
    const el = document.elementFromPoint(x, y);
    if (cloneHidden && clone) {
        clone.style.display = '';
    }
    if (!el) return null;
    return el.closest('.interactive-cell');
}

function clearCardHighlights() {
    document.querySelectorAll('.card-item').forEach(c => c.classList.remove('selected-card'));
}

// Interaction Logic
function handleDrop(e, cell) {
    e.preventDefault();
    const imgSrc = e.dataTransfer.getData('text/plain');
    if (imgSrc) {
        placeImage(cell, imgSrc);
    }
}

function handleClick(cell) {
    // If a card is selected, try to place it
    if (selectedImageSrc) {
        placeImage(cell, selectedImageSrc);
        selectedImageSrc = null;
        clearCardHighlights();
        return;
    }

    const hasImage = cell.querySelector('img');
    const isCrossed = cell.classList.contains('crossed');

    if (hasImage) {
        // Click a cell to X cross it and remove the card
        hasImage.classList.remove('bounce-in');
        hasImage.classList.add('bounce-out');
        cell.classList.add('crossed');
        saveState();
        setTimeout(() => {
            if (hasImage.parentNode === cell) {
                hasImage.remove();
                saveState();
            }
        }, 200); // Matches bounceOut animation duration
    } else if (isCrossed) {
        // Click again to clear the cross
        cell.classList.remove('crossed');
        saveState();
    } else {
        // Empty cell click -> Cross it
        cell.classList.add('crossed');
        saveState();
    }
}

function placeImage(cell, src) {
    clearCell(cell);
    const img = document.createElement('img');
    img.src = src;
    img.className = 'placed-card bounce-in';
    cell.appendChild(img);
    saveState();
}

function clearCell(cell) {
    // Remove images
    const img = cell.querySelector('img');
    if (img) img.remove();
    // Remove cross
    cell.classList.remove('crossed');
    saveState();
}

// Event Listeners
function setupEventListeners() {
    rowsInput.addEventListener('input', () => {
        const val = parseInt(rowsInput.value) || 1;
        showConfirmModal(() => {
            prevRows = val;
            renderGrid();
        });
    });

    colsInput.addEventListener('input', () => {
        const val = parseInt(colsInput.value) || 1;
        showConfirmModal(() => {
            prevCols = val;
            renderGrid();
        });
    });

    resetBtn.addEventListener('click', () => {
        showConfirmModal(() => {
            renderGrid(); // Re-render clears everything
        });
    });

    versionSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        showConfirmModal(() => {
            prevVersion = val;
            currentVersion = val;
            applyVersionConfig();
            renderGrid(); // Reset the grid
            renderCards(); // Re-render sidebar cards
        });
    });

    themeToggle.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('dark-mode', isDarkMode);
        themeToggle.querySelector('.icon').textContent = isDarkMode ? '☀️' : '🌙';
        themeToggle.childNodes[2].textContent = isDarkMode ? ' Light' : ' Dark';
        saveState();
    });
}

// Run
init();
