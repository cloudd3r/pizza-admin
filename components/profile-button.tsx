'use client';

import { CircleUser, LogOut, User } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import React from 'react';

import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface Props {
  onClickSignIn?: () => void;
  className?: string;
}

export const ProfileButton: React.FC<Props> = ({
  className,
  onClickSignIn,
}) => {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className={className}>
        <Button
          onClick={onClickSignIn}
          variant='outline'
          className='flex items-center gap-1'
        >
          <User size={16} />
          Войти
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='secondary' className='flex items-center gap-2'>
            <CircleUser size={18} />
            Профиль
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-48'>
          <DropdownMenuLabel className='font-normal'>
            <span className='text-xs text-muted-foreground'>Роль</span>
            <div className='font-medium'>{session.user.role}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: '/' })}
            className='cursor-pointer text-destructive focus:text-destructive'
          >
            <LogOut className='mr-2 h-4 w-4' />
            Выйти
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
