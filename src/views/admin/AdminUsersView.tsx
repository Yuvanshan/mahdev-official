import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Plus,
  Edit2,
  Trash2,
  Lock,
  KeyRound,
  CheckCircle2,
  XCircle,
  UserCheck,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AdminUser, AdminRole } from '../../types/admin';
import { adminService } from '../../services/adminService';
import { Button } from '../../components/ui/Button';
import { AdminModal } from '../../components/admin/AdminModal';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { AdminToast, ToastMessage } from '../../components/admin/AdminToast';

export const AdminUsersView: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Confirm Delete State
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    role: 'editor' as AdminRole,
    divisionScope: 'all',
    isActive: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadUsers = async () => {
    const list = await adminService.getAdminUsers();
    setUsers(list);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      name: '',
      email: '',
      role: 'editor',
      divisionScope: 'all',
      isActive: true,
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      divisionScope: user.divisionScope || 'all',
      isActive: user.isActive,
    });
    setFormErrors({});
    setIsDirty(false);
    setIsEditorOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.username.trim()) errors.username = 'Username is required';
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.email.trim()) errors.email = 'Email address is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);

    try {
      if (editingUser) {
        await adminService.updateAdminUser(editingUser.id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          divisionScope: formData.divisionScope as any,
          isActive: formData.isActive,
        });
        addToast('success', 'User Updated', `Administrator ${formData.name} was successfully updated.`);
      } else {
        await adminService.createAdminUser({
          username: formData.username.toLowerCase().trim(),
          name: formData.name,
          email: formData.email,
          role: formData.role,
          divisionScope: formData.divisionScope as any,
        });
        addToast('success', 'Admin Created', `New administrator ${formData.name} has been provisioned.`);
      }

      setIsEditorOpen(false);
      setIsDirty(false);
      loadUsers();
    } catch (err: any) {
      addToast('error', 'Operation Failed', err.message || 'Could not save administrator user.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      await adminService.deleteAdminUser(deletingUser.id);
      addToast('success', 'User Removed', `Administrator ${deletingUser.name} access revoked.`);
      await loadUsers();
      setDeletingUser(null);
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message || 'Could not revoke access.');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      <AdminToast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Administrative Staff & Role-Based Access Control ({users.length})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage administrative console operators, security roles, division scopes, and audit credentials.
          </p>
        </div>

        <Button
          variant="electric"
          size="sm"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
          className="text-xs font-bold shrink-0"
        >
          Provision Administrator
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search admins by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                    {user.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AD'}
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-slate-900">{user.name}</h3>
                    <span className="text-[11px] text-slate-500 font-mono">@{user.username}</span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                  user.role === 'super_admin'
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : user.role === 'operations_manager'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {String(user.role || 'user').replace(/_/g, ' ')}
                </span>
              </div>

              <div className="py-3 space-y-2 text-xs">
                <div className="text-slate-600 flex items-center gap-1.5">
                  <span className="text-slate-400 font-mono">Email:</span>
                  <strong className="text-slate-800">{user.email}</strong>
                </div>

                <div className="text-slate-600 flex items-center gap-1.5">
                  <span className="text-slate-400 font-mono">Division Scope:</span>
                  <strong className="text-blue-700 uppercase">{user.divisionScope || 'all'}</strong>
                </div>

                <div className="text-slate-600 flex items-center gap-1.5">
                  <span className="text-slate-400 font-mono">Last Active:</span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Recent session'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}>
                {user.isActive ? 'ACTIVE ACCESS' : 'SUSPENDED'}
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(user)}
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  className="text-xs h-8"
                >
                  Edit
                </Button>
                {user.role !== 'super_admin' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingUser(user)}
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                    className="text-xs h-8 hover:bg-red-50 hover:text-red-600"
                  >
                    Revoke
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Editor Modal */}
      <AdminModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingUser ? `Edit Administrator: ${editingUser.name}` : 'Provision Administrator User'}
        subtitle="Manage console login credentials, role assignments, and division privileges."
        isDirty={isDirty}
        onSave={handleSave}
        isSaving={isSaving}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="e.g. Kasun Fernando"
                className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                  formErrors.name ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {formErrors.name && <p className="text-[11px] text-red-500 mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={!!editingUser}
                value={formData.username}
                onChange={(e) => {
                  setFormData({ ...formData, username: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="e.g. kasun.f"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Corporate Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setIsDirty(true);
              }}
              placeholder="kasun@mahdev.lk"
              className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                formErrors.email ? 'border-red-500' : 'border-slate-200'
              }`}
            />
            {formErrors.email && <p className="text-[11px] text-red-500 mt-1">{formErrors.email}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Access Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => {
                  setFormData({ ...formData, role: e.target.value as AdminRole });
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
              >
                <option value="super_admin">Super Administrator (Full Root Access)</option>
                <option value="operations_manager">Operations Manager</option>
                <option value="finance_manager">Finance Manager</option>
                <option value="booking_coordinator">Booking Coordinator</option>
                <option value="editor">Content Editor / CMS</option>
                <option value="auditor">Auditor (Read Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Division Scope
              </label>
              <select
                value={formData.divisionScope}
                onChange={(e) => {
                  setFormData({ ...formData, divisionScope: e.target.value });
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
              >
                <option value="all">Global (All Divisions)</option>
                <option value="sws">SWS Event Management</option>
                <option value="u1">U1 Studio</option>
                <option value="it">Mahdev IT</option>
                <option value="travels">Mahdev Travels</option>
                <option value="mart">Mahdev Online Mart</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-3 border-t border-slate-100">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => {
                  setFormData({ ...formData, isActive: e.target.checked });
                  setIsDirty(true);
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-2.5 text-xs font-bold text-slate-800">Account Enabled & Authorized</span>
            </label>
          </div>
        </div>
      </AdminModal>

      {/* Confirm Delete Dialog */}
      <AdminConfirmDialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        title="Revoke Administrator Access?"
        message={`Are you sure you want to revoke console access for ${deletingUser?.name}?`}
        confirmText="Revoke Access"
        isDangerous={true}
        onConfirm={handleDelete}
      />
    </div>
  );
};
