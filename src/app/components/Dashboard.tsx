
'use client';

import { useState, useEffect } from 'react';
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
    onOpen: (id: string) => void;
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
            onClick={() => onOpen(folder.id)}
            className="group relative bg-white aspect-square rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 border border-gray-100 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:-translate-y-1"
        >
            <div className="w-20 h-20 bg-gray-50 rounded-[1.5rem] flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors mb-4">
                <FolderIcon className="w-10 h-10 fill-current" />
            </div>

            <h3 className="font-bold text-gray-700 text-center text-sm truncate w-full px-2 group-hover:text-blue-600 transition-colors">
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
            case 'ppt': return <FileText className="w-5 h-5 text-orange-500" />; // using FileText as placeholder if Presentation icon not imported, or import it
            case 'jpg':
            case 'jpeg':
            case 'png': return <FileText className="w-5 h-5 text-purple-600" />; // Image icon would be better
            default: return <FileText className="w-5 h-5 text-gray-400" />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar - INFINITE Style */}
            <div className="w-64 bg-white border-r border-gray-100 flex flex-col hidden md:flex p-6">
                {/* Logo */}
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
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
                    <h1 className="text-lg font-bold text-gray-800">aosu Privacy</h1>
                </header>

                <main className="flex-1 overflow-auto p-8">
                    {/* Header: Search & Breadcrumbs */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div className="flex bg-white rounded-2xl px-5 py-3 shadow-sm border border-gray-100/50 w-full max-w-md items-center">
                            <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input type="text" placeholder="Search" className="bg-transparent border-none outline-none text-sm w-full text-gray-600 placeholder-gray-400" />
                            <svg className="w-5 h-5 text-gray-400 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Optional Info Box could go here like in reference */}
                        </div>
                    </div>

                    {/* Quick Access (Folders) */}
                    <div className="mb-10">
                        <h2 className="text-lg font-bold text-gray-800 mb-6">Quick Access</h2>
                        {folders.length > 0 ? (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={folders.map(f => f.id)}
                                    strategy={rectSortingStrategy}
                                >
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
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
                        ) : (
                            <div className="text-gray-400 text-sm italic">No folders found.</div>
                        )}
                    </div>

                    {/* Recents (Files) */}
                    {currentFolderId && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-gray-800">Recents</h2>
                                <div className="flex gap-2">
                                    <button className="p-2 rounded-lg hover:bg-white transition-colors text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg></button>
                                    <button className="p-2 rounded-lg bg-blue-100 text-blue-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
                                </div>
                            </div>

                            {/* Table Header look-alike */}
                            <div className="grid grid-cols-12 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-6">
                                <div className="col-span-6">Name</div>
                                <div className="col-span-3 text-right">Modified</div>
                                <div className="col-span-3 text-right">Size</div>
                            </div>

                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100/50 overflow-hidden">
                                {files.length === 0 ? (
                                    <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                                        <FileText className="w-12 h-12 text-gray-200 mb-3" />
                                        <p>No files in this folder.</p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-gray-50">
                                        {files.map((file) => (
                                            <li key={file.id} className="px-6 py-4 hover:bg-gray-50/50 flex items-center justify-between group transition-colors">
                                                <div className="flex-1 min-w-0 grid grid-cols-12 items-center">

                                                    {/* Name Col */}
                                                    <div className="col-span-6 flex items-center pr-6">
                                                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl mr-4">
                                                            {getFileIcon(file.name)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <a
                                                                href={getFileUrl(file)}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors block truncate"
                                                            >
                                                                {file.name}
                                                            </a>
                                                            {/* Inline Remark */}
                                                            {file.remark && (
                                                                <span className="inline-block mt-1 px-2 py-0.5 bg-[#FFF5F2] text-orange-600 text-[10px] font-bold rounded border border-[#FFE3DC]">
                                                                    {file.remark}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Modified Col */}
                                                    <div className="col-span-3 text-right text-xs text-gray-500 font-medium">
                                                        {new Date(file.uploadDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>

                                                    {/* Size Col (Placeholder) & Actions */}
                                                    <div className="col-span-3 flex items-center justify-end gap-4">
                                                        <span className="text-xs text-gray-500 font-bold">-- MB</span>
                                                        <button className="text-gray-300 hover:text-gray-500">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}
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
        </div >
    );
}
