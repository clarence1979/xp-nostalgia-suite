import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';

interface ChangePasswordProps {
  username: string;
  onPasswordChanged?: () => void;
}

export const ChangePassword = ({ username, onPasswordChanged }: ChangePasswordProps) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const { toast } = useToast();

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'Error',
        description: 'All fields are required',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 4) {
      toast({
        title: 'Error',
        description: 'New password must be at least 4 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsChanging(true);

    try {
      const { data: user, error: fetchError } = await supabase
        .from('users_login')
        .select('password')
        .eq('username', username)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!user) {
        toast({
          title: 'Error',
          description: 'User not found',
          variant: 'destructive',
        });
        setIsChanging(false);
        return;
      }

      if (user.password !== currentPassword) {
        toast({
          title: 'Error',
          description: 'Current password is incorrect',
          variant: 'destructive',
        });
        setIsChanging(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('users_login')
        .update({ password: newPassword })
        .eq('username', username);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'Password changed successfully',
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      if (onPasswordChanged) {
        onPasswordChanged();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password',
        variant: 'destructive',
      });
    } finally {
      setIsChanging(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleChangePassword();
    }
  };

  return (
    <div className="h-full bg-white flex flex-col" style={{ fontFamily: 'Tahoma, sans-serif' }}>
      <div className="border-b border-gray-300 p-4 bg-gradient-to-b from-white to-gray-50">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-bold text-gray-800">Change Password</h2>
        </div>
        <p className="text-xs text-gray-600">
          Change password for user: <span className="font-bold">{username}</span>
        </p>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Current Password</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter current password"
              className="text-sm"
              disabled={isChanging}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">New Password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter new password"
              className="text-sm"
              disabled={isChanging}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Confirm New Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Confirm new password"
              className="text-sm"
              disabled={isChanging}
            />
          </div>

          <div className="pt-4">
            <Button
              onClick={handleChangePassword}
              disabled={isChanging || !currentPassword || !newPassword || !confirmPassword}
              className="w-full"
            >
              {isChanging ? 'Changing Password...' : 'Change Password'}
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-300 p-3 bg-gray-100">
        <div className="text-xs text-gray-600">
          <p className="mb-1">Password Requirements:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Minimum 4 characters</li>
            <li>Must match confirmation</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
