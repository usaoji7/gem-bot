import { ButtonInteraction, ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';
import { prisma } from '../prisma.js';

export async function handleTicketButton(interaction: ButtonInteraction) {
    const guildId = interaction.guildId;
    const guild = interaction.guild;
    if (!guildId || !guild) return;

    try {
        if (interaction.customId.startsWith('ticket_open_')) {
            await handleTicketOpen(interaction, guild);
        } else if (interaction.customId === 'ticket_close') {
            await handleTicketClose(interaction);
        }
    } catch (error) {
        console.error('Ticket button error:', error);
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp({ content: '❌ エラーが発生しました。', ephemeral: true });
        } else {
            await interaction.reply({ content: '❌ エラーが発生しました。', ephemeral: true });
        }
    }
}

async function handleTicketOpen(interaction: ButtonInteraction, guild: any) {
    const buttonId = interaction.customId.replace('ticket_open_', '');

    const ticketButton = await prisma.ticketButton.findUnique({
        where: { id: buttonId }
    });

    if (!ticketButton || ticketButton.guildId !== guild.id) {
        await interaction.reply({ content: '❌ このボタンの設定が見つかりません。（削除された可能性があります）', ephemeral: true });
        return;
    }

    await interaction.deferReply({ ephemeral: true });

    // 既存のチケット数を確認 (同時に3つまで)
    const activeTickets = await prisma.ticket.findMany({
        where: {
            guildId: guild.id,
            discordId: interaction.user.id,
        }
    });

    // 孤立したレコード（チャンネルが手動で削除された場合など）をクリーンアップ
    let validTicketCount = 0;
    for (const ticket of activeTickets) {
        const channelExists = await guild.channels.fetch(ticket.channelId).catch(() => null);
        if (channelExists) {
            validTicketCount++;
        } else {
            // チャンネルが既に存在しない場合はレコードを削除
            await prisma.ticket.delete({ where: { id: ticket.id } }).catch(() => {});
        }
    }

    if (validTicketCount >= 3) {
        await interaction.editReply({ content: '⚠️ 同時に開けるチケットは3つまでです。既存のチケットを閉じてから新しく作成してください。' });
        return;
    }

    // チャンネル名の生成
    const channelName = `ticket-${interaction.user.username.slice(0, 10)}`;

    // ロールIDの配列
    const roleIds = ticketButton.roleIds.split(',').filter((id: string) => id.trim() !== '');

    // 権限の設定 (Permission Overwrites)
    const permissionOverwrites: any[] = [
        {
            id: guild.id, // @everyone role ID
            deny: [PermissionFlagsBits.ViewChannel],
        },
        {
            id: interaction.client.user.id, // Bot
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
        },
        {
            id: interaction.user.id, // チケット作成者
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
        }
    ];

    // 対応者ロールの権限追加
    for (const roleId of roleIds) {
        permissionOverwrites.push({
            id: roleId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
        });
    }

    // チャンネルの作成
    const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: ticketButton.categoryId || undefined,
        permissionOverwrites: permissionOverwrites,
    });

    // DBにチケットを記録
    await prisma.ticket.create({
        data: {
            guildId: guild.id,
            channelId: channel.id,
            discordId: interaction.user.id,
            buttonId: ticketButton.id,
        }
    });

    // チャンネル内に初期メッセージを送信
    const roleMentions = roleIds.map((id: string) => `<@&${id}>`).join(' ');
    
    const closeButton = new ButtonBuilder()
        .setCustomId('ticket_close')
        .setStyle(ButtonStyle.Danger)
        .setLabel('🔒 チケットを閉じる（削除する）');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(closeButton);

    await channel.send({
        content: `お問い合わせありがとうございます、<@${interaction.user.id}> さん！\n対応スタッフ(${roleMentions})が確認いたしますので、ご用件をこのチャンネルに送信してください。\n\n※問題が解決した場合は、下のボタンを押してチケットを閉じてください。`,
        components: [row]
    });

    await interaction.editReply({ content: `✅ チケットを作成しました: <#${channel.id}>` });
}

async function handleTicketClose(interaction: ButtonInteraction) {
    if (!interaction.channel || !interaction.channel.isTextBased()) return;
    
    // DBからチケット情報を検索
    const ticketRecord = await prisma.ticket.findUnique({
        where: { channelId: interaction.channel.id }
    });

    // 権限チェック：作成者本人、またはチケット対応者（管理者など）のみが閉じられる
    // 基本的にボタンが押せれば許可するが、一応簡単なチェックを入れるのもアリ
    // 今回はボタンを押せる（＝チャンネルが見えている）人は誰でも閉じられる仕様とする

    await interaction.reply({ content: '🔒 5秒後にこのチケット（チャンネル）を削除します...' });

    if (ticketRecord) {
        await prisma.ticket.delete({
            where: { id: ticketRecord.id }
        });
    }

    setTimeout(async () => {
        try {
            await interaction.channel?.delete();
        } catch (e) {
            console.error('Failed to delete ticket channel:', e);
        }
    }, 5000);
}
