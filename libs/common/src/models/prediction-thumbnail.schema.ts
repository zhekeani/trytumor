import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class PredictionThumbnail {
  @Prop()
  id: string;

  @Prop()
  fileName: string;

  @Prop()
  dataAndTime: Date;

  @Prop()
  number: number;

  @Prop()
  imageUrl: string;
}

export class PredictionsThumbnail {
  @Prop()
  patientId: string;

  @Prop({ type: [PredictionThumbnail] })
  predictions: PredictionThumbnail[];
}
