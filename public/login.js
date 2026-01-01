function enter() {
    const name = document.getElementById("name").value.trim();
    const number = document.getElementById("number").value.trim();

    if (!name || !number) {
        alert("Please enter both your full name and admission number");
        return;
    }

    localStorage.setItem("studentName", name);
    localStorage.setItem("admissionNumber", number);

    window.location.href = "code.html";
}
