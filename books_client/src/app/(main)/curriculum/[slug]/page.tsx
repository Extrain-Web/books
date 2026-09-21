import type { Metadata } from 'next';
import CurriculumLandingPage from '@/components/curriculum/CurriculumLandingPage';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const pretty = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return {
        title: `Books River — ${pretty}`,
        description: `Browse ${pretty} books on Books River. Find student books, reference books, question papers and more.`,
        alternates: { canonical: `/curriculum/${slug}` },
    };
}

export default async function CurriculumRoutePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    return <CurriculumLandingPage slug={slug} />;
}
