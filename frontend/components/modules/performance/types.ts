export interface PerformanceReview {
  id: string;
  userId: string;
  reviewerId: string;
  period: string;
  rating: number; // 1-5
  strengths?: string;
  improvements?: string;
  goals?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'ACKNOWLEDGED';
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate: string;
  progress: number; // 0-100
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}
