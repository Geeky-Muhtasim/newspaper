const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const bcrypt = require('bcrypt');
const db = require('../db');
const multer = require('multer');
const path = require('path');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Specify the directory to save the uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Generate a unique filename
  }
});

const upload = multer({ storage: storage });
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
    // Fetch articles with their categories
    const [articles] = await db.query(
      `SELECT a.id, a.title, c.name AS category, a.tags, a.image, a.created_at
      FROM articles a
      JOIN categories c ON a.category_id = c.id`
    );

    // Fetch all categories separately
    const [categories] = await db.query(`SELECT * FROM categories`);

    // Pass both variables to the template
    res.render('articles', { articles, categories });

  } catch (err) {
    console.error(err);
    res.send('Error fetching articles.');
  }
});

// Add New Article
router.post('/articles', isAuthenticated, upload.single('image'), async (req, res) => {
  const { title, content, category_id, tags } = req.body;
  const image = req.file ? req.file.filename : null;

  try {
    await db.query(
      'INSERT INTO articles (title, content, category_id, tags, image) VALUES (?, ?, ?, ?, ?)',
      [title, content, category_id, tags, image]
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
