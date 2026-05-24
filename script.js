const GRID_SIZE = 8;
let gridState = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
let score = 0;
let highScore = localStorage.getItem('block_blast_highscore') || 0; // Ambil high score lama
let comboCount = 0; // Menghitung run combo berturut-turut
let selectedBlockIndex = null;
let currentOptions = [];

// Template bentuk balok
const BLOCK_SHAPES = [
    { shape: [[1]], color: '#ff5722' }, 
    { shape: [[1, 1]], color: '#2196f3' }, 
    { shape: [[1, 1, 1]], color: '#4caf50' }, 
    { shape: [[1], [1]], color: '#ffeb3b' }, 
    { shape: [[1, 1], [1, 1]], color: '#9c27b0' }, 
    { shape: [[1, 1, 1], [0, 1, 0]], color: '#00bcd4' } 
];

const gridElement = document.getElementById('grid');
const optionsContainer = document.getElementById('block-options');
const scoreElement = document.getElementById('score');
const restartBtn = document.getElementById('restart-btn');

// Buat elemen High Score di atas secara dinamis
const headerElement = document.querySelector('.header');
const highScoreBoard = document.createElement('div');
highScoreBoard.className = 'score-board';
highScoreBoard.style.backgroundColor = '#4caf50';
highScoreBoard.innerHTML = `Tertinggi: <span id="high-score">${highScore}</span>`;
headerElement.appendChild(highScoreBoard);

const highScoreElement = document.getElementById('high-score');

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

// 2. Generate Pilihan Balok
function generateOptions() {
    optionsContainer.innerHTML = '';
    currentOptions = [];

    for (let i = 0; i < 3; i++) {
        const randomBlock = BLOCK_SHAPES[Math.floor(Math.random() * BLOCK_SHAPES.length)];
        currentOptions.push(randomBlock);

        const blockOpt = document.createElement('div');
        blockOpt.classList.add('block-option');
        blockOpt.dataset.index = i;
        
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
    document.querySelectorAll('.block-option').forEach(el => el.style.outline = '');
    selectedBlockIndex = index;
    optionsContainer.children[index].style.outline = '3px solid #ffffff';
}

// 3. Logika Taruh Balok
function handleGridClick(row, col) {
    if (selectedBlockIndex === null) return;
    
    const block = currentOptions[selectedBlockIndex];
    if (!block) return;

    if (canPlaceBlock(row, col, block.shape)) {
        placeBlock(row, col, block);
        
        optionsContainer.children[selectedBlockIndex].innerHTML = '';
        currentOptions[selectedBlockIndex] = null;
        selectedBlockIndex = null;

        // Cek apakah ada baris yang hancur
        checkLineBlasts();

        if (currentOptions.every(opt => opt === null)) {
            generateOptions();
        }

        if (isGameOver()) {
            // Update High Score jika skor sekarang lebih tinggi
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('block_blast_highscore', highScore);
                highScoreElement.innerText = highScore;
                alert(`Gokil! Rekor Baru Tercipta: ${score} Poin!`);
            } else {
                alert(`Game Over! Skor Kamu: ${score}`);
            }
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
                if (targetRow >= GRID_SIZE || targetCol >= GRID_SIZE) return false;
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
                score += 10; // Skor standar naruh balok
            }
        }
    }
    scoreElement.innerText = score;
    updateGridDOM();
}

// 4. Logika Blast + Fitur Combo Baru
function checkLineBlasts() {
    let rowsToBlast = [];
    let colsToBlast = [];

    for (let r = 0; r < GRID_SIZE; r++) {
        if (gridState[r].every(cell => cell !== 0)) rowsToBlast.push(r);
    }

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

    const totalLines = rowsToBlast.length + colsToBlast.length;

    if (totalLines > 0) {
        comboCount += 1; // Naikkan tingkat combo
        
        // Rumus Skor: (Jumlah baris x 100) x bonus combo
        let bonusScore = (totalLines * 100) * comboCount;
        score += bonusScore;

        // Eksekusi pembersihan grid
        rowsToBlast.forEach(r => gridState[r] = Array(GRID_SIZE).fill(0));
        colsToBlast.forEach(c => {
            for (let r = 0; r < GRID_SIZE; r++) gridState[r][c] = 0;
        });

        scoreElement.innerText = score;
        updateGridDOM();
    } else {
        comboCount = 0; // Reset combo kalau langkah ini gak ada yang hancur
    }
}

// 5. Cek Game Over
function isGameOver() {
    for (let i = 0; i < currentOptions.length; i++) {
        const block = currentOptions[i];
        if (!block) continue;

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (canPlaceBlock(r, c, block.shape)) {
                    return false; 
                }
            }
        }
    }
    return true; 
}

// 6. Tombol Main Lagi
restartBtn.addEventListener('click', () => {
    gridState = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
    score = 0;
    comboCount = 0;
    scoreElement.innerText = score;
    selectedBlockIndex = null;
    restartBtn.classList.add('hidden');
    createGrid();
    generateOptions();
});

createGrid();
generateOptions();

// --- FUNGSI BLAST UPGRADE DENGAN EFEK ---
function checkLineBlasts() {
    let rowsToBlast = [];
    let colsToBlast = [];
    const cells = gridElement.children;

    // 1. Cek baris penuh
    for (let r = 0; r < GRID_SIZE; r++) {
        if (gridState[r].every(cell => cell !== 0)) rowsToBlast.push(r);
    }

    // 2. Cek kolom penuh
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

    const totalLines = rowsToBlast.length + colsToBlast.length;

    // 3. Eksekusi Efek dan Blast
    if (totalLines > 0) {
        comboCount += 1;
        let bonusScore = (totalLines * 100) * comboCount;
        score += bonusScore;

        // --- TAMBAHAN: Tampilkan Teks "+XXX" ---
        createPointsPop(`+${bonusScore}`);

        // --- TAMBAHAN: Tambah Class Animasi 'blasting' ke sel ---
        rowsToBlast.forEach(r => {
            for (let c = 0; c < GRID_SIZE; c++) {
                cells[r * GRID_SIZE + c].classList.add('blasting');
            }
        });
        colsToBlast.forEach(c => {
            for (let r = 0; r < GRID_SIZE; r++) {
                cells[r * GRID_SIZE + c].classList.add('blasting');
            }
        });

        // 4. Jeda Sebentar (0.3s) untuk Animasi, Lalu Hancurkan
        setTimeout(() => {
            // Bersihkan State (Hancurkan)
            rowsToBlast.forEach(r => gridState[r] = Array(GRID_SIZE).fill(0));
            colsToBlast.forEach(c => {
                for (let r = 0; r < GRID_SIZE; r++) gridState[r][c] = 0;
            });

            scoreElement.innerText = score;
            updateGridDOM(); // Grid refresh, class 'blasting' hilang otomatis

            // Hapus Class 'blasting' agar animasi bisa diulang (Jaga-jaga)
            const allCells = document.querySelectorAll('.cell.blasting');
            allCells.forEach(cell => cell.classList.remove('blasting'));
            
        }, 300); // 300ms jeda animasi

    } else {
        comboCount = 0;
    }
}

// FUNGSI PEMBANTU: Membuat teks "+XXX" melayang
function createPointsPop(text) {
    const pop = document.createElement('div');
    pop.className = 'points-pop';
    pop.innerText = text;
    
    // Taruh di tengah grid
    const gridRect = gridElement.getBoundingClientRect();
    pop.style.left = `${gridRect.width / 2}px`;
    pop.style.top = `${gridRect.height / 2}px`;
    
    gridElement.appendChild(pop);
    
    // Hapus elemen setelah animasi selesai (0.6s)
    setTimeout(() => {
        pop.remove();
    }, 600);
}
