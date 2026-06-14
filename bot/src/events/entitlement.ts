import { Entitlement } from 'discord.js';
import { prisma } from '../prisma.js';

/**
 * サブスクリプションが新規購入されたときの処理
 */
export async function handleEntitlementCreate(entitlement: Entitlement) {
    if (!entitlement.guildId) return; // サーバー単位の課金のみ対象

    try {
        await prisma.guildSubscription.upsert({
            where: { guildId: entitlement.guildId },
            update: {
                plan: 'PREMIUM',
                purchaseRoute: 'DISCORD',
                expiresAt: entitlement.endsAt,
            },
            create: {
                guildId: entitlement.guildId,
                plan: 'PREMIUM',
                purchaseRoute: 'DISCORD',
                expiresAt: entitlement.endsAt,
            }
        });
        console.log(`[Entitlement] Activated PREMIUM for guild: ${entitlement.guildId}`);
    } catch (error) {
        console.error(`[Entitlement] Failed to process EntitlementCreate for ${entitlement.guildId}`, error);
    }
}

/**
 * サブスクリプションが更新（期間延長やステータス変更）されたときの処理
 */
export async function handleEntitlementUpdate(oldEntitlement: Entitlement | null, newEntitlement: Entitlement) {
    if (!newEntitlement.guildId) return;

    try {
        // isActive() が false の場合は有効期限切れまたは無効化されたと見なす
        const newPlan = newEntitlement.isActive() ? 'PREMIUM' : 'FREE';

        // レコードが存在しない場合は無視するか、念のため作成する
        await prisma.guildSubscription.upsert({
            where: { guildId: newEntitlement.guildId },
            update: {
                plan: newPlan,
                expiresAt: newEntitlement.endsAt,
            },
            create: {
                guildId: newEntitlement.guildId,
                plan: newPlan,
                purchaseRoute: 'DISCORD',
                expiresAt: newEntitlement.endsAt,
            }
        });
        console.log(`[Entitlement] Updated entitlement for guild: ${newEntitlement.guildId}. Status: ${newPlan}`);
    } catch (error) {
        console.error(`[Entitlement] Failed to process EntitlementUpdate for ${newEntitlement.guildId}`, error);
    }
}

/**
 * サブスクリプションが削除（返金や即時解約など）されたときの処理
 */
export async function handleEntitlementDelete(entitlement: Entitlement) {
    if (!entitlement.guildId) return;

    try {
        // 即座に FREE プランへダウングレードする
        await prisma.guildSubscription.update({
            where: { guildId: entitlement.guildId },
            data: {
                plan: 'FREE',
                expiresAt: null
            }
        });
        console.log(`[Entitlement] Deactivated PREMIUM for guild: ${entitlement.guildId}`);
    } catch (error) {
        // まだDBにレコードがない等のエラーは無視できるが念のためログに残す
        console.error(`[Entitlement] Failed to process EntitlementDelete for ${entitlement.guildId}`, error);
    }
}
