// 背景動畫變數
let colors = [];
let ctx;
let centerX, centerY;
let shapes = [];
let canSpawn = true;

// 測驗系統變數
let quizData = [];
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let gameState = 'loading'; // loading, ready, quiz, feedback, result
let buttons = [];
let restartButton;
let selectedAnswer = null;
let isCorrect = false;
let correctAnswer = '';
let nextButton;

function preload() {
    // 直接從資料夾載入 CSV
    loadTable('quiz.csv', 'csv', loadSuccess, loadError);
}

function loadSuccess(table) {
    // 解析 CSV 資料
    for (let i = 0; i < table.getRowCount(); i++) {
        let row = table.getRow(i);
        if (row.getString(0) && row.getString(5)) {
            quizData.push({
                question: row.getString(0),
                optionA: row.getString(1),
                optionB: row.getString(2),
                optionC: row.getString(3),
                optionD: row.getString(4),
                correctAnswer: row.getString(5).toUpperCase()
            });
        }
    }
    console.log('題庫載入成功：' + quizData.length + ' 題');
}

function loadError(err) {
    console.error('載入題庫失敗:', err);
    gameState = 'error';
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    rectMode(CENTER);
    colorMode(HSB, 360, 100, 100, 100);
    ctx = drawingContext;
    centerX = width / 2;
    centerY = height / 2;
    divideRect(width / 2, -height / 2, width, height);
    
    textAlign(CENTER, CENTER);
    
    // 如果題庫已載入，切換到準備狀態
    if (quizData.length > 0) {
        gameState = 'ready';
    }
}

function draw() {
    // 背景動畫
    canSpawn = true;
    background('#273138');
    for (let i of shapes) {
        i.run();
    }
    for (let i = shapes.length - 1; i >= 0; i--) {
        let s = shapes[i];
        if (s.isDead) {
            shapes.splice(i, 1);
        }
    }
    for (let i = 0; i < shapes.length; i++) {
        let s = shapes[i];
        if ((s.currentY - (s.h / 2) + s.velocityY) < 0) {
            canSpawn = false;
            break;
        }
    }
    if (canSpawn) {
        divideRect(width / 2, -height/2, width, height);
    }
    
    // 測驗系統UI
    if (gameState === 'loading') {
        drawLoadingScreen();
    } else if (gameState === 'ready') {
        drawReadyScreen();
    } else if (gameState === 'quiz') {
        drawQuizScreen();
    } else if (gameState === 'feedback') {
        drawFeedbackScreen();
    } else if (gameState === 'result') {
        drawResultScreen();
    } else if (gameState === 'error') {
        drawErrorScreen();
    }
}

function drawLoadingScreen() {
    push();
    fill(255);
    textSize(32);
    text('載入題庫中...', width / 2, height / 2);
    pop();
}

function drawErrorScreen() {
    push();
    fill(255, 0, 0);
    textSize(32);
    text('載入題庫失敗！', width / 2, height / 2 - 50);
    textSize(20);
    fill(255);
    text('請確認 quiz.csv 檔案是否存在於同一資料夾', width / 2, height / 2 + 20);
    pop();
}

function drawReadyScreen() {
    push();
    fill(255);
    textSize(48);
    text('測驗系統', width / 2, height / 2 - 100);
    textSize(24);
    text('題庫已載入：' + quizData.length + ' 題', width / 2, height / 2 - 30);
    text('點擊下方按鈕開始測驗', width / 2, height / 2 + 20);
    
    // 開始按鈕
    let btnX = width / 2;
    let btnY = height / 2 + 100;
    let btnW = 200;
    let btnH = 60;
    
    // 懸停效果
    let isHover = mouseX > btnX - btnW/2 && mouseX < btnX + btnW/2 &&
                  mouseY > btnY - btnH/2 && mouseY < btnY + btnH/2;
    
    fill(isHover ? '#74a8a0' : '#629693');
    stroke(255);
    strokeWeight(3);
    rect(btnX, btnY, btnW, btnH, 10);
    
    fill(255);
    noStroke();
    textSize(28);
    text('開始測驗', btnX, btnY);
    pop();
}

function drawQuizScreen() {
    if (currentQuestions.length === 0) return;
    
    let q = currentQuestions[currentQuestionIndex];
    
    push();
    // 題號和進度
    fill(255);
    textSize(24);
    text('第 ' + (currentQuestionIndex + 1) + ' / 5 題', width / 2, 80);
    
    // 分數
    textSize(20);
    text('目前分數：' + score, width / 2, 120);
    
    // 問題
    textSize(26);
    fill(255); // 改為白色
    let questionY = 200;
    let maxWidth = width * 0.85;
    
    // 自動換行顯示問題
    let words = q.question.split('');
    let line = '';
    let lines = [];
    let testWidth;
    
    textSize(26);
    for (let i = 0; i < words.length; i++) {
        let testLine = line + words[i];
        testWidth = textWidth(testLine);
        if (testWidth > maxWidth && i > 0) {
            lines.push(line);
            line = words[i];
        } else {
            line = testLine;
        }
    }
    lines.push(line);
    
    for (let i = 0; i < lines.length; i++) {
        text(lines[i], width / 2, questionY + i * 35);
    }
    
    // 選項按鈕
    let btnW = min(600, width * 0.85);
    let btnH = 70;
    let startY = questionY + lines.length * 35 + 60;
    let gap = 90;
    let options = ['A', 'B', 'C', 'D'];
    let optionTexts = [q.optionA, q.optionB, q.optionC, q.optionD];
    
    buttons = [];
    for (let i = 0; i < 4; i++) {
        let btnX = width / 2;
        let btnY = startY + i * gap;
        
        let isHover = mouseX > btnX - btnW/2 && mouseX < btnX + btnW/2 &&
                      mouseY > btnY - btnH/2 && mouseY < btnY + btnH/2;
        
        // 按鈕顏色 (懸停時變亮)
        if (isHover) {
            fill(200, 80, 80);
        } else {
            fill(200, 60, 60);
        }
        
        stroke(255);
        strokeWeight(2);
        rect(btnX, btnY, btnW, btnH, 10);
        
        // 按鈕文字
        fill(255);
        noStroke();
        textSize(20);
        text(options[i] + '. ' + optionTexts[i], btnX, btnY);
        
        buttons.push({
            x: btnX,
            y: btnY,
            w: btnW,
            h: btnH,
            answer: options[i]
        });
    }
    pop();
}

function drawResultScreen() {
    push();
    fill(255);
    textSize(48);
    text('測驗結束！', width / 2, height / 2 - 150);
    
    textSize(36);
    fill(255); // 改為白色
    text('你的成績：' + score + ' / 5', width / 2, height / 2 - 80);
    
    // 回饋語
    let feedback = '';
    let feedbackColor;
    if (score === 5) {
        feedback = '完美！全部答對！';
        feedbackColor = color(120, 100, 100);
    } else if (score >= 4) {
        feedback = '非常好！繼續保持！';
        feedbackColor = color(150, 100, 100);
    } else if (score >= 3) {
        feedback = '不錯！還有進步空間！';
        feedbackColor = color(60, 100, 100);
    } else if (score >= 2) {
        feedback = '加油！需要多練習！';
        feedbackColor = color(30, 100, 100);
    } else {
        feedback = '再接再厲！不要放棄！';
        feedbackColor = color(0, 100, 100);
    }
    
    fill(feedbackColor);
    textSize(32);
    text(feedback, width / 2, height / 2);
    
    // 重新開始按鈕
    let btnX = width / 2;
    let btnY = height / 2 + 100;
    let btnW = 200;
    let btnH = 60;
    
    let isHover = mouseX > btnX - btnW/2 && mouseX < btnX + btnW/2 &&
                  mouseY > btnY - btnH/2 && mouseY < btnY + btnH/2;
    
    fill(isHover ? '#74a8a0' : '#629693');
    stroke(255);
    strokeWeight(3);
    rect(btnX, btnY, btnW, btnH, 10);
    
    fill(255);
    noStroke();
    textSize(28);
    text('重新開始', btnX, btnY);
    
    restartButton = {x: btnX, y: btnY, w: btnW, h: btnH};
    pop();
}

function drawFeedbackScreen() {
    let q = currentQuestions[currentQuestionIndex - 1];
    
    push();
    // 題號
    fill(255);
    textSize(24);
    text('第 ' + currentQuestionIndex + ' / 5 題', width / 2, 80);
    
    // 答對或答錯的大標題
    textSize(56);
    if (isCorrect) {
        fill(120, 100, 100); // 綠色
        text('✓ 答對了！', width / 2, height / 2 - 150);
    } else {
        fill(0, 100, 100); // 紅色
        text('✗ 答錯了！', width / 2, height / 2 - 150);
    }
    
    // 顯示問題
    textSize(24);
    fill(255);
    let questionY = height / 2 - 70;
    text('題目：', width / 2, questionY - 30);
    
    textSize(20);
    fill(255); // 改為白色
    let maxWidth = width * 0.85;
    let words = q.question.split('');
    let line = '';
    let lines = [];
    
    for (let i = 0; i < words.length; i++) {
        let testLine = line + words[i];
        let testWidth = textWidth(testLine);
        if (testWidth > maxWidth && i > 0) {
            lines.push(line);
            line = words[i];
        } else {
            line = testLine;
        }
    }
    lines.push(line);
    
    for (let i = 0; i < lines.length; i++) {
        text(lines[i], width / 2, questionY + i * 30);
    }
    
    let answerY = questionY + lines.length * 30 + 50;
    
    // 顯示你的答案
    textSize(24);
    fill(255);
    text('你的答案：', width / 2, answerY);
    textSize(22);
    if (isCorrect) {
        fill(120, 100, 100); // 綠色
    } else {
        fill(0, 100, 100); // 紅色
    }
    let yourAnswerText = selectedAnswer + '. ';
    if (selectedAnswer === 'A') yourAnswerText += q.optionA;
    else if (selectedAnswer === 'B') yourAnswerText += q.optionB;
    else if (selectedAnswer === 'C') yourAnswerText += q.optionC;
    else if (selectedAnswer === 'D') yourAnswerText += q.optionD;
    text(yourAnswerText, width / 2, answerY + 40);
    
    // 如果答錯，顯示正確答案
    if (!isCorrect) {
        textSize(24);
        fill(255);
        text('正確答案：', width / 2, answerY + 100);
        textSize(22);
        fill(120, 100, 100); // 綠色
        let correctAnswerText = correctAnswer + '. ';
        if (correctAnswer === 'A') correctAnswerText += q.optionA;
        else if (correctAnswer === 'B') correctAnswerText += q.optionB;
        else if (correctAnswer === 'C') correctAnswerText += q.optionC;
        else if (correctAnswer === 'D') correctAnswerText += q.optionD;
        text(correctAnswerText, width / 2, answerY + 140);
    }
    
    // 目前分數
    textSize(22);
    fill(255); // 改為白色
    text('目前得分：' + score + ' / ' + currentQuestionIndex, width / 2, height - 150);
    
    // 下一題按鈕
    let btnX = width / 2;
    let btnY = height - 80;
    let btnW = 200;
    let btnH = 60;
    
    let isHover = mouseX > btnX - btnW/2 && mouseX < btnX + btnW/2 &&
                  mouseY > btnY - btnH/2 && mouseY < btnY + btnH/2;
    
    fill(isHover ? '#74a8a0' : '#629693');
    stroke(255);
    strokeWeight(3);
    rect(btnX, btnY, btnW, btnH, 10);
    
    fill(255);
    noStroke();
    textSize(24);
    text(currentQuestionIndex < 5 ? '下一題' : '查看成績', btnX, btnY);
    
    nextButton = {x: btnX, y: btnY, w: btnW, h: btnH};
    pop();
}

function mousePressed() {
    if (gameState === 'ready') {
        // 開始測驗
        let btnX = width / 2;
        let btnY = height / 2 + 100;
        let btnW = 200;
        let btnH = 60;
        
        if (mouseX > btnX - btnW/2 && mouseX < btnX + btnW/2 &&
            mouseY > btnY - btnH/2 && mouseY < btnY + btnH/2) {
            startQuiz();
        }
    } else if (gameState === 'quiz') {
        // 點擊選項直接確認答案
        for (let btn of buttons) {
            if (mouseX > btn.x - btn.w/2 && mouseX < btn.x + btn.w/2 &&
                mouseY > btn.y - btn.h/2 && mouseY < btn.y + btn.h/2) {
                selectedAnswer = btn.answer;
                // 按鈕點擊效果
                createClickEffect(btn.x, btn.y);
                // 直接檢查答案
                checkAnswer();
            }
        }
    } else if (gameState === 'feedback') {
        // 點擊下一題按鈕
        if (nextButton) {
            if (mouseX > nextButton.x - nextButton.w/2 && mouseX < nextButton.x + nextButton.w/2 &&
                mouseY > nextButton.y - nextButton.h/2 && mouseY < nextButton.y + nextButton.h/2) {
                createClickEffect(nextButton.x, nextButton.y);
                nextQuestion();
            }
        }
    } else if (gameState === 'result') {
        // 重新開始
        if (restartButton) {
            if (mouseX > restartButton.x - restartButton.w/2 && mouseX < restartButton.x + restartButton.w/2 &&
                mouseY > restartButton.y - restartButton.h/2 && mouseY < restartButton.y + restartButton.h/2) {
                createClickEffect(restartButton.x, restartButton.y);
                setTimeout(() => {
                    gameState = 'ready';
                    score = 0;
                    currentQuestionIndex = 0;
                    selectedAnswer = null;
                }, 300);
            }
        }
    }
}

function createClickEffect(x, y) {
    // 簡單的視覺回饋
    for (let i = 0; i < 8; i++) {
        let angle = (TWO_PI / 8) * i;
        let speed = 3;
        shapes.push(new ClickParticle(x, y, angle, speed));
    }
}

function startQuiz() {
    // 隨機選5題
    currentQuestions = [];
    let availableQuestions = [...quizData];
    for (let i = 0; i < min(5, quizData.length); i++) {
        let index = floor(random(availableQuestions.length));
        currentQuestions.push(availableQuestions[index]);
        availableQuestions.splice(index, 1);
    }
    currentQuestionIndex = 0;
    score = 0;
    selectedAnswer = null;
    gameState = 'quiz';
}

function checkAnswer() {
    let q = currentQuestions[currentQuestionIndex];
    correctAnswer = q.correctAnswer;
    isCorrect = (selectedAnswer === correctAnswer);
    
    if (isCorrect) {
        score++;
    }
    
    currentQuestionIndex++;
    gameState = 'feedback';
}

function nextQuestion() {
    selectedAnswer = null;
    
    if (currentQuestionIndex >= currentQuestions.length) {
        gameState = 'result';
    } else {
        gameState = 'quiz';
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    centerX = width / 2;
    centerY = height / 2;
}

// 背景動畫函數
function divideRect(x, y, w, h) {
    let ww = random(0.25, 0.75) * w;
    let hh = random(0.25, 0.75) * h;
    let xx = x - (w / 2) + ww;
    let yy = y - (h / 2) + hh;
    let minSize = width * 0.1;
    if (minSize < w && minSize < h) {
        if (h < w) {
            divideRect(xx - ww / 2, y, ww, h);
            divideRect(xx + (w - ww) / 2, y, (w - ww), h);
        } else {
            divideRect(x, yy - hh / 2, w, hh);
            divideRect(x, yy + (h - hh) / 2, w, h - hh);
        }
    } else {
        shapes.push(new Shape(x, y, w, h));
    }
}

function easeInOutQuart(x) {
    return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
}

class Shape {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.currentX = x;
        this.currentY = y;
        this.direction = PI * 1.5;
        this.shiftX = width * cos(this.direction);
        this.shiftY = width * sin(this.direction);
        this.shiftX0 = this.shiftX;
        this.shiftY0 = this.shiftY;
        this.shiftX1 = 0;
        this.shiftY1 = 0;
        this.velocityY = height / 500;
        this.timer = 0;
        this.phase1 = 180;
        this.border = height * random(0.2, 0.3);
        this.isDead = false;
        this.scaleX = 1;
        this.scaleY = 1;
    }
    show() {
        push();
        translate(this.currentX, this.currentY);
        scale(this.scaleX, this.scaleY);
        stroke('#90A4AD');
        fill('#90A4AD');
        rect(this.shiftX, this.shiftY, this.w, this.h);
        pop();
    }
    update() {
        this.currentY += this.velocityY;
        if (this.currentY > this.border) {
            if (0 < this.timer && this.timer < this.phase1) {
                let nrm = norm(this.timer, 0, this.phase1 - 1);
                let ease = easeInOutQuart(nrm);
                this.shiftX = lerp(this.shiftX0, this.shiftX1, ease);
                this.shiftY = lerp(this.shiftY0, this.shiftY1, ease);
                if (this.direction == 0 || this.direction == PI) {
                    this.scaleX = lerp(1, 2, sin(ease * PI));
                    this.scaleY = lerp(1, 0, sin(ease * PI));
                } else {
                    this.scaleY = lerp(1, 2, sin(ease * PI));
                    this.scaleX = lerp(1, 0, sin(ease * PI));
                }
            }
            this.timer++;
        }
        if ((this.currentY - (this.h / 2)) > height) {
            this.isDead = true;
        }
    }
    run() {
        this.show();
        this.update();
    }
}

// 點擊效果粒子
class ClickParticle {
    constructor(x, y, angle, speed) {
        this.x = x;
        this.y = y;
        this.vx = cos(angle) * speed;
        this.vy = sin(angle) * speed;
        this.life = 30;
        this.isDead = false;
    }
    show() {
        push();
        fill(0, 0, 100, map(this.life, 0, 30, 0, 100));
        noStroke();
        circle(this.x, this.y, 8);
        pop();
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        if (this.life <= 0) {
            this.isDead = true;
        }
    }
    run() {
        this.show();
        this.update();
    }
}