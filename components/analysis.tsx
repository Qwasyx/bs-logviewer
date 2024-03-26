"use client";

import { LogEntry } from "@/components/datatypes";
import { FC, useEffect, useMemo } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import { useAsyncList } from "@react-stately/data";
import { compareVersions } from "compare-versions";

export interface AnalysisProps {
  entries: LogEntry[];
}

interface GeneralInfo {
  platform?: string;
  user?: string;
  gameVersion?: string;
}

interface ModInfo {
  modName: string;
  modInternalName: string;
  modVersion: string;
  gameVersion?: string;
}

export const Analysis: FC<AnalysisProps> = ({ entries }) => {
  const [general, mods] = useMemo(() => {
    const general: GeneralInfo = {};
    const mods: ModInfo[] = [];

    const modGameVersions: Map<string, string> = new Map();

    for (const entry of entries) {
      if (entry.source === "IPA/Loader") {
        const mod = entry.message.match(
          /Mod (.*?) developed for game version (.*?), so it may not work properly\./
        );
        if (mod) {
          modGameVersions.set(mod[1], mod[2]);
        }
      } else if (entry.source === "IPA") {
        const mod = entry.message.match(/(.*?) \((.*?)\): (.*)/);
        if (mod) {
          mods.push({
            modName: mod[1],
            modInternalName: mod[2],
            modVersion: mod[3],
            gameVersion: modGameVersions.get(mod[1]),
          });
        }
        const gameVersion = entry.message.match(/Game version (.*)/);
        if (gameVersion) {
          general.gameVersion = gameVersion[1];
        }
      } else if (entry.source === "BS_Utils") {
        const userInfo = entry.message.match(
          /UserInfo found: (.*?): (.*?) on (Steam|Oculus)/
        );
        if (userInfo) {
          general.platform = userInfo[3];
          general.user = `${userInfo[2]} (${userInfo[1]})`;
        }

        const invalidUserInfo = entry.message.match(
          /Error retrieving UserInfo: UserInfo is null/
        );
        if (invalidUserInfo) {
          general.user = "No UserInfo found!";
        }
      }
    }

    mods.sort((a, b) => a.modName.localeCompare(b.modName));

    return [general, mods];
  }, [entries]);

  const modList = useAsyncList({
    async load({ signal }) {
      return {
        items: mods,
      };
    },
    async sort({ items, sortDescriptor }) {
      return {
        items: items.sort((a, b) => {
          const baseCmp = a.modName.localeCompare(b.modName);
          let finalCmp = baseCmp;

          if (sortDescriptor.column === "gameVersion") {
            // only sort differing game versions, otherwise sort by mod name
            if (a.gameVersion !== b.gameVersion) {
              if (!a.gameVersion) {
                finalCmp = 1;
              } else if (!b.gameVersion) {
                finalCmp = -1;
              } else {
                // deal with Beat Games non SemVar versions… (1.29.1_4575554838 really should not be a version number)
                finalCmp = compareVersions(
                  a.gameVersion.replace("_", "+"),
                  b.gameVersion.replace("_", "+")
                );
              }
            }
          }
          if (sortDescriptor.direction === "descending") {
            finalCmp *= -1;
          }
          return finalCmp;
        }),
      };
    },
    initialSortDescriptor: {
      column: "modName",
      direction: "ascending",
    },
    getKey: (item: ModInfo) => item.modInternalName,
  });

  // update mod list whenever the mods are changed (cannot have dependency on modList or it would lead to infinite rerendering)
  useEffect(() => {
    modList.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mods]);

  return (
    <section className="flex flex-col items-start justify-center gap-6">
      <Card className="min-w-full">
        <CardHeader className="justify-center">
          <span className="text-large">General</span>
        </CardHeader>
        <Divider />
        <CardBody className="justify-center">
          <div className="grid grid-cols-2 min-w-full">
            {general.user && [
              <div key="key">Player</div>,
              <div key="value">{general.user}</div>,
            ]}
            {general.platform && [
              <div key="key">Platform</div>,
              <div key="value">{general.platform}</div>,
            ]}
            {general.gameVersion && [
              <div key="key">Game Version</div>,
              <div key="value">{general.gameVersion}</div>,
            ]}
          </div>
        </CardBody>
      </Card>
      <Card className="min-w-full">
        <CardHeader className="justify-center">
          <span className="text-large">Mods</span>
        </CardHeader>
        <Divider />
        <CardBody>
          <Table
            sortDescriptor={modList.sortDescriptor}
            onSortChange={modList.sort}
          >
            <TableHeader>
              <TableColumn key="modName" allowsSorting>
                MOD
              </TableColumn>
              <TableColumn key="modVersion">VERSION</TableColumn>
              <TableColumn key="gameVersion" allowsSorting>
                GAME VERSION
              </TableColumn>
            </TableHeader>
            <TableBody items={modList.items}>
              {(mod) => (
                <TableRow key={mod.modInternalName}>
                  <TableCell>{mod.modName}</TableCell>
                  <TableCell>{mod.modVersion}</TableCell>
                  <TableCell>{mod.gameVersion || "latest"}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </section>
  );
};
