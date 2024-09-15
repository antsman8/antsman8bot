import { Controller } from '@nestjs/common';
import { LinksService } from '../linkSaver/linkSaver.service';
import { Telegraf } from 'telegraf';
import { CreateLinkDto } from './DTO/linkSaver.dto';
import { ConfigService } from '@nestjs/config';
import { validate } from 'class-validator';

@Controller('links')
export class LinksController {
  private bot: Telegraf;

  constructor(
    private readonly linksService: LinksService,
    private readonly configService: ConfigService,
  ) {
    const telegramBotToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.bot = new Telegraf(telegramBotToken);

    this.bot.command('start', (ctx) => {
      ctx.reply('Привет, Market Lab! Здесь вы можете сохранить свою ссылку. Отправьте мне ссылку и я сохраню ее');
    });

    this.bot.command('save', async (ctx) => {
      const messageParts = ctx.message.text.split(' ');
      const url = messageParts[1];
      const name = messageParts.slice(2).join(' ');
    
      if (!url || !name) {
        ctx.reply('Пожалуйста, укажите валидный URL и название ссылки');
        return;
      }
    
      const createLinkDto = new CreateLinkDto();
      createLinkDto.url = url;
      createLinkDto.name = name; 
    
      try {
        const errors = await validate(createLinkDto);
        if (errors.length > 0) {
          ctx.reply('Некорректный URL или название.');
          return;
        }
    
        const existingLink = await this.linksService.findByUrl(url);
        if (existingLink) {
          ctx.reply('Такая ссылка уже сохранена.');
          return;
        }
    
        const link = await this.linksService.createLink(createLinkDto);
        ctx.reply(`Ссылка сохранена! Ваш код: ${link.id}`);
      } catch (error) {
        ctx.reply('Произошла ошибка при сохранении ссылки.');
      }
    });

    this.bot.command('list', async (ctx) => {
      const page = parseInt(ctx.message.text.split(' ')[1], 10) || 1;  
      const limit = 5; 
      const { links, totalLinks } = await this.linksService.findWithPagination(limit, page); 
    
      if (links.length === 0) {
        ctx.reply('Ссылки не найдены'); 
        return;
      }
    
      const totalPages = Math.ceil(totalLinks / limit);  
      let response = `Страница ${page} из ${totalPages}\n\n`; 
    
      links.forEach((link) => {
        response += `Имя: ${link.name}, ID: ${link.id}, URL: ${link.url}\n`;
      });
    
      ctx.reply(response);
    });

    this.bot.command('delete', async (ctx) => {
      const id = ctx.message.text.split(' ')[1];
      if (!id) {
        ctx.reply('Пожалуйста укажите код ссылки');
        return;
      }

      try {
        await this.linksService.remove(id);
        ctx.reply('Ссылка удалена');
      } catch (error) {
        ctx.reply('Ссылка не найдена');
      }
    });

    this.bot.command('get', async (ctx) => {
      const id = ctx.message.text.split(' ')[1];
      if (!id) {
        ctx.reply('Пожалуйста укажите код ссылки');
        return;
      }

      try {
        const link = await this.linksService.findOneById(id);
        ctx.reply(`Ваша ссылка: ${link.url}`);
      } catch (error) {
        ctx.reply('Ссылка не найдена');
      }
    });

    this.bot.launch();
  }
}