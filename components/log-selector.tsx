"use client";

import { ChangeEvent, DragEvent, useRef } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
} from "@nextui-org/react";
import { ungzip } from "pako";

export interface LogSelectorProps {
  onLogOpen: (content: string) => void;
}

export const LogSelector: React.FC<LogSelectorProps> = ({ onLogOpen }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  function processFile(file: File) {
    const reader = new FileReader();
    if (file.name.endsWith(".log.gz")) {
      reader.onload = (e) => {
        const data = e.target?.result as ArrayBuffer;
        if (data) {
          const result = ungzip(data);
          const textDecoder = new TextDecoder();
          const text = textDecoder.decode(result);
          onLogOpen(text);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // assume raw text (aka .log)
      reader.onload = (e) => {
        const text = e.target?.result;
        if (text) onLogOpen(text.toString());
      };
      reader.readAsText(file);
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;

    processFile(file);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }

  function openFileExplorer() {
    inputRef.current!.value = "";
    inputRef.current!.click();
  }

  async function handleOpenFromURLPress() {
    // TODO add CORS proxy
    const url = urlRef.current!.value;
    console.log(url);
    const req = await fetch(url, {
      method: "GET",
      mode: "no-cors",
    });
    const text = await req.text();
    if (text) onLogOpen(text);
  }

  return (
    <Card
      className="w-[400px]"
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <CardHeader className="flex justify-center">
        <span className="text-2xl text-center mt-4">Open Logfile</span>
      </CardHeader>
      <Divider className="my-2" />
      <CardBody>
        <Button
          onPress={openFileExplorer}
          className="bg-default p-4 w-100 rounded-lg text-center flex flex-col items-center justify-center"
        >
          <form onSubmit={(e) => e.preventDefault()}>
            <input
              placeholder="fileInput"
              className="hidden"
              ref={inputRef}
              type="file"
              onChange={handleFileChange}
              accept=".log,.log.gz"
            />

            <p>
              Drag & Drop File or{" "}
              <span className="font-bold text-blue-600 cursor-pointer">
                <u>Select File</u>
              </span>{" "}
              to upload
            </p>
          </form>
        </Button>
      </CardBody>
      {/*<Divider className="my-4" />
      <CardBody className="flex flex-row items-center gap-2">
        <div className="flex-grow">
          <Input type="url" ref={urlRef} />
        </div>
        <div>
          <Button onPress={handleOpenFromURLPress}>Open from URL</Button></div>
      </CardBody>*/}
    </Card>
  );
};
