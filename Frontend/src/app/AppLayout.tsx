import React, { Suspense, useEffect, useState } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { useJournalActions, useJournalData, useJournalUI } from '../state/JournalContext';
import { AppShell } from '../shell/AppShell';
import { ToastContainer } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Skeleton } from '../ui';
import { GlobalModals } from './GlobalModals';
import { preloadPages } from './pages';
import './transitions.css';

const PageSkeleton: React.FC = () => (
  <div aria-busy="true" aria-label="Loading your journal" style={{ display: 'grid', gap: 16 }}>
    <Skeleton height={44} width="40%" />
    <Skeleton height={140} />
    <Skeleton height={220} />
  </div>
);

const LoadFailed: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div role="alert" style={{ padding: 40, textAlign: 'center' }}>
    <h2 style={{ marginBottom: 8 }}>Couldn’t load your journal</h2>
    <p style={{ marginBottom: 16, color: 'var(--text-2)' }}>
      The server didn’t respond. Check that Django is running, then try again.
    </p>
    <button type="button" className="btn btn-primary" onClick={onRetry}>
      Try again
    </button>
  </div>
);

/** Toasts and the confirm dialog live here so showing one doesn't re-render the current page. */
const Overlays: React.FC = () => {
  const { toasts, confirmDialog } = useJournalUI();
  const { removeToast, closeConfirm } = useJournalActions();
  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />
    </>
  );
};

export const AppLayout: React.FC = () => {
  const { loading, loadFailed } = useJournalData();
  const { retryLoad } = useJournalActions();
  const { pathname } = useLocation();
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((run: () => void) => window.setTimeout(run, 1500));
    idle(() => preloadPages());
  }, []);

  return (
    <AppShell onOpenExport={() => setExportOpen(true)}>
      <Overlays />
      <ScrollRestoration />
      {loading ? (
        <PageSkeleton />
      ) : loadFailed ? (
        <LoadFailed onRetry={retryLoad} />
      ) : (
        // The key lets a crashed page recover when you navigate away from it
        <ErrorBoundary key={pathname}>
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      )}
      <GlobalModals exportOpen={exportOpen} onCloseExport={() => setExportOpen(false)} />
    </AppShell>
  );
};
