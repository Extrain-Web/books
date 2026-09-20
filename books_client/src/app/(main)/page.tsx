import { Suspense } from 'react';
import type { Metadata } from 'next';
import NewHomePage from '@/components/home/NewHomePage';

export const metadata: Metadata = {
  title: "Books River — The Reading Journey",
  description: "Books River is your trusted online bookstore in Bangladesh — comics, manga, children's books, curriculum & essential books, stationery and more, delivered nationwide.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <NewHomePage />
    </Suspense>
  );
}
