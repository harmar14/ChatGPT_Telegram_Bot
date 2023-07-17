import { Telegraf, session } from 'telegraf';
import { message } from 'telegraf/filters'
import { code } from 'telegraf/format';
import config from 'config';
import { ogg } from './voiceProcessor.js';
import { openAI } from './openAI.js';

const INITIAL_SESSION = {
    messages: []
}

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));

bot.use(session());
bot.command('new', async (ctx) => {
    ctx.session = INITIAL_SESSION;
    await ctx.reply('Waiting for a message...');
});
bot.command('start', async (ctx) => {
    ctx.session = INITIAL_SESSION;
    await ctx.reply('Waiting for a message...');
});

bot.on(message('text'), async (ctx) => {
    ctx.session ??= INITIAL_SESSION;
    try {
        await ctx.reply(code('Reading the message...'));
        ctx.session.messages.push({
            role: openAI.roles.USER,
            content: ctx.message.text
        });
        await ctx.reply(code('Answering...'));
        const response = await openAI.chat(ctx.session.messages);
        ctx.session.messages.push({
            role: openAI.roles.ASSISTANT,
            content: response.content
        });
        await ctx.reply(response.content);
    } catch (e) {
        console.log('Error occured while getting voice message.', e.message);
    }
});

bot.on(message('voice'), async (ctx) => {
    ctx.session ??= INITIAL_SESSION;
    try {
        await ctx.reply(code('Listening to the message...'));
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
        const userId = String(ctx.message.from.id);
        // console.log(link.href);
        const oggPath = await ogg.create(link.href, userId);
        const mp3Path = await ogg.convert(oggPath, userId);
        const text = await openAI.transcription(mp3Path);
        await ctx.reply(code(`Message content: ${text}`));
        ctx.session.messages.push({
            role: openAI.roles.USER,
            content: `${text}`
        });
        await ctx.reply(code('Answering...'));
        const response = await openAI.chat(ctx.session.messages);
        ctx.session.messages.push({
            role: openAI.roles.ASSISTANT,
            content: response.content
        });
        await ctx.reply(response.content);
    } catch (e) {
        console.log('Error occured while getting voice message.', e.message);
    }
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));