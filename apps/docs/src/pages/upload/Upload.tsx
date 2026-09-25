import { Upload } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { Staged } from '../../react/Staged'
import { avatarPicture, demoUpload, stagedRowFiles, stagedTileFiles, stagedUpload } from '../../data/upload'

const rows = { accept: '.pdf,.docx,image/*', maxSize: 20_000_000, label: 'Drop files here or browse', hint: 'PDF, DOCX or images · up to 20 MB each', locale: 'en-GB' }
const tiles = { view: 'tiles' as const, accept: 'image/*', maxSize: 5_000_000, label: 'Add photo', hint: 'JPG, PNG or WebP · up to 5 MB', locale: 'en-GB' }

export default function UploadPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label={`view="rows"`} wide>
            <Upload upload={demoUpload} {...rows} />
          </Specimen>
          <Specimen label={`view="tiles"`} wide>
            <Upload upload={demoUpload} {...tiles} />
          </Specimen>
        </>
      }
      states={
        <>
          <Specimen label="uploading · done · failed · too large · unknown progress · wrong type · waiting" wide>
            <Staged files={stagedRowFiles}>
              <Upload upload={stagedUpload} concurrency={2} {...rows} />
            </Staged>
          </Specimen>
          <Specimen label={`view="tiles": uploading · done · failed · wrong type`} wide>
            <Staged files={stagedTileFiles}>
              <Upload upload={stagedUpload} {...tiles} />
            </Staged>
          </Specimen>
          <Specimen label="disabled" wide>
            <Upload disabled {...rows} />
          </Specimen>
        </>
      }
      composition={
        <>
          <Specimen label="maxFiles={1}, defaultFiles" wide>
            <Upload upload={demoUpload} {...tiles} maxFiles={1} label="Avatar" hint="One picture; a new one replaces it" defaultFiles={[{ name: 'avatar.png', url: avatarPicture }]} />
          </Specimen>
          <Specimen label="defaultFiles, name" wide>
            <Upload upload={demoUpload} {...rows} name="documents" defaultFiles={[{ name: 'brief-v1.pdf', size: 1_240_000, value: 'k-brief' }]} />
          </Specimen>
        </>
      }
    />
  )
}
