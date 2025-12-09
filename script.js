// --- 遊戲設定資料 ---
const STYLE_CATEGORIES = ['Feline (貓科)', 'Canine (犬科)'];

// 新的特徵列表：聚焦於貓犬科的生物特徵
const DESIGN_FEATURES = [ 
    { id: 'F1', name: 'Snout Length (口鼻長度)' }, // 犬科特徵
    { id: 'F2', name: 'Ear Shape (耳朵形狀)' }, // 貓科 vs. 犬科的差異
    { id: 'F3', name: 'Eye Shape/Pupil (眼睛形狀/瞳孔)' }, // 貓科特徵
    { id: 'F4', name: 'Claws (爪子是否可伸縮)' }, // 貓科特徵
    { id: 'F5', name: 'Body Posture (身體姿態/站姿)' }, // 犬科特徵
    { id: 'F6', name: 'Tail Shape (尾巴形狀/動作)' } // 差異特徵
];

const FEATURE_MAPPINGS = {
    'Feline (貓科)': ['F3', 'F4', 'F2'], // 貓科的關鍵特徵
    'Canine (犬科)': ['F1', 'F5', 'F6'] // 犬科的關鍵特徵
};

// 由於圖片是動態讀取，這些變數將在 initStep1 中賦值
let GAME_DATA = []; // 訓練集
let studentsFeatures = [];
let correctCount = 0;
let testImage = null; // 測試圖片

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
    // 圖片應位於 /img/feline/ 和 /img/canine/ 等路徑下
    const allImages = [
        { id: 'img1', imageURL: 'img/feline/cat_1.png', correctAnswer: 'Feline (貓科)' },
        { id: 'img2', imageURL: 'img/canine/dog_1.png', correctAnswer: 'Canine (犬科)' },
        { id: 'img3', imageURL: 'img/feline/tiger_1.png', correctAnswer: 'Feline (貓科)' },
        { id: 'img4', imageURL: 'img/canine/wolf_1.png', correctAnswer: 'Canine (犬科)' },
        { id: 'img5', imageURL: 'img/feline/panther_1.png', correctAnswer: 'Feline (貓科)' },
        { id: 'img6', imageURL: 'img/canine/fox_1.png', correctAnswer: 'Canine (犬科)' },
        { id: 'img7', imageURL: 'img/feline/cheetah_1.png', correctAnswer: 'Feline (貓科)' },
        // 請在此處添加您所有的訓練圖片數據
    ];

    // 隨機選取一張作為測試圖片
    const testIndex = Math.floor(Math.random() * allImages.length);
    testImage = allImages[testIndex];
    
    // 剩下的圖片作為訓練集
    GAME_DATA = allImages.filter((_, index) => index !== testIndex);

    // 如果圖片太少，發出警告 (至少需要 1 張訓練圖 + 1 張測試圖)
    if (GAME_DATA.length < 1) {
        alert("錯誤：訓練圖片數量不足。請確保 JSON 數據中至少有 2 張圖片。");
        return;
    }
}

// --- Step 1 邏輯：分類 (Classification) ---
async function initStep1() {
    await loadImagesData(); // 等待圖片數據載入
    
    const imagePool = document.getElementById('image-pool');
    const dropTargets = document.getElementById('classification-targets');
    imagePool.innerHTML = '';
    dropTargets.innerHTML = '';
    correctCount = 0; // 重置計數器

    // 1. 載入訓練圖片 (補齊邏輯)
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

    // 2. 載入分類框 (補齊邏輯)
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
    const totalImages = GAME_DATA.length;
    let classifiedImages = 0;

    // 計算分類正確數量
    targets.forEach(target => {
        const category = target.dataset.category;
        target.querySelectorAll('.draggable-img').forEach(img => {
            classifiedImages++;
            if (img.dataset.answer === category) {
                correctCount++;
            }
        });
    });

    // 檢查所有圖片是否都在分類框內
    const allClassified = (classifiedImages === totalImages);
    
    const message = document.getElementById('step1-message');

    if (correctCount === totalImages && allClassified) {
        message.textContent = `分類成功! (Classification Successful! ${correctCount}/${totalImages}) 進入特徵選擇。`;
        message.classList.add('success');
        setTimeout(() => {
            showStep('step2');
            initStep2();
        }, 1000);
    } else {
        message.textContent = `請將所有圖片正確拖曳到分類框中。 (目前正確: ${correctCount}/${totalImages})`;
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
    document.getElementById('step2-message').textContent = ''; // 清除舊訊息
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
    
    // 設置 Step 3 的測試圖片
    const testImgElement = document.getElementById('test-image');
    testImgElement.src = testImage.imageURL;
    testImgElement.alt = `Test Image: ${testImage.correctAnswer}`; // 設置 alt 文本
    
    // 確保 Prediction 按鈕可用
    const revealBtn = document.querySelector('#step3 button');
    if (revealBtn) revealBtn.disabled = false;

    showStep('step3');
}

// --- Step 3 邏輯：預測 (Prediction) ---
function revealPrediction() {
    if (!testImage) return;

    let prediction = testImage.correctAnswer;
    const totalTrainingImages = GAME_DATA.length;
    
    // 1. 基礎信心度：來自 Step 1 的訓練準確度 (0.0 - 1.0)
    const trainingAccuracy = correctCount / totalTrainingImages; 
    let confidence = 0.3 + (trainingAccuracy * 0.3); // 基礎 30% + 訓練準確度最高 30%

    // 2. 特徵調整：學生選擇的特徵與測試圖片分類的相關性 (總共 40% 的權重)
    const targetFeatures = FEATURE_MAPPINGS[prediction];
    
    studentsFeatures.forEach(fId => {
        if (targetFeatures.includes(fId)) {
            confidence += 0.15; // 選擇了與正確答案相關的特徵 (高分)
        } else {
            confidence -= 0.05; // 選擇了不相關或錯誤的特徵 (輕微扣分)
        }
    });

    // 學生是否有嘗試「預測」 (使用簡單 prompt 實現互動)
    const studentPredictionInput = prompt("Your **Prediction**: Feline or Canine?"); 
    const studentPredictionResult = studentPredictionInput && studentPredictionInput.toLowerCase().includes(prediction.toLowerCase().split(' ')[0]) ? '正確' : '錯誤';

    // 將信心度限制在 40% 到 100%
    confidence = Math.min(1.0, Math.max(0.4, confidence)); 

    const resultHTML = `
        <p>AI 模型訓練準確度 (Training **Accuracy**): ${Math.round(trainingAccuracy * 100)}%</p>
        <p>你的口頭 **Prediction** (預測) 結果：${studentPredictionResult}</p>
        <h3>AI's Prediction (正確答案): 
            <span style="color:#dc3545;">${prediction}</span>
        </h3>
        <p>**Confidence** (信心度): 
            <span style="font-size: 1.2em;">${(confidence * 100).toFixed(0)}%</span>
        </p>
        <p>AI 的預測是根據你的 **classification** (分類) 與所選 **Features** (特徵) 得出。信心度高，表示你成功訓練了模型識別 **${prediction}** 的關鍵特徵！</p>
    `;

    document.getElementById('prediction-results').innerHTML = resultHTML;
    document.querySelector('#step3 button').disabled = true; // 防止重複點擊
}

// 啟動遊戲
document.addEventListener('DOMContentLoaded', initStep1);