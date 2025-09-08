import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import * as mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun } from 'docx';

// Force Node.js runtime so Node APIs (fs/path/Buffer) work in this route
export const runtime = 'nodejs';

interface TechStackItem {
  technology: string;
  bullets: string[];
}

interface ProcessRequest {
  resumeIds?: string[];
  techStack: TechStackItem[];
  processAll?: boolean;
  emailConfig?: {
    senderEmail: string;
    senderPassword: string;
    recipientEmail: string;
    smtpHost: string;
    smtpPort: number;
    subject: string;
    message: string;
  } | null;
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
}

// Extract projects from DOCX content
function extractProjects(docText: string): ProjectSection[] {
  const projects: ProjectSection[] = [];
  const lines = docText.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] ?? '').toLowerCase();

    // Look for project indicators
    if (line.includes('project') || line.includes('experience') || line.includes('work')) {
      let projectContent = '';
      let responsibilitiesIndex = -1;
      let j = i;

      // Collect project content until next major section
      while (j < lines.length && !isNewSection(lines[j] ?? '', j > i)) {
        projectContent += (lines[j] ?? '') + '\n';

        // Find responsibilities section
        if ((lines[j] ?? '').toLowerCase().includes('responsibilities:')) {
          responsibilitiesIndex = projectContent.length;
        }
        j++;
      }

      if (responsibilitiesIndex > -1) {
        projects.push({
          title: (lines[i] ?? '').trim(),
          content: projectContent,
          responsibilitiesIndex,
          relevanceScore: 0,
        });
      }
    }
  }

  return projects;
}

// Check if line starts a new major section
function isNewSection(line: string, notFirstLine: boolean): boolean {
  if (!notFirstLine) return false;

  const lowerLine = line.toLowerCase();
  const sectionKeywords = ['education', 'skills', 'experience', 'projects', 'certifications', 'awards'];

  return sectionKeywords.some(
    (keyword) => lowerLine.includes(keyword) && (lowerLine.includes(':') || line.trim() === line.trim().toUpperCase()),
  );
}

// Enhanced relevance scoring algorithm
function calculateRelevance(techStack: TechStackItem, projectContent: string): number {
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

  // 3. Enhanced keyword relevance from bullet points
  const allBulletText = techStack.bullets.join(' ').toLowerCase();
  const keywords = allBulletText.split(' ').filter(word => 
    word.length > 3 && 
    !['with', 'using', 'from', 'that', 'this', 'have', 'been', 'were', 'will'].includes(word)
  );

  for (const keyword of keywords) {
    const keywordMentions = (projectLower.match(new RegExp(keyword, 'g')) || []).length;
    score += keywordMentions * 5;
  }

  // 4. Context-aware scoring
  const webKeywords = ['web', 'frontend', 'backend', 'fullstack', 'website', 'application'];
  const mobileKeywords = ['mobile', 'ios', 'android', 'app', 'react native', 'flutter'];
  const dataKeywords = ['data', 'analytics', 'machine learning', 'ai', 'analysis', 'visualization'];
  
  const hasWebContext = webKeywords.some(kw => projectLower.includes(kw));
  const hasMobileContext = mobileKeywords.some(kw => projectLower.includes(kw));
  const hasDataContext = dataKeywords.some(kw => projectLower.includes(kw));

  // Boost score if technology aligns with project context
  if (hasWebContext && ['javascript', 'react', 'vue', 'angular', 'html', 'css', 'node'].includes(techLower)) {
    score += 30;
  }
  if (hasMobileContext && ['react native', 'flutter', 'swift', 'kotlin', 'java'].includes(techLower)) {
    score += 30;
  }
  if (hasDataContext && ['python', 'r', 'sql', 'tensorflow', 'pytorch', 'pandas'].includes(techLower)) {
    score += 30;
  }

  // 5. Project length consideration
  if (projectContent.length < 200) {
    score *= 0.7; // Penalty for very short projects
  } else if (projectContent.length > 800) {
    score *= 1.2; // Bonus for substantial projects
  }

  return Math.round(score);
}

// Dynamic point extraction with equal distribution
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
  
  // Calculate extraction plan for each technology
  const extractionPlan = techStack.map(tech => {
    const availableBullets = tech.bullets.length;
    const minExtract = Math.min(settings.minPointsPerTech, availableBullets);
    const maxExtract = Math.min(settings.maxPointsPerTech, availableBullets);
    
    // Dynamic extraction based on relevance and proportion
    const techRelevance = projects.reduce((sum, project) => 
      sum + calculateRelevance(tech, project.content), 0
    );
    
    // Base extraction: proportional to available bullets and relevance
    const proportionalExtract = Math.round((availableBullets / totalAvailablePoints) * targetPoints);
    const relevanceBonus = techRelevance > 50 ? 1 : 0; // Bonus for highly relevant tech
    const plannedExtract = Math.max(minExtract, Math.min(maxExtract, proportionalExtract + relevanceBonus));
    
    return {
      technology: tech.technology,
      bullets: tech.bullets,
      plannedExtract,
      availableBullets
    };
  });
  
  // Extract the best bullets from each technology
  const extractedBullets: { [technology: string]: string[] } = {};
  
  for (const plan of extractionPlan) {
    // Sort bullets by length and complexity (longer bullets often more detailed/valuable)
    const sortedBullets = plan.bullets
      .map((bullet, index) => ({ bullet, index, score: bullet.length + (bullet.match(/[0-9]/g)?.length || 0) * 5 }))
      .sort((a, b) => b.score - a.score);
    
    // Extract top bullets
    extractedBullets[plan.technology] = sortedBullets
      .slice(0, plan.plannedExtract)
      .map(item => item.bullet);
  }
  
  return extractedBullets;
}

// Equal distribution algorithm across top 3 projects
function distributePointsEqually(
  extractedBullets: { [technology: string]: string[] },
  projects: ProjectSection[]
): { [projectTitle: string]: { technology: string; bullets: string[] }[] } {
  // Get top 3 projects
  const topProjects = projects
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 3);
  
  // Collect all bullets to distribute
  const allBullets: { technology: string; bullet: string; relevance: number }[] = [];
  
  for (const [technology, bullets] of Object.entries(extractedBullets)) {
    for (const bullet of bullets) {
      // Calculate relevance of this bullet to each project
      const projectRelevances = topProjects.map(project => ({
        project: project.title,
        relevance: calculateBulletRelevance(bullet, technology, project.content)
      }));
      
      // Assign to most relevant project
      const bestProject = projectRelevances.reduce((best, current) => 
        current.relevance > best.relevance ? current : best
      );
      
      allBullets.push({
        technology,
        bullet,
        relevance: bestProject.relevance
      });
    }
  }
  
  // Distribute bullets equally across projects
  const distribution: { [projectTitle: string]: { technology: string; bullets: string[] }[] } = {};
  
  // Initialize distribution
  topProjects.forEach(project => {
    distribution[project.title] = [];
  });
  
  // Group bullets by technology and distribute
  const techGroups = Object.keys(extractedBullets);
  
  techGroups.forEach(technology => {
    const techBullets = allBullets.filter(b => b.technology === technology);
    
    // Sort bullets by relevance
    techBullets.sort((a, b) => b.relevance - a.relevance);
    
    // Distribute evenly across projects
    const bulletsPerProject = Math.ceil(techBullets.length / topProjects.length);
    
    topProjects.forEach((project, projectIndex) => {
      const startIndex = projectIndex * bulletsPerProject;
      const endIndex = Math.min(startIndex + bulletsPerProject, techBullets.length);
      const projectBullets = techBullets.slice(startIndex, endIndex);
      
      if (projectBullets.length > 0) {
        const existingTechEntry = distribution[project.title]?.find(entry => entry.technology === technology);
        if (existingTechEntry) {
          existingTechEntry.bullets.push(...projectBullets.map(b => b.bullet));
        } else {
          distribution[project.title]?.push({
            technology,
            bullets: projectBullets.map(b => b.bullet)
          });
        }
      }
    });
  });
  
  return distribution;
}

// Calculate bullet relevance to specific project content
function calculateBulletRelevance(bullet: string, technology: string, projectContent: string): number {
  let score = 0;
  const bulletLower = bullet.toLowerCase();
  const projectLower = projectContent.toLowerCase();
  const techLower = technology.toLowerCase();
  
  // Direct keyword matches in bullet and project
  const bulletKeywords = bulletLower.split(' ').filter(word => word.length > 3);
  for (const keyword of bulletKeywords) {
    if (projectLower.includes(keyword)) {
      score += 10;
    }
  }
  
  // Technology alignment bonus
  if (projectLower.includes(techLower)) {
    score += 25;
  }
  
  // Action words bonus (developed, implemented, built, etc.)
  const actionWords = ['developed', 'implemented', 'built', 'created', 'designed', 'optimized', 'managed'];
  for (const action of actionWords) {
    if (bulletLower.includes(action)) {
      score += 5;
    }
  }
  
  return score;
}

// Process DOCX file with dynamic extraction
async function processResumeFile(
  filePath: string, 
  techStack: TechStackItem[], 
  extractionSettings = {
    dynamicExtraction: true,
    minPointsPerTech: 1,
    maxPointsPerTech: 4,
    totalTargetPoints: 18
  }
): Promise<Buffer> {
  try {
    // Read the original DOCX file
    const fileBuffer = await fs.readFile(filePath);
    // Extract text content
    const { value: docText } = await mammoth.extractRawText({ buffer: fileBuffer });
    // Extract projects/sections
    let projects = extractProjects(docText);
    // If no projects found, treat the whole doc as one section
    if (projects.length === 0) {
      projects = [
        {
          title: 'General Experience',
          content: docText,
          responsibilitiesIndex: -1,
          relevanceScore: 0,
        },
      ];
    }
    // Calculate relevance scores
    for (const project of projects) {
      for (const tech of techStack) {
        project.relevanceScore += calculateRelevance(tech, project.content);
      }
    }
    
    // Use dynamic extraction and equal distribution
    const extractedBullets = extractPointsDynamically(techStack, projects, extractionSettings);
    const distribution = distributePointsEqually(extractedBullets, projects);
    
    // Get top 3 projects
    const topProjects = projects.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 3);

    // Build new docx with original content and injected bullets
    const docChildren: Paragraph[] = [];
    const docLines = docText.split('\n');

    for (let i = 0; i < docLines.length; i++) {
      const line = docLines[i] ?? '';
      const lower = line.toLowerCase();

      // Determine if this line belongs to a top project by checking title presence
      const matchProj = topProjects.find((p) => line && line.trim().toLowerCase().includes(p.title.trim().toLowerCase()));

      // Always push the original line
      docChildren.push(new Paragraph({ children: [new TextRun(line)] }));

      // If we are at a matched project title and no responsibilities in this line, add a section
      if (matchProj && !lower.includes('responsibilities:')) {
        docChildren.push(new Paragraph({ children: [new TextRun({ text: 'Responsibilities:', bold: true })] }));
        
        // Add distributed bullets for this project
        const projectDistribution = distribution[matchProj.title];
        if (projectDistribution) {
          for (const techEntry of projectDistribution) {
            for (const bullet of techEntry.bullets) {
              docChildren.push(new Paragraph({ children: [new TextRun(`• ${bullet}`)] }));
            }
          }
        }
      }

      // If the current line is an explicit responsibilities line within a matched project, append bullets
      if (matchProj && lower.includes('responsibilities:')) {
        // Add distributed bullets for this project
        const projectDistribution = distribution[matchProj.title];
        if (projectDistribution) {
          for (const techEntry of projectDistribution) {
            for (const bullet of techEntry.bullets) {
              docChildren.push(new Paragraph({ children: [new TextRun(`• ${bullet}`)] }));
            }
          }
        }
      }
    }

    // If no Responsibilities or project found, append at end
    if (topProjects.length === 0) {
      docChildren.push(new Paragraph({ children: [new TextRun({ text: 'Key Contributions:', bold: true })] }));
      
      // Add all extracted bullets
      for (const [technology, bullets] of Object.entries(extractedBullets)) {
        for (const bullet of bullets) {
          docChildren.push(new Paragraph({ children: [new TextRun(`• ${bullet}`)] }));
        }
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: docChildren,
        },
      ],
    });
    return await Packer.toBuffer(doc);
  } catch (error) {
    console.error('Error processing resume:', error);
    // Return an empty Buffer to satisfy the return type in case of error
    return Buffer.from('');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ProcessRequest = await request.json();
    const { 
      resumeIds = [], 
      techStack = [], 
      processAll = false, 
      emailConfig = null,
      extractionSettings = {
        dynamicExtraction: true,
        minPointsPerTech: 1,
        maxPointsPerTech: 4,
        totalTargetPoints: 18
      }
    } = body;

    // Validate input
    if (techStack.length === 0) {
      return NextResponse.json({ error: 'Tech stack is required' }, { status: 400 });
    }

    if (!processAll && resumeIds.length === 0) {
      return NextResponse.json({ error: 'No resumes specified for processing' }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), 'uploads');
    const processedDir = path.join(process.cwd(), 'processed');

    // Ensure processed directory exists
    await fs.mkdir(processedDir, { recursive: true });

    let filesToProcess: string[] = [];

    if (processAll) {
      // Get all DOCX files from uploads directory
      const files = await fs.readdir(uploadsDir);
      filesToProcess = files.filter((file) => file.toLowerCase().endsWith('.docx') || file.toLowerCase().endsWith('.doc'));
    } else {
      filesToProcess = resumeIds.map((id) => `${id}.docx`);
    }

    const results: Array<{ originalFile: string; processedFile?: string; status: 'success' | 'error'; error?: string }> = [];

    for (const fileName of filesToProcess) {
      const filePath = path.join(uploadsDir, fileName);
      try {
        // Check if file exists
        await fs.access(filePath);
        // Process the resume with dynamic extraction
        const processedBuffer = await processResumeFile(filePath, techStack, extractionSettings);
        // Save processed file
        const processedFileName = `processed_${fileName}`;
        const processedFilePath = path.join(processedDir, processedFileName);
        await fs.writeFile(processedFilePath, processedBuffer);
        results.push({ originalFile: fileName, processedFile: processedFileName, status: 'success' });
      } catch (error) {
        console.error(`Error processing ${fileName}:`, error);
        results.push({ originalFile: fileName, status: 'error', error: 'Failed to process file' });
      }
    }

    // Send email if configured
    if (emailConfig && results.some(r => r.status === 'success' && r.processedFile)) {
      try {
        const processedFiles = results
          .filter(r => r.status === 'success' && r.processedFile)
          .map(r => r.processedFile!);

        const emailResponse = await fetch(`${request.nextUrl.origin}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config: emailConfig,
            attachments: processedFiles,
            templateType: 'modern',
          }),
        });

        const emailResult = await emailResponse.json();
        if (!emailResponse.ok) {
          console.warn('Email sending failed:', emailResult.error);
        } else {
          console.log('Email sent successfully:', emailResult.data);
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.filter((r) => r.status === 'success').length} resumes`,
      results,
      emailSent: emailConfig ? true : false,
    });
  } catch (error) {
    console.error('Resume processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get processing status/history
export async function GET() {
  try {
    const processedDir = path.join(process.cwd(), 'processed');

    try {
      const files = await fs.readdir(processedDir);
      const processedFiles = files
        .filter((file) => file.startsWith('processed_'))
        .map((file) => ({
          filename: file,
          originalName: file.replace('processed_', ''),
          processedAt: new Date().toISOString(), // In real app, get from file stats
        }));

      return NextResponse.json({
        processedFiles,
        total: processedFiles.length,
      });
    } catch (error) {
      // Directory doesn't exist yet
      return NextResponse.json({ processedFiles: [], total: 0 });
    }
  } catch (error) {
    console.error('Error fetching processed files:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}