'use client';

import mammoth from 'mammoth';
import { Buffer } from 'buffer';

export interface ExtractResult {
    success: boolean;
    data?: {
        rawText: string;
        projects: string[];
        techStacks: string[];
        sections: {
            summary?: string;
            experience?: string;
            education?: string;
            skills?: string;
            achievements?: string;
        };
    };
    error?: string;
}

export class DocumentProcessor {
    async extractContent(buffer: Buffer): Promise<ExtractResult> {
        try {
            const { value: rawText = '' } = await mammoth.extractRawText({ buffer });
            const projects = this.extractProjects(rawText);
            const techStacks = this.extractTechStacks(rawText);
            const sections = this.extractSections(rawText);

            return {
                success: true,
                data: { rawText, projects, techStacks, sections },
            };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Failed to parse document' };
        }
    }

    private extractProjects(content: string): string[] {
        const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
        const indicators = ['project', 'experience', 'role'];
        return lines.filter(l => indicators.some(k => l.toLowerCase().includes(k)) && l.length > 10).slice(0, 50);
    }

    private extractTechStacks(content: string): string[] {
        const techKeywords = [
            'javascript', 'typescript', 'react', 'next', 'node', 'python', 'java', 'c#', 'c++', 'go', 'php', 'ruby',
            'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'aws', 'azure', 'gcp', 'docker', 'kubernetes',
            'html', 'css', 'sass', 'less', 'webpack', 'babel', 'express', 'django', 'flask', 'spring', 'laravel', 'graphql'
        ];
        const found = new Set<string>();
        const lower = content.toLowerCase();
        techKeywords.forEach(k => { if (lower.includes(k)) found.add(k.charAt(0).toUpperCase() + k.slice(1)); });
        return Array.from(found).slice(0, 100);
    }

    private extractSections(content: string) {
        const lower = content.toLowerCase();
        return {
            summary: lower.includes('summary') ? 'Detected summary section' : '',
            experience: lower.includes('experience') ? 'Detected experience section' : '',
            education: lower.includes('education') ? 'Detected education section' : '',
            skills: lower.includes('skills') ? 'Detected skills section' : '',
            achievements: lower.includes('achievements') ? 'Detected achievements section' : '',
        };
    }
}

export default DocumentProcessor;
