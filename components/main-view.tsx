"use client";

import {
  Button,
  Divider,
  Input,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
  getKeyValue,
} from "@nextui-org/react";
import { LogEntry, MessageFilter, SourceFilter } from "./datatypes";
import { Key, useCallback, useEffect, useMemo, useState } from "react";
import { fontMono } from "@/config/fonts";
import { UrgencyIndicator } from "./urgency-indicator";
import { SearchIcon } from "./icons";
import clsx from "clsx";

enum ColumnKeys {
  LINE_NUMBER = "line_number",
  TIME = "time",
  SOURCE = "source",
  URGENCY = "urgency",
  MESSAGE = "message",
}

const columns = [
  {
    key: ColumnKeys.LINE_NUMBER,
    label: "LINE",
  },
  {
    key: ColumnKeys.TIME,
    label: "TIME",
  },
  {
    key: ColumnKeys.SOURCE,
    label: "SOURCE",
  },
  {
    key: ColumnKeys.URGENCY,
    label: "URGENCY",
  },
  {
    key: ColumnKeys.MESSAGE,
    label: "MESSAGE",
  },
];

enum DisplayEntryType {
  ACTUAL_ENTRY = "actual_entry",
  SHOW_DUPLICATES = "show_duplicates",
  HIDE_DUPLICATES = "hide_duplicates",
}

interface DisplayEntry {
  unique_id: number;

  type: DisplayEntryType;
  duplicate: boolean;
  hidden: boolean;

  // for actual entries
  entry?: LogEntry;

  // for hide/show duplicates
  own_position?: number;
  range_start?: number;
  range_end?: number;
}

export interface MainViewProps {
  entries: LogEntry[];
  sourceFilter: SourceFilter;
}

const rowsPerPage = 200;
const deduplicationContext = 30;
const deduplicationCollapseThreshold = 10;

export const MainView: React.FC<MainViewProps> = ({
  entries,
  sourceFilter,
}) => {
  let [page, setPage] = useState<number>(1);

  const [displayEntries, setDisplayEntries] = useState<DisplayEntry[]>([]);

  useEffect(() => {
    const displayEntries: DisplayEntry[] = [];
    let currentDuplicates: DisplayEntry[] = [];

    function flushDuplicates() {
      if (currentDuplicates.length >= deduplicationCollapseThreshold) {
        currentDuplicates.forEach((d) => {
          d.hidden = true;
        });
        displayEntries.push({
          unique_id: -1,
          type: DisplayEntryType.SHOW_DUPLICATES,
          own_position: displayEntries.length,
          range_start: displayEntries.length + 1,
          range_end: displayEntries.length + currentDuplicates.length + 1,
          duplicate: false,
          hidden: false,
        });
      }
      currentDuplicates.forEach((d) => displayEntries.push(d));
      currentDuplicates = [];
    }

    entries.forEach((entry, idx) => {
      const dentry: DisplayEntry = {
        unique_id: -1,
        type: DisplayEntryType.ACTUAL_ENTRY,
        entry: entry,
        duplicate: entry.isDuplicateOf(
          entries.slice(Math.max(0, idx - deduplicationContext), idx)
        ),
        hidden: false,
      };

      if (dentry.duplicate) {
        currentDuplicates.push(dentry);
      } else {
        flushDuplicates();
        displayEntries.push(dentry);
      }
    });

    flushDuplicates();

    displayEntries.forEach((dentry, idx) => (dentry.unique_id = idx));

    setDisplayEntries(displayEntries);
  }, [entries]);

  const [messageFilter, setMessageFilter] = useState<MessageFilter>(
    new MessageFilter()
  );

  const filteredEntries = useMemo(
    () =>
      displayEntries.filter((entry) => {
        if (entry.type !== DisplayEntryType.ACTUAL_ENTRY) {
          return true;
        }
        return (
          !entry.hidden && entry.entry!.fitsFilter(sourceFilter, messageFilter)
        );
      }),
    [displayEntries, sourceFilter, messageFilter]
  );

  const pages = Math.ceil(filteredEntries.length / rowsPerPage);

  page = Math.min(page, pages);

  const pagedEntries = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredEntries.slice(start, end);
  }, [page, filteredEntries]);

  const hideDuplicates = useCallback(
    (dentry: DisplayEntry) => {
      const newDisplayEntries = [...displayEntries];
      newDisplayEntries[dentry.own_position!] = {
        ...newDisplayEntries[dentry.own_position!],
        type: DisplayEntryType.SHOW_DUPLICATES,
      };
      for (let i = dentry.range_start!; i < dentry.range_end!; ++i) {
        newDisplayEntries[i] = { ...newDisplayEntries[i], hidden: true };
      }
      setDisplayEntries(newDisplayEntries);
    },
    [displayEntries]
  );

  const showDuplicates = useCallback(
    (dentry: DisplayEntry) => {
      const newDisplayEntries = [...displayEntries];
      newDisplayEntries[dentry.own_position!] = {
        ...newDisplayEntries[dentry.own_position!],
        type: DisplayEntryType.HIDE_DUPLICATES,
      };
      for (let i = dentry.range_start!; i < dentry.range_end!; ++i) {
        newDisplayEntries[i] = { ...newDisplayEntries[i], hidden: false };
      }
      setDisplayEntries(newDisplayEntries);
    },
    [displayEntries]
  );

  const renderCell = useCallback(
    (dentry: DisplayEntry, columnKey: Key) => {
      switch (dentry.type) {
        case DisplayEntryType.ACTUAL_ENTRY:
          const entry = dentry.entry!;
          const cellValue = getKeyValue(entry, columnKey);

          switch (columnKey) {
            case ColumnKeys.URGENCY:
              return <UrgencyIndicator urgency={entry.urgency} />;
            default:
              const basic = (
                <div
                  className={clsx(fontMono.className, {
                    "text-default-400": dentry.duplicate,
                  })}
                >
                  {cellValue}
                </div>
              );

              if (dentry.duplicate) {
                return (
                  <Tooltip content="Recently duplicated entry">{basic}</Tooltip>
                );
              }

              return basic;
          }

        case DisplayEntryType.SHOW_DUPLICATES:
          switch (columnKey) {
            case ColumnKeys.MESSAGE:
              return (
                <div>
                  <Divider />
                  <div className="flex flex-row gap-2 justify-center items-center">
                    <span className="text-default-400">
                      {dentry.range_end! - dentry.range_start! + 1} duplicated
                      entries
                    </span>
                    <Button onPress={() => showDuplicates(dentry)} size="sm">
                      Show
                    </Button>
                  </div>
                  <Divider />
                </div>
              );
            default:
              return <div></div>;
          }

        case DisplayEntryType.HIDE_DUPLICATES:
          switch (columnKey) {
            case ColumnKeys.MESSAGE:
              return (
                <div>
                  <Divider />
                  <div className="flex flex-row gap-2 justify-center items-center">
                    <span className="text-default-400">
                      {dentry.range_end! - dentry.range_start! + 1} duplicated
                      entries
                    </span>
                    <Button onPress={() => hideDuplicates(dentry)} size="sm">
                      Hide
                    </Button>
                  </div>
                  <Divider />
                </div>
              );
            default:
              return <div></div>;
          }
      }
    },
    [hideDuplicates, showDuplicates]
  );

  return (
    <Table
      aria-label="Content of the log file"
      classNames={{ wrapper: "min-h-full" }}
      topContent={
        <Input
          isClearable
          classNames={{
            base: "w-full sm:max-w-[44%]",
            inputWrapper: "border-1",
          }}
          placeholder="Search through log..."
          size="sm"
          startContent={<SearchIcon className="text-default-300" />}
          value={messageFilter.search}
          variant="bordered"
          onClear={() => setMessageFilter(new MessageFilter())}
          onValueChange={(search) =>
            setMessageFilter(new MessageFilter(search))
          }
        />
      }
      bottomContent={
        <div className="flex w-full justify-center">
          <Pagination
            isCompact
            showControls
            showShadow
            color="secondary"
            page={page}
            total={pages}
            onChange={(page) => setPage(page)}
          />
        </div>
      }
    >
      <TableHeader columns={columns}>
        {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
      </TableHeader>
      <TableBody items={pagedEntries}>
        {(item) => (
          <TableRow key={item.unique_id}>
            {(columnKey) => (
              <TableCell>{renderCell(item, columnKey)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
