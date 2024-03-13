import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '@app/common';

@Schema()
export class PatientDocument extends AbstractDocument {
  @Prop()
  profilePictureURL: string;

  @Prop()
  fullName: string;

  @Prop()
  birthDate: Date;

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
}

export const PatientSchema = SchemaFactory.createForClass(PatientDocument);
