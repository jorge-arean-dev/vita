import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, X, Save, Trash2 } from "lucide-react"
import { ReactNode } from "react"

interface AnalysisCardProps {
  id: string
  title: string
  isExpanded: boolean
  isNew?: boolean
  hasResults?: boolean
  isDeleting?: boolean
  isSaving?: boolean
  onToggleExpand: (id: string) => void
  onDiscard?: (id: string) => void
  onSave?: (id: string) => void
  onDelete?: (id: string) => void
  children: ReactNode
}

export function AnalysisCard({
  id,
  title,
  isExpanded,
  isNew = false,
  hasResults = false,
  isDeleting = false,
  isSaving = false,
  onToggleExpand,
  onDiscard,
  onSave,
  onDelete,
  children
}: AnalysisCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className={isExpanded ? "pb-3" : "py-0"}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            {/* Collapse/Expand Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpand(id)}
              className="h-8 w-8 p-0"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>

            {/* Analysis Title */}
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {/* New analysis buttons */}
            {isNew && (
              <>
                {/* Cancel button for new analyses without results */}
                {isExpanded && !hasResults && onDiscard && (
                  <Button 
                    onClick={() => onDiscard(id)} 
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                )}
                
                {/* Save/Discard buttons for new analyses with results */}
                {isExpanded && hasResults && onDiscard && onSave && (
                  <>
                    <Button 
                      onClick={() => onDiscard(id)} 
                      variant="outline"
                      size="sm"
                      disabled={isSaving}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Discard
                    </Button>
                    <Button 
                      onClick={() => onSave(id)}
                      size="sm"
                      disabled={isSaving}
                      className="gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Save className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save
                        </>
                      )}
                    </Button>
                  </>
                )}
              </>
            )}

            {/* Existing analysis buttons */}
            {!isNew && onDelete && (
              <>
                {!isExpanded ? (
                  // Collapsed view - only delete button
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(id)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    aria-label="Delete match analysis"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Trash2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                ) : (
                  // Expanded view - delete button
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(id)}
                    className="gap-2"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Trash2 className="h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Expanded Content */}
      {isExpanded && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  )
}