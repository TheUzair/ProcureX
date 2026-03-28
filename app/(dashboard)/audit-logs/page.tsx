"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import type { AuditLog, PaginatedResponse } from "@/types";

const actionColors: Record<string, string> = {
  CREATE: "bg-green-500/10 text-green-500",
  UPDATE: "bg-blue-500/10 text-blue-500",
  DELETE: "bg-red-500/10 text-red-500",
  STATUS_CHANGE: "bg-purple-500/10 text-purple-500",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, page_size: 20 };
      if (entityType !== "all") params.entity_type = entityType;
      const res = (await apiClient.getAuditLogs(params as Parameters<typeof apiClient.getAuditLogs>[0])) as PaginatedResponse<AuditLog>;
      setLogs(res.items);
      setTotalPages(res.total_pages);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, entityType]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="mt-1 text-muted-foreground">Track all changes across your system</p>
      </div>

      <div className="flex gap-4">
        <Select value={entityType} onValueChange={(v) => { setEntityType(v ?? "all"); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Entity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="purchase_order">Purchase Orders</SelectItem>
            <SelectItem value="vendor">Vendors</SelectItem>
            <SelectItem value="product">Products</SelectItem>
            <SelectItem value="user">Users</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-18 w-full rounded-xl" />)}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center text-muted-foreground">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
              </div>
              <p className="mt-4 text-base font-medium">No audit logs found</p>
              <p className="mt-1 text-sm">Activity will appear here as changes are made</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start justify-between rounded-xl border p-4 transition-colors duration-150 hover:bg-muted/30">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={actionColors[log.action] || ""}>
                        {log.action}
                      </Badge>
                      <span className="text-sm font-semibold capitalize">
                        {log.entity_type.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      by <span className="font-medium text-foreground">{log.username || "System"}</span> &middot; Entity ID: <span className="font-mono text-xs">{log.entity_id.slice(0, 8)}...</span>
                    </p>
                  </div>
                  <time className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </time>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
