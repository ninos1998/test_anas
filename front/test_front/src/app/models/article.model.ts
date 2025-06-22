// article.model.ts
export interface Article {
  _id?: string;
  title: string;
  content: string;
  author: string | { _id: string, name: string }; 
  tags: string[];
  image?: string; 
  views?: number;
  likes?: number;
  likedBy?: string[];
  dailyStats?: Array<{
    date: Date;
    views: number;
    likes: number;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

