import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArticleStatComponent } from './article-stat.component';

describe('ArticleStatComponent', () => {
  let component: ArticleStatComponent;
  let fixture: ComponentFixture<ArticleStatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArticleStatComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ArticleStatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
