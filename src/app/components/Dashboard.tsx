
'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Folder as FolderIcon,
    FileText,
    FileSpreadsheet,
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
import Image from 'next/image';

import { Folder, FileStr } from '@/lib/types';
import * as api from '@/lib/api';
import Modal from './ui/Modal';

interface DashboardProps {
    role: 'admin' | 'guest';
}

// Sortable Folder Item - Quick Access Style
function SortableFolderItem({ folder, role, onOpen, onDelete }: {
    folder: Folder;
    role: 'admin' | 'guest';
    onOpen: (id: string, name: string) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: folder.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => onOpen(folder.id, folder.name)}
            className="group relative bg-white aspect-square rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 border border-gray-100 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:-translate-y-1"
        >
            <div className="w-20 h-20 bg-gray-50 rounded-[1.5rem] flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors mb-4">
                <FolderIcon className="w-10 h-10 fill-current" />
            </div>

            <h3 className="font-bold text-blue-600 text-center text-sm truncate w-full px-2 group-hover:text-blue-700 transition-colors">
                {folder.name}
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-1">10 files</p>

            {role === 'admin' && (
                <button
                    onClick={(e) => onDelete(folder.id, e)}
                    className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}

// Sortable File Item
function SortableFileItem({ file, index, role, onDelete }: {
    file: FileStr;
    index: number;
    role: 'admin' | 'guest';
    onDelete: (e: React.MouseEvent) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: file.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
    };

    const getFileUrl = (file: FileStr) => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        const officeExts = ['xlsx', 'xls', 'docx', 'doc', 'pptx', 'ppt'];
        if (ext && officeExts.includes(ext)) {
            return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.path)}`;
        }
        return file.path;
    };

    const getFileIcon = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf': return <FileText className="w-5 h-5 text-red-500" />;
            case 'xlsx':
            case 'xls': return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
            case 'docx':
            case 'doc': return <FileText className="w-5 h-5 text-blue-600" />;
            case 'pptx':
            case 'ppt': return <FileText className="w-5 h-5 text-orange-500" />;
            case 'jpg':
            case 'jpeg':
            case 'png': return <FileText className="w-5 h-5 text-purple-600" />;
            default: return <FileText className="w-5 h-5 text-gray-400" />;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`relative mb-8 last:mb-0 group ${isDragging ? 'opacity-50' : ''}`}
        >
            {/* Version Node */}
            <div className="absolute -left-[29px] top-6 flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 border-4 border-white shadow-sm z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>

            {/* Version Label */}
            <div className="mb-3 pl-4">
                <h3 className="text-sm font-bold text-gray-800">version {index + 1}</h3>
            </div>

            {/* File Card */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all flex items-center gap-4 cursor-grab active:cursor-grabbing ml-4">
                {/* Icon */}
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    {getFileIcon(file.name)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                            <a
                                href={getFileUrl(file)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-base font-bold text-gray-800 hover:text-blue-600 transition-colors truncate block max-w-[300px]"
                                onPointerDown={(e) => e.stopPropagation()} // Allow click to open
                            >
                                {file.name}
                            </a>
                            {file.remark && (
                                <span className="bg-red-50 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded border border-red-100">
                                    {file.remark}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-xs text-gray-400 font-medium">
                                {new Date(file.uploadDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                            <div className="text-xs text-gray-400 font-bold">-- MB</div>
                            {role === 'admin' && (
                                <button
                                    onClick={onDelete}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
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
    const [fileToDelete, setFileToDelete] = useState<FileStr | null>(null);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Load Data
    const loadData = async () => {
        try {
            const foldersData = await api.fetchFolders(currentFolderId);
            setFolders(foldersData);

            // Always fetch files (handles null for root)
            const filesData = await api.fetchFiles(currentFolderId);
            // Sort files by order if present (though backend should handle it, client sort is safer visual)
            const sortedFiles = filesData.sort((a, b) => (a.order || 0) - (b.order || 0));
            setFiles(sortedFiles);
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
        if (!uploadFile) return;
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

    const confirmDeleteFile = async () => {
        if (!fileToDelete) return;
        try {
            await api.deleteFile(fileToDelete.id);
            setFileToDelete(null);
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

        // Check if dragging folder or file
        const isFolder = folders.some(f => f.id === active.id);

        if (isFolder) {
            setFolders((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                const updates = newItems.map((item, index) => ({ id: item.id, order: index }));
                api.updateFolderOrder(updates);

                return newItems;
            });
        } else {
            // Dragging File
            setFiles((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                const updates = newItems.map((item, index) => ({ id: item.id, order: index }));
                api.updateFileOrder(updates); // Call API to update order

                return newItems;
            });
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar - INFINITE Style */}
            <div className="w-64 bg-white border-r border-gray-100 flex flex-col hidden md:flex p-6">
                {/* Logo */}
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="relative w-8 h-8">
                        <Image
                            src="/logo.png"
                            alt="Logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight">aosu Privacy</h1>
                </div>

                {/* Primary Action Button */}
                {role === 'admin' && (
                    <div className="mb-8">
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-3.5 px-4 font-semibold text-sm flex items-center justify-center shadow-lg shadow-blue-200 transition-all hover:shadow-blue-300 active:scale-95"
                        >
                            Add New File
                            <div className="ml-3 bg-white/20 rounded-lg p-0.5">
                                <Plus className="w-4 h-4" />
                            </div>
                        </button>
                    </div>
                )}

                <nav className="flex-1 space-y-2">
                    <button
                        onClick={() => { setCurrentFolderId(null); setBreadcrumbs([]); }}
                        className={`w-full flex items-center px-4 py-3.5 text-sm font-semibold rounded-2xl transition-all ${!currentFolderId ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                    >
                        <FolderIcon className={`w-5 h-5 mr-4 ${!currentFolderId ? 'text-blue-600' : 'text-gray-400'}`} />
                        Home
                    </button>

                    {currentFolderId && (
                        <button
                            className="w-full flex items-center px-4 py-3.5 text-sm font-semibold rounded-2xl bg-blue-50 text-blue-600 transition-all"
                        >
                            <FolderIcon className="w-5 h-5 mr-4 text-blue-600" />
                            My Files
                        </button>
                    )}

                    {role === 'admin' && (
                        <>
                            <button onClick={() => setIsCreateModalOpen(true)} className="w-full flex items-center px-4 py-3.5 text-sm font-semibold text-gray-500 rounded-2xl hover:text-gray-900 hover:bg-gray-50 transition-all">
                                <Plus className="w-5 h-5 mr-4 text-gray-400" />
                                New Folder
                            </button>
                            <button onClick={() => setIsResetModalOpen(true)} className="w-full flex items-center px-4 py-3.5 text-sm font-semibold text-gray-500 rounded-2xl hover:text-red-600 hover:bg-red-50 transition-all group">
                                <Trash2 className="w-5 h-5 mr-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                                Trash
                            </button>
                        </>
                    )}
                </nav>

                {/* User Profile Mini */}
                <div className="mt-auto pt-6 border-t border-gray-100">
                    <div className="flex items-center px-2">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm mr-3">
                            <span className="text-gray-500 font-bold text-sm uppercase">{role[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 capitalize">{role}</p>
                            <p className="text-xs text-gray-400 truncate">Personal</p>
                        </div>
                        <button
                            onClick={() => {
                                document.cookie = 'auth_session=; Max-Age=0; path=/;';
                                router.push('/login');
                                router.refresh();
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 rounded-lg"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
                {/* Mobile Header */}
                <header className="md:hidden bg-white border-b border-gray-100 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="relative w-6 h-6">
                            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                        </div>
                        <h1 className="text-lg font-bold text-gray-800">aosu Privacy</h1>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-8 relative flex flex-col h-full">
                    {/* Header: Breadcrumbs (Search Removed) */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 flex-shrink-0">
                        <nav className="flex items-center flex-wrap gap-2 text-lg text-gray-800 font-bold">
                            <button
                                onClick={() => { setCurrentFolderId(null); setBreadcrumbs([]); }}
                                className={`hover:text-blue-600 transition-colors ${!currentFolderId ? 'text-gray-900' : 'text-gray-400 font-medium'}`}
                            >
                                Repository
                            </button>
                            {breadcrumbs.length > 0 && <span className="text-gray-300">/</span>}
                            {breadcrumbs.map((crumb, idx) => (
                                <div key={crumb.id} className="flex items-center">
                                    <button
                                        onClick={() => handleNavigateUp(idx)}
                                        className={`hover:text-blue-600 transition-colors ${idx === breadcrumbs.length - 1 ? 'text-gray-900' : 'text-gray-400 font-medium'}`}
                                    >
                                        {crumb.name}
                                    </button>
                                    {idx < breadcrumbs.length - 1 && <ChevronRight className="w-5 h-5 mx-1 text-gray-300" />}
                                </div>
                            ))}
                        </nav>
                    </div>

                    {/* Folders Grid - Always Visible if folders exist */}
                    {folders.length > 0 && (
                        <div className="mb-10 flex-shrink-0">
                            <h2 className="text-lg font-bold text-gray-800 mb-6">Folders</h2>
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={folders.map(f => f.id)}
                                    strategy={rectSortingStrategy}
                                >
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
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
                        </div>
                    )}




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
                </form >
            </Modal >

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

            {/* Delete File Modal */}
            <Modal isOpen={!!fileToDelete} onClose={() => setFileToDelete(null)} title="Delete File">
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Are you sure you want to delete <strong>{fileToDelete?.name}</strong>?
                    </p>
                    <div className="flex justify-end pt-2 space-x-3">
                        <button
                            onClick={() => setFileToDelete(null)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDeleteFile}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div >
    );
}
