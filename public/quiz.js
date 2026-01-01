const API_URL = "https://quiz-app.onrender.com";

let quizFinished = false;
let questions = [];
let currentIndex = 0;
let answers = [];

const params = new URLSearchParams(window.location.search);
const quizCode = localStorage.getItem("currentQuizCode") || params.get("code");

if (!quizCode) {
    alert("No quiz code provided");
    window.location.href = "login.html";
}

const ques = document.getElementById("que");
const optA = document.getElementById("optA");
const optB = document.getElementById("optB");
const optC = document.getElementById("optC");
const optD = document.getElementById("optD");
const optionRadios = document.querySelectorAll('input[type="radio"]');
const optionLabels = document.querySelectorAll(".op");
const timerDisplay = document.getElementById("timer");

fetch(`${API_URL}/questions/${quizCode}`)
    .then(res => res.json())
    .then(data => {
        if (!Array.isArray(data) || data.length === 0) {
            alert("Invalid or empty quiz");
            return;
        }

        questions = data;
        answers = new Array(questions.length).fill(null);

        totalTime = (questions[0].quizTime || 10) * 60;

        document.getElementById("quizSubject").textContent = `Subject: ${questions[0].subject}`;
        document.getElementById("quizClass").textContent = `Class: ${questions[0].className}`;

        showQuestion(0);
    })
    .catch(err => {
        console.error(err);
        alert("Failed to load quiz");
    });

function showQuestion(index) {
    const q = questions[index];

    ques.textContent = q.question;
    optA.textContent = q.A;
    optB.textContent = q.B;
    optC.textContent = q.C;
    optD.textContent = q.D;

    optionLabels.forEach(label => label.classList.remove("selected"));
    optionRadios.forEach(r => r.checked = false);

    if (answers[index]) {
        const selectedRadio = document.querySelector(input[value="${answers[index]}"]);
        if (selectedRadio) {
            selectedRadio.checked = true;
            selectedRadio.closest(".op").classList.add("selected");
        }
    }

    questionCounter();
    updateButtons();
}

optionLabels.forEach(label => {
    label.addEventListener("click", () => {
        const siblings = label.parentElement.querySelectorAll(".op");
        siblings.forEach(l => l.classList.remove("selected"));

        label.classList.add("selected");

        const radio = label.querySelector("input[type='radio']");
        if (radio) {
            radio.checked = true;
            answers[currentIndex] = radio.value;
        }
    });
});

function next() {
    if (currentIndex < questions.length - 1) {
        currentIndex++;
        showQuestion(currentIndex);
    }
}

function previous() {
    if (currentIndex > 0) {
        currentIndex--;
        showQuestion(currentIndex);
    }
}

function updateButtons() {
    const prev = document.getElementById("prea");
    const nextBtn = document.getElementById("ne");
    const submitBtn = document.getElementById("sub");

    prev.disabled = currentIndex === 0;

    if (currentIndex === questions.length - 1) {
        nextBtn.style.display = "none";
        submitBtn.style.display = "inline";
    } else {
        nextBtn.style.display = "inline";
        submitBtn.style.display = "none";
    }
}

function questionCounter() {
    document.getElementById("qu").textContent =
        `Question ${currentIndex + 1} of ${questions.length}`;
}

function submit(target = "score.html") {
    if (quizFinished) return;
    quizFinished = true;

    const studentName = localStorage.getItem("studentName");
    const admissionNumber = localStorage.getItem("admissionNumber");
    if (!studentName || !admissionNumber) {
        alert("Student info missing. Please login again.");
        window.location.href = "login.html";
        return;
    }

    let score = 0;
    questions.forEach((q, i) => {
        if (answers[i] === q.correct) score++;
    });

    fetch(`${API_URL}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: studentName,
            admissionNumber: admissionNumber,
            className: questions[0].className,
            subject: questions[0].subject,
            score,
            total: questions.length
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log("Result saved:", data);
        localStorage.setItem("score", score);
        localStorage.setItem("totalQuestions", questions.length);
        clearInterval(timer);
        window.location.href = target;
    })
    .catch(err => {
        console.error(err);
        alert("Failed to submit quiz result.");
        clearInterval(timer);
        window.location.href = target;
    });
}

let totalTime = 10 * 60; 
const timer = setInterval(() => {
    let m = Math.floor(totalTime / 60);
    let s = totalTime % 60;
    s = s < 10 ? "0" + s : s;

    timerDisplay.textContent = `Time-left: ${m}:${s}`;
    totalTime--;

    if (totalTime <= 60) timerDisplay.style.color = "red";
    if (totalTime < 0) submit();
}, 1000);

document.addEventListener("visibilitychange", () => {
    if (document.hidden && !quizFinished) {
        submit("leave.html");
    }
});
