import { AvatarGroup } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { SIZES, people, peopleWithPictures } from '../../data/display'

export default function AvatarGroupPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="max={3}">
            <AvatarGroup label="Reviewers" people={people} max={3} />
          </Specimen>
          <Specimen label="no max">
            <AvatarGroup label="Reviewers" people={people} />
          </Specimen>
        </>
      }
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`}>
          <AvatarGroup label="Reviewers" people={people} max={3} size={size} />
        </Specimen>
      ))}
      composition={
        <Specimen label="people with and without src">
          <AvatarGroup label="Reviewers" people={peopleWithPictures} max={4} />
        </Specimen>
      }
    />
  )
}
