import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class DoctorNameAndEmailStringify implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const { doctorName, email } = req.body;

    if (doctorName || email) {
      req.body.doctorNameAndEmail = JSON.stringify({
        doctorName,
        email,
      });
    }
    next();
  }
}
