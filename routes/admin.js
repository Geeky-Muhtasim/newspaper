const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const bcrypt = require('bcrypt');
const db = require('../db');
// Admin dashboard route
// router.get('/dashboard', (req, res) => {
//   res.render('dashboard', { role: 'admin' });
// });
// Admin dashboard
router.get('/dashboard', isAuthenticated, isAdmin, (req, res) => {
  res.render('dashboard', { role: 'admin' });
});

// View All Users
router.get('/users', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, username, role FROM users');
    res.render('users', { users });
  } catch (err) {
    console.error(err);
    res.send('Error fetching users.');
  }
});

// Add New User
router.post('/users', isAuthenticated, isAdmin, async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [
      username,
      hashedPassword,
      role,
    ]);
    res.redirect('/admin/users');
  } catch (err) {
    console.error(err);
    res.send('Error creating user.');
  }
});

// Delete User
router.post('/users/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
  const userId = req.params.id;

  try {
    await db.query('DELETE FROM users WHERE id = ?', [userId]);
    res.redirect('/admin/users');
  } catch (err) {
    console.error(err);
    res.send('Error deleting user.');
  }
});
// View All Articles
router.get('/articles', isAuthenticated, async (req, res) => {
  try {
    const [articles] = await db.query(
      `SELECT a.id, a.title, c.name AS category, a.tags, a.created_at
       FROM articles a
       JOIN categories c ON a.category_id = c.id`
    );
    res.render('articles', { articles });
  } catch (err) {
    console.error(err);
    res.send('Error fetching articles.');
  }
});

// Add New Article
router.post('/articles', isAuthenticated, async (req, res) => {
  const { title, content, category_id, tags } = req.body;

  try {
    await db.query(
      'INSERT INTO articles (title, content, category_id, tags) VALUES (?, ?, ?, ?)',
      [title, content, category_id, tags]
    );
    res.redirect('/admin/articles');
  } catch (err) {
    console.error(err);
    res.send('Error creating article.');
  }
});

// Delete Article
router.post('/articles/delete/:id', isAuthenticated, async (req, res) => {
  const articleId = req.params.id;

  try {
    await db.query('DELETE FROM articles WHERE id = ?', [articleId]);
    res.redirect('/admin/articles');
  } catch (err) {
    console.error(err);
    res.send('Error deleting article.');
  }
});

module.exports = router;
