const Comment = require('../models/comment');
const Article = require('../models/article');
const { notifyAuthor } = require('../services/notificationService');

// Helper function to populate comment data
const populateCommentData = (comment) => {
  return comment
    .populate('author', 'username avatar')
    .populate({
      path: 'replies',
      populate: {
        path: 'author',
        select: 'username avatar'
      }
    })
    .populate('parentComment')
    .execPopulate();
};

exports.getCommentsForArticle = async (req, res) => {
  try {
    const comments = await Comment.find({ article: req.params.articleId })
      .populate('author', 'username avatar')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'username avatar'
        }
      })
      .sort({ createdAt: -1 });

    // Organize comments with nested replies
    const organizedComments = comments.filter(comment => !comment.parentComment);
    
    res.status(200).json(organizedComments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createComment = async (req, res) => {
  try {
    console.log('Début création commentaire', req.body);
    
    const { content, articleId, parentCommentId } = req.body;
    const article = await Article.findById(articleId);
    
    if (!article) {
      console.log('Article non trouvé');
      return res.status(404).json({ error: 'Article not found' });
    }

    const comment = new Comment({
      content,
      article: articleId,
      author: req.user.id,
      parentComment: parentCommentId || null
    });

    const savedComment = await comment.save();
    console.log('Commentaire sauvegardé:', savedComment._id);

    // Populate peut échouer si les références sont invalides
    const populatedComment = await Comment.populate(savedComment, [
      { path: 'author', select: 'username avatar' },
      { path: 'parentComment' }
    ]);

    console.log('Commentaire peuplé avec succès');

    res.status(201).json(populatedComment);

    try {
      if (parentCommentId) {
        await Comment.findByIdAndUpdate(parentCommentId, { $push: { replies: savedComment._id } });
      }
      
      await Article.findByIdAndUpdate(articleId, { $inc: { commentCount: 1 } });

      if (article.author.toString() !== req.user.id) {
        await notifyAuthor(article.author, populatedComment);
      }
    } catch (secondaryError) {
      console.error('Erreur secondaire:', secondaryError);
    }

  } catch (error) {
    console.error('Erreur critique:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { content } = req.body;
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Authorization check
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    comment.content = content || comment.content;
    comment.updatedAt = Date.now();
    await comment.save();

    const populatedComment = await populateCommentData(comment);
    res.status(200).json(populatedComment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Authorization check
    const article = await Article.findById(comment.article);
    const isAuthorized = 
      comment.author.toString() === req.user.id || 
      (article && article.author.toString() === req.user.id);

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Handle nested replies
    if (comment.replies.length > 0) {
      await Comment.deleteMany({ _id: { $in: comment.replies } });
    }

    // Remove from parent comment if this is a reply
    if (comment.parentComment) {
      await Comment.findByIdAndUpdate(
        comment.parentComment,
        { $pull: { replies: comment._id } }
      );
    }

    // Update comment count
    await Article.findByIdAndUpdate(
      comment.article,
      { $inc: { commentCount: -1 } }
    );

   await comment.remove();
    res.status(200).json({ message: 'Comment deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};