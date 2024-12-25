import { Navbar } from '@/components/navbar';
import { hash } from 'bcrypt';

interface DashboardType {
  children: React.ReactNode;
}

export default async function Dashboard({ children }: DashboardType) {
  const hashedPassword = await hash('123411', 10);
  console.log('Хэшированный пароль:', hashedPassword);
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
