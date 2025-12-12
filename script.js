// --- 遊戲設定資料 ---
const STYLE_CATEGORIES = ['Feline (貓科)', 'Canine (犬科)'];

// 特徵列表：聚焦於貓犬科的生物特徵
const DESIGN_FEATURES = [ 
    { id: 'F1', name: 'Snout Length (口鼻長度)' },        // [犬科] 明顯的吻部
    { id: 'F3', name: 'Eye Shape/Pupil (眼睛形狀/瞳孔)' }, // [貓科] 垂直瞳孔
    { id: 'F4', name: 'Claws (爪子是否可伸縮)' },         // [貓科] 可伸縮的爪子
    { id: 'F5', name: 'Body Posture (身體姿態/站姿)' },   // [犬科] 站姿較直
    { id: 'F2', name: 'Ear Shape (耳朵形狀)' },           // [兩者皆有] 差異較小，但有參考價值
    { id: 'F6', name: 'Tail Shape (尾巴形狀/動作)' },      // [兩者皆有] 動作與形態有差異
    { id: 'D1', name: 'Fur Color (皮毛顏色)' },           // [通用] 顏色變化太大
    { id: 'D2', name: 'Number of Legs (腿的數量)' },      // [常識錯誤/嚴重干擾] 都是四條腿
    { id: 'D3', name: 'Average Weight (平均體重)' },      // [通用] 變化範圍太大
    { id: 'D4', name: 'Whiskers Length (鬍鬚長度)' },     // [通用] 都有鬍鬚
    { id: 'D5', name: 'Habitat (棲息地)' },               // [通用] 棲地非視覺特徵
    { id: 'D6', name: 'Teeth Count (牙齒數量)' }          // [通用] 無法透過圖片直接觀察
];
const FEATURE_WEIGHTS = {
    'F1': 1.1, 'F3': 1.1, 'F4': 1.1, 'F5': 1.1,
    'F2': 0.6, 'F6': 0.6,
    'D2': -1.2,
    'D1': -0.3, 'D3': -0.3, 'D4': -0.3, 'D5': -0.3, 'D6': -0.3
};
const MAX_POSSIBLE_SCORE = 5.0; 
const TRUE_FEATURE_MAPPINGS = {
    'Feline (貓科)': ['F3', 'F4', 'F2'], 
    'Canine (犬科)': ['F1', 'F5', 'F6']
};

// 遊戲狀態追蹤
let GAME_DATA = []; 
let studentsFeatures = []; 
let studentClassification = {}; 
let testImage = null; 
let studentTestPrediction = ''; 
let currentJudgmentScore = { 'Feline (貓科)': 0, 'Canine (犬科)': 0 };
let featureJudgmentsMap = {}; 

// --- 輔助函式：切換步驟 ---
function showStep(stepId) {
    document.querySelectorAll('.game-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(stepId).classList.add('active');
}

// --- 圖片資料模擬 ---
const FULL_IMAGE_DATABASE = [
    { id: 'f1', imageURL: 'img/feline/cat_1.png', trueAnswer: 'Feline (貓科)' },
    { id: 'f2', imageURL: 'img/feline/lion_1.png', trueAnswer: 'Feline (貓科)' },
    { id: 'f3', imageURL: 'img/feline/tiger_1.png', trueAnswer: 'Feline (貓科)' },
    { id: 'f4', imageURL: 'img/feline/cheetah_1.png', trueAnswer: 'Feline (貓科)' },
    { id: 'f5', imageURL: 'img/feline/cougar_1.png', trueAnswer: 'Feline (貓科)' },
    { id: 'f6', imageURL: 'img/feline/lynx_1.png', trueAnswer: 'Feline (貓科)' },
	{ id: 'f7', imageURL: 'img/feline/panther_1.png', trueAnswer: 'Feline (貓科)' },
	{ id: 'f8', imageURL: 'img/feline/caracal_1.png', trueAnswer: 'Feline (貓科)' },
	{ id: 'f9', imageURL: 'img/feline/cat_2.png', trueAnswer: 'Feline (貓科)' },
    { id: 'f10', imageURL: 'img/feline/lion_2.png', trueAnswer: 'Feline (貓科)' },
    { id: 'f11', imageURL: 'img/feline/tiger_2.png', trueAnswer: 'Feline (貓科)' },
    { id: 'f12', imageURL: 'img/feline/cheetah_2.png', trueAnswer: 'Feline (貓科)' },
    { id: 'f13', imageURL: 'img/feline/cougar_2.png', trueAnswer: 'Feline (貓科)' },
    { id: 'f14', imageURL: 'img/feline/lynx_2.png', trueAnswer: 'Feline (貓科)' },
	{ id: 'f15', imageURL: 'img/feline/panther_2.png', trueAnswer: 'Feline (貓科)' },
	{ id: 'f16', imageURL: 'img/feline/caracal_2.png', trueAnswer: 'Feline (貓科)' },
    { id: 'c1', imageURL: 'img/canine/dog_1.png', trueAnswer: 'Canine (犬科)' },
    { id: 'c2', imageURL: 'img/canine/wolf_1.png', trueAnswer: 'Canine (犬科)' },
    { id: 'c3', imageURL: 'img/canine/fox_1.png', trueAnswer: 'Canine (犬科)' },
    { id: 'c4', imageURL: 'img/canine/coyote_1.png', trueAnswer: 'Canine (犬科)' },
    { id: 'c5', imageURL: 'img/canine/jackal_1.png', trueAnswer: 'Canine (犬科)' },
    { id: 'c6', imageURL: 'img/canine/wilddog_1.png', trueAnswer: 'Canine (犬科)' },
	{ id: 'c7', imageURL: 'img/canine/dingo_1.png', trueAnswer: 'Canine (犬科)' },
	{ id: 'c8', imageURL: 'img/canine/dog_2.png', trueAnswer: 'Canine (犬科)' },
    { id: 'c9', imageURL: 'img/canine/wolf_2.png', trueAnswer: 'Canine (犬科)' },
    { id: 'c10', imageURL: 'img/canine/fox_2.png', trueAnswer: 'Canine (犬科)' },
    { id: 'c11', imageURL: 'img/canine/coyote_2.png', trueAnswer: 'Canine (犬科)' },
    { id: 'c12', imageURL: 'img/canine/jackal_2.png', trueAnswer: 'Canine (犬科)' },
    { id: 'c13', imageURL: 'img/canine/wilddog_2.png', trueAnswer: 'Canine (犬科)' },
	{ id: 'c14', imageURL: 'img/canine/dingo_2.png', trueAnswer: 'Canine (犬科)' },
];

function getRandomSubset(arr, count) {
    const shuffled = arr.slice(0);
    let i = arr.length;
    let temp, index;
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

    if (totalFeline < 4 || totalCanine < 4) {
        alert("錯誤：圖庫中貓科或犬科圖片數量不足4張，無法滿足訓練集(各3張)和測試集(1張)的要求。");
        return;
    }

    const MIN_PER_CATEGORY = 3;
    const TARGET_TRAINING_SIZE = 10;
    
    let trainingFeline = getRandomSubset(felineImages, MIN_PER_CATEGORY);
    let trainingCanine = getRandomSubset(canineImages, MIN_PER_CATEGORY);
    
    const remainingFeline = felineImages.filter(img => !trainingFeline.includes(img));
    const remainingCanine = canineImages.filter(img => !trainingCanine.includes(img));
    const remainingImages = remainingFeline.concat(remainingCanine);

    const needed = TARGET_TRAINING_SIZE - (trainingFeline.length + trainingCanine.length);
    const fillerImages = getRandomSubset(remainingImages, needed);

    const finalTrainingImages = trainingFeline.concat(trainingCanine, fillerImages);
    GAME_DATA = finalTrainingImages;

    const finalRemainingForTest = remainingImages.filter(img => !fillerImages.includes(img));

    if (finalRemainingForTest.length === 0) {
        testImage = GAME_DATA[0];
    } else {
        const testIndex = Math.floor(Math.random() * finalRemainingForTest.length);
        testImage = finalRemainingForTest[testIndex];
    }

    if (GAME_DATA.length < 1) {
        alert("錯誤：訓練圖片數量不足。");
    }
}

// --- Step 1 邏輯：學生自由分類 ---
async function initStep1(isOptimization = false) {
    if (!isOptimization) {
        await loadImagesData();
    }
    
    const imagePool = document.getElementById('image-pool');
    const dropTargets = document.getElementById('classification-targets');
    
    dropTargets.innerHTML = '';
    
    if (isOptimization) {
        document.querySelectorAll('.drop-target').forEach(target => {
            target.querySelectorAll('.draggable-img').forEach(img => {
                imagePool.appendChild(img);
            });
        });
        studentClassification = {}; 
    } else {
        imagePool.innerHTML = '';
        studentClassification = {}; 
    }

    GAME_DATA.forEach(data => {
        let img = document.getElementById(data.id);
        
        if (!img) {
            img = document.createElement('img');
            img.src = data.imageURL;
            img.id = data.id;
            img.className = 'draggable-img';
            img.addEventListener('dragstart', dragStart);
        }
        
        img.setAttribute('draggable', true);
        imagePool.appendChild(img);
    });

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
    
    if (e.currentTarget.classList.contains('drop-target')) {
        e.currentTarget.appendChild(draggable);
        draggable.style.opacity = '1';
        draggable.setAttribute('draggable', true); 
        studentClassification[id] = e.currentTarget.dataset.category; 
    }
}

function checkStep1() {
    const totalImages = GAME_DATA.length;
    let classifiedCount = 0;
    
    document.querySelectorAll('.drop-target').forEach(target => {
        target.querySelectorAll('.draggable-img').forEach(img => {
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

// --- Step 2 邏輯：特徵定義 ---
function initStep2() {
    const featureOptions = document.getElementById('feature-options');
    const reviewFeline = document.getElementById('review-feline');
    const reviewCanine = document.getElementById('review-canine');
    
    featureOptions.innerHTML = '';
    reviewFeline.innerHTML = ''; 
    reviewCanine.innerHTML = '';
    studentsFeatures = [];

    document.getElementById('step2-message').textContent = '你剛剛的分類是根據哪些 Feature (特徵)？請選擇 5 個最重要的特徵。';

    // 1. 視覺化學生 Step 1 的分類結果
    const classifiedGroups = {};
    STYLE_CATEGORIES.forEach(cat => classifiedGroups[cat] = []);

    GAME_DATA.forEach(data => {
        const studentCat = studentClassification[data.id];
        if (studentCat) {
            classifiedGroups[studentCat].push(data);
        }
    });

    // 2. 載入貓科圖片預覽
    const felineImages = classifiedGroups['Feline (貓科)'];
    reviewFeline.innerHTML = `
        <h4>Feline (貓科) 分類結果 (${felineImages.length} 張)</h4>
        <div class="review-images-container">
            ${felineImages.map(data => 
                `<div class="review-img-wrapper">
                    <img src="${data.imageURL}" alt="${data.id}" class="review-img">
                </div>`
            ).join('')}
        </div>
    `;
    
    // 3. 載入犬科圖片預覽
    const canineImages = classifiedGroups['Canine (犬科)'];
    reviewCanine.innerHTML = `
        <h4>Canine (犬科) 分類結果 (${canineImages.length} 張)</h4>
        <div class="review-images-container">
            ${canineImages.map(data => 
                `<div class="review-img-wrapper">
                    <img src="${data.imageURL}" alt="${data.id}" class="review-img">
                </div>`
            ).join('')}
        </div>
    `;


    // 4. 載入特徵選擇選項 (中間部分)
    DESIGN_FEATURES.forEach(feature => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" value="${feature.id}" name="feature">${feature.name}`;
        featureOptions.appendChild(label);
    });

    document.querySelectorAll('#feature-options input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleFeatureSelection);
    });
    document.getElementById('step2-message').classList.remove('success');
}

function handleFeatureSelection(e) {
    const checkbox = e.target;
    const message = document.getElementById('step2-message');
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

function handleFeatureJudgment(featureId, newCategory, element) {
    const container = element.closest('.feature-judgment-item');
    container.querySelectorAll('button').forEach(btn => {
        btn.classList.remove('selected-feline', 'selected-canine');
    });

    if (newCategory === 'Feline (貓科)') {
        element.classList.add('selected-feline');
    } else {
        element.classList.add('selected-canine');
    }

    updateJudgmentScore(featureId, newCategory);
}

function updateJudgmentScore(featureId, newCategory) {
    const oldCategory = featureJudgmentsMap[featureId];
    
    if (oldCategory) {
        currentJudgmentScore[oldCategory] -= 1;
    }
    
    currentJudgmentScore[newCategory] += 1;
    
    featureJudgmentsMap[featureId] = newCategory;
    
    document.getElementById('score-feline').textContent = currentJudgmentScore['Feline (貓科)'];
    document.getElementById('score-canine').textContent = currentJudgmentScore['Canine (犬科)'];
    
    const felineSpan = document.getElementById('score-feline');
    const canineSpan = document.getElementById('score-canine');
    
    felineSpan.style.fontWeight = currentJudgmentScore['Feline (貓科)'] > currentJudgmentScore['Canine (犬科)'] ? 'bold' : 'normal';
    canineSpan.style.fontWeight = currentJudgmentScore['Canine (犬科)'] > currentJudgmentScore['Feline (貓科)'] ? 'bold' : 'normal';
}

function goToStep3() {
    if (studentsFeatures.length === 0) {
        alert("請至少選擇一個 Feature (特徵)!");
        return;
    }
    
    showStep('step3');

    const testImgElement = document.getElementById('test-image');
    testImgElement.src = testImage.imageURL;
    testImgElement.alt = `Test Image for Prediction`; 
    
    currentJudgmentScore = {
        'Feline (貓科)': 0,
        'Canine (犬科)': 0
    };
    featureJudgmentsMap = {}; 
    
    const judgmentArea = document.getElementById('feature-judgment-area');
    judgmentArea.innerHTML = ''; 

    let featureJudgmentHTML = studentsFeatures.map(fId => {
        const feature = DESIGN_FEATURES.find(f => f.id === fId);
        return `
            <div class="feature-judgment-item" data-feature-id="${fId}">
                <p>這張圖片的 <strong>[${feature.name}]</strong> 讓你覺得它更像？</p>
                <div class="judgment-buttons">
                    <button type="button" onclick="handleFeatureJudgment('${fId}', 'Feline (貓科)', this)">貓科 (Feline)</button>
                    <button type="button" onclick="handleFeatureJudgment('${fId}', 'Canine (犬科)', this)">犬科 (Canine)</button>
                </div>
            </div>
        `;
    }).join('');
    
    judgmentArea.innerHTML = featureJudgmentHTML;

    document.getElementById('judgment-scoreboard').innerHTML = `
        <h3 style="margin-top: 0; color: #1a5690;">特徵傾向統計 (Feature Bias)</h3>
        <p>點選每個特徵後，會自動計算總傾向。</p>
        <div id="score-display">
            <p>貓科總分: <span id="score-feline" style="font-size: 1.5em; color: #DC3545;">0</span></p>
            <p>犬科總分: <span id="score-canine" style="font-size: 1.5em; color: #2196F3;">0</span></p>
        </div>
    `;
    document.getElementById('score-feline').textContent = '0';
    document.getElementById('score-canine').textContent = '0';


    document.getElementById('final-prediction-button').innerHTML = `
        <hr style="margin-top: 25px;">
        <h3>所以覺得答案是? (Final Conclusion)</h3>
        <div class="final-buttons">
            <button type="button" name="finalConclusion" value="Feline (貓科)" class="final-prediction-btn" onclick="selectFinalConclusion(this)">Feline (貓科)</button>
            <button type="button" name="finalConclusion" value="Canine (犬科)" class="final-prediction-btn" onclick="selectFinalConclusion(this)">Canine (犬科)</button>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
            <button onclick="revealPrediction()">揭曉 AI 模型的表現 (Reveal Model Performance)</button>
        </div>
    `;
}

function selectFinalConclusion(element) {
    document.querySelectorAll('.final-prediction-btn').forEach(btn => {
        btn.classList.remove('selected-feline', 'selected-canine');
    });
    
    if (element.value === 'Feline (貓科)') {
        element.classList.add('selected-feline');
    } else {
        element.classList.add('selected-canine');
    }
}


function revealPrediction() {
    const totalJudgments = studentsFeatures.length;
    const completedJudgments = Object.keys(featureJudgmentsMap).length; 
    
    if (completedJudgments < totalJudgments) {
        alert(`請先完成所有 ${totalJudgments} 個特徵的單獨判斷！`);
        return;
    }

    const finalConclusionBtn = document.querySelector('.final-prediction-btn.selected-feline, .final-prediction-btn.selected-canine');
    if (!finalConclusionBtn) {
        alert("請點選你的最終總結判斷 (Final Conclusion)!");
        return;
    }

    studentTestPrediction = finalConclusionBtn.value;
    
    showStep('step4');
    finalScore(); 
}

// --- Step 4 邏輯：模型診斷與計分 (修正懲罰計分) ---
function finalScore() {
    // 1. 訓練準確度 (Rule Stability)
    let ruleStabilityScore = 0;
    GAME_DATA.forEach(data => {
        const studentCategory = studentClassification[data.id];
        if (studentCategory === data.trueAnswer) {
            ruleStabilityScore++;
        }
    });
    const ruleStabilityPercentage = (ruleStabilityScore / GAME_DATA.length) * 100;

    // 2. 特徵效率 (Feature Efficiency)
    const allDistractorFeatures = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6'];
    const allTrueFeatures = TRUE_FEATURE_MAPPINGS['Feline (貓科)'].concat(TRUE_FEATURE_MAPPINGS['Canine (犬科)']);
    
    let rawFeatureScore = 0;
    let trueFeatureCount = 0; 
    let distractorCount = 0; 
    
    studentsFeatures.forEach(fId => {
        const weight = FEATURE_WEIGHTS[fId] || 0; 
        rawFeatureScore += weight;

        if (allTrueFeatures.includes(fId)) {
            trueFeatureCount += 1;
        } else if (allDistractorFeatures.includes(fId)) {
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
        featureDiagnosisMessage = '<p style="color:green;">恭喜！你的特徵選取非常成功，AI 規則清晰且精準！</p>';
    } else if (distractorCount >= 3) {
        featureDiagnosisMessage = '<p style="color:red;">你的特徵選擇中，錯誤特徵 ( '+distractorCount+' 個) 已經佔據主導地位，AI 規則完全混亂！</p>';
    } else if (trueFeatureCount < 3) {
        featureDiagnosisMessage = '<p style="color:#FF8C00;">你選擇的正確特徵 (僅 '+trueFeatureCount+' 個) 太少，AI 缺乏有效的判斷基礎。</p>';
    } else if (normalizedScore < 0.1) {
        featureDiagnosisMessage = '<p style="color:red;">你的特徵選擇與物種的決定性特徵幾乎完全不相關，AI 模型無法工作！</p>';
    } else {
         featureDiagnosisMessage = '<p style="color:#FFA500;">你的特徵有效性分數中等。請嘗試找出更具區分性的關鍵特徵來提高效率。</p>';
    }
    
	let classificationEvaluation = '';
    if (ruleStabilityPercentage >= 80) {
        classificationEvaluation = `My classification score is ${ruleStabilityPercentage.toFixed(0)} percent. That is excellent.`;
    } else if (ruleStabilityPercentage >= 60) {
        classificationEvaluation = `My classification score is ${ruleStabilityPercentage.toFixed(0)} percent. That is acceptable.`;
    } else {
        classificationEvaluation = `My classification score is ${ruleStabilityPercentage.toFixed(0)} percent. That is too low.`;
    }
	
    // --- 5. 綜合評價邏輯 (新增) ---
    const RULE_THRESHOLD = 70;
    let finalStrategyMessage = '';
    let strategySentence = '';

    const ruleNeedsFix = ruleStabilityPercentage < RULE_THRESHOLD;
    const featureNeedsFix = featureEfficiencyPercentage < RULE_THRESHOLD;

    if (!finalPredictionCorrect && ruleNeedsFix && featureNeedsFix) {
        finalStrategyMessage = "你的模型表現不佳，問題同時存在於訓練數據和選擇的規則中。你需要徹底檢查這兩方面。";
        strategySentence = "We need to fix both the data and the features.";
    } else if (!finalPredictionCorrect && ruleNeedsFix && !featureNeedsFix) {
        finalStrategyMessage = "你的特徵選擇是準確的，但訓練數據的初始分類可能錯誤。請優先修正 Step 1 的分類。";
        strategySentence = "I must adjust the classification data first.";
    } else if (!finalPredictionCorrect && !ruleNeedsFix && featureNeedsFix) {
        finalStrategyMessage = "你的訓練數據很穩定，但選擇的特徵規則不夠有效。請優先修正 Step 2 的特徵選擇。";
        strategySentence = "I must adjust the features rule first.";
    } else if (finalPredictionCorrect && (ruleNeedsFix || featureNeedsFix)) {
        finalStrategyMessage = "雖然推論結果正確，但模型不夠穩定。建議優化分數較低的那一步驟，以確保未來表現。";
        strategySentence = "The result is correct, but I should optimize the low score part.";
    } else {
        finalStrategyMessage = "恭喜！你的模型穩定且推論正確！你的 AI 設計非常成功。";
        strategySentence = "The model performs very well.";
    }

    // --- 根據表現生成英文例句 ---
    const featureSentence = `The feature score is ${featureEfficiencyPercentage.toFixed(0)}, which is ${(featureEfficiencyPercentage >= 70 ? 'good' : 'low')}.`;
    const predictionContent = studentTestPrediction.split(' ')[0]; 
    const predictionActionSentence = `I predict ${predictionContent}`;
    const predictionResultSentence = `my prediction is ${finalPredictionCorrect ? 'correct' : 'wrong'}.`;
    const adjustSentence = `We must adjust the model now.`;


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
                <p class="speech-example">${classificationEvaluation}</p>
                ${ruleStabilityPercentage < 70 ? '<p style="color:red;">診斷: 你的初始分類 (訓練數據標籤) 本身可能就不夠穩定或準確，導致模型基礎不穩！</p>' : ''}
                <hr>

                <h3>2. 特徵效率 (Feature Efficiency)</h3>
                <p>這是你選取的 ${studentsFeatures.length} 個特徵的有效性分數 (滿分100，有效特徵 +12~22、干擾項 -6~-24)。</p>
                <p class="score-result">特徵選取準確度: <strong>${featureEfficiencyPercentage.toFixed(0)}</strong></p>
                <p class="speech-example">${featureSentence}</p>
                
                ${featureDiagnosisMessage}
                
                <hr>

                <h3>3. 最終推論準確度 (Inference Accuracy)</h3>
                <p class="score-result">測試圖片真實答案: <strong>${testImage.trueAnswer}</strong></p>
                <p class="score-result">你的最終判斷: <strong>${studentTestPrediction}</strong></p>
                <p style="font-size: 1.2em; color: ${finalPredictionCorrect ? 'green' : 'red'};">推論結果：${finalPredictionCorrect ? '正確！ (Correct!)' : '錯誤！ (Error!)'}</p>
                
                <p style="font-style: italic; margin-top: 5px;"></p>
                <p class="speech-example" style="margin-left: 20px;">${predictionActionSentence}, ${predictionResultSentence}</p>
                
            </div>
            
            <div class="step4-image-summary">
                <h3>測試圖片 (Test Image)</h3>
                <img src="${testImage.imageURL}" alt="Final Test Image" class="final-test-img">
                <p style="font-size: 1.5em; font-weight: bold; margin-top: 10px;">物種名稱: ${speciesName.toUpperCase()}</p>
            </div>
        </div>

        <hr>
        
        <div class="final-strategy-advice" style="padding: 15px; border: 2px dashed #007bff; border-radius: 8px;">
            <h3 style="color: #DC3545;">模型優化建議 (Strategy Advice)</h3>
            <p style="font-size: 1.1em; margin-bottom: 15px;">綜合評價: ${finalStrategyMessage}</p>
            <p style="font-size: 1.5em; color: #1a5690;">${strategySentence}</p>
        </div>
        <h3 style="color:#007bff; margin-top: 20px;">4. 模型優化 (Model Optimization)</h3>
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
        studentClassification = {}; 
        showStep('step1');
        initStep1(true); 
    } else if (choice === 2) {
        alert("選擇 B: 修正 AI 規則。你將回到 Step 2 重新選擇特徵，以提高模型的「特徵效率」。");
        studentsFeatures = [];
        showStep('step2');
        initStep2(); 
    }
}

// --- 觸控兼容邏輯 ---
let currentDraggingElement = null;
let initialTouchX = 0;
let initialTouchY = 0;

function touchStart(e) {
    if (!e.target.classList.contains('draggable-img')) return;
    e.preventDefault(); 
    
    const img = e.target;
    currentDraggingElement = img;
    const touch = e.touches[0];
    initialTouchX = touch.clientX - img.getBoundingClientRect().left;
    initialTouchY = touch.clientY - img.getBoundingClientRect().top;
    
    img.style.position = 'absolute';
    img.style.zIndex = 1000;
    img.style.opacity = '0.7';

    document.addEventListener('touchmove', touchMove, { passive: false });
    document.addEventListener('touchend', touchEnd);
}

function touchMove(e) {
    if (!currentDraggingElement) return;

    e.preventDefault(); 
    const touch = e.touches[0];
    
    currentDraggingElement.style.left = (touch.clientX - initialTouchX) + 'px';
    currentDraggingElement.style.top = (touch.clientY - initialTouchY) + 'px';
}

function touchEnd(e) {
    if (!currentDraggingElement) return;
    
    e.preventDefault(); 
    const draggedImg = currentDraggingElement;
    
    document.removeEventListener('touchmove', touchMove);
    document.removeEventListener('touchend', touchEnd);

    draggedImg.style.position = ''; 
    draggedImg.style.zIndex = '';
    draggedImg.style.opacity = '1';

    const touch = e.changedTouches[0];
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (dropTarget && dropTarget.classList.contains('drop-target')) {
        if (dropTarget.classList.contains('drop-target')) {
            dropTarget.appendChild(draggedImg);
            draggedImg.setAttribute('draggable', true); 
            draggedImg.style.left = ''; 
            draggedImg.style.top = '';
            
            studentClassification[draggedImg.id] = dropTarget.dataset.category;
        }
    } else {
        draggedImg.style.left = '';
        draggedImg.style.top = '';
    }
    
    currentDraggingElement = null;
}

function initTouchEvents() {
    document.querySelectorAll('.draggable-img').forEach(img => {
        img.addEventListener('touchstart', touchStart, { passive: false });
    });
}


// 啟動遊戲 (單一入口點，確保邏輯順序)
document.addEventListener('DOMContentLoaded', () => {
    // 觸控事件必須在 DOM 載入後註冊
    document.addEventListener('touchstart', touchStart, { passive: false });
    
    // 啟動 Step 1
    initStep1();
});