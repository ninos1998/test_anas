import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ArticleService } from '../../../services/article.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-article-view',
  standalone: true,
  imports: [],
  templateUrl: './article-view.component.html',
  styleUrl: './article-view.component.scss'
})
export class ArticleViewComponent  implements OnInit, OnDestroy {
 article: any;
  imageData: string | null = null;
  imageError: boolean | null = null;
  
  private imageSub: Subscription | null = null;

  constructor(
        private route: ActivatedRoute,
    private articleService: ArticleService) {}
  imageSrc: string = '';

ngOnInit(): void {
  const articleId = this.route.snapshot.paramMap.get('id');
  if (articleId) {
    this.getArticle(articleId);
  }
}

getArticle(id: string | null): void {
  if (!id) return;

this.articleService.getArticle(id).subscribe(response => {
  this.article = response.data;
  console.log('articcccccccccccccle:', this.article);

  if (this.article.image) {
    console.log('ImageID:', this.article.image); // ✅ Maintenant ça fonctionne
    this.articleService.getImage(this.article.image).subscribe({
      next: (imageUrl: string) => {
        this.imageSrc = imageUrl;
        console.log('Image chargée:', imageUrl);
      },
      error: (err) => {
        console.error('Erreur lors du chargement de l’image :', err);
        this.handleImageError();
      }
    });
  }
});

}


  ngOnDestroy(): void {
    if (this.imageSub) {
      this.imageSub.unsubscribe();
    }
  }
handleImageError(): void {
  this.imageError = true;
  this.imageData = null;
}

}