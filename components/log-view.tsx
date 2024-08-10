"use client";

import { MainView } from "@/components/main-view";
import { LogEntry, SourceFilter } from "@/components/datatypes";
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
    <section className="flex flex-col 3xl:flex-row items-start justify-center gap-4 w-full h-full">
      <div className="w-full 3xl:order-2 3xl:w-auto 3xl:grow">
        <MainView entries={entries} sourceFilter={sourceFilter} />
      </div>
      <div className="w-full 3xl:order-1 3xl:basis-80 3xl:w-80">
        <SourceFilterComponent
          onFilterUpdate={setSourceFilter}
          filter={sourceFilter}
        />
      </div>
      <div className="w-full 3xl:order-3 3xl:basis-[30rem] 3xl:w-[30rem]">
        <Analysis entries={entries} />
      </div>
    </section>
  );
};
