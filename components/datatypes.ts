import { ChipProps } from "@nextui-org/react";

export class SourceFilter {
  enabled: Map<string, Map<string, boolean>>;

  constructor() {
    this.enabled = new Map();
  }

  is_enabled(source: string, urgency: string): boolean {
    return this.enabled.get(source)?.get(urgency) ?? false;
  }

  ensure_exists(source: string, urgency: string) {
    const inner_map = this.enabled.get(source) ?? new Map();
    inner_map.set(urgency, inner_map.get(urgency) ?? true);
    this.enabled.set(source, inner_map);
  }

  update(source: string, urgency: string, value: boolean) {
    this.ensure_exists(source, urgency);
    this.enabled.get(source)!.set(urgency, value);
  }

  clone(): SourceFilter {
    const newFilter = new SourceFilter();
    this.enabled.forEach((value, key) => {
      const newInnerMap = new Map();
      value.forEach((innerValue, innerKey) => {
        newInnerMap.set(innerKey, innerValue);
      });
      newFilter.enabled.set(key, newInnerMap);
    });
    return newFilter;
  }
}

export class MessageFilter {
  search: string;
  substring: string;

  constructor(search = "") {
    this.search = search;
    this.substring = search.toLocaleLowerCase();
  }
}

export class LogEntry {
  line_number: number;
  source: string;
  urgency: string;
  time: string;
  message: string;

  cached_lower_message: string;
  is_duplicate: any;

  constructor(line_number: number, line: string) {
    this.line_number = line_number;
    const parts = line.match(/\[(.*?) @ (.*?) \| (.*?)\] (.*)/);
    if (parts) {
      this.urgency = parts[1];
      this.source = parts[3];
      this.time = parts[2];
      this.message = parts[4];
    } else {
      // Handle lines that do not match the expected format
      this.urgency = "UNKNOWN";
      this.source = "UNKNOWN";
      this.time = "UNKNOWN";
      this.message = line;
    }

    this.cached_lower_message = this.message.toLocaleLowerCase();
  }

  fitsFilter(
    sourceFilter: SourceFilter,
    messageFilter: MessageFilter
  ): boolean {
    return (
      sourceFilter.is_enabled(this.source, this.urgency) &&
      this.cached_lower_message.includes(messageFilter.substring)
    );
  }

  getDeduplicationKey(): string {
    return `${this.urgency}#${this.source}#${this.message}`;
  }
}
