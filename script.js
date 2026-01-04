const rowsInput = document.getElementById('rows');
const colsInput = document.getElementById('cols');
const applyBtn = document.getElementById('apply-btn');
const resetBtn = document.getElementById('reset-btn');
const themeToggle = document.getElementById('theme-toggle');
const gridContainer = document.getElementById('grid');
const cardsList = document.getElementById('cards-list');

// Configuration
const defaultCards = 9; // Number of images found
const imagePath = 'img/image'; // Base path for images
const imageExt = '.jpg';

let isDarkMode = false;

// Initialize
function init() {
    renderGrid();
    renderCards();
    setupEventListeners();
}

// Generate Grid
function renderGrid() {
    const rows = parseInt(rowsInput.value);
    const cols = parseInt(colsInput.value);

    // Set grid template
    // Use fixed size for columns to match CSS width (100px) + gap
    gridContainer.style.gridTemplateColumns = `repeat(${cols + 1}, 100px)`;
    // Header row 50px, content rows 100px
    gridContainer.style.gridTemplateRows = `50px repeat(${rows}, 100px)`;

    gridContainer.innerHTML = '';

    // Corner Label (Empty)
    createCell('', 'header-cell');

    // Column Headers (A, B, C...)
    for (let c = 0; c < cols; c++) {
        const label = String.fromCharCode(65 + c); // A = 65
        createCell(label, 'header-cell');
    }

    // Grid Body
    for (let r = 1; r <= rows; r++) {
        // Row Header (1, 2, 3...)
        createCell(r, 'header-cell');

        // Cells
        for (let c = 0; c < cols; c++) {
            const colLabel = String.fromCharCode(65 + c);
            const cellId = `${colLabel}${r}`;
            createInteractiveCell(cellId);
        }
    }
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
        div.style.backgroundColor = 'var(--cell-hover)';
    });

    div.addEventListener('dragleave', () => {
        div.style.backgroundColor = '';
    });

    div.addEventListener('drop', (e) => handleDrop(e, div));

    // Click Event
    div.addEventListener('click', () => handleClick(div));

    gridContainer.appendChild(div);
}

let selectedImageSrc = null;

// Generate Cards Sidebar
function renderCards() {
    cardsList.innerHTML = '';
    for (let i = 1; i <= defaultCards; i++) {
        const img = document.createElement('img');
        img.src = `${imagePath} (${i})${imageExt}`;
        img.className = 'card-item';
        img.draggable = true;

        // Desktop DnD
        img.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', img.src);
            selectedImageSrc = null; // Clear click selection
            clearCardHighlights();
        });

        // Click to Select (Mobile/Desktop alternative)
        img.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent propagation
            selectedImageSrc = img.src;
            clearCardHighlights();
            img.classList.add('selected-card');
        });

        cardsList.appendChild(img);
    }
}

function clearCardHighlights() {
    document.querySelectorAll('.card-item').forEach(c => c.classList.remove('selected-card'));
}

// Interaction Logic
function handleDrop(e, cell) {
    e.preventDefault();
    cell.style.backgroundColor = ''; // Reset highlight
    const imgSrc = e.dataTransfer.getData('text/plain');
    placeImage(cell, imgSrc);
}

function handleClick(cell) {
    // If a card is selected from sidebar, try to place it
    if (selectedImageSrc) {
        placeImage(cell, selectedImageSrc);
        selectedImageSrc = null;
        clearCardHighlights();
        return;
    }

    const hasImage = cell.querySelector('img');
    const isCrossed = cell.classList.contains('crossed');

    if (hasImage) {
        // "Click a cell to X cross it and remove the card."
        clearCell(cell);
        cell.classList.add('crossed');
    } else if (isCrossed) {
        // "Click again to clear the cross."
        cell.classList.remove('crossed');
    } else {
        // Empty cell click -> Cross it (if no card selected)
        cell.classList.add('crossed');
    }
}

function placeImage(cell, src) {
    clearCell(cell);
    const img = document.createElement('img');
    img.src = src;
    img.className = 'placed-card';
    cell.appendChild(img);
}

function clearCell(cell) {
    // Remove images
    const img = cell.querySelector('img');
    if (img) img.remove();
    // Remove cross
    cell.classList.remove('crossed');
}

// Event Listeners
function setupEventListeners() {
    applyBtn.addEventListener('click', renderGrid);

    resetBtn.addEventListener('click', () => {
        renderGrid(); // Re-render is simplest reset
    });

    themeToggle.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('dark-mode', isDarkMode);
        themeToggle.querySelector('.icon').textContent = isDarkMode ? '☀️' : '🌙';
        themeToggle.childNodes[2].textContent = isDarkMode ? ' Light' : ' Dark';
    });
}

// Run
init();
