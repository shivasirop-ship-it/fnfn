import { createClient } from '@supabase/supabase-js';
import {
  DqrUser,
  QuizPosition,
  QuizRecord,
  ReportCardData,
  SystemMessage,
  Territory,
  TerritoryHistoryEntry,
  TerritoryQuestion,
} from '../types';

const RAW_SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://wmaklxnxmtvfshjzubic.supabase.co';

export const SUPABASE_URL = RAW_SUPABASE_URL.replace(/\/rest\/v1\/?$/i, '').replace(
  /\/+$/,
  ''
);

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_ezxXFoFZJCEzh0ELJaaZnA_4Vy850UH';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DEFAULT_REPORT_CARD: ReportCardData = {
  imageUrl: null,
  grade: '',
  presentation: '',
  totalQuestionsStudied: '0',
  remarks: '',
  updatedAt: '',
};

/**
 * Compresses an uploaded image file on an offscreen canvas so it stays lightweight
 * for both Supabase Storage and localStorage fallback.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1100,
  quality = 0.84
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error('Invalid image.'));
      };
      img.onload = () => {
        const scale = Math.min(1, maxWidth / Math.max(1, img.width));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image file to the `dqr-media` Supabase Storage bucket if available,
 * and seamlessly falls back to a compressed Data URL if the bucket hasn't been created yet.
 */
export async function uploadDqrMedia(
  file: File,
  folder: string
): Promise<string> {
  const compressedDataUrl = await compressImageFile(file);

  try {
    const res = await fetch(compressedDataUrl);
    const blob = await res.blob();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${folder}/${Date.now()}_${safeName}`;

    const { error } = await supabase.storage
      .from('dqr-media')
      .upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (!error) {
      const { data } = supabase.storage.from('dqr-media').getPublicUrl(path);
      if (data?.publicUrl) return data.publicUrl;
    }
  } catch {
    // Graceful fallback to compressed data URL
  }

  return compressedDataUrl;
}

export async function loadAllStoreFromSupabase(): Promise<
  Record<string, unknown>
> {
  try {
    const { data, error } = await supabase
      .from('dqr_app_store')
      .select('store_key, payload');

    if (error || !data) return {};
    const out: Record<string, unknown> = {};
    for (const row of data) {
      if (row && typeof row.store_key === 'string') {
        out[row.store_key] = row.payload;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export async function loadStoreFromSupabase<T>(
  storeKey: string
): Promise<T | null> {
  try {
    const { data, error } = await supabase
      .from('dqr_app_store')
      .select('payload')
      .eq('store_key', storeKey)
      .maybeSingle();

    if (error || !data) return null;
    return data.payload as T;
  } catch {
    return null;
  }
}

export async function saveStoreToSupabase<T>(
  storeKey: string,
  payload: T
): Promise<boolean> {
  try {
    const { error } = await supabase.from('dqr_app_store').upsert(
      {
        store_key: storeKey,
        payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'store_key' }
    );
    return !error;
  } catch {
    return false;
  }
}

/* ==================== USERS TABLE (DIRECT SOURCE OF TRUTH) ==================== */

export function mapSupabaseRowToUser(row: Record<string, unknown>): DqrUser {
  const rawReport =
    row.report_card && typeof row.report_card === 'object'
      ? (row.report_card as Partial<ReportCardData>)
      : {};
  return {
    id: String(row.id || ''),
    username: String(row.username || ''),
    pin: String(row.pin || ''),
    fullName: String(row.full_name || ''),
    role: row.role === 'admin' ? 'admin' : 'member',
    createdAt: String(row.created_at || ''),
    photoUrl: typeof row.photo_url === 'string' ? row.photo_url : null,
    bio: typeof row.bio === 'string' ? row.bio : '',
    favouriteTopic:
      typeof row.favourite_topic === 'string' ? row.favourite_topic : '',
    isOnline: Boolean(row.is_online),
    lastLoggedIn:
      typeof row.last_logged_in === 'string' ? row.last_logged_in : '',
    xp: typeof row.xp === 'number' ? row.xp : Number(row.xp ?? 500),
    level: typeof row.level === 'number' ? row.level : Number(row.level ?? 1),
    rankId: typeof row.rank_id === 'string' ? row.rank_id : 'rk-g4',
    streak:
      typeof row.streak === 'number' ? row.streak : Number(row.streak ?? 1),
    tagline: typeof row.tagline === 'string' ? row.tagline : '',
    announcement:
      typeof row.announcement === 'string' ? row.announcement : '',
    announcementChecked: Boolean(row.announcement_checked),
    ownedTitleIds: Array.isArray(row.owned_title_ids)
      ? (row.owned_title_ids as string[])
      : [],
    equippedTitleId:
      typeof row.equipped_title_id === 'string' ? row.equipped_title_id : null,
    achievementIds: Array.isArray(row.achievement_ids)
      ? (row.achievement_ids as string[])
      : [],
    equippedAchievementIds: Array.isArray(row.equipped_achievement_ids)
      ? (row.equipped_achievement_ids as string[])
      : [],
    reportCard: {
      ...DEFAULT_REPORT_CARD,
      ...rawReport,
    },
  };
}

function userToSupabaseRow(u: DqrUser) {
  return {
    id: u.id,
    username: u.username,
    pin: u.pin,
    full_name: u.fullName,
    role: u.role,
    created_at: u.createdAt,
    photo_url: u.photoUrl,
    bio: u.bio,
    favourite_topic: u.favouriteTopic,
    is_online: u.isOnline,
    last_logged_in: u.lastLoggedIn,
    xp: u.xp,
    level: u.level,
    rank_id: u.rankId,
    streak: u.streak,
    tagline: u.tagline,
    announcement: u.announcement,
    announcement_checked: u.announcementChecked,
    owned_title_ids: u.ownedTitleIds,
    equipped_title_id: u.equippedTitleId,
    achievement_ids: u.achievementIds,
    equipped_achievement_ids: u.equippedAchievementIds,
    report_card: u.reportCard,
  };
}

export async function loadUsersFromSupabaseTable(): Promise<DqrUser[] | null> {
  try {
    const { data, error } = await supabase
      .from('dqr_users')
      .select('*')
      .order('created_at', { ascending: true });
    if (error || !data) return null;
    return data.map((row) => mapSupabaseRowToUser(row as Record<string, unknown>));
  } catch {
    return null;
  }
}

export async function verifyUserCredentialsInSupabase(
  username: string,
  pin: string
): Promise<
  { status: 'ok'; user: DqrUser } | { status: 'invalid' } | { status: 'offline' }
> {
  try {
    const { data, error } = await supabase
      .from('dqr_users')
      .select('*')
      .ilike('username', username.trim())
      .limit(1)
      .maybeSingle();

    if (error) return { status: 'offline' };
    if (!data) return { status: 'invalid' };
    const user = mapSupabaseRowToUser(data as Record<string, unknown>);
    if (user.pin !== pin.trim()) return { status: 'invalid' };
    return { status: 'ok', user };
  } catch {
    return { status: 'offline' };
  }
}

export async function upsertUserToSupabaseTable(user: DqrUser): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('dqr_users')
      .upsert(userToSupabaseRow(user), { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function syncUsersToSupabaseTable(
  users: DqrUser[]
): Promise<boolean> {
  try {
    if (users.length === 0) return true;
    const rows = users.map(userToSupabaseRow);
    const { error } = await supabase
      .from('dqr_users')
      .upsert(rows, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteUserFromSupabaseTable(
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('dqr_users')
      .delete()
      .eq('id', userId);
    return !error;
  } catch {
    return false;
  }
}

/* ==================== QUIZZES TABLE ==================== */

export function mapSupabaseRowToQuiz(row: Record<string, unknown>): QuizRecord {
  return {
    id: String(row.id || ''),
    quizName: String(row.quiz_name || ''),
    yearBS: String(row.year_bs || ''),
    position: (row.position as QuizPosition) || 'Not Qualified',
    host: String(row.host || ''),
    players: Array.isArray(row.players) ? (row.players as string[]) : [],
    teamCount:
      typeof row.team_count === 'number'
        ? row.team_count
        : Number(row.team_count ?? 1),
    rating:
      typeof row.rating === 'number' ? row.rating : Number(row.rating ?? 8),
    extraNote: typeof row.extra_note === 'string' ? row.extra_note : '',
    photos: Array.isArray(row.photos) ? (row.photos as string[]) : [],
    createdAt:
      typeof row.created_at === 'number'
        ? row.created_at
        : Number(row.created_at ?? Date.now()),
  };
}

function quizToSupabaseRow(q: QuizRecord) {
  return {
    id: q.id,
    quiz_name: q.quizName,
    year_bs: q.yearBS,
    position: q.position,
    host: q.host,
    players: q.players,
    team_count: q.teamCount,
    rating: q.rating,
    extra_note: q.extraNote,
    photos: q.photos,
    created_at: q.createdAt,
  };
}

export async function loadQuizzesFromSupabaseTable(): Promise<
  QuizRecord[] | null
> {
  try {
    const { data, error } = await supabase
      .from('dqr_quizzes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return null;
    return data.map((row) => mapSupabaseRowToQuiz(row as Record<string, unknown>));
  } catch {
    return null;
  }
}

export async function upsertQuizToSupabaseTable(
  quiz: QuizRecord
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('dqr_quizzes')
      .upsert(quizToSupabaseRow(quiz), { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function syncQuizzesToSupabaseTable(
  quizzes: QuizRecord[]
): Promise<boolean> {
  try {
    if (quizzes.length === 0) return true;
    const rows = quizzes.map(quizToSupabaseRow);
    const { error } = await supabase
      .from('dqr_quizzes')
      .upsert(rows, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteQuizFromSupabaseTable(
  quizId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('dqr_quizzes')
      .delete()
      .eq('id', quizId);
    return !error;
  } catch {
    return false;
  }
}

/* ==================== TERRITORIES TABLE ==================== */

export function mapSupabaseRowToTerritory(
  row: Record<string, unknown>,
  fallbackIcons?: Record<
    string,
    { iconType: Territory['iconType']; customIconUrl: string | null }
  >
): Territory {
  const id = String(row.id || '');
  const fallback = fallbackIcons?.[id];
  const rawIconType = row.icon_type;
  const validIcons: Territory['iconType'][] = [
    'citadel',
    'observatory',
    'sanctum',
    'spire',
    'bastion',
    'vault',
  ];
  const iconType =
    typeof rawIconType === 'string' &&
    validIcons.includes(rawIconType as Territory['iconType'])
      ? (rawIconType as Territory['iconType'])
      : fallback?.iconType ?? 'citadel';

  return {
    id,
    code: String(row.code || ''),
    name: String(row.name || ''),
    description: typeof row.description === 'string' ? row.description : '',
    iconType,
    customIconUrl:
      typeof row.custom_icon_url === 'string'
        ? row.custom_icon_url
        : fallback?.customIconUrl ?? null,
    durationMinutes:
      typeof row.duration_minutes === 'number'
        ? row.duration_minutes
        : Number(row.duration_minutes ?? 10),
    currentHolderUserId:
      typeof row.current_holder_user_id === 'string'
        ? row.current_holder_user_id
        : null,
    currentHolderName:
      typeof row.current_holder_name === 'string'
        ? row.current_holder_name
        : null,
    highestScore:
      typeof row.highest_score === 'number'
        ? row.highest_score
        : Number(row.highest_score ?? 0),
    wonOn: typeof row.won_on === 'string' ? row.won_on : null,
    questions: Array.isArray(row.questions)
      ? (row.questions as TerritoryQuestion[])
      : [],
    history: Array.isArray(row.history)
      ? (row.history as TerritoryHistoryEntry[])
      : [],
    attemptedUserIds: Array.isArray(row.attempted_user_ids)
      ? (row.attempted_user_ids as string[])
      : [],
  };
}

function territoryToSupabaseRow(t: Territory, includeIconCols = true) {
  const base = {
    id: t.id,
    code: t.code,
    name: t.name,
    description: t.description,
    duration_minutes: t.durationMinutes,
    current_holder_user_id: t.currentHolderUserId,
    current_holder_name: t.currentHolderName,
    highest_score: t.highestScore,
    won_on: t.wonOn,
    questions: t.questions,
    history: t.history,
    attempted_user_ids: t.attemptedUserIds,
  };
  if (!includeIconCols) return base;
  return {
    ...base,
    icon_type: t.iconType,
    custom_icon_url: t.customIconUrl,
  };
}

export async function loadTerritoriesFromSupabaseTable(
  fallbackIcons?: Record<
    string,
    { iconType: Territory['iconType']; customIconUrl: string | null }
  >
): Promise<Territory[] | null> {
  try {
    const { data, error } = await supabase
      .from('dqr_territories')
      .select('*')
      .order('code', { ascending: true });
    if (error || !data) return null;
    return data.map((row) =>
      mapSupabaseRowToTerritory(row as Record<string, unknown>, fallbackIcons)
    );
  } catch {
    return null;
  }
}

export async function upsertTerritoryToSupabaseTable(
  territory: Territory
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('dqr_territories')
      .upsert(territoryToSupabaseRow(territory, true), { onConflict: 'id' });
    if (!error) return true;
    const retry = await supabase
      .from('dqr_territories')
      .upsert(territoryToSupabaseRow(territory, false), { onConflict: 'id' });
    return !retry.error;
  } catch {
    return false;
  }
}

export async function syncTerritoriesToSupabaseTable(
  territories: Territory[]
): Promise<boolean> {
  try {
    if (territories.length === 0) return true;
    const rowsWithIcons = territories.map((t) =>
      territoryToSupabaseRow(t, true)
    );
    const { error } = await supabase
      .from('dqr_territories')
      .upsert(rowsWithIcons, { onConflict: 'id' });
    if (!error) return true;
    const rowsBase = territories.map((t) => territoryToSupabaseRow(t, false));
    const retry = await supabase
      .from('dqr_territories')
      .upsert(rowsBase, { onConflict: 'id' });
    return !retry.error;
  } catch {
    return false;
  }
}

/* ==================== SYSTEM MESSAGES TABLE ==================== */

export function mapSupabaseRowToSystemMessage(
  row: Record<string, unknown>
): SystemMessage {
  return {
    id: String(row.id || ''),
    userId: String(row.user_id || ''),
    sender: row.sender === 'system' ? 'system' : 'user',
    text: String(row.text || ''),
    createdAt:
      typeof row.created_at === 'number'
        ? row.created_at
        : Number(row.created_at ?? Date.now()),
    readByAdmin: Boolean(row.read_by_admin),
    readByUser: Boolean(row.read_by_user),
  };
}

function messageToSupabaseRow(m: SystemMessage) {
  return {
    id: m.id,
    user_id: m.userId,
    sender: m.sender,
    text: m.text,
    created_at: m.createdAt,
    read_by_admin: m.readByAdmin,
    read_by_user: m.readByUser,
  };
}

export async function loadSystemMessagesFromSupabaseTable(): Promise<
  SystemMessage[] | null
> {
  try {
    const { data, error } = await supabase
      .from('dqr_system_messages')
      .select('*')
      .order('created_at', { ascending: true });
    if (error || !data) return null;
    return data.map((row) =>
      mapSupabaseRowToSystemMessage(row as Record<string, unknown>)
    );
  } catch {
    return null;
  }
}

export async function upsertSystemMessageToSupabaseTable(
  msg: SystemMessage
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('dqr_system_messages')
      .upsert(messageToSupabaseRow(msg), { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function syncSystemMessagesToSupabaseTable(
  messages: SystemMessage[]
): Promise<boolean> {
  try {
    if (messages.length === 0) return true;
    const rows = messages.map(messageToSupabaseRow);
    const { error } = await supabase
      .from('dqr_system_messages')
      .upsert(rows, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}
