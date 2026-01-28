
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
        group relative p-6 bg-white rounded-2xl border border-gray-50 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] 
        hover:shadow-[0_8px_20px_-6px_rgba(6,81,237,0.15)] transition-all cursor-pointer select-none
        flex flex-col items-center justify-center aspect-[4/3]
        ${role === 'admin' ? 'active:cursor-grabbing' : ''}
      `}
            onClick={(e) => {
                if (isDragging) return;
                onOpen(folder.id, folder.name);
            }}
        >
            <div className="mb-4 relative">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-100 group-hover:scale-110 transition-all duration-300">
                    <FolderIcon className="w-8 h-8" strokeWidth={1.5} />
                </div>
            </div>
            <span className="font-semibold text-gray-800 text-center line-clamp-2 px-2 text-sm">{folder.name}</span>
            <p className="text-xs text-gray-400 mt-1">Folder</p>

            {role === 'admin' && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this folder and all contents?')) onDelete(folder.id);
                    }}
                    className="absolute top-3 right-3 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
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
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

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
            console.error(err);
            alert('Failed to delete file');
        }
    };

    const handleReset = async () => {
        try {
            const res = await fetch('/api/admin/reset', { method: 'POST' });
            if (!res.ok) throw new Error('Reset failed');
            setIsResetModalOpen(false);
            setCurrentFolderId(null);
            setBreadcrumbs([]);
            loadData();
            alert('Repository reset successfully');
        } catch (err) {
            alert('Failed to reset repository');
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
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-100 flex flex-col hidden md:flex">
                <div className="p-6 border-b border-gray-50">
                    <h1 className="text-xl font-bold text-gray-800">aosu Privacy</h1>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <button
                        onClick={() => { setCurrentFolderId(null); setBreadcrumbs([]); }}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${!currentFolderId ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <FolderIcon className="w-5 h-5 mr-3" />
                        All Documents
                    </button>
                    {/* Placeholder links for visual completeness */}
                    <div className="text-xs font-semibold text-gray-400 mt-6 mb-2 px-4 uppercase tracking-wider">Manage</div>
                    {role === 'admin' && (
                        <>
                            <button onClick={() => setIsCreateModalOpen(true)} className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
                                <Plus className="w-5 h-5 mr-3" />
                                New Folder
                            </button>
                            <button onClick={() => setIsResetModalOpen(true)} className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors">
                                <Trash2 className="w-5 h-5 mr-3" />
                                Reset Data
                            </button>
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-gray-50">
                    <div className="flex items-center px-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase mr-3">
                            {role[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 capitalize">{role}</p>
                            <p className="text-xs text-gray-500 truncate">Logged in</p>
                        </div>
                        <button
                            onClick={() => {
                                document.cookie = 'auth_session=; Max-Age=0; path=/;';
                                router.push('/login');
                                router.refresh();
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden bg-white border-b border-gray-100 p-4 flex items-center justify-between">
                    <h1 className="text-lg font-bold text-gray-800">aosu Privacy</h1>
                    <div className="flex items-center space-x-2">
                        {/* Mobile interactions could go here */}
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6 md:p-8">
                    {/* Top Bar with Breadcrumbs & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <nav className="flex items-center flex-wrap gap-2 text-sm text-gray-600">
                            <button
                                onClick={() => { setCurrentFolderId(null); setBreadcrumbs([]); }}
                                className={`hover:text-blue-600 font-medium transition-colors ${!currentFolderId ? 'text-gray-900 font-bold' : ''}`}
                            >
                                Repository
                            </button>
                            {breadcrumbs.length > 0 && <span className="text-gray-300">/</span>}
                            {breadcrumbs.map((crumb, idx) => (
                                <div key={crumb.id} className="flex items-center">
                                    <button
                                        onClick={() => handleNavigateUp(idx)}
                                        className={`hover:text-blue-600 transition-colors ${idx === breadcrumbs.length - 1 ? 'font-bold text-gray-900' : ''}`}
                                    >
                                        {crumb.name}
                                    </button>
                                    {idx < breadcrumbs.length - 1 && <ChevronRight className="w-4 h-4 mx-1 text-gray-300" />}
                                </div>
                            ))}
                        </nav>

                        {role === 'admin' && currentFolderId && (
                            <button
                                onClick={() => setIsUploadModalOpen(true)}
                                className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-200 active:transform active:scale-95"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload File
                            </button>
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
                            <div className="bg-white rounded-2xl border border-gray-50 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] overflow-hidden">
                                <div className="px-8 py-5 border-b border-gray-50 flex items-center justify-between bg-white">
                                    <h2 className="font-bold text-gray-800 flex items-center text-lg">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mr-3">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        Files
                                    </h2>
                                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{files.length} items</span>
                                </div>

                                {files.length === 0 ? (
                                    <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                                        <FileText className="w-12 h-12 text-gray-200 mb-3" />
                                        <p>No files in this folder.</p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-gray-50">
                                        {files.map((file) => (
                                            <li key={file.id} className="px-8 py-5 hover:bg-gray-50/80 flex items-center justify-between group transition-colors">
                                                <div className="flex-1 min-w-0 pr-6">
                                                    <div className="flex items-center mb-1">
                                                        <a
                                                            href={file.path}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-base font-semibold text-gray-700 hover:text-blue-600 truncate mr-3 transition-colors"
                                                        >
                                                            {file.name}
                                                        </a>
                                                        {file.remark && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100/50">
                                                                Remark
                                                            </span>
                                                        )}
                                                    </div>

                                                    {file.remark ? (
                                                        <p className="text-sm text-gray-500 mb-2 line-clamp-1">{file.remark}</p>
                                                    ) : null}

                                                    <div className="flex items-center text-xs text-gray-400 font-medium">
                                                        <span>{new Date(file.uploadDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                                        <span className="mx-2">•</span>
                                                        <span className="uppercase">PDF</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center">
                                                    <a
                                                        href={file.path}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-2 text-gray-300 hover:text-blue-600 transition-colors mr-2"
                                                        title="View File"
                                                    >
                                                        <ArrowLeft className="w-5 h-5 rotate-180" />
                                                    </a>
                                                    {role === 'admin' && (
                                                        <button
                                                            onClick={() => {
                                                                if (confirm('Delete this file?')) handleDeleteFile(file.id);
                                                            }}
                                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                                            title="Delete File"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>

                </main>
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

            <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} title="Dangerous: Reset Repository">
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Are you sure you want to delete ALL folders and files?
                        This will reset the database. Actual files in cloud storage might remain but will be unlinked.
                        <br /><br />
                        <strong className="text-red-600">This action cannot be undone.</strong>
                    </p>
                    <div className="flex justify-end pt-2 space-x-3">
                        <button
                            onClick={() => setIsResetModalOpen(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                        >
                            Confirm Reset
                        </button>
                    </div>
                </div>
            </Modal>
        </div >
    );
}
