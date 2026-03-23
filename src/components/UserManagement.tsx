import { useState, useEffect, Fragment } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Trash2, CreditCard as Edit2, UserCog, Key, ChevronDown, ChevronUp, Eye, EyeOff, MapPin, Clock, Activity, RefreshCw, Shield, TriangleAlert as AlertTriangle } from 'lucide-react';
import { apiKeyStorage } from '@/lib/apiKeyStorage';

interface LoginLog {
  id: string;
  username: string;
  ip_address: string;
  city: string;
  region: string;
  country: string;
  country_code: string;
  latitude: number | null;
  longitude: number | null;
  logged_at: string;
}

interface User {
  id: string;
  username: string;
  password: string;
  is_admin: boolean;
  api_key: string | null;
  created_at: string;
  last_login_at: string | null;
  last_login_ip: string | null;
  last_login_city: string | null;
  last_login_country: string | null;
}

interface ProgramPermission {
  program_name: string;
  has_access: boolean;
}

interface ApiKey {
  id: string;
  key_name: string;
  key_value: string;
  description: string;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
}

interface ApiKeyUsageStat {
  key_name: string;
  last_used_at: string | null;
  usage_count_24h: number;
}

interface UserManagementProps {
  currentUsername: string;
}

const SUSPICIOUS_LOGIN_THRESHOLD = 10;
const WARNING_LOGIN_THRESHOLD = 5;

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const dt = new Date(dateStr);
  const diffMs = Date.now() - dt.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export const UserManagement = ({ currentUsername }: UserManagementProps) => {
  const [activeTab, setActiveTab] = useState<'users' | 'apikeys' | 'login-logs'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', isAdmin: false });
  const [managingProgramsUserId, setManagingProgramsUserId] = useState<string | null>(null);
  const [userPrograms, setUserPrograms] = useState<ProgramPermission[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [showBulkProgramManager, setShowBulkProgramManager] = useState(false);
  const [availablePrograms, setAvailablePrograms] = useState<string[]>([]);
  const [selectedProgramForBulk, setSelectedProgramForBulk] = useState('');
  const [bulkOperationInProgress, setBulkOperationInProgress] = useState(false);

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [filteredApiKeys, setFilteredApiKeys] = useState<ApiKey[]>([]);
  const [apiKeySearchTerm, setApiKeySearchTerm] = useState('');
  const [selectedApiKeys, setSelectedApiKeys] = useState<Set<string>>(new Set());
  const [editingApiKey, setEditingApiKey] = useState<ApiKey | null>(null);
  const [showAddApiKey, setShowAddApiKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState({ keyName: '', keyValue: '', description: '' });
  const [apiKeyUsageStats, setApiKeyUsageStats] = useState<Record<string, ApiKeyUsageStat>>({});

  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [loginLogsLoading, setLoginLogsLoading] = useState(false);
  const [loginLogFilter, setLoginLogFilter] = useState('');
  const [loginFrequency, setLoginFrequency] = useState<Record<string, number>>({});
  const [revealedPasswords, setRevealedPasswords] = useState<Set<string>>(new Set());

  const [quickResetUserId, setQuickResetUserId] = useState<string | null>(null);
  const [quickResetPassword, setQuickResetPassword] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchApiKeys();
    fetchAvailablePrograms();
    fetchLoginFrequency();
    fetchApiKeyUsageStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'login-logs') {
      fetchLoginLogs();
    }
  }, [activeTab]);

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
      toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApiKeyUsageStats = async () => {
    const token = apiKeyStorage.getAuthToken();
    if (!token) return;
    try {
      const { data, error } = await supabase.rpc('get_api_key_usage_stats_admin', { p_token: token });
      if (error) throw error;
      const stats: Record<string, ApiKeyUsageStat> = {};
      if (data && Array.isArray(data)) {
        (data as ApiKeyUsageStat[]).forEach(s => {
          stats[s.key_name] = s;
        });
      }
      setApiKeyUsageStats(stats);
    } catch (err) {
      console.error('Error fetching API key usage stats:', err);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) {
      toast({ title: 'Error', description: 'Username and password are required', variant: 'destructive' });
      return;
    }
    try {
      const { error } = await supabase
        .from('users_login')
        .insert([{ username: newUser.username, password: newUser.password, is_admin: newUser.isAdmin }]);
      if (error) throw error;
      toast({ title: 'Success', description: `User ${newUser.username} added successfully` });
      setNewUser({ username: '', password: '', isAdmin: false });
      setShowAddUser(false);
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to add user', variant: 'destructive' });
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      const { error } = await supabase
        .from('users_login')
        .update({ username: editingUser.username, password: editingUser.password, is_admin: editingUser.is_admin })
        .eq('id', editingUser.id);
      if (error) throw error;
      toast({ title: 'Success', description: `User ${editingUser.username} updated successfully` });
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update user', variant: 'destructive' });
    }
  };

  const handleQuickResetPassword = async (userId: string, username: string) => {
    if (!quickResetPassword.trim()) {
      toast({ title: 'Error', description: 'Password cannot be empty', variant: 'destructive' });
      return;
    }
    try {
      const { error } = await supabase
        .from('users_login')
        .update({ password: quickResetPassword.trim(), must_change_password: true })
        .eq('id', userId);
      if (error) throw error;
      toast({ title: 'Password Reset', description: `Password for "${username}" has been reset. They will be required to change it on next login.` });
      setQuickResetUserId(null);
      setQuickResetPassword('');
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to reset password', variant: 'destructive' });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedUsers.size === 0) {
      toast({ title: 'Error', description: 'No users selected', variant: 'destructive' });
      return;
    }
    const selectedUsernames = Array.from(selectedUsers).map(id => users.find(u => u.id === id)?.username).filter(Boolean);
    if (!window.confirm(`Are you sure you want to delete ${selectedUsers.size} user(s)?\n${selectedUsernames.join(', ')}`)) return;
    try {
      const { error } = await supabase.from('users_login').delete().in('id', Array.from(selectedUsers));
      if (error) throw error;
      toast({ title: 'Success', description: `${selectedUsers.size} user(s) deleted successfully` });
      setSelectedUsers(new Set());
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete users', variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) return;
    try {
      const { error } = await supabase.from('users_login').delete().eq('id', userId);
      if (error) throw error;
      toast({ title: 'Success', description: `User ${username} deleted successfully` });
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete user', variant: 'destructive' });
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) newSelected.delete(userId);
    else newSelected.add(userId);
    setSelectedUsers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) setSelectedUsers(new Set());
    else setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
  };

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase.from('secrets').select('*').order('key_name', { ascending: true });
      if (error) throw error;
      setApiKeys(data || []);
      setFilteredApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast({ title: 'Error', description: 'Failed to load API keys', variant: 'destructive' });
    }
  };

  const fetchLoginLogs = async (usernameFilter?: string) => {
    const token = apiKeyStorage.getAuthToken();
    if (!token) return;
    setLoginLogsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_login_logs_admin', {
        p_token: token, p_limit: 300, p_username_filter: usernameFilter || null,
      });
      if (error) throw error;
      setLoginLogs((data as LoginLog[]) || []);
    } catch (err) {
      console.error('Error fetching login logs:', err);
      toast({ title: 'Error', description: 'Failed to load login logs', variant: 'destructive' });
    } finally {
      setLoginLogsLoading(false);
    }
  };

  const fetchLoginFrequency = async () => {
    const token = apiKeyStorage.getAuthToken();
    if (!token) return;
    try {
      const { data, error } = await supabase.rpc('get_login_frequency_24h', { p_token: token });
      if (error) throw error;
      const freq: Record<string, number> = {};
      if (data) {
        (data as { username: string; login_count: number }[]).forEach(r => { freq[r.username] = r.login_count; });
      }
      setLoginFrequency(freq);
    } catch (err) {
      console.error('Error fetching login frequency:', err);
    }
  };

  const handleAddApiKey = async () => {
    if (!newApiKey.keyName || !newApiKey.keyValue) {
      toast({ title: 'Error', description: 'Key name and value are required', variant: 'destructive' });
      return;
    }
    const authToken = apiKeyStorage.getAuthToken();
    if (!authToken) { toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' }); return; }
    try {
      const { error } = await supabase.rpc('upsert_secret', {
        p_token: authToken, p_key_name: newApiKey.keyName, p_key_value: newApiKey.keyValue, p_description: newApiKey.description,
      });
      if (error) throw error;
      toast({ title: 'Success', description: `API key ${newApiKey.keyName} added successfully` });
      setNewApiKey({ keyName: '', keyValue: '', description: '' });
      setShowAddApiKey(false);
      fetchApiKeys();
      fetchApiKeyUsageStats();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to add API key', variant: 'destructive' });
    }
  };

  const handleUpdateApiKey = async () => {
    if (!editingApiKey) return;
    const authToken = apiKeyStorage.getAuthToken();
    if (!authToken) { toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' }); return; }
    try {
      const { error } = await supabase.rpc('update_secret_by_id', {
        p_token: authToken, p_id: editingApiKey.id, p_key_name: editingApiKey.key_name, p_key_value: editingApiKey.key_value, p_description: editingApiKey.description,
      });
      if (error) throw error;
      toast({ title: 'Success', description: `API key ${editingApiKey.key_name} updated successfully` });
      setEditingApiKey(null);
      fetchApiKeys();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update API key', variant: 'destructive' });
    }
  };

  const handleDeleteSelectedApiKeys = async () => {
    if (selectedApiKeys.size === 0) {
      toast({ title: 'Error', description: 'No API keys selected', variant: 'destructive' });
      return;
    }
    const selectedKeyNames = Array.from(selectedApiKeys).map(id => apiKeys.find(k => k.id === id)?.key_name).filter(Boolean);
    if (!window.confirm(`Are you sure you want to delete ${selectedApiKeys.size} API key(s)?\n${selectedKeyNames.join(', ')}`)) return;
    const authToken = apiKeyStorage.getAuthToken();
    if (!authToken) { toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' }); return; }
    try {
      for (const keyId of Array.from(selectedApiKeys)) {
        const { error } = await supabase.rpc('delete_secret_by_id', { p_token: authToken, p_id: keyId });
        if (error) throw error;
      }
      toast({ title: 'Success', description: `${selectedApiKeys.size} API key(s) deleted successfully` });
      setSelectedApiKeys(new Set());
      fetchApiKeys();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete API keys', variant: 'destructive' });
    }
  };

  const handleDeleteApiKey = async (keyId: string, keyName: string) => {
    if (!window.confirm(`Are you sure you want to delete API key "${keyName}"?`)) return;
    const authToken = apiKeyStorage.getAuthToken();
    if (!authToken) { toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' }); return; }
    try {
      const { error } = await supabase.rpc('delete_secret_by_id', { p_token: authToken, p_id: keyId });
      if (error) throw error;
      toast({ title: 'Success', description: `API key ${keyName} deleted successfully` });
      fetchApiKeys();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete API key', variant: 'destructive' });
    }
  };

  const toggleApiKeySelection = (keyId: string) => {
    const newSelected = new Set(selectedApiKeys);
    if (newSelected.has(keyId)) newSelected.delete(keyId);
    else newSelected.add(keyId);
    setSelectedApiKeys(newSelected);
  };

  const toggleSelectAllApiKeys = () => {
    if (selectedApiKeys.size === filteredApiKeys.length) setSelectedApiKeys(new Set());
    else setSelectedApiKeys(new Set(filteredApiKeys.map(k => k.id)));
  };

  const fetchUserPrograms = async (userId: string) => {
    setLoadingPrograms(true);
    try {
      const { data, error } = await supabase.rpc('get_user_program_permissions', { target_user_id: userId });
      if (error) throw error;
      setUserPrograms(data || []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to load program permissions', variant: 'destructive' });
    } finally {
      setLoadingPrograms(false);
    }
  };

  const handleToggleProgramAccess = async (userId: string, programName: string, currentAccess: boolean) => {
    try {
      const { error } = await supabase.rpc('update_user_program_permission', {
        target_user_id: userId, program_name: programName, has_access: !currentAccess,
      });
      if (error) throw error;
      setUserPrograms(prev => prev.map(p => p.program_name === programName ? { ...p, has_access: !currentAccess } : p));
      toast({ title: 'Success', description: `Program access updated for ${programName}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update program access', variant: 'destructive' });
    }
  };

  const handleManagePrograms = (userId: string) => {
    if (managingProgramsUserId === userId) {
      setManagingProgramsUserId(null);
      setUserPrograms([]);
    } else {
      setManagingProgramsUserId(userId);
      fetchUserPrograms(userId);
    }
  };

  const fetchAvailablePrograms = async () => {
    try {
      const { data, error } = await supabase.from('desktop_icons').select('name').eq('icon_type', 'program').order('name', { ascending: true });
      if (error) throw error;
      const programs = data?.map(d => d.name) || [];
      programs.push('VCE Section A', 'VCE Section B', 'VCE Section C');
      setAvailablePrograms(programs.sort());
    } catch (error: any) {
      console.error('Error fetching programs:', error);
    }
  };

  const handleBulkProgramEnable = async () => {
    if (selectedUsers.size === 0 || !selectedProgramForBulk) {
      toast({ title: 'Error', description: 'Please select users and a program', variant: 'destructive' });
      return;
    }
    setBulkOperationInProgress(true);
    let successCount = 0;
    let errorCount = 0;
    try {
      for (const userId of Array.from(selectedUsers)) {
        try {
          const { error } = await supabase.rpc('update_user_program_permission', {
            target_user_id: userId, program_name: selectedProgramForBulk, has_access: true,
          });
          if (error) throw error;
          successCount++;
        } catch { errorCount++; }
      }
      toast({ title: 'Bulk Update Complete', description: `Enabled "${selectedProgramForBulk}" for ${successCount} user(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}` });
      setShowBulkProgramManager(false);
      setSelectedProgramForBulk('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update program access', variant: 'destructive' });
    } finally {
      setBulkOperationInProgress(false);
    }
  };

  const handleBulkProgramDisable = async () => {
    if (selectedUsers.size === 0 || !selectedProgramForBulk) {
      toast({ title: 'Error', description: 'Please select users and a program', variant: 'destructive' });
      return;
    }
    setBulkOperationInProgress(true);
    let successCount = 0;
    let errorCount = 0;
    try {
      for (const userId of Array.from(selectedUsers)) {
        try {
          const { error } = await supabase.rpc('update_user_program_permission', {
            target_user_id: userId, program_name: selectedProgramForBulk, has_access: false,
          });
          if (error) throw error;
          successCount++;
        } catch { errorCount++; }
      }
      toast({ title: 'Bulk Update Complete', description: `Disabled "${selectedProgramForBulk}" for ${successCount} user(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}` });
      setShowBulkProgramManager(false);
      setSelectedProgramForBulk('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update program access', variant: 'destructive' });
    } finally {
      setBulkOperationInProgress(false);
    }
  };

  const getLoginCountStyle = (count: number) => {
    if (count >= SUSPICIOUS_LOGIN_THRESHOLD) return 'bg-red-100 text-red-800 ring-1 ring-red-300';
    if (count >= WARNING_LOGIN_THRESHOLD) return 'bg-orange-100 text-orange-700';
    if (count > 0) return 'bg-green-100 text-green-700';
    return '';
  };

  const getUserRowStyle = (user: User) => {
    const count = loginFrequency[user.username] || 0;
    if (count >= SUSPICIOUS_LOGIN_THRESHOLD) return 'bg-red-50 border-l-4 border-l-red-500';
    return '';
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
              activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <UserCog className="w-4 h-4 inline mr-1" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('apikeys')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'apikeys' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <Key className="w-4 h-4 inline mr-1" />
            API Keys
          </button>
          <button
            onClick={() => setActiveTab('login-logs')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'login-logs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-1" />
            Login Logs
          </button>
        </div>

        {activeTab === 'users' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => setShowAddUser(!showAddUser)} className="text-xs h-7 px-3" variant="default">
                  <Plus className="w-3 h-3 mr-1" /> Add User
                </Button>
                {selectedUsers.size > 0 && (
                  <>
                    <Button onClick={handleDeleteSelected} className="text-xs h-7 px-3" variant="destructive">
                      <Trash2 className="w-3 h-3 mr-1" /> Delete ({selectedUsers.size})
                    </Button>
                    <Button onClick={() => setShowBulkProgramManager(!showBulkProgramManager)} className="text-xs h-7 px-3" variant="outline">
                      <UserCog className="w-3 h-3 mr-1" /> Bulk Program Access
                    </Button>
                  </>
                )}
                <Button onClick={() => { fetchUsers(); fetchLoginFrequency(); }} className="text-xs h-7 px-3" variant="outline">
                  <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                </Button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 text-xs h-8" />
            </div>

            {showBulkProgramManager && selectedUsers.size > 0 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <h3 className="text-sm font-bold mb-2">Bulk Program Access - {selectedUsers.size} user(s) selected</h3>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-xs font-medium block mb-1">Select Program</label>
                    <select value={selectedProgramForBulk} onChange={(e) => setSelectedProgramForBulk(e.target.value)} className="w-full text-xs h-8 px-2 border border-gray-300 rounded" disabled={bulkOperationInProgress}>
                      <option value="">-- Choose a program --</option>
                      {availablePrograms.map((program) => (<option key={program} value={program}>{program}</option>))}
                    </select>
                  </div>
                  <Button onClick={handleBulkProgramEnable} className="text-xs h-8 px-3" variant="default" disabled={!selectedProgramForBulk || bulkOperationInProgress}>Enable</Button>
                  <Button onClick={handleBulkProgramDisable} className="text-xs h-8 px-3" variant="destructive" disabled={!selectedProgramForBulk || bulkOperationInProgress}>Disable</Button>
                  <Button onClick={() => { setShowBulkProgramManager(false); setSelectedProgramForBulk(''); }} className="text-xs h-8 px-3" variant="outline" disabled={bulkOperationInProgress}>Cancel</Button>
                </div>
                {bulkOperationInProgress && <div className="text-xs text-gray-600 mt-2">Processing bulk update...</div>}
              </div>
            )}
          </>
        )}

        {activeTab === 'apikeys' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2">
                <Button onClick={() => setShowAddApiKey(!showAddApiKey)} className="text-xs h-7 px-3" variant="default">
                  <Plus className="w-3 h-3 mr-1" /> Add API Key
                </Button>
                {selectedApiKeys.size > 0 && (
                  <Button onClick={handleDeleteSelectedApiKeys} className="text-xs h-7 px-3" variant="destructive">
                    <Trash2 className="w-3 h-3 mr-1" /> Delete ({selectedApiKeys.size})
                  </Button>
                )}
                <Button onClick={() => { fetchApiKeys(); fetchApiKeyUsageStats(); }} className="text-xs h-7 px-3" variant="outline">
                  <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                </Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input type="text" placeholder="Search API keys..." value={apiKeySearchTerm} onChange={(e) => setApiKeySearchTerm(e.target.value)} className="pl-8 text-xs h-8" />
            </div>
          </>
        )}
      </div>

      {/* Add User Form */}
      {activeTab === 'users' && showAddUser && (
        <div className="border-b border-gray-300 p-3 bg-blue-50">
          <h3 className="text-sm font-bold mb-2">Add New User</h3>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Input type="text" placeholder="Username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} className="text-xs h-8" />
            <Input type="text" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="text-xs h-8" />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center text-xs">
              <input type="checkbox" checked={newUser.isAdmin} onChange={(e) => setNewUser({ ...newUser, isAdmin: e.target.checked })} className="mr-2" />
              Admin
            </label>
            <div className="flex gap-2">
              <Button onClick={handleAddUser} className="text-xs h-7 px-3" variant="default">Add</Button>
              <Button onClick={() => { setShowAddUser(false); setNewUser({ username: '', password: '', isAdmin: false }); }} className="text-xs h-7 px-3" variant="outline">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Form */}
      {activeTab === 'users' && editingUser && (
        <div className="border-b border-gray-300 p-3 bg-yellow-50">
          <h3 className="text-sm font-bold mb-2">Edit User: {editingUser.username}</h3>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Input type="text" placeholder="Username" value={editingUser.username} onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })} className="text-xs h-8" />
            <Input type="text" placeholder="Password" value={editingUser.password} onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })} className="text-xs h-8" />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center text-xs">
              <input type="checkbox" checked={editingUser.is_admin} onChange={(e) => setEditingUser({ ...editingUser, is_admin: e.target.checked })} className="mr-2" />
              Admin
            </label>
            <div className="flex gap-2">
              <Button onClick={handleUpdateUser} className="text-xs h-7 px-3" variant="default">Save</Button>
              <Button onClick={() => setEditingUser(null)} className="text-xs h-7 px-3" variant="outline">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add API Key Form */}
      {activeTab === 'apikeys' && showAddApiKey && (
        <div className="border-b border-gray-300 p-3 bg-blue-50">
          <h3 className="text-sm font-bold mb-2">Add New API Key</h3>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Input type="text" placeholder="Key Name" value={newApiKey.keyName} onChange={(e) => setNewApiKey({ ...newApiKey, keyName: e.target.value })} className="text-xs h-8" />
            <Input type="text" placeholder="Key Value" value={newApiKey.keyValue} onChange={(e) => setNewApiKey({ ...newApiKey, keyValue: e.target.value })} className="text-xs h-8" />
          </div>
          <Input type="text" placeholder="Description (optional)" value={newApiKey.description} onChange={(e) => setNewApiKey({ ...newApiKey, description: e.target.value })} className="text-xs h-8 mb-2" />
          <div className="flex gap-2 justify-end">
            <Button onClick={handleAddApiKey} className="text-xs h-7 px-3" variant="default">Add</Button>
            <Button onClick={() => { setShowAddApiKey(false); setNewApiKey({ keyName: '', keyValue: '', description: '' }); }} className="text-xs h-7 px-3" variant="outline">Cancel</Button>
          </div>
        </div>
      )}

      {/* Edit API Key Form */}
      {activeTab === 'apikeys' && editingApiKey && (
        <div className="border-b border-gray-300 p-3 bg-yellow-50">
          <h3 className="text-sm font-bold mb-2">Edit API Key: {editingApiKey.key_name}</h3>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Input type="text" placeholder="Key Name" value={editingApiKey.key_name} onChange={(e) => setEditingApiKey({ ...editingApiKey, key_name: e.target.value })} className="text-xs h-8" />
            <Input type="text" placeholder="Key Value" value={editingApiKey.key_value} onChange={(e) => setEditingApiKey({ ...editingApiKey, key_value: e.target.value })} className="text-xs h-8" />
          </div>
          <Input type="text" placeholder="Description (optional)" value={editingApiKey.description} onChange={(e) => setEditingApiKey({ ...editingApiKey, description: e.target.value })} className="text-xs h-8 mb-2" />
          <div className="flex gap-2 justify-end">
            <Button onClick={handleUpdateApiKey} className="text-xs h-7 px-3" variant="default">Save</Button>
            <Button onClick={() => setEditingApiKey(null)} className="text-xs h-7 px-3" variant="outline">Cancel</Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">

        {/* ===== USERS TABLE ===== */}
        {activeTab === 'users' && (
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 bg-gray-200 border-b-2 border-gray-400">
              <tr>
                <th className="p-2 text-left w-8">
                  <input type="checkbox" checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0} onChange={toggleSelectAll} />
                </th>
                <th className="p-2 text-left">Username</th>
                <th className="p-2 text-left">Password</th>
                <th className="p-2 text-left w-16">24h</th>
                <th className="p-2 text-left">Last Login</th>
                <th className="p-2 text-left w-14">Admin</th>
                <th className="p-2 text-left w-36">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => {
                const loginCount = loginFrequency[user.username] || 0;
                const isSuspicious = loginCount >= SUSPICIOUS_LOGIN_THRESHOLD;
                const rowExtraStyle = getUserRowStyle(user);
                return (
                  <Fragment key={user.id}>
                    <tr className={`border-b border-gray-200 hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${rowExtraStyle}`}>
                      <td className="p-2">
                        <input type="checkbox" checked={selectedUsers.has(user.id)} onChange={() => toggleUserSelection(user.id)} />
                      </td>
                      <td className="p-2 font-medium">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleManagePrograms(user.id)} className="hover:bg-gray-200 p-0.5 rounded">
                            {managingProgramsUserId === user.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                          <span className={isSuspicious ? 'text-red-700 font-bold' : ''}>{user.username}</span>
                          {isSuspicious && <AlertTriangle className="w-3.5 h-3.5 text-red-600 ml-0.5" />}
                        </div>
                      </td>
                      <td className="p-2 text-gray-600">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs">
                            {revealedPasswords.has(user.id) ? user.password : '\u2022'.repeat(Math.min(user.password.length, 12))}
                          </span>
                          <button
                            onClick={() => setRevealedPasswords(prev => {
                              const next = new Set(prev);
                              if (next.has(user.id)) next.delete(user.id);
                              else next.add(user.id);
                              return next;
                            })}
                            className="text-gray-400 hover:text-gray-700 transition-colors p-0.5 rounded"
                            title={revealedPasswords.has(user.id) ? 'Hide password' : 'Show password'}
                          >
                            {revealedPasswords.has(user.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>
                      <td className="p-2">
                        {loginCount > 0 ? (
                          <span className={`inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-full ${getLoginCountStyle(loginCount)}`}>
                            {loginCount}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">0</span>
                        )}
                      </td>
                      <td className="p-2">
                        {user.last_login_at ? (
                          <div className="leading-tight">
                            <div className="text-gray-800 text-xs" title={new Date(user.last_login_at).toLocaleString()}>
                              {formatRelativeTime(user.last_login_at)}
                            </div>
                            <div className="text-[10px] text-gray-500 flex items-center gap-0.5">
                              {user.last_login_ip && user.last_login_ip !== 'unknown' && (
                                <span className="font-mono">{user.last_login_ip}</span>
                              )}
                              {(user.last_login_city || user.last_login_country) && (
                                <span className="flex items-center gap-0.5">
                                  {user.last_login_ip && user.last_login_ip !== 'unknown' && <span>-</span>}
                                  <MapPin className="w-2.5 h-2.5" />
                                  {[user.last_login_city, user.last_login_country].filter(Boolean).join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Never</span>
                        )}
                      </td>
                      <td className="p-2">
                        {user.is_admin && <UserCog className="w-4 h-4 text-blue-600" />}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Button onClick={() => setEditingUser(user)} className="text-xs h-6 px-2" variant="outline" size="sm" title="Edit user">
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            onClick={() => { setQuickResetUserId(quickResetUserId === user.id ? null : user.id); setQuickResetPassword(''); }}
                            className={`text-xs h-6 px-2 ${quickResetUserId === user.id ? 'bg-orange-100 border-orange-300' : ''}`}
                            variant="outline"
                            size="sm"
                            title="Quick reset password"
                          >
                            <Shield className="w-3 h-3" />
                          </Button>
                          <Button onClick={() => handleDeleteUser(user.id, user.username)} className="text-xs h-6 px-2" variant="destructive" size="sm" title="Delete user">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* Quick Password Reset Row */}
                    {quickResetUserId === user.id && (
                      <tr>
                        <td colSpan={7} className="p-3 bg-orange-50 border-b-2 border-orange-200">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-orange-600 flex-shrink-0" />
                            <span className="text-xs font-bold text-orange-800">Reset password for {user.username}:</span>
                            <Input
                              type="text"
                              placeholder="New password"
                              value={quickResetPassword}
                              onChange={(e) => setQuickResetPassword(e.target.value)}
                              className="text-xs h-7 w-48"
                              onKeyDown={(e) => { if (e.key === 'Enter') handleQuickResetPassword(user.id, user.username); }}
                            />
                            <Button
                              onClick={() => handleQuickResetPassword(user.id, user.username)}
                              className="text-xs h-7 px-3"
                              variant="default"
                              disabled={!quickResetPassword.trim()}
                            >
                              Reset
                            </Button>
                            <Button onClick={() => { setQuickResetUserId(null); setQuickResetPassword(''); }} className="text-xs h-7 px-3" variant="outline">
                              Cancel
                            </Button>
                          </div>
                          <div className="text-[10px] text-orange-600 mt-1 ml-6">
                            User will be forced to change password on next login.
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Programs Management Row */}
                    {managingProgramsUserId === user.id && (
                      <tr>
                        <td colSpan={7} className="p-4 bg-blue-50 border-b-2 border-blue-200">
                          <div className="text-sm font-bold mb-3">Program Access for {user.username}</div>
                          {loadingPrograms ? (
                            <div className="text-xs text-gray-600">Loading programs...</div>
                          ) : (
                            <div className="grid grid-cols-4 gap-3">
                              {userPrograms.map((program) => (
                                <label key={program.program_name} className="flex items-center gap-2 text-xs hover:bg-blue-100 p-2 rounded cursor-pointer">
                                  <input type="checkbox" checked={program.has_access} onChange={() => handleToggleProgramAccess(user.id, program.program_name, program.has_access)} className="cursor-pointer" />
                                  <span className="select-none">{program.program_name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}

        {/* ===== API KEYS TABLE ===== */}
        {activeTab === 'apikeys' && (
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 bg-gray-200 border-b-2 border-gray-400">
              <tr>
                <th className="p-2 text-left w-10">
                  <input type="checkbox" checked={selectedApiKeys.size === filteredApiKeys.length && filteredApiKeys.length > 0} onChange={toggleSelectAllApiKeys} />
                </th>
                <th className="p-2 text-left">Key Name</th>
                <th className="p-2 text-left">Key Value</th>
                <th className="p-2 text-left">Description</th>
                <th className="p-2 text-left w-28">Last Used</th>
                <th className="p-2 text-left w-16">24h Uses</th>
                <th className="p-2 text-left w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApiKeys.map((key, index) => {
                const stats = apiKeyUsageStats[key.key_name];
                const lastUsed = stats?.last_used_at || key.last_used_at;
                const usageCount = stats?.usage_count_24h || 0;
                return (
                  <tr key={key.id} className={`border-b border-gray-200 hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="p-2">
                      <input type="checkbox" checked={selectedApiKeys.has(key.id)} onChange={() => toggleApiKeySelection(key.id)} />
                    </td>
                    <td className="p-2 font-medium">{key.key_name}</td>
                    <td className="p-2 text-gray-600 font-mono text-xs">{key.key_value.substring(0, 20)}...</td>
                    <td className="p-2 text-gray-600">{key.description || '-'}</td>
                    <td className="p-2">
                      {lastUsed ? (
                        <span className="text-gray-700" title={new Date(lastUsed).toLocaleString()}>
                          {formatRelativeTime(lastUsed)}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Never</span>
                      )}
                    </td>
                    <td className="p-2">
                      {usageCount > 0 ? (
                        <span className={`inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                          usageCount >= 100 ? 'bg-red-100 text-red-700' : usageCount >= 50 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {usageCount}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <Button onClick={() => setEditingApiKey(key)} className="text-xs h-6 px-2" variant="outline" size="sm">
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button onClick={() => handleDeleteApiKey(key.id, key.key_name)} className="text-xs h-6 px-2" variant="destructive" size="sm">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* ===== LOGIN LOGS TABLE ===== */}
        {activeTab === 'login-logs' && (
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 p-2 border-b border-gray-200 bg-gray-50">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter by username..."
                  value={loginLogFilter}
                  onChange={(e) => setLoginLogFilter(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <button
                onClick={() => fetchLoginLogs(loginLogFilter || undefined)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {loginLogsLoading ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-500">Loading login logs...</div>
            ) : loginLogs.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400">No login records found</div>
            ) : (
              <div className="flex-1 overflow-auto">
                <table className="w-full text-xs border-collapse">
                  <thead className="sticky top-0 bg-gray-200 border-b-2 border-gray-400">
                    <tr>
                      <th className="p-2 text-left whitespace-nowrap"><span className="flex items-center gap-1"><UserCog className="w-3 h-3" /> Username</span></th>
                      <th className="p-2 text-left whitespace-nowrap"><span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Time</span></th>
                      <th className="p-2 text-left whitespace-nowrap">IP Address</th>
                      <th className="p-2 text-left whitespace-nowrap"><span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginLogs
                      .filter(log => !loginLogFilter || log.username.toLowerCase().includes(loginLogFilter.toLowerCase()))
                      .map((log, i) => {
                        const locationParts = [log.city, log.region, log.country].filter(Boolean);
                        const location = locationParts.length > 0 ? locationParts.join(', ') : '\u2014';
                        const logCount = loginFrequency[log.username] || 0;
                        const isSuspicious = logCount >= SUSPICIOUS_LOGIN_THRESHOLD;
                        return (
                          <tr key={log.id} className={`border-b border-gray-100 hover:bg-blue-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isSuspicious ? 'bg-red-50' : ''}`}>
                            <td className={`p-2 font-medium ${isSuspicious ? 'text-red-700' : 'text-gray-800'}`}>
                              {log.username}
                              {isSuspicious && <AlertTriangle className="w-3 h-3 text-red-600 inline ml-1" />}
                            </td>
                            <td className="p-2 text-gray-600">
                              <div title={new Date(log.logged_at).toLocaleString()} className="cursor-default">
                                <span className="text-gray-800">{formatRelativeTime(log.logged_at)}</span>
                                <span className="text-gray-400 ml-1 hidden sm:inline">
                                  {'\u00B7'} {new Date(log.logged_at).toLocaleDateString()} {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </td>
                            <td className="p-2 font-mono text-gray-700">{log.ip_address || '\u2014'}</td>
                            <td className="p-2 text-gray-600">{location}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t border-gray-300 p-2 bg-gray-100 text-xs text-gray-600">
        {activeTab === 'users' && (
          <>
            Total Users: {filteredUsers.length} | Selected: {selectedUsers.size}
            {Object.values(loginFrequency).some(c => c >= SUSPICIOUS_LOGIN_THRESHOLD) && (
              <span className="ml-2 text-red-600 font-semibold">
                -- {Object.values(loginFrequency).filter(c => c >= SUSPICIOUS_LOGIN_THRESHOLD).length} user(s) with suspicious login activity (10+ in 24h)
              </span>
            )}
          </>
        )}
        {activeTab === 'apikeys' && (
          <>Total API Keys: {filteredApiKeys.length} | Selected: {selectedApiKeys.size}</>
        )}
        {activeTab === 'login-logs' && (
          <>Total Logs: {loginLogs.filter(l => !loginLogFilter || l.username.toLowerCase().includes(loginLogFilter.toLowerCase())).length}</>
        )}
      </div>
    </div>
  );
};
