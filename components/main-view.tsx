"use client";

import {
  Input,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  getKeyValue,
} from "@nextui-org/react";
import { LogEntry, MessageFilter, SourceFilter } from "./datatypes";
import { Key, useCallback, useMemo, useState } from "react";
import { fontMono } from "@/config/fonts";
import { UrgencyIndicator } from "./urgency-indicator";
import { SearchIcon } from "./icons";

const columns = [
  {
    key: "line_number",
    label: "LINE",
  },
  {
    key: "time",
    label: "TIME",
  },
  {
    key: "source",
    label: "SOURCE",
  },
  {
    key: "urgency",
    label: "URGENCY",
  },
  {
    key: "message",
    label: "MESSAGE",
  },
];

export interface MainViewProps {
  entries: LogEntry[];
  sourceFilter: SourceFilter;
}

export const MainView: React.FC<MainViewProps> = ({
  entries,
  sourceFilter,
}) => {
  let [page, setPage] = useState<number>(1);
  const rowsPerPage = 200;

  const [messageFilter, setMessageFilter] = useState<MessageFilter>(
    new MessageFilter()
  );

  const filteredEntries = useMemo(
    () =>
      entries.filter((entry) => entry.fitsFilter(sourceFilter, messageFilter)),
    [entries, sourceFilter, messageFilter]
  );

  const pages = Math.ceil(filteredEntries.length / rowsPerPage);

  page = Math.min(page, pages);

  const pagedEntries = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredEntries.slice(start, end);
  }, [page, filteredEntries]);

  const renderCell = useCallback((entry: LogEntry, columnKey: Key) => {
    const cellValue = getKeyValue(entry, columnKey);
    switch (columnKey) {
      case "urgency":
        return <UrgencyIndicator urgency={entry.urgency} />;
      default:
        return <div className={fontMono.className}>{cellValue}</div>;
    }
  }, []);

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
          <TableRow key={item.line_number}>
            {(columnKey) => (
              <TableCell>{renderCell(item, columnKey)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
