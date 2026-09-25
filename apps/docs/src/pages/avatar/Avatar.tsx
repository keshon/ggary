import { Avatar, Cluster, Text } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { SIZES, brokenPicture, portrait } from '../../data/display'

export default function AvatarPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="name">
            <Avatar name="Ada Lovelace" />
          </Specimen>
          <Specimen label="src">
            <Avatar name="Ada Lovelace" src={portrait} />
          </Specimen>
        </>
      }
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`}>
          <Avatar name="Grace Hopper" size={size} />
          <Avatar name="Grace Hopper" src={portrait} size={size} />
        </Specimen>
      ))}
      states={
        <Specimen label="src · failed to load">
          <Avatar name="Alan Turing" src={brokenPicture} />
        </Specimen>
      }
      composition={
        <Specimen label="decorative, beside the name">
          <Cluster gap="tight">
            <Avatar name="Barbara Liskov" size="sm" decorative />
            <Text>Barbara Liskov</Text>
          </Cluster>
        </Specimen>
      }
    />
  )
}
