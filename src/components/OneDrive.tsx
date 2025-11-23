import { useState, useEffect } from 'react';
import { oneDriveAuth } from '@/lib/oneDriveAuth';
import { oneDriveClient, DriveItem } from '@/lib/oneDriveClient';
import { Button } from '@/components/ui/button';
import { Folder, File, Download, Upload, Trash2, FolderPlus, ArrowLeft, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const OneDrive = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [folderStack, setFolderStack] = useState<Array<{ id: string; name: string }>>([
    { id: 'root', name: 'My OneDrive' }
  ]);
  const { toast } = useToast();

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      await oneDriveAuth.initialize();
      setIsAuthenticated(oneDriveAuth.isAuthenticated());
      if (oneDriveAuth.isAuthenticated()) {
        await loadFiles();
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize OneDrive authentication',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      await oneDriveAuth.login();
      setIsAuthenticated(true);
      await loadFiles();
      toast({
        title: 'Success',
        description: 'Successfully connected to OneDrive',
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Error',
        description: 'Failed to connect to OneDrive. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await oneDriveAuth.logout();
      oneDriveClient.resetClient();
      setIsAuthenticated(false);
      setItems([]);
      setCurrentFolderId('root');
      setFolderStack([{ id: 'root', name: 'My OneDrive' }]);
      toast({
        title: 'Success',
        description: 'Successfully disconnected from OneDrive',
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect from OneDrive',
        variant: 'destructive',
      });
    }
  };

  const loadFiles = async (folderId: string = 'root') => {
    try {
      setIsLoading(true);
      const files = await oneDriveClient.listFiles(folderId);
      setItems(files);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: 'Error',
        description: 'Failed to load files from OneDrive',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderClick = (folder: DriveItem) => {
    setCurrentFolderId(folder.id);
    setFolderStack([...folderStack, { id: folder.id, name: folder.name }]);
    loadFiles(folder.id);
  };

  const handleBack = () => {
    if (folderStack.length > 1) {
      const newStack = folderStack.slice(0, -1);
      const parentFolder = newStack[newStack.length - 1];
      setFolderStack(newStack);
      setCurrentFolderId(parentFolder.id);
      loadFiles(parentFolder.id);
    }
  };

  const handleDownload = async (item: DriveItem) => {
    try {
      const blob = await oneDriveClient.downloadFile(item.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: 'Success',
        description: `Downloaded ${item.name}`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Error',
        description: 'Failed to download file',
        variant: 'destructive',
      });
    }
  };

  const handleUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        try {
          for (let i = 0; i < files.length; i++) {
            await oneDriveClient.uploadFile(currentFolderId, files[i].name, files[i]);
          }
          toast({
            title: 'Success',
            description: `Uploaded ${files.length} file(s)`,
          });
          await loadFiles(currentFolderId);
        } catch (error) {
          console.error('Upload error:', error);
          toast({
            title: 'Error',
            description: 'Failed to upload files',
            variant: 'destructive',
          });
        }
      }
    };
    input.click();
  };

  const handleCreateFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      try {
        await oneDriveClient.createFolder(currentFolderId, folderName);
        toast({
          title: 'Success',
          description: `Created folder "${folderName}"`,
        });
        await loadFiles(currentFolderId);
      } catch (error) {
        console.error('Create folder error:', error);
        toast({
          title: 'Error',
          description: 'Failed to create folder',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDelete = async (item: DriveItem) => {
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        await oneDriveClient.deleteItem(item.id);
        toast({
          title: 'Success',
          description: `Deleted "${item.name}"`,
        });
        await loadFiles(currentFolderId);
      } catch (error) {
        console.error('Delete error:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete item',
          variant: 'destructive',
        });
      }
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing OneDrive...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center max-w-md p-8">
          <div className="mb-6">
            <Folder className="w-20 h-20 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Connect to OneDrive</h2>
            <p className="text-gray-600 mb-6">
              Sign in with your Microsoft account to access your OneDrive files.
              Your credentials are stored locally and securely on your device.
            </p>
          </div>
          <Button onClick={handleLogin} className="w-full" size="lg">
            Sign in with Microsoft
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b p-3 flex items-center justify-between bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={folderStack.length === 1}
            className="text-white hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="font-semibold">
            {folderStack[folderStack.length - 1].name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadFiles(currentFolderId)}
            className="text-white hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCreateFolder}
            className="text-white hover:bg-blue-700"
          >
            <FolderPlus className="w-4 h-4 mr-1" />
            New Folder
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUpload}
            className="text-white hover:bg-blue-700"
          >
            <Upload className="w-4 h-4 mr-1" />
            Upload
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-white hover:bg-blue-700"
          >
            Sign Out
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Folder className="w-16 h-16 mx-auto mb-2 text-gray-400" />
              <p>This folder is empty</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 hover:bg-blue-50 rounded cursor-pointer group"
                onClick={() => item.folder && handleFolderClick(item)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {item.folder ? (
                    <Folder className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  ) : (
                    <File className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.name}</div>
                    {item.size !== undefined && (
                      <div className="text-xs text-gray-500">{formatFileSize(item.size)}</div>
                    )}
                  </div>
                </div>
                {!item.folder && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(item);
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                )}
                {item.folder && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
