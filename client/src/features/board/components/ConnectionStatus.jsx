import { useUIStore } from '@/stores/uiStore';
import { getBoardSocket } from '@/sockets/socket';

/**
 * ConnectionStatus — small pill in board header showing socket connection state.
 * 🟢 Connected | 🟡 Reconnecting | 🔴 Disconnected
 */
export default function ConnectionStatus() {
  const status = useUIStore((s) => s.connectionStatus);

  const handleReconnect = () => {
    if (status === 'disconnected') {
      const socket = getBoardSocket();
      if (socket) socket.connect();
    }
  };

  const config = {
    connected: {
      dotColor: 'bg-success',
      text: 'Connected',
      textColor: 'text-success',
      pulse: false,
    },
    connecting: {
      dotColor: 'bg-warning',
      text: 'Reconnecting...',
      textColor: 'text-warning',
      pulse: true,
    },
    disconnected: {
      dotColor: 'bg-error',
      text: 'Disconnected',
      textColor: 'text-error',
      pulse: false,
    },
  };

  const { dotColor, text, textColor, pulse } = config[status] || config.disconnected;

  return (
    <button
      onClick={handleReconnect}
      disabled={status === 'connected'}
      className={`
        flex items-center gap-1.5 px-2.5 py-1 rounded-sf-pill text-sf-xs font-medium
        transition-colors bg-slate-800/50 border border-slate-700
        ${status === 'disconnected' ? 'cursor-pointer hover:bg-slate-700/50' : 'cursor-default'}
      `}
      title={status === 'disconnected' ? 'Click to reconnect' : status}
    >
      <span
        className={`w-2 h-2 rounded-full ${dotColor} ${pulse ? 'animate-pulse' : ''}`}
      />
      <span className={textColor}>{text}</span>
    </button>
  );
}
