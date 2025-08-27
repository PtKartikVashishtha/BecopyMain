import { Metadata } from 'next';
import FAQPage from '@/components/pages/FAQPage';

export const metadata: Metadata = {
  title: 'FAQ - BeCopy | Frequently Asked Questions',
  description: 'Find answers to common questions about BeCopy - the free platform for sharing and discovering code snippets across multiple programming languages.',
  keywords: 'BeCopy FAQ, programming help, code sharing questions, developer support',
  openGraph: {
    title: 'FAQ - BeCopy',
    description: 'Find answers to common questions about BeCopy platform',
    type: 'website',
  },
};

export default function FAQ() {
  return <FAQPage />;
}