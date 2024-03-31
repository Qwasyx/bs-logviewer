"use client";

import { LogEntry, MessageFilter, SourceFilter } from "@/components/datatypes";
import { FC, useCallback, useMemo } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  CheckboxGroup,
} from "@nextui-org/react";
import { UrgencyIndicator } from "./urgency-indicator";

export const urgencyOrderMap: Record<string, number> = {
  notice: 0,
  debug: 1,
  info: 2,
  warning: 3,
  error: 4,
  critical: 5,
};

export interface SourceFilterProps {
  filter: SourceFilter;
  onFilterUpdate: (filter: SourceFilter) => void;
}

export const SourceFilterComponent: FC<SourceFilterProps> = ({
  filter,
  onFilterUpdate,
}) => {
  let sortedUrgencies = useMemo<string[]>(() => {
    let res = new Set<string>();
    for (let innerMap of filter.enabled.values()) {
      for (let urgency of innerMap.keys()) {
        res.add(urgency);
      }
    }
    return Array.from(res.values()).toSorted(
      (a, b) =>
        urgencyOrderMap[a.toLocaleLowerCase()] -
        urgencyOrderMap[b.toLocaleLowerCase()]
    );
  }, [filter]);

  let isConsistent = useCallback((innerMap: Map<string, boolean>) => {
    let val: boolean | undefined;

    for (let x of innerMap.values()) {
      val = val ?? x;
      if (val !== x) {
        return false;
      }
    }
    return true;
  }, []);

  let getOverallValue = useCallback((innerMap: Map<string, boolean>) => {
    for (let x of innerMap.values()) {
      if (x === false) {
        return false;
      }
    }
    return true;
  }, []);

  let isGlobalConsistent = useCallback(
    (urgency?: string) => {
      let val: boolean | undefined;
      for (let innerMap of filter.enabled.values()) {
        if (urgency) {
          let x = innerMap.get(urgency);
          val = val ?? x;
          if (x !== undefined && val !== x) {
            return false;
          }
        } else {
          for (let x of innerMap.values()) {
            val = val ?? x;
            if (val !== x) {
              return false;
            }
          }
        }
      }
      return true;
    },
    [filter]
  );

  let getGlobalOverallValue = useCallback(
    (urgency?: string) => {
      for (let innerMap of filter.enabled.values()) {
        if (urgency) {
          let x = innerMap.get(urgency);
          if (x === false) {
            return false;
          }
        } else {
          for (let x of innerMap.values()) {
            if (x === false) {
              return false;
            }
          }
        }
      }
      return true;
    },
    [filter]
  );

  return (
    <section className="flex flex-col justify-center gap-6">
      <div>
        <Card>
          <CardHeader>
            <Checkbox
              isIndeterminate={!isGlobalConsistent()}
              isSelected={getGlobalOverallValue()}
              onValueChange={(new_value) => {
                let new_filter = filter.clone();
                for (let innerMap of new_filter.enabled.values()) {
                  for (let urgency of innerMap.keys()) {
                    innerMap.set(urgency, new_value);
                  }
                }
                onFilterUpdate(new_filter);
              }}
            />
            <span className="text-large">Global filters</span>
          </CardHeader>
          <CardBody>
            <CheckboxGroup
              orientation="horizontal"
              value={sortedUrgencies.filter((urgency) =>
                getGlobalOverallValue(urgency)
              )}
            >
              {sortedUrgencies.map((urgency) => (
                <Checkbox
                  value={urgency}
                  key={urgency}
                  isIndeterminate={!isGlobalConsistent(urgency)}
                  onValueChange={(new_value) => {
                    let new_filter = filter.clone();
                    for (let innerMap of new_filter.enabled.values()) {
                      if (innerMap.has(urgency)) {
                        innerMap.set(urgency, new_value);
                      }
                    }
                    onFilterUpdate(new_filter);
                  }}
                >
                  <UrgencyIndicator urgency={urgency} />
                </Checkbox>
              ))}
            </CheckboxGroup>
          </CardBody>
        </Card>
      </div>
      <div className="flex flex-row justify-stretch flex-wrap 3xl:flex-col 3xl:flex-nowrap gap-3">
        {Array.from(filter.enabled.entries())
          .toSorted(([a], [b]) => a.localeCompare(b))
          .map(([source, innerMap]) => (
            <Card
              key={source}
              className="basis-1/3 md:basis-1/4 xl:basis-1/5 grow"
            >
              <CardHeader>
                <Checkbox
                  isIndeterminate={!isConsistent(innerMap)}
                  isSelected={getOverallValue(innerMap)}
                  onValueChange={(new_value) => {
                    let new_filter = filter.clone();
                    Array.from(innerMap.keys()).forEach((urgency) =>
                      new_filter.update(source, urgency, new_value)
                    );
                    onFilterUpdate(new_filter);
                  }}
                />
                <span>{source}</span>
              </CardHeader>
              <CardBody>
                <CheckboxGroup
                  orientation="horizontal"
                  value={Array.from(innerMap.entries())
                    .filter(([_, enabled]) => enabled)
                    .map(([x]) => x)}
                  onValueChange={(enabled_urgencies) => {
                    let new_filter = filter.clone();
                    Array.from(innerMap.keys()).forEach((urgency) =>
                      new_filter.update(
                        source,
                        urgency,
                        enabled_urgencies.find((x) => urgency === x)
                          ? true
                          : false
                      )
                    );
                    onFilterUpdate(new_filter);
                  }}
                >
                  {Array.from(innerMap.entries())
                    .toSorted(
                      ([a], [b]) =>
                        urgencyOrderMap[a.toLocaleLowerCase()] -
                        urgencyOrderMap[b.toLocaleLowerCase()]
                    )
                    .map(([urgency, enabled]) => (
                      <Checkbox
                        value={urgency}
                        key={urgency}
                        isSelected={enabled}
                      >
                        <UrgencyIndicator urgency={urgency} />
                      </Checkbox>
                    ))}
                </CheckboxGroup>
              </CardBody>
            </Card>
          ))}
      </div>
    </section>
  );
};
