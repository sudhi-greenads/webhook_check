import { useParams } from "react-router-dom"
import { getDocPage, ALL_DOC_PAGES } from "../lib/docsData"
import { DocsLayout } from "../components/docs/DocsLayout"

import { OverviewDoc } from "./docs/OverviewDoc"
import { QuickstartDoc } from "./docs/QuickstartDoc"
import { GeneratingKeysDoc } from "./docs/GeneratingKeysDoc"
import { KeyValidityDoc } from "./docs/KeyValidityDoc"
import { TokenGenerationDoc } from "./docs/TokenGenerationDoc"
import { NodeJsGuideDoc } from "./docs/NodeJsGuideDoc"
import { PythonGuideDoc } from "./docs/PythonGuideDoc"
import { HttpReferenceDoc } from "./docs/HttpReferenceDoc"
import { TroubleshootingDoc } from "./docs/TroubleshootingDoc"

export default function Docs() {
  const { docId } = useParams<{ docId?: string }>()
  
  const currentDocId = docId || "overview"
  const currentDoc = getDocPage("webhook-service", "v1.0", currentDocId) || ALL_DOC_PAGES[0]

  const renderDocContent = () => {
    switch (currentDoc.componentKey || currentDoc.id) {
      case "overview":
        return <OverviewDoc />
      case "quickstart":
        return <QuickstartDoc />
      case "generating-keys":
        return <GeneratingKeysDoc />
      case "key-validity":
        return <KeyValidityDoc />
      case "token-generation":
        return <TokenGenerationDoc />
      case "nodejs-guide":
        return <NodeJsGuideDoc />
      case "python-guide":
        return <PythonGuideDoc />
      case "http-reference":
        return <HttpReferenceDoc />
      case "troubleshooting":
        return <TroubleshootingDoc />
      default:
        return <OverviewDoc />
    }
  }

  return (
    <DocsLayout currentDoc={currentDoc}>
      {renderDocContent()}
    </DocsLayout>
  )
}
