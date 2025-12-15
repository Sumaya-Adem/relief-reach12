import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Helmet } from 'react-helmet-async';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Badbaado Aid Track | Humanitarian Aid Coordination</title>
        <meta name="description" content="Coordinate humanitarian aid distribution in drought-affected regions. Prevent duplicate deliveries and identify underserved areas." />
      </Helmet>
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main>
          <Dashboard />
        </main>
        <BottomNavigation />
      </div>
    </>
  );
};

export default Index;
