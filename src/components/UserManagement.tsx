/**
 * USER MANAGEMENT - ADMIN ONLY
 * Create, edit, delete users with custom permissions
 */

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Lock, Unlock, Save, X } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { getAllUsers, createUser, updateUser, deleteUser } from '../lib/db-extended';
import type { User, UserRole, UserPermissions } from '../lib/db-types';
import { DEFAULT_PERMISSIONS } from '../lib/db-types';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const data = await getAllUsers();
    setUsers(data);
  };

  const handleCreateUser = async (userData: Omit<User, 'id' | 'created_at'>) => {
    try {
      await createUser(userData);
      await loadUsers();
      setIsCreating(false);
      alert('User created successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to create user. PIN may already exist.');
    }
  };

  const handleUpdateUser = async (id: string, updates: Partial<User>) => {
    try {
      await updateUser(id, updates);
      await loadUsers();
      setEditingUser(null);
      alert('User updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update user.');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    
    try {
      await deleteUser(id);
      await loadUsers();
      alert('User deleted successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to delete user.');
    }
  };

  const handleToggleActive = async (user: User) => {
    await handleUpdateUser(user.id, { is_active: !user.is_active });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage staff accounts and permissions</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setIsCreating(true)}>
          Add New User
        </Button>
      </div>

      {/* User List */}
      <div className="grid grid-cols-1 gap-4">
        {users.map(user => (
          <UserCard
            key={user.id}
            user={user}
            onEdit={() => setEditingUser(user)}
            onDelete={() => handleDeleteUser(user.id, user.name)}
            onToggleActive={() => handleToggleActive(user)}
          />
        ))}
      </div>

      {/* Create Modal */}
      {isCreating && (
        <UserFormModal
          onSave={handleCreateUser}
          onCancel={() => setIsCreating(false)}
        />
      )}

      {/* Edit Modal */}
      {editingUser && (
        <UserFormModal
          user={editingUser}
          onSave={(data) => handleUpdateUser(editingUser.id, data)}
          onCancel={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}

function UserCard({ user, onEdit, onDelete, onToggleActive }: {
  user: User;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  const roleColors: Record<UserRole, string> = {
    CASHIER: 'from-green-600 to-green-700',
    MANAGER: 'from-blue-600 to-blue-700',
    ADMIN: 'from-purple-600 to-purple-700',
  };

  return (
    <div className={`bg-white/50 dark:bg-white/5 border border-gray-300/50 dark:border-white/10 rounded-xl p-6 ${!user.is_active && 'opacity-50'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1 rounded-lg bg-gradient-to-r ${roleColors[user.role]} text-white text-sm font-bold`}>
            {user.role}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{user.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">PIN: {user.pin}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={user.is_active ? Lock : Unlock} onClick={onToggleActive}>
            {user.is_active ? 'Disable' : 'Enable'}
          </Button>
          <Button variant="ghost" size="sm" icon={Edit2} onClick={onEdit} />
          <Button variant="ghost" size="sm" icon={Trash2} onClick={onDelete} className="text-red-600" />
        </div>
      </div>

      {/* Permissions Summary */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <PermissionBadge label="POS" granted={user.permissions.can_access_pos} />
        <PermissionBadge label="Back Office" granted={user.permissions.can_access_backoffice} />
        <PermissionBadge label="Settings" granted={user.permissions.can_access_settings} />
        <PermissionBadge label="Voids" granted={user.permissions.can_void_items} />
        <PermissionBadge label="Discounts" granted={user.permissions.can_give_discounts} extra={`${user.permissions.max_discount_percent}%`} />
        <PermissionBadge label="Refunds" granted={user.permissions.can_process_refunds} />
      </div>
    </div>
  );
}

function PermissionBadge({ label, granted, extra }: { label: string; granted: boolean; extra?: string }) {
  return (
    <div className={`px-2 py-1 rounded text-center ${granted ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
      {label} {extra && `(${extra})`}
    </div>
  );
}

function UserFormModal({ user, onSave, onCancel }: {
  user?: User;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    pin: user?.pin || '',
    name: user?.name || '',
    role: user?.role || 'CASHIER' as UserRole,
    is_active: user?.is_active ?? true,
    permissions: user?.permissions || DEFAULT_PERMISSIONS.CASHIER,
  });

  const handleRoleChange = (role: UserRole) => {
    setFormData({
      ...formData,
      role,
      permissions: DEFAULT_PERMISSIONS[role],
    });
  };

  const handlePermissionToggle = (key: keyof UserPermissions) => {
    if (typeof formData.permissions[key] === 'boolean') {
      setFormData({
        ...formData,
        permissions: {
          ...formData.permissions,
          [key]: !formData.permissions[key],
        },
      });
    }
  };

  const handleSubmit = () => {
    if (!formData.pin || formData.pin.length !== 4) {
      alert('PIN must be 4 digits');
      return;
    }
    if (!formData.name.trim()) {
      alert('Name is required');
      return;
    }
    
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-gray-300/50 dark:border-white/10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {user ? 'Edit User' : 'Create New User'}
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="PIN (4 digits)"
              value={formData.pin}
              onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
              placeholder="1234"
              maxLength={4}
            />
            
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['CASHIER', 'MANAGER', 'ADMIN'] as UserRole[]).map(role => (
                <button
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.role === role
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-white/10 hover:border-blue-400'
                  }`}
                >
                  <p className="font-semibold text-gray-900 dark:text-white">{role}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Permissions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Permissions</h3>
            <div className="space-y-2">
              <PermissionToggle
                label="POS Access"
                checked={formData.permissions.can_access_pos}
                onChange={() => handlePermissionToggle('can_access_pos')}
              />
              <PermissionToggle
                label="Back Office Access"
                checked={formData.permissions.can_access_backoffice}
                onChange={() => handlePermissionToggle('can_access_backoffice')}
              />
              <PermissionToggle
                label="Settings Access"
                checked={formData.permissions.can_access_settings}
                onChange={() => handlePermissionToggle('can_access_settings')}
              />
              <PermissionToggle
                label="Void Items"
                checked={formData.permissions.can_void_items}
                onChange={() => handlePermissionToggle('can_void_items')}
              />
              <PermissionToggle
                label="Give Discounts"
                checked={formData.permissions.can_give_discounts}
                onChange={() => handlePermissionToggle('can_give_discounts')}
              />
              <PermissionToggle
                label="Process Refunds"
                checked={formData.permissions.can_process_refunds}
                onChange={() => handlePermissionToggle('can_process_refunds')}
              />
              <PermissionToggle
                label="Adjust Stock"
                checked={formData.permissions.can_adjust_stock}
                onChange={() => handlePermissionToggle('can_adjust_stock')}
              />
              <PermissionToggle
                label="View Reports"
                checked={formData.permissions.can_view_reports}
                onChange={() => handlePermissionToggle('can_view_reports')}
              />
              <PermissionToggle
                label="Manage Users"
                checked={formData.permissions.can_manage_users}
                onChange={() => handlePermissionToggle('can_manage_users')}
              />
              <PermissionToggle
                label="Close Shift"
                checked={formData.permissions.can_close_shift}
                onChange={() => handlePermissionToggle('can_close_shift')}
              />
              
              {/* Max Discount */}
              <div className="pt-2">
                <Input
                  label="Max Discount %"
                  type="number"
                  value={formData.permissions.max_discount_percent.toString()}
                  onChange={(e) => setFormData({
                    ...formData,
                    permissions: {
                      ...formData.permissions,
                      max_discount_percent: parseInt(e.target.value) || 0,
                    },
                  })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Active Status */}
          <PermissionToggle
            label="Account Active"
            checked={formData.is_active}
            onChange={() => setFormData({ ...formData, is_active: !formData.is_active })}
          />
        </div>

        <div className="p-6 border-t border-gray-300/50 dark:border-white/10 flex gap-3">
          <Button variant="secondary" icon={X} onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button variant="primary" icon={Save} onClick={handleSubmit} className="flex-1">
            {user ? 'Update User' : 'Create User'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PermissionToggle({ label, checked, onChange }: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
