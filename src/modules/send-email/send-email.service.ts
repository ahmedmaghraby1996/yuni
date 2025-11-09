import { Injectable } from "@nestjs/common";
import * as nodemailer from 'nodemailer'
import { SendMessageRequest } from "./dto/request/send-message.request";
@Injectable()
export class SendEmailService {
    private transporter: nodemailer.Transporter;
    private email: string;
    private password: string;

    constructor() {
        this.email = "nadneewatch2@gmail.com";
        this.password = "ctkm tuqz rwpv adjb";

        this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: this.email,
                pass: this.password,
            }
        })
    }

    async sendResetPasswordEmail(email: string, resetPasswordUrl: string) {
        return await this.sendMessage({
            to: email,
            header: 'Nadnee - Password Reset URL',
            body: `
            <h2>Password Reset</h2>
            <p>Dear User,</p>
            <p>You have requested to reset your password. Click the link below to proceed:</p>
            <a href="${resetPasswordUrl}">Reset Password</a>
            <p>Please note that this password reset link is confidential. Do not share this link with anyone.</p>
            <p>If you did not request this change, please ignore this email.</p>
            <p>This password reset link will expire after 1 hour.</p>
            <p>Best Regards,<br>Nadnee.</p>
        `});
    }

    async sendCustomMessage(request: SendMessageRequest) {
        if (request.type.includes('email')) {
            await this.sendMessage({
                to: request.send_to,
                header: request.message_header,
                body: request.message_body
            });
        }

        return true;
    }

    private async sendMessage(param: { to: string, header: string, body: string }) {
        const message = {
            from: this.email,
            to: param.to,
            subject: param.header,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #f9f9f9;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        // <img src="https://admin.nadnee.click/_next/static/media/logo-login.bf648397.png" alt="Company Logo" style="max-width: 150px;">
                    </div>
                    <div style="background-color: #fff; padding: 20px; border-radius: 8px;">
                        ${param.body}
                    </div>
                </div>
            `
        };

        return await this.transporter.sendMail(message);
    }

}