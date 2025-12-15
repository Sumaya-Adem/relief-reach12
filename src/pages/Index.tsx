import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { Helmet } from 'react-helmet-async';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Badbaado Aid Track | Humanitarian Aid Coordination</title>
        <meta name="description" content="Coordinate humanitarian aid distribution in drought-affected regions. Prevent duplicate deliveries and identify underserved areas." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <Dashboard />
        </main>
      </div>
    </>
  );
};

export default Index;
