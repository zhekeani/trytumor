import { Logger, NotFoundException } from '@nestjs/common';
import { AbstractDocument } from './abstract.schema';
import { FilterQuery, Model, Types, UpdateQuery } from 'mongoose';

// Class that extends this abstract class need to provide
// generic document type that satisfy AbstractDocument
export abstract class AbstractRepository<TDocument extends AbstractDocument> {
  protected abstract readonly logger: Logger;

  // Requiring Mongoose model as constructor argument
  constructor(protected readonly model: Model<TDocument>) {}

  // Implementing basic mongoose model method through class method

  async create(document: Omit<TDocument, '_id'>): Promise<TDocument> {
    // Create new document
    const createDocument = new this.model({
      ...document,
      _id: new Types.ObjectId(),
    });

    // Type safety precaution using unknown type first
    return (await createDocument.save()).toJSON() as unknown as TDocument;
  }

  async findOne(filterQuery: FilterQuery<TDocument>): Promise<TDocument> {
    const document = await this.model
      .findOne(filterQuery)
      // Get the plain json file not hydrated mongoose document
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
  ): Promise<TDocument> {
    const document = this.model
      .findOneAndUpdate(filterQuery, update, { new: true })
      .lean<TDocument>(true);

    if (!document) {
      this.logger.warn('Document was not found with filterQuery', filterQuery);
      throw new NotFoundException('Document was not found');
    }

    return document;
  }

  async find(filterQuery: FilterQuery<TDocument>) {
    // Immediately return the result because find method return an
    // array, its simply return empty array if there're no documents
    return this.model.find(filterQuery).lean<TDocument[]>(true);
  }

  async findOneAndDelete(
    filterQuery: FilterQuery<TDocument>,
  ): Promise<TDocument> {
    // Immediately return the result, because it will return null
    // if there's no document to delete
    return this.model.findOneAndDelete(filterQuery).lean<TDocument>(true);
  }
}
