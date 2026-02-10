export type AccessLevel = 'admin' | 'guest' | null;

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
}

export interface FileStr {
  id: string;
  name: string;
  folderId: string;
  remark?: string;
  path: string; // Relative path in public/uploads or absolute URL
  uploadDate: string;
  order: number;
}

export interface DataStore {
  folders: Folder[];
  files: FileStr[];
}
