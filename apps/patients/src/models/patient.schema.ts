import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument, PredictionsThumbnail } from '@app/common';

@Schema()
export class PatientDocument extends AbstractDocument {
  @Prop()
  profilePictureURL?: string;

  @Prop()
  fullName: string;

  @Prop()
  birthDate: Date;

  @Prop()
  gender: string;

  @Prop()
  weight: number;

  @Prop()
  height: number;

  @Prop()
  email: string;

  @Prop()
  address: string;

  @Prop()
  previousMedicalConditions: string[];

  @Prop()
  familyMedicalHistory: string[];

  @Prop()
  allergies: string[];

  @Prop({ type: [PredictionsThumbnail] })
  predictions?: PredictionsThumbnail[];
}

export const PatientSchema = SchemaFactory.createForClass(PatientDocument);
