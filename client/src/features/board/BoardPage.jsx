import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBoardStore } from '@/stores/boardStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { connectBoardSocket, disconnectBoardSocket } from '@/sockets/socket';
import { useBoardSocket } from '@/sockets/useBoardSocket';
import { usePresence } from '@/sockets/usePresence';
import { useLock } from '@/sockets/useLock';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';

import BoardHeader from './components/BoardHeader';
import Toolbar from './components/Toolbar';
import RightSidebar from './components/RightSidebar';
import Canvas from '@/features/canvas/Canvas';
import CanvasControls from '@/features/canvas/CanvasControls';

import toast from 'react-hot-toast';

/**
 * BoardPage — main board view combining canvas, toolbar, header, and sidebar.
 * Connects socket on mount, disconnects on unmount.
 */
export default function BoardPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { setCurrentBoard, currentBoard } = useBoardStore();

  // ─── Connect board socket ──────────────────────────────────────────────
  useEffect(() => {
    const socket = connectBoardSocket();
    if (!socket) {
      toast.error('Failed to connect to board');
      navigate('/');
      return;
    }

    return () => {
      disconnectBoardSocket();
      useCanvasStore.getState().reset();
    };
  }, [boardId, navigate]);

  // ─── Fetch board metadata ──────────────────────────────────────────────
  useEffect(() => {
    const loadBoard = async () => {
      try {
        const boardsApi = await import('@/api/boards.api');
        const { data } = await boardsApi.getById(boardId);
        const board = data.data?.board || data.board || data;
        setCurrentBoard(board);
      } catch (err) {
        console.error('Failed to load board:', err);
        toast.error('Board not found');
        navigate('/');
      }
    };

    if (boardId) loadBoard();

    return () => setCurrentBoard(null);
  }, [boardId, navigate, setCurrentBoard]);

  // ─── Socket hooks ──────────────────────────────────────────────────────
  useBoardSocket(boardId);
  const { sendCursorMove } = usePresence(boardId);
  const { requestLock, releaseLock } = useLock(boardId);
  useConnectionStatus();

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden">
      {/* Board Header */}
      <BoardHeader board={currentBoard} />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <Toolbar />

        {/* Canvas area (fills remaining space) */}
        <div className="relative flex-1">
          <Canvas
            boardId={boardId}
            sendCursorMove={sendCursorMove}
            requestLock={requestLock}
            releaseLock={releaseLock}
          />
          <CanvasControls />
        </div>

        {/* Right Sidebar */}
        <RightSidebar />
      </div>
    </div>
  );
}
