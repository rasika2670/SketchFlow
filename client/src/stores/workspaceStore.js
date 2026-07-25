import { create } from 'zustand';
import * as workspacesApi from '@/api/workspaces.api';
import * as usersApi from '@/api/users.api';
import toast from 'react-hot-toast';

export const useWorkspaceStore = create((set, get) => ({
  // ─── State ──────────────────────────────────────────────────────────────────
  workspaces: [],
  currentWorkspace: null,
  members: [],
  pendingInvites: [],
  isLoading: false,

  // ─── Workspace Actions ──────────────────────────────────────────────────────

  // Fetch all workspaces the user belongs to
  fetchWorkspaces: async () => {
    set({ isLoading: true });
    try {
      const { data } = await workspacesApi.list();
      const workspacesList = data.data?.workspaces || data.workspaces || [];
      set({ workspaces: workspacesList, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || 'Failed to load workspaces.';
      toast.error(message);
    }
  },

  // Create a new workspace
  createWorkspace: async ({ name, description }) => {
    try {
      const { data } = await workspacesApi.create({ name, description });
      const workspace = data.data?.workspace || data.workspace;
      set((state) => ({
        workspaces: [...state.workspaces, workspace],
      }));
      toast.success('Workspace created!');
      return workspace;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create workspace.';
      toast.error(message);
      return null;
    }
  },

  // Update workspace details
  updateWorkspace: async (workspaceId, data) => {
    try {
      const { data: res } = await workspacesApi.update(workspaceId, data);
      const updated = res.data?.workspace || res.workspace;
      set((state) => ({
        workspaces: state.workspaces.map((w) =>
          w.id === workspaceId ? { ...w, ...updated } : w
        ),
        currentWorkspace:
          state.currentWorkspace?.id === workspaceId
            ? { ...state.currentWorkspace, ...updated }
            : state.currentWorkspace,
      }));
      toast.success('Workspace updated!');
      return updated;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update workspace.';
      toast.error(message);
      return null;
    }
  },

  // Delete a workspace
  deleteWorkspace: async (workspaceId) => {
    try {
      await workspacesApi.remove(workspaceId);
      set((state) => ({
        workspaces: state.workspaces.filter((w) => w.id !== workspaceId),
        currentWorkspace:
          state.currentWorkspace?.id === workspaceId
            ? null
            : state.currentWorkspace,
      }));
      toast.success('Workspace deleted.');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete workspace.';
      toast.error(message);
      return false;
    }
  },

  // Set the active workspace (when navigating into one)
  setCurrentWorkspace: (workspace) => {
    set({ currentWorkspace: workspace });
  },

  // Fetch workspace details by ID
  fetchWorkspaceById: async (workspaceId) => {
    set({ isLoading: true });
    try {
      const { data } = await workspacesApi.getById(workspaceId);
      const workspace = data.data?.workspace || data.workspace;
      set({ currentWorkspace: workspace, isLoading: false });
      return workspace;
    } catch (error) {
      set({ isLoading: false });
      const message = error.response?.data?.message || 'Failed to load workspace.';
      toast.error(message);
      return null;
    }
  },

  // ─── Member Actions ─────────────────────────────────────────────────────────

  // Fetch members for a workspace
  fetchMembers: async (workspaceId) => {
    try {
      const { data } = await workspacesApi.listMembers(workspaceId);
      const membersList = data.data?.members || data.members || [];
      set({ members: membersList });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load members.';
      toast.error(message);
    }
  },

  // Invite a member by email
  inviteMember: async (workspaceId, email, role) => {
    try {
      const { data } = await workspacesApi.inviteMember(workspaceId, { email, role });
      const member = data.data?.member || data.member;
      set((state) => ({
        members: [...state.members, member],
      }));
      toast.success('Member invited!');
      return member;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to invite member.';
      toast.error(message);
      return null;
    }
  },

  // Remove a member from the workspace
  removeMember: async (workspaceId, userId) => {
    try {
      await workspacesApi.removeMember(workspaceId, userId);
      set((state) => ({
        members: state.members.filter((m) => m.user_id !== userId && m.id !== userId),
      }));
      toast.success('Member removed.');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove member.';
      toast.error(message);
      return false;
    }
  },

  // Update a member's role
  updateMemberRole: async (workspaceId, userId, role) => {
    try {
      await workspacesApi.updateMemberRole(workspaceId, userId, role);
      set((state) => ({
        members: state.members.map((m) =>
          (m.user_id === userId || m.id === userId) ? { ...m, role } : m
        ),
      }));
      toast.success('Role updated!');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update role.';
      toast.error(message);
      return false;
    }
  },

  // ─── Invite Actions ────────────────────────────────────────────────────────

  // Fetch pending invites for the current user
  fetchInvites: async () => {
    try {
      const { data } = await usersApi.getPendingInvites();
      const invitesList = data.data?.invites || data.invites || [];
      set({ pendingInvites: invitesList });
    } catch (error) {
      console.error('Failed to load invites', error);
    }
  },

  // Add a new invite (called from socket)
  addInvite: (invite) => {
    set((state) => ({
      pendingInvites: [invite, ...state.pendingInvites],
    }));
    toast(`You have a new invite to ${invite.workspace_name}`, { icon: '📩' });
  },

  // Accept an invite
  acceptInvite: async (inviteId) => {
    try {
      await workspacesApi.acceptInvite(inviteId);
      set((state) => ({
        pendingInvites: state.pendingInvites.filter((i) => i.id !== inviteId),
      }));
      // Re-fetch workspaces to show the new one
      await get().fetchWorkspaces();
      toast.success('Invite accepted!');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to accept invite.';
      toast.error(message);
      return false;
    }
  },

  // Decline an invite
  declineInvite: async (inviteId) => {
    try {
      await workspacesApi.declineInvite(inviteId);
      set((state) => ({
        pendingInvites: state.pendingInvites.filter((i) => i.id !== inviteId),
      }));
      toast.success('Invite declined.');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to decline invite.';
      toast.error(message);
      return false;
    }
  },

  // Clear workspace state (on logout or navigation away)
  reset: () => {
    set({
      workspaces: [],
      currentWorkspace: null,
      members: [],
      pendingInvites: [],
      isLoading: false,
    });
  },
}));
