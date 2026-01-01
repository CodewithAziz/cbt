const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || "quiz_secret_key";
const SALT_ROUNDS = 10;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const db = new sqlite3.Database("./quiz.db");

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT
        )
   `);

    db.run(`
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quizCode TEXT,
            subject TEXT,
            className TEXT,
            question TEXT,
            A TEXT,
            B TEXT,
            C TEXT,
            D TEXT,
            correct TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            admissionNumber TEXT,
            className TEXT,
            subject TEXT,
            score INTEGER,
            total INTEGER,
            date TEXT,
            UNIQUE(admissionNumber, subject)
        )
    `);
});

function auth(role) {
    return (req, res, next) => {
        const header = req.headers.authorization;
        if (!header) return res.status(401).json({ error: "No token provided" });

        const token = header.split(" ")[1];
        jwt.verify(token, SECRET, (err, user) => {
            if (err) return res.status(403).json({ error: "Invalid or expired token" });
            if (role && user.role !== role) return res.status(403).json({ error: "Access denied" });
            req.user = user;
            next();
        });
    };
}

app.post("/create-admin", async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashed = await bcrypt.hash(password, SALT_ROUNDS);
        db.run(
            "INSERT INTO users (username, password, role) VALUES (?, ?, 'admin')",
            [username, hashed],
            err => {
                if (err) return res.status(400).json({ error: "Admin already exists" });
                res.json({ message: "Admin created" });
            }
        );
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

app.post("/admin/login", (req, res) => {
    const { username, password } = req.body;
    db.get(
        "SELECT * FROM users WHERE username=? AND role='admin'",
        [username],
        async (err, admin) => {
            if (err) return res.status(500).json({ error: "Server error" });
            if (!admin) return res.status(401).json({ error: "Invalid login" });

            const ok = await bcrypt.compare(password, admin.password);
            if (!ok) return res.status(401).json({ error: "Invalid login" });

            const token = jwt.sign({ id: admin.id, role: "admin" }, SECRET, { expiresIn: "2h" });
            res.json({ token });
        }
    );
});

app.post("/questions", auth("admin"), (req, res) => {
    const { questions, subject, className, quizTime} = req.body;

    if (!subject || !className) {
        return res.status(400).json({ error: "Subject and class are required" });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: "No questions provided" });
    }

    const validQuestions = questions.filter(q =>
        q.question && q.A && q.B && q.C && q.D && q.correct && q.correct !== "Correct Option"
    );
    if (validQuestions.length === 0) {
        return res.status(400).json({ error: "All questions are incomplete" });
    }

    const quizCode = Math.random().toString(36).substring(2, 10);
    const stmt = db.prepare(`
        INSERT INTO questions
        (quizCode, subject, className, question, A, B, C, D, correct, quizTime)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    validQuestions.forEach(q => {
        stmt.run(
            quizCode,
            subject,
            className,
            q.question,
            q.A,
            q.B,
            q.C,
            q.D,
            q.correct,
            quizTime
        );
    });

    stmt.finalize(err => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to save questions" });
        }
        res.json({ quizCode, saved: validQuestions.length });
    });
});

app.get("/questions/:quizCode", (req, res) => {
    const { quizCode } = req.params;
    db.all("SELECT * FROM questions WHERE quizCode = ?", [quizCode], (err, rows) => {
        if (err) return res.status(500).json({ error: "Server error" });
        res.json(rows); 
    });
});

app.post("/results", (req, res) => {
    const { username, admissionNumber, className, subject, score, total } = req.body;
    if (!username || !admissionNumber || !className || !subject || score == null || total == null) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const date = new Date().toISOString().split("T")[0];

    db.run(
        `INSERT INTO results
        (username, admissionNumber, className, subject, score, total, date)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [username, admissionNumber, className, subject, score, total, date],
        err => {
            if (err) {
                return res.status(400).json({ error: "You have already taken this subject" });
            }
            res.json({ message: "Result saved" });
        }
    );
});

app.get("/api/results", auth("admin"), (req, res) => {
    const { subject, className, date } = req.query;
    let q = "SELECT * FROM results WHERE 1=1";
    const p = [];

    if (subject) { q += " AND subject=?"; p.push(subject); }
    if (className) { q += " AND className=?"; p.push(className); }
    if (date) { q += " AND date=?"; p.push(date); }

    db.all(q, p, (err, rows) => {
        if (err) return res.status(500).json({ error: "Server error" });
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});