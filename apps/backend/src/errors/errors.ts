export type ValidationIssue = { path: (string | number)[]; message: string };

export const BadRequest = { code: 400, msg: 'Bad Request' } as const;
export const Unauthorized = { code: 401, msg: 'Unauthorized' } as const;
export const NotFound = { code: 404, msg: 'Not Found' } as const;
export const Conflict = { code: 409, msg: 'Conflict' } as const;
export const ServiceUnavailable = { code: 503, msg: 'Service Unavailable' } as const;
export const ValidationError = { code: 400, msg: 'Invalid parameters' } as const;
export const InternalError = { code: 500, msg: 'Internal Server Error' } as const;
