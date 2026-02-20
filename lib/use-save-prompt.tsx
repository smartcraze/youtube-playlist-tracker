'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';

interface SavePromptState {
  isOpen: boolean;
  message: string;
  action: (() => void) | null;
  title: string;
}

export function useSavePrompt() {
  const { data: session } = useSession();
  const [promptState, setPromptState] = useState<SavePromptState>({
    isOpen: false,
    message: '',
    action: null,
    title: 'Save Your Progress',
  });

  const showPrompt = (
    message: string,
    action: () => void,
    title: string = 'Save Your Progress'
  ) => {
    if (session?.user) {
      // User is authenticated, just do the action
      action();
      return;
    }

    // Show login prompt
    setPromptState({
      isOpen: true,
      message,
      action,
      title,
    });
  };

  const handleSave = async () => {
    // Sign in and then do the action
    const result = await signIn('google', {
      redirect: false,
      callbackUrl: '/',
    });

    if (result?.ok && promptState.action) {
      promptState.action();
    }

    setPromptState({ isOpen: false, message: '', action: null, title: 'Save Your Progress' });
  };

  const SavePromptDialog = () => (
    <Dialog open={promptState.isOpen} onOpenChange={(open) => {
      if (!open) {
        setPromptState({ isOpen: false, message: '', action: null, title: 'Save Your Progress' });
      }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{promptState.title}</DialogTitle>
          <DialogDescription className="space-y-3 pt-2">
            <p>{promptState.message}</p>
            <p className="text-xs text-muted-foreground">
              Data will only be saved if you sign in. Otherwise, your progress will be lost when you close the page.
            </p>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() =>
              setPromptState({ isOpen: false, message: '', action: null, title: 'Save Your Progress' })
            }
          >
            Continue without Saving
          </Button>
          <Button onClick={handleSave}>
            Sign In to Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return {
    isAuthenticated: !!session?.user,
    showPrompt,
    SavePromptDialog,
  };
}
