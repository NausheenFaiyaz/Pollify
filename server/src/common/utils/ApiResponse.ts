import { type Response } from "express";

class ApiResponse {
    static send(
        res: Response,
        statusCode: number,
        message: string,
        data: unknown = null,
        meta: unknown = undefined
    ) {
        const payload: {
            success: boolean;
            message: string;
            data?: unknown;
            meta?: unknown;
        } = {
            success: statusCode < 400,
            message,
        };

        if (data !== null) {
            payload.data = data;
        }

        if (meta !== undefined) {
            payload.meta = meta;
        }

        return res.status(statusCode).json(payload);
    }

    static ok(res: Response, message = "Success", data: unknown = null, meta: unknown = undefined) {
        return ApiResponse.send(res, 200, message, data, meta);
    }

    static created(res: Response, message = "Created successfully", data: unknown = null) {
        return ApiResponse.send(res, 201, message, data);
    }

    static noContent(res: Response) {
        return res.status(204).send();
    }
}

export default ApiResponse;
