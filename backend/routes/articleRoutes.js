const express = require('express');
const router = express.Router();
const {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  uploadImage,
  getImage
} = require('../controllers/articleController'); // Vérifiez ce chemin
const { protect } = require('../middlewares/authMiddleware');
const { checkArticlePermissions } = require('../middlewares/articlePermissions');
const upload = require('../middlewares/imageUpload');

// Routes de base
router.route('/')
  .get(getArticles)
  .post(protect, createArticle);

router.route('/:id')
  .get(getArticle)
  .put(protect, checkArticlePermissions('update'), updateArticle)
  .delete(protect, checkArticlePermissions('delete'), deleteArticle);

router.route('/:id/image')
  .post(
    protect,
    checkArticlePermissions('update'),
    upload.single('image'),
    uploadImage
  );
router.route('/images/:id')
  .get(getImage);

module.exports = router;