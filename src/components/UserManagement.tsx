import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Trash2, Edit2, UserCog, Key } from 'lucide-react';

interface User {
  id: string;
  username: string;
  password: string;
  is_admin: boolean;
  api_key: string | null;
  created_at: string;
}

interface ApiKey {
  id: string;
  key_name: string;
  key_value: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface UserManagementProps {
  currentUsername: string;
}

export const UserManagement = ({ currentUsername }: UserManagementProps) => {
  const [activeTab, setActiveTab] = useState<'users' | 'apikeys'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', isAdmin: false });

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [filteredApiKeys, setFilteredApiKeys] = useState<ApiKey[]>([]);
  const [apiKeySearchTerm, setApiKeySearchTerm] = useState('');
  const [selectedApiKeys, setSelectedApiKeys] = useState<Set<string>>(new Set());
  const [editingApiKey, setEditingApiKey] = useState<ApiKey | null>(null);
  const [showAddApiKey, setShowAddApiKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState({ keyName: '', keyValue: '', description: '' });

  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchApiKeys();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredUsers(
        users.filter(user =>
          user.username.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  useEffect(() => {
    if (apiKeySearchTerm) {
      setFilteredApiKeys(
        apiKeys.filter(key =>
          key.key_name.toLowerCase().includes(apiKeySearchTerm.toLowerCase()) ||
          key.description.toLowerCase().includes(apiKeySearchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredApiKeys(apiKeys);
    }
  }, [apiKeySearchTerm, apiKeys]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users_login')
        .select('*')
        .order('username', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) {
      toast({
        title: 'Error',
        description: 'Username and password are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('users_login')
        .insert([{
          username: newUser.username,
          password: newUser.password,
          is_admin: newUser.isAdmin
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `User ${newUser.username} added successfully`,
      });

      setNewUser({ username: '', password: '', isAdmin: false });
      setShowAddUser(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add user',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('users_login')
        .update({
          username: editingUser.username,
          password: editingUser.password,
          is_admin: editingUser.is_admin
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `User ${editingUser.username} updated successfully`,
      });

      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedUsers.size === 0) {
      toast({
        title: 'Error',
        description: 'No users selected',
        variant: 'destructive',
      });
      return;
    }

    const selectedUsernames = Array.from(selectedUsers)
      .map(id => users.find(u => u.id === id)?.username)
      .filter(Boolean);

    if (!window.confirm(`Are you sure you want to delete ${selectedUsers.size} user(s)?\n${selectedUsernames.join(', ')}`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users_login')
        .delete()
        .in('id', Array.from(selectedUsers));

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${selectedUsers.size} user(s) deleted successfully`,
      });

      setSelectedUsers(new Set());
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete users',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users_login')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `User ${username} deleted successfully`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('secrets')
        .select('*')
        .order('key_name', { ascending: true });

      if (error) throw error;
      setApiKeys(data || []);
      setFilteredApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast({
        title: 'Error',
        description: 'Failed to load API keys',
        variant: 'destructive',
      });
    }
  };

  const handleAddApiKey = async () => {
    if (!newApiKey.keyName || !newApiKey.keyValue) {
      toast({
        title: 'Error',
        description: 'Key name and value are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('secrets')
        .insert([{
          key_name: newApiKey.keyName,
          key_value: newApiKey.keyValue,
          description: newApiKey.description
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `API key ${newApiKey.keyName} added successfully`,
      });

      setNewApiKey({ keyName: '', keyValue: '', description: '' });
      setShowAddApiKey(false);
      fetchApiKeys();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add API key',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateApiKey = async () => {
    if (!editingApiKey) return;

    try {
      const { error } = await supabase
        .from('secrets')
        .update({
          key_name: editingApiKey.key_name,
          key_value: editingApiKey.key_value,
          description: editingApiKey.description
        })
        .eq('id', editingApiKey.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `API key ${editingApiKey.key_name} updated successfully`,
      });

      setEditingApiKey(null);
      fetchApiKeys();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update API key',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSelectedApiKeys = async () => {
    if (selectedApiKeys.size === 0) {
      toast({
        title: 'Error',
        description: 'No API keys selected',
        variant: 'destructive',
      });
      return;
    }

    const selectedKeyNames = Array.from(selectedApiKeys)
      .map(id => apiKeys.find(k => k.id === id)?.key_name)
      .filter(Boolean);

    if (!window.confirm(`Are you sure you want to delete ${selectedApiKeys.size} API key(s)?\n${selectedKeyNames.join(', ')}`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('secrets')
        .delete()
        .in('id', Array.from(selectedApiKeys));

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${selectedApiKeys.size} API key(s) deleted successfully`,
      });

      setSelectedApiKeys(new Set());
      fetchApiKeys();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete API keys',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteApiKey = async (keyId: string, keyName: string) => {
    if (!window.confirm(`Are you sure you want to delete API key "${keyName}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('secrets')
        .delete()
        .eq('id', keyId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `API key ${keyName} deleted successfully`,
      });

      fetchApiKeys();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete API key',
        variant: 'destructive',
      });
    }
  };

  const toggleApiKeySelection = (keyId: string) => {
    const newSelected = new Set(selectedApiKeys);
    if (newSelected.has(keyId)) {
      newSelected.delete(keyId);
    } else {
      newSelected.add(keyId);
    }
    setSelectedApiKeys(newSelected);
  };

  const toggleSelectAllApiKeys = () => {
    if (selectedApiKeys.size === filteredApiKeys.length) {
      setSelectedApiKeys(new Set());
    } else {
      setSelectedApiKeys(new Set(filteredApiKeys.map(k => k.id)));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-gray-600">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col" style={{ fontFamily: 'Tahoma, sans-serif' }}>
      <div className="border-b border-gray-300 p-3 bg-gradient-to-b from-white to-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-800">User Management</h2>
        </div>

        <div className="flex gap-2 mb-3 border-b border-gray-300">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <UserCog className="w-4 h-4 inline mr-1" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('apikeys')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'apikeys'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <Key className="w-4 h-4 inline mr-1" />
            API Keys
          </button>
        </div>

        {activeTab === 'users' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowAddUser(!showAddUser)}
                  className="text-xs h-7 px-3"
                  variant="default"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add User
                </Button>
                {selectedUsers.size > 0 && (
                  <Button
                    onClick={handleDeleteSelected}
                    className="text-xs h-7 px-3"
                    variant="destructive"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete ({selectedUsers.size})
                  </Button>
                )}
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-xs h-8"
              />
            </div>
          </>
        )}

        {activeTab === 'apikeys' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowAddApiKey(!showAddApiKey)}
                  className="text-xs h-7 px-3"
                  variant="default"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add API Key
                </Button>
                {selectedApiKeys.size > 0 && (
                  <Button
                    onClick={handleDeleteSelectedApiKeys}
                    className="text-xs h-7 px-3"
                    variant="destructive"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete ({selectedApiKeys.size})
                  </Button>
                )}
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search API keys..."
                value={apiKeySearchTerm}
                onChange={(e) => setApiKeySearchTerm(e.target.value)}
                className="pl-8 text-xs h-8"
              />
            </div>
          </>
        )}
      </div>

      {activeTab === 'users' && showAddUser && (
        <div className="border-b border-gray-300 p-3 bg-blue-50">
          <h3 className="text-sm font-bold mb-2">Add New User</h3>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Input
              type="text"
              placeholder="Username"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              className="text-xs h-8"
            />
            <Input
              type="text"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="text-xs h-8"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center text-xs">
              <input
                type="checkbox"
                checked={newUser.isAdmin}
                onChange={(e) => setNewUser({ ...newUser, isAdmin: e.target.checked })}
                className="mr-2"
              />
              Admin
            </label>
            <div className="flex gap-2">
              <Button onClick={handleAddUser} className="text-xs h-7 px-3" variant="default">
                Add
              </Button>
              <Button
                onClick={() => {
                  setShowAddUser(false);
                  setNewUser({ username: '', password: '', isAdmin: false });
                }}
                className="text-xs h-7 px-3"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && editingUser && (
        <div className="border-b border-gray-300 p-3 bg-yellow-50">
          <h3 className="text-sm font-bold mb-2">Edit User: {editingUser.username}</h3>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Input
              type="text"
              placeholder="Username"
              value={editingUser.username}
              onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
              className="text-xs h-8"
            />
            <Input
              type="text"
              placeholder="Password"
              value={editingUser.password}
              onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
              className="text-xs h-8"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center text-xs">
              <input
                type="checkbox"
                checked={editingUser.is_admin}
                onChange={(e) => setEditingUser({ ...editingUser, is_admin: e.target.checked })}
                className="mr-2"
              />
              Admin
            </label>
            <div className="flex gap-2">
              <Button onClick={handleUpdateUser} className="text-xs h-7 px-3" variant="default">
                Save
              </Button>
              <Button
                onClick={() => setEditingUser(null)}
                className="text-xs h-7 px-3"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'apikeys' && showAddApiKey && (
        <div className="border-b border-gray-300 p-3 bg-blue-50">
          <h3 className="text-sm font-bold mb-2">Add New API Key</h3>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Input
              type="text"
              placeholder="Key Name"
              value={newApiKey.keyName}
              onChange={(e) => setNewApiKey({ ...newApiKey, keyName: e.target.value })}
              className="text-xs h-8"
            />
            <Input
              type="text"
              placeholder="Key Value"
              value={newApiKey.keyValue}
              onChange={(e) => setNewApiKey({ ...newApiKey, keyValue: e.target.value })}
              className="text-xs h-8"
            />
          </div>
          <Input
            type="text"
            placeholder="Description (optional)"
            value={newApiKey.description}
            onChange={(e) => setNewApiKey({ ...newApiKey, description: e.target.value })}
            className="text-xs h-8 mb-2"
          />
          <div className="flex gap-2 justify-end">
            <Button onClick={handleAddApiKey} className="text-xs h-7 px-3" variant="default">
              Add
            </Button>
            <Button
              onClick={() => {
                setShowAddApiKey(false);
                setNewApiKey({ keyName: '', keyValue: '', description: '' });
              }}
              className="text-xs h-7 px-3"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'apikeys' && editingApiKey && (
        <div className="border-b border-gray-300 p-3 bg-yellow-50">
          <h3 className="text-sm font-bold mb-2">Edit API Key: {editingApiKey.key_name}</h3>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Input
              type="text"
              placeholder="Key Name"
              value={editingApiKey.key_name}
              onChange={(e) => setEditingApiKey({ ...editingApiKey, key_name: e.target.value })}
              className="text-xs h-8"
            />
            <Input
              type="text"
              placeholder="Key Value"
              value={editingApiKey.key_value}
              onChange={(e) => setEditingApiKey({ ...editingApiKey, key_value: e.target.value })}
              className="text-xs h-8"
            />
          </div>
          <Input
            type="text"
            placeholder="Description (optional)"
            value={editingApiKey.description}
            onChange={(e) => setEditingApiKey({ ...editingApiKey, description: e.target.value })}
            className="text-xs h-8 mb-2"
          />
          <div className="flex gap-2 justify-end">
            <Button onClick={handleUpdateApiKey} className="text-xs h-7 px-3" variant="default">
              Save
            </Button>
            <Button
              onClick={() => setEditingApiKey(null)}
              className="text-xs h-7 px-3"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {activeTab === 'users' && (
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 bg-gray-200 border-b-2 border-gray-400">
              <tr>
                <th className="p-2 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="p-2 text-left">Username</th>
                <th className="p-2 text-left">Password</th>
                <th className="p-2 text-left w-20">Admin</th>
                <th className="p-2 text-left w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr
                  key={user.id}
                  className={`border-b border-gray-200 hover:bg-blue-50 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                    />
                  </td>
                  <td className="p-2 font-medium">{user.username}</td>
                  <td className="p-2 text-gray-600">{'•'.repeat(user.password.length)}</td>
                  <td className="p-2">
                    {user.is_admin && (
                      <UserCog className="w-4 h-4 text-blue-600" />
                    )}
                  </td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      <Button
                        onClick={() => setEditingUser(user)}
                        className="text-xs h-6 px-2"
                        variant="outline"
                        size="sm"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        className="text-xs h-6 px-2"
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'apikeys' && (
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 bg-gray-200 border-b-2 border-gray-400">
              <tr>
                <th className="p-2 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selectedApiKeys.size === filteredApiKeys.length && filteredApiKeys.length > 0}
                    onChange={toggleSelectAllApiKeys}
                  />
                </th>
                <th className="p-2 text-left">Key Name</th>
                <th className="p-2 text-left">Key Value</th>
                <th className="p-2 text-left">Description</th>
                <th className="p-2 text-left w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApiKeys.map((key, index) => (
                <tr
                  key={key.id}
                  className={`border-b border-gray-200 hover:bg-blue-50 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedApiKeys.has(key.id)}
                      onChange={() => toggleApiKeySelection(key.id)}
                    />
                  </td>
                  <td className="p-2 font-medium">{key.key_name}</td>
                  <td className="p-2 text-gray-600 font-mono text-xs">
                    {key.key_value.substring(0, 20)}...
                  </td>
                  <td className="p-2 text-gray-600">{key.description || '-'}</td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      <Button
                        onClick={() => setEditingApiKey(key)}
                        className="text-xs h-6 px-2"
                        variant="outline"
                        size="sm"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteApiKey(key.id, key.key_name)}
                        className="text-xs h-6 px-2"
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="border-t border-gray-300 p-2 bg-gray-100 text-xs text-gray-600">
        {activeTab === 'users' && (
          <>Total Users: {filteredUsers.length} | Selected: {selectedUsers.size}</>
        )}
        {activeTab === 'apikeys' && (
          <>Total API Keys: {filteredApiKeys.length} | Selected: {selectedApiKeys.size}</>
        )}
      </div>
    </div>
  );
};
