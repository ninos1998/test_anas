import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SocketService } from '../../../services/socket.service';
import { Comment } from '../../../models/comment.model';
import { CommentService } from '../../../services/comment.service';

@Component({
  selector: 'app-article-comments',
  templateUrl: './article-comments.component.html',
  styleUrls: ['./article-comments.component.scss']
})
export class ArticleCommentsComponent implements OnInit, OnDestroy {
  @Input() articleId: string;
  @Input() authorId: string;
  comments: Comment[] = [];
  newCommentContent = '';
  replyingTo: string | null = null;
  replyContent = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private socketService: SocketService,
    private commentService: CommentService
  ) {}

  ngOnInit() {
    // Charger les commentaires existants
    this.loadComments();

    // Configurer les listeners Socket.io
    this.socketService.joinArticleRoom(this.articleId);

    const newCommentSub = this.socketService.onNewComment().subscribe(comment => {
      if (comment.parentComment) {
        const parent = this.comments.find(c => c._id === comment.parentComment);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(comment);
        }
      } else {
        // C'est un nouveau commentaire principal
        this.comments.unshift(comment);
      }
    });

    const errorSub = this.socketService.onCommentError().subscribe(error => {
      console.error('Error:', error);
      // Afficher l'erreur à l'utilisateur
    });

    const notificationSub = this.socketService.onNotification().subscribe(notification => {
      console.log('Notification:', notification.message);
      // Afficher la notification à l'utilisateur
    });

    this.subscriptions.push(newCommentSub, errorSub, notificationSub);
  }

  loadComments() {
    this.commentService.getCommentsForArticle(this.articleId).subscribe({
      next: (comments) => {
        this.comments = comments;
      },
      error: (err) => console.error('Failed to load comments', err)
    });
  }

  addComment() {
    if (!this.newCommentContent.trim()) return;

    const commentData = {
      articleId: this.articleId,
      content: this.newCommentContent,
      parentCommentId: this.replyingTo || undefined
    };

    if (this.replyingTo) {
      this.socketService.sendReply({
        ...commentData,
        parentCommentId: this.replyingTo
      });
      this.cancelReply();
    } else {
      this.socketService.sendComment(commentData);
    }

    this.newCommentContent = '';
  }

  startReply(commentId: string) {
    this.replyingTo = commentId;
  }

  cancelReply() {
    this.replyingTo = null;
    this.replyContent = '';
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.socketService.disconnect();
  }
}