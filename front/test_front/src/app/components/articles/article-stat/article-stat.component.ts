// article-stats.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { ArticleService } from '../../../services/article.service';
import { AuthService } from '../../../services/auth.service';


@Component({
  selector: 'app-article-stats',
  templateUrl: './article-stat.component.html',
  styleUrls: ['./article-stat.component.scss']
})
export class ArticleStatsComponent implements OnInit {
  @Input() article: any;
  isLiked: boolean = false;

  constructor(
    private articleService: ArticleService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (this.authService.isAuthenticated() && this.article.likedBy) {
      this.isLiked = this.article.likedBy.includes(this.authService.getCurrentUserId());
    }
  }

  likeArticle() {
    this.articleService.likeArticle(this.article._id).subscribe({
      next: (response) => {
        this.article.likes = response.data.likes;
        this.isLiked = response.data.isLiked;
      },
      error: (err) => console.error(err)
    });
  }
}