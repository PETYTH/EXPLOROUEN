// Service email désactivé - utilise Mailtrap via config
export class EmailService {
  async sendEmail() {}
  async sendWelcomeEmail(to: string, name: string) {}
}

export default EmailService;
