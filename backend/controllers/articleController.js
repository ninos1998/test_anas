const Article = require("../models/article");
const { GridFSBucket } = require("mongodb");
const mongoose = require("mongoose");
const upload = require("../middlewares/imageUpload");

let gfs;
mongoose.connection.once("open", () => {
  gfs = new GridFSBucket(mongoose.connection.db, {
    bucketName: "uploads",
  });
});
// @desc    Get all articles
exports.getArticles = async (req, res) => {
  try {
    const articles = await Article.find().populate("author", "username");
    res.status(200).json({ success: true, data: articles });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get single article
exports.getArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).populate(
      "author",
      "username"
    );
    if (!article) {
      return res
        .status(404)
        .json({ success: false, message: "Article not found" });
    }
    res.status(200).json({ success: true, data: article });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Create article

exports.createArticle = async (req, res) => {
  try {
    upload.single("image")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      const { title, content, tags } = req.body;
      const tagsArray =
        typeof tags === "string"
          ? tags.split(",").map((tag) => tag.trim())
          : Array.isArray(tags)
          ? tags
          : [];

      const articleData = {
        title,
        content,
        tags: tagsArray,
        author: req.user.id,
        image: req.file ? req.file.id : null,
      };

      const article = await Article.create(articleData);

      // Mise à jour des métadonnées GridFS (méthode correcte)
      if (req.file) {
        const db = mongoose.connection.db;
        const collection = db.collection("uploads.files");

        await collection.updateOne(
          { _id: req.file.id },
          { $set: { "metadata.articleId": article._id } }
        );
      }

      res.status(201).json({
        success: true,
        data: article,
      });
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};
// @desc    Update article
exports.updateArticle = async (req, res) => {
  try {
    let article = await Article.findById(req.params.id);

    if (!article) {
      return res
        .status(404)
        .json({ success: false, message: "Article not found" });
    }

    // Check ownership
    if (
      article.author.toString() !== req.user.id &&
      req.user.role !== "admin" &&
      req.user.role !== "editor"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this article",
      });
    }

    article = await Article.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: article });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Delete article
exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res
        .status(404)
        .json({ success: false, message: "Article not found" });
    }

    // Check ownership - seul l'admin peut supprimer
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this article",
      });
    }

    await article.remove();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Upload image for article
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    if (!req.file.id) {
      console.error("Uploaded file details:", req.file);
      throw new Error("File storage failed - no ID generated");
    }

    // Verify the file exists in GridFS
    const fileExists = await mongoose.connection.db
      .collection("uploads.files")
      .findOne({ _id: req.file.id });

    if (!fileExists) {
      throw new Error("File not found in GridFS after upload");
    }

    // Update article
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { image: req.file.id },
      { new: true, runValidators: true }
    );

    if (!article) {
      // Clean up orphaned file if article update fails
      await gfs.delete(req.file.id);
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        fileId: req.file.id,
        filename: req.file.filename,
        article,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);

    // Clean up if error occurred after file upload
    if (req.file?.id) {
      try {
        await gfs.delete(req.file.id);
      } catch (cleanupError) {
        console.error("Error cleaning up file:", cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: error.message || "File upload failed",
    });
  }
};

// @desc    Get image
exports.getImage = async (req, res) => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.id);
    const files = await gfs.find({ _id: fileId }).toArray();

    if (!files || files.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    }

    const contentType = files[0].contentType || "image/jpeg";
    const downloadStream = gfs.openDownloadStream(fileId);

    const chunks = [];

    downloadStream.on("data", (chunk) => {
      chunks.push(chunk);
    });

    downloadStream.on("end", () => {
      const buffer = Buffer.concat(chunks);
      const base64 = buffer.toString("base64");

      // Envoie en JSON ou en texte brut
      res.json({
        contentType,
        data: base64,
      });
    });

    downloadStream.on("error", (err) => {
      res.status(500).json({ success: false, message: err.message });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Middleware de vérification des permissions
exports.checkArticlePermissions = (action) => {
  return async (req, res, next) => {
    try {
      const article = await Article.findById(req.params.id);

      if (!article) {
        return res
          .status(404)
          .json({ success: false, message: "Article not found" });
      }

      // Admin a tous les droits
      if (req.user.role === "admin") return next();

      // Vérification des permissions
      switch (action) {
        case "update":
          if (
            req.user.role === "editor" ||
            (req.user.role === "writer" && article.author.equals(req.user._id))
          ) {
            return next();
          }
          break;
        case "delete":
          if (req.user.role === "admin") return next();
          break;
        default:
          return next();
      }

      res.status(403).json({
        success: false,
        message: `Not authorized to ${action} this article`,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };
};

// @desc    Like an article
exports.likeArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res
        .status(404)
        .json({ success: false, message: "Article not found" });
    }

    // Check if user already liked the article
    const alreadyLiked = article.likedBy.includes(req.user.id);

    if (alreadyLiked) {
      // Unlike the article
      article.likes -= 1;
      article.likedBy.pull(req.user.id);
    } else {
      // Like the article
      article.likes += 1;
      article.likedBy.push(req.user.id);
    }

    await article.save();

    // Update daily stats
    await updateDailyStats(article._id, "likes", alreadyLiked ? -1 : 1);

    res.status(200).json({
      success: true,
      data: {
        likes: article.likes,
        isLiked: !alreadyLiked,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Track article view
exports.trackView = async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!article) {
      return res
        .status(404)
        .json({ success: false, message: "Article not found" });
    }

    // Update daily stats
    await updateDailyStats(article._id, "views", 1);

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Helper function to update daily stats
async function updateDailyStats(articleId, field, value) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await Article.updateOne(
    { _id: articleId, "dailyStats.date": today },
    { $inc: { [`dailyStats.$.${field}`]: value } }
  );

  await Article.updateOne(
    { _id: articleId, "dailyStats.date": { $ne: today } },
    {
      $push: {
        dailyStats: {
          date: today,
          views: field === "views" ? value : 0,
          likes: field === "likes" ? value : 0,
        },
      },
    }
  );
}
// @desc    Get top articles
exports.getTopArticles = async (req, res) => {
  try {
    const { limit = 5, timeRange = "all" } = req.query;
    let dateFilter = {};

    if (timeRange === "week") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      dateFilter = { createdAt: { $gte: oneWeekAgo } };
    } else if (timeRange === "month") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      dateFilter = { createdAt: { $gte: oneMonthAgo } };
    }

    const articles = await Article.find(dateFilter)
      .sort({ likes: -1, views: -1 })
      .limit(parseInt(limit))
      .populate("author", "username");

    res.status(200).json({ success: true, data: articles });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get trends data
exports.getTrends = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const date = new Date();
    date.setDate(date.getDate() - parseInt(days));

    const trends = await Article.aggregate([
      { $unwind: "$dailyStats" },
      { $match: { "dailyStats.date": { $gte: date } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$dailyStats.date" },
          },
          totalViews: { $sum: "$dailyStats.views" },
          totalLikes: { $sum: "$dailyStats.likes" },
          articleCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({ success: true, data: trends });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
