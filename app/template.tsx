import { ViewTransition } from 'react';

// Re-mounts on every navigation, so the old page fades out and the new one fades in
// (the light and dark division themes crossfade like switching browser tabs).
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-fade" exit="page-fade" default="none">
      {children}
    </ViewTransition>
  );
}
