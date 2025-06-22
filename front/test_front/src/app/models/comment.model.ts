export interface Comment {
  _id: string;
  content: string;
  article: string;
  author: {
    _id: string;
    username: string;
    avatar: string;
  };
  parentComment?: string;
  replies?: Comment[];
  createdAt: Date;
  updatedAt: Date;
}