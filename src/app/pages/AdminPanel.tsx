import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import {
  Shield, Users, FileText, Upload, Plus, Trash2,
  Edit, Database, Search, Loader2, CheckCircle2, Clock, X,
  FolderOpen, Copy, AlertCircle, LayoutDashboard,
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import { useAuth } from '@/app/context/AuthContext';
import {
  getAreas, createArea, updateArea,
  getAdminUsers, createAdminUser, updateAdminUser,
  getKnowledgeBases, createKnowledgeBase, deleteKnowledgeBase,
  getDocuments, uploadFile, getIndexStatus,
  type Area, type AdminUser, type KnowledgeBase, type DocumentItem,
} from '@/lib/api';

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-500 text-sm">{label}</span>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    OWNER: 'bg-purple-100 text-purple-700 border-purple-200',
    ADMIN: 'bg-amber-100 text-amber-700 border-amber-200',
    EMPLOYEE: 'bg-green-100 text-green-700 border-green-200',
  };
  return <Badge className={map[role] ?? 'bg-gray-100 text-gray-600'}>{role}</Badge>;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Areas ──
  const [areas, setAreas] = useState<Area[]>([]);
  const [areasLoading, setAreasLoading] = useState(true);
  const [areaDialog, setAreaDialog] = useState(false);
  const [areaForm, setAreaForm] = useState({ name: '', description: '' });
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [areaSubmitting, setAreaSubmitting] = useState(false);

  // ── Users ──
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userDialog, setUserDialog] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'EMPLOYEE' as 'ADMIN' | 'EMPLOYEE', area_ids: [] as string[] });
  const [userSubmitting, setUserSubmitting] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  // ── Documents ──
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [docSearch, setDocSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const pollingMap = useState<Map<string, number>>(() => new Map())[0];

  // ── Knowledge Bases ──
  const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
  const [kbsLoading, setKbsLoading] = useState(true);
  const [kbDialog, setKbDialog] = useState(false);
  const [kbForm, setKbForm] = useState({ area_id: '', dify_dataset_id: '', name: '' });
  const [kbSubmitting, setKbSubmitting] = useState(false);

  // ── Load data ──
  useEffect(() => {
    loadAreas();
    loadUsers();
    loadDocuments();
    loadKbs();
    return () => { pollingMap.forEach(clearInterval); pollingMap.clear(); };
  }, []);

  async function loadAreas() {
    try { setAreas(await getAreas()); }
    catch (e: any) { toast.error('No se pudieron cargar las áreas', { description: e.message }); }
    finally { setAreasLoading(false); }
  }

  async function loadUsers() {
    try { setUsers(await getAdminUsers()); }
    catch (e: any) { toast.error('No se pudieron cargar los usuarios', { description: e.message }); }
    finally { setUsersLoading(false); }
  }

  async function loadDocuments() {
    try {
      const items = await getDocuments();
      setDocuments(items);
      items.forEach(d => {
        if (d.status && !['completed', 'error'].includes(d.status)) startPolling(d.id);
      });
    } catch (e: any) { toast.error('No se pudieron cargar los documentos', { description: e.message }); }
    finally { setDocsLoading(false); }
  }

  async function loadKbs() {
    try { setKbs(await getKnowledgeBases()); }
    catch (e: any) { toast.error('No se pudieron cargar las knowledge bases', { description: e.message }); }
    finally { setKbsLoading(false); }
  }

  // ── Polling for document indexing ──
  function startPolling(docId: string) {
    if (pollingMap.has(docId)) return;
    const id = window.setInterval(async () => {
      try {
        const s = await getIndexStatus(docId);
        setDocuments(prev => prev.map(d => d.id === s.id ? { ...d, status: s.technicalStatus, percent: s.percent } : d));
        if (s.technicalStatus === 'completed' || s.technicalStatus === 'error') {
          clearInterval(pollingMap.get(docId));
          pollingMap.delete(docId);
        }
      } catch { /* keep polling */ }
    }, 3000);
    pollingMap.set(docId, id);
  }

  // ── Area handlers ──
  function openCreateArea() { setEditingArea(null); setAreaForm({ name: '', description: '' }); setAreaDialog(true); }
  function openEditArea(a: Area) { setEditingArea(a); setAreaForm({ name: a.name, description: a.description ?? '' }); setAreaDialog(true); }

  async function handleAreaSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAreaSubmitting(true);
    try {
      if (editingArea) {
        await updateArea(editingArea.id, areaForm);
        setAreas(prev => prev.map(a => a.id === editingArea.id ? { ...a, ...areaForm } : a));
        toast.success('Área actualizada');
      } else {
        const area = await createArea(areaForm);
        setAreas(prev => [...prev, area]);
        toast.success('Área creada');
      }
      setAreaDialog(false);
    } catch (e: any) {
      toast.error('Error', { description: e.message });
    } finally { setAreaSubmitting(false); }
  }

  async function handleDeactivateArea(area: Area) {
    try {
      await updateArea(area.id, { is_active: false });
      setAreas(prev => prev.filter(a => a.id !== area.id));
      toast.success(`Área "${area.name}" desactivada`);
    } catch (e: any) { toast.error('Error', { description: e.message }); }
  }

  // ── User handlers ──
  function toggleAreaInForm(areaId: string) {
    setUserForm(prev => ({
      ...prev,
      area_ids: prev.area_ids.includes(areaId)
        ? prev.area_ids.filter(id => id !== areaId)
        : [...prev.area_ids, areaId],
    }));
  }

  async function handleUserSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUserSubmitting(true);
    try {
      const created = await createAdminUser(userForm);
      setUsers(prev => [...prev, created]);
      setCreatedPassword(created.temporary_password);
      setUserDialog(false);
      setUserForm({ name: '', email: '', role: 'EMPLOYEE', area_ids: [] });
    } catch (e: any) {
      toast.error('Error al crear usuario', { description: e.message });
    } finally { setUserSubmitting(false); }
  }

  async function handleToggleUserActive(u: AdminUser) {
    const next = !u.is_active;
    try {
      await updateAdminUser(u.id, { is_active: next });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: next ? 1 : 0 } : x));
      toast.success(next ? `${u.name} activado` : `${u.name} desactivado`);
    } catch (e: any) { toast.error('Error', { description: e.message }); }
  }

  // ── Document handlers ──
  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const tmpId = `tmp-${Date.now()}-${i}`;
      setDocuments(prev => [{ id: tmpId, name: file.name, status: 'uploading' }, ...prev]);
      try {
        const r = await uploadFile(file);
        setDocuments(prev => prev.filter(d => d.id !== tmpId));
        setDocuments(prev => [{ id: r.document_id, name: file.name, status: 'queued' }, ...prev]);
        startPolling(r.document_id);
        toast.success(`Archivo subido: ${file.name}`);
      } catch (e: any) {
        setDocuments(prev => prev.map(d => d.id === tmpId ? { ...d, status: 'error' } : d));
        toast.error(`Error subiendo ${file.name}`, { description: e.message });
      }
    }
  }

  // ── KB handlers ──
  async function handleKbSubmit(e: React.FormEvent) {
    e.preventDefault();
    setKbSubmitting(true);
    try {
      const kb = await createKnowledgeBase(kbForm);
      setKbs(prev => [...prev, kb]);
      toast.success('Knowledge base creada');
      setKbDialog(false);
      setKbForm({ area_id: '', dify_dataset_id: '', name: '' });
    } catch (e: any) {
      toast.error('Error', { description: e.message });
    } finally { setKbSubmitting(false); }
  }

  async function handleDeleteKb(kb: KnowledgeBase) {
    try {
      await deleteKnowledgeBase(kb.id);
      setKbs(prev => prev.filter(k => k.id !== kb.id));
      toast.success('Knowledge base eliminada');
    } catch (e: any) { toast.error('Error', { description: e.message }); }
  }

  const filteredDocs = documents.filter(d => d.name?.toLowerCase().includes(docSearch.toLowerCase()));

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      <AppHeader
        subtitle="Panel de Administración"
        activeSection="admin"
        showUserInfo={false}
        extraRight={
          <>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 rounded-lg border border-purple-200">
              <Shield className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-sm text-purple-800 font-medium hidden md:inline">· {user?.name}</span>
            </div>
          </>
        }
      />

      {/* Main */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <Tabs defaultValue="areas" className="space-y-6">
          <TabsList className="bg-white border border-gray-200 shadow-sm">
            <TabsTrigger value="areas" className="data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-700 data-[state=active]:font-semibold">
              <FolderOpen className="w-4 h-4 mr-2" />Áreas
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-700 data-[state=active]:font-semibold">
              <Users className="w-4 h-4 mr-2" />Empleados
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-700 data-[state=active]:font-semibold">
              <FileText className="w-4 h-4 mr-2" />Documentos
            </TabsTrigger>
            <TabsTrigger value="kbs" className="data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-700 data-[state=active]:font-semibold">
              <Database className="w-4 h-4 mr-2" />Knowledge Bases
            </TabsTrigger>
          </TabsList>

          {/* ── AREAS TAB ───────────────────────────────────────────────────── */}
          <TabsContent value="areas" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Áreas / Departamentos</h2>
                <p className="text-sm text-gray-500">Cada área se mapea a un dataset de Dify</p>
              </div>
              <Button onClick={openCreateArea} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                <Plus className="w-4 h-4 mr-2" />Nueva Área
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="Total Áreas" value={areas.length} icon={FolderOpen} color="text-cyan-600" />
              <StatCard label="Empleados" value={users.length} icon={Users} color="text-blue-600" />
              <StatCard label="Knowledge Bases" value={kbs.length} icon={Database} color="text-purple-600" />
            </div>

            {areasLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-cyan-600" /></div>
            ) : areas.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
                <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No hay áreas creadas</p>
                <p className="text-gray-400 text-sm mt-1">Crea la primera área para comenzar</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {areas.map(area => (
                  <div key={area.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-cyan-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                        <FolderOpen className="w-5 h-5 text-cyan-600" />
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-cyan-600" onClick={() => openEditArea(area)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => handleDeactivateArea(area)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{area.name}</h3>
                    {area.description && <p className="text-sm text-gray-500 line-clamp-2">{area.description}</p>}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-400">
                        {kbs.filter(k => k.area_id === area.id).length} dataset(s) vinculado(s)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── USERS TAB ───────────────────────────────────────────────────── */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Empleados</h2>
                <p className="text-sm text-gray-500">Los empleados reciben una contraseña temporal al ser creados</p>
              </div>
              <Button onClick={() => setUserDialog(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                <Plus className="w-4 h-4 mr-2" />Nuevo Empleado
              </Button>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <StatCard label="Total" value={users.length} icon={Users} color="text-cyan-600" />
              <StatCard label="Admins" value={users.filter(u => u.role === 'ADMIN' || u.role === 'OWNER').length} icon={Shield} color="text-purple-600" />
              <StatCard label="Empleados" value={users.filter(u => u.role === 'EMPLOYEE').length} icon={Users} color="text-green-600" />
            </div>

            {usersLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-cyan-600" /></div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Listado de usuarios</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {users.map(u => (
                    <div key={u.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${!u.is_active ? 'opacity-50' : ''}`}>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-cyan-700">{u.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-medium text-gray-900">{u.name}</span>
                          <RoleBadge role={u.role} />
                          {u.must_change_password === 1 && (
                            <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[10px]">Cambiar contraseña</Badge>
                          )}
                          {!u.is_active && <Badge className="bg-gray-100 text-gray-500">Inactivo</Badge>}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{u.email}</p>
                        {u.areas?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {u.areas.map(a => (
                              <Badge key={a.area_id} className="bg-blue-50 text-blue-600 border-blue-100 text-[10px]">{a.area_name}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      {u.role !== 'OWNER' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleUserActive(u)}
                          className={u.is_active ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}
                        >
                          {u.is_active ? <X className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── DOCUMENTS TAB ───────────────────────────────────────────────── */}
          <TabsContent value="documents" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Documentos</h2>
                <p className="text-sm text-gray-500">Sube documentos a la base de conocimiento de Dify</p>
              </div>
            </div>

            {/* Upload area */}
            <label
              className={`block border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${isDragging ? 'border-cyan-400 bg-cyan-50' : 'border-gray-300 bg-white hover:border-cyan-300 hover:bg-cyan-50/30'}`}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => { e.preventDefault(); setIsDragging(false); handleUpload(e.dataTransfer.files); }}
            >
              <input type="file" multiple accept=".pdf,.docx,.xlsx,.doc,.xls" className="hidden" onChange={e => handleUpload(e.target.files)} />
              <div className="w-14 h-14 rounded-2xl bg-cyan-100 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-7 h-7 text-cyan-600" />
              </div>
              <p className="font-semibold text-gray-800">{isDragging ? 'Suelta aquí' : 'Arrastra archivos o haz clic'}</p>
              <p className="text-sm text-gray-500 mt-1">PDF, DOCX, XLSX — máx. 15 MB por archivo</p>
            </label>

            {/* Stats */}
            <div className="grid sm:grid-cols-3 gap-4">
              <StatCard label="Total" value={documents.length} icon={FileText} color="text-cyan-600" />
              <StatCard label="Indexados" value={documents.filter(d => d.status === 'completed').length} icon={CheckCircle2} color="text-green-600" />
              <StatCard label="En proceso" value={documents.filter(d => d.status && !['completed', 'error'].includes(d.status)).length} icon={Clock} color="text-amber-600" />
            </div>

            {/* Search + list */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-100 gap-4">
                <h3 className="font-semibold text-gray-900">Base de Conocimiento</h3>
                <div className="relative w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input value={docSearch} onChange={e => setDocSearch(e.target.value)} placeholder="Buscar..." className="pl-9 h-9 text-sm bg-gray-50" />
                </div>
              </div>

              {docsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-cyan-600" /></div>
              ) : filteredDocs.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Sin documentos</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredDocs.map(doc => {
                    const statusMap: Record<string, { label: string; cls: string; icon: any }> = {
                      completed: { label: 'Indexado', cls: 'text-green-600 bg-green-50', icon: CheckCircle2 },
                      error:     { label: 'Error',    cls: 'text-red-600 bg-red-50',   icon: AlertCircle },
                      uploading: { label: 'Subiendo', cls: 'text-blue-600 bg-blue-50', icon: Loader2 },
                      queued:    { label: 'En cola',  cls: 'text-gray-500 bg-gray-50', icon: Clock },
                      indexing:  { label: 'Indexando',cls: 'text-amber-600 bg-amber-50',icon: Loader2 },
                    };
                    const s = statusMap[doc.status ?? 'queued'] ?? statusMap.queued;
                    return (
                      <div key={doc.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                          {doc.created_at && <p className="text-xs text-gray-400">{new Date(doc.created_at).toLocaleDateString()}</p>}
                        </div>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.cls}`}>
                          <s.icon className={`w-3.5 h-3.5 ${['uploading','indexing'].includes(doc.status ?? '') ? 'animate-spin' : ''}`} />
                          {s.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── KNOWLEDGE BASES TAB ─────────────────────────────────────────── */}
          <TabsContent value="kbs" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Knowledge Bases</h2>
                <p className="text-sm text-gray-500">Vincula cada área a un dataset de Dify para el RAG</p>
              </div>
              <Button onClick={() => setKbDialog(true)} disabled={areas.length === 0} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                <Plus className="w-4 h-4 mr-2" />Vincular Dataset
              </Button>
            </div>

            {areas.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">Primero debes crear al menos un Área antes de vincular datasets.</p>
              </div>
            )}

            {kbsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-cyan-600" /></div>
            ) : kbs.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
                <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No hay knowledge bases configuradas</p>
                <p className="text-gray-400 text-sm mt-1">Vincula un área con el ID de dataset de Dify</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {kbs.map(kb => (
                    <div key={kb.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50">
                      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <Database className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-gray-900">{kb.name}</span>
                          <Badge className="bg-cyan-100 text-cyan-700 border-cyan-200">{kb.area_name}</Badge>
                        </div>
                        <p className="text-xs text-gray-400 font-mono truncate">{kb.dify_dataset_id}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteKb(kb)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* ── DIALOGS ──────────────────────────────────────────────────────────── */}

      {/* Area dialog */}
      <Dialog open={areaDialog} onOpenChange={setAreaDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingArea ? 'Editar Área' : 'Nueva Área'}</DialogTitle>
            <DialogDescription>Las áreas se mapean directamente a datasets de Dify</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAreaSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input value={areaForm.name} onChange={e => setAreaForm(p => ({ ...p, name: e.target.value }))} placeholder="ej. Recursos Humanos" required />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Input value={areaForm.description} onChange={e => setAreaForm(p => ({ ...p, description: e.target.value }))} placeholder="Descripción opcional" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setAreaDialog(false)} className="flex-1">Cancelar</Button>
              <Button type="submit" disabled={areaSubmitting} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white">
                {areaSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingArea ? 'Guardar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* User dialog */}
      <Dialog open={userDialog} onOpenChange={setUserDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Empleado</DialogTitle>
            <DialogDescription>Se generará una contraseña temporal que deberás compartir con el empleado</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUserSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nombre Completo *</Label>
                <Input value={userForm.name} onChange={e => setUserForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input type="email" value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Rol *</Label>
              <Select value={userForm.role} onValueChange={(v: 'ADMIN' | 'EMPLOYEE') => setUserForm(p => ({ ...p, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Empleado — Solo consulta</SelectItem>
                  <SelectItem value="ADMIN">Admin — Gestión completa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {areas.length > 0 && (
              <div className="space-y-1.5">
                <Label>Áreas de acceso</Label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                  {areas.map(area => (
                    <div key={area.id} className="flex items-center gap-2">
                      <Checkbox id={`area-${area.id}`} checked={userForm.area_ids.includes(area.id)} onCheckedChange={() => toggleAreaInForm(area.id)} />
                      <label htmlFor={`area-${area.id}`} className="text-sm text-gray-700 cursor-pointer">{area.name}</label>
                    </div>
                  ))}
                </div>
                {userForm.area_ids.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {userForm.area_ids.map(id => {
                      const a = areas.find(x => x.id === id);
                      return a ? (
                        <Badge key={id} className="bg-cyan-100 text-cyan-700 border-cyan-200">
                          {a.name}
                          <button type="button" onClick={() => toggleAreaInForm(id)} className="ml-1"><X className="w-3 h-3" /></button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setUserDialog(false)} className="flex-1">Cancelar</Button>
              <Button type="submit" disabled={userSubmitting} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white">
                {userSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear Empleado'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Temporary password dialog */}
      <Dialog open={!!createdPassword} onOpenChange={() => setCreatedPassword(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Empleado creado</DialogTitle>
            <DialogDescription>Comparte esta contraseña temporal con el empleado. Solo se muestra una vez.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <code className="flex-1 font-mono text-lg font-bold text-amber-900 tracking-widest">{createdPassword}</code>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-amber-600 hover:bg-amber-100"
                onClick={() => { navigator.clipboard.writeText(createdPassword ?? ''); toast.success('Copiado'); }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">El empleado deberá cambiar esta contraseña en su primer inicio de sesión.</p>
            <Button className="w-full" onClick={() => setCreatedPassword(null)}>Entendido</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* KB dialog */}
      <Dialog open={kbDialog} onOpenChange={setKbDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular Dataset de Dify</DialogTitle>
            <DialogDescription>El área accederá solo a los datasets vinculados durante el RAG</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleKbSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Área *</Label>
              <Select value={kbForm.area_id} onValueChange={v => setKbForm(p => ({ ...p, area_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecciona un área" /></SelectTrigger>
                <SelectContent>
                  {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input value={kbForm.name} onChange={e => setKbForm(p => ({ ...p, name: e.target.value }))} placeholder="ej. Base RH General" required />
            </div>
            <div className="space-y-1.5">
              <Label>Dataset ID de Dify *</Label>
              <Input
                value={kbForm.dify_dataset_id}
                onChange={e => setKbForm(p => ({ ...p, dify_dataset_id: e.target.value }))}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="font-mono text-sm"
                required
              />
              <p className="text-xs text-gray-400">Encuéntralo en Dify → Knowledge → Settings del dataset</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setKbDialog(false)} className="flex-1">Cancelar</Button>
              <Button type="submit" disabled={kbSubmitting || !kbForm.area_id} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white">
                {kbSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Vincular'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
