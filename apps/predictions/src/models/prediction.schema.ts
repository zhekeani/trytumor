import { AbstractDocument } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Percentage,
  PredictionResult,
} from '../interfaces/prediction-result.interface.ts';

@Schema()
export class PredictionDocument extends AbstractDocument {
  @Prop()
  patientId: string;

  @Prop()
  patientName: string;

  @Prop()
  patientBirthDate: Date;

  @Prop()
  patientGender: string;

  @Prop()
  doctorId: string;

  @Prop()
  doctorName: string;

  @Prop()
  dateAndTime: Date;

  @Prop()
  number: number;

  @Prop()
  results: PredictionResult[];

  @Prop()
  resultsMean: Percentage[];

  @Prop()
  fileName: string;

  @Prop()
  additionalNotes: string[];
}

export const PredictionSchema =
  SchemaFactory.createForClass(PredictionDocument);
