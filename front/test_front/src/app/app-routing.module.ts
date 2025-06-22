import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { AuthGuard } from './guards/auth.guard';
import { RegisterComponent } from './components/register/register.component';
import { ArticleListComponent } from './components/articles/article-list/article-list.component';
import { ArticleViewComponent } from './components/articles/article-view/article-view.component';
import { ArticleFormComponent } from './components/articles/article-form/article-form.component';
import { LayoutComponent } from './components/layout/layout.component';
import { ListUserComponent } from './components/users/list-user/list-user.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent, canActivate: [AuthGuard] },
    { 
    path: 'home', 
    component: LayoutComponent,  
    canActivate: [AuthGuard],
    children: [
      { path: '', component: DashboardComponent },  
      // { path: 'dashboard', component: DashboardComponent},  
      { path: 'get/users', component: ListUserComponent},  
      { path: 'get/articles', component: ArticleListComponent },  
      { path: 'create/articles', component: ArticleFormComponent }, 
      { path: 'edit/article/:id', component: ArticleFormComponent,data: { title: 'Edit Article' } 
  },
      { path: 'get/articles/:id', component: ArticleViewComponent }  
    ]
  },
  
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }