const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 5000;

// Postavljanje baze podataka
const db = new sqlite3.Database('./users.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ambasada_broj INTEGER,
    ambasada TEXT,
    ime_prezime TEXT,
    funkcija TEXT,
    lokal TEXT
  )`);
});

// Postavljanje middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Rute
app.get('/', (req, res) => {
  db.all(`SELECT * FROM users`, (err, rows) => {
    if (err) {
      throw err;
    }
    const groupedUsers = rows.reduce((acc, user) => {
      if (!acc[user.ambasada_broj]) {
        acc[user.ambasada_broj] = { ambasada: user.ambasada, users: [] };
      }
      acc[user.ambasada_broj].users.push(user);
      return acc;
    }, {});

    res.render('index', { groupedUsers });
  });
});

app.get('/add', (req, res) => {
  res.render('edit', { entry: null });
});

app.post('/add', (req, res) => {
  const { ambasada_broj, ambasada, ime_prezime, funkcija, lokal } = req.body;
  db.run(`INSERT INTO users (ambasada_broj, ambasada, ime_prezime, funkcija, lokal) VALUES (?, ?, ?, ?, ?)`,
    [ambasada_broj, ambasada, ime_prezime, funkcija, lokal],
    (err) => {
      if (err) {
        throw err;
      }
      res.redirect('/');
    }
  );
});

app.get('/edit/:id', (req, res) => {
  const id = req.params.id;
  db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, row) => {
    if (err) {
      throw err;
    }
    res.render('edit', { entry: row });
  });
});

app.post('/edit/:id', (req, res) => {
  const id = req.params.id;
  const { ambasada_broj, ambasada, ime_prezime, funkcija, lokal } = req.body;
  db.run(`UPDATE users SET ambasada_broj = ?, ambasada = ?, ime_prezime = ?, funkcija = ?, lokal = ? WHERE id = ?`,
    [ambasada_broj, ambasada, ime_prezime, funkcija, lokal, id],
    (err) => {
      if (err) {
        throw err;
      }
      res.redirect('/');
    }
  );
});

app.get('/delete/:id', (req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM users WHERE id = ?`, [id], (err) => {
    if (err) {
      throw err;
    }
    res.redirect('/');
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
