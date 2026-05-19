// --- 遊戲設定資料 ---
const STYLE_CATEGORIES = ['Flat Design', 'Neumorphism']; // 分類目標
const DESIGN_FEATURES = [ 
    { id: 'F1', name: 'Shadow Depth (陰影深度)' },
    { id: 'F2', name: 'Color Gradient (顏色漸層)' },
    { id: 'F3', name: 'Simple Geometric Shapes (簡單幾何形狀)' },
    { id: 'F4', name: 'Border/Outline Use (邊框/輪廓線使用)' },
    { id: 'F5', name: 'Soft Edges (柔和邊緣)' },
    { id: 'F6', name: 'High Contrast Colors (高對比顏色)' }
];
const GAME_DATA = [
    // 訓練集 (Training Set)
    { id: 'img1', imageURL: 'img/flat_button_1.png', correctAnswer: 'Flat Design', features: ['F3', 'F6'] },
    { id: 'img2', imageURL: 'img/neumorph_card_1.png', correctAnswer: 'Neumorphism', features: ['F1', 'F5'] },
    { id: 'img3', imageURL: 'img/flat_icon_2.png', correctAnswer: 'Flat Design', features: ['F3', 'F6'] },
    { id: 'img4', imageURL: 'img/neumorph_button_2.png', correctAnswer: 'Neumorphism', features: ['F1', 'F5'] },
];
const TEST_IMAGE_ID = 'img5';
const TEST_IMAGE_CORRECT_ANSWER = 'Flat Design'; // 測試圖片的正確答案

let studentsFeatures = [];
let correctCount = 0;

// --- 輔助函式：切換步驟 ---
function showStep(stepId) {
    document.querySelectorAll('.game-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(stepId).classList.add('active');
}

// --- Step 1 邏輯：分類 (Classification) ---
function initStep1() {
    const imagePool = document.getElementById('image-pool');
    const dropTargets = document.getElementById('classification-targets');
    imagePool.innerHTML = '';
    dropTargets.innerHTML = '';

    // 1. 動態生成圖片
    GAME_DATA.forEach(data => {
        const img = document.createElement('img');
        img.src = data.imageURL;
        img.id = data.id;
        img.className = 'draggable-img';
        img.setAttribute('draggable', true);
        img.dataset.answer = data.correctAnswer;
        img.addEventListener('dragstart', dragStart);
        imagePool.appendChild(img);
    });

    // 2. 動態生成分類框
    STYLE_CATEGORIES.forEach(category => {
        const target = document.createElement('div');
        target.className = 'drop-target';
        target.dataset.category = category;
        target.innerHTML = `<h3>${category}</h3>`;
        target.addEventListener('dragover', dragOver);
        target.addEventListener('dragleave', dragLeave);
        target.addEventListener('drop', drop);
        dropTargets.appendChild(target);
    });
}

function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.id);
    setTimeout(() => {
        e.target.style.opacity = '0.5';
    }, 0);
}

function dragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function dragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function drop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const id = e.dataTransfer.getData('text/plain');
    const draggable = document.getElementById(id);
    const targetCategory = e.currentTarget.dataset.category;
    
    // 檢查答案並將圖片放入分類框
    if (draggable.dataset.answer === targetCategory) {
        e.currentTarget.appendChild(draggable);
        draggable.style.opacity = '1';
        draggable.style.cursor = 'default';
        draggable.setAttribute('draggable', false); // 成功分類後不可再拖曳
    } else {
        // 錯誤分類，可以給予提示
        alert("錯誤的分類 (Wrong **Classification**!)");
        draggable.style.opacity = '1';
    }
}

function checkStep1() {
    correctCount = 0;
    const targets = document.querySelectorAll('.drop-target');
    let allClassified = true;

    // 計算分類正確數量
    targets.forEach(target => {
        const category = target.dataset.category;
        target.querySelectorAll('.draggable-img').forEach(img => {
            if (img.dataset.answer === category) {
                correctCount++;
            }
        });
    });

    // 檢查所有圖片是否都在分類框內
    if (document.getElementById('image-pool').children.length > 0) {
        allClassified = false;
    }
    
    const message = document.getElementById('step1-message');

    if (correctCount === GAME_DATA.length && allClassified) {
        message.textContent = `分類成功! (Classification Successful!) 進入特徵選擇。`;
        message.classList.add('success');
        setTimeout(() => {
            showStep('step2');
            initStep2();
        }, 1000);
    } else {
        message.textContent = `請將所有圖片正確拖曳到分類框中。`;
        message.classList.remove('success');
    }
}

// --- Step 2 邏輯：特徵選擇 (Feature Selection) ---
function initStep2() {
    const featureOptions = document.getElementById('feature-options');
    featureOptions.innerHTML = '';
    studentsFeatures = [];

    DESIGN_FEATURES.forEach(feature => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" value="${feature.id}" name="feature">${feature.name}`;
        featureOptions.appendChild(label);
    });

    document.querySelectorAll('#feature-options input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleFeatureSelection);
    });
}

function handleFeatureSelection(e) {
    const checkbox = e.target;
    if (checkbox.checked) {
        if (studentsFeatures.length < 3) {
            studentsFeatures.push(checkbox.value);
        } else {
            checkbox.checked = false; // 限制最多選 3 個
            document.getElementById('step2-message').textContent = '最多只能選擇 3 個特徵 (Max 3 **Features**).';
        }
    } else {
        studentsFeatures = studentsFeatures.filter(id => id !== checkbox.value);
        document.getElementById('step2-message').textContent = '';
    }
}

function goToStep3() {
    if (studentsFeatures.length === 0) {
        alert("請至少選擇一個 **Feature** (特徵)!");
        return;
    }
    console.log("學生選擇的特徵:", studentsFeatures);
    showStep('step3');
}

// --- Step 3 邏輯：預測 (Prediction) ---
function revealPrediction() {
    // 模擬 AI 預測邏輯 (Simplified AI Prediction Logic):
    let prediction = TEST_IMAGE_CORRECT_ANSWER; 
    let confidence = 0.50; // 基礎信心度 50%

    // 模擬：Flat Design (正確答案) 的關鍵特徵是 F3(簡單幾何) 和 F6(高對比顏色)
    // 如果學生選對了關鍵特徵，則信心度提高。
    const keyFeatures = ['F3', 'F6']; 

    studentsFeatures.forEach(fId => {
        if (keyFeatures.includes(fId)) {
            confidence += 0.15; // 選對關鍵特徵
        } else {
            confidence -= 0.05; // 選錯不相關特徵
        }
    });

    // 將信心度限制在 40% 到 100%
    confidence = Math.min(1.0, Math.max(0.4, confidence)); 

    const resultHTML = `
        <p>AI 觀察到你選擇的 **Features** (特徵) 進行分析...</p>
        <h3>AI's Prediction: 
            <span style="color:#dc3545;">${prediction}</span>
        </h3>
        <p>**Confidence** (信心度): 
            <span style="font-size: 1.2em;">${(confidence * 100).toFixed(0)}%</span>
        </p>
        <p>這個 **prediction** (預測) 是基於你訓練 AI 時提供的 **classification** (分類) 與 **features** (特徵) 所得。</p>
    `;

    document.getElementById('prediction-results').innerHTML = resultHTML;
    document.querySelector('.prediction-prompt button').disabled = true; // 防止重複點擊
}

// 啟動遊戲
document.addEventListener('DOMContentLoaded', initStep1);