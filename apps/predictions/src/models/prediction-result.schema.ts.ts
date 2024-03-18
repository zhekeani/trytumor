import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class Percentage {
  @Prop()
  glioma: number;

  @Prop()
  meningioma: number;

  @Prop()
  noTumor: number;

  @Prop()
  pituitary: number;
}

@Schema()
export class PredictionResult {
  @Prop()
  imageUrl: string;

  @Prop()
  imageIndex: number;

  @Prop({ type: Percentage })
  percentages: Percentage;
}
