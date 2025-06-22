import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticleService } from '../../../services/article.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-article-form',
  templateUrl: './article-form.component.html',
  styleUrls: ['./article-form.component.scss']
})
export class ArticleFormComponent implements OnInit {
  articleForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  imagePreview: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  existingImageUrl: string | null = null;
  articleId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private articleService: ArticleService,
    private authService: AuthService
  ) {
    this.articleForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      content: ['', [Validators.required, Validators.minLength(50)]],
      tags: [''],
      image: [null]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.articleId = params['id'];
        this.loadArticle(this.articleId);
      }
    });
  }

loadArticle(id: string): void {
  this.isLoading = true;
  this.articleService.getArticle(id).subscribe({
    next: (article) => {
      console.log('Article loaded:', article); 
      this.patchFormValues(article.data);
      this.isLoading = false;
    },
    error: (err) => {
      console.error('Error loading article:', err); 
      this.errorMessage = err.error?.message || 'Failed to load article';
      this.isLoading = false;
    }
  });
}

  patchFormValues(article: any): void {
    this.articleForm.patchValue({
      title: article.title,
      content: article.content,
      tags: article.tags?.join(', ') || ''
    });

    if (article.image) {
      this.existingImageUrl = article.imageUrl || `/api/images/${article.image}`;
    }
  }

  onTagsBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    const tagsArray = input.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    this.articleForm.patchValue({ tags: tagsArray.join(', ') });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.existingImageUrl = null; // Clear existing image when new file is selected
      
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.existingImageUrl = null;
    this.articleForm.patchValue({ image: null });
  }

  onSubmit(): void {
    if (this.articleForm.invalid) {
      this.markFormGroupTouched(this.articleForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const formData = new FormData();
    formData.append('title', this.articleForm.value.title);
    formData.append('content', this.articleForm.value.content);
    
    // Process tags
    const tagsValue = this.articleForm.value.tags;
    const tagsArray = (typeof tagsValue === 'string' ? 
                      tagsValue.split(',') : 
                      Array.isArray(tagsValue) ? tagsValue : [])
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag);
      
    tagsArray.forEach(tag => formData.append('tags[]', tag));

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    } else if (this.existingImageUrl === null && this.isEditMode) {
      // If in edit mode and image was removed
      formData.append('removeImage', 'true');
    }

    if (this.isEditMode && this.articleId) {
      this.updateArticle(formData);
    } else {
      this.createArticle(formData);
    }
  }

  createArticle(formData: FormData): void {
    this.articleService.createArticle(formData).subscribe({
      next: (article) => {
        this.successMessage = 'Article created successfully!';
        setTimeout(() => {
          this.router.navigate(['/home/get/articles']);
        }, 1500);
      },
      error: (err) => {
        this.handleError(err);
      }
    });
  }

  updateArticle(formData: FormData): void {
    if (!this.articleId) return;

    this.articleService.updateArticle(this.articleId, formData).subscribe({
      next: (article) => {
        this.successMessage = 'Article updated successfully!';
        setTimeout(() => {
          this.router.navigate(['/home/get/articles']);
        }, 1500);
      },
      error: (err) => {
        this.handleError(err);
      }
    });
  }



  handleError(err: any): void {
    console.error('Error:', err);
    this.errorMessage = err.error?.message || 'An error occurred';
    this.isLoading = false;
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  get title() { return this.articleForm.get('title'); }
  get content() { return this.articleForm.get('content'); }
  get tags() { return this.articleForm.get('tags'); }
}