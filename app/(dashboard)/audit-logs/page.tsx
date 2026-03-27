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
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">Track all changes across your system</p>
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
              {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No audit logs found.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={actionColors[log.action] || ""}>
                        {log.action}
                      </Badge>
                      <span className="text-sm font-medium capitalize">
                        {log.entity_type.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      by {log.username || "System"} &middot; Entity ID: {log.entity_id.slice(0, 8)}...
                    </p>
                  </div>
                  <time className="text-xs text-muted-foreground">
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
