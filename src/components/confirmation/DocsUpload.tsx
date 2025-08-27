type DocsUploadProps = {
  onUpload?: () => void
}

export default function DocsUpload({ onUpload }: DocsUploadProps) {
  return (
    <div
      className="p-4 border rounded bg-gray-50 cursor-pointer"
      onClick={onUpload}
    >
      [Click to Upload Docs]
    </div>
  )
}
