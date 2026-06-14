import { prisma } from '../prisma.js';

export type PlanStatus = 'FREE' | 'TRIAL' | 'PREMIUM';

export async function getSubscriptionStatus(guildId: string): Promise<PlanStatus> {
    const sub = await prisma.guildSubscription.findUnique({
        where: { guildId }
    });

    if (!sub) {
        return 'FREE';
    }

    if (sub.plan === 'PREMIUM') {
        if (sub.expiresAt && sub.expiresAt < new Date()) {
            return 'FREE'; // Expired
        }
        return 'PREMIUM';
    }

    if (sub.plan === 'TRIAL') {
        if (sub.trialEndsAt && sub.trialEndsAt < new Date()) {
            return 'FREE'; // Trial expired
        }
        return 'TRIAL';
    }

    return 'FREE';
}

export async function isPremiumOrTrial(guildId: string): Promise<boolean> {
    const status = await getSubscriptionStatus(guildId);
    return status === 'PREMIUM' || status === 'TRIAL';
}

/**
 * 新規サーバー追加時などに、14日間のトライアルを開始するヘルパー関数
 */
export async function startTrial(guildId: string): Promise<void> {
    const existing = await prisma.guildSubscription.findUnique({ where: { guildId } });
    if (!existing) {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14日間のトライアル

        await prisma.guildSubscription.create({
            data: {
                guildId,
                plan: 'TRIAL',
                trialEndsAt,
            }
        });
    }
}
