import { Telegraf, session } from 'telegraf';
import { message } from "telegraf/filters";
import { code } from 'telegraf/format'
import config from "config";
import { ogg } from './ogg.js';
import { openai } from './openai.js';

const INITIAL_SESSION = {
  messages: []
}

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));

// для использования контекста разговора
bot.use(session())

bot.command('new', async (ctx)=>{
  ctx.session = INITIAL_SESSION
  await ctx.reply('Ожидаю вашего сообщения')
})

bot.command('start', async (ctx)=>{
  ctx.session = INITIAL_SESSION
  await ctx.reply('Ожидаю вашего сообщения')
})


// работа с аудио файлом
bot.on('voice', async (ctx) => {
  ctx.session ??= INITIAL_SESSION
  try {
// сообщение для ожидания
    await ctx.reply(code('Работаю над вашим сообщением...'))

    // получаем ссылку на данный аудио-файл
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id)

    // для трансформирования данных
    const userId = String(ctx.message.from.id);
    console.log(link.href);
    const oggPath = await ogg.create(link.href, userId)

    // работаем с кодеками конвертации
    const mp3Path = await ogg.toMp3(oggPath, userId)

    // ожидаем когда аудио сконвертируется в текст
    const text = await openai.transcription(mp3Path)
    await ctx.reply(code(`Ваш запрос: ${text}`))
    ctx.session.messages.push({role: openai.roles.USER, content: text})

    // ожидаем текст выведется ответ от AI
    const response = await openai.chat(ctx.session.messages)
    ctx.session.messages.push({role: openai.roles.ASSISTANT, content: response.content})
    await ctx.reply(response.content)
  } catch (error) {
    console.log('Error while audio message', error.message)
  }
})

// работа с аудио файлом
bot.on('text', async (ctx) => {
  ctx.session ??= INITIAL_SESSION
  try {
// сообщение для ожидания
    await ctx.reply(code('Дай подумать ...'))

    ctx.session.messages.push({role: openai.roles.USER, content: ctx.message.text})

    // ожидаем текст выведется ответ от AI
    const response = await openai.chat(ctx.session.messages)
    ctx.session.messages.push({role: openai.roles.ASSISTANT, content: response.content})
    await ctx.reply(response.content)
  } catch (error) {
    console.log('Error while audio message', error.message)
  }
})


bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));