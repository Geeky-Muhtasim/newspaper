const express = require('express');
const { isAuthenticated } = require('../middleware/auth');
const router = express.Router();
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
// Editor dashboard
router.get('/dashboard', isAuthenticated, (req, res) => {
  res.render('dashboard', { role: 'editor' });
});

// View All Articles
// router.get('/articles', isAuthenticated, async (req, res) => {
//   try {
//     // Fetch articles with their categories
//     const [articles] = await db.query(
//       `SELECT a.id, a.title, c.name AS category, a.tags, a.image, a.created_at
//       FROM articles a
//       JOIN categories c ON a.category_id = c.id`
//     );

//     // Fetch all categories separately
//     const [categories] = await db.query(`SELECT * FROM categories`);

//     // Pass both variables to the template
//     res.render('articles', { articles, categories });

//   } catch (err) {
//     console.error(err);
//     res.send('Error fetching articles.');
//   }
// });
router.get('/articles', isAuthenticated, async (req, res) => {
  try {
    const [articles] = await db.query(`
      SELECT a.id, a.title, c.name AS category, a.tags, a.image, a.created_at
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
    `);
    const [categories] = await db.query(`SELECT * FROM categories`);

    res.render('articles', { articles, categories, role: 'editor' });
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
    res.redirect('/editor/articles');
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
    res.redirect('/editor/articles');
  } catch (err) {
    console.error(err);
    res.send('Error deleting article.');
  }
});

module.exports = router;