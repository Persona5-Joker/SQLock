"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import type { SecurityEventLog } from "~/types/security-event-log";

function formatDecision(decision: string) {
  switch (decision) {
    case "block":
      return "text-red-600";
    case "challenge":
      return "text-yellow-600";
    default:
      return "text-green-600";
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
          className="flex items-center gap-1"
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
          className="flex items-center gap-1"
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
      return <span className={cn("font-medium", formatDecision(decision))}>{decision}</span>;
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
          className="flex items-center gap-1"
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
    cell: ({ row }) => <span>{row.getValue<number>("suspicion_score")}</span>,
  },
  {
    accessorKey: "query_template",
    header: "Query",
    cell: ({ row }) => {
      const query = row.getValue<string | null>("query_template");
      return <span className="block max-w-xl truncate">{query ?? ""}</span>;
    },
  },
];
