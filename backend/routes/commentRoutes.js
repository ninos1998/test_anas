const express = require('express');
const router = express.Router();
const {
  getCommentsForArticle,
  createComment,
  updateComment,
  deleteComment
} = require('../controllers/commentController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/article/:articleId')
  .get(getCommentsForArticle);

router.route('/')
  .post(protect, createComment);

router.route('/:id')
  .put(protect, updateComment)
  .delete(protect, deleteComment);

module.exports = router;
