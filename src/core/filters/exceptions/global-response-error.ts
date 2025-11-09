import { Request } from 'express';
import { I18nService } from 'nestjs-i18n';

export const GlobalResponseError: (statusCode: number, message: string, code: string, request: Request, i18n: I18nService) => IResponseError = (
    statusCode: number,
    message: string,
    code: string,
    request: Request,
    i18n: I18nService
): IResponseError => {
    try {
        let lang = request.headers['accept-language'];
        if (lang === null) lang = request.query.lang as string;
        if (lang === null) lang = request.query.local as string;
        if (lang === null || !lang) lang = 'en';
        if (typeof message === 'string') {
            message = i18n.translate(message, { lang })
        }
    } catch { }
    return {
        statusCode: statusCode,
        message: message,
        code,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method
    };
};


export interface IResponseError {
    statusCode: number;
    message: string;
    code: string;
    timestamp: string;
    path: string;
    method: string;
}