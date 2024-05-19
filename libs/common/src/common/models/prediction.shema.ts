import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '../../database';

@Schema({ _id: false })
export class PatientDataSchema {
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
export class PercentageSchema {
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
export class PredictionResultSchema {
  @Prop()
  imageUrl: string;

  @Prop()
  imageIndex: number;

  @Prop({ type: PercentageSchema })
  percentages: PercentageSchema;
}

@Schema({ _id: false })
export class PredictionDataSchema {
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

  @Prop({ type: [PredictionResultSchema] })
  results: PredictionResultSchema[];

  @Prop({ type: PercentageSchema })
  resultsMean: PercentageSchema;

  @Prop()
  fileName: string;

  @Prop()
  additionalNotes: string[];
}

@Schema()
export class PredictionDocument extends AbstractDocument {
  @Prop({ type: PatientDataSchema })
  patientData: PatientDataSchema;

  @Prop({ type: [PredictionDataSchema] })
  predictionsData?: PredictionDataSchema[];
}

export const PredictionSchema =
  SchemaFactory.createForClass(PredictionDocument);
