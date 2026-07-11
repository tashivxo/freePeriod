import { createAdminClient } from '@/lib/supabase/admin';
import { legalConfig } from '@/lib/legal/config';

const UPLOADS_BUCKET = 'uploads';

async function cancelLemonSqueezySubscription(userId: string): Promise<void> {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) return;

  const admin = createAdminClient();
  const { data: subscription } = await admin
    .from('subscriptions')
    .select('ls_subscription_id')
    .eq('user_id', userId)
    .maybeSingle();

  const subscriptionId = subscription?.ls_subscription_id;
  if (!subscriptionId) return;

  try {
    await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/vnd.api+json',
        Authorization: `Bearer ${apiKey}`,
      },
    });
  } catch {
    // Subscription may already be cancelled in Lemon Squeezy
  }
}

async function collectStoragePaths(userId: string): Promise<string[]> {
  const admin = createAdminClient();
  const paths = new Set<string>();

  const { data: uploads } = await admin
    .from('uploads')
    .select('storage_path')
    .eq('user_id', userId);
  uploads?.forEach((row) => paths.add(row.storage_path));

  const { data: lessons } = await admin
    .from('lesson_plans')
    .select('id, template_path')
    .eq('user_id', userId);

  lessons?.forEach((lesson) => {
    if (lesson.template_path) paths.add(lesson.template_path);
  });

  if (lessons?.length) {
    const lessonIds = lessons.map((l) => l.id);
    const { data: exports } = await admin
      .from('exports')
      .select('storage_path')
      .in('lesson_id', lessonIds);
    exports?.forEach((row) => paths.add(row.storage_path));
  }

  return [...paths];
}

async function deleteUserStorage(userId: string): Promise<void> {
  const admin = createAdminClient();
  const paths = await collectStoragePaths(userId);

  if (paths.length > 0) {
    await admin.storage.from(UPLOADS_BUCKET).remove(paths);
  }

  const { data: folderItems } = await admin.storage.from(UPLOADS_BUCKET).list(userId, {
    limit: 1000,
  });

  if (folderItems?.length) {
    const nestedPaths: string[] = [];
    for (const item of folderItems) {
      if (item.id) {
        nestedPaths.push(`${userId}/${item.name}`);
      } else {
        const { data: subItems } = await admin.storage.from(UPLOADS_BUCKET).list(`${userId}/${item.name}`, {
          limit: 1000,
        });
        subItems?.forEach((sub) => nestedPaths.push(`${userId}/${item.name}/${sub.name}`));
      }
    }
    if (nestedPaths.length > 0) {
      await admin.storage.from(UPLOADS_BUCKET).remove(nestedPaths);
    }
  }
}

export type ScheduleDeletionResult = {
  purgeAt: string;
  graceDays: number;
};

/** Marks account for deletion after the grace period and blocks further sign-in. */
export async function scheduleAccountDeletion(userId: string): Promise<ScheduleDeletionResult> {
  const admin = createAdminClient();
  const graceDays = legalConfig.accountDeletionGraceDays;
  const purgeAt = new Date();
  purgeAt.setDate(purgeAt.getDate() + graceDays);

  await cancelLemonSqueezySubscription(userId);

  const { error: updateError } = await admin
    .from('users')
    .update({ deletion_scheduled_at: purgeAt.toISOString() })
    .eq('id', userId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { error: banError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: '876000h',
    user_metadata: {
      deletion_scheduled_at: purgeAt.toISOString(),
    },
  });

  if (banError) {
    throw new Error(banError.message);
  }

  return {
    purgeAt: purgeAt.toISOString(),
    graceDays,
  };
}

/** Permanently deletes a user whose grace period has ended. */
export async function purgeScheduledAccount(userId: string): Promise<void> {
  await deleteUserStorage(userId);

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function purgeDueAccounts(): Promise<{ purged: string[] }> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: dueUsers, error } = await admin
    .from('users')
    .select('id')
    .not('deletion_scheduled_at', 'is', null)
    .lte('deletion_scheduled_at', now);

  if (error) {
    throw new Error(error.message);
  }

  const purged: string[] = [];
  for (const row of dueUsers ?? []) {
    await purgeScheduledAccount(row.id);
    purged.push(row.id);
  }

  return { purged };
}
