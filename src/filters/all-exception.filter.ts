import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ZodError } from 'zod';

// todo: refactor with SOLID Principles
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private logger = new Logger('ExceptionHandler');
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: any, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let code: HttpStatus =
      exception?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] | Record<string, string> =
      exception?.message || 'Something went wrong';

    /**
     * If exception is a HttpException
     */
    if (exception instanceof HttpException) {
      code = exception.getStatus();
      message = exception.message;
    }
    /**
     * If exception is a Zod Error
     */
    if (exception instanceof ZodError) {
      code = HttpStatus.BAD_REQUEST;
      message = exception.errors.reduce<Record<string, string>>((acc, curr) => {
        acc[curr.path.join('.')] = curr.message;
        return acc;
      }, {});
    }

    /**
     * Build the Exception payload
     */
    const exceptionPayload = {
      message,
    };

    console.log(exception);
    this.logger.error(exception?.message);
    httpAdapter.reply(ctx.getResponse(), exceptionPayload, code);
  }
}
