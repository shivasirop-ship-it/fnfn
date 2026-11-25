import {
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Award,
  Check,
  Copy,
  Download,
  Eraser,
  Palette,
  PenTool,
  Plus,
  Search,
  Sparkles,
  Stamp,
  Trash2,
  Type,
  UserCheck,
} from 'lucide-react';
import {
  CertificateBorderStyle,
  CertificatePreset,
  CertificateRecord,
  CertificateSealStyle,
  DqrUser,
} from '../types';
import {
  CERTIFICATE_BORDER_OPTIONS,
  CERTIFICATE_CATEGORIES,
  CERTIFICATE_FONT_OPTIONS,
  CERTIFICATE_PRESETS,
  CERTIFICATE_SEAL_OPTIONS,
  SIGNATURE_FONT_OPTIONS,
} from '../data/presets';
import { CertificateRenderer, exportCertificateToPng } from './CertificateRenderer';

interface AdminCertificateStudioProps {
  users: DqrUser[];
  certificates: CertificateRecord[];
  onSaveCertificates: (next: CertificateRecord[]) => void;
  onToast: (msg: string) => void;
}

function buildDraftFromPreset(
  preset: CertificatePreset,
  user: DqrUser | undefined,
  serialSeq: number
): CertificateRecord {
  const now = Date.now();
  const todayLabel = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  return {
    id: `cert-${now}`,
    userId: user?.id || '',
    presetId: preset.id,
    presetName: preset.name,
    category: preset.category,
    institutionText: preset.institutionText,
    ribbonText: preset.ribbonText,
    titleText: preset.titleText,
    subtitleText: preset.subtitleText,
    recipientName: user?.fullName || 'Distinguished Honoree',
    bodyText: preset.bodyText,
    achievementText: preset.achievementText,
    dateText: todayLabel,
    serialText: `DQR-${String(2083)}-${String(serialSeq).padStart(4, '0')}`,
    sealStyle: preset.sealStyle,
    sealInitials: preset.sealInitials,
    sealCaption: preset.sealCaption,
    borderStyle: preset.borderStyle,
    palette: { ...preset.palette },
    typography: { ...preset.typography },
    signature: {
      enabled: true,
      mode: 'text',
      signatureText: preset.signatureDefaults.signatureText,
      signatureFont: preset.signatureDefaults.signatureFont,
      signatureColor: preset.palette.accentColor,
      drawnDataUrl: null,
      signatoryName: preset.signatureDefaults.signatoryName,
      signatoryRole: preset.signatureDefaults.signatoryRole,
      secondaryEnabled: false,
      secondarySignatureText: 'DQR Council',
      secondarySignatoryName: 'Evaluation Board',
      secondarySignatoryRole: 'Academic Verification · DQR',
    },
    createdAt: now,
    updatedAt: now,
  };
}

export function AdminCertificateStudio({
  users,
  certificates,
  onSaveCertificates,
  onToast,
}: AdminCertificateStudioProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [studioTab, setStudioTab] = useState<
    'presets' | 'content' | 'typography' | 'style' | 'signature'
  >('presets');

  const [presetSearch, setPresetSearch] = useState('');
  const [presetCategory, setPresetCategory] = useState('All');
  const [rosterScope, setRosterScope] = useState<'selected' | 'all'>('selected');

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) || users[0],
    [users, selectedUserId]
  );

  const [draft, setDraft] = useState<CertificateRecord>(() =>
    buildDraftFromPreset(
      CERTIFICATE_PRESETS[0],
      users[0],
      certificates.length + 1
    )
  );

  // Digital signature pad canvas refs
  const padRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [penSize, setPenSize] = useState(3);

  useEffect(() => {
    if (!editingCertId && selectedUser) {
      setDraft((prev) => ({
        ...prev,
        userId: selectedUser.id,
        recipientName: selectedUser.fullName,
      }));
    }
  }, [selectedUser, editingCertId]);

  const filteredPresets = useMemo(() => {
    const q = presetSearch.trim().toLowerCase();
    return CERTIFICATE_PRESETS.filter((p) => {
      if (presetCategory !== 'All' && p.category !== presetCategory) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.titleText.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.ribbonText.toLowerCase().includes(q)
      );
    });
  }, [presetSearch, presetCategory]);

  const displayedIssued = useMemo(() => {
    const list =
      rosterScope === 'selected'
        ? certificates.filter((c) => c.userId === selectedUserId)
        : certificates;
    return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [certificates, rosterScope, selectedUserId]);

  const applyPreset = (preset: CertificatePreset) => {
    setDraft((prev) => ({
      ...prev,
      presetId: preset.id,
      presetName: preset.name,
      category: preset.category,
      institutionText: preset.institutionText,
      ribbonText: preset.ribbonText,
      titleText: preset.titleText,
      subtitleText: preset.subtitleText,
      bodyText: preset.bodyText,
      achievementText: preset.achievementText,
      sealStyle: preset.sealStyle,
      sealInitials: preset.sealInitials,
      sealCaption: preset.sealCaption,
      borderStyle: preset.borderStyle,
      palette: { ...preset.palette },
      typography: { ...preset.typography },
      signature: {
        ...prev.signature,
        signatureText:
          prev.signature.signatureText || preset.signatureDefaults.signatureText,
        signatureFont: preset.signatureDefaults.signatureFont,
        signatureColor: preset.palette.accentColor,
        signatoryName:
          prev.signature.signatoryName || preset.signatureDefaults.signatoryName,
        signatoryRole:
          prev.signature.signatoryRole || preset.signatureDefaults.signatoryRole,
      },
    }));
    onToast(`Loaded preset "${preset.name}".`);
  };

  const handleIssueOrUpdate = () => {
    const targetUid = draft.userId || selectedUserId;
    if (!targetUid) {
      onToast('Please select a target user first.');
      return;
    }
    const now = Date.now();
    if (editingCertId) {
      const updated: CertificateRecord = {
        ...draft,
        id: editingCertId,
        userId: targetUid,
        updatedAt: now,
      };
      onSaveCertificates(
        certificates.map((c) => (c.id === editingCertId ? updated : c))
      );
      onToast('Assigned certificate updated.');
    } else {
      const created: CertificateRecord = {
        ...draft,
        id: `cert-${now}-${Math.random().toString(36).slice(2, 6)}`,
        userId: targetUid,
        createdAt: now,
        updatedAt: now,
      };
      onSaveCertificates([created, ...certificates]);
      const recipientUser = users.find((u) => u.id === targetUid);
      onToast(
        `Issued certificate "${created.titleText}" to ${recipientUser?.fullName || created.recipientName}.`
      );
    }
  };

  const handleLoadForEdit = (cert: CertificateRecord) => {
    setEditingCertId(cert.id);
    setSelectedUserId(cert.userId);
    setDraft(JSON.parse(JSON.stringify(cert)) as CertificateRecord);
    onToast(`Editing "${cert.titleText}" (${cert.recipientName}).`);
  };

  const handleResetNew = () => {
    setEditingCertId(null);
    setDraft(
      buildDraftFromPreset(
        CERTIFICATE_PRESETS[0],
        selectedUser,
        certificates.length + 1
      )
    );
  };

  // Signature Canvas Drawing Helpers
  const getCanvasCoords = (
    canvas: HTMLCanvasElement,
    clientX: number,
    clientY: number
  ) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDraw = (
    e: ReactMouseEvent<HTMLCanvasElement> | ReactTouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = padRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pt =
      'touches' in e
        ? getCanvasCoords(canvas, e.touches[0].clientX, e.touches[0].clientY)
        : getCanvasCoords(canvas, e.clientX, e.clientY);

    drawingRef.current = true;
    ctx.strokeStyle = draft.signature.signatureColor || '#f5dc82';
    ctx.lineWidth = penSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  };

  const moveDraw = (
    e: ReactMouseEvent<HTMLCanvasElement> | ReactTouchEvent<HTMLCanvasElement>
  ) => {
    if (!drawingRef.current) return;
    const canvas = padRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pt =
      'touches' in e
        ? getCanvasCoords(canvas, e.touches[0].clientX, e.touches[0].clientY)
        : getCanvasCoords(canvas, e.clientX, e.clientY);

    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = padRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    setDraft((prev) => ({
      ...prev,
      signature: {
        ...prev.signature,
        enabled: true,
        mode: 'drawn',
        drawnDataUrl: url,
      },
    }));
  };

  const clearPad = () => {
    const canvas = padRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setDraft((prev) => ({
      ...prev,
      signature: {
        ...prev.signature,
        drawnDataUrl: null,
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Assignment & Action Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#d4af37]/30 bg-[#100f0c] p-5 lg:flex-row lg:items-center">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#d4af37] uppercase">
            Ascension Credential Atelier · {CERTIFICATE_PRESETS.length} Presets
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold text-[#f8e6a0]">
            Certificate Studio & User Assignment
          </h2>
          <p className="mt-0.5 text-xs text-neutral-400">
            Select a user, choose from 120 curated presets, customize every font, color, seal, and digital signature, then issue individually.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-[#16140f] px-3 py-2">
            <UserCheck className="h-4 w-4 text-[#d4af37]" />
            <select
              value={draft.userId || selectedUserId}
              onChange={(e) => {
                const uid = e.target.value;
                setSelectedUserId(uid);
                const u = users.find((x) => x.id === uid);
                setDraft((prev) => ({
                  ...prev,
                  userId: uid,
                  recipientName: u ? u.fullName : prev.recipientName,
                }));
              }}
              className="bg-transparent text-xs font-semibold text-white outline-none"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#16140f]">
                  {u.fullName} (@{u.username})
                </option>
              ))}
            </select>
          </div>

          {editingCertId && (
            <button
              type="button"
              onClick={handleResetNew}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-white/10 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Certificate</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => void exportCertificateToPng(draft)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#d4af37]/45 bg-[#1b170e] px-3.5 py-2 text-xs font-semibold text-[#fde68a] hover:bg-[#2a2315] cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download PNG</span>
          </button>

          <button
            type="button"
            onClick={handleIssueOrUpdate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#d4af37] px-4 py-2 text-xs font-bold text-[#08080a] hover:bg-[#fde047] cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" />
            <span>
              {editingCertId
                ? 'Save Certificate Changes'
                : `Assign to ${users.find((u) => u.id === (draft.userId || selectedUserId))?.fullName || 'User'}`}
            </span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Live Preview (Left/Top) + Deep Customizer (Right) */}
      <div className="grid gap-6 xl:grid-cols-12">
        {/* Live Preview + Assigned Roster */}
        <div className="space-y-5 xl:col-span-6">
          <div className="rounded-2xl border border-[#d4af37]/30 bg-[#0a0908] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[11px] tracking-wider text-[#d4af37] uppercase">
                Live Certificate Preview · {draft.presetName}
              </span>
              <span className="font-mono text-[11px] text-neutral-400">
                {editingCertId ? 'Editing Issued Record' : 'New Assignment Draft'}
              </span>
            </div>
            <CertificateRenderer certificate={draft} className="rounded-lg" />
          </div>

          {/* Assigned Certificates Roster */}
          <div className="rounded-2xl border border-white/12 bg-[#100f0c] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-lg font-bold text-[#f8e6a0]">
                Assigned Certificates ({displayedIssued.length})
              </h3>
              <div className="inline-flex rounded-lg border border-white/15 bg-[#16140f] p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setRosterScope('selected')}
                  className={`rounded-md px-2.5 py-1 font-semibold cursor-pointer ${
                    rosterScope === 'selected'
                      ? 'bg-[#d4af37] text-[#08080a]'
                      : 'text-neutral-300'
                  }`}
                >
                  Selected User
                </button>
                <button
                  type="button"
                  onClick={() => setRosterScope('all')}
                  className={`rounded-md px-2.5 py-1 font-semibold cursor-pointer ${
                    rosterScope === 'all'
                      ? 'bg-[#d4af37] text-[#08080a]'
                      : 'text-neutral-300'
                  }`}
                >
                  All Users ({certificates.length})
                </button>
              </div>
            </div>

            {displayedIssued.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-white/15 p-5 text-center text-xs text-neutral-400">
                No certificates issued for this filter yet. Customize above and click &ldquo;Assign&rdquo;.
              </p>
            ) : (
              <div className="mt-4 max-h-[360px] space-y-2.5 overflow-y-auto pr-1">
                {displayedIssued.map((cert) => {
                  const owner = users.find((u) => u.id === cert.userId);
                  const isEditing = editingCertId === cert.id;
                  return (
                    <div
                      key={cert.id}
                      className={`flex flex-col justify-between gap-3 rounded-xl border p-3.5 sm:flex-row sm:items-center ${
                        isEditing
                          ? 'border-[#d4af37] bg-[#1d180c]'
                          : 'border-white/10 bg-[#16140f]'
                      }`}
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        <span
                          className="h-9 w-9 shrink-0 rounded-lg border"
                          style={{
                            backgroundColor: cert.palette.bgSecondary,
                            borderColor: cert.palette.borderColor,
                          }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-white">
                            {cert.titleText}
                          </p>
                          <p className="truncate font-mono text-[11px] text-neutral-400">
                            Assigned to:{' '}
                            <span className="text-[#fde68a]">
                              {owner?.fullName || cert.recipientName}
                            </span>{' '}
                            · {cert.dateText}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleLoadForEdit(cert)}
                          className="rounded-lg border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-white hover:border-[#d4af37]/60 cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          title="Duplicate to selected user"
                          onClick={() => {
                            const target = users.find((u) => u.id === selectedUserId);
                            const copy: CertificateRecord = {
                              ...(JSON.parse(JSON.stringify(cert)) as CertificateRecord),
                              id: `cert-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                              userId: selectedUserId,
                              recipientName: target?.fullName || cert.recipientName,
                              serialText: `DQR-2083-${String(certificates.length + 1).padStart(4, '0')}`,
                              createdAt: Date.now(),
                              updatedAt: Date.now(),
                            };
                            onSaveCertificates([copy, ...certificates]);
                            onToast(
                              `Duplicated certificate to ${target?.fullName || 'selected user'}.`
                            );
                          }}
                          className="rounded-lg border border-white/15 p-1.5 text-neutral-300 hover:text-white cursor-pointer"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void exportCertificateToPng(cert)}
                          className="rounded-lg border border-white/15 p-1.5 text-[#fde68a] hover:bg-white/5 cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onSaveCertificates(
                              certificates.filter((c) => c.id !== cert.id)
                            );
                            if (editingCertId === cert.id) {
                              setEditingCertId(null);
                            }
                            onToast('Certificate removed.');
                          }}
                          className="rounded-lg border border-red-400/30 p-1.5 text-red-300 hover:bg-red-500/10 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Customization Studio Panel */}
        <div className="rounded-2xl border border-[#d4af37]/25 bg-[#100f0c] p-5 xl:col-span-6">
          {/* Studio Section Switcher */}
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/12 bg-[#16140f] p-1">
            {(
              [
                { id: 'presets', label: `120 Presets`, icon: Sparkles },
                { id: 'content', label: 'Texts & Details', icon: Award },
                { id: 'typography', label: 'Fonts & Sizes', icon: Type },
                { id: 'style', label: 'Colors, Border & Seal', icon: Palette },
                { id: 'signature', label: 'Digital Signature', icon: PenTool },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStudioTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    studioTab === tab.id
                      ? 'bg-[#9333ea] text-white'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* 1. 120 PRESETS BROWSER */}
          {studioTab === 'presets' && (
            <div className="mt-5 space-y-4">
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    value={presetSearch}
                    onChange={(e) => setPresetSearch(e.target.value)}
                    placeholder="Search 120 presets (e.g. Supreme, Gold, Streak, Territory, Ivory)..."
                    className="w-full rounded-xl border border-white/15 bg-[#16140f] py-2 pr-3 pl-9 text-xs text-white"
                  />
                </div>
                <select
                  value={presetCategory}
                  onChange={(e) => setPresetCategory(e.target.value)}
                  className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                >
                  {CERTIFICATE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <p className="font-mono text-[11px] text-neutral-400">
                Showing {filteredPresets.length} of {CERTIFICATE_PRESETS.length} presets
              </p>

              <div className="grid max-h-[540px] gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2">
                {filteredPresets.map((preset) => {
                  const active = draft.presetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={`group flex items-start gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                        active
                          ? 'border-[#d4af37] bg-[#1e180c]'
                          : 'border-white/10 bg-[#16140f] hover:border-[#d4af37]/50'
                      }`}
                    >
                      <div
                        className="mt-0.5 flex h-10 w-14 shrink-0 flex-col items-center justify-center rounded-md border text-[9px] font-bold"
                        style={{
                          background: `linear-gradient(135deg, ${preset.palette.bgSecondary}, ${preset.palette.bgPrimary})`,
                          borderColor: preset.palette.borderColor,
                          color: preset.palette.titleColor,
                          fontFamily: preset.typography.titleFont,
                        }}
                      >
                        {preset.sealInitials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-white group-hover:text-[#fde68a]">
                          {preset.name}
                        </p>
                        <p className="truncate text-[11px] text-neutral-400">
                          {preset.titleText}
                        </p>
                        <p className="mt-1 font-mono text-[10px] text-[#d4af37]/80">
                          {preset.category} · {preset.borderStyle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. CONTENT & ALL TEXT FIELDS */}
          {studioTab === 'content' && (
            <div className="mt-5 space-y-3.5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] text-neutral-400">
                    Institution / Top Header
                  </label>
                  <input
                    value={draft.institutionText}
                    onChange={(e) =>
                      setDraft({ ...draft, institutionText: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400">
                    Ribbon / Crest Tagline
                  </label>
                  <input
                    value={draft.ribbonText}
                    onChange={(e) =>
                      setDraft({ ...draft, ribbonText: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] text-neutral-400">
                    Certificate Main Title
                  </label>
                  <input
                    value={draft.titleText}
                    onChange={(e) =>
                      setDraft({ ...draft, titleText: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-sm font-semibold text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400">
                    Intro / Subtitle Line
                  </label>
                  <input
                    value={draft.subtitleText}
                    onChange={(e) =>
                      setDraft({ ...draft, subtitleText: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-neutral-400">
                    Recipient Name (Editable Display Name)
                  </label>
                  {selectedUser && (
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({ ...draft, recipientName: selectedUser.fullName })
                      }
                      className="text-[11px] text-[#d4af37] hover:underline cursor-pointer"
                    >
                      Use {selectedUser.fullName}
                    </button>
                  )}
                </div>
                <input
                  value={draft.recipientName}
                  onChange={(e) =>
                    setDraft({ ...draft, recipientName: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-sm font-bold text-[#fde68a]"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400">
                  Citation / Body Text
                </label>
                <textarea
                  rows={3}
                  value={draft.bodyText}
                  onChange={(e) =>
                    setDraft({ ...draft, bodyText: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs leading-relaxed text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400">
                  Achievement / Highlight Banner
                </label>
                <input
                  value={draft.achievementText}
                  onChange={(e) =>
                    setDraft({ ...draft, achievementText: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] text-neutral-400">
                    Date / Season Text
                  </label>
                  <input
                    value={draft.dateText}
                    onChange={(e) =>
                      setDraft({ ...draft, dateText: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400">
                    Certificate Serial / Archive ID
                  </label>
                  <input
                    value={draft.serialText}
                    onChange={(e) =>
                      setDraft({ ...draft, serialText: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 font-mono text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. TYPOGRAPHY & FONT CUSTOMIZATION */}
          {studioTab === 'typography' && (
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] text-neutral-400">
                    Certificate Title Font
                  </label>
                  <select
                    value={draft.typography.titleFont}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        typography: { ...draft.typography, titleFont: e.target.value },
                      })
                    }
                    style={{ fontFamily: draft.typography.titleFont }}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-sm text-white"
                  >
                    {CERTIFICATE_FONT_OPTIONS.map((f) => (
                      <option
                        key={f.value}
                        value={f.value}
                        style={{ fontFamily: f.value }}
                      >
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-neutral-400">
                    Recipient Name Font
                  </label>
                  <select
                    value={draft.typography.recipientFont}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        typography: {
                          ...draft.typography,
                          recipientFont: e.target.value,
                        },
                      })
                    }
                    style={{ fontFamily: draft.typography.recipientFont }}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-sm text-white"
                  >
                    {CERTIFICATE_FONT_OPTIONS.map((f) => (
                      <option
                        key={f.value}
                        value={f.value}
                        style={{ fontFamily: f.value }}
                      >
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-neutral-400">
                    Citation Body Font
                  </label>
                  <select
                    value={draft.typography.bodyFont}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        typography: { ...draft.typography, bodyFont: e.target.value },
                      })
                    }
                    style={{ fontFamily: draft.typography.bodyFont }}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-sm text-white"
                  >
                    {CERTIFICATE_FONT_OPTIONS.map((f) => (
                      <option
                        key={f.value}
                        value={f.value}
                        style={{ fontFamily: f.value }}
                      >
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-neutral-400">
                    Header / Labels Font
                  </label>
                  <select
                    value={draft.typography.metaFont}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        typography: { ...draft.typography, metaFont: e.target.value },
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  >
                    {CERTIFICATE_FONT_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-white/10 bg-[#16140f] p-4">
                <div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-300">Title Size Scale</span>
                    <span className="font-mono text-[#d4af37]">
                      {Math.round(draft.typography.titleScale * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.75}
                    max={1.35}
                    step={0.05}
                    value={draft.typography.titleScale}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        typography: {
                          ...draft.typography,
                          titleScale: Number(e.target.value),
                        },
                      })
                    }
                    className="mt-1 w-full accent-[#d4af37]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-300">Recipient Name Scale</span>
                    <span className="font-mono text-[#d4af37]">
                      {Math.round(draft.typography.recipientScale * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.75}
                    max={1.4}
                    step={0.05}
                    value={draft.typography.recipientScale}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        typography: {
                          ...draft.typography,
                          recipientScale: Number(e.target.value),
                        },
                      })
                    }
                    className="mt-1 w-full accent-[#d4af37]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-300">Body Citation Scale</span>
                    <span className="font-mono text-[#d4af37]">
                      {Math.round(draft.typography.bodyScale * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.8}
                    max={1.3}
                    step={0.05}
                    value={draft.typography.bodyScale}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        typography: {
                          ...draft.typography,
                          bodyScale: Number(e.target.value),
                        },
                      })
                    }
                    className="mt-1 w-full accent-[#d4af37]"
                  />
                </div>

                <label className="flex items-center gap-2 pt-1 text-xs text-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.typography.uppercaseTitle}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        typography: {
                          ...draft.typography,
                          uppercaseTitle: e.target.checked,
                        },
                      })
                    }
                  />
                  <span>Force Uppercase on Certificate Title</span>
                </label>
              </div>
            </div>
          )}

          {/* 4. COLORS, BORDER & SEAL */}
          {studioTab === 'style' && (
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] text-neutral-400">
                    Frame & Border Ornament
                  </label>
                  <select
                    value={draft.borderStyle}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        borderStyle: e.target.value as CertificateBorderStyle,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  >
                    {CERTIFICATE_BORDER_OPTIONS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-neutral-400">
                    Official Seal Style
                  </label>
                  <select
                    value={draft.sealStyle}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        sealStyle: e.target.value as CertificateSealStyle,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                  >
                    {CERTIFICATE_SEAL_OPTIONS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {draft.sealStyle !== 'none' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="flex items-center gap-1 text-[11px] text-neutral-400">
                      <Stamp className="h-3 w-3 text-[#d4af37]" />
                      <span>Seal Monogram / Initials</span>
                    </label>
                    <input
                      maxLength={6}
                      value={draft.sealInitials}
                      onChange={(e) =>
                        setDraft({ ...draft, sealInitials: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 font-mono text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-neutral-400">
                      Seal Caption Below Stamp
                    </label>
                    <input
                      value={draft.sealCaption}
                      onChange={(e) =>
                        setDraft({ ...draft, sealCaption: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 font-mono text-xs text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 text-[11px] font-semibold text-neutral-400 uppercase">
                  Every Surface & Ink Color
                </p>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {(
                    [
                      ['bgPrimary', 'Canvas Outer'],
                      ['bgSecondary', 'Canvas Glow'],
                      ['borderColor', 'Frame Border'],
                      ['accentColor', 'Accent Trim'],
                      ['titleColor', 'Title Ink'],
                      ['recipientColor', 'Recipient Ink'],
                      ['textColor', 'Body Ink'],
                      ['sealColor', 'Seal Color'],
                    ] as const
                  ).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center justify-between rounded-xl border border-white/12 bg-[#16140f] px-2.5 py-2 text-[11px] text-neutral-300"
                    >
                      <span>{label}</span>
                      <input
                        type="color"
                        value={draft.palette[key]}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            palette: {
                              ...draft.palette,
                              [key]: e.target.value,
                            },
                          })
                        }
                        className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. DIGITAL SIGNATURE STUDIO */}
          {studioTab === 'signature' && (
            <div className="mt-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/12 bg-[#16140f] p-3.5">
                <label className="flex items-center gap-2 text-xs font-semibold text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.signature.enabled}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        signature: {
                          ...draft.signature,
                          enabled: e.target.checked,
                        },
                      })
                    }
                  />
                  <span>Include Digital Signature on Certificate</span>
                </label>

                {draft.signature.enabled && (
                  <div className="inline-flex rounded-lg border border-white/15 bg-black/40 p-0.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          signature: { ...draft.signature, mode: 'text' },
                        })
                      }
                      className={`rounded-md px-3 py-1 font-semibold cursor-pointer ${
                        draft.signature.mode === 'text'
                          ? 'bg-[#d4af37] text-[#08080a]'
                          : 'text-neutral-300'
                      }`}
                    >
                      Calligraphy Text
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          signature: { ...draft.signature, mode: 'drawn' },
                        })
                      }
                      className={`rounded-md px-3 py-1 font-semibold cursor-pointer ${
                        draft.signature.mode === 'drawn'
                          ? 'bg-[#d4af37] text-[#08080a]'
                          : 'text-neutral-300'
                      }`}
                    >
                      Draw Digital Ink
                    </button>
                  </div>
                )}
              </div>

              {draft.signature.enabled && (
                <>
                  {/* Signature Color & Text */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] text-neutral-400">
                        {draft.signature.mode === 'text'
                          ? 'Customizable Signature Text'
                          : 'Fallback Signature Text'}
                      </label>
                      <input
                        value={draft.signature.signatureText}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            signature: {
                              ...draft.signature,
                              signatureText: e.target.value,
                            },
                          })
                        }
                        placeholder="e.g. Dijan"
                        className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-base text-[#fde68a]"
                        style={{ fontFamily: draft.signature.signatureFont }}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-neutral-400">
                        Calligraphy Signature Font
                      </label>
                      <select
                        value={draft.signature.signatureFont}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            signature: {
                              ...draft.signature,
                              signatureFont: e.target.value,
                            },
                          })
                        }
                        style={{ fontFamily: draft.signature.signatureFont }}
                        className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-sm text-white"
                      >
                        {SIGNATURE_FONT_OPTIONS.map((sf) => (
                          <option
                            key={sf.value}
                            value={sf.value}
                            style={{ fontFamily: sf.value }}
                          >
                            {sf.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Ink Color Picker */}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#16140f] px-3.5 py-2.5">
                    <span className="text-xs text-neutral-300">
                      Signature Ink Color
                    </span>
                    <div className="flex items-center gap-2">
                      {['#f5dc82', '#ffffff', '#1f1912', '#881337', '#1e3a8a'].map(
                        (ink) => (
                          <button
                            key={ink}
                            type="button"
                            onClick={() =>
                              setDraft({
                                ...draft,
                                signature: {
                                  ...draft.signature,
                                  signatureColor: ink,
                                },
                              })
                            }
                            style={{ backgroundColor: ink }}
                            className={`h-6 w-6 rounded-full border cursor-pointer ${
                              draft.signature.signatureColor === ink
                                ? 'border-[#d4af37] ring-2 ring-[#d4af37]/60'
                                : 'border-white/30'
                            }`}
                          />
                        )
                      )}
                      <input
                        type="color"
                        value={draft.signature.signatureColor}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            signature: {
                              ...draft.signature,
                              signatureColor: e.target.value,
                            },
                          })
                        }
                        className="h-7 w-9 cursor-pointer bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Interactive Hand-Drawn Canvas Pad */}
                  {draft.signature.mode === 'drawn' && (
                    <div className="space-y-2 rounded-xl border border-[#d4af37]/35 bg-[#0b0a09] p-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-[11px] text-[#d4af37] uppercase">
                          Digital Ink Pad (Draw with Mouse or Touch)
                        </span>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                            <span>Stroke</span>
                            <input
                              type="range"
                              min={1.5}
                              max={7}
                              step={0.5}
                              value={penSize}
                              onChange={(e) => setPenSize(Number(e.target.value))}
                              className="w-16 accent-[#d4af37]"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={clearPad}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1 text-[11px] text-neutral-200 hover:bg-white/10 cursor-pointer"
                          >
                            <Eraser className="h-3 w-3" />
                            <span>Clear</span>
                          </button>
                        </div>
                      </div>
                      <canvas
                        ref={padRef}
                        width={520}
                        height={150}
                        onMouseDown={startDraw}
                        onMouseMove={moveDraw}
                        onMouseUp={endDraw}
                        onMouseLeave={endDraw}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          startDraw(e);
                        }}
                        onTouchMove={(e) => {
                          e.preventDefault();
                          moveDraw(e);
                        }}
                        onTouchEnd={endDraw}
                        className="h-32 w-full cursor-crosshair rounded-lg border border-dashed border-white/25 bg-[#151310] touch-none"
                      />
                    </div>
                  )}

                  {/* Signatory Name & Role */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] text-neutral-400">
                        Signatory Printed Name
                      </label>
                      <input
                        value={draft.signature.signatoryName}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            signature: {
                              ...draft.signature,
                              signatoryName: e.target.value,
                            },
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-400">
                        Signatory Title / Office
                      </label>
                      <input
                        value={draft.signature.signatoryRole}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            signature: {
                              ...draft.signature,
                              signatoryRole: e.target.value,
                            },
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Secondary Co-Signer Option */}
                  <div className="space-y-3 rounded-xl border border-white/10 bg-[#16140f] p-3.5">
                    <label className="flex items-center gap-2 text-xs font-semibold text-neutral-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.signature.secondaryEnabled}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            signature: {
                              ...draft.signature,
                              secondaryEnabled: e.target.checked,
                            },
                          })
                        }
                      />
                      <span>Enable Secondary Co-Signer Signature</span>
                    </label>

                    {draft.signature.secondaryEnabled && (
                      <div className="grid gap-2.5 sm:grid-cols-3">
                        <input
                          value={draft.signature.secondarySignatureText}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              signature: {
                                ...draft.signature,
                                secondarySignatureText: e.target.value,
                              },
                            })
                          }
                          placeholder="Co-signer signature text"
                          className="rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-xs text-white"
                        />
                        <input
                          value={draft.signature.secondarySignatoryName}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              signature: {
                                ...draft.signature,
                                secondarySignatoryName: e.target.value,
                              },
                            })
                          }
                          placeholder="Co-signer printed name"
                          className="rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-xs text-white"
                        />
                        <input
                          value={draft.signature.secondarySignatoryRole}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              signature: {
                                ...draft.signature,
                                secondarySignatoryRole: e.target.value,
                              },
                            })
                          }
                          placeholder="Co-signer title"
                          className="rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
