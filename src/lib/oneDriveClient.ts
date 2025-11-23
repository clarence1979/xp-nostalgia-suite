import { Client } from '@microsoft/microsoft-graph-client';
import { oneDriveAuth } from './oneDriveAuth';

export interface DriveItem {
  id: string;
  name: string;
  size?: number;
  folder?: { childCount: number };
  file?: { mimeType: string };
  webUrl: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  parentReference?: {
    path: string;
    id: string;
  };
}

class OneDriveClientService {
  private client: Client | null = null;

  private async getClient(): Promise<Client> {
    if (!this.client) {
      const token = await oneDriveAuth.getAccessToken();
      this.client = Client.init({
        authProvider: (done) => {
          done(null, token);
        },
      });
    }
    return this.client;
  }

  async listFiles(folderId: string = 'root'): Promise<DriveItem[]> {
    try {
      const client = await this.getClient();
      const response = await client
        .api(`/me/drive/items/${folderId}/children`)
        .get();
      return response.value;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  async downloadFile(fileId: string): Promise<Blob> {
    try {
      const client = await this.getClient();
      const response = await client
        .api(`/me/drive/items/${fileId}/content`)
        .get();
      return response;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  async uploadFile(folderId: string, fileName: string, file: File): Promise<DriveItem> {
    try {
      const client = await this.getClient();
      const response = await client
        .api(`/me/drive/items/${folderId}:/${fileName}:/content`)
        .put(file);
      return response;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async createFolder(parentId: string, folderName: string): Promise<DriveItem> {
    try {
      const client = await this.getClient();
      const response = await client
        .api(`/me/drive/items/${parentId}/children`)
        .post({
          name: folderName,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename',
        });
      return response;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  async deleteItem(itemId: string): Promise<void> {
    try {
      const client = await this.getClient();
      await client.api(`/me/drive/items/${itemId}`).delete();
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }

  resetClient() {
    this.client = null;
  }
}

export const oneDriveClient = new OneDriveClientService();
