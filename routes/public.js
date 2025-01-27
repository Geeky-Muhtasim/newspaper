const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');

// Render Login Page
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Handle Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
  
      if (users.length === 0) {
        return res.render('login', { error: 'Invalid username or password' });
      }
  
      const user = users[0];
      const match = await bcrypt.compare(password, user.password);
  
      if (match) {
        // Store user session
        req.session.user = { id: user.id, username: user.username, role: user.role };
  
        // Redirect based on role
        if (user.role === 'admin') {
          return res.redirect('/admin/dashboard');
        } else if (user.role === 'editor') {
          return res.redirect('/editor/dashboard');
        }
      }
  
      res.render('login', { error: 'Invalid username or password' });
    } catch (err) {
      console.error(err);
      res.render('login', { error: 'Something went wrong. Please try again.' });
    }
  });
  

// Handle Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

router.get('/', (req, res) => {
  res.render('main'); // Render the main page
});

module.exports = router;
