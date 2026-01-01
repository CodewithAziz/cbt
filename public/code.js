function start() {
    const name = localStorage.getItem("studentName");
    const number = localStorage.getItem("admissionNumber");

    if (!name || !number) {
        alert("Unauthorized access. Please login first.");
        window.location.href = "login.html";
        return;
    }

    const input = document.querySelector('input[type="tel"]');
    const quizCode = input.value.trim();

    if (!quizCode) {
        alert("Please enter the quiz code.");
        return;
    }

    const quizKey = `quiz_taken_${number}_${quizCode}`;

    if (localStorage.getItem(quizKey) === "true") {
        alert("You have already taken this quiz. You cannot take it twice.");
        return;
    }

    localStorage.setItem("currentQuizCode", quizCode);
    localStorage.setItem(quizKey, "true"); 
    
    window.location.href =`quiz.html?code=${quizCode}`;
}