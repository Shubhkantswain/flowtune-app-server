"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const nodeMailer_1 = require("../config/nodeMailer");
const emailTemplates_1 = require("../templates/emailTemplates");
dotenv_1.default.config();
class NodeMailerService {
    static sendEmail(to, subject, html) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const info = yield nodeMailer_1.transporter.sendMail({
                    from: process.env.NODEMAILER_SENDEREMAIL, // sender address
                    to, // list of receivers
                    subject, // Subject line
                    html, // HTML body content
                });
            }
            catch (error) {
                console.error("Error sending email:", error);
                throw new Error("Failed to send email");
            }
        });
    }
    static sendVerificationEmail(email, verificationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const subject = "Verify Your Email";
            const html = emailTemplates_1.VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken);
            yield this.sendEmail(email, subject, html);
        });
    }
    static sendWelcomeEmail(email, username) {
        return __awaiter(this, void 0, void 0, function* () {
            const subject = "Welcome!";
            const html = emailTemplates_1.WELCOME_EMAIL_TEMPLATE.replace("{username}", username);
            yield this.sendEmail(email, subject, html);
        });
    }
    static sendPasswordResetEmail(email, resetURL) {
        return __awaiter(this, void 0, void 0, function* () {
            const subject = "Password Reset Request";
            const html = emailTemplates_1.PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL);
            yield this.sendEmail(email, subject, html);
        });
    }
    static sendResetSuccessEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const subject = "Password Reset Successful";
            const html = emailTemplates_1.PASSWORD_RESET_SUCCESS_TEMPLATE;
            yield this.sendEmail(email, subject, html);
        });
    }
}
exports.default = NodeMailerService;
