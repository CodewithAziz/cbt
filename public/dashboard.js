const API_URL = "https://quiz-app.onrender.com";
document.addEventListener("DOMContentLoaded", () => {
    const hamBtn = document.getElementById("ha");
    const cloBtn = document.getElementById("clo");
    const menu = document.getElementById("la");
    const csvInput = document.getElementById("csvFile");

    hamBtn.addEventListener("click", (e) => {
        menu.classList.toggle("active");
        e.stopPropagation();
    });

    cloBtn.addEventListener("click", (e) => {
        menu.classList.remove("active");
        e.stopPropagation();
    });

    document.addEventListener("click", (e) => {
        if (menu.classList.contains("active") && !menu.contains(e.target) && e.target !== hamBtn) {
            menu.classList.remove("active");
        }
    });

    menu.addEventListener("click", (e) => e.stopPropagation());

    window.logout = function () {
        localStorage.removeItem("adminToken");
        window.location.href = "admin.html";
    };

    window.add = function () {
        const numb = document.getElementById("num");
        const val = parseInt(numb.value);

        if (isNaN(val) || val < 1) {
            alert("Number of questions must be greater than 0!");
            return;
        }

        const container = document.getElementById("hol");
        container.innerHTML = "";

        for (let i = 0; i < val; i++) {
            createQuestionRow();
        }
    };

    function createQuestionRow(data = {}) {
        const container = document.getElementById("hol");
        const div = document.createElement("div");
        div.className = "hol";

        div.innerHTML = `
            <input class="ans" placeholder="Question" value="${data.question || ""}">
            <input class="ans" placeholder="Option A" value="${data.A || ""}">
            <input class="ans" placeholder="Option B" value="${data.B || ""}">
            <input class="ans" placeholder="Option C" value="${data.C || ""}">
            <input class="ans" placeholder="Option D" value="${data.D || ""}">
            <select>
                <option disabled ${!data.correct ? "selected" : ""}>Correct Option</option>
                <option ${data.correct === "A" ? "selected" : ""}>A</option>
                <option ${data.correct === "B" ? "selected" : ""}>B</option>
                <option ${data.correct === "C" ? "selected" : ""}>C</option>
                <option ${data.correct === "D" ? "selected" : ""}>D</option>
            </select>
            <button class="del">Delete</button>
        `;

        div.querySelector(".del").onclick = () => div.remove();
        container.appendChild(div);
    }

    if (csvInput) {
        csvInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => parseCSV(reader.result);
            reader.readAsText(file);
        });
    }

    function parseCSV(text) {
        const rows = text.trim().split("\n");
        const container = document.getElementById("hol");
        container.innerHTML = "";

        rows.forEach((row, index) => {
            if (index === 0) return; 

            const [question, A, B, C, D, correct] = row.split(",");

            if (question && A && B && C && D && correct) {
                createQuestionRow({
                    question: question.trim(),
                    A: A.trim(),
                    B: B.trim(),
                    C: C.trim(),
                    D: D.trim(),
                    correct: correct.trim()
                });
            }
        });
    }
    
    window.save = function () {
        const subjectInput = document.querySelector('input[placeholder="Enter Subject"]');
        const classSelect = document.getElementById("classSelect");
        const timeInput = document.getElementById("quizTime");

        if (!subjectInput || !classSelect || !timeInput) {
            alert("Missing required inputs");
            return;
        }

        const subject = subjectInput.value.trim();
        const className = classSelect.value;
        const quizTime = parseInt(timeInput.value);

        if (!subject || !className || isNaN(quizTime) || quizTime < 1) {
            alert("Fill subject, class and valid quiz time");
            return;
        }

        const token = localStorage.getItem("adminToken");
        if (!token) {
            alert("Login expired");
            window.location.href = "admin.html";
            return;
        }

        const questionDivs = document.querySelectorAll("#hol .hol");
        if (questionDivs.length === 0) {
            alert("Add questions first");
            return;
        }

        const questions = [];

        questionDivs.forEach(div => {
            const inputs = div.querySelectorAll(".ans");
            const correct = div.querySelector("select").value;

            if (
                !inputs[0].value ||
                !inputs[1].value ||
                !inputs[2].value ||
                !inputs[3].value ||
                !inputs[4].value ||
                correct === "Correct Option"
            ) {
                return;
            }

            questions.push({
                question: inputs[0].value,
                A: inputs[1].value,
                B: inputs[2].value,
                C: inputs[3].value,
                D: inputs[4].value,
                correct
            });
        });

        if (questions.length === 0) {
            alert("All questions are incomplete!");
            return;
        }

        fetch(`${API_URL}/questions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                subject,
                className,
                quizTime,
                questions
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.quizCode) {
                alert(`Questions saved! Quiz Code: ${data.quizCode}`);
                document.getElementById("hol").innerHTML = "";
            } else {
                alert(data.error || "Failed to save questions");
            }
        })
        .catch(err => {
            console.error(err);
            alert("Server error. Try again.");
        });
    };
});
