const express = require('express');
const { isAuthenticated } = require('../middleware/auth');
const router = express.Router();
const db = require('../db');

// Editor dashboard
router.get('/dashboard', isAuthenticated, (req, res) => {
  res.render('dashboard', { role: 'editor' });
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
