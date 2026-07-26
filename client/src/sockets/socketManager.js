import { io } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';

let socket = null;

let SOCKET_URL = import.meta.env.VITE_WS_URL;

if (!SOCKET_URL) {
  if (import.meta.env.DEV) {
    // In dev mode, if VITE_WS_URL is missing, default to the backend server
    SOCKET_URL = 'http://localhost:5000';
  } else {
    // In production, fallback to same-origin if no specific WS URL is provided
    SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '';
  }
}

export const connectGlobalSocket = () => {
  if (socket) return socket;

  const { accessToken } = useAuthStore.getState();

  if (!accessToken) return null;

  socket = io(SOCKET_URL, {
    auth: {
      token: accessToken
    },
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('Global socket connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Global socket disconnected');
  });

  socket.on('connect_error', async (err) => {
    console.error('Socket connection error:', err.message);
    if (err.message === 'Access token expired' || err.message === 'Authentication failed') {
      try {
        const { refreshToken } = useAuthStore.getState();
        const newToken = await refreshToken();
        if (newToken) {
          socket.auth.token = newToken;
          socket.connect();
        }
      } catch (refreshErr) {
        console.error('Failed to refresh token for socket', refreshErr);
      }
    }
  });

  // Global listeners (e.g. notifications)
  socket.on('new_invite', (invite) => {
    const { addInvite } = useWorkspaceStore.getState();
    addInvite(invite);
  });

  // Workspace member updates
  socket.on('workspace_member_joined', (member) => {
    const { currentWorkspace, members } = useWorkspaceStore.getState();
    if (currentWorkspace?.id === member.workspace_id) {
      // Check if already in the list to prevent duplicates
      const exists = members.some(m => (m.user_id || m.id) === member.user_id);
      if (!exists) {
        useWorkspaceStore.setState({ members: [...members, member] });
      }
    }
  });

  socket.on('workspace_member_updated', (member) => {
    console.log('Received workspace_member_updated:', member);
    const { currentWorkspace, members } = useWorkspaceStore.getState();
    console.log('Current workspace:', currentWorkspace?.id, 'Member workspace:', member.workspace_id);
    if (currentWorkspace?.id === member.workspace_id) {
      useWorkspaceStore.setState({
        members: members.map(m => (m.user_id || m.id) === member.user_id ? { ...m, ...member } : m)
      });
      console.log('Member updated in store');
    }
  });

  socket.on('workspace_member_removed', ({ workspace_id, user_id }) => {
    const { currentWorkspace, members } = useWorkspaceStore.getState();
    if (currentWorkspace?.id === workspace_id) {
      useWorkspaceStore.setState({
        members: members.filter(m => (m.user_id || m.id) !== user_id)
      });
    }
  });

  return socket;
};

export const disconnectGlobalSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
