import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class UsernameEmailStringify implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const { username, email } = req.body;

    if (username || email) {
      req.body.usernameAndEmail = JSON.stringify({
        username,
        email,
      });
    }

    next();
  }
}
