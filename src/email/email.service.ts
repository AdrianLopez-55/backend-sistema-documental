import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'lopezespinozaadrianpablo@gmail.com',
        pass: 'reve pmfr dahq huqh',
      },
    });
  }

  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    const mailOptions = {
      from: 'lopezespinozaadrianpablo@gmail.com',
      to,
      subject,
      text,
    };

    try {
      // Envía el correo electrónico
      await this.transporter.sendMail(mailOptions);
      console.log('Correo electrónico enviado con éxito');
    } catch (error) {
      console.error('Error al enviar el correo electrónico:', error);
    }
  }
}
