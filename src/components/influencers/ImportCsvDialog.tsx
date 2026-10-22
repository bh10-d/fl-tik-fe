import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Loader2,
} from 'lucide-react'
import { importService } from '@/services/import.service'
import { ImportPreviewResponse, ImportExecuteResponse } from '@/types'
import { ApiError } from '@/lib/api-client'
import { useApp } from '@/context/AppContext'

interface ImportCsvDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ImportCsvDialog({ open, onOpenChange, onSuccess }: ImportCsvDialogProps) {
  const { triggerRefresh } = useApp()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [isDownloadingErrors, setIsDownloadingErrors] = useState(false)
  const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(null)
  const [executeResult, setExecuteResult] = useState<ImportExecuteResponse | null>(null)
  const [error, setError] = useState<string>('')

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      setError('Please upload a valid .csv or .xlsx / .xls file from EchoTik')
      return
    }

    setError('')
    setSelectedFile(file)
    setPreviewData(null)
    setExecuteResult(null)
    setIsPreviewing(true)

    try {
      const preview = await importService.previewFile(file)
      setPreviewData(preview)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to parse import file')
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to preview import file')
      }
      setSelectedFile(null)
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleExecuteImport = async () => {
    if (!selectedFile) return

    setIsExecuting(true)
    setError('')

    try {
      const result = await importService.executeImport(selectedFile)
      setExecuteResult(result)
      triggerRefresh()
      if (onSuccess) onSuccess()
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message || 'Import execution failed')
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to execute import')
      }
    } finally {
      setIsExecuting(false)
    }
  }

  const handleDownloadErrors = async () => {
    if (!executeResult?.importId) return
    setIsDownloadingErrors(true)
    try {
      await importService.downloadErrorsCsv(executeResult.importId, `import_${executeResult.importId}_errors.csv`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to download error report')
    } finally {
      setIsDownloadingErrors(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setPreviewData(null)
    setExecuteResult(null)
    setError('')
    setIsPreviewing(false)
    setIsExecuting(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Import Creators from EchoTik (CSV / Excel)
          </DialogTitle>
          <DialogDescription>
            Upload EchoTik creator export files (.csv, .xlsx, .xls) to batch register and start monitoring US creators.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 text-xs">
          {error && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/15 p-2.5 text-destructive font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Execution Result State */}
          {executeResult && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-950 dark:text-emerald-200">
                <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">Import Execution Complete</h4>
                  <p className="text-xs text-muted-foreground">
                    Batch #{executeResult.importId.slice(0, 8)} processed successfully.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Total Rows</div>
                  <div className="text-lg font-bold font-mono">{executeResult.totalRows}</div>
                </div>
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <div className="text-xs text-emerald-700 dark:text-emerald-400">Inserted</div>
                  <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400">
                    {executeResult.insertedRows}
                  </div>
                </div>
                <div className="rounded-md border border-blue-500/30 bg-blue-500/5 p-3">
                  <div className="text-xs text-blue-700 dark:text-blue-400">Updated</div>
                  <div className="text-lg font-bold font-mono text-blue-700 dark:text-blue-400">
                    {executeResult.updatedRows}
                  </div>
                </div>
                <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
                  <div className="text-xs text-amber-700 dark:text-amber-400">Skipped/Failed</div>
                  <div className="text-lg font-bold font-mono text-amber-700 dark:text-amber-400">
                    {executeResult.skippedRows + executeResult.failedRows}
                  </div>
                </div>
              </div>

              {executeResult.failedRows > 0 && (
                <div className="flex items-center justify-between rounded-md border border-destructive/20 bg-destructive/10 p-3">
                  <span className="text-xs text-destructive font-medium">
                    {executeResult.failedRows} row(s) had errors and were not imported.
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 text-xs"
                    onClick={handleDownloadErrors}
                    disabled={isDownloadingErrors}
                  >
                    {isDownloadingErrors ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    Download Errors CSV
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Initial / File Selection State */}
          {!executeResult && !previewData && (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center hover:bg-muted/30 transition-colors">
              {isPreviewing ? (
                <div className="py-6 flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="font-medium text-xs">Parsing EchoTik spreadsheet and validating headers...</p>
                </div>
              ) : (
                <>
                  <UploadCloud className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="font-semibold text-foreground text-sm">
                    Select EchoTik Influencer Export
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Supports EchoTik US creator exports in <code className="font-mono">.csv</code>, <code className="font-mono">.xlsx</code>, or <code className="font-mono">.xls</code> format.
                  </p>
                  <div className="mt-4">
                    <label>
                      <input
                        type="file"
                        accept=".csv, .xlsx, .xls"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <Button type="button" size="sm" variant="default" asChild>
                        <span>Choose File</span>
                      </Button>
                    </label>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Preview State */}
          {!executeResult && previewData && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-muted/40 p-2.5 rounded-md">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  <span className="font-medium">{previewData.filename}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {previewData.totalRows} Total Rows
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-[10px]">
                    {previewData.validRowCount} Valid
                  </Badge>
                  {previewData.invalidRowCount > 0 && (
                    <Badge variant="destructive" className="text-[10px]">
                      {previewData.invalidRowCount} Invalid
                    </Badge>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setPreviewData(null)
                      setSelectedFile(null)
                    }}
                  >
                    Change File
                  </Button>
                </div>
              </div>

              {previewData.errors && previewData.errors.length > 0 && (
                <div className="rounded-md bg-destructive/10 p-2 text-destructive text-[11px] space-y-1">
                  {previewData.errors.map((err, idx) => (
                    <p key={idx}>• {err}</p>
                  ))}
                </div>
              )}

              <div className="border rounded-md overflow-hidden">
                <div className="bg-muted/20 px-3 py-1.5 font-medium text-[11px] text-muted-foreground flex justify-between">
                  <span>Previewing first {previewData.preview.length} rows</span>
                  <span>Header Row Index: {previewData.headerRowIndex + 1}</span>
                </div>
                <div className="max-h-56 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 text-[11px]">Row</TableHead>
                        <TableHead className="text-[11px]">Username</TableHead>
                        <TableHead className="text-[11px]">Display Name</TableHead>
                        <TableHead className="text-[11px]">Category</TableHead>
                        <TableHead className="text-[11px] text-right">Followers</TableHead>
                        <TableHead className="text-[11px] text-right">Sales</TableHead>
                        <TableHead className="text-[11px] text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.preview.map((row) => (
                        <TableRow key={row.rowNumber} className={row.isValid ? '' : 'bg-destructive/5'}>
                          <TableCell className="font-mono text-[11px] text-muted-foreground">
                            #{row.rowNumber}
                          </TableCell>
                          <TableCell className="font-mono font-medium text-[11px]">
                            @{row.username}
                          </TableCell>
                          <TableCell className="text-[11px] max-w-[130px] truncate">
                            {row.displayName || '—'}
                          </TableCell>
                          <TableCell className="text-[11px]">{row.category || '—'}</TableCell>
                          <TableCell className="text-right font-mono text-[11px]">
                            {row.followers != null ? row.followers.toLocaleString() : '—'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-[11px]">
                            {row.sales != null ? row.sales.toLocaleString() : '—'}
                          </TableCell>
                          <TableCell className="text-center">
                            {row.isValid ? (
                              <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                                Valid
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-[9px]" title={row.validationError}>
                                Error
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          {executeResult ? (
            <Button onClick={handleClose}>Done</Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isExecuting}>
                Cancel
              </Button>
              {previewData && (
                <Button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isExecuting || previewData.validRowCount === 0}
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    `Execute Import (${previewData.validRowCount} valid)`
                  )}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
