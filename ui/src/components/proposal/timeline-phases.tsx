import { parsePhases } from '@/utils'

export function TimelinePhases({ content }: { content: string }) {
  const phases = parsePhases(content)
  if (!phases.length) return null

  return (
    <div className="space-y-3 my-3">
      {phases.map((phase) => (
        <div key={`${phase.number}-${phase.name}`} className="rounded-lg border bg-background p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-sm">
              {phase.number}
            </span>
            <h3 className="font-semibold text-sm md:text-base text-foreground">{phase.name}</h3>
            {phase.duration && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {phase.duration}
              </span>
            )}
          </div>
          {phase.tasks.length > 0 && (
            <ul className="mt-3 list-disc space-y-1.5 pl-10 text-xs md:text-sm text-muted-foreground">
              {phase.tasks.map((task) => (
                <li key={task}>{task}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}
