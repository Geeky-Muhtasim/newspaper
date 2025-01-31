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
// router.get('/users', isAuthenticated, isAdmin, async (req, res) => {
//   try {
//     const [users] = await db.query('SELECT id, username, role FROM users');
//     res.render('users', { users });
//   } catch (err) {
//     console.error(err);
//     res.send('Error fetching users.');
//   }
// });

router.get('/users', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, username, role FROM users');
    res.render('users', { users, role: 'admin' }); // Pass role explicitly
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
router.get('/articles', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const [articles] = await db.query(`
      SELECT a.id, a.title, c.name AS category, a.tags, a.image, a.created_at
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
    `);
    const [categories] = await db.query(`SELECT * FROM categories`);

    res.render('articles', { articles, categories, role: 'admin' });
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

// View Categories (Admins Only)
router.get('/categories', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories');
    res.render('categories', { categories, role: 'admin' });
  } catch (err) {
    console.error(err);
    res.send('Error fetching categories.');
  }
});

// Add New Category (Admins Only)
router.post('/categories', isAuthenticated, isAdmin, async (req, res) => {
  const { category_name } = req.body;
  try {
    await db.query('INSERT INTO categories (name) VALUES (?)', [category_name]);
    res.redirect('/admin/articles'); // Redirect back to articles page
  } catch (err) {
    console.error(err);
    res.send('Error adding category.');
  }
});

// Delete Category (Admins Only)
router.post('/categories/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
  const categoryId = req.params.id;
  try {
    await db.query('DELETE FROM categories WHERE id = ?', [categoryId]);
    res.redirect('/admin/categories');
  } catch (err) {
    console.error(err);
    res.send('Error deleting category.');
  }
});


// router.get('/dashboard', isAuthenticated, isAdmin, async (req, res) => {
//   try {
//     // Fetch statistics
//     const [[{ totalUsers }]] = await db.query('SELECT COUNT(id) AS totalUsers FROM users');
//     const [[{ totalArticles }]] = await db.query('SELECT COUNT(id) AS totalArticles FROM articles');
//     const [[{ totalCategories }]] = await db.query('SELECT COUNT(id) AS totalCategories FROM categories');

//     // Fetch recent articles
//     const [articles] = await db.query(`
//       SELECT a.title, c.name AS category, a.tags
//       FROM articles a
//       LEFT JOIN categories c ON a.category_id = c.id
//       ORDER BY a.created_at DESC
//       LIMIT 5
//     `);

//     console.log("Fetched Data:");
//     console.log("Total Users:", totalUsers);
//     console.log("Total Articles:", totalArticles);
//     console.log("Total Categories:", totalCategories);
//     console.log("Recent Articles:", articles);

//     // Pass variables to EJS
//     res.render('dashboard', {
//       role: 'admin',
//       totalUsers: totalUsers || 0,
//       totalArticles: totalArticles || 0,
//       totalCategories: totalCategories || 0,
//       articles: articles || [] // ✅ Ensure `articles` is always defined as an empty array if no articles exist
//     });

//   } catch (err) {
//     console.error("Error Fetching Dashboard Data:", err);
//     res.send('Error loading dashboard.');
//   }
// });




module.exports = router;
