// --- 遊戲設定資料 ---
const STYLE_CATEGORIES = ['Feline (貓科)', 'Canine (犬科)'];

// 特徵列表：聚焦於貓犬科的生物特徵
const DESIGN_FEATURES = [ 
    { id: 'F1', name: 'Snout Length (口鼻長度)' }, // 犬科特徵
    { id: 'F2', name: 'Ear Shape (耳朵形狀)' },
    { id: 'F3', name: 'Eye Shape/Pupil (眼睛形狀/瞳孔)' }, // 貓科特徵
    { id: 'F4', name: 'Claws (爪子是否可伸縮)' }, // 貓科特徵
    { id: 'F5', name: 'Body Posture (身體姿態/站姿)' }, // 犬科特徵
    { id: 'F6', name: 'Tail Shape (尾巴形狀/動作)' } 
];

// 真實的特徵與分類映射 (用於 Step 4 診斷)
const TRUE_FEATURE_MAPPINGS = {
    'Feline (貓科)': ['F3', 'F4', 'F2'], 
    'Canine (犬科)': ['F1', 'F5', 'F6']
};

// 遊戲狀態追蹤
let GAME_DATA = []; // 訓練集數據 (包含真實答案)
let studentsFeatures = []; // 學生選擇的特徵
let studentClassification = {}; // 學生 Step 1 的分類結果 { imgId: 'Feline (貓科)', ... }
let testImage = null; // 測試圖片
let studentTestPrediction = ''; // 學生在 Step 3 的最終判斷
let finalDiagnosis = {}; // 最終診斷結果

// --- 輔助函式：切換步驟 ---
function showStep(stepId) {
    document.querySelectorAll('.game-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(stepId).classList.add('active');
}

// --- 圖片資料模擬 (您需要替換為後端生成的 JSON 數據) ---
async function loadImagesData() {
    // *** ❗❗❗ 請將以下數據替換為您的實際圖片 JSON 數據 ❗❗❗ ***
    const allImages = [
        // 訓練圖片應包含真實答案，但 Step 1 不使用
        { id: 'img1', imageURL: 'img/feline/cat_1.png', trueAnswer: 'Feline (貓科)' },
        { id: 'img2', imageURL: 'img/canine/dog_1.png', trueAnswer: 'Canine (犬科)' },
        { id: 'img3', imageURL: 'img/feline/tiger_1.png', trueAnswer: 'Feline (貓科)' },
        { id: 'img4', imageURL: 'img/canine/wolf_1.png', trueAnswer: 'Canine (犬科)' },
        { id: 'img5', imageURL: 'img/feline/panther_1.png', trueAnswer: 'Feline (貓科)' },
        { id: 'img6', imageURL: 'img/canine/fox_1.png', trueAnswer: 'Canine (犬科)' },
        { id: 'img7', imageURL: 'img/feline/cheetah_1.png', trueAnswer: 'Feline (貓科)' },
        { id: 'img8', imageURL: 'img/canine/jackal_1.png', trueAnswer: 'Canine (犬科)' },
    ];

    const testIndex = Math.floor(Math.random() * allImages.length);
    testImage = allImages[testIndex];
    GAME_DATA = allImages.filter((_, index) => index !== testIndex);

    if (GAME_DATA.length < 1) {
        alert("錯誤：訓練圖片數量不足。請確保 JSON 數據中至少有 2 張圖片。");
    }
}

// --- Step 1 邏輯：學生自由分類 (模擬 AI 訓練數據準備) ---
async function initStep1() {
    await loadImagesData(); 
    
    const imagePool = document.getElementById('image-pool');
    const dropTargets = document.getElementById('classification-targets');
    imagePool.innerHTML = '';
    dropTargets.innerHTML = '';
    studentClassification = {};

    // 載入訓練圖片
    GAME_DATA.forEach(data => {
        const img = document.createElement('img');
        img.src = data.imageURL;
        img.id = data.id;
        img.className = 'draggable-img';
        img.setAttribute('draggable', true);
        img.addEventListener('dragstart', dragStart);
        imagePool.appendChild(img);
    });

    // 載入分類框
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
    
    document.getElementById('step1-message').textContent = '請根據你的直覺，將圖片分類到你設計的兩個類別中。';
}

function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.id);
    setTimeout(() => { e.target.style.opacity = '0.5'; }, 0);
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
    
    // 允許圖片在分類框間移動
    if (e.currentTarget.classList.contains('drop-target')) {
        e.currentTarget.appendChild(draggable);
        draggable.style.opacity = '1';
        draggable.setAttribute('draggable', true); 
        // 記錄學生的分類結果
        studentClassification[id] = e.currentTarget.dataset.category; 
    } else {
        // [修正] 如果圖片被拖到非分類框 (例如 image-pool)，應清除記錄
        // 但由於您的 drop 邏輯只處理 drop-target，我們需要一個機制處理移回
        // 為了簡化，我們假設學生會將所有圖片分配到 drop-target
        draggable.style.opacity = '1';
    }
}

function checkStep1() {
    const totalImages = GAME_DATA.length;
    let classifiedCount = 0;
    
    // [簡化] 重新計算已分配的圖片數量
    document.querySelectorAll('.drop-target').forEach(target => {
        classifiedCount += target.querySelectorAll('.draggable-img').length;
    });

    if (classifiedCount === totalImages) {
        document.getElementById('step1-message').textContent = `分類完成! (Classification Complete!) ${classifiedCount}/${totalImages} 張圖片已分配。`;
        document.getElementById('step1-message').classList.add('success');
        setTimeout(() => {
            showStep('step2');
            initStep2();
        }, 1000);
    } else {
        document.getElementById('step1-message').textContent = `請將所有 ${totalImages} 張圖片都分配到分類框中。`;
        document.getElementById('step1-message').classList.remove('success');
    }
}

// --- Step 2 邏輯：特徵定義 (模擬 AI 規則建立) ---
function initStep2() {
    const featureOptions = document.getElementById('feature-options');
    const reviewArea = document.getElementById('student-classification-review');
    featureOptions.innerHTML = '';
    reviewArea.innerHTML = ''; // 清空預覽區
    studentsFeatures = [];

    document.getElementById('step2-message').textContent = '你剛剛的分類是根據哪些 **Feature** (特徵)？請選擇 3 個最重要的特徵。';

    // 1. 視覺化學生 Step 1 的分類結果
    const classifiedGroups = {};
    STYLE_CATEGORIES.forEach(cat => classifiedGroups[cat] = []);

    // 將圖片按照學生的分類結果分組
    GAME_DATA.forEach(data => {
        const studentCat = studentClassification[data.id];
        if (studentCat) {
            classifiedGroups[studentCat].push(data);
        }
    });

    // 顯示分組結果
    let reviewHTML = '<h3>你的訓練數據分類 (Your **Training Classification**)</h3>';
    STYLE_CATEGORIES.forEach(category => {
        const images = classifiedGroups[category];
        reviewHTML += `
            <div class="review-group">
                <h4>${category} (${images.length} 張)</h4>
                <div class="review-images-container">
                    ${images.map(data => 
                        `<div class="review-img-wrapper">
                            <img src="${data.imageURL}" alt="${data.id}" class="review-img">
                        </div>`
                    ).join('')}
                </div>
            </div>
        `;
    });
    reviewArea.innerHTML = reviewHTML;

    // 2. 載入特徵選擇選項
    DESIGN_FEATURES.forEach(feature => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" value="${feature.id}" name="feature">${feature.name}`;
        featureOptions.appendChild(label);
    });

    document.querySelectorAll('#feature-options input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleFeatureSelection);
    });
    document.getElementById('step2-message').classList.remove('success'); // 清除舊訊息
}

function handleFeatureSelection(e) {
    const checkbox = e.target;
    const message = document.getElementById('step2-message');
    if (checkbox.checked) {
        if (studentsFeatures.length < 3) {
            studentsFeatures.push(checkbox.value);
            message.textContent = `已選擇 ${studentsFeatures.length}/3 個特徵。`;
        } else {
            checkbox.checked = false; 
            message.textContent = '最多只能選擇 3 個特徵 (Max 3 **Features**).';
        }
    } else {
        studentsFeatures = studentsFeatures.filter(id => id !== checkbox.value);
        message.textContent = `已選擇 ${studentsFeatures.length}/3 個特徵。`;
    }
}

function goToStep3() {
    if (studentsFeatures.length === 0) {
        alert("請至少選擇一個 **Feature** (特徵)!");
        return;
    }
    
    // 設置 Step 3 的測試圖片
    const testImgElement = document.getElementById('test-image');
    testImgElement.src = testImage.imageURL;
    testImgElement.alt = `Test Image for Prediction`; 
    
    // 載入 Step 3 特徵列表
    const step3Features = document.getElementById('step3-features');
    step3Features.innerHTML = `
        <p>你選擇的 AI 判斷特徵:</p>
        <ul>
            ${studentsFeatures.map(fId => `<li>${DESIGN_FEATURES.find(f => f.id === fId).name}</li>`).join('')}
        </ul>
    `;
    
    showStep('step3');
}

// --- Step 3 邏輯：規則應用與推論 (模擬 AI 推論引擎) ---
function revealPrediction() {
    if (!testImage) return;

    const selectedCategory = document.querySelector('input[name="finalPrediction"]:checked');
    if (!selectedCategory) {
        alert("請點選你的最終推論結果 (Final **Inference** Result)!");
        return;
    }

    studentTestPrediction = selectedCategory.value;
    
    // 進入 Step 4 結算
    showStep('step4');
    finalScore(); 
}

// --- Step 4 邏輯：模型診斷與計分 ---
function finalScore() {
    // 1. 訓練準確度 (與真實答案相比)
    let ruleStabilityScore = 0; // 衡量學生規則與真實世界規則的相符度
    GAME_DATA.forEach(data => {
        const studentCategory = studentClassification[data.id];
        if (studentCategory === data.trueAnswer) {
            ruleStabilityScore++; // 分類結果與真實答案相同
        }
    });
    const ruleStabilityPercentage = (ruleStabilityScore / GAME_DATA.length) * 100;

    // 2. 特徵效率 (所選特徵的有效性)
    let featureEfficiencyScore = 0;
    studentsFeatures.forEach(fId => {
        if (TRUE_FEATURE_MAPPINGS['Feline (貓科)'].includes(fId) || TRUE_FEATURE_MAPPINGS['Canine (犬科)'].includes(fId)) {
            featureEfficiencyScore += 1; // 選擇了任一類別的關鍵特徵，加分
        }
    });
    const featureEfficiencyPercentage = (featureEfficiencyScore / 3) * 100; // 3個特徵中選對幾個關鍵

    // 3. 最終預測準確度
    const finalPredictionCorrect = (studentTestPrediction === testImage.trueAnswer);

    // 輸出診斷結果
    const resultDiv = document.getElementById('diagnosis-results');
    resultDiv.innerHTML = `
        <h2>📋 模型診斷結果 (Model Diagnosis)</h2>
        <p>你的目標：設計一個能準確分類貓科/犬科的 AI 模型。</p>
        <hr>
        
        <h3>1. 規則穩定性 (Rule Stability)</h3>
        <p>這是你訓練模型時，分類結果與真實世界答案的吻合度。</p>
        <p class="score-result">✅ 訓練分類準確度: <strong>${ruleStabilityScore}/${GAME_DATA.length}</strong> (${ruleStabilityPercentage.toFixed(0)}%)</p>
        ${ruleStabilityPercentage < 70 ? '<p style="color:red;">**診斷:** 你的初始分類 (訓練數據標籤) 本身可能就不夠穩定或準確，導致模型基礎不穩！</p>' : ''}
        <hr>

        <h3>2. 特徵效率 (Feature Efficiency)</h3>
        <p>這是你選取的 3 個特徵 (Features) 中，有多少是真正能區分貓/犬科的關鍵特徵。</p>
        <p class="score-result">🔑 關鍵特徵選取數量: <strong>${featureEfficiencyScore}/3</strong> (${featureEfficiencyPercentage.toFixed(0)}%)</p>
        ${featureEfficiencyScore < 2 ? '<p style="color:red;">**診斷:** 你選擇的特徵太過籠統或不具區分性，導致 AI 無法提取關鍵差異！</p>' : ''}
        <hr>

        <h3>3. 最終推論準確度 (Inference Accuracy)</h3>
        <p>你的 AI 模型 (你的推論) 成功預測了新的圖片嗎？</p>
        <p class="score-result">🎯 測試圖片真實答案: <strong>${testImage.trueAnswer}</strong></p>
        <p class="score-result">你的最終判斷: <strong>${studentTestPrediction}</strong></p>
        <p style="font-size: 1.2em; color: ${finalPredictionCorrect ? 'green' : 'red'};"><strong>推論結果：${finalPredictionCorrect ? '正確！ (Correct!)' : '錯誤！ (Error!)'}</strong></p>
    `;
    
    // 結尾討論：引導學生思考是 Step 1 (數據標籤) 還是 Step 2 (特徵選擇) 造成了最終的錯誤。
}

// 啟動遊戲
document.addEventListener('DOMContentLoaded', initStep1);