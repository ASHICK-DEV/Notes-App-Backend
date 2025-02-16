const express = require("express");
const db = require("../db");
const router = express.Router();
const dotenv = require("dotenv");
const path = require("path");
const jwt = require("jsonwebtoken");

dotenv.config({ path: path.join(__dirname, "../config/config.env") });

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware for authentication
const authenticate = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Get all notes
router.get("/", authenticate, (req, res) => {
  db.all(
    "SELECT * FROM notes WHERE user_id = ?",
    [req.user.id],
    (err, notes) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(notes);
    }
  );
});

// Create a note
router.post("/", authenticate, (req, res) => {
  const { title, content, category } = req.body;
  db.run(
    "INSERT INTO notes (title, content, category, user_id) VALUES (?, ?, ?, ?)",
    [title, content, category, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        message: "Note created successfully!",
        id: this.lastID,
        title,
        content,
        category,
      });
    }
  );
});

// Update a note
router.put("/:id", authenticate, (req, res) => {
  const { title, content, category } = req.body;
  db.run(
    "UPDATE notes SET title = ?, content = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
    [title, content, category, req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        message: "Note updated successfully!",
        id: this.lastID,
        title,
        content,
        category,
      });
    }
  );
});

// Delete a note
router.delete("/:id", authenticate, (req, res) => {
  db.run(
    "DELETE FROM notes WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Note deleted successfully!" });
    }
  );
});

module.exports = router;
