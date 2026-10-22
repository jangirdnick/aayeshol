import type { Metadata } from 'next';
import { IntegrationsView } from '@/modular/integrations';

export const metadata: Metadata = {
  title: 'Social Integrations | Aayeshol',
  description: 'Manage connected social media platforms for automated scheduling and publishing.',
};

export default function IntegrationsPage() {
  return <IntegrationsView />;
}
