// article.model.ts
export interface Article {
  _id?: string;
  title: string;
  content: string;
  author: string | { _id: string, name: string }; 
  tags: string[];
  image?: string; 
  createdAt?: Date;
  updatedAt?: Date;
}