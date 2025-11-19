"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import type { SecurityEventLog } from "~/types/security-event-log";

function decisionStyles(decision: string) {
  switch (decision) {
    case "block":
      return "bg-red-500/15 text-red-500";
    case "challenge":
      return "bg-amber-400/20 text-amber-500";
    default:
      return "bg-emerald-400/20 text-emerald-500";
  }
}

export const securityEventColumns: ColumnDef<SecurityEventLog>[] = [
  {
    accessorKey: "ts_utc",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => {
            if (isSorted === false) {
              column.toggleSorting(false); // Sort ascending
            } else if (isSorted === "asc") {
              column.toggleSorting(true); // Sort descending
            } else {
              column.clearSorting(); // Clear sorting
            }
          }}
          className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-foreground/80"
        >
          Time (UTC)
          {isSorted === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = row.getValue<Date>("ts_utc");
      return <span className="whitespace-nowrap">{value instanceof Date ? value.toLocaleString() : ""}</span>;
    },
  },
  {
    accessorKey: "decision",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => {
            if (isSorted === false) {
              column.toggleSorting(false); // Sort ascending
            } else if (isSorted === "asc") {
              column.toggleSorting(true); // Sort descending
            } else {
              column.clearSorting(); // Clear sorting
            }
          }}
          className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-foreground/80"
        >
          Decision
          {isSorted === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const decision = row.getValue<string>("decision");
      return (
        <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", decisionStyles(decision))}>
          {decision}
        </span>
      );
    },
  },
  {
    accessorKey: "suspicion_score",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => {
            if (isSorted === false) {
              column.toggleSorting(false); // Sort ascending
            } else if (isSorted === "asc") {
              column.toggleSorting(true); // Sort descending
            } else {
              column.clearSorting(); // Clear sorting
            }
          }}
          className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-foreground/80"
        >
          Score
          {isSorted === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => (
      <span className="font-mono text-sm text-foreground">
        {row.getValue<number>("suspicion_score")}
      </span>
    ),
  },
  {
    accessorKey: "query_template",
    header: "Query",
    cell: ({ row }) => {
      const query = row.getValue<string | null>("query_template");
      return <span className="block max-w-xl truncate text-sm text-foreground/80">{query ?? ""}</span>;
    },
  },
];
