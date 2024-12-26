import { Navbar } from '@/components/navbar';

interface DashboardType {
  children: React.ReactNode;
}

export default async function Dashboard({ children }: DashboardType) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
