import { Metadata } from 'next';
import PublicJobDetail from './PublicJobDetail';

type Props = { params: { jobId: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Apply — HRMS Careers`, description: `Apply for this role at HRMS Corp` };
}

export default function CareersJobPage({ params }: Props) {
  return <PublicJobDetail jobId={params.jobId} />;
}
