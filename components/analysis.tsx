"use client";

import { LogEntry } from "@/components/datatypes";
import { FC, useMemo } from "react";
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
        const userInfoSteam = entry.message.match(
          /UserInfo found: (.*?): (.*?) on Steam/
        );
        if (userInfoSteam) {
          general.platform = "Steam";
          general.user = `${userInfoSteam[2]} (${userInfoSteam[1]})`;
        }
      }
    }

    mods.sort((a, b) => a.modName.localeCompare(b.modName));

    return [general, mods];
  }, [entries]);

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
          <Table>
            <TableHeader>
              <TableColumn>MOD</TableColumn>
              <TableColumn>VERSION</TableColumn>
              <TableColumn>GAME VERSION</TableColumn>
            </TableHeader>
            <TableBody items={mods}>
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
