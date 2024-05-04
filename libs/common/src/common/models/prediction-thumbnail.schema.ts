import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
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

@Schema({ _id: false })
export class PredictionsThumbnail {
  @Prop()
  patientId: string;

  @Prop()
  userId: string;

  @Prop({ type: PredictionThumbnail })
  thumbnail: PredictionThumbnail;
}
