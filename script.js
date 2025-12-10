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
let studentClassification = {}; // 學生 Step 1 的分類結果 { imgId: 'img1': 'Feline (貓科)', ... }
let testImage = null; // 測試圖片
let studentTestPrediction = ''; // 學生在 Step 3 的最終判斷

// --- 輔助函式：切換步驟 ---
function showStep(stepId) {
    document.querySelectorAll('.game-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(stepId).classList.add('active');
}

// --- 圖片資料模擬 (您需要替換為後端生成的 JSON 數據) ---
const FULL_IMAGE_DATABASE = [
    // --- Feline (貓科) 圖片 ---
    { id: 'f1', imageURL: 'img/feline/cat_1.png', trueAnswer: 'Feline (貓科)' },
    { id: 'f2', imageURL: 'img/feline/lion_1.png', trueAnswer: 'Feline (貓科)' },
    { id: 'f3', imageURL: 'img/feline/tiger_1.png', trueAnswer: 'Feline (貓科)' },
    { id: 'f4', imageURL: 'img/feline/cheetah_1.png', trueAnswer: 'Feline (貓科)' },
    { id: 'f5', imageURL: 'img/feline/cougar_1.png', trueAnswer: 'Feline (貓科)' },
    { id: 'f6', imageURL: 'img/feline/lynx_1.png', trueAnswer: 'Feline (貓科)' },
    // --- Canine (犬科) 圖片 ---
    { id: 'c1', imageURL: 'img/canine/dog_1.png', trueAnswer: 'Canine (犬科)' },
    { id: 'c2', imageURL: 'img/canine/wolf_1.png', trueAnswer: 'Canine (犬科)' },
    { id: 'c3', imageURL: 'img/canine/fox_1.png', trueAnswer: 'Canine (犬科)' },
    { id: 'c4', imageURL: 'img/canine/coyote_1.png', trueAnswer: 'Canine (犬科)' },
    { id: 'c5', imageURL: 'img/canine/jackal_1.png', trueAnswer: 'Canine (犬科)' },
    { id: 'c6', imageURL: 'img/canine/wilddog_1.png', trueAnswer: 'Canine (犬科)' },
];

// 核心函式：隨機抽取圖片
function getRandomSubset(arr, count) {
    const shuffled = arr.slice(0);
    let i = arr.length;
    let temp, index;
    // Fisher-Yates 洗牌算法
    while (i--) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(0, count);
}

async function loadImagesData() {
    const felineImages = FULL_IMAGE_DATABASE.filter(img => img.trueAnswer === 'Feline (貓科)');
    const canineImages = FULL_IMAGE_DATABASE.filter(img => img.trueAnswer === 'Canine (犬科)');

    const totalFeline = felineImages.length;
    const totalCanine = canineImages.length;

    // 檢查基本數量要求
    if (totalFeline < 4 || totalCanine < 4) {
        alert("錯誤：圖庫中貓科或犬科圖片數量不足4張，無法滿足訓練集(各3張)和測試集(1張)的要求。");
        return;
    }

    // --- 1. 抽取訓練集 (共 10 張，各至少 3 張) ---
    const MIN_PER_CATEGORY = 3;
    const TARGET_TRAINING_SIZE = 10;
    
    // 確保貓科和犬科各至少有 3 張
    let trainingFeline = getRandomSubset(felineImages, MIN_PER_CATEGORY);
    let trainingCanine = getRandomSubset(canineImages, MIN_PER_CATEGORY);
    
    // 將訓練集中已抽取的圖片從大圖庫中移除，得到剩餘的圖片列表
    const remainingFeline = felineImages.filter(img => !trainingFeline.includes(img));
    const remainingCanine = canineImages.filter(img => !trainingCanine.includes(img));
    const remainingImages = remainingFeline.concat(remainingCanine);

    // 計算還需要補足的圖片數量
    const needed = TARGET_TRAINING_SIZE - (trainingFeline.length + trainingCanine.length);

    // 從剩餘的圖片中隨機抽取所需數量來補足 10 張
    const fillerImages = getRandomSubset(remainingImages, needed);

    // 組成最終訓練集
    const finalTrainingImages = trainingFeline.concat(trainingCanine, fillerImages);
    GAME_DATA = finalTrainingImages;

    // --- 2. 抽取測試集 (從未被抽出的圖片中選取 1 張) ---
    
    // 從剩餘圖片 (未在 finalTrainingImages 中) 再次排除已用作補足的圖片
    const finalRemainingForTest = remainingImages.filter(img => !fillerImages.includes(img));

    if (finalRemainingForTest.length === 0) {
         // 極低概率發生：圖庫大小剛好是 10 張
        alert("警告：訓練集已用盡所有圖片。無法找到獨立的測試圖片。");
        testImage = GAME_DATA[0]; // 退而求其次，隨機選用訓練集中的一張
    } else {
        // 從剩下所有圖片中隨機選一張作為測試圖片
        const testIndex = Math.floor(Math.random() * finalRemainingForTest.length);
        testImage = finalRemainingForTest[testIndex];
    }

    if (GAME_DATA.length < 1) {
        alert("錯誤：訓練圖片數量不足。");
    }
}

// --- Step 1 邏輯：學生自由分類 (模擬 AI 訓練數據準備) ---
async function initStep1(isOptimization = false) {
    // 1. 初次載入數據 (優化模式下跳過，直接使用現有 GAME_DATA)
    isOptimization = (isOptimization === true);

    if (!isOptimization) {
        await loadImagesData();
    }
    
    const imagePool = document.getElementById('image-pool');
    const dropTargets = document.getElementById('classification-targets');
    
    // 2. 清空所有動態內容
    dropTargets.innerHTML = '';
    
    // 3. 處理圖片歸位 (優化模式) 或初次載入 (清空所有圖片)
    if (isOptimization) {
        // 優化模式：將圖片從分類框移回 imagePool
        document.querySelectorAll('.drop-target').forEach(target => {
            target.querySelectorAll('.draggable-img').forEach(img => {
                imagePool.appendChild(img);
            });
        });
        studentClassification = {}; // 重置分類記錄
    } else {
        // 初次載入：清空 imagePool，準備重新繪製所有圖片
        imagePool.innerHTML = '';
        studentClassification = {}; 
    }

    // 4. 創建或移動訓練圖片到 imagePool
    GAME_DATA.forEach(data => {
        let img = document.getElementById(data.id);
        
        // 只有在初次載入時 (img不存在)，才創建新的 img 元素
        if (!img) {
            img = document.createElement('img');
            img.src = data.imageURL;
            img.id = data.id;
            img.className = 'draggable-img';
            img.addEventListener('dragstart', dragStart);
        }
        
        img.setAttribute('draggable', true);
        imagePool.appendChild(img); // 確保圖片在 DOM 中
    });

    // 5. 載入分類框
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
    
    // 6. 訊息提示
    document.getElementById('step1-message').textContent = '請根據你的直覺，將圖片分類到你設計的兩個類別中。';
    if (isOptimization) {
        document.getElementById('step1-message').textContent = '🔄 優化模式: 請檢視並修正你對訓練數據的分類標籤。';
    }
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
    
    // 修正 Bug 2: 僅在目標是有效的分類框時，才更新 DOM 和記錄狀態
    if (e.currentTarget.classList.contains('drop-target')) {
        e.currentTarget.appendChild(draggable);
        draggable.style.opacity = '1';
        draggable.setAttribute('draggable', true); 
        // 記錄學生的分類結果
        studentClassification[id] = e.currentTarget.dataset.category; 
    }
}

function checkStep1() {
    const totalImages = GAME_DATA.length;
    let classifiedCount = 0;
    
    // [優化] 計算已分配的圖片數量
    document.querySelectorAll('.drop-target').forEach(target => {
        target.querySelectorAll('.draggable-img').forEach(img => {
             // 確保只有在 drop-target 內的圖片才算數
             if (studentClassification[img.id]) {
                 classifiedCount++;
             }
        });
    });

    if (classifiedCount === totalImages) {
        document.getElementById('step1-message').textContent = `分類完成! (Classification Complete!) ${classifiedCount}/${totalImages} 張圖片已分配。`;
        document.getElementById('step1-message').classList.add('success');
        setTimeout(() => {
            showStep('step2');
            initStep2();
        }, 1000);
    } else {
        document.getElementById('step1-message').textContent = `請將所有 ${totalImages} 張圖片都分配到分類框中。 (目前已分配: ${classifiedCount}/${totalImages})`;
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

// --- Step 4 邏輯：模型診斷與計分 (整合優化選項) ---
function finalScore() {
    // 1. 訓練準確度 (與真實答案相比)
    let ruleStabilityScore = 0;
    GAME_DATA.forEach(data => {
        const studentCategory = studentClassification[data.id];
        if (studentCategory === data.trueAnswer) {
            ruleStabilityScore++;
        }
    });
    const ruleStabilityPercentage = (ruleStabilityScore / GAME_DATA.length) * 100;

    // 2. 特徵效率 (所選特徵的有效性)
    let featureEfficiencyScore = 0;
    studentsFeatures.forEach(fId => {
        if (TRUE_FEATURE_MAPPINGS['Feline (貓科)'].includes(fId) || TRUE_FEATURE_MAPPINGS['Canine (犬科)'].includes(fId)) {
            featureEfficiencyScore += 1;
        }
    });
    const featureEfficiencyPercentage = (featureEfficiencyScore / 3) * 100;

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
        
        <hr>

        <h3 style="color:#007bff;">🔄 模型優化 (Model Optimization)</h3>
        <p>AI 開發是一個不斷迭代的過程。根據上述診斷，你認為修正哪一步能讓你的 AI 表現更好？</p>
        <div style="display: flex; gap: 15px; margin-top: 20px;">
            <button onclick="goToOptimization(1)" style="background-color: #ffc107; color: #333; border: none; padding: 10px; cursor: pointer;">
                選項 A: 重新檢視 Step 1 分類 (修正訓練數據)
            </button>
            <button onclick="goToOptimization(2)" style="background-color: #17a2b8; color: white; border: none; padding: 10px; cursor: pointer;">
                選項 B: 重新選擇 Step 2 特徵 (修正 AI 規則)
            </button>
        </div>
    `;
    
    // 不再跳轉到 Step 5，而是留在 Step 4 進行選擇
}

function goToOptimization(choice) {
    if (choice === 1) {
        alert("選擇 A: 修正訓練數據。你將回到 Step 1 重新分類，以提高模型的「規則穩定性」。");
        // 重置 Step 1 相關狀態
        studentClassification = {}; 
        showStep('step1');
        initStep1(true); // 傳遞 true
    } else if (choice === 2) {
        alert("選擇 B: 修正 AI 規則。你將回到 Step 2 重新選擇特徵，以提高模型的「特徵效率」。");
        // 重置 Step 2 相關狀態
        studentsFeatures = [];
        showStep('step2');
        initStep2(); 
    }
}

// 啟動遊戲
document.addEventListener('DOMContentLoaded', initStep1);