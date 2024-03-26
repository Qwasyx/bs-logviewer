"use client";

import { LogSelector } from "@/components/log-selector";
import { LogView } from "@/components/log-view";
import { useState } from "react";

export default function Home() {
  const [logfile, setLogfile] = useState<string>("");
  const [hasLogfile, setHasLogfile] = useState<boolean>(false);

  function handleLogOpen(content: string) {
    setLogfile(content.trimEnd());
    setHasLogfile(true);
  }

  const content = hasLogfile ? (
    <LogView logfile={logfile} />
  ) : (
    <LogSelector onLogOpen={handleLogOpen} />
  );

  return (
    <section className="flex flex-col items-center justify-center">
      {content}
    </section>
  );
}
