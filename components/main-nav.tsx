'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

export const MainNav: React.FC = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const pathname = usePathname();

  const routes = [
    {
      href: `/`,
      label: 'Overview',
      active: pathname === `/`,
    },
    {
      href: `/categories`,
      label: 'Categories',
      active: pathname === `/categories`,
    },
    {
      href: `/pizzas`,
      label: 'Pizzas',
      active: pathname === `/pizzas`,
    },
    {
      href: `/products`,
      label: 'Products',
      active: pathname === `/products`,
    },
    {
      href: `/ingridients`,
      label: 'Ingridients',
      active: pathname === `/ingridients`,
    },
    {
      href: `/orders`,
      label: 'Orders',
      active: pathname === `/orders`,
    },
    {
      href: `/settings`,
      label: 'Settings',
      active: pathname === `/settings`,
    },
  ];

  return (
    <nav className={cn('flex items-center space-x-4 lg:space-x-6', className)}>
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            route.active
              ? 'text-black dark:text-white font-bold'
              : 'text-muted-foreground'
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  );
};
