import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import * as mammoth from 'mammoth';

export const runtime = 'nodejs';

interface TechStackItem {
  technology: string;
  bullets: string[];
}

interface PreviewRequest {
  resumeIds: string[];
  techStack: TechStackItem[];
  processingMode: 'single' | 'bulk';
  extractionSettings?: {
    dynamicExtraction: boolean;
    minPointsPerTech: number;
    maxPointsPerTech: number;
    totalTargetPoints: number;
  };
}

interface ProjectSection {
  title: string;
  content: string;
  responsibilitiesIndex: number;
  relevanceScore: number;
  startIndex: number;
  endIndex: number;
}

interface InsertionPoint {
  technology: string;
  project: string;
  bullets: string[];
  relevanceScore: number;
  insertionLine: number;
  contextBefore: string;
  contextAfter: string;
}

interface PreviewResult {
  filename: string;
  originalContent: string;
  insertionPoints: InsertionPoint[];
  topProjects: ProjectSection[];
  techStackDistribution: {
    [technology: string]: {
      project: string;
      relevanceScore: number;
      bulletCount: number;
    }[];
  };
  statistics: {
    totalProjects: number;
    projectsToModify: number;
    totalBulletsToAdd: number;
    averageRelevanceScore: number;
  };
}

// Enhanced project extraction with better context detection
function extractProjects(docText: string): ProjectSection[] {
  const projects: ProjectSection[] = [];
  const lines = docText.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] ?? '').trim();
    const lowerLine = line.toLowerCase();

    // Enhanced project detection patterns
    const projectIndicators = [
      /^(project|experience|work|employment|position|role).*:/i,
      /^.*\s+(project|experience|work|employment|position|role)\s*$/i,
      /^(software|web|mobile|data|ai|ml|backend|frontend|fullstack).*\s+(developer|engineer|analyst|architect)/i,
      /^.*\s+(inc\.|corp\.|ltd\.|llc|company|organization).*$/i,
      /^\d{4}\s*-\s*\d{4}|\d{4}\s*-\s*present/i, // Date ranges
    ];

    // Check if current line indicates a project/experience section
    const isProjectStart = projectIndicators.some(pattern => pattern.test(line)) ||
      (line.length > 10 && line.length < 100 && !line.includes('.') && 
       (lowerLine.includes('developer') || lowerLine.includes('engineer') || 
        lowerLine.includes('analyst') || lowerLine.includes('manager') ||
        lowerLine.includes('lead') || lowerLine.includes('senior')));

    if (isProjectStart && line.length > 0) {
      let projectContent = '';
      let responsibilitiesIndex = -1;
      let j = i;
      const startIndex = i;

      // Collect project content until next major section
      while (j < lines.length && !isNewSection(lines[j] ?? '', j > i)) {
        const currentLine = lines[j] ?? '';
        projectContent += currentLine + '\n';

        // Find responsibilities section with more flexible patterns
        const responsibilityPatterns = [
          /responsibilities\s*:/i,
          /key\s+responsibilities\s*:/i,
          /duties\s*:/i,
          /achievements\s*:/i,
          /accomplishments\s*:/i,
          /key\s+achievements\s*:/i,
          /what\s+i\s+did\s*:/i,
          /role\s*:/i,
          /tasks\s*:/i,
        ];

        if (responsibilityPatterns.some(pattern => pattern.test(currentLine))) {
          responsibilitiesIndex = projectContent.length - currentLine.length;
        }

        j++;
      }

      // Accept projects even without explicit "Responsibilities:" section
      // We'll add it if needed during processing
      if (projectContent.trim().length > 50) { // Minimum content requirement
        projects.push({
          title: line,
          content: projectContent,
          responsibilitiesIndex: responsibilitiesIndex,
          relevanceScore: 0,
          startIndex,
          endIndex: j - 1,
        });
      }
    }
  }

  return projects;
}

// Enhanced section detection with more patterns
function isNewSection(line: string, notFirstLine: boolean): boolean {
  if (!notFirstLine || !line.trim()) return false;

  const lowerLine = line.toLowerCase().trim();
  const majorSections = [
    'education', 'skills', 'experience', 'projects', 'work experience',
    'professional experience', 'certifications', 'awards', 'publications',
    'languages', 'interests', 'hobbies', 'references', 'volunteer',
    'additional information', 'summary', 'objective', 'profile',
    'technical skills', 'core competencies', 'achievements'
  ];

  // Check if line is likely a major section header
  const isMajorSection = majorSections.some(section => 
    lowerLine === section || 
    lowerLine === section + ':' ||
    lowerLine.startsWith(section + ' ') ||
    lowerLine.endsWith(' ' + section)
  );

  // Check formatting patterns typical of section headers
  const isFormattedHeader = (
    line === line.toUpperCase() && line.length > 3 && line.length < 50
  ) || (
    line.includes(':') && (line.split(':')[0] ?? '').length < 30 && 
    !line.includes(',') && !line.includes('.')
  );

  return isMajorSection || isFormattedHeader;
}

// Advanced relevance scoring algorithm
function calculateAdvancedRelevance(techStack: TechStackItem, projectContent: string): number {
  let score = 0;
  const projectLower = projectContent.toLowerCase();
  const techLower = techStack.technology.toLowerCase();

  // 1. Direct technology mention (high weight)
  const directMentions = (projectLower.match(new RegExp(techLower, 'g')) || []).length;
  score += directMentions * 50;

  // 2. Related technology family scoring
  const techFamilies: { [key: string]: string[] } = {
    'javascript': ['js', 'node', 'react', 'vue', 'angular', 'typescript', 'es6', 'jquery'],
    'python': ['django', 'flask', 'fastapi', 'pandas', 'numpy', 'tensorflow', 'pytorch'],
    'java': ['spring', 'hibernate', 'maven', 'gradle', 'jvm', 'kotlin'],
    'react': ['jsx', 'redux', 'hooks', 'nextjs', 'gatsby', 'styled-components'],
    'node': ['express', 'npm', 'yarn', 'socket.io', 'mongoose', 'sequelize'],
    'aws': ['ec2', 'lambda', 's3', 'rds', 'cloudformation', 'dynamodb', 'api gateway'],
    'docker': ['container', 'kubernetes', 'k8s', 'containerization', 'orchestration'],
    'database': ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'nosql'],
  };

  const relatedTechs = techFamilies[techLower] || [];
  for (const related of relatedTechs) {
    const relatedMentions = (projectLower.match(new RegExp(related, 'g')) || []).length;
    score += relatedMentions * 25;
  }

  // 3. Keyword relevance from bullet points
  const allBulletText = techStack.bullets.join(' ').toLowerCase();
  const keywords = allBulletText.split(' ').filter(word => 
    word.length > 3 && 
    !['with', 'using', 'from', 'that', 'this', 'have', 'been', 'were', 'will'].includes(word)
  );

  for (const keyword of keywords) {
    const keywordMentions = (projectLower.match(new RegExp(keyword, 'g')) || []).length;
    score += keywordMentions * 3;
  }

  // 4. Context scoring based on project type
  const webKeywords = ['web', 'frontend', 'backend', 'fullstack', 'website', 'application'];
  const mobileKeywords = ['mobile', 'ios', 'android', 'app', 'react native', 'flutter'];
  const dataKeywords = ['data', 'analytics', 'machine learning', 'ai', 'analysis', 'visualization'];
  
  const hasWebContext = webKeywords.some(kw => projectLower.includes(kw));
  const hasMobileContext = mobileKeywords.some(kw => projectLower.includes(kw));
  const hasDataContext = dataKeywords.some(kw => projectLower.includes(kw));

  // Boost score if technology aligns with project context
  if (hasWebContext && ['javascript', 'react', 'vue', 'angular', 'html', 'css', 'node'].includes(techLower)) {
    score += 20;
  }
  if (hasMobileContext && ['react native', 'flutter', 'swift', 'kotlin', 'java'].includes(techLower)) {
    score += 20;
  }
  if (hasDataContext && ['python', 'r', 'sql', 'tensorflow', 'pytorch', 'pandas'].includes(techLower)) {
    score += 20;
  }

  // 5. Penalty for very short projects (likely not substantial enough)
  if (projectContent.length < 200) {
    score *= 0.7;
  }

  return Math.round(score);
}

// Dynamic point extraction (same as in process route)
function extractPointsDynamically(
  techStack: TechStackItem[], 
  projects: ProjectSection[], 
  settings = {
    dynamicExtraction: true,
    minPointsPerTech: 1,
    maxPointsPerTech: 4,
    totalTargetPoints: 18
  }
): { [technology: string]: string[] } {
  const totalAvailablePoints = techStack.reduce((sum, tech) => sum + tech.bullets.length, 0);
  const targetPoints = Math.min(settings.totalTargetPoints, totalAvailablePoints);
  
  const extractionPlan = techStack.map(tech => {
    const availableBullets = tech.bullets.length;
    const minExtract = Math.min(settings.minPointsPerTech, availableBullets);
    const maxExtract = Math.min(settings.maxPointsPerTech, availableBullets);
    
    const techRelevance = projects.reduce((sum, project) => 
      sum + calculateAdvancedRelevance(tech, project.content), 0
    );
    
    const proportionalExtract = Math.round((availableBullets / totalAvailablePoints) * targetPoints);
    const relevanceBonus = techRelevance > 50 ? 1 : 0;
    const plannedExtract = Math.max(minExtract, Math.min(maxExtract, proportionalExtract + relevanceBonus));
    
    return {
      technology: tech.technology,
      bullets: tech.bullets,
      plannedExtract,
      availableBullets
    };
  });
  
  const extractedBullets: { [technology: string]: string[] } = {};
  
  for (const plan of extractionPlan) {
    const sortedBullets = plan.bullets
      .map((bullet, index) => ({ bullet, index, score: bullet.length + (bullet.match(/[0-9]/g)?.length || 0) * 5 }))
      .sort((a, b) => b.score - a.score);
    
    extractedBullets[plan.technology] = sortedBullets
      .slice(0, plan.plannedExtract)
      .map(item => item.bullet);
  }
  
  return extractedBullets;
}

// Generate insertion points with extracted bullets
function generateInsertionPointsWithExtraction(
  docText: string,
  projects: ProjectSection[],
  extractedBullets: { [technology: string]: string[] }
): InsertionPoint[] {
  const insertionPoints: InsertionPoint[] = [];
  const lines = docText.split('\n');

  // Sort projects by relevance and take top 3
  const topProjects = projects
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 3);

  for (const project of topProjects) {
    for (const [technology, bullets] of Object.entries(extractedBullets)) {
      const projectLower = project.content.toLowerCase();
      const techLower = technology.toLowerCase();

      // Only include if technology is relevant to this project
      if (projectLower.includes(techLower) || 
          calculateAdvancedRelevance({ technology, bullets }, project.content) > 10) {
        
        // Find the best insertion point
        let insertionLine = project.startIndex + 1;
        
        // Look for existing responsibilities section
        for (let i = project.startIndex; i <= project.endIndex; i++) {
          const line = lines[i] || '';
          if (/responsibilities\s*:/i.test(line) || 
              /key\s+responsibilities\s*:/i.test(line) ||
              /duties\s*:/i.test(line) ||
              /achievements\s*:/i.test(line)) {
            insertionLine = i + 1;
            break;
          }
        }

        // Get context lines
        const contextBefore = lines.slice(Math.max(0, insertionLine - 2), insertionLine)
          .join('\n').trim();
        const contextAfter = lines.slice(insertionLine, Math.min(lines.length, insertionLine + 2))
          .join('\n').trim();

        insertionPoints.push({
          technology,
          project: project.title,
          bullets,
          relevanceScore: calculateAdvancedRelevance({ technology, bullets }, project.content),
          insertionLine,
          contextBefore,
          contextAfter,
        });
      }
    }
  }

  return insertionPoints.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

// Generate insertion points with context (legacy)
function generateInsertionPoints(
  docText: string,
  projects: ProjectSection[],
  techStack: TechStackItem[]
): InsertionPoint[] {
  const insertionPoints: InsertionPoint[] = [];
  const lines = docText.split('\n');

  // Sort projects by relevance and take top 3
  const topProjects = projects
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 3);

  for (const project of topProjects) {
    for (const tech of techStack) {
      const projectLower = project.content.toLowerCase();
      const techLower = tech.technology.toLowerCase();

      // Only include if technology is relevant to this project
      if (projectLower.includes(techLower) || 
          calculateAdvancedRelevance(tech, project.content) > 10) {
        
        // Find the best insertion point
        let insertionLine = project.startIndex + 1;
        
        // Look for existing responsibilities section
        for (let i = project.startIndex; i <= project.endIndex; i++) {
          const line = lines[i] || '';
          if (/responsibilities\s*:/i.test(line) || 
              /key\s+responsibilities\s*:/i.test(line) ||
              /duties\s*:/i.test(line) ||
              /achievements\s*:/i.test(line)) {
            insertionLine = i + 1;
            break;
          }
        }

        // Get context lines
        const contextBefore = lines.slice(Math.max(0, insertionLine - 2), insertionLine)
          .join('\n').trim();
        const contextAfter = lines.slice(insertionLine, Math.min(lines.length, insertionLine + 2))
          .join('\n').trim();

        insertionPoints.push({
          technology: tech.technology,
          project: project.title,
          bullets: tech.bullets,
          relevanceScore: calculateAdvancedRelevance(tech, project.content),
          insertionLine,
          contextBefore,
          contextAfter,
        });
      }
    }
  }

  return insertionPoints.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

export async function POST(request: NextRequest) {
  try {
    const body: PreviewRequest = await request.json();
    const { 
      resumeIds, 
      techStack, 
      processingMode,
      extractionSettings = {
        dynamicExtraction: true,
        minPointsPerTech: 1,
        maxPointsPerTech: 4,
        totalTargetPoints: 18
      }
    } = body;

    if (!resumeIds || resumeIds.length === 0) {
      return NextResponse.json(
        { error: 'No resume IDs provided' },
        { status: 400 }
      );
    }

    if (!techStack || techStack.length === 0) {
      return NextResponse.json(
        { error: 'No tech stack provided' },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), 'uploads', 'resumes');
    const previews: PreviewResult[] = [];

    for (const resumeId of resumeIds) {
      try {
        // Check if resumeId is valid
        if (!resumeId) {
          console.warn('Invalid resumeId provided');
          continue;
        }

        // Try to find file by resumeId directly first
        let filePath: string;
        let matchingFile: string;
        
        // Method 1: Try direct filename (new format)
        const directFileName = `${resumeId}.docx`;
        const directFilePath = path.join(uploadsDir, directFileName);
        
        try {
          await fs.access(directFilePath);
          filePath = directFilePath;
          matchingFile = directFileName;
        } catch {
          // Method 2: Try mapping file lookup
          const mappingDir = path.join(process.cwd(), 'uploads', 'mapping');
          const mappingFile = path.join(mappingDir, `${resumeId}.json`);
          
          try {
            const mappingData = await fs.readFile(mappingFile, 'utf-8');
            const resumeData = JSON.parse(mappingData);
            matchingFile = resumeData.savedAs;
            filePath = path.join(uploadsDir, matchingFile);
            
            // Verify the file exists
            await fs.access(filePath);
          } catch {
            // Method 3: Fallback to timestamp-based lookup (old format)
            const uploadedFiles = await fs.readdir(uploadsDir);
            const timestampFile = uploadedFiles.find(file => 
              file.startsWith('upload_') && (file.includes('.docx') || file.includes('.doc'))
            );
            
            if (!timestampFile) {
              console.warn(`Resume file not found for ID: ${resumeId}`);
              continue;
            }
            
            matchingFile = timestampFile;
            filePath = path.join(uploadsDir, matchingFile);
          }
        }

        console.log(`Processing resume ID: ${resumeId}, File: ${matchingFile}`);

        // Read and parse the DOCX file
        const fileBuffer = await fs.readFile(filePath);
        const { value: docText } = await mammoth.extractRawText({ buffer: fileBuffer });

        // Extract and analyze projects
        let projects = extractProjects(docText);
        
        // If no projects found, create a general section
        if (projects.length === 0) {
          projects = [{
            title: 'Professional Experience',
            content: docText,
            responsibilitiesIndex: -1,
            relevanceScore: 0,
            startIndex: 0,
            endIndex: docText.split('\n').length - 1,
          }];
        }

        // Calculate relevance scores for all projects
        for (const project of projects) {
          for (const tech of techStack) {
            project.relevanceScore += calculateAdvancedRelevance(tech, project.content);
          }
        }

        // Generate insertion points with dynamic extraction
        const extractedBullets = extractPointsDynamically(techStack, projects, extractionSettings);
        const insertionPoints = generateInsertionPointsWithExtraction(docText, projects, extractedBullets);

        // Calculate statistics
        const topProjects = projects.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 3);
        const totalBulletsToAdd = insertionPoints.reduce((sum, point) => sum + point.bullets.length, 0);
        const averageRelevanceScore = insertionPoints.length > 0 
          ? insertionPoints.reduce((sum, point) => sum + point.relevanceScore, 0) / insertionPoints.length
          : 0;

        // Create tech stack distribution map
        const techStackDistribution: { [technology: string]: any[] } = {};
        for (const point of insertionPoints) {
          if (!techStackDistribution[point.technology]) {
            techStackDistribution[point.technology] = [];
          }
          techStackDistribution[point.technology]?.push({
            project: point.project,
            relevanceScore: point.relevanceScore,
            bulletCount: point.bullets.length,
          });
        }

        previews.push({
          filename: matchingFile,
          originalContent: docText.substring(0, 500) + '...', // First 500 chars for preview
          insertionPoints,
          topProjects,
          techStackDistribution,
          statistics: {
            totalProjects: projects.length,
            projectsToModify: topProjects.length,
            totalBulletsToAdd,
            averageRelevanceScore: Math.round(averageRelevanceScore),
          },
        });

      } catch (error) {
        console.error(`Error processing resume ${resumeId}:`, error);
        continue;
      }
    }

    if (previews.length === 0) {
      return NextResponse.json(
        { error: 'No resumes could be processed for preview' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      processingMode,
      previews,
      summary: {
        totalResumes: previews.length,
        totalInsertions: previews.reduce((sum, p) => sum + p.insertionPoints.length, 0),
        totalBulletsToAdd: previews.reduce((sum, p) => sum + p.statistics.totalBulletsToAdd, 0),
        averageProjectsPerResume: Math.round(
          previews.reduce((sum, p) => sum + p.statistics.totalProjects, 0) / previews.length
        ),
      },
    });

  } catch (error) {
    console.error('Preview generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}
