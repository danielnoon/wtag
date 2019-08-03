import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class ApplyTagsDto {
  @IsArray()
  @IsNotEmpty()
  tags: string[];

  @IsString()
  @IsNotEmpty()
  image: string;
}
