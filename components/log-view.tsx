"use client";

import { MainView } from "@/components/main-view";
import { LogEntry, MessageFilter, SourceFilter } from "@/components/datatypes";
import { FC, useMemo, useState } from "react";
import { SourceFilterComponent } from "./source-filter";
import { Analysis } from "./analysis";

export interface LogViewProps {
  logfile: string;
}

export const LogView: FC<LogViewProps> = ({ logfile }) => {
  const entries = useMemo<LogEntry[]>(
    () => logfile.split("\n").map((line, idx) => new LogEntry(idx + 1, line)),
    [logfile]
  );

  const initialSourceFilter = useMemo<SourceFilter>(() => {
    const sourceFilter = new SourceFilter();
    entries.forEach((entry) =>
      sourceFilter.ensure_exists(entry.source, entry.urgency)
    );
    return sourceFilter;
  }, [entries]);

  const [sourceFilter, setSourceFilter] =
    useState<SourceFilter>(initialSourceFilter);

  return (
    <section className="flex flex-row items-start justify-center gap-8 w-full">
      <div className="basis-80 w-80">
        <SourceFilterComponent
          onFilterUpdate={setSourceFilter}
          filter={sourceFilter}
        />
      </div>
      <div className="grow shrink">
        <MainView entries={entries} sourceFilter={sourceFilter} />
      </div>
      <div className="basis-100 w-100">
        <Analysis entries={entries} />
      </div>
    </section>
  );
};
