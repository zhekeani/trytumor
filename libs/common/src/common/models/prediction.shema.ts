import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '../../database';

@Schema({ _id: false })
export class PatientData {
  @Prop()
  id: string;

  @Prop()
  fullName: string;

  @Prop({ type: String, enum: ['female', 'male'] })
  gender: string;

  @Prop()
  birthDate: Date;
}

@Schema({ _id: false })
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

@Schema({ _id: false })
export class PredictionResult {
  @Prop()
  imageUrl: string;

  @Prop()
  imageIndex: number;

  @Prop({ type: Percentage })
  percentages: Percentage;
}

@Schema({ _id: false })
export class PredictionData {
  @Prop()
  id: string;

  @Prop()
  number: number;

  @Prop()
  doctorId: string;

  @Prop()
  doctorFullName: string;

  @Prop()
  dateAndTime: Date;

  @Prop({ type: [PredictionResult] })
  results: PredictionResult[];

  @Prop({ type: Percentage })
  resultsMean: Percentage;

  @Prop()
  fileName: string;

  @Prop()
  additionalNotes: string[];
}

@Schema()
export class PredictionDocument extends AbstractDocument {
  @Prop({ type: PatientData })
  patientData: PatientData;

  @Prop({ type: [PredictionData] })
  predictionsData?: PredictionData[];
}

export const PredictionSchema =
  SchemaFactory.createForClass(PredictionDocument);
