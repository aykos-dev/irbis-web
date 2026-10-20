"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/components/ui/button";

type MoveButtonsProps = {
  /** Row name for the accessible labels ("Move up: Basics"). */
  name: string;
  /** testID prefix: `<prefix>.up` / `<prefix>.down`. */
  testIdPrefix: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  disabled: boolean;
  onMove: (step: -1 | 1) => void;
};

/** Keyboard-operable up/down pair; the caller sends the new full id list. */
export function MoveButtons({ name, testIdPrefix, canMoveUp, canMoveDown, disabled, onMove }: MoveButtonsProps) {
  const t = useTranslations("lessonsAdmin.actions");

  return (
    <div className="flex gap-1.5">
      <Button
        variant="white"
        className="min-h-touch px-3"
        aria-label={`${t("moveUp")}: ${name}`}
        disabled={disabled || !canMoveUp}
        onClick={() => onMove(-1)}
        data-testid={`${testIdPrefix}.up`}
      >
        <ArrowUp aria-hidden="true" className="size-4" strokeWidth={3} />
      </Button>
      <Button
        variant="white"
        className="min-h-touch px-3"
        aria-label={`${t("moveDown")}: ${name}`}
        disabled={disabled || !canMoveDown}
        onClick={() => onMove(1)}
        data-testid={`${testIdPrefix}.down`}
      >
        <ArrowDown aria-hidden="true" className="size-4" strokeWidth={3} />
      </Button>
    </div>
  );
}
