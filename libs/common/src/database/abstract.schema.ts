import { Prop, Schema } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';

@Schema()
export class AbstractDocument {
  // Class that extend AbstractDocument need to have
  // _id property of type Mongoose ObjectId
  @Prop({ type: SchemaTypes.ObjectId })
  _id: Types.ObjectId;
}
