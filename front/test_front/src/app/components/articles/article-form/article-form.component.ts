// article-form.component.ts
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
  existingImageId: string | null = null;

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
        this.loadArticle(params['id']);
      }
    });
  }

  loadArticle(id: string): void {
    this.isLoading = true;
    this.articleService.getArticle(id).subscribe({
      next: (article) => {
        this.patchFormValues(article);
        this.isLoading = false;
      },
      error: (err) => {
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
    this.existingImageId = article.image;
  }
}

  onTagsBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    const tagsArray = input.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    this.articleForm.patchValue({ tags: tagsArray });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.existingImageId = null; // Clear existing image ID when new file is selected
      
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
    this.existingImageId = null;
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
  }

  // The author will be added by the article service
  if (this.isEditMode) {
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
          this.router.navigate(['/articles', article._id]);
        }, 1500);
      },
      error: (err) => {
        this.handleError(err);
      }
    });
  }

  updateArticle(formData: FormData): void {
    const articleId = this.route.snapshot.params['id'];
    if (!articleId) return;

    this.articleService.updateArticle(articleId, formData).subscribe({
      next: (article) => {
        this.successMessage = 'Article updated successfully!';
        setTimeout(() => {
          this.router.navigate(['/articles', article._id]);
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
  contentValue: string = '';

onContentChange(event: Event) {
  const element = event.target as HTMLElement;
  this.articleForm.get('content').setValue(element.innerHTML);
  // Ou si vous utilisez Reactive Forms:
  // this.form.patchValue({ content: element.innerHTML });
}

  get title() { return this.articleForm.get('title'); }
  get content() { return this.articleForm.get('content'); }
  get tags() { return this.articleForm.get('tags'); }
  htmlContent = '';
editorConfig = {
  editable: true,
  spellcheck: true,
  height: 'auto',
  minHeight: '0',
  maxHeight: 'auto',
  width: 'auto',
  minWidth: '0',
  translate: 'yes',
  enableToolbar: true,
  showToolbar: true,
  placeholder: 'Enter text here...',
  defaultParagraphSeparator: '',
  defaultFontName: '',
  defaultFontSize: '',
  fonts: [
    {class: 'arial', name: 'Arial'},
    {class: 'times-new-roman', name: 'Times New Roman'},
    {class: 'calibri', name: 'Calibri'},
    {class: 'comic-sans-ms', name: 'Comic Sans MS'}
  ],
  uploadUrl: 'v1/image',
  uploadWithCredentials: false,
  sanitize: true,
  toolbarPosition: 'top',
  toolbarHiddenButtons: [
    ['bold', 'italic'],
    ['fontSize']
  ]
};
}