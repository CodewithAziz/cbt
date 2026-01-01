document.addEventListener("DOMContentLoaded", () => {
    const hamBtn = document.getElementById("ha");
    const cloBtn = document.getElementById("clo");
    const menu = document.getElementById("la");

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

    const logoutBtns = [document.getElementById("log"), document.getElementById("logoutLink")];
    logoutBtns.forEach(btn => {
        if (!btn) return;
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("adminToken");
            window.location.href = "admin.html";
        });
    });

    const viewBtn = document.getElementById("view");
    viewBtn.addEventListener("click", async () => {
        const subject = document.getElementById("subjectInput").value.trim();
        const className = document.getElementById("classSelect").value;
        const date = document.getElementById("dat").value;
        const token = localStorage.getItem("adminToken");

        if (!subject || !className) {
            alert("Please enter subject and select class.");
            return;
        }

        if (!token) {
            alert("Session expired. Please login again.");
            window.location.href = "admin.html";
            return;
        }

        const tbody = document.getElementById("resultsBody");
        tbody.innerHTML = "";

        const params = new URLSearchParams({ subject, className });
        if (date) params.append("date", date);

        try {
            const res = await fetch(`/api/results?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token} `}
            });

            if (!res.ok) throw new Error("Failed to fetch results");

            const data = await res.json();

            if (!data || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5">No results found for ${subject} - ${className}${date ? " on " + date : ""}</td></tr>`;
                return;
            }

            data.forEach(r => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${r.username}</td>
                    <td>${r.admissionNumber || "N/A"}</td>
                    <td>${r.className}</td>
                    <td>${r.subject}</td>
                    <td>${r.date}</td>
                    <td>${r.score}</td>
                    <td>${r.total}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (err) {
            console.error(err);
            alert("Error fetching results. Make sure you are running through the server (http://localhost:3000).");
        }
    });
});