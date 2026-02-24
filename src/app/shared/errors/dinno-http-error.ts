export type DinnoHttpErrorKind =
  | 'timeout'
  | 'network'
  | 'server'
  | 'auth'
  | 'http'
  | 'unknown';

export class DinnoHttpError extends Error {
  kind: DinnoHttpErrorKind;
  title: string;
  retryable: boolean;
  status?: number;

  constructor(args: {
    kind: DinnoHttpErrorKind;
    title: string;
    message: string;
    retryable: boolean;
    status?: number;
    cause?: unknown;
  }) {
    super(args.message);
    this.name = 'DinnoHttpError';
    this.kind = args.kind;
    this.title = args.title;
    this.retryable = args.retryable;
    this.status = args.status;

    (this as any).cause = args.cause;
  }
}