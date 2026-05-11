class ApiError extends Error {
    statusCode: number;
    errors: unknown[];
    isOperational: boolean;

    constructor(statusCode: number, message: string, errors: unknown[] = []) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message = "Bad request", errors: unknown[] = []) {
        return new ApiError(400, message, errors);
    }

    static unauthorized(message = "Unauthorized", errors: unknown[] = []) {
        return new ApiError(401, message, errors);
    }

    static forbidden(message = "Forbidden", errors: unknown[] = []) {
        return new ApiError(403, message, errors);
    }

    static notFound(message = "Not found", errors: unknown[] = []) {
        return new ApiError(404, message, errors);
    }

    static conflict(message = "Conflict", errors: unknown[] = []) {
        return new ApiError(409, message, errors);
    }

    static internal(message = "Internal server error", errors: unknown[] = []) {
        return new ApiError(500, message, errors);
    }
}

export default ApiError;
