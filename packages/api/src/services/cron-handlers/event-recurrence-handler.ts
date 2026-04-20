import type { JobResult } from '../cron-service.ts';
import {
  getRecurrenceTemplates,
  generateRecurrenceInstances,
  DEFAULT_RECURRENCE_WINDOW_WEEKS,
} from '../event-service.ts';

/**
 * Cron handler that generates future event instances for recurring event series.
 * Maintains a rolling window (configurable via `windowWeeks` in job config).
 */
export async function eventRecurrenceHandler(config: Record<string, unknown>): Promise<JobResult> {
  const windowWeeks = typeof config.windowWeeks === 'number' ? config.windowWeeks : DEFAULT_RECURRENCE_WINDOW_WEEKS;

  try {
    const templates = await getRecurrenceTemplates();
    let totalGenerated = 0;
    let seriesProcessed = 0;

    for (const template of templates) {
      if (!template.recurrenceRule) continue;

      const rule = JSON.parse(template.recurrenceRule) as { frequency: string };
      const generated = await generateRecurrenceInstances(template, rule.frequency, windowWeeks);

      if (generated > 0) {
        totalGenerated += generated;
        seriesProcessed++;
      }
    }

    return {
      success: true,
      summary:
        totalGenerated > 0
          ? `Generated ${totalGenerated} event instance(s) across ${seriesProcessed} recurring series`
          : `No new instances needed (${templates.length} active template(s), window: ${windowWeeks} weeks)`,
    };
  } catch (err) {
    return {
      success: false,
      summary: 'Event recurrence generation failed',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
