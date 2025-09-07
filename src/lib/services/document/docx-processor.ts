import { Document, Paragraph, TextRun } from 'docx';
import { Buffer } from 'buffer';

export interface ProcessingOptions {
    bulletFormatting?: boolean;
    projectHighlighting?: boolean;
    techStackExtraction?: boolean;
    keywordOptimization?: boolean;
    customKeywords?: string[];
}

export interface ProcessingResult {
    success: boolean;
    content?: string;
    projects?: string[];
    techStacks?: string[];
    error?: string;
    processingTime?: number;
}

export class DocxProcessor {
    private static instance: DocxProcessor;

    public static getInstance(): DocxProcessor {
        if (!DocxProcessor.instance) {
            DocxProcessor.instance = new DocxProcessor();
        }
        return DocxProcessor.instance;
    }

    async processDocument(
        buffer: Buffer,
        options: ProcessingOptions = {}
    ): Promise<ProcessingResult> {
        const startTime = Date.now();

        try {
            // For now, simulate document processing
            const content = "Sample document content";

            // Extract projects
            const projects = this.extractProjects(content);

            // Extract tech stacks
            const techStacks = this.extractTechStacks(content);

            // Process based on options
            let processedContent = content;

            if (options.bulletFormatting) {
                processedContent = this.formatBulletPoints(processedContent);
            }

            if (options.keywordOptimization && options.customKeywords) {
                processedContent = this.optimizeKeywords(processedContent, options.customKeywords);
            }

            const processingTime = Date.now() - startTime;

            return {
                success: true,
                content: processedContent,
                projects,
                techStacks,
                processingTime,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                processingTime: Date.now() - startTime,
            };
        }
    }


    private extractProjects(content: string): string[] {
        const projects: string[] = [];
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Look for project patterns
            if (this.isProjectLine(line)) {
                projects.push(line);
            }
        }

        return projects;
    }

    private extractTechStacks(content: string): string[] {
        const techStacks: string[] = [];
        const lines = content.split('\n');

        // Common tech stack keywords
        const techKeywords = [
            'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js',
            'Python', 'Java', 'C#', 'C++', 'Go', 'Rust', 'PHP', 'Ruby',
            'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch',
            'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git',
            'HTML', 'CSS', 'SASS', 'LESS', 'Webpack', 'Babel',
            'Express', 'Django', 'Flask', 'Spring', 'Laravel',
            'GraphQL', 'REST', 'API', 'Microservices', 'CI/CD'
        ];

        for (const line of lines) {
            for (const keyword of techKeywords) {
                if (line.toLowerCase().includes(keyword.toLowerCase())) {
                    if (!techStacks.includes(keyword)) {
                        techStacks.push(keyword);
                    }
                }
            }
        }

        return techStacks;
    }

    private isProjectLine(line: string): boolean {
        // Simple heuristics to identify project lines
        const projectIndicators = [
            'project', 'role', 'position', 'experience', 'work',
            'developer', 'engineer', 'manager', 'lead', 'senior',
            'junior', 'architect', 'consultant', 'specialist'
        ];

        const lowerLine = line.toLowerCase();
        return projectIndicators.some(indicator => lowerLine.includes(indicator)) &&
            line.length > 10 && line.length < 200;
    }

    private formatBulletPoints(content: string): string {
        const lines = content.split('\n');
        const formattedLines = lines.map(line => {
            // Convert various bullet formats to consistent format
            if (line.match(/^[\s]*[-•*]\s/)) {
                return line.replace(/^[\s]*[-•*]\s/, '• ');
            }
            return line;
        });

        return formattedLines.join('\n');
    }

    private optimizeKeywords(content: string, keywords: string[]): string {
        let optimizedContent = content;

        for (const keyword of keywords) {
            // Add keyword emphasis or formatting
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            optimizedContent = optimizedContent.replace(regex, `**${keyword}**`);
        }

        return optimizedContent;
    }

    async createDocument(content: string, title: string): Promise<Buffer> {
        try {
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        {
                            type: 'paragraph',
                            children: [
                                {
                                    type: 'textRun',
                                    text: title,
                                    bold: true,
                                    size: 24,
                                } as TextRun,
                            ],
                        } as Paragraph,
                        {
                            type: 'paragraph',
                            children: [
                                {
                                    type: 'textRun',
                                    text: content,
                                } as TextRun,
                            ],
                        } as Paragraph,
                    ],
                }],
            });

            return Buffer.from(await doc.getBuffer());
        } catch (error) {
            throw new Error(`Failed to create document: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
