import type { Metadata } from 'next';
import { LuInfo } from 'react-icons/lu';
import LegalPageLayout from '@/components/shared/LegalPageLayout';

export const metadata: Metadata = {
    title: "About Us",
    description: "Learn more about Bichitra Point, our mission, authentic wholesale and retail products, and our services across Bangladesh.",
    alternates: { canonical: "/about" },
};

export default function AboutPage() {
    return (
        <LegalPageLayout
            slug="about"
            fallbackTitle="About Us"
            icon={<LuInfo size={24} />}
            accentColor="#10b981"
            ctaTitle="Want to know more about Bichitra Point?"
            ctaDescription="Feel free to reach out to our support and wholesale sales team."
            ctaButtonText="Contact Us"
        />
    );
}
