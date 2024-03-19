import { AbstractDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Percentage, PredictionResult } from './prediction-result.schema.ts';

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
export class PredictionData {
  @Prop()
  id: string;

  @Prop()
  number: number;

  @Prop()
  userId: string;

  @Prop()
  doctorName: string;

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
