async function enter() {
    const username = document.getElementById("name").value.trim();
    const password = document.getElementById("number").value.trim();

    if (!username || !password) {
        alert("Please enter both username and password");
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("adminToken", data.token);
            alert("Login successful!");
            window.location.href = "dashboard.html";
        } else {
            alert(data.error || "Login failed. Please try again.");
        }
    } catch (err) {
        console.error(err);
        alert("Server error. Please try again later.");
    }
}

window.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("adminToken");
    if (token) {
        window.location.href = "dashboard.html";
    }
});

function logout() {
    localStorage.removeItem("adminToken");
    window.location.href = "admin.html";
}
window.logout = logout;

async function saveQuestions(questions, subject, className) {
    const token = localStorage.getItem("adminToken");
    if (!token) {
        alert("Login expired. Please login again.");
        window.location.href = "admin.html";
        return;
    }

    if (!subject || !className) {
        alert("Enter subject and select class.");
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/questions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ questions, subject, className })
        });

        const data = await res.json();
        if (res.ok) {
            alert(`Questions saved! Quiz Code: ${data.quizCode}`);
        } else {
            alert(data.error || "Error saving questions.");
        }
    } catch (err) {
        console.error(err);
        alert("Server error. Try again.");
    }
}

window.saveQuestions = saveQuestions;