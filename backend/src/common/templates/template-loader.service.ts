/**
 * Template Loader Service
 * 
 * Loads templates from the templates/ directory structure:
 * - templates/email/{workflow-name}.html - HTML email templates
 * - templates/sms/{workflow-name}.json - SMS templates (multi-language)
 */

import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface SmsTemplate {
  workflow: string;
  category: string;
  priority: 'low' | 'normal' | 'high';
  languages: Record<string, string>; // { en: "...", hi: "...", kn: "..." }
  variables: string[];
}

@Injectable()
export class TemplateLoaderService {
  private readonly logger = new Logger(TemplateLoaderService.name);
  private readonly templatesBasePath: string;

  constructor() {
    // Templates are in: backend/src/templates/
    this.templatesBasePath = path.join(__dirname, '../../templates');
  }

  /**
   * Load email template (HTML file)
   * @param workflowName - Workflow name (e.g., 'account-verification', 'password-reset')
   * @param data - Template variables to replace
   * @returns Compiled HTML string
   */
  loadEmailTemplate(workflowName: string, data: Record<string, any>): string {
    try {
      const templatePath = path.join(
        this.templatesBasePath,
        'email',
        `${workflowName}.html`
      );

      this.logger.debug(`Loading email template: ${templatePath}`);
      
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Email template not found: ${templatePath}`);
      }

      let template = fs.readFileSync(templatePath, 'utf-8');

      // Replace template variables ({{variableName}})
      Object.keys(data).forEach((key) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        const value = data[key] !== undefined && data[key] !== null ? String(data[key]) : '';
        template = template.replace(regex, value);
      });

      return template;
    } catch (error) {
      this.logger.error(`Failed to load email template ${workflowName}:`, error);
      throw new Error(`Email template ${workflowName} not found at templates/email/${workflowName}.html`);
    }
  }

  /**
   * Load SMS template (JSON file)
   * @param workflowName - Workflow name (e.g., 'otp-sent', 'recharge-success')
   * @param language - Language code (en, hi, kn)
   * @param data - Template variables to replace
   * @returns Compiled SMS message string
   */
  loadSmsTemplate(
    workflowName: string,
    language: string = 'en',
    data: Record<string, any> = {}
  ): string {
    try {
      const templatePath = path.join(
        this.templatesBasePath,
        'sms',
        `${workflowName}.json`
      );

      this.logger.debug(`Loading SMS template: ${templatePath} (language: ${language})`);
      
      if (!fs.existsSync(templatePath)) {
        throw new Error(`SMS template not found: ${templatePath}`);
      }

      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const template: SmsTemplate = JSON.parse(templateContent);

      // Get message for requested language, fallback to English
      let message = template.languages[language] || template.languages['en'];

      if (!message) {
        throw new Error(`Language ${language} not found in SMS template ${workflowName}`);
      }

      // Replace template variables ({{variableName}})
      Object.keys(data).forEach((key) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        const value = data[key] !== undefined && data[key] !== null ? String(data[key]) : '';
        message = message.replace(regex, value);
      });

      return message;
    } catch (error) {
      this.logger.error(`Failed to load SMS template ${workflowName}:`, error);
      throw new Error(`SMS template ${workflowName} not found at templates/sms/${workflowName}.json`);
    }
  }

  /**
   * Get SMS template metadata (without loading the message)
   * @param workflowName - Workflow name
   * @returns Template metadata
   */
  getSmsTemplateMetadata(workflowName: string): SmsTemplate {
    try {
      const templatePath = path.join(
        this.templatesBasePath,
        'sms',
        `${workflowName}.json`
      );

      if (!fs.existsSync(templatePath)) {
        throw new Error(`SMS template not found: ${templatePath}`);
      }

      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      return JSON.parse(templateContent);
    } catch (error) {
      this.logger.error(`Failed to load SMS template metadata ${workflowName}:`, error);
      throw new Error(`SMS template ${workflowName} not found`);
    }
  }

  /**
   * List all available email templates
   * @returns Array of workflow names
   */
  listEmailTemplates(): string[] {
    try {
      const emailTemplatesPath = path.join(this.templatesBasePath, 'email');
      
      if (!fs.existsSync(emailTemplatesPath)) {
        return [];
      }

      const files = fs.readdirSync(emailTemplatesPath);
      return files
        .filter(file => file.endsWith('.html'))
        .map(file => file.replace('.html', ''));
    } catch (error) {
      this.logger.error('Failed to list email templates:', error);
      return [];
    }
  }

  /**
   * List all available SMS templates
   * @returns Array of workflow names
   */
  listSmsTemplates(): string[] {
    try {
      const smsTemplatesPath = path.join(this.templatesBasePath, 'sms');
      
      if (!fs.existsSync(smsTemplatesPath)) {
        return [];
      }

      const files = fs.readdirSync(smsTemplatesPath);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      this.logger.error('Failed to list SMS templates:', error);
      return [];
    }
  }

  /**
   * Check if email template exists
   */
  emailTemplateExists(workflowName: string): boolean {
    const templatePath = path.join(
      this.templatesBasePath,
      'email',
      `${workflowName}.html`
    );
    return fs.existsSync(templatePath);
  }

  /**
   * Check if SMS template exists
   */
  smsTemplateExists(workflowName: string): boolean {
    const templatePath = path.join(
      this.templatesBasePath,
      'sms',
      `${workflowName}.json`
    );
    return fs.existsSync(templatePath);
  }
}

