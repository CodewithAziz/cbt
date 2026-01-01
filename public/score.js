const score = localStorage.getItem("score");
const total = localStorage.getItem("totalQuestions");

const sc = document.getElementById("sco");

sc.textContent = `You scored ${score} out of ${total}`;
