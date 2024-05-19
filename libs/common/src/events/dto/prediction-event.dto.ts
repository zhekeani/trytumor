import {
  IsDate,
  IsNumber,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';

export class PredictionThumbnailDto {
  @IsString()
  id: string;

  @IsString()
  fileName: string;

  @IsDate()
  dataAndTime: Date;

  @IsNumber()
  number: number;

  @IsUrl()
  imageUrl: string;
}

export class PredictionNewEventDto {
  @IsString()
  patientId: string;

  @IsString()
  doctorId: string;

  @ValidateNested()
  predictionThumbnail: PredictionThumbnailDto;
}

export class PredictionUpdateEventDto {
  @IsString()
  patientId: string;

  @IsString()
  doctorId: string;

  @IsString()
  predictionThumbnail: Partial<PredictionThumbnailDto>;
}

export class PredictionDeleteEventDto {
  @IsString()
  patientId: string;

  @IsString()
  doctorId: string;

  @IsString()
  predictionId: string;
}
