import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Link } from './models/link.model';
import { CreateLinkDto } from './DTO/linkSaver.dto';
import { validate } from 'class-validator';

@Injectable()
export class LinksService {
  constructor(
    @InjectRepository(Link)
    private readonly linkRepository: Repository<Link>,
  ) {}

  async createLink(createLinkDto: CreateLinkDto): Promise<Link> {
    const link = new Link();
    link.url = createLinkDto.url;
    link.name = createLinkDto.name;
    
    const errors = await validate(link);
    if (errors.length > 0) {
      throw new Error('Некорректный URL');
    }

    return this.linkRepository.save(link);
  }

  async findWithPagination(limit: number, page: number): Promise<{ links: Link[], totalLinks: number }> {
    const [links, totalLinks] = await this.linkRepository.findAndCount({
      skip: (page - 1) * limit,  
      take: limit,
    });
  
    return { links, totalLinks };
  }

  async findByUrl(url: string): Promise<Link | undefined> {
    return this.linkRepository.findOne({ where: { url } });
  }

  async findOneById(id: string): Promise<Link> {
    const link = await this.linkRepository.findOne({ where: { id } });
    if (!link) {
      throw new NotFoundException('Ссылка не найдена');
    }
    return link;
  }

  async remove(id: string): Promise<void> {
    const link = await this.findOneById(id);
    await this.linkRepository.remove(link);
  }

}