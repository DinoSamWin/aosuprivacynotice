
'use client';

import { useState, useEffect } from 'react';
import {
    Folder as FolderIcon,
    FileText,
    Plus,
    Upload,
    Trash2,
    ChevronRight,
    ArrowLeft,
    MoreVertical,
    LogOut
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRouter } from 'next/navigation';

import { Folder, FileStr } from '@/lib/types';
import * as api from '@/lib/api';
import Modal from './ui/Modal';

interface DashboardProps {
    role: 'admin' | 'guest';
}

function SortableFolderItem({ folder, role, onOpen, onDelete }: {
    folder: Folder;
    role: 'admin' | 'guest';
    onOpen: (id: string, name: string) => void;
    onDelete: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: folder.id, disabled: role !== 'admin' });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`
        group relative p-4 bg-white rounded-xl border border-gray-100 shadow-sm 
        hover:shadow-md transition-all cursor-pointer select-none
        ${role === 'admin' ? 'active:cursor-grabbing' : ''}
      `}
            onClick={(e) => {
                // Prevent click when dragging or clicking actions
                if (isDragging) return;
                onOpen(folder.id, folder.name);
            }}
        >
            <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
                    <FolderIcon className="w-8 h-8 text-blue-500" />
                </div>
                <span className="font-medium text-gray-700 truncate w-full px-2 text-sm">{folder.name}</span>
            </div>

            {role === 'admin' && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this folder and all contents?')) onDelete(folder.id);
                    }}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}

export default function Dashboard({ role }: DashboardProps) {
    const router = useRouter();

    // State
    const [folders, setFolders] = useState<Folder[]>([]);
    const [files, setFiles] = useState<FileStr[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<{ id: string, name: string }[]>([]);

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadRemark, setUploadRemark] = useState('');

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), // Distance 8 to allow click
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Load Data
    const loadData = async () => {
        try {
            const foldersData = await api.fetchFolders(currentFolderId);
            setFolders(foldersData);

            if (currentFolderId) {
                const filesData = await api.fetchFiles(currentFolderId);
                setFiles(filesData);
            } else {
                setFiles([]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentFolderId]);

    // Handlers
    const handleOpenFolder = (id: string, name: string) => {
        setCurrentFolderId(id);
        setBreadcrumbs([...breadcrumbs, { id, name }]);
    };

    const handleNavigateUp = (index: number) => {
        if (index === -1) {
            setCurrentFolderId(null);
            setBreadcrumbs([]);
        } else {
            const target = breadcrumbs[index];
            setCurrentFolderId(target.id);
            setBreadcrumbs(breadcrumbs.slice(0, index + 1));
        }
    };

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;
        try {
            await api.createFolder(newFolderName, currentFolderId);
            setNewFolderName('');
            setIsCreateModalOpen(false);
            loadData();
        } catch (err) {
            alert('Failed to create folder');
        }
    };

    const handleUploadFile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile || !currentFolderId) return;
        try {
            await api.uploadFile(currentFolderId, uploadFile, uploadRemark);
            setUploadFile(null);
            setUploadRemark('');
            setIsUploadModalOpen(false);
            loadData();
        } catch (err) {
            alert('Failed to upload file');
        }
    };

    const handleDeleteFolder = async (id: string) => {
        try {
            await api.deleteFolder(id);
            loadData();
        } catch (err) {
            alert('Failed to delete folder');
        }
    };

    const handleDeleteFile = async (id: string) => {
        try {
            await api.deleteFile(id);
            loadData();
        } catch (err) {
            alert('Failed to delete file');
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (role !== 'admin' || !over || active.id === over.id) return;

        setFolders((items) => {
            const oldIndex = items.findIndex((i) => i.id === active.id);
            const newIndex = items.findIndex((i) => i.id === over.id);
            const newItems = arrayMove(items, oldIndex, newIndex);

            // Update order in background
            const updates = newItems.map((item, index) => ({ id: item.id, order: index }));
            api.updateFolderOrder(updates);

            return newItems;
        });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Document Repository</h1>
                    <p className="text-sm text-gray-500 mt-1">Logged in as: <span className="font-semibold capitalize">{role}</span></p>
                </div>
                <div className="flex items-center space-x-4">
                    {/* Logout could be just deleting cookie, but sticking to basics: reload/clear */}
                    <button
                        onClick={() => {
                            document.cookie = 'auth_session=; Max-Age=0; path=/;';
                            router.push('/login');
                            router.refresh();
                        }}
                        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </button>
                </div>
            </div>

            {/* Breadcrumbs & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <nav className="flex items-center flex-wrap gap-2 text-sm text-gray-600">
                    <button
                        onClick={() => handleNavigateUp(-1)}
                        className="hover:text-blue-600 font-medium transition-colors"
                    >
                        Home
                    </button>

                    {breadcrumbs.map((crumb, idx) => (
                        <div key={crumb.id} className="flex items-center">
                            <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />
                            <button
                                onClick={() => handleNavigateUp(idx)}
                                className={`hover:text-blue-600 transition-colors ${idx === breadcrumbs.length - 1 ? 'font-semibold text-gray-900' : ''}`}
                            >
                                {crumb.name}
                            </button>
                        </div>
                    ))}
                </nav>

                {role === 'admin' && (
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-sm active:transform active:scale-95"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Folder
                        </button>
                        {currentFolderId && (
                            <button
                                onClick={() => setIsUploadModalOpen(true)}
                                className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all shadow-sm active:transform active:scale-95"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload File
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="space-y-8">
                {/* Folders */}
                {folders.length > 0 && (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={folders.map(f => f.id)}
                            strategy={rectSortingStrategy}
                        >
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {folders.map((folder) => (
                                    <SortableFolderItem
                                        key={folder.id}
                                        folder={folder}
                                        role={role}
                                        onOpen={handleOpenFolder}
                                        onDelete={handleDeleteFolder}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}

                {/* Empty State for Root */}
                {folders.length === 0 && !currentFolderId && (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                            <FolderIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Empty Repository</h3>
                        <p className="text-gray-500 mt-1">Start by creating a folder.</p>
                    </div>
                )}

                {/* Files (Only in folders) */}
                {currentFolderId && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-blue-500" />
                                Files
                            </h2>
                            {/* Optional: Simple count or info */}
                        </div>

                        {files.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No files in this folder.
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {files.map((file) => (
                                    <li key={file.id} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between group transition-colors">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <a
                                                href={file.path}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block"
                                            >
                                                {file.name}
                                            </a>
                                            {file.remark && (
                                                <div className="mt-2 text-sm text-gray-800 bg-amber-50 border border-amber-200 p-2 rounded-md flex items-start">
                                                    <span className="font-semibold text-amber-600 mr-2 text-xs uppercase tracking-wide shrink-0 pt-0.5">Remark:</span>
                                                    <span>{file.remark}</span>
                                                </div>
                                            )}
                                            <span className="text-xs text-gray-400 mt-2 block">
                                                {new Date(file.uploadDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {role === 'admin' && (
                                            <button
                                                onClick={() => {
                                                    if (confirm('Delete this file?')) handleDeleteFile(file.id);
                                                }}
                                                className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Folder">
                <form onSubmit={handleCreateFolder}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Folder Name</label>
                            <input
                                type="text"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. Policies 2024"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                                Create Folder
                            </button>
                        </div>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload File">
                <form onSubmit={handleUploadFile}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select File</label>
                            <input
                                type="file"
                                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Remark / Note</label>
                            <textarea
                                value={uploadRemark}
                                onChange={(e) => setUploadRemark(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Enter a description for this file..."
                                rows={3}
                            />
                        </div>
                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={!uploadFile}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Upload
                            </button>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
