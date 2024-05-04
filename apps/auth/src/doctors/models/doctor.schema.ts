import { AbstractDocument, PredictionsThumbnail } from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class DoctorDocument extends AbstractDocument {
  @Prop()
  email: string;

  @Prop()
  doctorName: string;

  @Prop()
  fullName: string;

  @Prop()
  password: string;

  @Prop()
  profilePicUrl?: string;

  @Prop()
  department?: string;

  @Prop()
  specialization?: string;

  @Prop()
  phoneNumber?: string;

  @Prop()
  refreshToken?: string;

  @Prop({ type: [PredictionsThumbnail] })
  predictions?: PredictionsThumbnail[];
}

export const DoctorSchema = SchemaFactory.createForClass(DoctorDocument);
