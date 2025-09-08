'use client';

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Alert,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
} from '@mui/icons-material';

interface InsertionPoint {
  technology: string;
  project: string;
  bullets: string[];
  relevanceScore: number;
  insertionLine: number;
  contextBefore: string;
  contextAfter: string;
}

interface PreviewData {
  filename: string;
  originalContent: string;
  insertionPoints: InsertionPoint[];
  statistics: {
    totalProjects: number;
    projectsToModify: number;
    totalBulletsToAdd: number;
    averageRelevanceScore: number;
  };
}

interface ResumePreviewProps {
  previewData: PreviewData[];
  extractionPlan: Array<{
    technology: string;
    availableBullets: number;
    plannedExtract: number;
    bullets: string[];
  }>;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ previewData, extractionPlan }) => {
  // Simulate Word document content with insertions
  const generateWordLikePreview = (data: PreviewData) => {
    const lines = data.originalContent.split('\n');
    const processedLines: Array<{ content: string; isOriginal: boolean; isInsertion?: boolean; technology?: string }> = [];
    
    // Group insertion points by line
    const insertionMap = new Map<number, InsertionPoint[]>();
    data.insertionPoints.forEach(point => {
      if (!insertionMap.has(point.insertionLine)) {
        insertionMap.set(point.insertionLine, []);
      }
      insertionMap.get(point.insertionLine)!.push(point);
    });

    // Process each line and add insertions
    lines.forEach((line, index) => {
      // Add original line
      processedLines.push({ content: line, isOriginal: true });
      
      // Add insertions for this line
      if (insertionMap.has(index)) {
        const insertions = insertionMap.get(index)!;
        insertions.forEach(insertion => {
          // Add responsibilities header if needed
          if (!line.toLowerCase().includes('responsibilities')) {
            processedLines.push({ 
              content: 'Responsibilities:', 
              isOriginal: false, 
              isInsertion: true 
            });
          }
          
          // Add bullet points
          insertion.bullets.forEach(bullet => {
            processedLines.push({ 
              content: `• ${bullet}`, 
              isOriginal: false, 
              isInsertion: true, 
              technology: insertion.technology 
            });
          });
        });
      }
    });

    return processedLines;
  };

  return (
    <Box>
      <Alert severity="success" sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          📄 Full Document Preview - Exactly How It Will Look in Microsoft Word
        </Typography>
        <Typography variant="body2">
          Green highlights show new content that will be added to your resume.
        </Typography>
      </Alert>

      {/* Extraction Summary */}
      <Card sx={{ mb: 3, bgcolor: 'info.50', border: 1, borderColor: 'info.200' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="info.main">
            📊 Dynamic Extraction Summary
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
            {extractionPlan.map((plan, index) => (
              <Chip
                key={index}
                label={`${plan.technology}: ${plan.plannedExtract}/${plan.availableBullets} points`}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
          <Typography variant="body2" color="text.secondary">
            <strong>Total bullets to add:</strong> {extractionPlan.reduce((sum, plan) => sum + plan.plannedExtract, 0)} | 
            <strong> Distribution:</strong> Equal across top 3 projects
          </Typography>
        </CardContent>
      </Card>

      {/* Document Previews */}
      {previewData.map((data, index) => (
        <Card key={index} sx={{ mb: 4 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Typography variant="h6" component="div">
                📄 {data.filename}
              </Typography>
              <Chip 
                label={`+${data.statistics.totalBulletsToAdd} new bullets`}
                color="success"
                size="small"
              />
            </Box>

            {/* Word-like document preview */}
            <Paper 
              elevation={2}
              sx={{ 
                p: 4, 
                bgcolor: 'white',
                border: '1px solid #ccc',
                minHeight: '600px',
                maxHeight: '800px',
                overflow: 'auto',
                fontFamily: 'Arial, sans-serif',
                fontSize: '11pt',
                lineHeight: 1.15,
                color: '#000',
              }}
            >
              {/* Document content with Word-like styling */}
              <Box
                sx={{
                  '& > div': {
                    mb: 0.5,
                    minHeight: '16px',
                  },
                  '& .original-line': {
                    color: '#000',
                  },
                  '& .insertion-line': {
                    backgroundColor: '#d4ffda',
                    border: '1px solid #4caf50',
                    borderRadius: '2px',
                    padding: '2px 4px',
                    margin: '1px 0',
                    position: 'relative',
                    '&::before': {
                      content: '"NEW"',
                      position: 'absolute',
                      right: 4,
                      top: 2,
                      fontSize: '8px',
                      color: '#2e7d32',
                      fontWeight: 'bold',
                    }
                  },
                  '& .responsibilities-header': {
                    fontWeight: 'bold',
                    fontSize: '11pt',
                    marginTop: '8px',
                    marginBottom: '4px',
                  },
                  '& .bullet-point': {
                    paddingLeft: '20px',
                    textIndent: '-12px',
                  }
                }}
              >
                {generateWordLikePreview(data).map((line, lineIndex) => (
                  <Box
                    key={lineIndex}
                    className={`${line.isOriginal ? 'original-line' : 'insertion-line'} ${
                      line.content.toLowerCase().includes('responsibilities') ? 'responsibilities-header' : ''
                    } ${
                      line.content.startsWith('•') ? 'bullet-point' : ''
                    }`}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '11pt',
                        fontFamily: 'Arial, sans-serif',
                        lineHeight: 1.15,
                        whiteSpace: 'pre-wrap',
                        flex: 1,
                        fontWeight: line.content.toLowerCase().includes('responsibilities') || 
                                   line.content.toLowerCase().includes('experience') ||
                                   line.content.toLowerCase().includes('project') ? 'bold' : 'normal',
                      }}
                    >
                      {line.content || ' '}
                    </Typography>
                    
                    {/* Technology indicator for new bullets */}
                    {line.isInsertion && line.technology && line.content.startsWith('•') && (
                      <Chip
                        label={line.technology}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: '8px', height: '16px' }}
                      />
                    )}
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Statistics for this document */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                📈 Processing Statistics:
              </Typography>
              <Box display="flex" gap={3} flexWrap="wrap">
                <Typography variant="caption">
                  <strong>Projects found:</strong> {data.statistics.totalProjects}
                </Typography>
                <Typography variant="caption">
                  <strong>Projects to modify:</strong> {data.statistics.projectsToModify}
                </Typography>
                <Typography variant="caption">
                  <strong>New bullets:</strong> {data.statistics.totalBulletsToAdd}
                </Typography>
                <Typography variant="caption">
                  <strong>Avg relevance:</strong> {data.statistics.averageRelevanceScore}%
                </Typography>
              </Box>
            </Box>

            {/* Insertion points details */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                🎯 Insertion Details:
              </Typography>
              {data.insertionPoints.map((point, pointIndex) => (
                <Box 
                  key={pointIndex} 
                  display="flex" 
                  alignItems="center" 
                  gap={1} 
                  mb={1}
                  p={1}
                  bgcolor="success.50"
                  borderRadius={1}
                >
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Typography variant="body2">
                    <strong>{point.technology}</strong> → {point.project}
                  </Typography>
                  <Chip 
                    label={`${point.bullets.length} bullets`} 
                    size="small" 
                    color="success"
                    variant="outlined"
                  />
                  <Chip 
                    label={`${point.relevanceScore}% match`} 
                    size="small" 
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      ))}

      {/* Legend */}
      <Card sx={{ bgcolor: 'grey.50' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📖 Preview Legend
          </Typography>
          <Box display="flex" flexDirection="column" gap={1}>
            <Box display="flex" alignItems="center" gap={2}>
              <Box 
                sx={{ 
                  width: 20, 
                  height: 16, 
                  bgcolor: 'white', 
                  border: '1px solid #ccc' 
                }}
              />
              <Typography variant="body2">Original resume content</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Box 
                sx={{ 
                  width: 20, 
                  height: 16, 
                  bgcolor: '#d4ffda', 
                  border: '1px solid #4caf50' 
                }}
              />
              <Typography variant="body2">New content to be added</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Chip size="small" label="Tech" variant="outlined" />
              <Typography variant="body2">Technology indicator for new bullets</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ResumePreview;
