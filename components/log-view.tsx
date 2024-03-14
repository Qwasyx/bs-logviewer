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
  let entries = useMemo<LogEntry[]>(
    () => logfile.split("\n").map((line, idx) => new LogEntry(idx + 1, line)),
    [logfile]
  );

  let initialSourceFilter = useMemo<SourceFilter>(() => {
    let sourceFilter = new SourceFilter();
    entries.forEach((entry) =>
      sourceFilter.ensure_exists(entry.source, entry.urgency)
    );
    return sourceFilter;
  }, [entries]);

  let [sourceFilter, setSourceFilter] =
    useState<SourceFilter>(initialSourceFilter);

  return (
    <section className="flex flex-row items-start justify-center gap-8">
      <div className="min-w-min">
        <SourceFilterComponent
          onFilterUpdate={setSourceFilter}
          filter={sourceFilter}
        />
      </div>
      <div className="min-w-min">
        <MainView entries={entries} sourceFilter={sourceFilter} />
      </div>
      <div className="min-w-min">
        <Analysis entries={entries} />
      </div>
    </section>
  );
};
