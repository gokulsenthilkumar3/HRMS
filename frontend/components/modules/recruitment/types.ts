export interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'FULL_TIME' | 'CONTRACT' | 'INTERN' | 'PART_TIME';
  salaryMin?: number;
  salaryMax?: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  status: 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';
  source?: string;
  appliedAt: string;
  hiredAt?: string;
  candidate?: { id: string; name: string; email: string; phone?: string };
  job?: { title: string; department: string };
}
