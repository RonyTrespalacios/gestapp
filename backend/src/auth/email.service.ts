import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    // Configuración del transporter de email
    const emailUser = this.configService.get('EMAIL_USER');
    const emailPass = this.configService.get('EMAIL_PASS');
    const emailHost = this.configService.get('EMAIL_HOST', 'smtp.gmail.com');
    const emailPort = this.configService.get('EMAIL_PORT', 587);

    if (emailUser && emailPass) {
      this.transporter = nodemailer.createTransport({
        host: emailHost,
        port: emailPort,
        secure: emailPort === 465,
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });
    } else {
      this.logger.warn('Email credentials not configured. Emails will be logged only.');
    }
  }

  async sendVerificationEmail(email: string, token: string) {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:4200');
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    const mailOptions = {
      from: this.configService.get('EMAIL_USER', 'noreply@gestapp.com'),
      to: email,
      subject: 'Verifica tu cuenta - GestApp',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #000;">Bienvenido a GestApp</h2>
          <p>Gracias por registrarte. Por favor verifica tu cuenta haciendo clic en el siguiente enlace:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; margin: 20px 0;">
            Verificar Email
          </a>
          <p>O copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p style="color: #999; font-size: 12px; margin-top: 40px;">Este enlace expira en 24 horas.</p>
        </div>
      `,
    };

    if (this.transporter) {
      try {
        await this.transporter.sendMail(mailOptions);
        this.logger.log(`Verification email sent to ${email}`);
      } catch (error) {
        this.logger.error(`Failed to send email to ${email}:`, error);
        throw error;
      }
    } else {
      this.logger.log(`[DEV MODE] Verification email for ${email}:`);
      this.logger.log(`Verification URL: ${verificationUrl}`);
    }
  }
}

