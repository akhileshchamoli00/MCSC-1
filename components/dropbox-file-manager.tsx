"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Folder, 
  File, 
  Upload, 
  Download, 
  Trash2, 
  FolderPlus, 
  ArrowLeft, 
  Loader2,
  ChevronRight,
  RefreshCw,
  Eye
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";

interface DropboxItem {
  name: string;
  path_lower: string;
  path_display: string;
  type: "file" | "folder";
  size: number;
  client_modified: string | null;
}

export function DropboxFileManager({ 
  basePath, 
  title = "Client Documents" 
}: { 
  basePath: string, 
  title?: string 
}) {
  const [currentPath, setCurrentPath] = useState(basePath);
  const [items, setItems] = useState<DropboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Create folder state
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creating, setCreating] = useState(false);

  // File upload state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Delete item state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchItems(currentPath);
  }, [currentPath]);

  useEffect(() => {
    setCurrentPath(basePath);
  }, [basePath]);

  const fetchItems = async (path: string) => {
    setLoading(true);
    try {
      const fetchPath = path.startsWith(basePath) ? path : basePath;
      const res = await fetch(`${API_URL}/api/dropbox/list?path=${encodeURIComponent(fetchPath)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setItems(data.items);
      } else {
        if (data.detail?.includes("not_found") || data.error?.includes("not_found")) {
           await handleCreateFolder(fetchPath, true);
        } else {
           toast.error(data.detail || data.error || "Failed to load files");
        }
      }
    } catch (err: any) {
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (path: string, silent = false) => {
    if (!silent) setCreating(true);
    try {
      const formData = new FormData();
      formData.append("path", path);
      
      const res = await fetch(`${API_URL}/api/dropbox/folder`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail || "Failed to create folder");
      
      if (!silent) {
        toast.success("Folder created successfully");
        setIsCreateFolderOpen(false);
        setNewFolderName("");
      }
      fetchItems(currentPath);
    } catch (err: any) {
      if (!silent) toast.error(err.message || "Failed to create folder");
    } finally {
      if (!silent) setCreating(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("path", currentPath);
      formData.append("file", selectedFile);

      const res = await fetch(`${API_URL}/api/dropbox/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to upload file");
      
      toast.success("File uploaded successfully");
      setIsUploadOpen(false);
      setSelectedFile(null);
      fetchItems(currentPath);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (path: string, openInNewTab = false) => {
    try {
      const toastId = toast.loading("Generating secure link...");
      const res = await fetch(`${API_URL}/api/dropbox/download?path=${encodeURIComponent(path)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      toast.dismiss(toastId);
      
      if (res.ok && data.success && data.link) {
        if (openInNewTab) {
          window.open(data.link, "_blank");
        } else {
          const link = document.createElement("a");
          link.href = data.link;
          link.download = path.split("/").pop() || "download";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
          throw new Error(data.detail || data.error || "Failed to get download link");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to download file");
    }
  };

  const handleDeleteClick = (path: string) => {
    setItemToDelete(path);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/dropbox/delete?path=${encodeURIComponent(itemToDelete)}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail || "Failed to delete item");
      
      toast.success("Item deleted successfully");
      setIsDeleteOpen(false);
      setItemToDelete(null);
      fetchItems(currentPath);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete item");
    } finally {
      setDeleting(false);
    }
  };

  // Navigate up one directory
  const goBack = () => {
    if (currentPath === basePath || currentPath.length <= basePath.length) return;
    const newPath = currentPath.substring(0, currentPath.lastIndexOf("/"));
    // Ensure we don't go above base path
    setCurrentPath(newPath.length < basePath.length ? basePath : newPath);
  };

  // Breadcrumbs generation
  const pathParts = currentPath.replace(basePath, "").split("/").filter(Boolean);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto text-sm font-medium text-slate-600 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 w-full sm:w-auto shadow-inner">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 text-slate-500 hover:text-slate-900 shrink-0 mr-1"
            onClick={goBack}
            disabled={currentPath === basePath}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div 
            className="cursor-pointer hover:text-slate-900 transition-colors whitespace-nowrap"
            onClick={() => setCurrentPath(basePath)}
          >
            {title}
          </div>
          
          {pathParts.map((part, idx) => {
            const pathSoFar = basePath + "/" + pathParts.slice(0, idx + 1).join("/");
            return (
              <div key={idx} className="flex items-center gap-2 whitespace-nowrap">
                <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                <span 
                  className="cursor-pointer hover:text-slate-900 transition-colors"
                  onClick={() => setCurrentPath(pathSoFar)}
                >
                  {part}
                </span>
              </div>
            );
          })}
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchItems(currentPath)}
            disabled={loading}
            className="hover:bg-slate-100"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsCreateFolderOpen(true)}
            className="hover:bg-slate-100"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button size="sm" onClick={() => setIsUploadOpen(true)} className="bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-all hover:shadow-lg">
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </div>
      </div>

      {/* File List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4 hidden sm:table-cell">Modified</th>
                <th className="px-6 py-4 hidden md:table-cell">Size</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-slate-400" />
                    <p>Loading documents from Dropbox...</p>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <div className="bg-slate-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-inner">
                      <Folder className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-base font-medium text-slate-900 mb-1">This folder is empty</p>
                    <p className="text-sm">Upload files or create folders to get started.</p>
                  </td>
                </tr>
              ) : (
                items.sort((a, b) => {
                  // Folders first
                  if (a.type === 'folder' && b.type === 'file') return -1;
                  if (a.type === 'file' && b.type === 'folder') return 1;
                  return a.name.localeCompare(b.name);
                }).map((item, idx) => (
                  <tr 
                    key={idx} 
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-6 py-3">
                      <div 
                        className={`flex items-center gap-3 ${item.type === 'folder' ? 'cursor-pointer group-hover:text-blue-600' : ''}`}
                        onClick={() => item.type === 'folder' ? setCurrentPath(item.path_display) : null}
                      >
                        {item.type === 'folder' ? (
                          <Folder className="h-5 w-5 text-blue-500 fill-blue-500/20" />
                        ) : (
                          <File className="h-5 w-5 text-slate-400" />
                        )}
                        <span className="font-medium truncate max-w-[200px] sm:max-w-[400px]">
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-slate-500 hidden sm:table-cell">
                      {item.client_modified ? format(new Date(item.client_modified), 'MMM d, yyyy HH:mm') : '--'}
                    </td>
                    <td className="px-6 py-3 text-slate-500 hidden md:table-cell">
                      {item.type === 'folder' ? '--' : formatSize(item.size)}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.type === 'file' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                              onClick={() => handleDownload(item.path_display, true)}
                              title="Preview"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                              onClick={() => handleDownload(item.path_display)}
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteClick(item.path_display)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Folder Modal */}
      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Folder Name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newFolderName.trim()) {
                  handleCreateFolder(`${currentPath}/${newFolderName.trim()}`);
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => handleCreateFolder(`${currentPath}/${newFolderName.trim()}`)} 
              disabled={creating || !newFolderName.trim()}
              className="bg-slate-900 text-white"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FolderPlus className="h-4 w-4 mr-2" />}
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload File Modal */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload File to Dropbox</DialogTitle>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
            <input
              type="file"
              id="dropbox-file-upload"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
            />
            <label 
              htmlFor="dropbox-file-upload" 
              className="cursor-pointer flex flex-col items-center p-4 w-full h-full"
            >
              <Upload className="h-10 w-10 text-slate-400 mb-3" />
              {selectedFile ? (
                <div className="text-center">
                  <p className="font-medium text-slate-900">{selectedFile.name}</p>
                  <p className="text-sm text-slate-500 mt-1">{formatSize(selectedFile.size)}</p>
                  <p className="text-xs text-blue-600 font-medium mt-2">Click to change file</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="font-medium text-slate-700">Click to select a file</p>
                  <p className="text-sm text-slate-500 mt-1">Upload securely to {currentPath.split('/').pop() || 'Documents'}</p>
                </div>
              )}
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsUploadOpen(false);
              setSelectedFile(null);
            }}>Cancel</Button>
            <Button 
              onClick={handleUpload} 
              disabled={uploading || !selectedFile}
              className="bg-slate-900 text-white"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to delete <span className="font-semibold text-slate-955">{itemToDelete?.split("/").pop()}</span>? This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => {
              setIsDeleteOpen(false);
              setItemToDelete(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={confirmDelete} 
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700 font-medium"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
