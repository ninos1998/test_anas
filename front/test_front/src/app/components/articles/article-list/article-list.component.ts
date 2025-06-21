import { Component, OnInit } from '@angular/core';
import { Article } from '../../../models/article.model';
import { ArticleService } from '../../../services/article.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-article-list',
  templateUrl: './article-list.component.html',
  styleUrls: ['./article-list.component.scss']
})
export class ArticleListComponent implements OnInit {
  articles: Article[] = [];
  isLoading = true;
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  constructor(    private router: Router,
private articleService: ArticleService) {}

  ngOnInit(): void {
    this.loadArticles();
  }

  loadArticles(): void {
    this.isLoading = true;
    this.articleService.getArticles(this.currentPage, this.itemsPerPage).subscribe({
      next: (response) => {
        this.articles = response.data;
        this.totalItems = response.pagination.total;
        this.isLoading = false;
            console.log(this.articles)

      },
      error: (err) => {
        console.error('Failed to load articles:', err);
        this.isLoading = false;
      }
    });
    console.log(this.articles)
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
  // Implémentez votre logique pour déterminer si l'utilisateur peut éditer l'article
  // Par exemple, vérifier si c'est l'auteur ou un admin
  return true; // À adapter
}

editArticle(article: any) {
  this.router.navigate(['/create-article'], { 
    state: { articleToEdit: article } 
  });

}

deleteArticle(articleId: string) {
  // Implémentez la logique de suppression
  if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
    this.articleService.deleteArticle(articleId).subscribe(() => {
      // Recharger les articles ou filtrer la liste actuelle
      this.loadArticles();
    });
  }
}
 navigateToArticle(articleId: string): void {
    this.router.navigate(['/home/get/articles', articleId]);
  }
}