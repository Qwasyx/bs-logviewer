"use client";

import { Chip, ChipProps } from "@nextui-org/react";

const urgencyColorMap: Record<string, ChipProps["color"]> = {
  notice: "default",
  debug: "primary",
  info: "success",
  warning: "warning",
  error: "danger",
  critical: "danger",
};

export interface UrgencyIndicatorProps {
  urgency: string;
}

export const UrgencyIndicator: React.FC<UrgencyIndicatorProps> = ({
  urgency,
}) => {
  return (
    <Chip
      className="capitalize"
      color={urgencyColorMap[urgency.toLocaleLowerCase()]}
      size="sm"
      variant="flat"
    >
      {urgency.toLocaleLowerCase()}
    </Chip>
  );
};
