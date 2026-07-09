import { useEffect, useCallback } from 'react';
import { useGraph } from '../api/graph';
import { GraphCanvas } from '../canvas/GraphCanvas';
import { Header } from '../components/Header';
import { SearchBar } from '../components/SearchBar';
import { ToastContainer } from '../components/ui/Toast';
import { CanvasErrorBoundary } from '../components/CanvasErrorBoundary';
import { GraphLoadingSkeleton } from '../components/GraphLoadingSkeleton';
import { DisconnectedState } from '../components/DisconnectedState';
import { AddNodeModal } from '../components/panels/AddNodeModal';
import { AddEdgeModal } from '../components/panels/AddEdgeModal';
import { EditEdgeModal } from '../components/panels/EditEdgeModal';
import { NodeDetailPanel } from '../components/panels/NodeDetailPanel';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useKeyboard } from '../hooks/useKeyboard';
import { useGraphStore } from '../stores/graphStore';
import { getApiErrorMessage } from '../api/mutationUtils';

export function GraphPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useGraph();
  const setNodes = useGraphStore((s) => s.setNodes);
  const setEdges = useGraphStore((s) => s.setEdges);
  const isPanelOpen = useGraphStore((s) => s.isPanelOpen);
  const isSearchOpen = useGraphStore((s) => s.isSearchOpen);
  const openSearch = useGraphStore((s) => s.openSearch);
  const closeSearch = useGraphStore((s) => s.closeSearch);
  const closePanel = useGraphStore((s) => s.closePanel);
  const closeModal = useGraphStore((s) => s.closeModal);

  const isNarrow = useMediaQuery('(max-width: 767px)');

  useEffect(() => {
    if (data) {
      setNodes(data.nodes);
      setEdges(data.edges);
    }
  }, [data, setNodes, setEdges]);

  const handleEscape = useCallback(() => {
    if (isSearchOpen) {
      closeSearch();
      return;
    }
    const { modal, isPanelOpen: panelOpen } = useGraphStore.getState();
    if (modal) {
      closeModal();
      return;
    }
    if (panelOpen) closePanel();
  }, [isSearchOpen, closeSearch, closeModal, closePanel]);

  useKeyboard({
    onSearch: openSearch,
    onEscape: handleEscape,
  });

  const panelOffset = isPanelOpen && !isNarrow ? 400 : 0;
  const showDisconnected = isError && !data;

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />

      <main className="relative flex-1 overflow-hidden">
        {isLoading && <GraphLoadingSkeleton />}

        {showDisconnected && (
          <DisconnectedState
            message={getApiErrorMessage(error)}
            onRetry={() => refetch()}
          />
        )}

        {!showDisconnected && (
          <div
            className="h-full transition-[margin] duration-300"
            style={{ marginRight: panelOffset }}
          >
            <CanvasErrorBoundary>
              <GraphCanvas />
            </CanvasErrorBoundary>
          </div>
        )}

        {isFetching && data && (
          <div className="absolute right-4 top-4 z-20 rounded-md bg-surface px-2 py-1 text-xs text-text-muted shadow">
            Refreshing…
          </div>
        )}

        <NodeDetailPanel isOverlay={isNarrow} />
      </main>

      <SearchBar />
      <AddNodeModal />
      <AddEdgeModal />
      <EditEdgeModal />
      <ToastContainer />
    </div>
  );
}
