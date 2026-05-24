const GRID_SIZE = 8;
let gridState = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
let score = 0;
let selectedBlockIndex = null;
let currentOptions = [];

// Template bentuk balok (1 = terisi, 0 = kosong)
const BLOCK_SHAPES = [
    { shape: [[1]], color: '#ff5722' }, // 1x1
    { shape: [[1, 1]], color: '#2196f3' }, // 1x2
    { shape: [[1, 1, 1]], color: '#4caf50' }, // 1x3
    { shape: [[1], [1]], color: '#ffeb3b' }, // 2x1 vertikal
    { shape: [[1, 1], [1, 1]], color: '#9c27b0' }, // 2x2 Kotak
    { shape: [[1, 1, 1], [0, 1, 0]], color: '#00bcd4' } // T-Shape
];

const gridElement = document.getElementById('grid');
const optionsContainer = document.getElementById('block-options');
const scoreElement = document.getElementById('score');
const restartBtn = document.getElementById('restart-btn');

// 1. Inisialisasi Grid Utama
function createGrid() {
    gridElement.innerHTML = '';
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.addEventListener('click', () => handleGridClick(r, c));
            gridElement.appendChild(cell);
        }
    }
}

// Update Tampilan Grid berdasarkan Array State
function updateGridDOM() {
    const cells = gridElement.children;
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const index = r * GRID_SIZE + c;
            if (gridState[r][c] !== 0) {
                cells[index].classList.add('filled');
                cells[index].style.backgroundColor = gridState[r][c];
            } else {
                cells[index].classList.remove('filled');
                cells[index].style.backgroundColor = '';
            }
        }
    }
}

// 2. Generate 3 Pilihan Balok acak
function generateOptions() {
    optionsContainer.innerHTML = '';
    currentOptions = [];

    for (let i = 0; i < 3; i++) {
        const randomBlock = BLOCK_SHAPES[Math.floor(Math.random() * BLOCK_SHAPES.length)];
        currentOptions.push(randomBlock);

        const blockOpt = document.createElement('div');
        blockOpt.classList.add('block-option');
        blockOpt.dataset.index = i;
        
        // Atur grid css dinamis sesuai bentuk balok
        blockOpt.style.gridTemplateRows = `repeat(${randomBlock.shape.length}, 1fr)`;
        blockOpt.style.gridTemplateColumns = `repeat(${randomBlock.shape[0].length}, 1fr)`;

        randomBlock.shape.forEach(row => {
            row.forEach(cellValue => {
                const blockCell = document.createElement('div');
                blockCell.classList.add('block-cell');
                if (cellValue === 1) {
                    blockCell.classList.add('filled');
                    blockCell.style.backgroundColor = randomBlock.color;
                }
                blockOpt.appendChild(blockCell);
            });
        });

        blockOpt.addEventListener('click', () => selectBlockOption(i));
        optionsContainer.appendChild(blockOpt);
    }
}

function selectBlockOption(index) {
    if (!currentOptions[index]) return;
    
    // Reset style pilihan sebelumnya
    document.querySelectorAll('.block-option').forEach(el => el.style.outline = '');
    
    selectedBlockIndex = index;
    optionsContainer.children[index].style.outline = '3px solid #ffffff';
}

// 3. Logika Menaruh Balok di Grid
function handleGridClick(row, col) {
    if (selectedBlockIndex === null) return;
    
    const block = currentOptions[selectedBlockIndex];
    if (!block) return;

    // Cek apakah muat ditaruh di koordinat tersebut (kiri atas balok jadi patokan)
    if (canPlaceBlock(row, col, block.shape)) {
        placeBlock(row, col, block);
        
        // Hapus balok dari pilihan
        optionsContainer.children[selectedBlockIndex].innerHTML = '';
        currentOptions[selectedBlockIndex] = null;
        selectedBlockIndex = null;

        // Cek baris/kolom yang penuh (Blast!)
        checkLineBlasts();

        // Jika 3 pilihan balok sudah habis dipakai semua, isi ulang baru
        if (currentOptions.every(opt => opt === null)) {
            generateOptions();
        }

        // Cek apakah game over
        if (isGameOver()) {
            alert(`Game Over! Skor Akhir Kamu: ${score}`);
            restartBtn.classList.remove('hidden');
        }
    }
}

function canPlaceBlock(startRow, startCol, shape) {
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] === 1) {
                const targetRow = startRow + r;
                const targetCol = startCol + c;

                // Cek batas grid luar
                if (targetRow >= GRID_SIZE || targetCol >= GRID_SIZE) return false;
                // Cek apakah sudah terisi balok lain
                if (gridState[targetRow][targetCol] !== 0) return false;
            }
        }
    }
    return true;
}

function placeBlock(startRow, startCol, block) {
    for (let r = 0; r < block.shape.length; r++) {
        for (let c = 0; c < block.shape[r].length; c++) {
            if (block.shape[r][c] === 1) {
                gridState[startRow + r][startCol + c] = block.color;
                score += 10;
            }
        }
    }
    scoreElement.innerText = score;
    updateGridDOM();
}

// 4. Logika Menghancurkan Baris/Kolom yang penuh (Blast)
function checkLineBlasts() {
    let rowsToBlast = [];
    let colsToBlast = [];

    // Cek baris penuh
    for (let r = 0; r < GRID_SIZE; r++) {
        if (gridState[r].every(cell => cell !== 0)) rowsToBlast.push(r);
    }

    // Cek kolom penuh
    for (let c = 0; c < GRID_SIZE; c++) {
        let colFilled = true;
        for (let r = 0; r < GRID_SIZE; r++) {
            if (gridState[r][c] === 0) {
                colFilled = false;
                break;
            }
        }
        if (colFilled) colsToBlast.push(c);
    }

    // Eksekusi Blast!
    rowsToBlast.forEach(r => {
        gridState[r] = Array(GRID_SIZE).fill(0);
        score += 100;
    });

    colsToBlast.forEach(c => {
        for (let r = 0; r < GRID_SIZE; r++) {
            gridState[r][c] = 0;
        }
        score += 100;
    });

    if (rowsToBlast.length > 0 || colsToBlast.length > 0) {
        scoreElement.innerText = score;
        updateGridDOM();
    }
}

// 5. Cek Game Over
function isGameOver() {
    // Cari apakah masih ada ruang untuk balok tersisa di grid
    for (let i = 0; i < currentOptions.length; i++) {
        const block = currentOptions[i];
        if (!block) continue;

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (canPlaceBlock(r, c, block.shape)) {
                    return false; // Masih ada jalan!
                }
            }
        }
    }
    return true; // Tidak ada ruang tersisa untuk balok manapun
}

// 6. Tombol Main Lagi
restartBtn.addEventListener('click', () => {
    gridState = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
    score = 0;
    scoreElement.innerText = score;
    selectedBlockIndex = null;
    restartBtn.classList.add('hidden');
    createGrid();
    generateOptions();
});

// Jalankan Game Pertama Kali
createGrid();
generateOptions();
