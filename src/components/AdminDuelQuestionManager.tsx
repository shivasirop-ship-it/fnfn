import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  FileSpreadsheet,
  Filter,
  Flag,
  Plus,
  Search,
  Settings,
  Trash2,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import {
  DuelConfig,
  DuelDifficulty,
  DuelQuestion,
  DuelQuestionStatus,
} from '../types';
import {
  findDuplicateQuestionGroups,
  findPotentialDuplicate,
  generateSampleDuelCsv,
  getTopicReadiness,
  parseDuelCsv,
} from '../utils/duelHelpers';

interface AdminDuelQuestionManagerProps {
  questions: DuelQuestion[];
  duelConfig: DuelConfig;
  onSaveQuestions: (next: DuelQuestion[]) => void;
  onSaveDuelConfig: (next: DuelConfig) => void;
  onToast: (msg: string) => void;
}

export function AdminDuelQuestionManager({
  questions,
  duelConfig,
  onSaveQuestions,
  onSaveDuelConfig,
  onToast,
}: AdminDuelQuestionManagerProps) {
  // Settings buffer
  const [secondsDraft, setSecondsDraft] = useState(
    String(duelConfig.secondsPerQuestion || 15)
  );
  const [wagerDraft, setWagerDraft] = useState(
    String(duelConfig.wagerXp || 1000)
  );
  const [newTopicInput, setNewTopicInput] = useState('');

  // Filter state
  const [statusFilter, setStatusFilter] = useState<
    'all' | DuelQuestionStatus | 'flagged' | 'duplicates'
  >('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [diffFilter, setDiffFilter] = useState<'all' | DuelDifficulty>('all');
  const [searchText, setSearchText] = useState('');

  // Add / Edit Question Form state
  const [composerMode, setComposerMode] = useState<
    'none' | 'manual' | 'csv'
  >('none');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [qTopic, setQTopic] = useState(duelConfig.topics[0] || 'Mathematics');
  const [qSubtopic, setQSubtopic] = useState('');
  const [qDiff, setQDiff] = useState<DuelDifficulty>('medium');
  const [qPrompt, setQPrompt] = useState('');
  const [qOptA, setQOptA] = useState('');
  const [qOptB, setQOptB] = useState('');
  const [qOptC, setQOptC] = useState('');
  const [qOptD, setQOptD] = useState('');
  const [qCorrect, setQCorrect] = useState<'0' | '1' | '2' | '3'>('0');
  const [qStatus, setQStatus] = useState<DuelQuestionStatus>('approved');

  // CSV Import state
  const [csvText, setCsvText] = useState('');
  const [csvDefaultStatus, setCsvDefaultStatus] = useState<
    'approved' | 'pending'
  >('approved');
  const [skipCsvDuplicates, setSkipCsvDuplicates] = useState(true);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);

  const allTopics = useMemo(() => {
    const set = new Set<string>(duelConfig.topics);
    for (const q of questions) {
      if (q.topic.trim()) set.add(q.topic.trim());
    }
    return Array.from(set);
  }, [duelConfig.topics, questions]);

  const approvedCount = questions.filter((q) => q.status === 'approved').length;
  const pendingCount = questions.filter((q) => q.status === 'pending').length;
  const flaggedCount = questions.filter((q) => q.flaggedCount > 0).length;

  const duplicateGroups = useMemo(
    () => findDuplicateQuestionGroups(questions),
    [questions]
  );
  const duplicateIds = useMemo(
    () => new Set(duplicateGroups.flat().map((q) => q.id)),
    [duplicateGroups]
  );
  const redundantDuplicateCount = useMemo(
    () =>
      duplicateGroups.reduce(
        (sum, group) => sum + Math.max(0, group.length - 1),
        0
      ),
    [duplicateGroups]
  );

  const liveDuplicate = useMemo(() => {
    if (composerMode !== 'manual' || qPrompt.trim().length < 6) return null;
    return findPotentialDuplicate(questions, qPrompt, editingId);
  }, [composerMode, qPrompt, questions, editingId]);

  const csvPreview = useMemo(() => {
    if (composerMode !== 'csv' || !csvText.trim()) {
      return { totalValid: 0, uniqueCount: 0, duplicateCount: 0 };
    }
    const parsed = parseDuelCsv(csvText, csvDefaultStatus);
    const workingBank: DuelQuestion[] = [...questions];
    let uniqueCount = 0;
    let duplicateCount = 0;
    for (const q of parsed.questions) {
      if (findPotentialDuplicate(workingBank, q.question)) {
        duplicateCount += 1;
      } else {
        uniqueCount += 1;
        workingBank.push(q);
      }
    }
    return {
      totalValid: parsed.questions.length,
      uniqueCount,
      duplicateCount,
    };
  }, [composerMode, csvText, csvDefaultStatus, questions]);

  const topicSummaries = useMemo(
    () => allTopics.map((t) => getTopicReadiness(questions, t)),
    [allTopics, questions]
  );

  const filteredQuestions = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return [...questions]
      .filter((q) => {
        if (statusFilter === 'flagged') {
          if (q.flaggedCount <= 0) return false;
        } else if (statusFilter === 'duplicates') {
          if (!duplicateIds.has(q.id)) return false;
        } else if (statusFilter !== 'all' && q.status !== statusFilter) {
          return false;
        }
        if (
          topicFilter !== 'all' &&
          q.topic.toLowerCase() !== topicFilter.toLowerCase()
        ) {
          return false;
        }
        if (diffFilter !== 'all' && q.difficulty !== diffFilter) return false;
        if (query) {
          const hit =
            q.question.toLowerCase().includes(query) ||
            q.topic.toLowerCase().includes(query) ||
            (q.subtopic || '').toLowerCase().includes(query) ||
            q.options.some((o) => o.toLowerCase().includes(query));
          if (!hit) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (statusFilter === 'duplicates') {
          return a.question.localeCompare(b.question);
        }
        if (a.flaggedCount !== b.flaggedCount) return b.flaggedCount - a.flaggedCount;
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (b.status === 'pending' && a.status !== 'pending') return 1;
        return b.createdAt - a.createdAt;
      });
  }, [
    questions,
    statusFilter,
    topicFilter,
    diffFilter,
    searchText,
    duplicateIds,
  ]);

  const resetForm = () => {
    setEditingId(null);
    setQTopic(allTopics[0] || 'Mathematics');
    setQSubtopic('');
    setQDiff('medium');
    setQPrompt('');
    setQOptA('');
    setQOptB('');
    setQOptC('');
    setQOptD('');
    setQCorrect('0');
    setQStatus('approved');
  };

  const startEdit = (q: DuelQuestion) => {
    setEditingId(q.id);
    setQTopic(q.topic);
    setQSubtopic(q.subtopic || '');
    setQDiff(q.difficulty);
    setQPrompt(q.question);
    setQOptA(q.options[0]);
    setQOptB(q.options[1]);
    setQOptC(q.options[2]);
    setQOptD(q.options[3]);
    setQCorrect(String(q.correctIndex) as '0' | '1' | '2' | '3');
    setQStatus(q.status);
    setComposerMode('manual');
  };

  const handleSaveManual = (e: FormEvent) => {
    e.preventDefault();
    if (
      !qTopic.trim() ||
      !qPrompt.trim() ||
      !qOptA.trim() ||
      !qOptB.trim() ||
      !qOptC.trim() ||
      !qOptD.trim()
    ) {
      onToast('Fill topic, question, and all 4 options A–D.');
      return;
    }

    const cleanTopic = qTopic.trim();
    if (!duelConfig.topics.includes(cleanTopic)) {
      onSaveDuelConfig({
        ...duelConfig,
        topics: [...duelConfig.topics, cleanTopic],
      });
    }

    if (editingId) {
      onSaveQuestions(
        questions.map((item) =>
          item.id === editingId
            ? {
                ...item,
                topic: cleanTopic,
                subtopic: qSubtopic.trim() || undefined,
                difficulty: qDiff,
                question: qPrompt.trim(),
                options: [
                  qOptA.trim(),
                  qOptB.trim(),
                  qOptC.trim(),
                  qOptD.trim(),
                ],
                correctIndex: Number(qCorrect) as 0 | 1 | 2 | 3,
                status: qStatus,
              }
            : item
        )
      );
      onToast('1v1 question updated.');
    } else {
      const created: DuelQuestion = {
        id: `dq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        topic: cleanTopic,
        subtopic: qSubtopic.trim() || undefined,
        difficulty: qDiff,
        question: qPrompt.trim(),
        options: [qOptA.trim(), qOptB.trim(), qOptC.trim(), qOptD.trim()],
        correctIndex: Number(qCorrect) as 0 | 1 | 2 | 3,
        status: qStatus,
        isActive: true,
        timesUsed: 0,
        lastUsedAt: null,
        recentlySeenBy: [],
        flaggedCount: 0,
        flaggedReasons: [],
        flaggedByUserIds: [],
        createdAt: Date.now(),
      };
      onSaveQuestions([created, ...questions]);
      onToast('Question added to 1v1 bank.');
    }

    resetForm();
    setComposerMode('none');
  };

  const handleCsvFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      setCsvText(text);
    } catch {
      onToast('Could not read CSV file.');
    }
  };

  const handleImportCsv = () => {
    const result = parseDuelCsv(csvText, csvDefaultStatus);
    setCsvErrors(result.errors);
    if (result.questions.length === 0) {
      onToast('No valid questions found in CSV.');
      return;
    }

    let toImport: DuelQuestion[] = result.questions;
    let skipped = 0;

    if (skipCsvDuplicates) {
      const workingBank = [...questions];
      const accepted: DuelQuestion[] = [];
      for (const q of result.questions) {
        if (findPotentialDuplicate(workingBank, q.question)) {
          skipped += 1;
        } else {
          accepted.push(q);
          workingBank.push(q);
        }
      }
      toImport = accepted;
    }

    if (toImport.length === 0) {
      onToast(
        `All ${skipped} parsed question${skipped === 1 ? '' : 's'} already exist in the bank.`
      );
      return;
    }

    const discoveredTopics = new Set(duelConfig.topics);
    for (const q of toImport) {
      discoveredTopics.add(q.topic);
    }
    onSaveDuelConfig({
      ...duelConfig,
      topics: Array.from(discoveredTopics),
    });
    onSaveQuestions([...toImport, ...questions]);
    setCsvText('');
    onToast(
      `Imported ${toImport.length} new question${
        toImport.length === 1 ? '' : 's'
      }${skipped > 0 ? ` · Skipped ${skipped} duplicate${skipped === 1 ? '' : 's'}` : ''}.`
    );
    if (result.errors.length === 0) {
      setComposerMode('none');
    }
  };

  const handleDeduplicateBank = () => {
    if (duplicateGroups.length === 0) return;
    const removeIds = new Set<string>();
    for (const group of duplicateGroups) {
      const sorted = [...group].sort((a, b) => {
        if (b.timesUsed !== a.timesUsed) return b.timesUsed - a.timesUsed;
        if (a.status === 'approved' && b.status !== 'approved') return -1;
        if (b.status === 'approved' && a.status !== 'approved') return 1;
        return a.createdAt - b.createdAt;
      });
      sorted.slice(1).forEach((dup) => removeIds.add(dup.id));
    }
    onSaveQuestions(questions.filter((q) => !removeIds.has(q.id)));
    if (statusFilter === 'duplicates') {
      setStatusFilter('all');
    }
    onToast(
      `Removed ${removeIds.size} exact duplicate question${
        removeIds.size === 1 ? '' : 's'
      }.`
    );
  };

  const handleDownloadSampleCsv = () => {
    const blob = new Blob([generateSampleDuelCsv()], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dqr_1v1_sample_questions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveSettings = () => {
    const sec = Math.min(120, Math.max(5, Number(secondsDraft) || 15));
    const wager = Math.max(100, Number(wagerDraft) || 1000);
    setSecondsDraft(String(sec));
    setWagerDraft(String(wager));
    onSaveDuelConfig({
      ...duelConfig,
      secondsPerQuestion: sec,
      wagerXp: wager,
    });
    onToast(`1v1 Match rules saved (${sec}s/question · ${wager} XP stake).`);
  };

  const handleAddTopic = () => {
    const clean = newTopicInput.trim();
    if (!clean) return;
    if (allTopics.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      onToast('Topic already exists.');
      return;
    }
    onSaveDuelConfig({
      ...duelConfig,
      topics: [...duelConfig.topics, clean],
    });
    setNewTopicInput('');
    onToast(`Added topic "${clean}".`);
  };

  return (
    <div className="mt-7 space-y-6">
      {/* Header & Top Metrics */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-bold tracking-[0.18em] text-[#d4af37] uppercase">
            1v1 Question Manager · Admin Only
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold text-[#f8e6a0]">
            Central Question Bank &amp; Recycling Rules
          </h2>
          <p className="mt-1 text-xs text-neutral-400">
            Matches pull 3 Easy, 4 Medium, and 3 Hard approved questions strictly
            from the chosen topic, prioritizing unseen &amp; least-used items.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              if (composerMode === 'manual' && !editingId) {
                setComposerMode('none');
              } else {
                resetForm();
                setComposerMode('manual');
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#d4af37] px-4 py-2 text-xs font-bold text-[#08080a] hover:bg-[#f0cb65] cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Question</span>
          </button>
          <button
            type="button"
            onClick={() =>
              setComposerMode((m) => (m === 'csv' ? 'none' : 'csv'))
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#d4af37]/45 bg-[#16130b] px-4 py-2 text-xs font-bold text-[#f8e6a0] hover:border-[#f0cb65] cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Import CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#100f0c] p-4">
          <p className="font-mono text-[11px] text-neutral-400 uppercase">
            Total Questions
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-white tabular-nums">
            {questions.length}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-400/25 bg-[#100f0c] p-4">
          <p className="font-mono text-[11px] text-emerald-300 uppercase">
            Approved &amp; Playable
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-200 tabular-nums">
            {approvedCount}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-400/25 bg-[#100f0c] p-4">
          <p className="font-mono text-[11px] text-amber-300 uppercase">
            Pending Review
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-amber-200 tabular-nums">
            {pendingCount}
          </p>
        </div>
        <div className="rounded-2xl border border-rose-400/25 bg-[#100f0c] p-4">
          <p className="font-mono text-[11px] text-rose-300 uppercase">
            Flagged by Players
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-rose-200 tabular-nums">
            {flaggedCount}
          </p>
        </div>
      </div>

      {/* Match Timer / Wager Settings + Topic Readiness */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 rounded-2xl border border-white/10 bg-[#100f0c] p-5 lg:col-span-5">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-[#d4af37]" />
            <h3 className="font-display text-base font-bold text-[#f8e6a0]">
              1v1 Match Rules &amp; Topics
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] text-neutral-400">
                Seconds per Question
              </label>
              <input
                type="number"
                min={5}
                max={120}
                value={secondsDraft}
                onChange={(e) => setSecondsDraft(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 font-mono text-xs text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-neutral-400">
                XP Stake / Transfer
              </label>
              <input
                type="number"
                min={100}
                step={100}
                value={wagerDraft}
                onChange={(e) => setWagerDraft(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 font-mono text-xs text-white"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveSettings}
            className="rounded-xl border border-[#d4af37]/45 bg-[#d4af37]/15 px-4 py-2 text-xs font-bold text-[#f8e6a0] hover:bg-[#d4af37]/25 cursor-pointer"
          >
            Save Timer &amp; XP Rules
          </button>

          <div className="border-t border-white/10 pt-4">
            <label className="mb-1.5 block text-[11px] text-neutral-400">
              Add New 1v1 Topic
            </label>
            <div className="flex gap-2">
              <input
                value={newTopicInput}
                onChange={(e) => setNewTopicInput(e.target.value)}
                placeholder="e.g. Literature, Sports..."
                className="flex-1 rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
              />
              <button
                type="button"
                onClick={handleAddTopic}
                className="rounded-xl bg-[#d4af37] px-3.5 py-2 text-xs font-bold text-[#08080a] cursor-pointer"
              >
                Add Topic
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#100f0c] p-5 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-base font-bold text-[#f8e6a0]">
              Topic Difficulty Balance &amp; Readiness (3 Easy · 4 Medium · 3 Hard)
            </h3>
            <div className="flex items-center gap-3 font-mono text-[10px] text-neutral-400">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-emerald-400" />
                Easy
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-sky-400" />
                Medium
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-amber-400" />
                Hard
              </span>
            </div>
          </div>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {topicSummaries.map((ts) => {
              const total = Math.max(1, ts.totalApproved);
              const easyPct = (ts.easy / total) * 100;
              const medPct = (ts.medium / total) * 100;
              const hardPct = (ts.hard / total) * 100;
              const completeSets = Math.min(
                Math.floor(ts.easy / 3),
                Math.floor(ts.medium / 4),
                Math.floor(ts.hard / 3)
              );
              const deficits: string[] = [];
              if (ts.easy < 3) deficits.push(`+${3 - ts.easy}E`);
              if (ts.medium < 4) deficits.push(`+${4 - ts.medium}M`);
              if (ts.hard < 3) deficits.push(`+${3 - ts.hard}H`);

              return (
                <div
                  key={ts.topic}
                  className="space-y-2 rounded-xl border border-white/10 bg-[#16140f] px-3.5 py-3 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">
                        {ts.topic}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-neutral-400 tabular-nums">
                        {ts.easy}E · {ts.medium}M · {ts.hard}H ({ts.totalApproved}{' '}
                        approved)
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`font-mono text-[10px] font-bold ${
                          ts.fullDistributionReady
                            ? 'text-emerald-300'
                            : ts.playable
                              ? 'text-amber-300'
                              : 'text-neutral-500'
                        }`}
                      >
                        {ts.fullDistributionReady
                          ? `${completeSets}× 3/4/3 SETS`
                          : ts.playable
                            ? 'PARTIAL'
                            : 'EMPTY'}
                      </span>
                      {duelConfig.topics.length > 1 && (
                        <button
                          type="button"
                          title={`Remove ${ts.topic}`}
                          onClick={() =>
                            onSaveDuelConfig({
                              ...duelConfig,
                              topics: duelConfig.topics.filter(
                                (t) => t !== ts.topic
                              ),
                            })
                          }
                          className="text-neutral-500 hover:text-rose-300 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3-Segment Difficulty Balance Bar */}
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/10">
                    {ts.totalApproved > 0 && (
                      <>
                        <div
                          className="bg-emerald-400"
                          style={{ width: `${easyPct}%` }}
                          title={`Easy: ${ts.easy}`}
                        />
                        <div
                          className="bg-sky-400"
                          style={{ width: `${medPct}%` }}
                          title={`Medium: ${ts.medium}`}
                        />
                        <div
                          className="bg-amber-400"
                          style={{ width: `${hardPct}%` }}
                          title={`Hard: ${ts.hard}`}
                        />
                      </>
                    )}
                  </div>

                  <p className="font-mono text-[10px] text-neutral-400 tabular-nums">
                    {deficits.length === 0
                      ? `Balanced for ${completeSets} unique 3E/4M/3H match${
                          completeSets === 1 ? '' : 'es'
                        }`
                      : `Needs ${deficits.join(', ')} for first full 3E/4M/3H set`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Manual Add / Edit Form */}
      {composerMode === 'manual' && (
        <form
          onSubmit={handleSaveManual}
          className="space-y-4 rounded-2xl border border-[#d4af37]/35 bg-[#12100b] p-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-[#f8e6a0]">
              {editingId ? 'Edit 1v1 Question' : 'Add Question to 1v1 Bank'}
            </h3>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setComposerMode('none');
              }}
              className="text-xs text-neutral-400 hover:text-white cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11px] text-neutral-400">
                Topic *
              </label>
              <select
                value={qTopic}
                onChange={(e) => setQTopic(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
              >
                {allTopics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-neutral-400">
                Subtopic (Optional)
              </label>
              <input
                value={qSubtopic}
                onChange={(e) => setQSubtopic(e.target.value)}
                placeholder="e.g. Calculus"
                className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-neutral-400">
                Difficulty *
              </label>
              <select
                value={qDiff}
                onChange={(e) => setQDiff(e.target.value as DuelDifficulty)}
                className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-neutral-400">
                Approval Status
              </label>
              <select
                value={qStatus}
                onChange={(e) =>
                  setQStatus(e.target.value as DuelQuestionStatus)
                }
                className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
              >
                <option value="approved">Approved</option>
                <option value="pending">Pending Review</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-neutral-400">
              Question Prompt *
            </label>
            <textarea
              rows={2}
              required
              value={qPrompt}
              onChange={(e) => setQPrompt(e.target.value)}
              placeholder="What is the derivative of x²?"
              className="w-full rounded-xl border border-white/15 bg-[#16140f] px-3.5 py-2 text-sm text-white"
            />
            {liveDuplicate && (
              <div
                className={`mt-2 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${
                  liveDuplicate.matchType === 'exact'
                    ? 'border-rose-400/45 bg-rose-500/10 text-rose-200'
                    : 'border-amber-400/45 bg-amber-500/10 text-amber-200'
                }`}
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div>
                  <p className="font-semibold">
                    {liveDuplicate.matchType === 'exact'
                      ? 'Exact duplicate prompt already exists in bank'
                      : 'Near-duplicate prompt detected (>=85% word overlap)'}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] opacity-90">
                    [{liveDuplicate.question.topic} ·{' '}
                    {liveDuplicate.question.difficulty} ·{' '}
                    {liveDuplicate.question.status}] &ldquo;
                    {liveDuplicate.question.question}&rdquo;
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              value={qOptA}
              onChange={(e) => setQOptA(e.target.value)}
              placeholder="Option A *"
              className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
            />
            <input
              required
              value={qOptB}
              onChange={(e) => setQOptB(e.target.value)}
              placeholder="Option B *"
              className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
            />
            <input
              required
              value={qOptC}
              onChange={(e) => setQOptC(e.target.value)}
              placeholder="Option C *"
              className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
            />
            <input
              required
              value={qOptD}
              onChange={(e) => setQOptD(e.target.value)}
              placeholder="Option D *"
              className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-300">Correct Answer:</span>
              {(['0', '1', '2', '3'] as const).map((idx, n) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setQCorrect(idx)}
                  className={`rounded-lg border px-3 py-1 font-mono text-xs font-bold cursor-pointer ${
                    qCorrect === idx
                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                      : 'border-white/15 bg-[#16140f] text-neutral-400'
                  }`}
                >
                  {['A', 'B', 'C', 'D'][n]}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="rounded-xl bg-[#d4af37] px-5 py-2 text-xs font-bold text-[#08080a] cursor-pointer"
            >
              {editingId ? 'Save Changes' : 'Save Question'}
            </button>
          </div>
        </form>
      )}

      {/* CSV Bulk Importer */}
      {composerMode === 'csv' && (
        <div className="space-y-4 rounded-2xl border border-[#d4af37]/35 bg-[#12100b] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-[#f8e6a0]">
                Bulk Import Questions via CSV
              </h3>
              <p className="mt-0.5 text-xs text-neutral-400">
                Columns:{' '}
                <code className="text-[#f5dc82]">
                  topic, difficulty, question, option_a, option_b, option_c,
                  option_d, correct_answer, subtopic
                </code>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadSampleCsv}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#16140f] px-3 py-1.5 text-xs font-semibold text-[#f8e6a0] hover:border-[#d4af37]/40 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Sample CSV</span>
              </button>
              <button
                type="button"
                onClick={() => setComposerMode('none')}
                className="text-xs text-neutral-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#d4af37]/40 bg-[#1a160c] px-4 py-2 text-xs font-semibold text-[#f5dc82]">
              <Upload className="h-3.5 w-3.5" />
              <span>Choose .csv File</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleCsvFileUpload}
                className="hidden"
              />
            </label>

            <select
              value={csvDefaultStatus}
              onChange={(e) =>
                setCsvDefaultStatus(e.target.value as 'approved' | 'pending')
              }
              className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-white"
            >
              <option value="approved">Import as Approved</option>
              <option value="pending">Import to Pending Review</option>
            </select>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-[#16140f] px-3 py-2 text-xs text-neutral-200">
              <input
                type="checkbox"
                checked={skipCsvDuplicates}
                onChange={(e) => setSkipCsvDuplicates(e.target.checked)}
                className="accent-[#d4af37]"
              />
              <span>Skip duplicates automatically</span>
            </label>
          </div>

          <textarea
            rows={6}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={generateSampleDuelCsv()}
            className="w-full rounded-xl border border-white/15 bg-[#16140f] p-3 font-mono text-xs text-white placeholder:text-neutral-600"
          />

          {csvText.trim() && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-[#16140f] px-3.5 py-2 font-mono text-xs text-neutral-300 tabular-nums">
              <span>
                Parsed:{' '}
                <strong className="text-white">{csvPreview.totalValid}</strong>{' '}
                valid
              </span>
              <span>·</span>
              <span className="text-emerald-300">
                New: <strong>{csvPreview.uniqueCount}</strong>
              </span>
              <span>·</span>
              <span
                className={
                  csvPreview.duplicateCount > 0
                    ? 'text-amber-300'
                    : 'text-neutral-400'
                }
              >
                Duplicates: <strong>{csvPreview.duplicateCount}</strong>
                {skipCsvDuplicates && csvPreview.duplicateCount > 0
                  ? ' (will skip)'
                  : ''}
              </span>
            </div>
          )}

          {csvErrors.length > 0 && (
            <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 p-3 text-xs text-rose-200">
              <p className="font-semibold">CSV Notices:</p>
              <ul className="mt-1 list-disc pl-4">
                {csvErrors.slice(0, 6).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            disabled={!csvText.trim()}
            onClick={handleImportCsv}
            className="rounded-xl bg-[#d4af37] px-5 py-2.5 text-xs font-bold text-[#08080a] disabled:opacity-45 cursor-pointer"
          >
            Import Questions Now
          </button>
        </div>
      )}

      {/* Bank Duplicate Scanner Banner */}
      {duplicateGroups.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Copy className="h-4 w-4 shrink-0 text-amber-300" />
            <span>
              Duplicate Detector found{' '}
              <strong className="font-mono">{duplicateGroups.length}</strong>{' '}
              exact duplicate prompt group
              {duplicateGroups.length === 1 ? '' : 's'} (
              <strong className="font-mono">{redundantDuplicateCount}</strong>{' '}
              redundant cop{redundantDuplicateCount === 1 ? 'y' : 'ies'}).
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter('duplicates')}
              className="rounded-lg border border-amber-300/40 bg-black/30 px-3 py-1.5 font-mono text-[11px] font-semibold text-amber-200 hover:bg-black/50 whitespace-nowrap cursor-pointer"
            >
              Inspect Duplicates
            </button>
            <button
              type="button"
              onClick={handleDeduplicateBank}
              className="rounded-lg bg-amber-400 px-3 py-1.5 font-mono text-[11px] font-bold text-[#140e02] hover:bg-amber-300 whitespace-nowrap cursor-pointer"
            >
              Deduplicate Bank (Keep First)
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar & Question List */}
      <div className="space-y-4 rounded-2xl border border-white/10 bg-[#100f0c] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-[#16140f] p-1">
            {(
              [
                { id: 'all', label: `All (${questions.length})` },
                { id: 'approved', label: `Approved (${approvedCount})` },
                { id: 'pending', label: `Pending (${pendingCount})` },
                { id: 'flagged', label: `Flagged (${flaggedCount})` },
                {
                  id: 'duplicates',
                  label: `Duplicates (${duplicateIds.size})`,
                },
                { id: 'rejected', label: 'Rejected' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-[#d4af37] text-[#08080a]'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-neutral-400" />
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-1.5 text-xs text-white"
            >
              <option value="all">All Topics</option>
              {allTopics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={diffFilter}
              onChange={(e) =>
                setDiffFilter(e.target.value as 'all' | DuelDifficulty)
              }
              className="rounded-xl border border-white/15 bg-[#16140f] px-3 py-1.5 text-xs text-white"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search question text, topic, or answers..."
            className="w-full rounded-xl border border-white/10 bg-[#16140f] py-2 pl-9 pr-4 text-xs text-white placeholder:text-neutral-500"
          />
        </div>

        <div className="max-h-[580px] space-y-2.5 overflow-y-auto pr-1">
          {filteredQuestions.length === 0 ? (
            <p className="py-10 text-center text-xs text-neutral-400">
              No questions match this filter.
            </p>
          ) : (
            filteredQuestions.map((q) => (
              <div
                key={q.id}
                className="rounded-xl border border-white/10 bg-[#16140f] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-neutral-400">
                      <span className="font-semibold text-[#f8e6a0]">
                        {q.topic}
                      </span>
                      <span>·</span>
                      <span className="capitalize text-neutral-200">
                        {q.difficulty}
                      </span>
                      {q.subtopic && (
                        <>
                          <span>·</span>
                          <span>{q.subtopic}</span>
                        </>
                      )}
                      <span>·</span>
                      <span
                        className={
                          q.status === 'approved'
                            ? 'text-emerald-300'
                            : q.status === 'pending'
                              ? 'text-amber-300'
                              : 'text-rose-300'
                        }
                      >
                        {q.status.toUpperCase()}
                      </span>
                      <span>·</span>
                      <span className="tabular-nums">
                        Used {q.timesUsed}×
                      </span>
                      {q.lastUsedAt && (
                        <>
                          <span>·</span>
                          <span>
                            Last:{' '}
                            {new Date(q.lastUsedAt).toLocaleDateString()}
                          </span>
                        </>
                      )}
                      {q.flaggedCount > 0 && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-rose-300">
                            <Flag className="h-3 w-3" />
                            Flagged ({q.flaggedCount})
                          </span>
                        </>
                      )}
                    </div>

                    <p className="mt-2 text-sm font-semibold text-white">
                      {q.question}
                    </p>

                    <div className="mt-2 grid gap-1.5 text-xs sm:grid-cols-2">
                      {q.options.map((opt, idx) => (
                        <div
                          key={idx}
                          className={`rounded-lg border px-2.5 py-1 ${
                            idx === q.correctIndex
                              ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200 font-semibold'
                              : 'border-white/10 bg-black/25 text-neutral-400'
                          }`}
                        >
                          {['A', 'B', 'C', 'D'][idx]}. {opt}
                        </div>
                      ))}
                    </div>

                    {q.flaggedReasons && q.flaggedReasons.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-rose-300">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          Report note: {q.flaggedReasons[q.flaggedReasons.length - 1]}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onSaveQuestions(
                          questions.map((x) =>
                            x.id === q.id ? { ...x, isActive: !x.isActive } : x
                          )
                        )
                      }
                      className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] cursor-pointer ${
                        q.isActive
                          ? 'border-emerald-400/35 text-emerald-300'
                          : 'border-white/15 text-neutral-500'
                      }`}
                    >
                      {q.isActive ? 'Active' : 'Paused'}
                    </button>

                    {q.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => {
                          onSaveQuestions(
                            questions.map((x) =>
                              x.id === q.id ? { ...x, status: 'approved' } : x
                            )
                          );
                          onToast('Question approved.');
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 cursor-pointer"
                      >
                        <Check className="h-3 w-3" />
                        <span>Approve</span>
                      </button>
                    )}

                    {q.status !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => {
                          onSaveQuestions(
                            questions.map((x) =>
                              x.id === q.id ? { ...x, status: 'rejected' } : x
                            )
                          );
                          onToast('Question rejected.');
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-400/35 px-2.5 py-1 text-[11px] text-amber-200 cursor-pointer"
                      >
                        <XCircle className="h-3 w-3" />
                        <span>Reject</span>
                      </button>
                    )}

                    {q.flaggedCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          onSaveQuestions(
                            questions.map((x) =>
                              x.id === q.id
                                ? {
                                    ...x,
                                    flaggedCount: 0,
                                    flaggedReasons: [],
                                    flaggedByUserIds: [],
                                  }
                                : x
                            )
                          );
                          onToast('Flags cleared.');
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-sky-400/35 px-2.5 py-1 text-[11px] text-sky-200 cursor-pointer"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Clear Flags</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => startEdit(q)}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1 text-[11px] text-neutral-200 hover:border-[#d4af37]/40 cursor-pointer"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSaveQuestions(questions.filter((x) => x.id !== q.id));
                        onToast('Question deleted.');
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-500/35 px-2.5 py-1 text-[11px] text-rose-300 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
