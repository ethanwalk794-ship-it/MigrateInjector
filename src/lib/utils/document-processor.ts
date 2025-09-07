import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { Resume } from '@/lib/db/models/resume';

export interface ProcessingOptions {
    bulletFormatting: boolean;
    projectHighlighting: boolean;
    techStackExtraction: boolean;
    keywordOptimization: boolean;
    customKeywords: string[];
    outputFormat: 'docx' | 'pdf' | 'html';
}

export interface ProcessingResult {
    success: boolean;
    content?: string;
    projects?: string[];
    techStacks?: string[];
    error?: string;
    processingTime?: number;
}

export class DocumentProcessor {
    private static instance: DocumentProcessor;

    public static getInstance(): DocumentProcessor {
        if (!DocumentProcessor.instance) {
            DocumentProcessor.instance = new DocumentProcessor();
        }
        return DocumentProcessor.instance;
    }

    /**
     * Extract text content from DOCX file
     */
    async extractText(filePath: string): Promise<string> {
        try {
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value;
        } catch (error) {
            console.error('Error extracting text:', error);
            throw new Error('Failed to extract text from document');
        }
    }

    /**
     * Extract HTML content from DOCX file
     */
    async extractHtml(filePath: string): Promise<string> {
        try {
            const result = await mammoth.convertToHtml({ path: filePath });
            return result.value;
        } catch (error) {
            console.error('Error extracting HTML:', error);
            throw new Error('Failed to extract HTML from document');
        }
    }

    /**
     * Process resume with given options
     */
    async processResume(
        resume: Resume,
        options: ProcessingOptions
    ): Promise<ProcessingResult> {
        const startTime = Date.now();

        try {
            // Extract content
            const content = await this.extractText(resume.filePath);

            // Process content based on options
            let processedContent = content;
            const projects: string[] = [];
            const techStacks: string[] = [];

            // Bullet point formatting
            if (options.bulletFormatting) {
                processedContent = this.formatBulletPoints(processedContent);
            }

            // Project highlighting
            if (options.projectHighlighting) {
                const projectResult = this.extractProjects(processedContent);
                processedContent = projectResult.content;
                projects.push(...projectResult.projects);
            }

            // Tech stack extraction
            if (options.techStackExtraction) {
                techStacks.push(...this.extractTechStacks(processedContent));
            }

            // Keyword optimization
            if (options.keywordOptimization) {
                processedContent = this.optimizeKeywords(processedContent, options.customKeywords);
            }

            const processingTime = Date.now() - startTime;

            return {
                success: true,
                content: processedContent,
                projects,
                techStacks,
                processingTime
            };
        } catch (error) {
            console.error('Error processing resume:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Format bullet points for better readability
     */
    private formatBulletPoints(content: string): string {
        // Convert various bullet point formats to consistent format
        return content
            .replace(/^[\s]*[-•*]\s+/gm, '• ')
            .replace(/^[\s]*\d+\.\s+/gm, (match) => match.trim() + ' ')
            .replace(/^[\s]*[a-zA-Z]\.\s+/gm, (match) => match.trim() + ' ');
    }

    /**
     * Extract and highlight projects
     */
    private extractProjects(content: string): { content: string; projects: string[] } {
        const projects: string[] = [];
        let processedContent = content;

        // Common project patterns
        const projectPatterns = [
            /(?:project|portfolio|work|experience)[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi,
            /(?:developed|built|created|designed|implemented)[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi,
            /(?:led|managed|coordinated)[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi
        ];

        projectPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    const project = match.trim();
                    if (project.length > 20 && project.length < 500) {
                        projects.push(project);
                        // Highlight in content
                        processedContent = processedContent.replace(
                            match,
                            `**${match}**`
                        );
                    }
                });
            }
        });

        return { content: processedContent, projects };
    }

    /**
     * Extract technical skills and technologies
     */
    private extractTechStacks(content: string): string[] {
        const techStacks: string[] = [];
        const contentLower = content.toLowerCase();

        // Common technology keywords
        const technologies = [
            // Programming Languages
            'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust',
            'swift', 'kotlin', 'scala', 'r', 'matlab', 'perl', 'haskell', 'clojure',

            // Web Technologies
            'html', 'css', 'react', 'vue', 'angular', 'node.js', 'express', 'django', 'flask',
            'spring', 'laravel', 'rails', 'asp.net', 'jquery', 'bootstrap', 'sass', 'less',

            // Databases
            'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'dynamodb',
            'sqlite', 'oracle', 'sql server', 'mariadb', 'neo4j',

            // Cloud & DevOps
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'gitlab', 'github',
            'terraform', 'ansible', 'chef', 'puppet', 'nginx', 'apache',

            // Mobile
            'react native', 'flutter', 'xamarin', 'ionic', 'cordova', 'android', 'ios',

            // Data Science & ML
            'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'jupyter',
            'tableau', 'power bi', 'apache spark', 'hadoop', 'kafka',

            // Other
            'git', 'svn', 'mercurial', 'jira', 'confluence', 'slack', 'teams',
            'linux', 'windows', 'macos', 'unix'
        ];

        technologies.forEach(tech => {
            if (contentLower.includes(tech)) {
                techStacks.push(tech);
            }
        });

        // Remove duplicates and return
        return [...new Set(techStacks)];
    }

    /**
     * Optimize content for keywords
     */
    private optimizeKeywords(content: string, customKeywords: string[]): string {
        let optimizedContent = content;

        // Add custom keywords if they don't exist
        customKeywords.forEach(keyword => {
            const keywordLower = keyword.toLowerCase();
            const contentLower = optimizedContent.toLowerCase();

            if (!contentLower.includes(keywordLower)) {
                // Try to add keyword naturally in relevant sections
                const sections = optimizedContent.split('\n\n');
                const updatedSections = sections.map(section => {
                    if (section.toLowerCase().includes('skills') ||
                        section.toLowerCase().includes('experience') ||
                        section.toLowerCase().includes('summary')) {
                        return section + `\n• ${keyword}`;
                    }
                    return section;
                });
                optimizedContent = updatedSections.join('\n\n');
            }
        });

        return optimizedContent;
    }

    /**
     * Generate DOCX document from processed content
     */
    async generateDocx(
        content: string,
        title: string,
        options: ProcessingOptions
    ): Promise<Buffer> {
        try {
            const paragraphs = content.split('\n\n').map(section => {
                if (section.trim().length === 0) return null;

                // Check if it's a heading (starts with capital letters and is short)
                if (section.length < 50 && /^[A-Z][A-Z\s]+$/.test(section.trim())) {
                    return new Paragraph({
                        text: section.trim(),
                        heading: HeadingLevel.HEADING_1,
                        spacing: { after: 200 }
                    });
                }

                // Regular paragraph
                return new Paragraph({
                    children: section.split('\n').map(line => {
                        // Check for bullet points
                        if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
                            return new TextRun({
                                text: line.trim(),
                                bullet: { level: 0 }
                            });
                        }

                        // Check for bold text (wrapped in **)
                        if (line.includes('**')) {
                            const parts = line.split('**');
                            return new TextRun({
                                children: parts.map((part, index) =>
                                    index % 2 === 1
                                        ? { text: part, bold: true }
                                        : { text: part }
                                )
                            });
                        }

                        return new TextRun({ text: line });
                    }),
                    spacing: { after: 200 }
                });
            }).filter(Boolean);

            const doc = new Document({
                sections: [{
                    properties: {},
                    children: paragraphs
                }]
            });

            return await Packer.toBuffer(doc);
        } catch (error) {
            console.error('Error generating DOCX:', error);
            throw new Error('Failed to generate DOCX document');
        }
    }

    /**
     * Generate HTML from processed content
     */
    generateHtml(content: string, title: string): string {
        const htmlContent = content
            .split('\n\n')
            .map(section => {
                if (section.trim().length === 0) return '';

                // Check if it's a heading
                if (section.length < 50 && /^[A-Z][A-Z\s]+$/.test(section.trim())) {
                    return `<h2>${section.trim()}</h2>`;
                }

                // Process bullet points
                if (section.includes('•') || section.includes('-') || section.includes('*')) {
                    const lines = section.split('\n').map(line => {
                        if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
                            return `<li>${line.trim().substring(1).trim()}</li>`;
                        }
                        return line;
                    });

                    return `<ul>${lines.join('')}</ul>`;
                }

                // Regular paragraph
                return `<p>${section.replace(/\n/g, '<br>')}</p>`;
            })
            .filter(Boolean)
            .join('');

        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
          h2 { color: #333; border-bottom: 2px solid #2196F3; padding-bottom: 5px; }
          ul { margin: 10px 0; }
          li { margin: 5px 0; }
          p { margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        ${htmlContent}
      </body>
      </html>
    `;
    }
}
