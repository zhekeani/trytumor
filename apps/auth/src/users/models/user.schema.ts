import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '@app/common';

// Create the UserDocument
// UserDocument used in the typescript
@Schema()
export class UserDocument extends AbstractDocument {
  @Prop()
  email: string;

  @Prop()
  username: string;

  @Prop()
  password: string;

  @Prop()
  department?: string;

  @Prop()
  specialization?: string;

  @Prop()
  phoneNumber?: string;
}

// UserSchema used by Mongoose to create Model
export const UserSchema = SchemaFactory.createForClass(UserDocument);
