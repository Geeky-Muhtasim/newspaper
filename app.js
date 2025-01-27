const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
  })
);

// Set view engine
app.set('view engine', 'ejs');

// Routes
const adminRoutes = require('./routes/admin');
const editorRoutes = require('./routes/editor');
const publicRoutes = require('./routes/public');

app.use('/admin', adminRoutes);
app.use('/editor', editorRoutes);
app.use('/', publicRoutes);

// Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
