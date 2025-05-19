import { google } from 'googleapis';
import { authenticate } from '@google-cloud/local-auth';
import { join } from 'path';
import { cwd } from 'process';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

export class GoogleDriveService {
  private static instance: GoogleDriveService;
  private drive;
  private auth;

  private constructor() {
    this.drive = null;
    this.auth = null;
  }

  public static getInstance(): GoogleDriveService {
    if (!GoogleDriveService.instance) {
      GoogleDriveService.instance = new GoogleDriveService();
    }
    return GoogleDriveService.instance;
  }

  async initialize() {
    if (this.auth) return;

    try {
      this.auth = await authenticate({
        keyfilePath: join(cwd(), 'credentials.json'),
        scopes: SCOPES,
      });

      this.drive = google.drive({ version: 'v3', auth: this.auth });
    } catch (error) {
      console.error('Failed to initialize Google Drive service:', error);
      throw error;
    }
  }

  async listFolderContents(folderId: string) {
    if (!this.drive) {
      await this.initialize();
    }

    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType, modifiedTime, thumbnailLink)',
        pageSize: 100,
      });

      return response.data.files || [];
    } catch (error) {
      console.error('Failed to list folder contents:', error);
      throw error;
    }
  }

  async getFolderMetadata(folderId: string) {
    if (!this.drive) {
      await this.initialize();
    }

    try {
      const response = await this.drive.files.get({
        fileId: folderId,
        fields: 'id, name, mimeType, modifiedTime',
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get folder metadata:', error);
      throw error;
    }
  }
}
