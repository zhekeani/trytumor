import { DeleteOptions } from '@google-cloud/storage/build/cjs/src/nodejs-common/service-object';
import { Logger, NotFoundException } from '@nestjs/common';
import {
  AggregateOptions,
  FilterQuery,
  Model,
  MongooseBaseQueryOptionKeys,
  PipelineStage,
  QueryOptions,
  Types,
  UpdateQuery,
} from 'mongoose';
import { AbstractDocument } from './abstract.schema';

export abstract class AbstractRepository<TDocument extends AbstractDocument> {
  protected abstract readonly logger: Logger;

  constructor(protected readonly model: Model<TDocument>) {}

  async create(
    document: Omit<TDocument, '_id'>,
    manualId?: Types.ObjectId,
  ): Promise<TDocument> {
    const createDocument = new this.model({
      ...document,
      _id: manualId ?? new Types.ObjectId(),
    });

    // Type safety precaution using unknown type first
    return (await createDocument.save()).toJSON() as unknown as TDocument;
  }

  async findOne(
    filterQuery: FilterQuery<TDocument>,
    selectOptions:
      | string
      | string[]
      | Record<string, string | number | boolean | object> = {},
  ): Promise<TDocument> {
    const document = await this.model
      .findOne(filterQuery)
      .select(selectOptions)
      .lean<TDocument>(true);

    if (!document) {
      this.logger.warn('Document was not found with filterQuery', filterQuery);
      throw new NotFoundException('Document was not found');
    }

    return document;
  }

  async findOneAndUpdate(
    filterQuery: FilterQuery<TDocument>,
    update: UpdateQuery<TDocument>,
    additionalOptions?: QueryOptions,
  ): Promise<TDocument> {
    const options: QueryOptions = {
      new: true,
      ...additionalOptions,
    };

    const document = await this.model
      .findOneAndUpdate(filterQuery, update, options)
      .lean<TDocument>(true);

    if (!document) {
      this.logger.warn('Document was not found with filterQuery', filterQuery);
      throw new NotFoundException('Document was not found');
    }

    return document;
  }

  async updateMany(
    filterQuery: FilterQuery<TDocument>,
    update: UpdateQuery<TDocument>,
  ) {
    return this.model.updateMany(filterQuery, update);
  }

  async find(filterQuery: FilterQuery<TDocument>) {
    return this.model.find(filterQuery).lean<TDocument[]>(true);
  }

  async findOneAndDelete(
    filterQuery: FilterQuery<TDocument>,
  ): Promise<TDocument> {
    // Immediately return the result, because it will return null
    // if there's no document to delete
    return this.model.findOneAndDelete(filterQuery).lean<TDocument>(true);
  }

  async deleteMany(
    filterQuery: FilterQuery<TDocument>,
    options?: DeleteOptions &
      Pick<QueryOptions<TDocument>, MongooseBaseQueryOptionKeys> & {
        [other: string]: any;
      },
  ): Promise<any> {
    return this.model.deleteMany(filterQuery, options);
  }

  async aggregate(pipeline?: PipelineStage[], options?: AggregateOptions) {
    return this.model.aggregate(pipeline, options);
  }
}
