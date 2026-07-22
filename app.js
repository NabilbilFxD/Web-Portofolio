const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const app =express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// File path untuk database JSON lokal
const DB_FILE = path.join(__dirname, 'database.json');

// Helper membaca & menulis database JSON
function readDB() {
    if (!fs.existsSync(DB_FILE)) {
        const initialData = {
            visitors: 0,
            projects: [
                {
                    id: 1,
                    judul: "Game BOMSKUY",
                    deskripsi: "Game interaktif berbasis web menggunakan HTML5 Canvas, CSS3, dan JavaScript murni untuk tugas Client-Side Programming.",
                    tech: ["HTML5", "CSS3", "JavaScript"]
                },
                {
                    id: 2,
                    judul: "X RPL 1 Class Website",
                    deskripsi: "Website profil kelas lengkap dengan fitur pemutar lagu favorit setiap anak dan galeri interaktif ala Hyprland rice.",
                    tech: ["TailwindCSS", "Node.js", "ExpressJS"]
                },
                {
                    id: 3,
                    judul: "Axioo HW Diagnostic Tool",
                    deskripsi: "Aplikasi utilitas sistem untuk pengecekan hardware fundamental komputer dan sensor port USB.",
                    tech: ["JavaScript", "Express API"]
                }
            ],
            guestbook: [
                { id: 1, nama: "Nabil", pesan: "Portofolio Arch Linux riced emang paling keren!" },
                { id: 2, nama: "Admin", pesan: "Backend ExpressJS online dan berjalan stabil." }
            ]
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Inisialisasi database awal jika belum ada
readDB();

// --- FITUR 1: VISITOR COUNTER MIDDLEWARE ---
app.use((req, res, next) => {
    // Hanya hitung visitor untuk request API utama / atau hitungan umum
    if (req.path.startsWith('/api/') && req.method === 'GET') {
        const db = readDB();
        db.visitors = (db.visitors || 0) + 1;
        writeDB(db);
    }
    next();
});

// --- FITUR 3: RATE LIMITER ANTI-SPAM UNTUK GUESTBOOK ---
const guestbookLimiter = rateLimit({
    windowMs: 60 * 1000, // Jendela waktu 1 menit
    max: 3, // Maksimal 3 kali request POST per IP dalam 1 menit
    message: {
        status: 'error',
        message: 'Terlalu banyak spam! Tunggu 1 menit sebelum mengirim pesan lagi.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// ================= API ENDPOINTS ================= //

// 1. Endpoint Get Projects
app.get('/api/projects', (req, res) => {
    const db = readDB();
    res.json({
        status: 'success',
        visitors: db.visitors,
        data: db.projects
    });
});

// 2. Endpoint Get Guestbook Messages
app.get('/api/guestbook', (req, res) => {
    const db = readDB();
    res.json({
        status: 'success',
        data: db.guestbook
    });
});

// 3. Endpoint Post Guestbook (Diberi Rate Limiter Anti-Spam)
app.post('/api/guestbook', guestbookLimiter, (req, res) => {
    const { nama, pesan } = req.body;

    if (!nama || !pesan) {
        return res.status(400).json({ status: 'error', message: 'Nama dan pesan wajib diisi!' });
    }

    const db = readDB();
    const newMessage = {
        id: db.guestbook.length > 0 ? db.guestbook[db.guestbook.length - 1].id + 1 : 1,
        nama: nama.trim(),
        pesan: pesan.trim()
    };

    db.guestbook.push(newMessage);
    writeDB(db);

    res.status(201).json({
        status: 'success',
        message: 'Pesan berhasil disimpan ke server!',
        data: newMessage
    });
});

// 4. Endpoint Statistik / Visitor Info tambahan
app.get('/api/stats', (req, res) => {
    const db = readDB();
    res.json({
        status: 'success',
        totalVisitors: db.visitors,
        totalProjects: db.projects.length,
        totalMessages: db.guestbook.length,
        serverUptime: process.uptime()
    });
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`[BACKEND] Server Express.js aktif di http://localhost:${PORT}`);
});