const Article = require('../models/article');


exports.checkArticlePermissions = (action) => {
  return async (req, res, next) => {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Admin a tous les droits
    if (req.user.role === 'admin') return next();

    // Vérification des permissions
    switch(action) {
      case 'update':
        if (req.user.role === 'editor' || 
            (req.user.role === 'writer' && article.author.equals(req.user._id))) {
          return next();
        }
        break;
      case 'delete':
        if (req.user.role === 'admin') return next();
        break;
    }

    res.status(403).json({ 
      success: false, 
      message: `Not authorized to ${action} this article` 
    });
  };
};