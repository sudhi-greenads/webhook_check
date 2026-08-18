import { Link } from "react-router-dom"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { type DocPage } from "../../lib/docsData"

type DocsPaginationProps = {
  prevDoc: DocPage | null
  nextDoc: DocPage | null
}

export function DocsPagination({ prevDoc, nextDoc }: DocsPaginationProps) {
  return (
    <div className="border-t border-border pt-6 flex items-center justify-between gap-4">
      {prevDoc ? (
        <Link
          to={`/docs/${prevDoc.id}`}
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted/40 transition-colors max-w-[48%]"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-muted-foreground/70 block uppercase">Previous</span>
            <span className="truncate block">{prevDoc.title}</span>
          </div>
        </Link>
      ) : <div />}

      {nextDoc ? (
        <Link
          to={`/docs/${nextDoc.id}`}
          className="flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 p-2 rounded-lg hover:bg-primary/10 transition-colors text-right max-w-[48%] ml-auto"
        >
          <div className="min-w-0">
            <span className="text-[10px] text-primary/70 block uppercase">Next</span>
            <span className="truncate block">{nextDoc.title}</span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 shrink-0" />
        </Link>
      ) : <div />}
    </div>
  )
}
