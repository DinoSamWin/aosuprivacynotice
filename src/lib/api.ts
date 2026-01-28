
import { Folder, FileStr } from './types';

export const fetchFolders = async (parentId: string | null = null) => {
    const params = new URLSearchParams();
    if (parentId) params.append('parentId', parentId);
    else params.append('parentId', 'null');

    const res = await fetch(`/api/folders?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch folders');
    return res.json() as Promise<Folder[]>;
};

export const createFolder = async (name: string, parentId: string | null) => {
    const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId }),
    });
    if (!res.ok) throw new Error('Failed to create folder');
    return res.json() as Promise<Folder>;
};

export const updateFolderOrder = async (items: { id: string; order: number }[]) => {
    const res = await fetch('/api/folders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
    });
    if (!res.ok) throw new Error('Failed to update order');
    return res.json();
};

export const deleteFolder = async (id: string) => {
    const res = await fetch(`/api/folders/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete folder');
    return res.json();
};

export const fetchFiles = async (folderId: string | null) => {
    const params = new URLSearchParams({ folderId: folderId || 'null' });
    const res = await fetch(`/api/files?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch files');
    return res.json() as Promise<FileStr[]>;
};

export const uploadFile = async (folderId: string | null, file: File, remark: string) => {
    const formData = new FormData();
    formData.append('folderId', folderId || 'null');
    formData.append('file', file);
    formData.append('remark', remark);

    const res = await fetch('/api/files', {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload file');
    return res.json() as Promise<FileStr>;
};

export const deleteFile = async (id: string) => {
    const res = await fetch(`/api/files/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete file');
    return res.json();
};
