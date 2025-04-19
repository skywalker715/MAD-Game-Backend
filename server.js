const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');
const app = express();
const PORT = 3000;
// Middleware
app.use(cors()); // Allow Unity to access API
app.use(bodyParser.json()); // Parse JSON requests
// 1. Register a new user
app.post('/register', (req, res) => {
const { username, password } = req.body;
const sql = `INSERT INTO users (username, password) VALUES (?, ?)`;
db.run(sql, [username, password], function (err) {
if (err) {
 return res.status(400).json({ error: err.message });
 }
 res.json({ id: this.lastID, username });
 });
});
// 2. Login user
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const sql = `SELECT id, username FROM users WHERE username = ? AND password = ?`;
  db.get(sql, [username, password], (err, row) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!row) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    res.json({ 
      id: row.id, 
      username: row.username,
      message: 'Login successful' 
    });
  });
});
// 3. Get user data
app.get('/user/:id', (req, res) => {
 const sql = `SELECT id, username FROM users WHERE id = ?`;
 db.get(sql, [req.params.id], (err, row) => {
 if (err) {
 return res.status(400).json({ error: err.message });
 }
 if (!row) {
 return res.status(404).json({ error: 'User not found' });
 }
 res.json(row);
 });
});
// 4. Add a new game score
app.post('/game-score', (req, res) => {
    const { user_id, score } = req.body;
    const sql = `INSERT INTO game_scores (user_id, score) VALUES (?, ?)`;
    db.run(sql, [user_id, score], function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ 
            id: this.lastID,
            user_id,
            score,
            message: 'Score recorded successfully'
        });
    });
});
// 5. Get user's game scores
app.get('/user/:id/scores', (req, res) => {
    const sql = `
        SELECT score, played_at 
        FROM game_scores 
        WHERE user_id = ? 
        ORDER BY played_at DESC
    `;
    db.all(sql, [req.params.id], (err, rows) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json(rows);
    });
});
// 6. Get user's statistics
app.get('/user/:id/statistics', (req, res) => {
    const sql = `
        SELECT 
            COUNT(*) as total_games,
            MAX(score) as highest_score,
            AVG(score) as average_score,
            MIN(played_at) as first_game,
            MAX(played_at) as last_game
        FROM game_scores 
        WHERE user_id = ?
    `;
    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json(row);
    });
});
// 7. Delete user and their scores
app.delete('/user/:id', (req, res) => {
    // First delete all game scores for the user
    db.run(`DELETE FROM game_scores WHERE user_id = ?`, [req.params.id], (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        // Then delete the user
        db.run(`DELETE FROM users WHERE id = ?`, [req.params.id], function (err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json({ message: 'User and all associated scores deleted' });
        });
    });
});
// Start server
app.listen(PORT, () => {
console.log(`Server running on http://localhost:${PORT}`);
});
    