import Image from "next/image"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface UserAvatarProps {
  name: string
  imageUrl?: string | null
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function UserAvatar({ name, imageUrl }: UserAvatarProps) {
  return (
    <Avatar className="size-10 rounded-2xl border border-border bg-muted">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`${name} avatar`}
          width={40}
          height={40}
          className="size-10 rounded-2xl object-cover"
        />
      ) : null}
      <AvatarFallback className="rounded-2xl bg-secondary text-xs font-semibold text-secondary-foreground">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
