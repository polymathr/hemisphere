import { json, type RequestHandler } from '@sveltejs/kit';
import { GoogleGenAI } from '@google/genai';
import type { AIActionResponse, ScreenSnapshot } from '#lib/types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { prompt, screenContext } = (await request.json()) as {
      prompt: string;
      screenContext: ScreenSnapshot;
    };

    if (!prompt || typeof prompt !== 'string') {
      return json({ error: 'Missing user prompt' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || (typeof process !== 'undefined' && process.env ? process.env['GEMINI_API_KEY'] : undefined);

    // ==============================================================
    // 1. LIVE GEMINI 1.5 PRO / FLASH INTEGRATION
    // ==============================================================
    if (apiKey && apiKey !== 'your-gemini-api-key-here') {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const systemInstruction = `
You are the silent, invisible organizational backend of "Hemisphere", a biophilic physical journal and Two-Minute Spread planner.
You strictly adhere to the KISS (Keep It Simple, Stupid) principle.
NEVER return conversational pleasantries or filler words like "Certainly!", "Sure thing!", or "I have arranged your schedule".

You must output ONLY a valid JSON object matching this schema:
{
  "thought": "Brief internal reasoning sentence",
  "statusMessage": "Short editorial note, max 8 words (e.g. 'Scheduled 2 tasks for afternoon')",
  "actions": [
    { "type": "scheduleTask", "taskId": "...", "scheduledTime": "HH:mm:ss", "durationMinutes": 30 },
    { "type": "unscheduleTask", "taskId": "..." },
    { "type": "createTask", "title": "...", "scope": "DAY" | "WEEK" | "MONTH", "targetDate": "YYYY-MM-DD", "scheduledTime": "HH:mm:ss", "durationMinutes": 30 },
    { "type": "completeTask", "taskId": "..." },
    { "type": "uncompleteTask", "taskId": "..." },
    { "type": "updateDailySummary", "oneLineSummary": "...", "reflectionNotes": "..." },
    { "type": "toggleHabit", "habitId": "...", "date": "YYYY-MM-DD" }
  ]
}

Analyze the user's prompt against the provided visible screen context JSON.
Map user intent directly into concrete atomic actions.
`;

        const userContent = `
Current Screen Context JSON:
${JSON.stringify(screenContext, null, 2)}

User Instruction:
"${prompt}"
`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userContent,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        });

        const rawText = response.text?.trim() || '{}';
        const parsed = JSON.parse(rawText) as AIActionResponse;

        return json(parsed);
      } catch (geminiError) {
        console.warn('Gemini API call failed or encountered error, evaluating local heuristic fallback:', geminiError);
      }
    }

    // ==============================================================
    // 2. HIGH-FIDELITY OFFLINE / LOCAL HEURISTIC PARSER
    // Guarantees zero downtime and instant testability even without an API key
    // ==============================================================
    const lowerPrompt = prompt.toLowerCase();
    const result: AIActionResponse = {
      thought: 'Parsed intent via local organizational engine.',
      statusMessage: 'Updated journal spread',
      actions: []
    };

    // Case A: Schedule uncompleted tasks / plan afternoon / schedule remaining
    if (lowerPrompt.includes('schedule') || lowerPrompt.includes('plan') || lowerPrompt.includes('afternoon')) {
      const uncompletedTasks = screenContext.visibleTasks.filter(t => !t.is_completed && !t.scheduled_time);
      const availableHours = ['14:00:00', '16:00:00', '18:00:00'];

      uncompletedTasks.slice(0, 3).forEach((task, idx) => {
        result.actions.push({
          type: 'scheduleTask',
          taskId: task.id,
          scheduledTime: availableHours[idx] || '17:00:00',
          durationMinutes: 45
        });
      });

      result.statusMessage = `Scheduled ${result.actions.length} tasks into timeline`;
      result.thought = `Slotted uncompleted tasks into available afternoon planner tracks.`;
    } 
    // Case B: Create new task (e.g. "add task Review prototype" or "create task Drink tea")
    else if (lowerPrompt.includes('add task') || lowerPrompt.includes('create task') || lowerPrompt.startsWith('task:')) {
      const cleanTitle = prompt
        .replace(/^(add task:?|create task:?|task:?)/i, '')
        .trim();

      if (cleanTitle) {
        result.actions.push({
          type: 'createTask',
          title: cleanTitle,
          scope: screenContext.activeView || 'DAY',
          targetDate: screenContext.currentDate
        });
        result.statusMessage = `Added task to ${screenContext.activeView.toLowerCase()} notebook`;
        result.thought = `Created task "${cleanTitle}".`;
      }
    }
    // Case C: Summarize day or update reflection
    else if (lowerPrompt.includes('summarize') || lowerPrompt.includes('reflection') || lowerPrompt.includes('essence')) {
      const completedCount = screenContext.visibleTasks.filter(t => t.is_completed).length;
      const totalCount = screenContext.visibleTasks.length;

      const summary = `Focused progress: resolved ${completedCount} of ${totalCount} intentions with tactile clarity.`;
      const reflection = `Maintained biophilic calm while anchoring time blocks to core priorities.`;

      result.actions.push({
        type: 'updateDailySummary',
        oneLineSummary: summary,
        reflectionNotes: reflection
      });
      result.statusMessage = 'Refreshed daily essence and reflections';
      result.thought = 'Generated concise reflection from today\'s completion metrics.';
    }
    // Case D: Complete all / check off
    else if (lowerPrompt.includes('complete all') || lowerPrompt.includes('mark done')) {
      screenContext.visibleTasks.filter(t => !t.is_completed).forEach(task => {
        result.actions.push({
          type: 'completeTask',
          taskId: task.id
        });
      });
      result.statusMessage = `Marked ${result.actions.length} tasks complete`;
      result.thought = 'Checked off all remaining active tasks.';
    }
    else {
      // Default fallback: create intention
      result.actions.push({
        type: 'createTask',
        title: prompt.trim(),
        scope: screenContext.activeView || 'DAY',
        targetDate: screenContext.currentDate
      });
      result.statusMessage = 'Captured intention in notebook';
      result.thought = `Interpreted "${prompt}" as a new notebook intention.`;
    }

    return json(result);
  } catch (err) {
    console.error('Unhandled AI endpoint error:', err);
    return json({ error: 'Failed to process AI command' }, { status: 500 });
  }
};
