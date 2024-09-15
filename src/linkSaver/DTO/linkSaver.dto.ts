import { IsUrl, IsNotEmpty } from 'class-validator';

export class CreateLinkDto {
  @IsUrl()
  url: string;

  @IsNotEmpty()
  name: string;
}