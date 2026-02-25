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
  appCode?: string;

  constructor(args: {
    kind: DinnoHttpErrorKind;
    title: string;
    message: string;
    retryable: boolean;
    status?: number;
    appCode?: string;
    cause?: unknown;
  }) {
    super(args.message);
    this.name = 'DinnoHttpError';
    this.kind = args.kind;
    this.title = args.title;
    this.retryable = args.retryable;
    this.status = args.status;
    this.appCode = args.appCode;

    (this as any).cause = args.cause;
  }
}