const defaultDurations = {
    focus: 25,
    'short-break': 5,
    'long-break': 15
};

const typeLabels = {
    focus: '🍅 Foco',
    'short-break': '🌙 Descanso curto',
    'long-break': '🌳 Descanso longo'
};

const typeMessages = {
    focus: 'Hora de focar!',
    'short-break': 'Hora do descanso curto.',
    'long-break': 'Hora do descanso longo.'
};

let currentType = 'focus';
let currentMinutes = defaultDurations[currentType];
let currentSeconds = 0;
let timerId = null;
let completedCount = 0;
let focusCycleCount = 0;
let sessionTotalSeconds = defaultDurations[currentType] * 60;

const typeButtons = document.querySelectorAll('.pomodoro-type-buttons .type-btn');
const timerDisplay = document.getElementById('timer-display');
const timerLabel = document.querySelector('.timer-label');
const controlTime = document.querySelector('.control-time');
const minusBtn = document.querySelector('.minus-btn');
const plusBtn = document.querySelector('.plus-btn');
const btnStart = document.getElementById('btn-start');
const btnReset = document.getElementById('btn-reset');
const pomodoroMessage = document.querySelector('.pomodoro-message');
const completedCountEl = document.querySelector('.pomodoro-completed strong');
const completedResetLink = document.querySelector('.pomodoro-completed .reset-link');
const timerRing = document.querySelector('.timer-ring');
const progressDots = document.querySelectorAll('.progress-dot');

function formatTime(minutes, seconds) {
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
}

function updateProgressDots() {
    if (!progressDots.length) return;
    const activeCount = Math.min(completedCount, progressDots.length);
    progressDots.forEach((dot, index) => {
        dot.classList.toggle('active', index < activeCount);
    });
}

function updateDisplay() {
    timerDisplay.textContent = formatTime(currentMinutes, currentSeconds);
    controlTime.textContent = `${currentMinutes} min`;
    timerLabel.textContent = typeLabels[currentType];
    updateProgressDots();
    updateTimerRing();

    if (!timerId && pomodoroMessage.textContent !== 'Sessão concluída!' && pomodoroMessage.textContent !== 'Pausado') {
        pomodoroMessage.textContent = typeMessages[currentType];
    }
}

function playBeep(type) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.type = 'sine';

        if (type === 'focus') {
            oscillator.frequency.value = 760;
        } else if (type === 'break') {
            oscillator.frequency.value = 520;
        } else {
            oscillator.frequency.value = 620;
        }

        gainNode.gain.value = 0.08;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.18);
        setTimeout(() => audioContext.close(), 300);
    } catch (error) {
        console.warn('Áudio não suportado:', error);
    }
}

function updateTimerRing() {
    if (!timerRing || sessionTotalSeconds <= 0) return;
    const remainingSeconds = currentMinutes * 60 + currentSeconds;
    const completedPercentage = Math.min(100, Math.max(0, ((sessionTotalSeconds - remainingSeconds) / sessionTotalSeconds) * 100));
    const degrees = Math.round(completedPercentage * 3.6);
    timerRing.style.setProperty('--progress-deg', `${degrees}deg`);
}

function setActiveTypeButton(type) {
    typeButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.type === type);
    });
}

function stopTimer() {
    if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
    }
    btnStart.textContent = 'Iniciar';
}

function switchSession(type, autoStart = false) {
    currentType = type;
    stopTimer();
    currentMinutes = defaultDurations[type];
    currentSeconds = 0;
    sessionTotalSeconds = defaultDurations[type] * 60;
    setActiveTypeButton(type);
    pomodoroMessage.textContent = typeMessages[type];
    updateDisplay();
    if (autoStart) {
        startTimer();
    }
}

function handleTypeButtonClick(event) {
    const type = event.currentTarget.dataset.type;
    if (currentType !== type) {
        switchSession(type, false);
    }
}

function tick() {
    if (currentSeconds === 0) {
        if (currentMinutes === 0) {
            completeSession();
            return;
        }
        currentMinutes -= 1;
        currentSeconds = 59;
    } else {
        currentSeconds -= 1;
    }
    updateDisplay();
}

function completeSession() {
    stopTimer();
    updateDisplay();

    if (currentType === 'focus') {
        completedCount += 1;
        focusCycleCount += 1;
        completedCountEl.textContent = completedCount;
        pomodoroMessage.textContent = 'Pomodoro concluído!';
        playBeep('focus');
        if (window.historyManager) {
            window.historyManager.record('pomodoro');
        }

        if (focusCycleCount >= 4) {
            focusCycleCount = 0;
            pomodoroMessage.textContent = 'Iniciando descanso longo...';
            switchSession('long-break', true);
            return;
        }

        pomodoroMessage.textContent = 'Iniciando descanso curto...';
        switchSession('short-break', true);
        return;
    }

    pomodoroMessage.textContent = 'Descanso concluído!';
    playBeep('break');
    pomodoroMessage.textContent = 'Retornando para o Pomodoro...';
    switchSession('focus', true);
}

function startTimer() {
    if (timerId !== null) {
        stopTimer();
        pomodoroMessage.textContent = 'Pausado';
        return;
    }

    if (currentMinutes === 0 && currentSeconds === 0) {
        currentMinutes = defaultDurations[currentType];
        sessionTotalSeconds = currentMinutes * 60;
    }

    sessionTotalSeconds = currentMinutes * 60 + currentSeconds;
    timerId = setInterval(tick, 1000);
    btnStart.textContent = 'Pausar';
    pomodoroMessage.textContent = 'Contando...';
}

function resetTimer() {
    stopTimer();
    currentMinutes = defaultDurations[currentType];
    currentSeconds = 0;
    sessionTotalSeconds = defaultDurations[currentType] * 60;
    pomodoroMessage.textContent = typeMessages[currentType];
    updateDisplay();
}

function resetCompletedCount() {
    completedCount = 0;
    completedCountEl.textContent = completedCount;
}

function adjustMinutes(delta) {
    let totalSeconds = currentMinutes * 60 + currentSeconds + delta * 60;
    if (totalSeconds < 60) {
        totalSeconds = 60;
    }

    currentMinutes = Math.floor(totalSeconds / 60);
    currentSeconds = totalSeconds % 60;
    sessionTotalSeconds = totalSeconds;
    updateDisplay();
}

function initPomodoro() {
    typeButtons.forEach(button => button.addEventListener('click', handleTypeButtonClick));
    minusBtn.addEventListener('click', () => adjustMinutes(-1));
    plusBtn.addEventListener('click', () => adjustMinutes(1));
    btnStart.addEventListener('click', startTimer);
    btnReset.addEventListener('click', resetTimer);

    if (completedResetLink) {
        completedResetLink.addEventListener('click', event => {
            event.preventDefault();
            resetCompletedCount();
        });
    }

    setActiveTypeButton(currentType);
    updateDisplay();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPomodoro);
} else {
    initPomodoro();
}
