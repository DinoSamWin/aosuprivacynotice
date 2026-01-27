
import fs from 'fs/promises';
import path from 'path';
import { DataStore, Folder, FileStr } from './types';
import { v4 as uuidv4 } from 'uuid';
import { kv } from '@vercel/kv';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'store.json');

const INITIAL_DATA: DataStore = {
    folders: [],
    files: []
};

// Check if we are running in Vercel KV mode
const USE_KV = !!process.env.KV_REST_API_URL;

async function ensureDataFile() {
    if (USE_KV) return;
    try {
        await fs.access(DATA_FILE_PATH);
    } catch (error) {
        await fs.writeFile(DATA_FILE_PATH, JSON.stringify(INITIAL_DATA, null, 2));
    }
}

export async function getStore(): Promise<DataStore> {
    if (USE_KV) {
        const data = await kv.get<DataStore>('store_data');
        return data || INITIAL_DATA;
    }

    await ensureDataFile();
    const data = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    return JSON.parse(data);
}

export async function saveStore(data: DataStore): Promise<void> {
    if (USE_KV) {
        await kv.set('store_data', data);
        return;
    }

    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2));
}

// Helper methods

export async function getFolders(parentId: string | null = null): Promise<Folder[]> {
    const store = await getStore();
    return store.folders
        .filter(f => f.parentId === parentId)
        .sort((a, b) => a.order - b.order);
}

export async function createFolder(name: string, parentId: string | null): Promise<Folder> {
    const store = await getStore();
    const newFolder: Folder = {
        id: uuidv4(),
        name,
        parentId,
        order: store.folders.filter(f => f.parentId === parentId).length
    };
    store.folders.push(newFolder);
    await saveStore(store);
    return newFolder;
}

export async function deleteFolder(id: string): Promise<void> {
    const store = await getStore();

    // Recursive delete check or implementation needed?
    // User asked for "delete folders (recursively or empty only)".
    // For simplicity MVP: Recursive delete.

    const idsToDelete = new Set<string>();
    const collectIds = (folderId: string) => {
        idsToDelete.add(folderId);
        store.folders.filter(f => f.parentId === folderId).forEach(f => collectIds(f.id));
    };
    collectIds(id);

    store.folders = store.folders.filter(f => !idsToDelete.has(f.id));
    store.files = store.files.filter(f => !idsToDelete.has(f.folderId)); // Orphans due to folder delete
    // Ideally delete actual files too, but for MVP we might leave them or handle separately.
    // Implementation Note: Physical file deletion should be handled by the caller or here. 
    // Let's assume caller handles it or we leak files for now to keep safe.

    await saveStore(store);
}

export async function updateFolderOrder(items: { id: string; order: number }[]): Promise<void> {
    const store = await getStore();
    items.forEach(item => {
        const folder = store.folders.find(f => f.id === item.id);
        if (folder) {
            folder.order = item.order;
        }
    });
    await saveStore(store);
}

export async function addFile(file: FileStr): Promise<void> {
    const store = await getStore();
    store.files.push(file);
    await saveStore(store);
}

export async function deleteFile(id: string): Promise<void> {
    const store = await getStore();
    store.files = store.files.filter(f => f.id !== id);
    await saveStore(store);
}
