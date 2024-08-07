const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const { isAdmin } = require('./middleware/auth');

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
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Middleware za proveru da li je korisnik admin
function checkAdmin(req, res, next) {
    res.locals.isAdmin = req.session.user && req.session.user.role === 'admin';
    next();
}

app.use(checkAdmin);

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

    // Dodavanje req i isAdmin u kontekst za EJS
    res.render('index', { req, groupedUsers, isAdmin: res.locals.isAdmin });
  });
});


app.get('/add', isAdmin, (req, res) => {
  res.render('edit', { entry: null });
});

app.post('/add', isAdmin, (req, res) => {
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

app.get('/edit/:id', isAdmin, (req, res) => {
  const id = req.params.id;
  db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, row) => {
    if (err) {
      throw err;
    }
    res.render('edit', { entry: row });
  });
});

app.post('/edit/:id', isAdmin, (req, res) => {
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

app.get('/delete/:id', isAdmin, (req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM users WHERE id = ?`, [id], (err) => {
    if (err) {
      throw err;
    }
    res.redirect('/');
  });
});

// Logovanje i odjavljivanje
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin') {
    req.session.user = { username: 'admin', role: 'admin' };
    res.redirect('/');
  } else {
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
