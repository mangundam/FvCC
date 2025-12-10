// --- 遊戲設定資料 ---
const STYLE_CATEGORIES = ['Feline (貓科)', 'Canine (犬科)'];

// 特徵列表：聚焦於貓犬科的生物特徵
const DESIGN_FEATURES = [ 
    // === 關鍵且正確的特徵 (Key/Discriminative Features) ===
    { id: 'F1', name: 'Snout Length (口鼻長度)' },        // [犬科] 明顯的吻部
    { id: 'F3', name: 'Eye Shape/Pupil (眼睛形狀/瞳孔)' }, // [貓科] 垂直瞳孔（夜行性）
    { id: 'F4', name: 'Claws (爪子是否可伸縮)' },         // [貓科] 可伸縮的爪子
    { id: 'F5', name: 'Body Posture (身體姿態/站姿)' },   // [犬科] 站姿較直、爪子長期暴露

    // === 有差異性但非決定性特徵 (Moderately Discriminative Features) ===
    { id: 'F2', name: 'Ear Shape (耳朵形狀)' },           // [兩者皆有] 差異較小，但有參考價值
    { id: 'F6', name: 'Tail Shape (尾巴形狀/動作)' },      // [兩者皆有] 動作與形態有差異

    // === 錯誤/干擾項：通用或不具分類決定性的特徵 (Distractor Features) ===
    { id: 'D1', name: 'Fur Color (皮毛顏色)' },           // [通用] 顏色變化太大，非決定性特徵
    { id: 'D2', name: 'Number of Legs (腿的數量)' },      // [通用] 都是四條腿，無區分性
    { id: 'D3', name: 'Average Weight (平均體重)' },      // [通用] 變化範圍太大（家貓到獅子，吉娃娃到狼）
    { id: 'D4', name: 'Whiskers Length (鬍鬚長度)' },     // [通用] 都有鬍鬚，且長度差異不明顯
    { id: 'D5', name: 'Habitat (棲息地)' },               // [通用] 家養到荒野都有，非主要視覺特徵
    { id: 'D6', name: 'Teeth Count (牙齒數量)' }          // [通用] 無法透過圖片直接觀察，且數量相近
];

// 請確保 TRUE_FEATURE_MAPPINGS 保持使用 F1-F6 中的關鍵項目：
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

    document.getElementById('step2-message').textContent = '你剛剛的分類是根據哪些 Feature (特徵)？請選擇 1~5 個最重要的特徵。';

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
    let reviewHTML = '<h3>你的訓練數據分類 (Your Training Classification)</h3>';
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
    // *** 修正點 1: 特徵上限提升至 5 個 ***
    const MAX_FEATURES = 5; 
    
    if (checkbox.checked) {
        if (studentsFeatures.length < MAX_FEATURES) {
            studentsFeatures.push(checkbox.value);
            message.textContent = `已選擇 ${studentsFeatures.length}/${MAX_FEATURES} 個特徵。`;
        } else {
            checkbox.checked = false; 
            message.textContent = `最多只能選擇 ${MAX_FEATURES} 個特徵 (Max ${MAX_FEATURES} Features).`;
        }
    } else {
        studentsFeatures = studentsFeatures.filter(id => id !== checkbox.value);
        message.textContent = `已選擇 ${studentsFeatures.length}/${MAX_FEATURES} 個特徵。`;
    }
}
let currentJudgmentScore = {
    'Feline (貓科)': 0,
    'Canine (犬科)': 0
};

function goToStep3() {
    if (studentsFeatures.length === 0) {
        alert("請至少選擇一個 Feature (特徵)!");
        return;
    }
    
    showStep('step3');

    const testImgElement = document.getElementById('test-image');
    testImgElement.src = testImage.imageURL;
    testImgElement.alt = `Test Image for Prediction`; 
    
    // 重置即時分數
    currentJudgmentScore = {
        'Feline (貓科)': 0,
        'Canine (犬科)': 0
    };
    
    const judgmentArea = document.getElementById('feature-judgment-area');
    judgmentArea.innerHTML = ''; 

    // 載入特徵判斷列表
    let featureJudgmentHTML = studentsFeatures.map(fId => {
        const feature = DESIGN_FEATURES.find(f => f.id === fId);
        return `
            <div class="feature-judgment-item" data-feature-id="${fId}">
                <h4>${feature.name}</h4>
                <p>這張圖片的 [${feature.name}] 讓你覺得它更像？</p>
                <label>
                    <input type="radio" name="judgment_${fId}" value="Feline (貓科)" required onclick="updateJudgmentScore('${fId}', 'Feline (貓科)')"> 
                    像貓科 (Feline)
                </label>
                <label>
                    <input type="radio" name="judgment_${fId}" value="Canine (犬科)" onclick="updateJudgmentScore('${fId}', 'Canine (犬科)')"> 
                    像犬科 (Canine)
                </label>
            </div>
        `;
    }).join('');
    
    // 將列表加載到 judgmentArea
    judgmentArea.innerHTML = featureJudgmentHTML;

    // 載入即時統計板 (Scoreboard)
    document.getElementById('judgment-scoreboard').innerHTML = `
        <h3 style="margin-top: 0; color: #1a5690;">特徵傾向統計 (Feature Bias)</h3>
        <p>點選每個特徵後，會自動計算總傾向。</p>
        <div id="score-display">
            <p>貓科總分: <span id="score-feline" style="font-size: 1.5em; color: #DC3545;">0</span></p>
            <p>犬科總分: <span id="score-canine" style="font-size: 1.5em; color: #2196F3;">0</span></p>
        </div>
    `;

    // 確保最終判斷按鈕在 DOM 中
    document.getElementById('final-prediction-button').innerHTML = `
        <hr style="margin-top: 25px;">
        <h3>總結判斷 (Final Conclusion)</h3>
        <p>所以覺得答案是?</p>
        <div style="margin-top: 15px;">
            <label><input type="radio" name="finalConclusion" value="Feline (貓科)" required> Feline (貓科)</label>
            <label><input type="radio" name="finalConclusion" value="Canine (犬科)"> Canine (犬科)</label>
        </div>
    `;
    
    // 初始化顯示
    document.getElementById('score-feline').textContent = '0';
    document.getElementById('score-canine').textContent = '0';
}

// *** 新增函式：即時更新統計分數 ***
let featureJudgmentsMap = {}; // 追蹤每個特徵的判斷結果，用於處理切換選項時的加減分

function updateJudgmentScore(featureId, newCategory) {
    const oldCategory = featureJudgmentsMap[featureId];
    
    // 如果之前有選擇，則先減去舊分數
    if (oldCategory) {
        currentJudgmentScore[oldCategory] -= 1;
    }
    
    // 加上新分數
    currentJudgmentScore[newCategory] += 1;
    
    // 更新記錄
    featureJudgmentsMap[featureId] = newCategory;
    
    // 更新 DOM 顯示
    document.getElementById('score-feline').textContent = currentJudgmentScore['Feline (貓科)'];
    document.getElementById('score-canine').textContent = currentJudgmentScore['Canine (犬科)'];
    
    // 視覺提示：突出高分者
    const felineSpan = document.getElementById('score-feline');
    const canineSpan = document.getElementById('score-canine');
    
    felineSpan.style.fontWeight = currentJudgmentScore['Feline (貓科)'] > currentJudgmentScore['Canine (犬科)'] ? 'bold' : 'normal';
    canineSpan.style.fontWeight = currentJudgmentScore['Canine (犬科)'] > currentJudgmentScore['Feline (貓科)'] ? 'bold' : 'normal';
}

function revealPrediction() {
    // 檢查所有特徵的判斷是否完成
    const totalJudgments = studentsFeatures.length;
    const completedJudgments = document.querySelectorAll('.feature-judgment-item input:checked').length;
    
    if (completedJudgments < totalJudgments) {
        alert(`請先完成所有 ${totalJudgments} 個特徵的單獨判斷！`);
        return;
    }

    const finalConclusion = document.querySelector('input[name="finalConclusion"]:checked');
    if (!finalConclusion) {
        alert("請點選你的最終總結判斷 (Final Conclusion)!");
        return;
    }

    studentTestPrediction = finalConclusion.value;
    
    // 進入 Step 4 結算
    showStep('step4');
    finalScore(); 
}

// --- Step 4 邏輯：模型診斷與計分 (整合優化選項) ---
function finalScore() {
    // 1. 訓練準確度 (與真實答案相比) - 保持不變
    let ruleStabilityScore = 0;
    GAME_DATA.forEach(data => {
        const studentCategory = studentClassification[data.id];
        if (studentCategory === data.trueAnswer) {
            ruleStabilityScore++;
        }
    });
    const ruleStabilityPercentage = (ruleStabilityScore / GAME_DATA.length) * 100;

    // 2. 特徵效率 (懲罰計分邏輯)
    const allDistractorFeatures = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6'];
    const allTrueFeatures = TRUE_FEATURE_MAPPINGS['Feline (貓科)'].concat(TRUE_FEATURE_MAPPINGS['Canine (犬科)']);
    
    let rawFeatureScore = 0;
    let trueFeatureCount = 0; // 新增：計算正確特徵數量
    let distractorCount = 0; // 新增：計算錯誤特徵數量
    
    const MAX_POSSIBLE_SCORE = 5; 
    
    // 計算原始分數和計數
    studentsFeatures.forEach(fId => {
        if (allTrueFeatures.includes(fId)) {
            rawFeatureScore += 1;
            trueFeatureCount += 1;
        } else if (allDistractorFeatures.includes(fId)) {
            rawFeatureScore -= 0.3;
            distractorCount += 1;
        }
    });

    const normalizedScore = Math.max(0, rawFeatureScore);
    const featureEfficiencyPercentage = (normalizedScore / MAX_POSSIBLE_SCORE) * 100;
    
    // 3. 最終預測準確度
    const finalPredictionCorrect = (studentTestPrediction === testImage.trueAnswer);
    
    // 4. 提取物種名稱
    const fileName = testImage.imageURL.split('/').pop();
    const speciesName = fileName.split('_')[0];

    // --- 診斷敘述邏輯 ---
    let featureDiagnosisMessage = '';
    
    if (featureEfficiencyPercentage >= 70) {
        // 情境 1: 正確率達 70% 以上 (Normalized Score >= 3.5)
        featureDiagnosisMessage = `<p style="color:green;">診斷: 恭喜！你的特徵選取非常成功，規則清晰且精準！</p>`;
    } else if (trueFeatureCount < 3) {
        // 情境 2: 選擇的正確特徵少於 3 個
        featureDiagnosisMessage = `<p style="color:#FF8C00;">診斷: 你選擇到的正確特徵 (僅 ${trueFeatureCount} 個) 太少，缺乏有效的判斷基礎。</p>`;
    } else if (distractorCount > 3) {
        // 情境 3: 錯誤特徵多於 3 個 (雖然分數可能還不錯，但錯誤率高)
        featureDiagnosisMessage = `<p style="color:#FFA500;">診斷: 你雖然選對了一些特徵，但錯誤特徵 ( ${distractorCount} 個) 過多，規則混亂且效率低落。</p>`;
    } else if (normalizedScore < 0.1) {
        // 情境 4: 分數接近零 (完全錯誤)
        featureDiagnosisMessage = `<p style="color:red;">診斷: 你的特徵選擇與物種的決定性特徵幾乎完全不相關，模型無法工作！</p>`;
    } else {
         // 一般錯誤或混亂情況
         featureDiagnosisMessage = `<p style="color:#DC3545;">診斷: 你的特徵選擇仍有進步空間。請嘗試找出更具區分性的關鍵特徵。</p>`;
    }
    
    // 輸出診斷結果
    const resultDiv = document.getElementById('diagnosis-results');
    resultDiv.innerHTML = `
        <div class="step4-layout">
            <div class="step4-scores">
                <h2>模型診斷結果 (Model Diagnosis)</h2>
                <p>你的目標：設計一個能準確分類貓科/犬科的 AI 模型。</p>
                <hr>
                
                <h3>1. 規則穩定性 (Rule Stability)</h3>
                <p>這是你訓練模型時，分類結果與真實世界答案的吻合度。</p>
                <p class="score-result">訓練分類準確度: <strong>${ruleStabilityScore}/${GAME_DATA.length}</strong> (${ruleStabilityPercentage.toFixed(0)}%)</p>
                ${ruleStabilityPercentage < 70 ? '<p style="color:red;">診斷: 你的初始分類 (訓練數據標籤) 本身可能就不夠穩定或準確，導致模型基礎不穩！</p>' : ''}
                <hr>

                <h3>2. 特徵效率 (Feature Efficiency)</h3>
                <p>這是你選取的 ${studentsFeatures.length} 個特徵的有效性分數。</p>
                <p class="score-result">特徵選取準確度: <strong>${featureEfficiencyPercentage.toFixed(0)}%</strong></p>
                
                ${featureDiagnosisMessage}
                
                <hr>

                <h3>3. 最終推論準確度 (Inference Accuracy)</h3>
                <p class="score-result">測試圖片真實答案: <strong>${testImage.trueAnswer}</strong></p>
                <p class="score-result">你的最終判斷: <strong>${studentTestPrediction}</strong></p>
                <p style="font-size: 1.2em; color: ${finalPredictionCorrect ? 'green' : 'red'};"><strong>推論結果：${finalPredictionCorrect ? '正確！ (Correct!)' : '錯誤！ (Error!)'}</strong></p>
            </div>
            
            <div class="step4-image-summary">
                <h3>測試圖片 (Test Image)</h3>
                <img src="${testImage.imageURL}" alt="Final Test Image" class="final-test-img">
                <p style="font-size: 1.5em; font-weight: bold; margin-top: 10px;">物種名稱: ${speciesName.toUpperCase()}</p>
            </div>
        </div>

        <hr>

        <h3 style="color:#007bff;">4. 模型優化 (Model Optimization)</h3>
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