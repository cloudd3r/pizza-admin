import React from 'react';

import { MainNav } from './main-nav';
import { ProfileButton } from './profile-button';

export const Navbar: React.FC = () => {
  return (
    <header className='border-b'>
      <div className='flex h-16 items-center px-4 justify-between gap-4'>
        {/* <Logo/> */}
        <MainNav />
        <div className='flex items-center gap-3'>
          <ProfileButton />
        </div>
      </div>
    </header>
  );
};
