import { Component, OnInit, OnDestroy } from '@angular/core';
import { Article } from '../../../models/article.model';
import { ArticleService } from '../../../services/article.service';
import { CommentService } from '../../../services/comment.service';
import { WebsocketService } from '../../../services/websocket.service';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-article-list',
  templateUrl: './article-list.component.html',
  styleUrls: ['./article-list.component.scss']
})
export class ArticleListComponent implements OnInit, OnDestroy {
  articles: Article[] = [];
  isLoading = true;
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  errorMessage = '';
  showComments: { [articleId: string]: boolean } = {};
  articleComments: { [articleId: string]: any[] } = {};
  newCommentText: { [articleId: string]: string } = {};
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private articleService: ArticleService,
    private commentService: CommentService,
    private websocketService: WebsocketService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadArticles();
    this.setupWebSocketListeners();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  setupWebSocketListeners(): void {
    // Écoute des nouveaux commentaires
    const newCommentSub = this.websocketService.newComment$.subscribe(comment => {
      if (this.articleComments[comment.article]) {
        this.articleComments[comment.article].unshift(comment);
      }
    });

    // Écoute des notifications de commentaires
    const notificationSub = this.websocketService.commentNotification$.subscribe(notification => {
      console.log('Nouveau commentaire sur votre article:', notification);
      // Vous pourriez ajouter une notification toast ici
    });

    this.subscriptions.push(newCommentSub, notificationSub);
  }

  loadArticles(): void {
    this.isLoading = true;
    this.articleService.getArticles(this.currentPage, this.itemsPerPage).subscribe({
      next: (response) => {
        if (response.success) {
          this.articles = response.data;
          // this.totalItems = response.totalItems || 0;
        } else {
          this.errorMessage = 'Erreur inconnue du serveur';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load articles:', err);
        this.isLoading = false;
      }
    });
  }

  toggleComments(articleId: string): void {
    this.showComments[articleId] = !this.showComments[articleId];
    if (this.showComments[articleId] && !this.articleComments[articleId]) {
      this.loadComments(articleId);
    }
  }

  loadComments(articleId: string): void {
    this.commentService.getCommentsForArticle(articleId).subscribe({
      next: (comments) => {
        this.articleComments[articleId] = comments;
      },
      error: (err) => {
        console.error('Failed to load comments:', err);
      }
    });
  }

postComment(articleId: string): void {
  const content = this.newCommentText[articleId];
  if (!content || !content.trim()) return;

  const commentData = {
    content: content,
    articleId: articleId,
    userId: this.authService.currentUserValue?.id
  };

  // Envoyer uniquement via l'API HTTP
  this.commentService.createComment(content, articleId).subscribe({
    next: (newComment) => {
      // Mettre à jour localement la liste des commentaires
      if (!this.articleComments[articleId]) {
        this.articleComments[articleId] = [];
      }
      this.articleComments[articleId].unshift(newComment);
      this.newCommentText[articleId] = '';
    },
    error: (err) => {
      console.error('Failed to post comment:', err);
    }
  });
}

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadArticles();
  }

  getPageNumbers(): number[] {
    const pageCount = Math.ceil(this.totalItems / this.itemsPerPage);
    return Array.from({length: pageCount}, (_, i) => i + 1);
  }

  canEditArticle(article: any): boolean {
    // Implémentez votre logique d'autorisation
    return true;
  }

  editArticle(articleId: string) {
    this.router.navigate(['home/edit/article', articleId]);
  }

  deleteArticle(articleId: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      this.articleService.deleteArticle(articleId).subscribe({
        next: () => {
          this.loadArticles();
        },
        error: (err) => {
          console.error('Failed to delete article:', err);
          this.errorMessage = err.error.message || 'Échec de la suppression de l\'article';
        }
      });
    }
  }

  navigateToArticle(articleId: string): void {
    this.router.navigate(['/home/get/articles', articleId]);
  }
}