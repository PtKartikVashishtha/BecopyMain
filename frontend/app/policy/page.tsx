import { Metadata } from 'next';
import PolicyPage from '@/components/pages//PolicyPage';

export const metadata: Metadata = {
  title: 'Policy - BeCopy | Privacy, Terms & Legal Information',
  description: 'Read our privacy policy, terms of service, community guidelines, and other legal information for the BeCopy platform.',
  keywords: 'BeCopy policy, privacy policy, terms of service, community guidelines, DMCA, copyright',
  openGraph: {
    title: 'Policy - BeCopy',
    description: 'Privacy policy, terms of service, and legal information for BeCopy',
    type: 'website',
  },
};

export default function Policy() {
  return <PolicyPage />;
}