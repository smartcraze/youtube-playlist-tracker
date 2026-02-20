'use client';

import { useSession, signOut, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { Moon, Sun, Library, LogOut } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
          <div className="bg-primary/10 p-2 rounded-lg">
             <Library className="h-5 w-5 text-primary" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              Playlist Tracker
            </h1>
          </div>
        </Link>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleTheme()}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="rounded-full text-foreground hover:bg-muted"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                    <AvatarFallback className="bg-muted text-muted-foreground">{session.user.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-popover border-border text-popover-foreground" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-foreground">{session.user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={() => signOut({ redirectTo: '/' })} className="focus:bg-accent focus:text-accent-foreground">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              onClick={() => signIn('google')}
              className="rounded-full px-6 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
