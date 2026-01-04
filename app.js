// 娯楽時間管理アプリ

class TimeBudgetApp {
    constructor() {
        this.weeklyBudget = 14; // デフォルト14時間
        this.usedTime = 0;
        this.timerStartTime = null;
        this.timerInterval = null;
        this.currentTimerSeconds = 0;
        this.history = [];

        this.init();
    }

    init() {
        this.loadData();
        this.checkWeekReset();
        this.setupEventListeners();
        this.updateDisplay();
        this.displayWeekRange();
        this.displayHistory();
    }

    // LocalStorageからデータを読み込み
    loadData() {
        const savedData = localStorage.getItem('timeBudgetData');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.weeklyBudget = data.weeklyBudget || 14;
            this.usedTime = data.usedTime || 0;
            this.history = data.history || [];
            this.lastWeekStart = data.lastWeekStart || this.getWeekStart();
        } else {
            this.lastWeekStart = this.getWeekStart();
        }
    }

    // データをLocalStorageに保存
    saveData() {
        const data = {
            weeklyBudget: this.weeklyBudget,
            usedTime: this.usedTime,
            history: this.history,
            lastWeekStart: this.lastWeekStart
        };
        localStorage.setItem('timeBudgetData', JSON.stringify(data));
    }

    // 週の開始日を取得（月曜日）
    getWeekStart() {
        const now = new Date();
        const day = now.getDay();
        const diff = (day === 0 ? -6 : 1) - day; // 月曜日を週の開始とする
        const monday = new Date(now);
        monday.setDate(now.getDate() + diff);
        monday.setHours(0, 0, 0, 0);
        return monday.getTime();
    }

    // 週が変わったかチェック
    checkWeekReset() {
        const currentWeekStart = this.getWeekStart();
        if (this.lastWeekStart < currentWeekStart) {
            // 新しい週が始まった
            this.usedTime = 0;
            this.history = [];
            this.lastWeekStart = currentWeekStart;
            this.saveData();
        }
    }

    // 週の範囲を表示
    displayWeekRange() {
        const weekStart = new Date(this.getWeekStart());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const formatDate = (date) => {
            return `${date.getMonth() + 1}/${date.getDate()}`;
        };

        const weekRangeElement = document.getElementById('weekRange');
        weekRangeElement.textContent = `今週: ${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
    }

    // イベントリスナーの設定
    setupEventListeners() {
        document.getElementById('saveBudget').addEventListener('click', () => this.saveBudget());
        document.getElementById('startTimer').addEventListener('click', () => this.startTimer());
        document.getElementById('stopTimer').addEventListener('click', () => this.stopTimer());
        document.getElementById('resetTimer').addEventListener('click', () => this.resetTimer());
        document.getElementById('clearHistory').addEventListener('click', () => this.clearHistory());
        document.getElementById('resetWeek').addEventListener('click', () => this.resetWeek());
    }

    // 目標時間を保存
    saveBudget() {
        const budgetInput = document.getElementById('weeklyBudget');
        const newBudget = parseFloat(budgetInput.value);

        if (newBudget > 0) {
            this.weeklyBudget = newBudget;
            this.saveData();
            this.updateDisplay();
            this.showNotification('目標時間を保存しました');
        } else {
            alert('有効な時間を入力してください');
        }
    }

    // タイマー開始
    startTimer() {
        if (this.timerInterval) return; // 既に実行中

        this.timerStartTime = Date.now() - (this.currentTimerSeconds * 1000);

        this.timerInterval = setInterval(() => {
            this.currentTimerSeconds = Math.floor((Date.now() - this.timerStartTime) / 1000);
            this.updateTimerDisplay();
        }, 100);

        document.getElementById('startTimer').disabled = true;
        document.getElementById('stopTimer').disabled = false;
    }

    // タイマー停止
    stopTimer() {
        if (!this.timerInterval) return;

        clearInterval(this.timerInterval);
        this.timerInterval = null;

        // 使用時間に追加
        const hours = this.currentTimerSeconds / 3600;
        if (hours > 0) {
            this.usedTime += hours;
            this.addHistory(hours);
            this.saveData();
            this.updateDisplay();
            this.displayHistory();
        }

        this.currentTimerSeconds = 0;
        this.updateTimerDisplay();

        document.getElementById('startTimer').disabled = false;
        document.getElementById('stopTimer').disabled = true;

        this.showNotification('記録しました');
    }

    // タイマーリセット
    resetTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        this.currentTimerSeconds = 0;
        this.updateTimerDisplay();

        document.getElementById('startTimer').disabled = false;
        document.getElementById('stopTimer').disabled = true;
    }

    // タイマー表示を更新
    updateTimerDisplay() {
        const hours = Math.floor(this.currentTimerSeconds / 3600);
        const minutes = Math.floor((this.currentTimerSeconds % 3600) / 60);
        const seconds = this.currentTimerSeconds % 60;

        const display = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        document.getElementById('timerDisplay').textContent = display;
    }

    // 履歴に追加
    addHistory(hours) {
        const now = new Date();
        this.history.unshift({
            timestamp: now.getTime(),
            duration: hours,
            date: now.toLocaleString('ja-JP')
        });

        // 最大50件まで保持
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }
    }

    // 履歴を表示
    displayHistory() {
        const historyList = document.getElementById('historyList');

        if (this.history.length === 0) {
            historyList.innerHTML = '<p class="no-data">まだ記録がありません</p>';
            return;
        }

        historyList.innerHTML = this.history.map(item => {
            const hours = item.duration.toFixed(2);
            const minutes = Math.round(item.duration * 60);
            return `
                <div class="history-item">
                    <div class="history-date">${item.date}</div>
                    <div class="history-duration">${hours}時間 (${minutes}分)</div>
                </div>
            `;
        }).join('');
    }

    // 表示を更新
    updateDisplay() {
        // 目標時間
        document.getElementById('weeklyBudget').value = this.weeklyBudget;
        document.getElementById('totalBudget').textContent = this.weeklyBudget.toFixed(1);

        // 使用時間
        document.getElementById('usedTime').textContent = this.usedTime.toFixed(1);

        // 残り時間
        const remaining = Math.max(0, this.weeklyBudget - this.usedTime);
        document.getElementById('remainingTime').textContent = remaining.toFixed(1);

        // プログレスバー
        const percentage = Math.min(100, (this.usedTime / this.weeklyBudget) * 100);
        const progressBar = document.getElementById('progressBar');
        progressBar.style.width = `${percentage}%`;

        // プログレスバーの色を変更
        progressBar.classList.remove('warning', 'danger');
        if (percentage >= 100) {
            progressBar.classList.add('danger');
        } else if (percentage >= 80) {
            progressBar.classList.add('warning');
        }

        // プログレステキスト
        document.getElementById('progressText').textContent = `${percentage.toFixed(1)}% 使用`;

        // 残り時間のカードの色を変更
        const remainingCard = document.querySelector('.stat-card.highlight');
        if (remaining <= 0) {
            remainingCard.style.background = 'linear-gradient(135deg, #ffebee, #ffcdd2)';
            remainingCard.style.borderColor = 'var(--danger-color)';
        } else if (remaining < this.weeklyBudget * 0.2) {
            remainingCard.style.background = 'linear-gradient(135deg, #fff3e0, #ffe0b2)';
            remainingCard.style.borderColor = 'var(--warning-color)';
        } else {
            remainingCard.style.background = 'linear-gradient(135deg, #e3f2fd, #bbdefb)';
            remainingCard.style.borderColor = 'var(--primary-color)';
        }
    }

    // 履歴をクリア
    clearHistory() {
        if (confirm('履歴をクリアしますか？（使用時間はリセットされません）')) {
            this.history = [];
            this.saveData();
            this.displayHistory();
            this.showNotification('履歴をクリアしました');
        }
    }

    // 週データをリセット
    resetWeek() {
        if (confirm('今週のデータをすべてリセットしますか？この操作は取り消せません。')) {
            this.usedTime = 0;
            this.history = [];
            this.lastWeekStart = this.getWeekStart();
            this.saveData();
            this.updateDisplay();
            this.displayHistory();
            this.showNotification('週データをリセットしました');
        }
    }

    // 通知を表示（簡易版）
    showNotification(message) {
        // 既存の通知を削除
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success-color);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
}

// アニメーション用CSSを追加
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// アプリ起動
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TimeBudgetApp();
});
